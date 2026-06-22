$ErrorActionPreference = "Stop"
if (Test-Path variable:PSNativeCommandUseErrorActionPreference) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
$compose = Join-Path $root "compose.yaml"

if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $root ".env.example") $envFile
    Write-Host "Létrejött a wordpress/.env. A benne lévő lokális jelszót később módosíthatod."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "A Docker szolgáltatás nem fut. Indítsd el a Docker Desktopot, majd futtasd újra a bootstrap scriptet."
}

docker compose --env-file $envFile -f $compose up -d database wordpress
if ($LASTEXITCODE -ne 0) {
    throw "A WordPress konténerek indítása sikertelen."
}

Write-Host "Várakozás a WordPress indulására..."
$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 3
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker compose --env-file $envFile -f $compose run --rm cli core version 1>$null 2>$null
    $ErrorActionPreference = $previousPreference
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
}
if (-not $ready) {
    throw "A WordPress nem indult el időben. Ellenőrizd: docker compose -f wordpress/compose.yaml logs"
}

$values = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $values[$matches[1]] = $matches[2]
    }
}

function Invoke-WpCli {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$WpArguments)
    docker compose --env-file $envFile -f $compose run --rm cli @WpArguments
    if ($LASTEXITCODE -ne 0) {
        throw "A WP-CLI parancs sikertelen: $($WpArguments -join ' ')"
    }
}

$wpUrl = $values["WP_URL"]
$wpTitle = $values["WP_TITLE"]
$wpAdminUser = $values["WP_ADMIN_USER"]
$wpAdminPassword = $values["WP_ADMIN_PASSWORD"]
$wpAdminEmail = $values["WP_ADMIN_EMAIL"]

$previousPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker compose --env-file $envFile -f $compose run --rm cli core is-installed 1>$null 2>$null
$ErrorActionPreference = $previousPreference
if ($LASTEXITCODE -ne 0) {
    Invoke-WpCli core install `
        --url=$wpUrl `
        --title=$wpTitle `
        --admin_user=$wpAdminUser `
        --admin_password=$wpAdminPassword `
        --admin_email=$wpAdminEmail `
        --skip-email
}

Invoke-WpCli theme install zodiac-astrology --activate
Invoke-WpCli theme activate zodiac-astrology-child
Invoke-WpCli plugin activate lena-core
Invoke-WpCli language core install hu_HU
Invoke-WpCli site switch-language hu_HU
Invoke-WpCli eval-file /workspace/scripts/bootstrap-content.php

Write-Host ""
Write-Host "WordPress: $wpUrl"
Write-Host "Admin: $wpUrl/wp-admin"
Write-Host "Felhasználó: $wpAdminUser"
