# Entorno TEST de la API — demogurru-api-test (tarea #268)

Segunda instancia de la API de contacto (Express) para **staging**, servida bajo el
vhost YA existente de `gurru-test.unlimited-systems.net` en la ruta `/api`, con proxy
a una instancia independiente en `127.0.0.1:3101` (prod sigue en `3100`, intacta).

- **Sin DNS nuevo**: reutiliza el vhost/host de gurru-test.
- **Aislada de prod**: propio puerto (3101), propia unit systemd, propio `.env`
  (`MAIL_TO` interno, `ALLOWED_ORIGINS` de staging, `MAIL_FROM` marcado `[TEST]`).
- **El código es idéntico** al de prod (`api/server.js` lee todo de env). No se
  modifica `server.js`.

Estado actual del vhost gurru-test: su `ProxyPass /api/` apunta HOY a `3100` (prod).
La instalación lo repunta a `3101`.

---

## Ficheros del repo que usa este entorno

- `api/server.js`, `api/package.json` — mismos que prod.
- `api/.env.test.example` — plantilla del `.env` de test (puerto 3101, MAIL_TO
  interno, origen de staging). Root rellena `SMTP_PASS` y `STATIC_ROOT` a mano.
- `deploy/demogurru-api-test.service` — unit systemd de la instancia de test.

---

## Pasos root (todo requiere root; la jaula del agente NO puede escribir /etc ni units)

### 1. Desplegar el código de la instancia de test

```bash
install -d -o www-data -g www-data /opt/demogurru-api-test
cp /home/jarvis/workspace/gurruchagaweb/api/server.js       /opt/demogurru-api-test/
cp /home/jarvis/workspace/gurruchagaweb/api/package.json    /opt/demogurru-api-test/
cd /opt/demogurru-api-test && npm install --omit=dev
chown -R www-data:www-data /opt/demogurru-api-test
```

### 2. Crear el `.env` de test

```bash
cp /home/jarvis/workspace/gurruchagaweb/api/.env.test.example /opt/demogurru-api-test/.env
# Editar /opt/demogurru-api-test/.env y:
#   - NO pongas SMTP_PASS aqui: la unit carga ANTES el .env de prod
#     (/opt/demogurru-api/.env), fuente unica de la credencial; este .env va
#     DESPUES y solo pisa puerto/MAIL_TO/origenes. (Ver capas en la unit.)
#   - descomentar STATIC_ROOT y ponerlo = al DocumentRoot del vhost gurru-test
chown www-data:www-data /opt/demogurru-api-test/.env
chmod 600 /opt/demogurru-api-test/.env
```

### 3. Instalar y arrancar la unit

```bash
cp /home/jarvis/workspace/gurruchagaweb/deploy/demogurru-api-test.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now demogurru-api-test
systemctl status demogurru-api-test --no-pager
# Sanity local (debe responder ok:true):
curl -fsS http://127.0.0.1:3101/api/health
```

### 4. Repuntar el proxy del vhost gurru-test de 3100 → 3101

En los DOS ficheros del vhost de gurru-test:
- `/etc/apache2/sites-available/gurru-test.unlimited-systems.net.conf`
- `/etc/apache2/sites-available/gurru-test.unlimited-systems.net-le-ssl.conf`

cambiar las dos líneas del backend (son las ÚNICAS que contienen `3100` en ese vhost):

```apache
    # ANTES (apunta a prod):
    ProxyPass /api/ http://127.0.0.1:3100/api/
    ProxyPassReverse /api/ http://127.0.0.1:3100/api/

    # DESPUÉS (apunta a la instancia de test):
    ProxyPass /api/ http://127.0.0.1:3101/api/
    ProxyPassReverse /api/ http://127.0.0.1:3101/api/
```

Comando equivalente (seguro: `3100` sólo aparece en esas 2 líneas del vhost):

```bash
sed -i 's#127.0.0.1:3100/api/#127.0.0.1:3101/api/#g' \
  /etc/apache2/sites-available/gurru-test.unlimited-systems.net.conf \
  /etc/apache2/sites-available/gurru-test.unlimited-systems.net-le-ssl.conf

apache2ctl configtest && systemctl reload apache2
```

### 5. Verificación (criterio de aceptación #3)

```bash
# Backend de test directo
curl -fsS http://127.0.0.1:3101/api/health          # -> {"ok":true,...}
# A través del vhost público de gurru-test
curl -fsS https://gurru-test.unlimited-systems.net/api/health   # -> {"ok":true,...}
# PROD intacta (criterio #5)
curl -fsS http://127.0.0.1:3100/api/health          # -> {"ok":true,...}
curl -fsS https://gurruchagaweb.com/api/health       # -> {"ok":true,...}
```

---

## Rollback (deja gurru-test como estaba: /api -> prod 3100)

```bash
# 1. Revertir el proxy del vhost a 3100
sed -i 's#127.0.0.1:3101/api/#127.0.0.1:3100/api/#g' \
  /etc/apache2/sites-available/gurru-test.unlimited-systems.net.conf \
  /etc/apache2/sites-available/gurru-test.unlimited-systems.net-le-ssl.conf
apache2ctl configtest && systemctl reload apache2

# 2. Parar y deshabilitar la instancia de test
systemctl disable --now demogurru-api-test
rm -f /etc/systemd/system/demogurru-api-test.service
systemctl daemon-reload

# 3. (opcional) borrar el código/env de test
rm -rf /opt/demogurru-api-test
```

Nada de esto toca la instancia de PROD (`demogurru-api` / `3100` / `/opt/demogurru-api`)
ni sus datos.
