# Frontend — `web/` Vite + React

> Frontend de demogurru: 3 rutas (Landing, Expositor, Contacto), sistema de Tweaks live, carrusel multivariante, marquee, lightbox compartido, decisiones de copy del cliente. Sin TypeScript a propósito.
> Última actualización: 2026-05-18.

---

## Resumen

`web/` es el bundle Vite + React 18 del sitio público del taller. Se compila a estático y se sirve por Apache desde `/var/www/demogurru/web/`. Tiene un **sistema de personalización en vivo** ("Tweaks") con 11 settings persistidos en `localStorage`, un **carrusel infinito** de obras con 3 variantes, un **marquee** de palabras con tipografía configurable y un **lightbox compartido** que en Landing va al expositor y en Expositor lanza contacto (flow "Quiero algo parecido", ver `03-api-contacto-node.md` §flow).

## Estado actual

### Stack y build

- **Vite 5** + `@vitejs/plugin-react` — HMR, ESM real, build optimizado.
- **React 18** + **react-router-dom 6** (BrowserRouter). 3 rutas: `/`, `/expositor`, `/contacto`. SPA fallback en Apache.
- **framer-motion** — entrance animations + drawer del panel de Tweaks + lightbox.
- **lucide-react** — iconos.
- **Sin TypeScript** a propósito (decisión: mantener JSX simple, igual que el prototipo).
- **`npm run dev`** → Vite en `:5173` con proxy `/api → 127.0.0.1:3100` (definido en `vite.config.js`).
- **`npm run build`** → `dist/` (~100 KB JS gzip + 6 KB CSS gzip).

### Datos editables — `src/data/site.js`

Centraliza todo lo "configurable sin tocar componentes":

- `ESTUDIO`: nombre, WhatsApp (`5492954272523`), `whatsappLink`, redes, email, ciudad, etc. Cambiar aquí y redesplegar `-Step frontend`.
- `CATEGORIAS`: ids y labels de filtros del Expositor.
- `PROYECTOS`: array de `{ id, titulo, categoria, anio, img, lugar }`. Las imágenes referenciadas con `/assets/proyectos/<file>.jpg` viven en `web/public/assets/proyectos/` (y, una vez deployadas, en `/var/www/demogurru/web/assets/proyectos/` — el API las lee de ahí para adjuntarlas al correo).
- `MODULAR`: `{ nombre, url, descriptor }`. El teaser de la home enlaza a `MODULAR.url` con `target="_blank"`.

### Sistema de "Tweaks" — panel de personalización en vivo

Botón flotante **bottom-right** ("✨ Personalizar") abre un drawer con secciones que cambian todo en caliente. Persistencia: `localStorage` clave **`gurru:tweaks:v3`**. (v3 desde 2026-05-08 tarde — el v2 invalidado por cambio de tipo de `carouselHeight` de string a número.)

| Setting          | Valores                                                  | Dónde aplica |
|---|---|---|
| `mode`           | `light` \| `dark`                                        | `<html data-mode>` → vars en `tokens.css` |
| `palette`        | `azul` \| `azul2` \| `mono` \| `warm` \| `verde`         | `<html data-palette>` |
| `type`           | `editorial` \| `display-fino` \| `grotesque` \| `miso`   | `<html data-type>`. **`miso` usa `Antonio` de Google Fonts** (Miso real es de pago; Antonio es la condensed sans free más cercana). |
| `density`        | `amplio` \| `compacto`                                   | `<html data-density>` |
| `carousel`       | `paralelo` \| `infinito` \| `diagonal`                   | leído por `Landing.jsx` desde el contexto |
| `carouselSpeed`  | `1..10` (5 default, mapea a multiplicador 0.2..2.0)      | CSS var `--carousel-speed-mult`. Afecta a las 3 variantes y al marquee. |
| `carouselHeight` | número **0.65..1.20** (default `0.82`)                   | CSS var `--carousel-h-scale`. Slider continuo (antes 3 chips, cliente quería control fino). |
| `uiScale`        | número **0.85..1.30** (default `1.0`)                    | CSS var `--ui-scale`. Escala header, logo, `.btn`, `.nav-cta`. **No** toca hero ni `<h2>` (esos llevan `clamp()` propio). |
| `marquee`        | `sansplana` \| `display` \| `condensada` \| `mono`       | `<html data-marquee>`. Default `sansplana` = Manrope 700 + `transform: scaleY(0.82)`. |
| `accent`         | hex custom o `null`                                      | `r.style.setProperty('--accent', ...)`. Picker con 7 presets incl. `#3b435c`. |
| `motion`         | `full` \| `reduced`                                      | `<html data-motion="reduced">` desactiva animaciones. |

#### Paletas

- **`azul`** (default) — Azul AG + neutros claros, fondo `#f5f3ee`.
- **`azul2`** — fondo `#3b435c` (navy intermedio que pidió el cliente). Esquema oscuro: texto crema, accent celeste-grisáceo.
- **`mono`** — monocromo con acento azul AG.
- **`warm`** — cálido (madera/crema) + acento navy.
- **`verde`** — sage + bosque, branding pensado para mobiliario en madera.

