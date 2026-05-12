# Handover — Demo web Gurruchaga (`demogurru.unlimited-systems.net`) + Modular (`demomodular.unlimited-systems.net`)

> Dos sitios hermanos del **taller** de **arancha GURRUCHAGA** (Santa Rosa, La Pampa) que viven en el mismo repo y cooperan a nivel de producto:
>
> - `demogurru.unlimited-systems.net` — landing principal del taller. **Vite + React** + API Node mínimo de contacto.
> - `demomodular.unlimited-systems.net` — visor + market de la línea nueva *"Modular"* (cocina/baño/placard). **Blazor Server (.NET 8)** con SQLite. Por ahora gateado tras una pantalla "en construcción" con clave de demos `0007` (decisión del cliente — usarlo como estudio de mercado mientras la línea termina de cocinarse).
>
> Las dos webs corren en el mismo VPS Contabo, bajo Apache reverse-proxy con SSL Let's Encrypt. La home de demogurru tiene un **teaser** que enlaza a demomodular en pestaña nueva, ver §14 abajo.
>
> Fecha de redacción: **2026-05-07**. Última actualización: **2026-05-08** — tercera iteración: añadido subdominio **demomodular.unlimited-systems.net** (Blazor Server con gate de clave `0007`) + teaser desde la home de demogurru hacia Modular.

> **Convención de copy importante** (decisión del cliente, no rephrasear sin consultar): el sitio se refiere al negocio como *"Taller"*, no como *"Estudio"*. La marca pública sigue siendo *"AG Studio"* (en inglés, anglicismo que sí se entiende). Cuando hace falta describir la fabricación interna, usar *"producción propia"* en vez del antiguo *"taller propio"* — para evitar la repetición con la marca *"Taller"*. Ver §6 → "Decisiones de copy".

---

## 1. Visión general

Conversión de un prototipo HTML/JSX cargado por CDN (`Front Generado con IA/`) a un proyecto productivo:

- **Frontend** (`web/`): Vite + React 18, react-router-dom, framer-motion, lucide-react. Build estático servido por Apache.
- **Backend de contacto** (`api/`): Express + nodemailer + helmet + rate-limit. Recibe `POST /api/contact`, manda mail vía Stalwart.
- **Despliegue** (`deploy/`): vhost de Apache, unidad systemd, script PowerShell.

| Item | Valor |
|---|---|
| URL demogurru | <https://demogurru.unlimited-systems.net/> |
| URL demomodular | <https://demomodular.unlimited-systems.net/> (gate `0007` por ahora) |
| Repo local | `c:\GitHub\gurruchagaweb\` (raíz para web React, subcarpeta `MODULAR/` para el proyecto Blazor) |
| VPS | Contabo · `185.213.25.188` (mismo donde vive `unlimited-systems.net`, `jamonparadise.com`, `vibrabuena.net`, mail) |
| DNS | Cloudflare zona `unlimited-systems.net` → A `demogurru` y A `demomodular` (ambos Solo DNS, gris) |
| Cert TLS demogurru | Let's Encrypt R13, expira **2026-08-05** |
| Cert TLS demomodular | Let's Encrypt R13, expira **2026-08-06** |
| Remitente del formulario | `info@unlimited-systems.net` (Stalwart self-hosted, ver `handover_mailServer.md`) |
| Destinatario actual | `gurru999@gmail.com` |

---

## 2. Estructura del repo

```
c:\GitHub\gurruchagaweb\
├── Front Generado con IA/        # original intacto (referencia, no se despliega)
├── web/                          # Vite + React (npm run dev / build)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/assets/            # imágenes (logos + proyectos)
│   └── src/
│       ├── main.jsx              # Routes + TweaksProvider + TweaksPanel global
│       ├── data/site.js          # ★ catálogo de proyectos + datos del estudio
│       ├── pages/{Landing,Expositor,Contacto}.jsx
│       ├── components/
│       │   ├── SiteHeader.jsx       # logo (anagrama) + nav
│       │   ├── SiteFooter.jsx
│       │   ├── TaglineMarquee.jsx   # ticker de palabras (lowercase, sin separador)
│       │   ├── Carousel.jsx         # 3 variantes (paralelo/infinito/diagonal) + onItemClick
│       │   ├── Lightbox.jsx         # modal compartido — recibe `cta(item)` render prop
│       │   └── ScrollToTop.jsx
│       ├── tweaks/{TweaksContext,TweaksPanel}.jsx
│       └── styles/{tokens.css,app.css,extras.css}
├── api/                          # backend Express + nodemailer
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── deploy/
│   ├── apache-demogurru.conf     # vhost (sirve estático + proxy /api/)
│   ├── demogurru-api.service     # systemd
│   ├── deploy.ps1                # script PowerShell
│   └── README.md                 # operativa de despliegue
├── MODULAR/                      # ★ proyecto Blazor de la línea nueva (demomodular)
│   ├── MODULAR.sln
│   ├── ModularKitchen/           # Blazor Server (.NET 8) — ver §14
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
└── .gitignore
```

---

## 3. Layout en el VPS

```
/var/www/demogurru/web/                              # estático (Vite dist) — también STATIC_ROOT del API
/var/www/demogurru/web/assets/proyectos/             # ★ carpeta que el API lee para adjuntar imágenes
/var/www/demogurru/acme/.well-known/acme-challenge/  # carpeta vacía para ACME-HTTP01
/opt/demogurru-api/
├── server.js
├── package.json
├── node_modules/
└── .env                                             # ★ CREDENCIALES — chmod 640 root:www-data
/etc/apache2/sites-available/demogurru.unlimited-systems.net.conf
/etc/apache2/sites-available/demogurru.unlimited-systems.net-le-ssl.conf  # lo creó certbot
/etc/systemd/system/demogurru-api.service
```

> **Acoplamiento entre el bundle y el API**: el API lee imágenes desde `STATIC_ROOT` (default `/var/www/demogurru/web`) para poder adjuntarlas a los correos del formulario de contacto. Eso significa que el bundle del front y el API conviven en la misma máquina y dependen del mismo path. Si en algún momento se separan (CDN para estático, API en otra máquina), hay que cambiar la estrategia: bajar la imagen vía HTTPS o pasar el archivo en el body del POST.

Logs:
- Apache: `/var/log/apache2/demogurru-{access,error}.log`
- API: `journalctl -u demogurru-api -f`

---

## 4. Topología de red

```
Internet → 443/80
   ↓
