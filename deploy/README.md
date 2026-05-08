# Deploy — demogurru.unlimited-systems.net

Servir el front Vite estático bajo Apache + un mini-API Node tras systemd, sin tocar la web actual de `unlimited-systems.net`.

## Lo que hay aquí

- `apache-demogurru.conf` — vhost de Apache (SPA + proxy `/api/`).
- `demogurru-api.service` — unidad systemd para el backend Node.
- `deploy.ps1` — script PowerShell que sube todo al VPS.

## Layout final en el VPS

```
/var/www/demogurru/web/                 # estático Vite
/var/www/demogurru/acme/                # carpeta vacía para HTTP-01 challenges
/opt/demogurru-api/                     # backend Node (server.js, package.json, .env, node_modules)
/etc/apache2/sites-available/demogurru.unlimited-systems.net.conf
/etc/apache2/sites-available/demogurru.unlimited-systems.net-le-ssl.conf  # lo crea certbot
/etc/systemd/system/demogurru-api.service
```

## Pasos

### 1) Crear el subdominio en Cloudflare (manual — el usuario)

Zona `unlimited-systems.net` → DNS → Records → **Add record**:

| Field | Value |
|---|---|
| Type | A |
| Name | `demogurru` |
| IPv4 | `185.213.25.188` |
| Proxy status | **DNS only (gris)** |
| TTL | Auto |

Verifica desde otra máquina: `dig +short A demogurru.unlimited-systems.net @1.1.1.1` debe devolver `185.213.25.188`.

### 2) Crear el `.env` del API en el VPS (manual — una vez)

```bash
ssh root@185.213.25.188 "mkdir -p /opt/demogurru-api && cat > /opt/demogurru-api/.env << 'EOF'
PORT=3100
HOST=127.0.0.1
SMTP_HOST=mail.unlimited-systems.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@unlimited-systems.net
SMTP_PASS=lzmW3S!nAebYcVM^
MAIL_FROM=AG Studio <info@unlimited-systems.net>
MAIL_TO=gurru999@gmail.com
ALLOWED_ORIGINS=https://demogurru.unlimited-systems.net
EOF
chmod 640 /opt/demogurru-api/.env && chown root:www-data /opt/demogurru-api/.env"
```

### 3) Lanzar el deploy completo

```powershell
cd c:\GitHub\gurruchagaweb
pwsh deploy/deploy.ps1 -Step all
```

Por pasos individuales:
```powershell
pwsh deploy/deploy.ps1 -Step frontend   # build + sube estático
pwsh deploy/deploy.ps1 -Step api        # sube server.js, instala deps, arranca systemd
pwsh deploy/deploy.ps1 -Step apache     # sube vhost + reload
pwsh deploy/deploy.ps1 -Step cert       # certbot --apache (requiere DNS ya activo)
pwsh deploy/deploy.ps1 -Step status     # health check
```

### 4) Verificación

```bash
ssh root@185.213.25.188 "curl -sI https://demogurru.unlimited-systems.net/"
ssh root@185.213.25.188 "curl -fsS http://127.0.0.1:3100/api/health"
ssh root@185.213.25.188 "journalctl -u demogurru-api --no-pager -n 30"
```

## Operación

- Logs Apache: `/var/log/apache2/demogurru-{access,error}.log`.
- Logs API: `journalctl -u demogurru-api -f`.
- Reiniciar API: `systemctl restart demogurru-api`.
- Renovación cert: certbot lo hace solo (timer systemd). Apache se recarga vía hook estándar.
- Cambiar password SMTP: editar `/opt/demogurru-api/.env` y `systemctl restart demogurru-api`.

## No tocar

- El vhost de `unlimited-systems.net` queda intacto: este vhost es independiente.
- Stalwart sigue exactamente igual; solo se le manda SMTP AUTH al puerto 465 desde localhost.
