# Deploy demogurru.unlimited-systems.net al VPS Contabo.
# Uso: pwsh deploy/deploy.ps1 [-Step all|frontend|api|apache|cert]
# Requiere: ssh root@185.213.25.188 con clave configurada.

[CmdletBinding()]
param(
  [ValidateSet('all','frontend','api','apache','cert','status')]
  [string]$Step = 'all',
  [string]$VpsHost = '185.213.25.188',
  [string]$Domain = 'demogurru.unlimited-systems.net',
  [string]$LetsEncryptEmail = 'yagogurru77@gmail.com'
)

$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path "$PSScriptRoot/..").Path
$WebRoot = Join-Path $RepoRoot 'web'
$ApiRoot = Join-Path $RepoRoot 'api'
$DeployDir = Join-Path $RepoRoot 'deploy'

function Invoke-SSH([string]$cmd) {
  Write-Host "[ssh] $cmd" -ForegroundColor DarkCyan
  & ssh "root@$VpsHost" $cmd
  if ($LASTEXITCODE -ne 0) { throw "ssh failed: $cmd" }
}

function Invoke-SCP([string]$src, [string]$dst) {
  Write-Host "[scp] $src -> $dst" -ForegroundColor DarkCyan
  & scp -r $src "root@${VpsHost}:$dst"
  if ($LASTEXITCODE -ne 0) { throw "scp failed: $src -> $dst" }
}

function Step-Frontend {
  Write-Host "`n=== FRONTEND BUILD + UPLOAD ===" -ForegroundColor Cyan
  Push-Location $WebRoot
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build failed' }
  } finally { Pop-Location }

  Invoke-SSH 'mkdir -p /var/www/demogurru/web /var/www/demogurru/acme/.well-known/acme-challenge'
  # Limpia la carpeta destino antes de subir el bundle nuevo
  Invoke-SSH 'rm -rf /var/www/demogurru/web/*'
  Invoke-SCP "$WebRoot/dist/*" '/var/www/demogurru/web/'
  Invoke-SSH 'chown -R www-data:www-data /var/www/demogurru && find /var/www/demogurru/web -type d -exec chmod 755 {} \; && find /var/www/demogurru/web -type f -exec chmod 644 {} \;'
}

function Step-Api {
  Write-Host "`n=== API DEPLOY ===" -ForegroundColor Cyan
  Invoke-SSH 'mkdir -p /opt/demogurru-api'
  # Subir solo lo necesario (no node_modules locales, los instala el VPS)
  Invoke-SCP "$ApiRoot/server.js" '/opt/demogurru-api/server.js'
  Invoke-SCP "$ApiRoot/package.json" '/opt/demogurru-api/package.json'

  Invoke-SSH 'cd /opt/demogurru-api && npm install --omit=dev --no-audit --no-fund'
  Invoke-SCP "$DeployDir/demogurru-api.service" '/etc/systemd/system/demogurru-api.service'
  Invoke-SSH 'systemctl daemon-reload && systemctl enable demogurru-api && systemctl restart demogurru-api'
  Start-Sleep -Seconds 2
  Invoke-SSH 'systemctl status demogurru-api --no-pager -l | head -25'
  Invoke-SSH 'curl -fsS http://127.0.0.1:3100/api/health'
}

function Step-Apache {
  Write-Host "`n=== APACHE VHOST ===" -ForegroundColor Cyan
  Invoke-SCP "$DeployDir/apache-demogurru.conf" "/etc/apache2/sites-available/$Domain.conf"
  Invoke-SSH "a2ensite $Domain.conf"
  Invoke-SSH 'a2enmod proxy proxy_http headers rewrite ssl 2>&1 | tail -3'
  Invoke-SSH 'apache2ctl configtest'
  Invoke-SSH 'systemctl reload apache2'
}

function Step-Cert {
  Write-Host "`n=== CERTBOT ===" -ForegroundColor Cyan
  # Asegura que el path ACME existe y Apache responde HTTP 200
  Invoke-SSH "curl -sI http://$Domain/ | head -3"
  Invoke-SSH "certbot --apache -d $Domain --non-interactive --agree-tos -m $LetsEncryptEmail --redirect"
  Invoke-SSH 'apache2ctl configtest && systemctl reload apache2'
  Invoke-SSH "curl -sI https://$Domain/ | head -3"
}

function Step-Status {
  Invoke-SSH 'systemctl is-active apache2 demogurru-api'
  Invoke-SSH "curl -sI https://$Domain/ 2>&1 | head -5 || curl -sI http://$Domain/ | head -5"
  Invoke-SSH 'curl -fsS http://127.0.0.1:3100/api/health'
}

switch ($Step) {
  'frontend' { Step-Frontend }
  'api'      { Step-Api }
  'apache'   { Step-Apache }
  'cert'     { Step-Cert }
  'status'   { Step-Status }
  'all' {
    Step-Frontend
    Step-Api
    Step-Apache
    Step-Cert
    Step-Status
  }
}

Write-Host "`n[done] $Step" -ForegroundColor Green
