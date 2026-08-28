#!/usr/bin/env pwsh
# Visual smoke check para gurruchagaweb (sitio React+Vite).
#
# Arranca `npm run dev` en web/ si no responde el puerto 5173, captura PNGs
# full-page de las rutas indicadas y deja las imagenes en
# scripts/screenshots/<timestamp>/ para que un agente IA (o el operador) las
# evalue sin abrir navegador.
#
# Ejemplos:
#   scripts\visual-check.ps1                       # set por defecto (home + expositor + contacto)
#   scripts\visual-check.ps1 / /expositor          # rutas explicitas
#   scripts\visual-check.ps1 -Viewport 375x812     # movil
#   scripts\visual-check.ps1 -NoServerStart        # asume Vite ya esta corriendo
#
# OJO: el sitio Modular (Blazor, /construccion gateada por cookie 0007, puerto
# 7264) NO esta cubierto por este script — habria que setear la cookie en
# Playwright. Si hace falta, ampliar con -BaseUrl https://localhost:7264 y un
# step extra de cookie.

# PositionalBinding=$false hace que $Routes (Position=0) sea el unico parametro
# posicional. Sin esto "scripts\visual-check.ps1 /foo" enlazaba "/foo" a $BaseUrl
# por defecto positional y rompia el flujo.
[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$Routes,
    [string]$BaseUrl = "http://localhost:5173",
    [string]$Viewport = "1440x900",
    [int]$HydrateMs = 800,           # React+Vite hidrata mucho mas rapido que Blazor WASM
    [string]$WebDir = "web",         # subcarpeta donde vive el package.json del frontend
    [switch]$NoServerStart,
    [switch]$KeepServer
)

$ErrorActionPreference = "Stop"

$scriptDir   = $PSScriptRoot
$repoRoot    = Resolve-Path (Join-Path $scriptDir "..")
$toolProj    = Join-Path $scriptDir "visual-check\VisualCheck.csproj"
$webRoot     = Join-Path $repoRoot $WebDir
$outRoot     = Join-Path $scriptDir "screenshots"
$timestamp   = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir      = Join-Path $outRoot $timestamp
$serverLog   = Join-Path $outRoot "server-$timestamp.log"

if (-not (Test-Path $toolProj)) { throw "No encuentro $toolProj." }
if (-not (Test-Path $webRoot))  { throw "No encuentro la carpeta del frontend en $webRoot (override con -WebDir)." }
New-Item -ItemType Directory -Path $outRoot -Force | Out-Null

# --- 1) Build de la tool .NET + instalar Chromium (primera vez) -------------
$marker = Join-Path $scriptDir "visual-check\.playwright-installed"
$needsInstall = -not (Test-Path $marker)

Write-Host "[visual-check] dotnet build VisualCheck..." -ForegroundColor Cyan
& dotnet build $toolProj -c Release --nologo -v quiet
if ($LASTEXITCODE -ne 0) { throw "Build de VisualCheck fallo." }

if ($needsInstall) {
    $playwrightPs1 = Join-Path $scriptDir "visual-check\bin\Release\net8.0\playwright.ps1"
    if (-not (Test-Path $playwrightPs1)) { throw "No se encontro playwright.ps1 tras build." }
    Write-Host "[visual-check] Instalando Chromium para Playwright (~150 MB, una sola vez)..." -ForegroundColor Cyan
    & $playwrightPs1 install chromium
    if ($LASTEXITCODE -ne 0) { throw "playwright install chromium fallo." }
    New-Item -ItemType File -Path $marker -Force | Out-Null
}

# --- 2) Comprobar / arrancar Vite -------------------------------------------
function Test-ServerUp {
    try {
        $r = Invoke-WebRequest -Uri "$BaseUrl/" -SkipCertificateCheck -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        return $true
    } catch { return $false }
}

