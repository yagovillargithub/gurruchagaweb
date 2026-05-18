# Arquitectura — gurruchagaweb

> Visión general del repo, estructura física, layout en el VPS, topología de red, dominios y certificados. Punto de entrada para entender cómo encajan los 3 subproductos: web Vite+React, API Express y Modular Blazor Server.
> Última actualización: 2026-05-18.

---

## Resumen

`gurruchagaweb` es un repo que aloja **dos sitios hermanos** del taller de arancha GURRUCHAGA (Santa Rosa, La Pampa, Argentina):

- **`demogurru.unlimited-systems.net`** — landing principal del taller. Vite+React (estático) + API Node Express con nodemailer.
- **`demomodular.unlimited-systems.net`** — visor + market de la línea modular nueva (Blazor Server .NET 8), **gateado** tras una pantalla "en construcción" con clave `0007`. Pensado como estudio de mercado mientras la línea termina de cocinarse.

Las dos webs corren en el mismo VPS Contabo, bajo el mismo Apache reverse-proxy, con certificados Let's Encrypt independientes. La home de demogurru tiene un **teaser** que enlaza a demomodular en pestaña nueva.

| Item | Valor |
|---|---|
| URL demogurru | <https://demogurru.unlimited-systems.net/> |
| URL demomodular | <https://demomodular.unlimited-systems.net/> (gate `0007`) |
| Repo local | `c:\GitHub\gurruchagaweb\` (raíz web React, subcarpeta `MODULAR/` para Blazor — repo git nested independiente) |
| VPS | Contabo · `185.213.25.188` (compartido con `unlimited-systems.net`, `jamonparadise.com`, `vibrabuena.net`, mail) |
| DNS | Cloudflare zona `unlimited-systems.net` → A `demogurru` y A `demomodular` (ambos **Solo DNS, gris**) |
| Cert TLS demogurru | Let's Encrypt R13, expira **2026-08-05** |
| Cert TLS demomodular | Let's Encrypt R13, expira **2026-08-06** |
| Remitente del formulario | `info@unlimited-systems.net` (Stalwart self-hosted) |
| Destinatario actual | `gurru999@gmail.com` |
| Marca pública | **AG Studio** (descriptor "Taller", ver `02-frontend-web-vite.md`) |

---

## Estado actual

### Estructura del repo

```
c:\GitHub\gurruchagaweb\
├── Front Generado con IA/        # original intacto (referencia, no se despliega)
├── web/                          # Vite + React (npm run dev / build) — demogurru
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/assets/            # imágenes (logos + proyectos)
│   └── src/
│       ├── main.jsx              # Routes + TweaksProvider + TweaksPanel global
│       ├── data/site.js          # ★ catálogo de proyectos + datos del estudio + MODULAR.url
│       ├── pages/{Landing,Expositor,Contacto}.jsx
│       ├── components/
│       │   ├── SiteHeader.jsx       # logo (anagrama) + nav
│       │   ├── SiteFooter.jsx
│       │   ├── TaglineMarquee.jsx   # ticker de palabras
│       │   ├── Carousel.jsx         # 3 variantes (paralelo/infinito/diagonal) + onItemClick
│       │   ├── Lightbox.jsx         # modal compartido — cta(item) render prop
│       │   └── ScrollToTop.jsx
│       ├── tweaks/{TweaksContext,TweaksPanel}.jsx
│       └── styles/{tokens.css,app.css,extras.css}
├── api/                          # backend Express + nodemailer — demogurru-api
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── deploy/                       # despliegue demogurru
│   ├── apache-demogurru.conf
│   ├── demogurru-api.service     # systemd
│   ├── deploy.ps1
│   └── README.md
├── MODULAR/                      # ★ proyecto Blazor (repo git nested independiente)
│   ├── .git/                     # ← repo propio. Fase F creará su memoria.
│   ├── MODULAR.sln
│   ├── ModularKitchen/           # Blazor Server (.NET 8)
│   │   ├── ModularKitchen.csproj
│   │   ├── Program.cs            # ★ gate middleware + /construccion + /unlock
│   │   ├── appsettings.json                 # dev: SqlServer DESKTOP-G20TCFL\SQLEXPRESS
│   │   ├── appsettings.Production.json      # prod: SQLite /var/lib/demomodular/modular.db
│   │   ├── Components/{App,Routes,Layout,Pages}
│   │   ├── Data/{AppDbContext,Entities,SeedData}.cs
│   │   ├── Models/KitchenCatalog.cs
│   │   └── wwwroot/
│   └── deploy/
│       ├── apache-demomodular.conf
│       ├── demomodular.service
│       └── deploy.ps1            # pwsh MODULAR/deploy/deploy.ps1 -Step publish|...
├── scripts/                      # visual-check transversal (Playwright .NET)
│   ├── visual-check.ps1
│   └── visual-check/
└── .gitignore
```

### Layout en el VPS

```
/var/www/demogurru/web/                              # estático Vite — STATIC_ROOT del API
/var/www/demogurru/web/assets/proyectos/             # ★ carpeta que el API lee para adjuntar
/var/www/demogurru/acme/.well-known/acme-challenge/  # ACME-HTTP01

/opt/demogurru-api/
├── server.js
├── package.json
├── node_modules/
└── .env                                             # ★ CREDENCIALES — chmod 640 root:www-data