Apache 2.4 (mismo Apache que sirve unlimited-systems.net etc.)
   ├── vhost demogurru.unlimited-systems.net
   │     ├── /                     → /var/www/demogurru/web/  (estático Vite, SPA fallback a index.html)
   │     ├── /api/*                → http://127.0.0.1:3100/api/* (proxy_http)
   │     └── /.well-known/...      → /var/www/demogurru/acme/  (ACME)
   │
   └── (otros vhosts intactos: unlimited-systems.net, jamonparadise.com, vibrabuena.net, mail.*)

127.0.0.1:3100  ← demogurru-api.service (Node 22 + Express)
                  └── nodemailer SMTP_SSL → mail.unlimited-systems.net:465
                        └── login: info@unlimited-systems.net
                              └── envía a: gurru999@gmail.com
```

El API solo escucha en localhost — nunca expuesto directo. Apache es la única vía pública.

---

## 5. Backend de contacto — `demogurru-api`

### Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `GET`  | `/api/health` | `{ok:true, ts}` — sanity check |
| `POST` | `/api/contact` | Recibe formulario, valida, opcionalmente adjunta imagen de un proyecto, envía mail por Stalwart, devuelve `{ok:true}` o `{ok:false, error}` |

### Body aceptado por `/api/contact`

```jsonc
{
  "nombre": "...",                 // 2–120 chars
  "email": "...",                  // regex básico, ≤200
  "telefono": "...",               // opcional, ≤60
  "proyecto": "cocina|living|...", // whitelist PROYECTO_LABELS
  "mensaje": "...",                // 5–4000 chars
  "website": "",                   // honeypot — si viene relleno, ok:true silencioso
  "proyectoRef": {                 // OPCIONAL — viene cuando el visitante hace
    "id":     "cocina-blanca",     //   "Quiero algo parecido" desde el lightbox del expositor.
    "titulo": "Cocina blanca…",    // Si pasa el saneo y el archivo existe en STATIC_ROOT,
    "img":    "/assets/proyectos/cocina-blanca-isla.jpg"  // se adjunta al correo (ver abajo).
  }
}
```

### Validaciones / seguridad (`server.js`)

- **Validación de campos** del formulario: rangos de longitud y `isEmail()` regex.
- **Honeypot** `website`: si viene relleno, devuelve `{ok:true}` silenciosamente (bot-trap).
- **Rate limit**: 8 envíos / 10 min por IP (`express-rate-limit`, `trust proxy: 1`).
- **CORS** restringido a `ALLOWED_ORIGINS` del `.env`.
- **`proyectoRef` saneado**: solo se aceptan `{ id, titulo, img }`, todos strings cortos, `id` debe ser `^[a-z0-9-]+$`.
- **Adjunto anti path-traversal**: `loadReferenceAttachment()` valida `img` contra `^/assets/proyectos/[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp)$`, resuelve a `path.resolve(STATIC_ROOT + img)` y verifica que el resultado **siga dentro de** `STATIC_ROOT` antes de hacer el `readFile`. Si el archivo no existe o falla cualquier check, el correo se manda **sin adjunto** y se loguea un warning — nunca rompe el envío del formulario.

### `/opt/demogurru-api/.env` (NO está en git)

```
PORT=3100
HOST=127.0.0.1
SMTP_HOST=mail.unlimited-systems.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@unlimited-systems.net
SMTP_PASS=lzmW3S!nAebYcVM^                            # ★ misma de handover_mailServer.md §3
MAIL_FROM=AG Studio <info@unlimited-systems.net>
MAIL_TO=gurru999@gmail.com
STATIC_ROOT=/var/www/demogurru/web                    # root para resolver imágenes adjuntas
ALLOWED_ORIGINS=https://demogurru.unlimited-systems.net,http://demogurru.unlimited-systems.net
```

Permisos: `chmod 640 root:www-data /opt/demogurru-api/.env` (el systemd unit corre como `www-data`).

### Cambiar destinatario o credenciales

```bash
ssh root@185.213.25.188
nano /opt/demogurru-api/.env       # editar MAIL_TO, SMTP_PASS, STATIC_ROOT…
systemctl restart demogurru-api
journalctl -u demogurru-api -n 20  # confirmar arranque OK
```

### El correo que llega
- `Subject`: `Nuevo contacto · {nombre} · {proyectoLabel}`
- `From`: `AG Studio <info@unlimited-systems.net>`
- `Reply-To`: el email del visitante (responder al correo en Gmail le contesta directo).
- HTML editorial (azul AG, Bodoni-style heading) + texto plano de fallback.
- **Si vino con `proyectoRef`**: la fila "Referencia" en la tabla del HTML, la imagen embebida vía `cid:proyectoRef` (mostrada en línea bajo el mensaje) **y** disponible como adjunto descargable. La imagen se incrusta usando `nodemailer.attachments[].cid`, así Gmail la pinta inline en el cliente y aparece también como descarga al final.

---

## 6. Frontend — Vite + React

### Stack
- **Vite 5** + `@vitejs/plugin-react` — HMR, ESM real, build optimizado.
- **React 18** + **react-router-dom 6** (BrowserRouter) — 3 rutas (`/`, `/expositor`, `/contacto`) con SPA fallback en Apache.
- **framer-motion** — entrance animations + drawer del panel de Tweaks + lightbox.
- **lucide-react** — iconos.
- Sin TypeScript a propósito (mantener JSX simple, igual que el prototipo).

### Build
- `npm run dev` → vite en :5173 con proxy `/api → 127.0.0.1:3100`.
- `npm run build` → `dist/` (~100 KB JS gzip + 6 KB CSS gzip).

### Datos editables — `src/data/site.js`
- `ESTUDIO`: nombre, WhatsApp, `whatsappLink`, redes, email, ciudad, etc. Cambiar aquí, redesplegar `frontend`.
- `CATEGORIAS`: ids y labels de filtros del Expositor.
- `PROYECTOS`: array de `{ id, titulo, categoria, anio, img, lugar }`. Las imágenes referenciadas con `/assets/proyectos/<file>.jpg` viven en `web/public/assets/proyectos/` (y, una vez deployadas, en `/var/www/demogurru/web/assets/proyectos/` — el API las lee de ahí para adjuntarlas, ver §5).

### Sistema de "Tweaks" (panel de personalización en vivo)

Botón flotante **bottom-right** ("✨ Personalizar") abre un drawer con secciones que cambian todo en caliente. Persistencia: `localStorage` clave `gurru:tweaks:v3` (v3 desde 2026-05-08 tarde — el v2 invalidado por cambio de tipo de `carouselHeight` de string a número, ver más abajo).

| Setting          | Valores                                                               | Dónde aplica |
|---|---|---|
| `mode`           | `light` \| `dark`                                                     | `<html data-mode>` → vars en `tokens.css` |
| `palette`        | `azul` \| `azul2` \| `mono` \| `warm` \| `verde`                      | `<html data-palette>` |
| `type`           | `editorial` \| `display-fino` \| `grotesque` \| `miso`                | `<html data-type>`. **`miso` usa `Antonio` de Google Fonts** (la Miso real es de pago — Antonio es la condensed sans free más cercana). |
| `density`        | `amplio` \| `compacto`                                                | `<html data-density>` |
| `carousel`       | `paralelo` \| `infinito` \| `diagonal`                                | leído por `Landing.jsx` desde el contexto, pasado al `<Carousel variant>` |
| `carouselSpeed`  | `1..10` (5 = default, mapea a multiplicador 0.2..2.0)                 | CSS var `--carousel-speed-mult` en `<html style>`. Afecta a las 3 variantes del carrusel **y al marquee**. |
| `carouselHeight` | **número 0.65..1.20** (default `0.82`)                                | CSS var `--carousel-h-scale`. Escala el `max-width` de las cards en `clamp()`. Slider continuo en el panel (antes eran 3 chips compacto/medio/alto — sustituidos por slider porque el cliente quería control fino). |
| `uiScale`        | **número 0.85..1.30** (default `1.0`)                                 | CSS var `--ui-scale`. Escala header (padding + nav font), logo (img + brand text), `.btn` (padding + font) y `.nav-cta`. **No** toca el hero ni los `<h2>` — esos llevan su propio escalado responsive. |
| `marquee`        | `sansplana` \| `display` \| `condensada` \| `mono`                    | `<html data-marquee>`. Default `sansplana` = Manrope 700 + `transform: scaleY(0.82)` para "achatar" la fuente. |
| `accent`         | hex custom o `null`                                                   | `r.style.setProperty('--accent', ...)`. Picker tiene 7 presets incl. `#3b435c`. |
| `motion`         | `full` \| `reduced`                                                   | `<html data-motion="reduced">` desactiva animaciones (regla en `extras.css`, también pisa el `transform: scaleY` del marquee). |

#### Paletas
- **`azul`** (default) — Azul AG + neutros claros, fondo `#f5f3ee`.
- **`azul2`** — fondo `#3b435c` (el navy intermedio que pidió el cliente). Esquema oscuro: texto crema, accent celeste-grisáceo. Funciona en light y dark mode.
- **`mono`** — monocromo con acento azul AG.
- **`warm`** — cálido (madera/crema) + acento navy.
- **`verde`** — sage + bosque, pensado para branding de mobiliario en madera.

Botón **Reset** abajo del drawer vuelve a `DEFAULTS` y limpia los overrides de `--accent`, `--carousel-speed-mult` y `--carousel-h-scale`.

Implementación:
- `tweaks/TweaksContext.jsx` — `Provider` + hook `useTweaks()` + `applyToRoot()`. La función `speedToMultiplier(level)` y la tabla `HEIGHT_TO_SCALE` viven aquí.
- `tweaks/TweaksPanel.jsx` — UI: FAB + drawer slide-in (framer-motion). Cierra con Escape o clic en el overlay. Las secciones se construyen desde un array `SECTIONS` (chips), con secciones especiales para el slider de velocidad y el picker de acento.

### Carrusel del home

`components/Carousel.jsx` con 3 variantes (`paralelo` / `infinito` / `diagonal`). El **paralelo** es 3 filas con direcciones opuestas y velocidades distintas; el infinito es una fila con hover scale; el diagonal está rotado -7°.

Detalles importantes:

- **Truly infinite (sin huecos al final)**: cada fila base se rellena con `pad(items, MIN_PER_ROW=14, items)` antes del duplicado `[...row, ...row]`. La animación CSS `transform: translateX(-50%)` cierra perfecto porque el contenido base supera el ancho del viewport en cualquier monitor razonable. Si en el futuro se mete un solo proyecto con `items.length === 1`, el `pad()` lo replicará 14 veces y seguirá sin huecos.
- **Hover NO pausa la animación** (a diferencia de la primera versión). Lo que pasa al hover es: la **imagen** hace `transform: scale(1.06)` + `box-shadow` profunda, sin tocar el `animation-play-state` de la fila. Reglas en `extras.css`.
- **Click en una imagen del carrusel** abre el `<Lightbox>` con esa imagen ampliada — ver §7.
- **Velocidad y altura controladas por CSS vars** (`--carousel-speed-mult` divide la `animation-duration`, `--carousel-h-scale` multiplica el `max` del `clamp()` de los anchos). Editar el panel de Tweaks → cambia las vars → la animación se reinicia con la nueva duración sin glitch visible.

El carrusel está colocado **arriba del todo** en `Landing.jsx` (clase `carousel-section.top`), antes del marquee y del hero — fue un cambio explícito del cliente: la web entra mostrando obra, no copy.

### Marquee de palabras (`TaglineMarquee`)

Ticker que recorre las palabras `['ver', 'creer', 'diseñar', 'fabricar', 'habitar']` en bucle.

- Todas las palabras en **minúscula** y **sin punto final** (ajuste explícito del cliente).
- **Sin separador-punto** entre palabras: el espacio (`gap`) lo da la flex layout, no un `<span class="dot">`.
- Tipografía controlada por `<html data-marquee>` (4 valores). Default `sansplana` = Manrope 700 + `transform: scaleY(0.82)` para conseguir el efecto "achatado" que pidió el cliente sin necesidad de una fuente comercial.
- **Tamaño deliberadamente contenido** (font-size `clamp(1.1rem, 2vw, 1.7rem)` y padding vertical `.5rem`) — el cliente lo quería como **banner sutil de cierre** del primer viewport, no como sección destacada. Si lo subes mucho deja de caber sobre el fold y rompe la composición Landing → Carrusel → Marquee → (resto al hacer scroll).

### Decisiones de copy (no rephrasear sin consultar)

| Sitio donde aparecía | Antes | Ahora | Por qué |
|---|---|---|---|
| Eyebrow del hero | "Estudio · Santa Rosa" | "Taller · Santa Rosa" | "Estudio" como descriptor de negocio no se entiende bien en Argentina; "taller" es directo. |
| Lede del hero | "Estudio de diseño y fabricación…" | "Taller de diseño y fabricación…" | ídem. |
| Hero: cierre de la lede | "…taller propio y montaje en obra" | "…producción propia y montaje en obra" | Para no repetir "taller" (es la marca + descriptor del negocio). |
| Service 02 | "Taller propio" | "Producción propia" | Mismo motivo. |
| Section eyebrow | "Estudio" | "Taller" | ídem hero. |
| Stat | "años de estudio" | "años de taller" | ídem. |
| Footer h4 | "Estudio" | "Taller" | ídem. |
| Footer | "Estudio desde 2014" | "Desde 2018" | Año real corregido por el cliente + redundancia eliminada. |
| About text | "…en taller propio para garantizar…" | "…en producción propia para garantizar…" | ídem. |
| Expositor lede | "Catálogo de proyectos del estudio" | "Catálogo de proyectos del taller" | ídem. |
| Contacto label | "Estudio" (junto a la dirección) | "Taller" | ídem. |
| Hero CTA copy | "Contanos qué… armamos un anteproyecto sin compromiso." | "Contanos qué… y hablamos." | El cliente rechazó *"anteproyecto sin compromiso"* — frase sobreusada en el rubro. |
| CTA eyebrow | `<span class="eyebrow">Próximo proyecto</span>` | `<span class="eyebrow eyebrow-lg">Próximo proyecto</span>` | El cliente quería más presencia visual — la clase `.eyebrow-lg` lo encaja en una pill con borde. |

Servicios (sección "Lo que hacemos, integralmente"):
- Antes 6 servicios (Diseño, Producción, Obra, Comercios, Container, Decoración).
- **Ahora 4** — el cliente quitó **Container habitable** y **Estilismo y selección** (decoración) por foco comercial.
- "Locales y oficinas" pasó a llamarse **"Amoblamiento integral"**, con copy `"Para gastronomía, retail, consultorios…"` (puntos suspensivos finales son intencionales — invitan a expandir verbalmente al cliente).
- "Montaje y dirección" tiene texto largo nuevo: *"Coordinamos contigo relevamiento de medidas, confección de planos, fabricación e instalación. Todo según tus tiempos."* — antes era una frase genérica.
- El `<h2>` "Lo que hacemos, integralmente" usa `whiteSpace: 'nowrap'` para forzar una sola línea (antes el `maxWidth: 14ch` lo partía tras la coma — feo).

---

## 7. Flow "Quiero algo parecido" — referencia con imagen

Una de las piezas más sensibles del producto: cuando un visitante ve una obra que le gusta, debe poder decir *"quiero esto"* en pocos clicks y dejar al estudio con la imagen + sus datos. Implementado con dos saltos por convención del cliente, no uno solo.

### El flujo en orden

```
[Landing · carrusel]                  [Expositor]                    [Contacto / WhatsApp]
       │                                   │                                │
       ▼                                   ▼                                ▼
  click imagen                        click imagen                   correo / wa.me
       │                                   │                                │
       ▼                                   ▼                                ▼
  <Lightbox>                          <Lightbox>                     • por email:
       │                                   │                            POST /api/contact
       │ CTA: "Ver similares"              │ CTA dual:                  con proyectoRef
       ▼                                   │  · "Por email"             → Stalwart adjunta la
  navigate(                                │  · "WhatsApp"                imagen al correo
   "/expositor                             │                              a gurru999@gmail.com
   ?cat=<categoria>")                      │                            (ver §5)
                                           │                          • por whatsapp:
                                           │                            wa.me/<phone>?text=...
                                           │                            con link público a la imagen
                                           │                            (WA auto-renderiza preview)
```

### Por qué dos saltos

El cliente decidió que la imagen del carrusel **no debe** lanzar contacto directo. La idea es que el visitante navegue *primero* al expositor con el filtro adecuado para que vea variantes del mismo estilo. El compromiso ("contacto") sucede en el expositor, donde el visitante ya tiene contexto. Mantener este flow al cambiar la web — saltar a contacto desde el carrusel sería un error de UX según el brief.

### Componentes que tocan este flow

| Pieza | Archivo | Qué hace |
|---|---|---|
| Lightbox modal | `components/Lightbox.jsx` | Recibe `cta(item) => ReactNode` como prop. La barra inferior la pinta el padre. |
| Landing | `pages/Landing.jsx` | Lightbox con CTA `"Ver similares"` → `navigate('/expositor?cat=<categoria>')`. |
| Expositor | `pages/Expositor.jsx` | Lee `?cat=...` de la URL al montar (`useSearchParams`) y la sincroniza con el filtro activo (replace en el history al cambiar). Lightbox con CTA dual: WhatsApp (link `wa.me/...?text=...`) + Email (`navigate('/contacto?ref=<id>')`). |
| Contacto | `pages/Contacto.jsx` | Lee `?ref=<id>` al montar. Si existe el proyecto en `PROYECTOS`, pinta un banner con miniatura + título + aviso 📎 "Adjuntaremos esta imagen a tu consulta", y pre-rellena `proyecto` y `mensaje` con el contexto del proyecto. Al enviar, incluye `proyectoRef: { id, titulo, img }` en el body del POST. |
| API | `api/server.js` | Sanea `proyectoRef`, llama a `loadReferenceAttachment()` que valida path + carga el archivo de `STATIC_ROOT`, y lo pasa a `nodemailer.sendMail({ attachments: [...] })` con `cid: 'proyectoRef'` para que también aparezca embebido en el HTML del correo. Ver §5. |

### URLs canónicas del flow

- `https://demogurru.unlimited-systems.net/expositor?cat=cocinas` — abre el expositor con filtro de cocinas. Compartible.
- `https://demogurru.unlimited-systems.net/contacto?ref=cocina-blanca` — abre el formulario con la cocina-blanca como referencia. Compartible (la imagen se muestra desde el JSON de proyectos, no se re-fetcha).

### WhatsApp (opción del expositor)

El botón de WhatsApp construye:
```
https://wa.me/5492954272523?text=
  Hola! Vi este proyecto en su web y me gustaría algo similar:%0A%0A
  <titulo>%0A
  https://demogurru.unlimited-systems.net/assets/proyectos/<file>.jpg
```

WhatsApp Web/móvil **no permite preadjuntar archivos** vía wa.me — solo texto. El link a la imagen, sin embargo, dispara la **preview automática** de WA al lado de la conversación cuando el cliente recibe el mensaje. Si en el futuro se quiere mandar el archivo de verdad, hay que pasar a WhatsApp Business API (de pago, mucho más complejo).

### Caso edge: el visitante quita la referencia en `/contacto`

El banner tiene un botón "X" que llama a `setParams(next, { replace: true })` quitando `?ref=` del query y limpiando la referencia del estado. El formulario sigue funcionando normal sin adjuntar nada. El backend, si no recibe `proyectoRef`, manda el correo sin attachment ni fila "Referencia" en la tabla.

---

## 8. Despliegue — `deploy/deploy.ps1`

Requiere PowerShell 7 + clave SSH ya autorizada en el VPS (ver `handover_serverGeneral.md` §2).

```powershell
cd c:\GitHub\gurruchagaweb

pwsh deploy/deploy.ps1 -Step frontend   # build Vite + sube dist/* a /var/www/demogurru/web/
pwsh deploy/deploy.ps1 -Step api        # sube server.js + package.json, npm install, systemd reload+restart
pwsh deploy/deploy.ps1 -Step apache     # sube vhost, a2ensite + a2enmod + reload Apache
pwsh deploy/deploy.ps1 -Step cert       # certbot --apache (idempotente, reemite si toca)
pwsh deploy/deploy.ps1 -Step status     # health checks: apache + systemd + /api/health
pwsh deploy/deploy.ps1 -Step all        # todo lo anterior en orden
```

El script **NUNCA sube el `.env`** del API. Si se rota la pass de Stalwart, hay que editar manualmente `/opt/demogurru-api/.env` y `systemctl restart demogurru-api` — ver §5.

### Iteración típica
1. Editás `web/src/...` o `web/public/assets/...`
2. `pwsh deploy/deploy.ps1 -Step frontend`
3. Ctrl-F5 en el navegador (los assets son `*-immutable`, pero el `index.html` es `must-revalidate` así que el cambio se ve enseguida).

---

## 9. Operación cotidiana

### Health check rápido

```bash
ssh root@185.213.25.188 "
  systemctl is-active demogurru-api demomodular apache2
  curl -fsS http://127.0.0.1:3100/api/health
  curl -fsS -o /dev/null -w 'demomodular construccion=%{http_code}\n' http://127.0.0.1:5101/construccion
  curl -sI https://demogurru.unlimited-systems.net/ | head -1
  curl -sI https://demomodular.unlimited-systems.net/ | head -1
"
```

### Logs

```bash
# demogurru
ssh root@185.213.25.188 "journalctl -u demogurru-api -f"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demogurru-error.log"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demogurru-access.log"

# demomodular (Blazor)
ssh root@185.213.25.188 "journalctl -u demomodular -f"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demomodular-error.log"
ssh root@185.213.25.188 "tail -f /var/log/apache2/demomodular-access.log"
```

### Reiniciar servicios

```bash
ssh root@185.213.25.188 "systemctl restart demogurru-api"
ssh root@185.213.25.188 "systemctl restart demomodular"   # Blazor
```

### Ver la cola de Stalwart cuando el formulario "no envía"

El API devuelve `{ok:true}` solo si Stalwart aceptó MAIL FROM/RCPT TO/DATA con 250s. Si llega ese 200 OK pero el correo no llega a Gmail, el problema está aguas abajo de Stalwart (entrega externa). Ver `handover_mailServer.md` §10–11 (mail-tester y troubleshooting de entrega).

---

## 10. Cosas que NO hacer

- **No abrir 3100/tcp en UFW**. El API debe seguir solo en localhost — Apache es la única puerta.
- **No subir `.env` a git ni con scp**. Ya está en `.gitignore`. La pass de `info@unlimited-systems.net` es la misma del Stalwart admin, exposición pública = compromiso del mail server.
- **No proxiar el subdominio por Cloudflare** (nube naranja). Si activás el proxy, Cloudflare termina TLS y nuestra config de cert + el redirect 80→443 dejan de tener sentido. Mantener **Solo DNS (gris)**.
- **No desplegar el frontend con `npm run dev`** en el VPS — solo bundle estático. Si llega el momento de SSR, valorar pasar a Next y reusar la infra de `unlimited-systems.net`.
- **No editar el vhost en el VPS sin actualizar `deploy/apache-demogurru.conf`** — el siguiente `-Step apache` lo sobrescribe y se pierden los cambios.
- **No relajar el regex de `loadReferenceAttachment()`** sin pensarlo. El whitelist `^/assets/proyectos/[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp)$` impide path traversal incluso si la verificación de `startsWith(STATIC_ROOT)` falla. Defense in depth — no quitar una capa pensando que la otra basta.
- **No mover `STATIC_ROOT` fuera del filesystem del API** sin reescribir `loadReferenceAttachment()` — ver §12 "El bundle del front y el API comparten filesystem".

---

## 11. Roadmap / pendientes

- [ ] Reemplazar las imágenes placeholder de `web/public/assets/proyectos/` por fotografías reales del estudio (cuando arancha las pase). **Crítico** para que los correos con adjunto se vean profesionales — ahora mismo el cliente recibe la imagen del placeholder.
- [ ] Optimizar imágenes en build (`vite-plugin-image-optimizer` o pipeline manual a WebP/AVIF). El `logo-vercreer.png` original pesa 3.8 MB; si las fotos reales pesan parecido, los correos con adjunto van a tardar (Stalwart los acepta pero Gmail penaliza por tamaño).
- [ ] Email de **autorespuesta al cliente** que rellena el formulario ("recibimos tu consulta, te respondemos en 24-48hs"). Hoy solo se manda el aviso interno a `gurru999@gmail.com`.
- [ ] **Detectar el origen del envío** en el correo (carrusel directo vs expositor con referencia vs WhatsApp). Hoy ya se distingue por la fila "Referencia" cuando viene `proyectoRef`, pero podríamos meter un campo extra `source: "carousel"|"expositor"|"contacto-direct"` para analytics.
- [ ] Conectar el `data/site.js` a un **CMS minimalista** si la dueña quiere editar proyectos sin tocar código (Sanity/Decap CMS, o un `projects.json` que se edite por Git).
- [ ] **Open Graph + Twitter cards** específicos por página, especialmente para URLs como `/expositor?cat=cocinas` y `/contacto?ref=...` que son compartibles.
- [ ] **Sitemap.xml** + `robots.txt` + indexar en Google Search Console (cuando deje de ser demo).
- [ ] **Migración a dominio definitivo** si el cliente compra `gurruchaga.ar` o similar — cambiar `ALLOWED_ORIGINS`, `MAIL_FROM` (si quiere remitente nuevo en Stalwart), redirigir desde demogurru.

### Hecho 2026-05-08 (tercera iteración — Modular)

- [x] **Subdominio nuevo `demomodular.unlimited-systems.net`** publicado con cert Let's Encrypt (expira 2026-08-06). Cloudflare gris (Solo DNS).
- [x] **Proyecto Blazor Server (.NET 8)** del visor + market deployado en `/opt/demomodular/` como `demomodular.service` (systemd, User=`www-data`, escucha `127.0.0.1:5101`). Apache reverse-proxy con `proxy_wstunnel` para SignalR (Blazor Interactive Server).
- [x] **DB cambiada de SQL Server a SQLite en producción** (mismo schema EF Core; `appsettings.Production.json` con `DatabaseProvider=Sqlite`, archivo en `/var/lib/demomodular/modular.db`). Dev local sigue usando SqlServer (`DESKTOP-G20TCFL\SQLEXPRESS`) sin tocar `appsettings.json`. `OnModelCreating` aplica `decimal(10,2)` solo si `Database.IsSqlServer()`.
- [x] **Gate de "en construcción"** con clave `0007` (pedido del cliente — usar el sitio como estudio de mercado mientras la línea modular se cocina). Middleware en `Program.cs` que redirige todo a `/construccion` salvo allowlist (`/_blazor`, `/_framework`, `/_content`, `/css`, `/js`, `/lib`, `/assets`, `/img`, `/favicon.ico`, `/robots.txt`). Cookie `modular_demo=ok`, HttpOnly, SameSite=Lax, 30 días.
- [x] **Teaser de Modular en la home de demogurru** (entre el "about" y el CTA final). `MODULAR.url` centralizado en `web/src/data/site.js`. Nuevo bloque `.modular-teaser` en `extras.css` con card horizontal + accent dorado en hover. Click → abre demomodular en pestaña nueva.

### Hecho 2026-05-08 (segunda iteración, tarde)

- [x] Copy localizado: "Estudio" → "Taller" en hero, eyebrows, footer, expositor y contacto. "Taller propio" → "Producción propia". Año `desde: 2018`. CTA "armamos un anteproyecto sin compromiso" → "y hablamos".
- [x] Servicios: lista reducida a 4 pilares (eliminados Container y Decoración). Service 03 con copy nuevo más específico. Service 04 renombrado a "Amoblamiento integral" con copy + puntos suspensivos.
- [x] H2 "Lo que hacemos, integralmente" forzado a una línea con `whiteSpace: nowrap`.
- [x] Eyebrow del CTA final pasa a clase `.eyebrow-lg` (más grande, en pill).
- [x] Facebook URL nueva: `profile.php?id=61561938128763`.
- [x] Slider **Tamaño UI** (header + logo + botones, escala 0.85..1.30) → CSS var `--ui-scale` aplicada en selectores específicos vía `calc()`.
- [x] Slider **Altura del carrusel** (continuo 0.65..1.20) sustituye los 3 chips compacto/medio/alto. Tipo cambió de string a number → bump a `gurru:tweaks:v3`.
- [x] Marquee redimensionado: tamaño contenido + padding chico → cabe como "banner sutil de cierre" en el primer viewport (decisión explícita del cliente).
- [x] Padding vertical de la sección del carrusel-top reducido a `clamp(.75rem, 1.5vw, 1.25rem)` — antes era el doble. Esencial para que el marquee entre sobre el fold.

### Hecho 2026-05-08 (primera iteración)

- [x] Carrusel arriba del todo en Landing (clase `.carousel-section.top`).
- [x] Carrusel sin pausa en hover, con zoom-in por imagen + sombra elevada.
- [x] Carrusel **truly infinite** (`MIN_PER_ROW=14`).
- [x] Logo del header → `logo-anagrama.png` (favicon también).
- [x] Click en imagen del carrusel → lightbox grande con la foto.
- [x] Lightbox refactorizado para aceptar `cta(item)` como render prop (Landing y Expositor renderizan distintos CTAs).
- [x] Tweaks panel ampliado: paletas `azul2` + `verde`, tipografía `miso` (Antonio), slider de velocidad 1-10, altura del carrusel (3 niveles), tipografía del marquee (4 opciones), preset `#3b435c` en el picker de acento. Storage migrado a `gurru:tweaks:v2`.
- [x] Marquee: palabras lowercase, sin punto, sin separador-puntito, fuente "achatada" por default vía `transform: scaleY(0.78)`.
- [x] Flow "Quiero algo parecido" (§7): Landing → Expositor con filtro → email con adjunto **o** WhatsApp con link público a la imagen.
- [x] `/api/contact` acepta `proyectoRef`, valida path anti-traversal, lee la imagen de `STATIC_ROOT` y la adjunta al correo (embebida vía `cid` + descargable).

---

## 12. Trampas conocidas / por qué algo es como es

### "El redirect HTTP→HTTPS estaba roto al principio"
Mi vhost `:80` tenía `RewriteEngine On` **dentro del `<Directory>`**, no a nivel vhost. Certbot añadió su `RewriteRule … [R=permanent]` a nivel vhost, pero como rewrite no estaba activo ahí, el rule se silenciaba. Ahora el vhost tiene `RewriteEngine On` arriba + el redirect explícito al final del bloque, replicado en `deploy/apache-demogurru.conf` para que sobreviva re-deploys (certbot solo lo añade la primera vez).

### "Stalwart aparece como `unhealthy` en `docker ps`"
Cosmético. Healthcheck mal calibrado del compose, no afecta a la entrega. Ver `handover_mailServer.md` §9.3 / §10.

### "No abrí el listener 587 STARTTLS en Stalwart"
El backend usa **465 TLS implícito** (`secure: true` en nodemailer). Stalwart de fábrica solo escucha 465, no 587. Si en el futuro un cliente externo necesita 587, hay que crear el listener manualmente en la UI de Stalwart — ver `handover_mailServer.md` §2.

### "El acento custom no aplica a botones primarios oscuros"
Los botones `.btn-primary` usan `--accent-2` (variante profunda), no `--accent`. El picker de Tweaks solo override `--accent`. Es intencional: cambiar `--accent-2` empezaría a tocar contraste y accesibilidad. Si querés botones que tomen el color custom, se puede mapear `--accent-2` también en el picker — pero antes hay que validar contraste con el `--on-accent` (blanco) en cada selección.

### "Las imágenes pesan mucho (3.8 MB el `logo-vercreer.png`)"
Sí. Es de las assets originales del prototipo. Vite copia tal cual. Idealmente: `imagemin` en build, pasarlas a WebP/AVIF, o servir con `<img loading="lazy" srcset>`. Pendiente cuando llegue el material real. **Especialmente importante** ahora que esas mismas imágenes se adjuntan a los correos del formulario (§5 / §7).

### "El bundle del front y el API comparten filesystem"
El API hace `readFile(STATIC_ROOT + img)` para adjuntar la imagen del proyecto al correo. Eso significa que el bundle del front (que coloca los archivos en `/var/www/demogurru/web/assets/proyectos/`) y el API (`/opt/demogurru-api/`) **deben correr en la misma máquina**, o al menos compartir ese path. Si en el futuro se separan (CDN para estático, API en otra máquina o Lambda), hay que cambiar `loadReferenceAttachment()` para bajar la imagen vía HTTPS desde el dominio público — fácil pero hay que recordarlo.

### "Por qué el carrusel se quedaba sin imágenes en monitores anchos"
La animación CSS hace `translateX(-50%)`. Para que el bucle no muestre vacío entre la primera mitad y la segunda mitad duplicada, el contenido base tiene que ser **más ancho que el viewport**. Con 10 proyectos repartidos en 3 filas, cada fila tenía solo ~3-4 cards (~1100px), insuficiente en monitores 1920px+. Fix: `pad(items, 14, items)` repite el array fuente hasta 14 cards mínimo antes del duplicado. Aplica a las 3 variantes (paralelo / infinito / diagonal).

### "Por qué `data-marquee="sansplana"` por default y no `display`"
El cliente pidió "achatar la fuente" del marquee. Miso (la fuente buena para esto) es de pago. La vía gratuita más cercana visualmente es Manrope 700 + `transform: scaleY(0.78)`, que aplana el alto manteniendo ancho. Es lo que hace `[data-marquee="sansplana"]` en `extras.css`. Si más adelante el cliente compra licencia de Miso, sustituir el `font-family` en ese selector y quitar el `transform`.

### "Por qué el carrusel del Landing salta a /expositor en vez de /contacto"
Decisión de UX del cliente: la primera vez que un visitante toca una imagen del Landing **no debe** ir directo a contacto, debe pasar por el expositor para ver variantes del estilo. El compromiso (formulario o WhatsApp) sólo aparece en el lightbox del expositor. Si alguien revierte esto a "carrusel → directo a contacto" estará rompiendo el flow validado. Ver §7.

### "Path traversal en `proyectoRef.img`"
La defensa son **dos capas**: (1) un regex blanco `^/assets/proyectos/[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp)$` que limita el shape del path; (2) tras `path.resolve()`, verificación explícita de que el resultado siga `startsWith(STATIC_ROOT + path.sep)`. Si cualquiera de los dos checks falla, el correo se manda **sin adjunto** y se loguea — nunca se permite leer fuera de la carpeta. No quitar ninguna de las dos defensas pensando que la otra basta.

### "Por qué el slider de UI-scale no escala el hero ni los `<h2>`"
El slider `uiScale` (0.85..1.30) aplica `--ui-scale` solo en selectores explícitos: `.site-header` (padding), `.brand-mark img/span`, `.nav-list a`, `.nav-cta`, `.btn`. **No** toca el `.hero-title` ni los `.h2` porque esos ya usan `clamp()` con su propia escala responsive — multiplicarlos por `--ui-scale` los rompía en pantallas medianas (los `clamp` ya hacían el trabajo). Si en algún momento el cliente pide hero más grande, mejor subir el `var(--fs-mega)` en `tokens.css` que meterlo en el slider de UI.

### "Por qué `--ui-scale` se aplica en `extras.css` y no en `app.css`"
Convención: `app.css` es la base "intacta" del prototipo AI-generado, `extras.css` son las capas que añadimos en este proyecto. Cualquier override que dependa de un setting del panel de Tweaks debe estar en `extras.css` para mantener el `app.css` reusable. Misma razón por la que las reglas `[data-marquee="…"]` viven en `extras.css`.

### "El primer viewport está calibrado a ojo"
El cliente pidió que header + carrusel + marquee entren sobre el fold. Eso solo se sostiene con: paralelo a default-height ≤ 0.85, marquee con padding `.5rem`, padding del `.carousel-section.top` chico. Si alguien sube cualquiera de esos tres valores el marquee se va off-screen en pantallas tipo 1366×768 (laptops Argentina). La calibración no es una constante, es un equilibrio entre 3-4 medidas. Si toca cambiar una, revalidar visualmente al menos en 1366×768, 1440×900 y 1920×1080.

### "El picker de acento no afecta a la paleta `azul2`"
La paleta `azul2` define un `--accent` específico para que tenga contraste sobre el fondo `#3b435c`. Si el visitante elige `azul2` y luego un acento custom claro (rosa polvo, etc.), el contraste contra el fondo oscuro se rompe. No es bug — es por diseño que el override sea mano del usuario. Si quieren forzar combinaciones validadas, habría que mapear pares paleta+acento permitidos en el panel de Tweaks.

---

## 13. Contacto y autoría

- Setup: **Yago** (`yagogurru77@gmail.com`), git `ricardo.delgado`.
- VPS y mail server: ver `handover_serverGeneral.md` y `handover_mailServer.md` (en `c:\GitHub\`).

---

## 14. Modular — `demomodular.unlimited-systems.net`

> Línea nueva de muebles modulares (cocina/baño/placard) que el cliente quiere lanzar. Por decisión suya, mientras la línea termina de cocinarse, el sitio público está **gateado tras una pantalla de "en construcción" con clave `0007`** — la home de demogurru lo enlaza con un teaser explícito ("Estamos desarrollando una línea nueva…") para que sirva de **estudio de mercado**: si un visitante hace clic, ya estamos midiendo intención.

### 14.1 Stack y rol

- **Blazor Server (.NET 8)** con `RazorComponents.AddInteractiveServerComponents()`. Hay 3 páginas reales detrás del gate: `/` (visor de cocina modular interactivo, `Home.razor`), `/ventas` (catálogo tipo market con filtros) y `/producto/{Id}` (detalle).
- **SignalR (`/_blazor`)** es el transporte obligado de Blazor Interactive Server → el vhost Apache lleva `upgrade=websocket` en el `ProxyPass`. Sin eso, los clicks no funcionan.
- **EF Core 8** con doble proveedor: SqlServer en dev local (Yago tiene `DESKTOP-G20TCFL\SQLEXPRESS`), **SQLite en producción** (`/var/lib/demomodular/modular.db`). Decisión consciente: la BD es de demo, no quiero meter una database más en el MS SQL Server compartido del VPS, y SQLite = un archivo = backup trivial.

### 14.2 Selección de proveedor de DB en runtime

```csharp
var dbProvider = builder.Configuration["DatabaseProvider"] ?? "SqlServer";
if (dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddDbContextFactory<AppDbContext>(o => o.UseSqlite(connStr));
else
    builder.Services.AddDbContextFactory<AppDbContext>(o => o.UseSqlServer(connStr));
```

`appsettings.json` (committeado) usa SqlServer y la cadena `DESKTOP-G20TCFL\SQLEXPRESS`. `appsettings.Production.json` (también committeado, no hay secrets) sobrescribe con `DatabaseProvider=Sqlite` y la conexión SQLite. El servicio systemd corre con `ASPNETCORE_ENVIRONMENT=Production` → carga ambos.

`AppDbContext.OnModelCreating` aplica `HasColumnType("decimal(10,2)")` solo si `Database.IsSqlServer()` — SQLite no tiene tipos decimales nativos y EF emite warning si se le pasa.

### 14.3 Gate de "en construcción" (clave `0007`)

Implementado como **middleware HTTP + dos endpoints minimal API** en `Program.cs`. **Sin** Identity, sin Auth de ASP.NET — overkill para un demo y crearía fricción.

- **Cookie**: `modular_demo=ok`, HttpOnly, SameSite=Lax, MaxAge 30 días, Path=/, Secure auto en HTTPS.
- **Allowlist** (siempre pasa, sin cookie): `/construccion`, `/unlock`, `/_blazor`, `/_framework`, `/_content`, `/css`, `/js`, `/lib`, `/assets`, `/img`, `/favicon.ico`, `/robots.txt`.
- **Resto**: si no hay cookie válida, `Response.Redirect("/construccion")`.

```csharp
app.Use(async (ctx, next) => {
    var path = ctx.Request.Path.Value ?? "/";
    bool allowed = path.Equals("/construccion", OrdinalIgnoreCase) ||
                   path.Equals("/unlock", OrdinalIgnoreCase) ||
                   path.StartsWith("/_blazor", OrdinalIgnoreCase) || /* … */;
    if (allowed) { await next(); return; }
    if (ctx.Request.Cookies.TryGetValue("modular_demo", out var v) && v == "ok") {
        await next(); return;
    }
    ctx.Response.Redirect("/construccion");
});
```

`MapGet("/construccion")` devuelve un HTML *embedded inline* (sin Razor) — fuente Manrope/Bodoni Moda/JetBrains Mono de Google Fonts, fondo navy con grid de líneas, card central con el campo `clave`, accent dorado `#d0a86c`. Si la URL trae `?e=1` muestra "Clave incorrecta".

