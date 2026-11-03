<#
.SYNOPSIS
  Builds the LanguageLearningFrame bundle and deploys it to a Local Docker
  installation of FrameOS (default: http://localhost:8989).

.PARAMETER FrameOSUrl
  Base URL of your local FrameOS Docker container (default: $env:FRAMEOS_URL or "http://localhost:8989").

.PARAMETER ApiToken
  FrameOS API Token created in FrameOS UI under "Settings -> API tokens and MCP"
  (default: $env:FRAMEOS_API_TOKEN).

.PARAMETER FrameId
  Optional numeric ID of a target Frame in FrameOS to update with this scene.

.PARAMETER FrameName
  Optional name of a target Frame in FrameOS to update with this scene.

.PARAMETER CreateFrameIfMissing
  If no matching Frame is found on your local FrameOS server, automatically import
  a pre-configured Seeed Studio reTerminal Sticky frame (POST /api/frames/import).

.PARAMETER FastDeploy
  Trigger POST /api/frames/{id}/fast_deploy after updating the frame's scenes.

.EXAMPLE
  .\Deploy-Scene.ps1 -ApiToken "fos_..." -CreateFrameIfMissing
#>

param(
    [string]$FrameOSUrl = $(if ($env:FRAMEOS_URL) { $env:FRAMEOS_URL } else { "http://localhost:8989" }),
    [string]$ApiToken   = $(if ($env:FRAMEOS_API_TOKEN) { $env:FRAMEOS_API_TOKEN } else { "" }),
    [int]$FrameId       = 0,
    [string]$FrameName  = "",
    [switch]$CreateFrameIfMissing,
    [switch]$FastDeploy
)

$ErrorActionPreference = "Stop"

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$BuildScript = Join-Path $ScriptDir "Build-Scene.ps1"

# 1. Always build fresh dist/ artifacts first
& $BuildScript

$DistDir             = Join-Path $ScriptDir "dist"
$SceneJsonPath       = Join-Path $DistDir "scene.json"
$ScenesJsonPath      = Join-Path $DistDir "scenes.json"
$ImageJpgPath        = Join-Path $DistDir "image.jpg"
$ZipPath             = Join-Path $DistDir "language-learning-scene.zip"
$FrameImportJsonPath = Join-Path $DistDir "frame-import-sticky.json"

$BaseUrl = $FrameOSUrl.TrimEnd("/")

Write-Host ""
Write-Host "Target FrameOS Docker URL: $BaseUrl" -ForegroundColor Cyan

$Headers = @{
    "Accept" = "application/json"
}
if ($ApiToken) {
    $Headers["Authorization"] = "Bearer $ApiToken"
}

# 2. Verify connectivity & authentication against GET /api/templates
try {
    $existingTemplates = Invoke-RestMethod -Uri "$BaseUrl/api/templates" -Method Get -Headers $Headers -TimeoutSec 10
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
    }
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host ""
        Write-Host "Authentication required by FrameOS ($BaseUrl returned HTTP $statusCode)." -ForegroundColor Yellow
        Write-Host "To deploy via CLI:" -ForegroundColor White
        Write-Host "  1. Open $BaseUrl in your browser -> Settings -> API tokens and MCP"
        Write-Host "  2. Generate an API token and run:"
        Write-Host "     powershell -NoProfile -ExecutionPolicy Bypass -File .\Deploy-Scene.ps1 -ApiToken `"<YOUR_TOKEN>`" -CreateFrameIfMissing" -ForegroundColor Green
        Write-Host ""
        Write-Host "Or import directly in the FrameOS Web UI (no token required):" -ForegroundColor White
        Write-Host "  - Option A (Import Scene Template): Templates -> Add template -> Upload '$ZipPath'"
        Write-Host "  - Option B (Import Full Sticky Frame): New frame -> Import frame -> Upload '$FrameImportJsonPath'"
        exit 1
    }
    Write-Host ""
    Write-Host "Could not reach FrameOS at $BaseUrl ($($_.Exception.Message))." -ForegroundColor Yellow
    Write-Host "Make sure your FrameOS Docker container is running, or import the built files manually in the UI:" -ForegroundColor White
    Write-Host "  - Template ZIP:      $ZipPath"
    Write-Host "  - Frame Import JSON: $FrameImportJsonPath"
    exit 1
}

# 3. Upload / Replace Template in FrameOS (POST /api/templates)
$templateName = "Language Learning Sticky (800x480)"
$utf8 = [System.Text.UTF8Encoding]::new($false)
$scenesRaw = [System.IO.File]::ReadAllText($ScenesJsonPath, $utf8)
$singleSceneRaw = [System.IO.File]::ReadAllText($SceneJsonPath, $utf8)
$singleSceneObj = $singleSceneRaw | ConvertFrom-Json

$imgBytes = [System.IO.File]::ReadAllBytes($ImageJpgPath)
$imgBase64Url = "data:image/jpeg;base64," + [System.Convert]::ToBase64String($imgBytes)

# Remove older template with the same name so we don't create duplicates
if ($existingTemplates) {
    foreach ($tpl in $existingTemplates) {
        if ($tpl.name -eq $templateName -and $tpl.id) {
            Write-Host "Replacing existing template '$templateName' (id: $($tpl.id))..." -ForegroundColor DarkGray
            [void](Invoke-RestMethod -Uri "$BaseUrl/api/templates/$($tpl.id)" -Method Delete -Headers $Headers)
        }
    }
}

$templatePayload = "{`"name`":`"Language Learning Sticky (800x480)`",`"description`":`"High-contrast e-ink language learning flashcard and Word of the Day scene tailored for the Seeed Studio reTerminal Sticky (800x480).`",`"scenes`":$scenesRaw,`"config`":{},`"image`":`"$imgBase64Url`",`"imageWidth`":800,`"imageHeight`":480}"