/opt/demomodular/                                    # publish output (binarios .NET 8 framework-dependent)
├── ModularKitchen.dll
├── appsettings.Production.json
└── ...
/var/lib/demomodular/modular.db                      # SQLite — owned por www-data

/etc/apache2/sites-available/demogurru.unlimited-systems.net.conf
/etc/apache2/sites-available/demogurru.unlimited-systems.net-le-ssl.conf       # certbot
/etc/apache2/sites-available/demomodular.unlimited-systems.net.conf
/etc/apache2/sites-available/demomodular.unlimited-systems.net-le-ssl.conf     # certbot
/etc/systemd/system/demogurru-api.service
/etc/systemd/system/demomodular.service
```

### Topología de red

```
Internet → 443/80
   ↓
Apache 2.4 (mismo Apache que sirve unlimited-systems.net, jamonparadise.com, vibrabuena.net, mail.*)
   ├── vhost demogurru.unlimited-systems.net
   │     ├── /                     → /var/www/demogurru/web/ (estático Vite, SPA fallback a index.html)
   │     ├── /api/*                → http://127.0.0.1:3100/api/*  (proxy_http)
   │     └── /.well-known/...      → /var/www/demogurru/acme/    (ACME)
   │
   ├── vhost demomodular.unlimited-systems.net
   │     ├── /.well-known/...      → /var/www/demomodular/acme/
   │     └── /                     → http://127.0.0.1:5101/ upgrade=websocket   ← SignalR
   │
   └── (otros vhosts intactos)

127.0.0.1:3100  ← demogurru-api.service (Node 22 + Express)
                  └── nodemailer SMTP_SSL → mail.unlimited-systems.net:465
                        └── login: info@unlimited-systems.net
                              └── envía a: gurru999@gmail.com

127.0.0.1:5101  ← demomodular.service (.NET 8 Blazor Server)
                  └── SignalR /_blazor + EF Core → SQLite /var/lib/demomodular/modular.db
```

API Express y Blazor Server **escuchan solo en localhost** — nunca expuestos directo. Apache es la única vía pública.

## Decisiones clave documentadas (zonas grises del operador)

- **DNS Solo DNS (gris) en Cloudflare, no proxy**: si activas el proxy (nube naranja), Cloudflare termina TLS y nuestra config de cert + el redirect 80→443 dejan de tener sentido. Mantener **Solo DNS** en los dos subdominios.
- **Mismo VPS para todos los sitios del operador**: simplifica operación (un certbot, un Apache, una IP, un mail server local). Tradeoff aceptado: si el VPS cae, caen todos los sitios a la vez. Backups críticos vivirán en otra parte (pendiente §11 del legacy).
- **MODULAR/ como repo git nested**: tiene `.git` propio dentro de `gurruchagaweb/MODULAR/`. Su historia es independiente. Cuando Fase F del sistema global se ejecute, se le creará memoria propia (CLAUDE.md + HANDOVER.md + docs/) y este repo solo mantendrá un puntero corto + la sección teaser/cross-deploy.
- **`/var/lib/demomodular/` para SQLite, no `/opt/demomodular/`**: cada `-Step publish` borra `/opt/demomodular/` y lo repuebla → perderías la BD si vivía ahí. `/var/lib/` es el estándar Linux para state mutable.
- **Imágenes del front compartidas filesystem con el API**: el API lee de `STATIC_ROOT=/var/www/demogurru/web` para adjuntar al correo. Acoplamiento explícito documentado, ver `03-api-contacto-node.md` para el reescribir si se separan.

## Ficheros clave

| Qué | Dónde |
|---|---|
| Datos del estudio + catálogo de proyectos + `MODULAR.url` | `web/src/data/site.js` |
| Apache vhost demogurru (committeado) | `deploy/apache-demogurru.conf` |
| systemd unit API demogurru | `deploy/demogurru-api.service` |
| Apache vhost demomodular | `MODULAR/deploy/apache-demomodular.conf` |
| systemd unit Blazor demomodular | `MODULAR/deploy/demomodular.service` |
| `.env` del API (NO en git, vive solo en VPS y en local de dev) | `/opt/demogurru-api/.env` + `api/.env` local |

## Pendiente / no implementado

- Backup automático del VPS (BBDD SQLite Modular + `/var/www/demogurru/web/assets/`).
- Sitemap.xml + robots.txt + indexación en Google Search Console (cuando deje de ser demo).
- Migración a dominio definitivo si el cliente compra `gurruchaga.ar` / `agstudio.ar`.

## Referencias cruzadas

- **Frontend Vite**: [`02-frontend-web-vite.md`](02-frontend-web-vite.md).
- **API contacto**: [`03-api-contacto-node.md`](03-api-contacto-node.md).
- **Modular Blazor**: [`04-modular-blazor.md`](04-modular-blazor.md) (pendiente Fase F para extraer a `c:\GitHub\MODULAR\`).
- **Despliegue**: [`05-despliegue.md`](05-despliegue.md).
- **Pruebas**: [`06-protocolo-pruebas.md`](06-protocolo-pruebas.md).
- **Compartido (VPS, Apache, certbot, UFW)**: [`../../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md`](../../UNLIMITED_AI_BRAIN/compartido/01-infraestructura-vps.md).
- **Compartido (Mail server Stalwart)**: [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md).
- **Histórico**: [`changelog/`](changelog/).