`MapPost("/unlock")` valida `clave == "0007"`, setea la cookie y redirige a `/`. Si no, redirige a `/construccion?e=1`.

Ambos endpoints llevan `.DisableAntiforgery()` porque son cross-cutting: el form de la página de construcción es HTML puro, no Razor (no hay token disponible). El riesgo CSRF aquí es nulo — el peor caso de un POST cross-site con `clave=0007` es… que se desbloquee la página de construcción, que es exactamente la intención.

### 14.4 Layout en el VPS

```
/opt/demomodular/                       # publish output (binarios .NET 8 framework-dependent)
  ├── ModularKitchen.dll
  ├── appsettings.Production.json
  └── ...
/var/lib/demomodular/modular.db         # SQLite — owned por www-data
/etc/systemd/system/demomodular.service
/etc/apache2/sites-available/demomodular.unlimited-systems.net.conf
/etc/apache2/sites-available/demomodular.unlimited-systems.net-le-ssl.conf  # certbot
```

Logs:
- API: `journalctl -u demomodular -f`
- Apache: `/var/log/apache2/demomodular-{access,error}.log`

### 14.5 Topología de red

```
Internet → 443/80 → Apache → vhost demomodular.unlimited-systems.net
                              ├── /.well-known/...   → /var/www/demomodular/acme/...
                              └── /                  → http://127.0.0.1:5101/
                                                       (con upgrade=websocket para SignalR)
                                          ↑
                                          demomodular.service (User=www-data)
                                            dotnet /opt/demomodular/ModularKitchen.dll
                                            ASPNETCORE_ENVIRONMENT=Production
                                            ASPNETCORE_URLS=http://127.0.0.1:5101
```

