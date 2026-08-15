# Scaffold a new D365FO model + Visual Studio project in the Local-Sassine repo.
#
#   powershell -ExecutionPolicy Bypass -File scripts\setup-model.ps1 -ModelName Ex_TestLive
#
# This is SETUP, not authoring. Creating a model is the equivalent of "new model"
# in Visual Studio: a descriptor, the AOT folder skeleton, a .rnrproj, and the
# link that makes PackagesLocalDirectory see it. No MCP tool covers any of it,
# and it happens once per model - the AOT objects that follow are what actually
# flow through the cloud server.

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $ModelName,
  [string] $RepoRoot     = 'C:\Repo\Local-Sassine',
  [string] $PackagesPath = 'C:\AOSService\PackagesLocalDirectory',
  [string] $Description  = 'Live end-to-end demonstration model',
  # Layer 14 (USR) is where customer code belongs; Microsoft ships at 0.
  [int]    $Layer        = 14
)

$ErrorActionPreference = 'Stop'
function Say([string]$m) { Write-Host "==> $m" -ForegroundColor Cyan }

$metaRoot  = Join-Path $RepoRoot "Metadata\$ModelName"
$modelRoot = Join-Path $metaRoot $ModelName
$descDir   = Join-Path $metaRoot 'Descriptor'
$projDir   = Join-Path $RepoRoot "Projects\$ModelName\$ModelName"

if (Test-Path $metaRoot) { throw "$metaRoot already exists - refusing to overwrite a model." }

Say "Creating model tree under $metaRoot"
foreach ($d in @($descDir, $modelRoot, $projDir)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
# The AOT folders this demo writes into. Others are created on demand by the
# create tool, so this is a convenience, not a requirement.
foreach ($d in @('AxTable', 'AxForm', 'AxMenuItemDisplay', 'AxEnum', 'AxEdt', 'AxClass')) {
  New-Item -ItemType Directory -Force -Path (Join-Path $modelRoot $d) | Out-Null
}

# A model Id must not collide with an existing model. Derived from the name so
# re-running for the same name is stable, and kept in the custom-model range.
$hash = [Math]::Abs([BitConverter]::ToInt32([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($ModelName)), 0))
$modelId = 896000000 + ($hash % 900000)

Say "Writing descriptor (Id $modelId, layer $Layer)"
# ModuleReferences decide what this model can SEE. Without ApplicationPlatform /
# ApplicationFoundation the standard EDTs (Name, AmountMST, TransDate) do not
# resolve and every field bound to one fails to compile.
$refs = @('ApplicationCommon','ApplicationFoundation','ApplicationPlatform','ApplicationSuite','Currency','Directory','GeneralLedger','SourceDocumentation')
$refXml = ($refs | ForEach-Object { "`t`t<d2p1:string>$_</d2p1:string>" }) -join "`r`n"

$descriptor = @"
<?xml version="1.0" encoding="utf-8"?>
<AxModelInfo xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
	<AppliedUpdates xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays" />
	<Customization>Allow</Customization>
	<Description>$Description</Description>
	<DisplayName>$ModelName</DisplayName>
	<Id>$modelId</Id>
	<InternalsVisibleTo xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays" />
	<Layer>$Layer</Layer>
	<Locked>false</Locked>
	<ModelModule>$ModelName</ModelModule>
	<ModelReferences xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays" i:nil="true" />
	<ModuleReferences xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
$refXml
	</ModuleReferences>
	<Name>$ModelName</Name>
	<Publisher>Ex_Sassine</Publisher>
	<VersionBuild>0</VersionBuild>
	<VersionMajor>1</VersionMajor>
	<VersionMinor>0</VersionMinor>
	<VersionRevision>0</VersionRevision>
</AxModelInfo>
"@
# Metadata XML is UTF-8 WITH BOM; without it the compiler reports unicode
# substitution characters. (The MCP client config next door is the opposite.)
[IO.File]::WriteAllText((Join-Path $descDir "$ModelName.xml"), $descriptor, (New-Object Text.UTF8Encoding $true))

Say "Writing $ModelName.rnrproj"
$guid = [Guid]::NewGuid().ToString('B').ToUpper()
$proj = @"
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="14.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup>
    <Configuration Condition=" '`$(Configuration)' == '' ">Debug</Configuration>
    <Platform Condition=" '`$(Platform)' == '' ">AnyCPU</Platform>
    <BuildTasksDirectory Condition=" '`$(BuildTasksDirectory)' == ''">`$(MSBuildProgramFiles32)\MSBuild\Microsoft\Dynamics\AX</BuildTasksDirectory>
    <Model>$ModelName</Model>
    <TargetFrameworkVersion>v4.6</TargetFrameworkVersion>
    <OutputPath>bin</OutputPath>
    <SchemaVersion>2.0</SchemaVersion>
    <GenerateCrossReferences>True</GenerateCrossReferences>
    <RunAppCheckerRules>False</RunAppCheckerRules>
    <LogAppcheckerDiagsAsErrors>False</LogAppcheckerDiagsAsErrors>
    <DeployOnline>False</DeployOnline>
    <ProjectGuid>$guid</ProjectGuid>
    <Name>$ModelName</Name>
    <RootNamespace>$ModelName</RootNamespace>
  </PropertyGroup>
  <PropertyGroup Condition="'`$(Configuration)|`$(Platform)' == 'Debug|AnyCPU'">
    <Configuration>Debug</Configuration>
    <DBSyncInBuild>True</DBSyncInBuild>
  </PropertyGroup>
  <ItemGroup />
  <Import Project="`$(BuildTasksDirectory)\Microsoft.Dynamics.Framework.Tools.BuildTasks.targets" />
</Project>
"@
[IO.File]::WriteAllText((Join-Path $projDir "$ModelName.rnrproj"), $proj, (New-Object Text.UTF8Encoding $true))

Say "Linking into PackagesLocalDirectory"
$link = Join-Path $PackagesPath $ModelName
if (Test-Path $link) {
  Write-Host "  link already present"
} else {
  # A junction, not a symlink: mklink /D needs elevation or Developer Mode,
  # /J does not, and both are read identically by the AOS and the compiler.
  & cmd /c mklink /J "`"$link`"" "`"$metaRoot`"" | Out-Null
  if (-not (Test-Path $link)) { throw "failed to create junction $link" }
  Write-Host "  $link -> $metaRoot"
}

Write-Host ''
Say 'Model ready'
Write-Host "  metadata : $modelRoot"
Write-Host "  project  : $projDir\$ModelName.rnrproj"
Write-Host "  visible  : $link"
