<#
.SYNOPSIS
  Wrapper that forwards to the root Build-Scene.ps1 script.
#>
$RootScript = Join-Path (Split-Path -Parent $PSScriptRoot) "Build-Scene.ps1"
& $RootScript