Mismo patrón que `unlimited-web` (Next.js en :3000), distinto puerto.

### 14.6 systemd unit

`/etc/systemd/system/demomodular.service` (origen: `MODULAR/deploy/demomodular.service`):

```ini
[Service]
User=www-data
WorkingDirectory=/opt/demomodular
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5101
Environment=DOTNET_ROOT=/usr/share/dotnet
ExecStart=/usr/bin/dotnet /opt/demomodular/ModularKitchen.dll
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/demomodular /opt/demomodular
```

`ReadWritePaths` es crítico — sin él, `ProtectSystem=strict` impide que SQLite escriba en `/var/lib/demomodular/`. Y `/opt/demomodular` está incluido porque ASP.NET puede querer escribir keys de DataProtection ahí (warning visible en logs si se quita).

### 14.7 Vhost Apache

```apache
<VirtualHost *:443>
    ServerName demomodular.unlimited-systems.net
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass /.well-known/acme-challenge/ !
    ProxyPass / http://127.0.0.1:5101/ upgrade=websocket   ← SignalR
    ProxyPassReverse / http://127.0.0.1:5101/
    RequestHeader set X-Forwarded-Proto "https"
    ...
</VirtualHost>
```

`upgrade=websocket` es lo que hace que `proxy_wstunnel` se active automáticamente para conexiones de Blazor Interactive Server. Si se quita, las páginas cargan pero los clicks no responden (ningún componente es interactivo). El módulo `proxy_wstunnel` ya está habilitado en este Apache para otros usos.

