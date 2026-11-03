<#
.SYNOPSIS
  Bundles src/scene.template.json, src/app/*, and src/controls/* into FrameOS
  deployment artifacts inside dist/:
    - dist/scene.json                  (Single scene object)
    - dist/scenes.json                 (FrameOS scenes array)
    - dist/template.json               (FrameOS template manifest)
    - dist/image.jpg                   (800x480 e-ink preview thumbnail)
    - dist/language-learning-scene.zip (FrameOS template .zip for Docker / Cloud UI import)
    - dist/frame-import-sticky.json    (Full Seeed Studio reTerminal Sticky frame import JSON)
#>

$ErrorActionPreference = "Stop"

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$RepoRoot  = if (Test-Path (Join-Path $ScriptDir "src\scene.template.json")) {
    $ScriptDir
} else {
    Split-Path -Parent $ScriptDir
}

$SrcDir  = Join-Path $RepoRoot "src"
$DistDir = Join-Path $RepoRoot "dist"

New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

function Escape-JsonString {
    param([string]$Text)
    if ($null -eq $Text) { return '""' }
    $sb = [System.Text.StringBuilder]::new($Text.Length + 16)
    [void]$sb.Append('"')
    for ($i = 0; $i -lt $Text.Length; $i++) {
        $ch = $Text[$i]
        $code = [int][char]$ch
        switch ($ch) {
            '"'  { [void]$sb.Append('\"'); continue }
            '\'  { [void]$sb.Append('\\'); continue }
            "`b" { [void]$sb.Append('\b'); continue }
            "`f" { [void]$sb.Append('\f'); continue }
            "`n" { [void]$sb.Append('\n'); continue }
            "`r" { [void]$sb.Append('\r'); continue }
            "`t" { [void]$sb.Append('\t'); continue }
            default {
                if ($code -lt 32) {
                    [void]$sb.AppendFormat('\u{0:x4}', $code)
                } else {
                    [void]$sb.Append($ch)
                }
            }
        }
    }
    [void]$sb.Append('"')
    return $sb.ToString()
}

function Format-JsonValue {
    param(
        $Value,
        [int]$Indent = 0
    )
    $pad = "  " * $Indent
    $childPad = "  " * ($Indent + 1)

    if ($null -eq $Value) {
        return "null"
    }
    if ($Value -is [bool]) {
        return $(if ($Value) { "true" } else { "false" })
    }
    if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) {
        return [System.Convert]::ToString($Value, [System.Globalization.CultureInfo]::InvariantCulture)
    }
    if ($Value -is [string]) {
        return (Escape-JsonString -Text $Value)
    }
    if ($Value -is [System.Collections.IDictionary]) {
        if ($Value.Count -eq 0) { return "{}" }
        $lines = [System.Collections.Generic.List[string]]::new()
        foreach ($key in $Value.Keys) {
            $kJson = Escape-JsonString -Text ([string]$key)
            $vJson = Format-JsonValue -Value $Value[$key] -Indent ($Indent + 1)
            $lines.Add("${childPad}${kJson}: ${vJson}")
        }
        return "{`n" + ($lines -join ",`n") + "`n${pad}}"
    }
    if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
        $items = @($Value)
        if ($items.Count -eq 0) { return "[]" }
        $lines = [System.Collections.Generic.List[string]]::new()
        foreach ($item in $items) {
            $itemJson = Format-JsonValue -Value $item -Indent ($Indent + 1)
            $lines.Add("${childPad}${itemJson}")
        }
        return "[`n" + ($lines -join ",`n") + "`n${pad}]"
    }
    if ($Value -is [psobject]) {
        $props = @($Value.PSObject.Properties)
        if ($props.Count -eq 0) { return "{}" }
        $lines = [System.Collections.Generic.List[string]]::new()
        foreach ($prop in $props) {
            $kJson = Escape-JsonString -Text $prop.Name
            $vJson = Format-JsonValue -Value $prop.Value -Indent ($Indent + 1)
            $lines.Add("${childPad}${kJson}: ${vJson}")
        }
        return "{`n" + ($lines -join ",`n") + "`n${pad}}"
    }
    return (Escape-JsonString -Text ([string]$Value))
}

function Build-FrameOSAppEntry {
    param([string]$FolderPath)

    $configPath = Join-Path $FolderPath "config.json"
    if (-not (Test-Path $configPath)) {
        throw "Missing config.json in $FolderPath"
    }

    $utf8 = [System.Text.UTF8Encoding]::new($false)
    $configRaw = [System.IO.File]::ReadAllText($configPath, $utf8)
    $configObj = $configRaw | ConvertFrom-Json

    $sources = [ordered]@{}
    $files = Get-ChildItem -Path $FolderPath -File | Sort-Object Name
    foreach ($file in $files) {
        $sources[$file.Name] = [System.IO.File]::ReadAllText($file.FullName, $utf8) -replace "`r`n", "`n"
    }

    return [ordered]@{
        name        = $configObj.name
        category    = $configObj.category
        description = $configObj.description
        fields      = $configObj.fields
        output      = $configObj.output
        sources     = $sources
    }
}

function New-PreviewThumbnailJpeg {
    param([string]$OutputPath)

    Add-Type -AssemblyName System.Drawing
    $bmp = [System.Drawing.Bitmap]::new(800, 480)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $g.Clear([System.Drawing.Color]::White)

        $blackPen   = [System.Drawing.Pen]::new([System.Drawing.Color]::Black, 3)
        $blackBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Black)
        $whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
        $grayBrush  = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(241, 245, 249))
        $mutedBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(71, 85, 105))

        $fontHeader = [System.Drawing.Font]::new("Arial", 13, [System.Drawing.FontStyle]::Bold)
        $fontWord   = [System.Drawing.Font]::new("Arial", 38, [System.Drawing.FontStyle]::Bold)
        $fontSub    = [System.Drawing.Font]::new("Arial", 16, [System.Drawing.FontStyle]::Bold)
        $fontBody   = [System.Drawing.Font]::new("Arial", 15, [System.Drawing.FontStyle]::Bold)
        $fontSmall  = [System.Drawing.Font]::new("Arial", 11, [System.Drawing.FontStyle]::Bold)

        # Header bar
        $g.FillRectangle($blackBrush, 24, 20, 200, 32)
        $g.DrawString("SPANISH (ESPANOL)", $fontSmall, $whiteBrush, 34, 27)
        $g.DrawRectangle($blackPen, 236, 20, 125, 32)
        $g.DrawString("CEFR B1 - VERB", $fontSmall, $blackBrush, 246, 27)
        $g.DrawString("1 / 5", $fontHeader, $blackBrush, 720, 26)
        $g.DrawLine($blackPen, 24, 64, 776, 64)

        # Left Word Panel
        $g.DrawRectangle($blackPen, 24, 82, 364, 316)
        $g.DrawString("WORD OF THE DAY", $fontSmall, $mutedBrush, 130, 125)
        $g.DrawString("Madrugar", $fontWord, $blackBrush, 75, 185)
        $g.DrawString("ma - dru - gar", $fontSub, $mutedBrush, 132, 265)

        # Right Meaning Panel
        $g.FillRectangle($grayBrush, 412, 82, 364, 316)
        $g.DrawRectangle($blackPen, 412, 82, 364, 316)
        $g.DrawString("MEANING", $fontSmall, $mutedBrush, 434, 104)
        $g.DrawString("To wake up / get up early", $fontBody, $blackBrush, 434, 130)
        $g.DrawLine($blackPen, 434, 210, 754, 210)
        $g.DrawString("EXAMPLE IN CONTEXT", $fontSmall, $mutedBrush, 434, 226)
        $g.DrawString("Manana tengo que madrugar", $fontBody, $blackBrush, 434, 254)
        $g.DrawString("para tomar el tren.", $fontBody, $blackBrush, 434, 280)
        $g.DrawString("Tomorrow I have to get up early to catch the train.", $fontSmall, $mutedBrush, 434, 322)

        # Footer Bar
        $g.DrawLine($blackPen, 24, 414, 776, 414)
        $g.DrawRectangle($blackPen, 24, 426, 130, 36)
        $g.DrawString("< PREV (UP)", $fontSmall, $blackBrush, 42, 436)
        $g.FillRectangle($blackBrush, 280, 426, 240, 36)
        $g.DrawString("REVEAL ANSWER (AI)", $fontSmall, $whiteBrush, 322, 436)
        $g.DrawRectangle($blackPen, 646, 426, 130, 36)
        $g.DrawString("NEXT (DOWN) >", $fontSmall, $blackBrush, 658, 436)

        $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    } finally {
        $g.Dispose()
        $bmp.Dispose()
    }
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$sceneTemplatePath = Join-Path $SrcDir "scene.template.json"
$sceneRaw = [System.IO.File]::ReadAllText($sceneTemplatePath, $utf8NoBom)
$scene = $sceneRaw | ConvertFrom-Json

$appsMap = [ordered]@{}
$appsMap["languageCard"]   = Build-FrameOSAppEntry -FolderPath (Join-Path $SrcDir "app")
$appsMap["stickyControls"] = Build-FrameOSAppEntry -FolderPath (Join-Path $SrcDir "controls")

$sceneOutput = [ordered]@{
    id           = $scene.id
    name         = $scene.name
    settings     = $scene.settings
    fields       = $scene.fields
    nodes        = $scene.nodes
    edges        = $scene.edges
    apps         = $appsMap
    customEvents = $scene.customEvents
}

# Validate node IDs referenced by edges
$nodeIds = @{}
foreach ($n in $scene.nodes) { $nodeIds[$n.id] = $true }
foreach ($e in $scene.edges) {
    if (-not $nodeIds.ContainsKey($e.source)) {
        throw "Edge '$($e.id)' references missing source node '$($e.source)'"
    }
    if (-not $nodeIds.ContainsKey($e.target)) {
        throw "Edge '$($e.id)' references missing target node '$($e.target)'"
    }
}

$singleSceneJson = Format-JsonValue -Value $sceneOutput
$scenesArrayJson = Format-JsonValue -Value @($sceneOutput)

$templateManifest = [ordered]@{
    name           = "Language Learning Sticky (800x480)"
    description    = "High-contrast e-ink language learning flashcard and Word of the Day scene tailored for the Seeed Studio reTerminal Sticky (800x480)."
    scenes         = "./scenes.json"
    config         = [ordered]@{}
    image          = "./image.jpg"
    imageWidth     = 800
    imageHeight    = 480
    frameosVersion = "2026.10.29"
}
$templateJson = Format-JsonValue -Value $templateManifest

$frameImportObj = [ordered]@{
    name        = "Language Learning Sticky"
    frame_host  = "sticky.local"
    server_host = "localhost:8989"
    device      = "waveshare.EPD_3in97"
    mode        = "embedded"
    platform    = "esp32-s3"
    width       = 800
    height      = 480
    interval    = 900
    color_mode  = "black-white"
    embedded    = [ordered]@{
        platform            = "esp32-s3"
        flashSize           = "32MB"
        hardwarePreset      = "seeed_reterminal_sticky"
        renderMode          = "local"
        deepSleep           = $false
        deepSleepOnBattery  = $true
        wakeCheckSeconds    = 300
    }
    device_config = [ordered]@{
        hardwarePreset = "seeed_reterminal_sticky"
        rstPin         = 17
        dcPin          = 16
        csPin          = 15
        cs2Pin         = -1
        busyPin        = 18
        sckPin         = 13
        mosiPin        = 14
        pwrPin         = 47
    }
    gpio_buttons = @(
        [ordered]@{ pin = 4; label = "AI" },
        [ordered]@{ pin = 5; label = "UP" },
        [ordered]@{ pin = 6; label = "DOWN" }
    )
    scenes      = @($sceneOutput)
}
$frameImportJson = Format-JsonValue -Value $frameImportObj

$sceneJsonPath       = Join-Path $DistDir "scene.json"
$scenesJsonPath      = Join-Path $DistDir "scenes.json"
$templateJsonPath    = Join-Path $DistDir "template.json"
$imageJpgPath        = Join-Path $DistDir "image.jpg"
$frameImportJsonPath = Join-Path $DistDir "frame-import-sticky.json"
$zipPath             = Join-Path $DistDir "language-learning-scene.zip"

[System.IO.File]::WriteAllText($sceneJsonPath,       $singleSceneJson, $utf8NoBom)
[System.IO.File]::WriteAllText($scenesJsonPath,      $scenesArrayJson, $utf8NoBom)
[System.IO.File]::WriteAllText($templateJsonPath,    $templateJson,    $utf8NoBom)
[System.IO.File]::WriteAllText($frameImportJsonPath, $frameImportJson, $utf8NoBom)

New-PreviewThumbnailJpeg -OutputPath $imageJpgPath

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $folderPrefix = "Language Learning Sticky (800x480)"
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $templateJsonPath, "$folderPrefix/template.json")
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $scenesJsonPath,   "$folderPrefix/scenes.json")
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $imageJpgPath,     "$folderPrefix/image.jpg")
} finally {
    $zip.Dispose()
}

$sizeKb = [Math]::Round((Get-Item $scenesJsonPath).Length / 1024, 2)
Write-Host "Built FrameOS scene & Docker deployment bundle:" -ForegroundColor Green
Write-Host "  - Template ZIP (Import in FrameOS UI): $zipPath"
Write-Host "  - Frame Import JSON (New Frame -> Import): $frameImportJsonPath"
Write-Host "  - Scenes Array JSON: $scenesJsonPath ($sizeKb KiB / 512 KiB ESP32 budget)"
Write-Host "  - Single Scene JSON: $sceneJsonPath"
