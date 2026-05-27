# 2026-05-26 — Migración de gurruchagaweb.com al VPS Contabo

## Qué

`gurruchagaweb.com` (DNS gestionado por IONOS) ahora apunta al VPS Contabo `185.213.25.188` y sirve el mismo sitio que `demogurru.unlimited-systems.net`. **Canonical = `gurruchagaweb.com`**: tanto `demogurru.unlimited-systems.net` como `www.gurruchagaweb.com` hacen 301 a `https://gurruchagaweb.com/` (un solo salto desde HTTP/HTTPS de cualquier hostname).

## Por qué

- gurruchagaweb.com es el dominio real del cliente; `demogurru.unlimited-systems.net` era un subdominio prestado del operador para la fase demo.
- Tener un único canonical resuelve duplicación SEO y simplifica el copy del sitio (sin enlaces internos al dominio demo).

## Cambios concretos

### DNS (IONOS, vía API)

- `A gurruchagaweb.com` → `185.213.25.188` (antes `217.160.0.239`, WordPress IONOS hosting).
- `A www.gurruchagaweb.com` → `185.213.25.188` (antes `217.160.0.239`).
- `AAAA @` y `AAAA www` → eliminados (el VPS Contabo es IPv4-only; mantenerlos rompería clientes IPv6).
- Mail/SPF/DKIM/DMARC/MX/autodiscover/NS/ftp → **intactos**, no se ha tocado nada que afecte al correo.

Gotcha del API IONOS: las mutaciones en paralelo sobre la misma zona devuelven 404 espurios y reciclan IDs de registros. Aplicar cambios **secuencialmente** o re-fetch entre mutaciones (ver [`reference_ionos_api.md`](../../../memory/reference_ionos_api.md) en memoria local).

### Apache (VPS)

- [`deploy/apache-demogurru.conf`](../../deploy/apache-demogurru.conf): añadido `ServerAlias gurruchagaweb.com www.gurruchagaweb.com` y regla canonical (HTTP) que redirige cualquier host distinto a `gurruchagaweb.com` con `R=permanent`.
- [`deploy/apache-demogurru-le-ssl.conf`](../../deploy/apache-demogurru-le-ssl.conf): archivo **nuevo**, versionado para sobrevivir re-deploys. Contiene el vhost `:443` con la misma regla canonical aplicada en capa HTTPS. Antes lo generaba certbot, ahora lo gestiona `Step-Apache`.
- [`deploy/deploy.ps1`](../../deploy/deploy.ps1) `Step-Apache`: ahora sube ambos vhosts (skip del `-le-ssl.conf` si el cert aún no se emitió, para no romper el primer despliegue).

### Cert Let's Encrypt

- Cert renovado con `certbot --apache --expand -d demogurru.unlimited-systems.net -d gurruchagaweb.com -d www.gurruchagaweb.com`. Expira 2026-08-24.
- El cert sigue almacenado en `/etc/letsencrypt/live/demogurru.unlimited-systems.net/` (lineage name no cambia tras `--expand`).

## Verificación post-deploy

```bash
curl -sI https://gurruchagaweb.com/          # 200
curl -sI https://www.gurruchagaweb.com/      # 301 → https://gurruchagaweb.com/
curl -sI https://demogurru.unlimited-systems.net/   # 301 → https://gurruchagaweb.com/
curl -sI http://gurruchagaweb.com/           # 301 → https://gurruchagaweb.com/
```

Todos los redirects 1 salto (no escalera HTTP→HTTPS→canonical).

## Zonas grises / cuidado en el futuro

- **`certbot --expand` corrompe `-le-ssl.conf`**: si la fuente del `:80` vhost tiene rewrite rules, certbot las copia comentadas al SSL vhost por miedo a loops y duplica bloques `<VirtualHost>`. Ahora versionamos nuestro propio `-le-ssl.conf` para sobrescribirlo limpio tras cada `--expand`. **No correr `certbot --apache --expand` esperando que mantenga la regla canonical** — siempre re-deploy del `-le-ssl.conf` después.
- **`demogurru.unlimited-systems.net` parece estar proxiado por Cloudflare** (las cabeceras dicen `server: cloudflare`). Contra la regla #4 de CLAUDE.md (mantener gris). El 301 sigue funcionando, pero conviene revisar el panel Cloudflare. Si está en naranja, ponerlo en gris para evitar problemas futuros con cert renewal HTTP-01.
- **gurruchagaweb.com sigue siendo zona DNS en IONOS**, no Cloudflare. Si en algún momento se migra a Cloudflare, hay que recordar mover los MX/DKIM/DMARC también o el correo del dominio (si lo usa) se rompe.
- **`ftp.gurruchagaweb.com`** sigue apuntando al hosting IONOS antiguo (217.160.230.118 + IPv6 IONOS). No estorba pero es muerto: si el cliente no usa FTP de IONOS, conviene eliminar esos dos registros también.

## Pendientes derivados

- Si el cliente va a usar gurruchagaweb.com como dominio definitivo, revisar:
  - Meta tags `og:url` y `canonical` en el HTML (actualmente no están duros al dominio demo, pero conviene revisar `web/index.html`).
  - Sitemap.xml + Google Search Console con el nuevo canonical.
  - WhatsApp / tarjetas / firmas de correo del cliente con la URL nueva.
- Considerar eliminar registros `ftp.gurruchagaweb.com` huérfanos.
- En algún momento se puede plantear retirar el subdominio `demogurru.unlimited-systems.net` (mantenerlo como redirect o quitarlo definitivamente).