Botón **Reset** abajo del drawer vuelve a `DEFAULTS` y limpia overrides de `--accent`, `--carousel-speed-mult`, `--carousel-h-scale`.

Implementación: `tweaks/TweaksContext.jsx` (Provider + hook `useTweaks()` + `applyToRoot()` + `speedToMultiplier()` + `HEIGHT_TO_SCALE`); `tweaks/TweaksPanel.jsx` (FAB + drawer slide-in con framer-motion, cierre por Escape u overlay; secciones se construyen desde un array `SECTIONS`).

### Carrusel del home — `components/Carousel.jsx`

Tres variantes (`paralelo` / `infinito` / `diagonal`):
- **Paralelo**: 3 filas con direcciones opuestas y velocidades distintas.
- **Infinito**: una fila con hover scale.
- **Diagonal**: rotado -7°.

Detalles importantes:

- **Truly infinite (sin huecos al final)**: cada fila base se rellena con `pad(items, MIN_PER_ROW=14, items)` antes del duplicado `[...row, ...row]`. La animación CSS `transform: translateX(-50%)` cierra perfecto porque el contenido base supera el ancho del viewport. Si en el futuro hay un solo proyecto (`items.length === 1`), el `pad()` lo replicará 14 veces y seguirá sin huecos.
- **Hover NO pausa la animación**. Lo que pasa al hover: la imagen hace `transform: scale(1.06)` + `box-shadow` profunda, sin tocar `animation-play-state`.
- **Click en una imagen del carrusel** abre el `<Lightbox>` con esa imagen ampliada — disparador del flow "Quiero algo parecido".
- **Velocidad y altura controladas por CSS vars**: `--carousel-speed-mult` divide `animation-duration`, `--carousel-h-scale` multiplica el `max` del `clamp()` de los anchos.
- **Posición**: arriba del todo en `Landing.jsx` (clase `.carousel-section.top`), antes del marquee y del hero. Cambio explícito del cliente: la web entra mostrando obra, no copy.

### Marquee de palabras — `components/TaglineMarquee.jsx`

Ticker que recorre `['ver', 'creer', 'diseñar', 'fabricar', 'habitar']` en bucle.

- Todas las palabras en **minúscula** y **sin punto final** (ajuste explícito del cliente).
- **Sin separador-punto** entre palabras: el espacio (`gap`) lo da la flex layout, no un `<span class="dot">`.
- Tipografía controlada por `<html data-marquee>` (4 valores). Default `sansplana` = Manrope 700 + `transform: scaleY(0.82)`.
- **Tamaño deliberadamente contenido**: `font-size: clamp(1.1rem, 2vw, 1.7rem)` + padding vertical `.5rem`. El cliente lo quiere como **banner sutil de cierre** del primer viewport — si lo subes deja de caber sobre el fold y rompes la composición Landing → Carrusel → Marquee → (resto al scroll).

### Lightbox compartido — `components/Lightbox.jsx`

Modal que recibe `cta(item) => ReactNode` como render prop. El padre decide qué CTA pintar:

- **Landing**: `"Ver similares"` → `navigate('/expositor?cat=<categoria>')`.
- **Expositor**: CTA dual → WhatsApp (`wa.me/...?text=...`) o Email (`navigate('/contacto?ref=<id>')`).

Detalle del flow completo en [`03-api-contacto-node.md`](03-api-contacto-node.md).

## Decisiones clave documentadas (zonas grises del operador)

### Decisiones de copy (NO rephrasear sin consultar)

| Sitio | Antes | Ahora | Por qué |
|---|---|---|---|
| Eyebrow del hero | "Estudio · Santa Rosa" | "Taller · Santa Rosa" | "Estudio" no se entiende bien en Argentina; "taller" es directo. |
| Lede del hero | "Estudio de diseño y fabricación…" | "Taller de diseño y fabricación…" | ídem. |
| Cierre lede hero | "…taller propio y montaje en obra" | "…producción propia y montaje en obra" | No repetir "taller" (es marca + descriptor). |
| Service 02 | "Taller propio" | "Producción propia" | ídem. |
| Section eyebrow | "Estudio" | "Taller" | ídem. |
| Stat | "años de estudio" | "años de taller" | ídem. |
| Footer h4 | "Estudio" | "Taller" | ídem. |
| Footer | "Estudio desde 2014" | "Desde 2018" | Año real corregido por cliente. |
| About text | "…en taller propio para garantizar…" | "…en producción propia…" | ídem. |
| Expositor lede | "Catálogo de proyectos del estudio" | "…del taller" | ídem. |
| Contacto label | "Estudio" (junto a dirección) | "Taller" | ídem. |
| Hero CTA | "Contanos qué… armamos un anteproyecto sin compromiso." | "Contanos qué… y hablamos." | Cliente rechazó *"anteproyecto sin compromiso"* (sobreusada en el rubro). |
| CTA eyebrow | `<span class="eyebrow">` | `<span class="eyebrow eyebrow-lg">` | Cliente quería más presencia visual → `.eyebrow-lg` lo encaja en pill con borde. |

