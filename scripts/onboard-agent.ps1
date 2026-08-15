# Customer onboarding: point a D365FO developer VM at the hosted MCP server.
#
#   powershell -ExecutionPolicy Bypass -File scripts\onboard-agent.ps1 -ApiKey <key>
#
# This is the ONLY thing a customer runs. It is deliberately not install.ps1:
# that script provisions the whole standalone product (builds the C# bridge,
# extracts metadata, builds a multi-gigabyte index) which is exactly what we are
# selling access to instead of shipping. This script installs the thin half.
#
# What the customer's machine ends up with:
#   * a LOCAL MCP server in write-only mode - d365fo_file(create/modify),
#     build_d365fo_project, verify, undo, get_workspace_info. No database, no
#     index, no metadata extraction. See LOCAL_TOOLS in src/server/serverMode.ts.
#   * a CLOUD MCP server registration - search, get_object_info, get_knowledge,
#     and d365fo_file(action=generate). The index and the generation logic stay
#     on our side.
#
# The split is what makes the product defensible: the customer's machine holds
# no index and no rules, only a file writer and a compiler.

[CmdletBinding()]
param(
  # The customer's API key for the hosted server. One key per customer, so it
  # can be revoked without touching anyone else.
  [Parameter(Mandatory = $true)] [string] $ApiKey,

  [string] $CloudUrl = 'https://d365fo-mcp-282013198552.us-east5.run.app',

  # Path to the d365fo-mcp checkout or npm global install providing dist/index.js.
  # Defaulted in the body, not here: $PSScriptRoot is not populated while param()
  # defaults are being evaluated under Windows PowerShell 5.1.
  [string] $ServerDir,

  # Model new objects are written into. Detected from PackagesLocalDirectory
  # when omitted, but a wrong guess writes into the wrong model, so an explicit
  # value is strongly preferred during onboarding.
  [string] $ModelName,

  # Where to write the MCP client config. Defaulted in the body to the VS Code
  # user-level file, which applies to every workspace on the machine.
  [string] $ConfigPath
)

$ErrorActionPreference = 'Stop'

if (-not $ServerDir) { $ServerDir = Split-Path -Parent $PSScriptRoot }
if (-not $ConfigPath) { $ConfigPath = Join-Path $env:APPDATA 'Code\User\mcp.json' }

function Say([string]$m) { Write-Host "==> $m" -ForegroundColor Cyan }
function Warn([string]$m) { Write-Host "  ! $m" -ForegroundColor Yellow }

# ---------------------------------------------------------------- prerequisites
Say 'Checking prerequisites'

$node = (Get-Command node -ErrorAction SilentlyContinue)
if (-not $node) { throw 'Node.js not found. Install Node 24+ from https://nodejs.org and re-run.' }
$nodeMajor = [int](((& node --version) -replace '^v', '') -split '\.')[0]
# node:sqlite is used even in write-only mode (an in-memory stub index is still
# constructed), and it is core only from Node 24.
if ($nodeMajor -lt 24) { throw "Node $nodeMajor found; 24+ required." }
Write-Host "  node $(& node --version)"

$entry = Join-Path $ServerDir 'dist\index.js'
if (-not (Test-Path $entry)) {
  throw "No dist\index.js under $ServerDir. Run 'npm install && npm run build' there, or pass -ServerDir."
}
Write-Host "  agent $entry"

# ------------------------------------------------------------------ environment
Say 'Detecting D365FO environment'

# The volume holding AosService varies by VM image (K:, C:, J: ...), so scan
# rather than assume. Ordered so a non-system drive wins - the AOS volume is
# almost never C: on a Microsoft-provided image.
$pld = $null
foreach ($d in (Get-PSDrive -PSProvider FileSystem | Sort-Object { $_.Name -eq 'C' })) {
  $c = Join-Path $d.Root 'AosService\PackagesLocalDirectory'
  if (Test-Path $c) { $pld = $c; break }
}
if (-not $pld) {
  Warn 'PackagesLocalDirectory not found. This machine may be a UDE environment.'
  Warn 'Pass -ModelName and set D365FO_PACKAGE_PATH manually after onboarding.'
} else {
  Write-Host "  packages $pld"
}