### 14.8 Despliegue — `MODULAR/deploy/deploy.ps1`

```powershell
cd c:\GitHub\gurruchagaweb

pwsh MODULAR/deploy/deploy.ps1 -Step publish   # dotnet publish + tar + scp + restart service
pwsh MODULAR/deploy/deploy.ps1 -Step service   # solo (re)instala el systemd unit
pwsh MODULAR/deploy/deploy.ps1 -Step apache    # sube vhost + a2ensite + reload
pwsh MODULAR/deploy/deploy.ps1 -Step cert      # certbot --apache (idempotente)
pwsh MODULAR/deploy/deploy.ps1 -Step status    # health check
pwsh MODULAR/deploy/deploy.ps1 -Step all       # service + apache + publish + cert + status
```

`-Step publish` es el día a día: compila para `linux-x64 framework-dependent`, lo empaqueta en tar.gz, lo sube y reinicia el servicio. ~10 segundos en total. Después de cada deploy, el servicio re-seedea la BD si está vacía (`db.Database.EnsureCreated()` + `SeedData.SeedAsync(db)` en `Program.cs`). Si la BD ya tiene datos, el seed es idempotente por slug/label.

### 14.9 Teaser desde demogurru

`web/src/data/site.js` exporta `MODULAR = { nombre, url, descriptor }`.

