# Build and deploy the read-only cloud half of the MCP server to Cloud Run.
#
#   pwsh scripts/deploy-cloudrun.ps1              # build + deploy
#   pwsh scripts/deploy-cloudrun.ps1 -SkipBuild   # redeploy the current image
#
# The write half runs on the customer's Windows VM as a second MCP server
# started with MCP_SERVER_MODE=write-only; it needs no database and is not
# deployed by this script. See src/server/serverMode.ts for the tool partition.
#
# Prerequisites, all one-time and all requiring a human:
#   * `gcloud auth login` (service-account keys are blocked org-wide by
#     constraints/iam.disableServiceAccountKeyCreation, so there is no
#     non-interactive alternative).
#   * Secret `neon-database-url` holds the POOLED Neon string (host contains
#     `-pooler`), with no trailing newline.
#   * Secret `d365fo-mcp-api-key` holds the client API key.
#   * $RuntimeSa has roles/secretmanager.secretAccessor on BOTH secrets.
#     Without it the deploy fails at revision creation, not at runtime.

param(
  [string] $Project   = 'dynamics-mcp',
  # us-east5 is Columbus, Ohio - the same metro as the Neon instance on AWS
  # us-east-2. The index is a per-query network round trip, so co-locating
  # matters more here than sitting next to the older us-central1 service.
  [string] $Region    = 'us-east5',
  [string] $Service   = 'd365fo-mcp',
  [string] $Tag       = 'v1',
  [switch] $SkipBuild
)

$ErrorActionPreference = 'Stop'
$gcloud = 'C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd'
$image  = "us-east5-docker.pkg.dev/$Project/d365fo-mcp/server:$Tag"
$runSa  = "d365fo-mcp-run@$Project.iam.gserviceaccount.com"

if (-not $SkipBuild) {
  Write-Output "==> building $image"
  # --region on the BUILD is deliberately us-central1: that is where this
  # project's Cloud Build worker pool and staging bucket already live. Only the
  # resulting image and the service are in $Region.
  & $gcloud builds submit --tag $image --region=us-central1 --project=$Project
  if ($LASTEXITCODE -ne 0) { throw "build failed" }
}

Write-Output "==> deploying $Service to $Region"

# Flags worth explaining, since none of them are defaults:
#
#   --min-instances=0   Cost guardrail. A warm instance holds its pg pool open,
#                       which keeps the Neon compute from autosuspending and
#                       bills CU-hours around the clock for an idle server.
#   --max-instances=3   Neon sees maxPoolSize (NEON_POOL_MAX, default 5) x
#                       instances. 3 caps it at 15 connections.
#
# --allow-unauthenticated is deliberately NOT passed. It grants allUsers the
# run.invoker role, which the org policy constraints/iam.allowedPolicyMemberDomains
# refuses - the deploy then prints a "Setting IAM policy failed" warning that
# looks like the service is closed when it is not. Public access here comes from
# run.googleapis.com/invoker-iam-disabled=true (console: Security >
# Authentication > Allow public access), which is a service annotation rather
# than an IAM binding and survives redeploys. Authentication is the app's own
# API key middleware.
#
# Built as an array because PowerShell cannot parse a comment inside a
# backtick-continued command.
$deployArgs = @(
  'run', 'deploy', $Service,
  "--image=$image",
  "--region=$Region",
  "--project=$Project",
  "--service-account=$runSa",
  '--set-secrets=NEON_DATABASE_URL=neon-database-url:latest,API_KEY=d365fo-mcp-api-key:latest',
  '--set-env-vars=MCP_SERVER_MODE=read-only,MCP_FORCE_HTTP=true,NODE_ENV=production',
  '--memory=1Gi',
  '--cpu=1',
  '--concurrency=40',
  '--timeout=300',
  '--min-instances=0',
  '--max-instances=3'
)
& $gcloud @deployArgs
if ($LASTEXITCODE -ne 0) { throw "deploy failed" }

$url = & $gcloud run services describe $Service --region=$Region --project=$Project --format='value(status.url)'
Write-Output ""
Write-Output "service: $url"
Write-Output "health:  $url/health   (unauthenticated by design, for the Cloud Run probe)"
Write-Output "mcp:     $url/mcp      (requires X-Api-Key)"