### Servicios — "Lo que hacemos, integralmente"

- Antes 6 servicios (Diseño, Producción, Obra, Comercios, Container, Decoración).
- **Ahora 4** — cliente quitó **Container habitable** y **Estilismo y selección** (decoración) por foco comercial.
- "Locales y oficinas" → **"Amoblamiento integral"** con copy `"Para gastronomía, retail, consultorios…"` (puntos suspensivos intencionales — invitan a expandir verbalmente).
- "Montaje y dirección": texto largo nuevo *"Coordinamos contigo relevamiento de medidas, confección de planos, fabricación e instalación. Todo según tus tiempos."*
- `<h2>` "Lo que hacemos, integralmente" usa `whiteSpace: 'nowrap'` para forzar una línea (antes `maxWidth: 14ch` lo partía tras la coma — feo).

### Otras decisiones

- **Sin TypeScript**: el prototipo original era JSX simple; añadir TS habría sido refactor sin valor de cliente. Si en el futuro crece, valorar.
- **`extras.css` separado de `app.css`**: `app.css` es la base "intacta" del prototipo AI-generado; `extras.css` son las capas añadidas por nosotros. Cualquier override que dependa de Tweaks debe ir en `extras.css` para mantener `app.css` reusable.
- **El picker de acento NO afecta a `--accent-2`** (la variante profunda que usan `.btn-primary`). Intencional: cambiar `--accent-2` empezaría a tocar contraste y accesibilidad. Si se quiere botones que tomen color custom, hay que mapear `--accent-2` también, pero antes validar contraste con `--on-accent` (blanco).
- **`uiScale` NO escala hero ni `<h2>`**: esos usan `clamp()` con su propia escala responsive; multiplicar por `--ui-scale` los rompía en pantallas medianas.
- **Carrusel arriba**: cliente quiere que la web entre con obra, no copy.
- **Carrusel del Landing va a `/expositor`, no a `/contacto`**: decisión UX validada del cliente. Compromiso (formulario/WA) solo desde el lightbox del Expositor. No revertir.
- **El primer viewport está calibrado a ojo**: header + carrusel + marquee deben entrar sobre el fold en 1366×768 (laptops Argentina). Sostenido por: paralelo default-height ≤ 0.85, marquee `padding: .5rem`, `.carousel-section.top` con padding chico. Si tocas uno de los tres, revalidar visualmente en 1366×768, 1440×900 y 1920×1080.

## Ficheros clave

| Qué | Dónde |
|---|---|
| Datos editables (proyectos, estudio, Modular) | `web/src/data/site.js` |
| Entry point + Router + TweaksProvider | `web/src/main.jsx` |
| Landing (hero, carrusel, marquee, servicios, about, teaser, CTA) | `web/src/pages/Landing.jsx` |
| Expositor (filtros + grid + lightbox dual CTA) | `web/src/pages/Expositor.jsx` |
| Contacto (banner `?ref=`, formulario, POST a `/api/contact`) | `web/src/pages/Contacto.jsx` |
| Sistema Tweaks (estado + hook + applyToRoot) | `web/src/tweaks/TweaksContext.jsx` |
| Panel de Tweaks (UI drawer) | `web/src/tweaks/TweaksPanel.jsx` |
| Carrusel multivariante | `web/src/components/Carousel.jsx` |
| Marquee | `web/src/components/TaglineMarquee.jsx` |
| Lightbox compartido | `web/src/components/Lightbox.jsx` |
| Tokens base (vars CSS, paletas) | `web/src/styles/tokens.css` |
| Layout base (prototipo intacto) | `web/src/styles/app.css` |
| Capas del operador (Tweaks overrides, teaser Modular) | `web/src/styles/extras.css` |

## Pendiente / no implementado

- Optimización de imágenes en build (`vite-plugin-image-optimizer` o pipeline a WebP/AVIF). El `logo-vercreer.png` original pesa 3.8 MB.
- Sustituir imágenes placeholder por fotos reales (bloqueado: arancha debe pasarlas).
- Open Graph + Twitter cards por página, especialmente para URLs compartibles (`/expositor?cat=cocinas`, `/contacto?ref=...`).
- CMS minimalista (Sanity / Decap CMS / `projects.json` editado por Git) si la dueña quiere editar proyectos sin tocar código.

## Referencias cruzadas

- **API contacto y flow "Quiero algo parecido"**: [`03-api-contacto-node.md`](03-api-contacto-node.md).
- **Teaser de Modular en Landing**: [`04-modular-blazor.md`](04-modular-blazor.md) §teaser.
- **Despliegue del frontend (`-Step frontend`)**: [`05-despliegue.md`](05-despliegue.md).
- **Validación visual antes de cerrar tarea**: [`06-protocolo-pruebas.md`](06-protocolo-pruebas.md).
- **Histórico**: [`changelog/2026-05-07_bootstrap-vite-y-api.md`](changelog/2026-05-07_bootstrap-vite-y-api.md), [`changelog/2026-05-08_modular-y-localizacion.md`](changelog/2026-05-08_modular-y-localizacion.md).