`web/src/pages/Landing.jsx` añade una `<section className="modular-teaser">` entre el "about" (con `bg-elev`) y la sección final del CTA. El elemento `<motion.a>` enlaza a `MODULAR.url` con `target="_blank" rel="noopener"`. Estilos en `web/src/styles/extras.css` bajo el bloque `/* Teaser de la línea nueva "Modular" */`. El bloque respeta `[data-motion="reduced"]` (apaga las transiciones).

Decisión consciente: **no añadir un item de nav "Modular" al header**. El cliente quiere medir intención; un nav-item lo bagatelizaría. La card en mitad del scroll es lo bastante visible y tiene el mismo nivel de jerarquía visual que las secciones de contenido del taller, no más.

### 14.10 Cambiar la clave o quitar el gate

Cambiar la clave: editar la constante `DemoKey = "0007"` en `MODULAR/ModularKitchen/Program.cs` y redeploy (`-Step publish`). Si querés invalidar todas las cookies activas a la vez, además cambiá la constante `GateValue = "ok"` por otro literal (`"v2"` por ej.) — las cookies existentes dejan de matchear y todo el mundo vuelve a ver la pantalla de construcción.

Quitar el gate cuando la línea esté lista: borrar el `app.Use(async (ctx, next) => …)` del middleware y los dos `MapGet("/construccion")` / `MapPost("/unlock")`. La cookie queda huérfana en los navegadores que ya la tenían (no daña). Conviene quitar también el `<section className="modular-teaser">` de `Landing.jsx` o, mejor, **cambiar el copy del teaser** para reflejar que ahora sí está abierto (el cliente probablemente quiera mantener la llamada visual, sólo cambia el mensaje).