$serverProc = $null
if (Test-ServerUp) {
    Write-Host "[visual-check] Vite ya esta arriba en $BaseUrl." -ForegroundColor Green
} else {
    if ($NoServerStart) { throw "Vite no responde en $BaseUrl y -NoServerStart esta activo." }
    Write-Host "[visual-check] Vite no responde, arrancando 'npm run dev' en $webRoot..." -ForegroundColor Yellow
    Write-Host "[visual-check] Logs del server: $serverLog" -ForegroundColor DarkGray

    # npm.cmd: en Windows hay que usar npm.cmd o cmd /c npm. Si llamamos directamente
    # 'npm' desde Start-Process, Windows no resuelve el shim y falla.
    # Get-Command suele devolver npm.ps1 o npm (sin extension). Buscamos npm.cmd en el
    # mismo directorio — funciona en portable (nodejs-portable) y en oficial.
    $npmSource = (Get-Command npm).Source
    $npmDir = Split-Path $npmSource -Parent
    $npmCmd = Join-Path $npmDir "npm.cmd"
    if (-not (Test-Path $npmCmd)) {
        throw "No encuentro npm.cmd en $npmDir (resuelto desde 'Get-Command npm'). Revisa la instalacion de Node."
    }

    $serverProc = Start-Process -FilePath $npmCmd `
        -ArgumentList @("run", "dev") `
        -WorkingDirectory $webRoot `
        -RedirectStandardOutput $serverLog `
        -RedirectStandardError "$serverLog.err" `
        -WindowStyle Hidden -PassThru

    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline) {
        if (Test-ServerUp) { break }
        Start-Sleep -Milliseconds 500
    }
    if (-not (Test-ServerUp)) {
        try { taskkill /T /F /PID $serverProc.Id 2>&1 | Out-Null } catch {}
        throw "Vite no levanto en 60s. Revisa $serverLog y $serverLog.err."
    }
    Write-Host "[visual-check] Vite arriba." -ForegroundColor Green
}

# --- 3) Lanzar la captura ---------------------------------------------------
$exitCode = 1
try {
    $env:VC_BASE_URL  = $BaseUrl
    $env:VC_OUT       = $outDir
    $env:VC_VIEWPORT  = $Viewport
    $env:VC_HYDRATE_MS = "$HydrateMs"
    $env:VC_NO_LOGIN  = "1"   # sitio publico: el front no tiene login

    $cliArgs = @("run", "--project", $toolProj, "-c", "Release", "--no-build", "--", "--no-login")
    if ($Routes -and $Routes.Count -gt 0) {
        $cliArgs += @("--routes", ($Routes -join ","))
    } else {
        # Defaults para gurruchagaweb: las 3 rutas publicas del frontend React.
        $cliArgs += @("--routes", "/,/expositor,/contacto")
    }

    & dotnet @cliArgs
    $exitCode = $LASTEXITCODE
}
finally {
    if ($serverProc -and -not $KeepServer) {
        Write-Host "[visual-check] Parando Vite (PID $($serverProc.Id) y su arbol)..." -ForegroundColor Yellow
        try { taskkill /T /F /PID $serverProc.Id 2>&1 | Out-Null } catch {}
    } elseif ($serverProc -and $KeepServer) {
        Write-Host "[visual-check] -KeepServer activo: dejando Vite vivo (PID $($serverProc.Id))." -ForegroundColor DarkGray
    }
    Remove-Item Env:\VC_BASE_URL,Env:\VC_OUT,Env:\VC_VIEWPORT,Env:\VC_HYDRATE_MS,Env:\VC_NO_LOGIN -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Screenshots:" -ForegroundColor Cyan
if (Test-Path $outDir) {
    Get-ChildItem $outDir -Filter *.png | Sort-Object Name | ForEach-Object {
        Write-Host "  $($_.FullName)"
    }
} else {
    Write-Host "  (no se genero la carpeta — revisa el log de salida)" -ForegroundColor DarkGray
}

exit $exitCode