if (-not $ModelName -and $pld) {
  # Custom models are identified by the AOT LAYER in their Descriptor XML, not by
  # their name. Microsoft ships everything at layer 0 (SYS); ISV code sits around
  # layer 8 (ISV) and customer code at 14 (USR). A name-prefix heuristic here
  # matched all ~168 Microsoft packages on a stock VM, which is worse than no
  # detection at all - it would have pinned the config to a Microsoft model.
  $candidates = @()
  foreach ($dir in (Get-ChildItem $pld -Directory -ErrorAction SilentlyContinue)) {
    $desc = Get-ChildItem (Join-Path $dir.FullName 'Descriptor') -Filter *.xml -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $desc) { continue }
    $m = [regex]::Match([IO.File]::ReadAllText($desc.FullName), '<Layer>(\d+)</Layer>')
    if ($m.Success -and [int]$m.Groups[1].Value -ne 0) {
      $candidates += [pscustomobject]@{ Name = $dir.Name; Layer = [int]$m.Groups[1].Value }
    }
  }
  if ($candidates.Count -eq 1) {
    $ModelName = $candidates[0].Name
    Write-Host "  model $ModelName (layer $($candidates[0].Layer), auto-detected)"
  } elseif ($candidates.Count -gt 1) {
    Warn ("{0} custom models found:" -f $candidates.Count)
    foreach ($c in ($candidates | Sort-Object Layer, Name)) { Warn ("    layer {0}  {1}" -f $c.Layer, $c.Name) }
    Warn 'Re-run with -ModelName to pick one. Writing config without a pinned model.'
  }
}

# ----------------------------------------------------------- cloud reachability
Say 'Checking the hosted server'

# No Google credentials of any kind. The service runs with
# run.googleapis.com/invoker-iam-disabled=true, so Cloud Run performs no IAM
# check and the customer needs nothing but their API key.
$code = & curl.exe -s -m 30 -o NUL -w '%{http_code}' "$CloudUrl/health"
if ($code -ne '200') {
  Warn "Health probe returned HTTP $code (expected 200)."
  # A 403 means Cloud Run rejected the caller before the app saw the request, so
  # it is never a wrong-key problem - it means public access got switched off.
  if ($code -eq '403') { Warn 'HTTP 403 = Cloud Run IAM refused the caller. Re-enable Security -> Allow public access.' }
} else {
  Write-Host "  cloud reachable ($CloudUrl)"
}

# ------------------------------------------------------------------ write config
Say "Writing MCP client config"

$localEnv = [ordered]@{ MCP_SERVER_MODE = 'write-only' }
if ($pld)       { $localEnv['D365FO_PACKAGE_PATH'] = $pld }
if ($ModelName) {
  $localEnv['D365FO_MODEL_NAME'] = $ModelName
  $localEnv['CUSTOM_MODELS']     = $ModelName
}

$cloudHeaders = [ordered]@{ 'X-Api-Key' = $ApiKey }

$cfg = [ordered]@{
  servers = [ordered]@{
    # Named so the two halves are obvious in the VS Code MCP panel. The model
    # picks tools by name, so "local"/"cloud" also nudges it correctly when both
    # expose d365fo_file (an ALWAYS_TOOL present in both modes).
    'd365fo-local' = [ordered]@{
      type    = 'stdio'
      command = 'node'
      args    = @($entry)
      env     = $localEnv
    }
    'd365fo-cloud' = [ordered]@{
      type    = 'http'
      url     = "$CloudUrl/mcp"
      headers = $cloudHeaders
    }
  }
}

$dir = Split-Path -Parent $ConfigPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
if (Test-Path $ConfigPath) {
  $backup = "$ConfigPath.bak-$((Get-Item $ConfigPath).LastWriteTime.ToString('yyyyMMddHHmmss'))"
  Copy-Item $ConfigPath $backup
  Warn "Existing config backed up to $backup"
}
# NOT Set-Content -Encoding utf8: under Windows PowerShell 5.1 that writes a
# UTF-8 BOM, and a BOM at the head of a JSON file makes strict parsers throw
# "Unexpected token" on the very first character. Ironically the D365FO metadata
# XML this product writes *requires* a BOM - the two formats disagree, so the
# encoding has to be chosen per file rather than set once and forgotten.
[IO.File]::WriteAllText($ConfigPath, ($cfg | ConvertTo-Json -Depth 8), (New-Object Text.UTF8Encoding $false))
Write-Host "  wrote $ConfigPath"

# ---------------------------------------------------------------------- summary
Write-Host ''
Say 'Done'
Write-Host "  local  write-only agent  -> $entry"
Write-Host "  cloud  read/generate     -> $CloudUrl/mcp"
if ($ModelName) { Write-Host "  model  $ModelName" }
Write-Host ''
Write-Host 'Restart VS Code, then confirm both servers appear in the MCP panel.'
Write-Host 'The local one must NOT list search/get_object_info, and the cloud one'
Write-Host 'must NOT list build_d365fo_project. If either does, the mode is wrong.'
