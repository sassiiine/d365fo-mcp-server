# End-to-end smoke test of the CLOUD half: MCP server on Cloud Run, symbol
# index in Neon Postgres. Nothing here touches a Windows VM or the local
# 2.8 GB SQLite file - if these pass, the cloud side is genuinely standalone.
#
#   pwsh scripts/test-cloudrun.ps1
#
# Two credentials are needed and neither is printed:
#   * a Google identity token, because org policy
#     (constraints/iam.allowedPolicyMemberDomains) forbids granting allUsers the
#     run.invoker role, so the service is not publicly reachable;
#   * the app's own API key from Secret Manager, which the X-Api-Key middleware
#     checks (src/middleware/apiKeyAuth.ts).

param(
  [string] $Project = 'dynamics-mcp',
  [string] $Region  = 'us-east5',
  [string] $Service = 'd365fo-mcp'
)

$ErrorActionPreference = 'Stop'
$gcloud = 'C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'

$url = & $gcloud run services describe $Service --region=$Region --project=$Project --format='value(status.url)'
$tok = (& $gcloud auth print-identity-token) -join ''
$key = (& $gcloud secrets versions access latest --secret=d365fo-mcp-api-key --project=$Project) -join ''
if (-not $tok.StartsWith('ey')) { throw "no identity token - run: gcloud auth login" }

$work = Join-Path $env:TEMP "d365fo-cloudtest"
New-Item -ItemType Directory -Force -Path $work | Out-Null

function Invoke-Mcp([string] $Body, [string] $Name) {
  $f = Join-Path $work "req.json"
  [IO.File]::WriteAllText($f, $Body)
  $sw = [Diagnostics.Stopwatch]::StartNew()
  # curl.exe, not Invoke-WebRequest: PS 5.1 tries to prompt for credentials on a
  # 401/403 and dies in non-interactive mode.
  $out = & curl.exe -s -m 120 -X POST "$url/mcp" `
    -H "Authorization: Bearer $tok" -H "X-Api-Key: $key" `
    -H "Content-Type: application/json" `
    -H "Accept: application/json, text/event-stream" `
    --data-binary "@$f"
  $sw.Stop()
  # Write-Host, not Write-Output: anything on the output stream inside a
  # function becomes part of the return value, so a progress line here would
  # make the caller's $result an array and silently break -match.
  Write-Host ("[{0,6} ms] {1}" -f $sw.ElapsedMilliseconds, $Name)
  return $out
}

Write-Output "service: $url"
Write-Output ""

# 1. Health. Unauthenticated at the app layer by design (Cloud Run's startup
#    probe has no API key), but still behind the Google IAM check.
$h = & curl.exe -s -m 60 -H "Authorization: Bearer $tok" "$url/health"
Write-Output "health:  $h"
Write-Output ""

# 2. The API key really is enforced - a call with no key must be refused.
#    The body goes via a file, not an inline argument: PowerShell 5.1 strips the
#    double quotes out of JSON when passing it to a native .exe, so curl sent
#    malformed JSON and express.json() answered 400 before apiKeyAuth ever ran.
#    That 400 looks like a passing test if you squint, which is worse than a
#    failing one.
$nk = Join-Path $work "nokey.json"
[IO.File]::WriteAllText($nk, '{"jsonrpc":"2.0","id":0,"method":"tools/list"}')
$noKey = & curl.exe -s -o NUL -w "%{http_code}" -m 60 -X POST "$url/mcp" `
  -H "Authorization: Bearer $tok" -H "Content-Type: application/json" `
  -H "Accept: application/json, text/event-stream" `
  --data-binary "@$nk"
Write-Output "no API key -> HTTP $noKey  (expect 401)"
Write-Output ""

# 3. Handshake. serverInfo.name should read "(read-only)" - proof the cloud
#    instance is not publishing the local-filesystem tools.
$init = Invoke-Mcp '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}' 'initialize'
if ($init -match '"name":"([^"]*)"') { Write-Output "         serverInfo: $($matches[1])" }

# 4. The index read. This can only succeed against Neon - the container has no
#    SQLite file (see the `indexIsRemote` branch in src/index.ts).
$s = Invoke-Mcp '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search","arguments":{"query":"CustTable","limit":5}}}' 'search CustTable'
if ($s -match 'Found (\d+) matches') { Write-Output "         $($matches[1]) matches from Neon" }
else { Write-Output "         NO MATCHES - index path is broken" }

# 5. The authoring path. Generating AOT XML needs no Windows; this is the whole
#    premise of hosting the logic and shipping a thin agent.
$g = Invoke-Mcp '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"d365fo_file","arguments":{"action":"generate","objectType":"enum","objectName":"Ex_V3_DeployProofStatus","modelName":"Ex_Test1","properties":{"label":"Deploy proof status","enumValues":[{"name":"Pending","label":"Pending"},{"name":"Proven","label":"Proven"}]}}}}' 'generate enum XML'
if ($g -match '<AxEnum') { Write-Output "         AxEnum XML authored in the cloud" }
else { Write-Output "         GENERATE FAILED" }

Remove-Item $work -Recurse -Force
