$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
$compose = Join-Path $root "compose.yaml"

if (-not (Test-Path $envFile)) {
    throw "Hiányzik a wordpress/.env fájl."
}

$resolvedRoot = (Resolve-Path $root).Path
if ($resolvedRoot -ne (Resolve-Path (Join-Path $PSScriptRoot "..")).Path) {
    throw "A reset célkönyvtára nem ellenőrizhető."
}

docker compose --env-file $envFile -f $compose down --volumes
& (Join-Path $PSScriptRoot "bootstrap.ps1")
