param([ValidateRange(1024, 65535)][int]$Port = 4173)
$ErrorActionPreference = 'Stop'
$previewRoot = Split-Path -Parent $PSCommandPath
$previewPython = Join-Path $previewRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $previewPython)) {
    & python -m venv (Join-Path $previewRoot '.venv')
    if ($LASTEXITCODE -ne 0) { throw 'A helyi Python-környezet létrehozása nem sikerült.' }
}
& $previewPython -c 'import swisseph, tzdata' 2>$null
if ($LASTEXITCODE -ne 0) {
    & $previewPython -m pip install -r (Join-Path $previewRoot 'requirements-astro.txt')
    if ($LASTEXITCODE -ne 0) { throw 'A függőségek telepítése nem sikerült.' }
}
$requiredData = @('places.sqlite', 'sepl_18.se1', 'semo_18.se1', 'seas_18.se1')
$missingData = @($requiredData | Where-Object { -not (Test-Path -LiteralPath (Join-Path $previewRoot "astro-data\$_")) })
if ($missingData.Count -gt 0) {
    & $previewPython (Join-Path $previewRoot 'bootstrap_astro.py')
    if ($LASTEXITCODE -ne 0) { throw 'A nyilvános számítási adatok előkészítése nem sikerült.' }
}
if (-not (Test-Path -LiteralPath (Join-Path $previewRoot 'astro-assets\fonts.css'))) {
    & $previewPython (Join-Path $previewRoot 'prepare-local-fonts.py')
    if ($LASTEXITCODE -ne 0) { throw 'A meglévő betűtípusok előkészítése nem sikerült.' }
}
if (-not (Test-Path -LiteralPath (Join-Path $previewRoot 'astro-assets\wheel-symbols.woff2'))) {
    & $previewPython (Join-Path $previewRoot 'prepare-wheel-font.py')
    if ($LASTEXITCODE -ne 0) { throw 'A képletábra jelöléseinek előkészítése nem sikerült.' }
}
& $previewPython (Join-Path $previewRoot 'build-local-preview.py')
if ($LASTEXITCODE -ne 0) { throw 'A helyi előnézet elkészítése nem sikerült.' }
$previewStatus = $null
try {
    $previewStatus = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/api/status" -TimeoutSec 2
} catch { }
if ($null -ne $previewStatus) {
    if ($previewStatus.preview_app -eq 'lena-agpl-demo' -and $previewStatus.ready -eq $true) {
        Write-Host "A helyi előnézet már fut: http://127.0.0.1:$Port/"
        Write-Host "Gyors elemzés: http://127.0.0.1:$Port/gyors-elemzes/"
        return
    }
    throw "A $Port porton másik vagy még nem kész szerver fut. Válassz másik portot: ./demo/Start-LocalPreview.ps1 -Port 4174"
}
& $previewPython (Join-Path $previewRoot 'preview_server.py') --port $Port
if ($LASTEXITCODE -ne 0) { throw "A helyi szerver nem indult el; ellenőrizd, nem foglalt-e a $Port port." }
