$ErrorActionPreference = "Stop"

$wordpressRoot = Split-Path -Parent $PSScriptRoot
$buildDirectory = Join-Path $wordpressRoot ".build"
$themeSource = Join-Path $wordpressRoot "themes\zodiac-astrology-child"
$pluginSource = Join-Path $wordpressRoot "plugins\lena-core"

New-Item -ItemType Directory -Force -Path $buildDirectory | Out-Null

$themePackage = Join-Path $buildDirectory "zodiac-astrology-child.zip"
$pluginPackage = Join-Path $buildDirectory "lena-core.zip"

if (Test-Path -LiteralPath $themePackage) {
    Remove-Item -LiteralPath $themePackage -Force
}
if (Test-Path -LiteralPath $pluginPackage) {
    Remove-Item -LiteralPath $pluginPackage -Force
}

Compress-Archive -Path $themeSource -DestinationPath $themePackage -CompressionLevel Optimal
Compress-Archive -Path $pluginSource -DestinationPath $pluginPackage -CompressionLevel Optimal

Get-Item -LiteralPath $themePackage, $pluginPackage |
    Select-Object Name, Length, LastWriteTime