$createdTemplate = Invoke-RestMethod -Uri "$BaseUrl/api/templates" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $utf8.GetBytes($templatePayload)
Write-Host "Uploaded template '$($createdTemplate.name)' (id: $($createdTemplate.id)) to FrameOS!" -ForegroundColor Green

# 4. Find or Create Target Frame & Update its Scenes
$framesResponse = Invoke-RestMethod -Uri "$BaseUrl/api/frames" -Method Get -Headers $Headers
$framesList = if ($framesResponse.frames) { @($framesResponse.frames) } elseif ($framesResponse -is [System.Array]) { $framesResponse } else { @() }

$targetFrame = $null
if ($FrameId -gt 0) {
    $targetFrame = $framesList | Where-Object { $_.id -eq $FrameId } | Select-Object -First 1
} elseif ($FrameName) {
    $targetFrame = $framesList | Where-Object { $_.name -eq $FrameName } | Select-Object -First 1
} else {
    $targetFrame = $framesList | Where-Object {
        $_.device -eq "seeed_reterminal_sticky" -or
        $_.device -eq "waveshare.EPD_3in97" -or
        ($_.embedded -and $_.embedded.hardwarePreset -eq "seeed_reterminal_sticky") -or
        ($_.device_config -and $_.device_config.hardwarePreset -eq "seeed_reterminal_sticky")
    } | Select-Object -First 1
}

if (-not $targetFrame -and $CreateFrameIfMissing) {
    Write-Host "Creating new 'Language Learning Sticky' frame (seeed_reterminal_sticky) via POST /api/frames/import..." -ForegroundColor Cyan
    $frameImportBytes = [System.IO.File]::ReadAllBytes($FrameImportJsonPath)
    $imported = Invoke-RestMethod -Uri "$BaseUrl/api/frames/import" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $frameImportBytes
    $targetFrame = if ($imported.frame) { $imported.frame } else { $imported }
    Write-Host "Created Frame '$($targetFrame.name)' (id: $($targetFrame.id)) with scene '$($singleSceneObj.id)'!" -ForegroundColor Green
} elseif ($targetFrame) {
    Write-Host "Updating scene '$($singleSceneObj.id)' on Frame '$($targetFrame.name)' (id: $($targetFrame.id))..." -ForegroundColor Cyan
    $updateBody = "{`"scenes`":$scenesRaw}"

    [void](Invoke-RestMethod -Uri "$BaseUrl/api/frames/$($targetFrame.id)" -Method Post -Headers $Headers -ContentType "application/json; charset=utf-8" -Body $utf8.GetBytes($updateBody))
    Write-Host "Updated Frame '$($targetFrame.name)' (id: $($targetFrame.id)) with latest LanguageLearningFrame scene!" -ForegroundColor Green

    if ($FastDeploy) {
        Write-Host "Triggering Fast Deploy on Frame id $($targetFrame.id)..." -ForegroundColor Cyan
        [void](Invoke-RestMethod -Uri "$BaseUrl/api/frames/$($targetFrame.id)/fast_deploy?force=true" -Method Post -Headers $Headers)
        Write-Host "Fast Deploy triggered!" -ForegroundColor Green
    }
} else {
    Write-Host "Tip: Pass -CreateFrameIfMissing (or -FrameId <id>) to also attach the scene to a Frame automatically." -ForegroundColor Gray
}