### 14.11 Trampas conocidas

- **Avisos de tar `time stamp X is N seconds in the future`** al hacer scp del tarball: cosmético, viene del skew de reloj entre el portátil de Yago y el VPS (zonas distintas + drift). Los archivos se extraen bien.
- **`HEAD /construccion` devuelve 405** desde Apache: `MapGet` solo acepta GET. No es un bug de producción (los navegadores hacen GET). Si en algún check externo se quiere usar HEAD, cambiar a `MapMethods("/construccion", new[] { "GET", "HEAD" }, …)`.
- **No abrir 5101/tcp en UFW**. El servicio escucha solo en `127.0.0.1`. Apache es la única puerta.
- **No subir `appsettings.Development.json` al VPS**. El publish lo incluye (`dotnet publish` lo copia tal cual), pero como `ASPNETCORE_ENVIRONMENT=Production`, ASP.NET no lo carga. Si en el futuro alguien pone secrets en Development, *sí* importaría — moverlos a `Properties/launchSettings.json` o a User Secrets en su lugar.
- **El cliente borra la cookie y vuelve a ver "en construcción"**. Eso es exactamente la intención. Si querés persistencia más allá de borrar cookies (ej. recordar al cliente final indefinidamente), habría que pasar a otro mecanismo (token en URL, login con email, etc.) — pero hoy no merece la pena.
- **SQLite + Blazor Server + dos pestañas a la vez**: SQLite serializa escrituras. Si en el futuro se mete una página que escriba mucho concurrente (ej. checkout), revisar el modo journal (`Cache=Shared` ya está en la connection string). Para sólo lectura del catálogo + pocas escrituras de seed, no hay problema.

### 14.12 Cosas que NO hacer

- **No mover el SQLite a `/opt/demomodular/`** (donde están los binarios) "por simplicidad". Cada `-Step publish` borra esa carpeta y la repuebla → perderías la BD. Por eso vive en `/var/lib/demomodular/` (estándar Linux para state).
- **No quitar `upgrade=websocket`** del vhost. Sin SignalR, Blazor Interactive Server no es interactivo y los clicks no hacen nada (el fallback a long-polling depende de configuración cliente que no estamos forzando).
- **No cambiar `User=www-data`** en el systemd unit por algo más restrictivo sin actualizar `chown` de `/opt/demomodular` y `/var/lib/demomodular/`. Si se hiciera, también habría que asegurar que los certificados de DataProtection se persisten en algún lugar al que el nuevo usuario pueda escribir.
- **No cargar contenido sensible en Modular** mientras el gate sea solo `0007`. La clave es trivial — alguien que la consigue (la pasamos por WhatsApp a posibles clientes) la puede compartir. Para datos serios, usar Identity de verdad.
