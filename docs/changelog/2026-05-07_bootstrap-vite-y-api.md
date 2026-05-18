# 2026-05-07 — Bootstrap del repo: Vite + React + API Express

> Sesión inicial de 2026-05-07. Conversión del prototipo HTML/JSX cargado por CDN (`Front Generado con IA/`) a un proyecto productivo con frontend Vite + React y API Express + nodemailer, deployable en el VPS Contabo.

---

## Cambios entregados

### 1. Frontend `web/` — Vite + React 18

Migrado el prototipo a Vite 5 + React 18 + react-router-dom 6 + framer-motion + lucide-react. Sin TypeScript a propósito (mantener JSX simple). 3 rutas: `/`, `/expositor`, `/contacto`. SPA fallback configurado en Apache. Sistema de **Tweaks** (panel de personalización en vivo, FAB bottom-right) con primera tanda de settings: `mode`, `palette`, `type`, `density`, `carousel` (variante), `marquee`, `accent`, `motion`. Persistencia en `localStorage` clave `gurru:tweaks:v1`.

**Ficheros tocados**: `web/package.json`, `web/vite.config.js`, `web/src/**`, `web/public/assets/**`.

### 2. Backend `api/` — Express + nodemailer + Stalwart

API mínimo Node 22 + Express 4 + helmet + express-rate-limit + nodemailer. Escucha en `127.0.0.1:3100`. Endpoints `GET /api/health` y `POST /api/contact`. Implementa honeypot `website`, rate limit 8/10min por IP, CORS por `ALLOWED_ORIGINS`, validación de campos por rangos+regex. Manda mail por `mail.unlimited-systems.net:465 TLS implícito` autenticándose como `info@unlimited-systems.net`. Destinatario inicial: `gurru999@gmail.com`.

**Ficheros tocados**: `api/package.json`, `api/server.js`, `api/.env.example`.

### 3. Despliegue `deploy/` — script PowerShell idempotente

`deploy/deploy.ps1` con pasos selectivos: `-Step frontend|api|apache|cert|status|all`. Apache vhost committed en `deploy/apache-demogurru.conf` (proxy `/api/*` → 127.0.0.1:3100, estático Vite con SPA fallback). systemd unit en `deploy/demogurru-api.service` con `User=www-data`. Certificado Let's Encrypt obtenido vía `-Step cert`.

**Ficheros tocados**: `deploy/deploy.ps1`, `deploy/apache-demogurru.conf`, `deploy/demogurru-api.service`, `deploy/README.md`.

---

## Decisiones tomadas en zonas grises

- **Sin TypeScript**: el prototipo era JSX simple; añadir TS habría sido refactor sin valor de cliente.
- **API y front en mismo VPS, mismo filesystem**: `STATIC_ROOT=/var/www/demogurru/web` permite que el API lea imágenes para adjuntarlas (futuro flow §7). Acoplamiento aceptado; si se separan, reescribir `loadReferenceAttachment()`.
- **DNS Solo DNS (gris) en Cloudflare**: el proxy de Cloudflare termina TLS y rompería certbot. Mantener gris.
- **Stalwart 465 TLS implícito, no 587 STARTTLS**: Stalwart de fábrica solo tiene 465. Si en el futuro un cliente externo lo necesita, abrir 587 manualmente.
- **`.env` del API solo en VPS y en local**: `chmod 640 root:www-data`. La pass de `info@unlimited-systems.net` es la misma del admin Stalwart → exposición = compromiso del mail server.

---

## Ficheros tocados (resumen)

```
web/package.json
web/vite.config.js
web/index.html
web/src/main.jsx
web/src/data/site.js
web/src/pages/{Landing,Expositor,Contacto}.jsx
web/src/components/{SiteHeader,SiteFooter,TaglineMarquee,Carousel,Lightbox,ScrollToTop}.jsx
web/src/tweaks/{TweaksContext,TweaksPanel}.jsx
web/src/styles/{tokens,app,extras}.css
web/public/assets/**

api/package.json
api/server.js
api/.env.example

deploy/deploy.ps1
deploy/apache-demogurru.conf
deploy/demogurru-api.service
deploy/README.md
```

---

## Pendiente tras esta sesión

- Reemplazar imágenes placeholder por fotos reales del taller (bloqueado: cliente).
- Open Graph + Twitter cards.
- Sitemap.xml + robots.txt.
- Optimizar imágenes pesadas (`logo-vercreer.png` 3.8 MB).
- Email de autorespuesta al visitante.

---

## Referencias

- Docs de dominio cubiertos por esta sesión: [`../02-frontend-web-vite.md`](../02-frontend-web-vite.md), [`../03-api-contacto-node.md`](../03-api-contacto-node.md), [`../05-despliegue.md`](../05-despliegue.md).
- Siguiente sesión: [`2026-05-08_modular-y-localizacion.md`](2026-05-08_modular-y-localizacion.md).
