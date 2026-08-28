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
  - `ESTUDIO.instagram` (desde 2026-07-03: `@gurruchaga3d`, tomado del front legacy; pendiente confirmar con arancha). Alimenta **dos** consumidores: el enlace discreto del footer (columna Contacto) y la fila de Instagram en Contacto. Vacío = ninguno se renderiza (sin enlace roto).
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
- **Hover pausa SOLO la fila señalada** (tarea #294). La pausa vive en cada fila (`MarqueeRow` para paralelo/infinito, `DiagonalRow` para diagonal), con una instancia propia de `useAutoplayInteraction()` por fila: parar una fila para mirar una obra no congela a sus hermanas. Antes el hook se llamaba una sola vez en `Carousel` y su `isPaused` se propagaba a las tres filas. En diagonal la pausa es la clase `is-autoplay-paused` **en la propia fila** (`app.css`: `.cv-diagonal .row.is-autoplay-paused`); ese bloque debe quedar **después** de `.row.r1`/`.row.r2` o el atajo `animation` lo pisaría en silencio. Además, al hover la imagen hace `transform: scale(1.06)` + `box-shadow` profunda.
- **Click en una imagen del carrusel** abre el `<Lightbox>` con esa imagen ampliada — disparador del flow "Quiero algo parecido".
- **Velocidad y altura controladas por CSS vars**: `--carousel-speed-mult` divide `animation-duration`, `--carousel-h-scale` multiplica el `max` del `clamp()` de los anchos.
- **Posición**: arriba del todo en `Landing.jsx` (clase `.carousel-section.top`), antes del marquee y del hero. Cambio explícito del cliente: la web entra mostrando obra, no copy.

#### Progresiones de obra — `components/ProgressionShowcase.jsx` (tarea #295)

Rework completo del bloque de progresiones (sustituye a la secuencia destacada #146, al carrusel multi-proyecto #258 y al expositor de procesos #248, siguiendo la referencia visual del cliente). Todo vive en la sección intro de la home:

- **Visor destacado** (columna derecha de la intro): `ProgressionPlayer` con la progresión fijada por el cliente — la **cocina en termoformado Blanco Snow** (`destacada: true` en `site.js`). Fundido automático cada 3,8 s, clic/swipe para avanzar, puntos DENTRO del marco (abajo, centrados) para ir a una fase, badge «Fase NN/NN» arriba a la izquierda.
- **Galería de miniaturas** (debajo del bloque intro, mismo fondo, ancla `id="procesos"`): las otras 7 obras como tarjetas-botón (`ProgressionCard`). Cada miniatura **rota sola** sus fases (periodo propio `4200 + (i % 4) * 350` ms para que la parrilla no vaya sincronizada), con badge «N fases», mini-puntos de progreso y CTA «Ver progresión». Con 7 obras (3+3+1), la última tarjeta se centra vía `:last-child:nth-child(3n+1)`.
- **Popup** (`ProgressionModal`): al pulsar una tarjeta se abre el player en grande con la misma dinámica (autoplay + clic avanza + puntos). Cierra con X, Esc o clic en el fondo; incluye CTA «Ver más en {categoría}» → `/expositor?cat=…` (respeta el flow «Quiero algo parecido»: nunca lanza contacto directo).

**Encuadre**: el marco es SIEMPRE 4:3 y la foto se muestra **entera** (`object-fit: contain` sobre `#000`): las bandas negras rellenan lo que falte, nunca se recorta la obra (pedido explícito del cliente — el paquete mezcla retratos 1122×1402, apaisados 1448×1086 y panorámicas 1672×941, incluso dentro de una misma colección).

Los datos viven en `PROGRESIONES` / `PROGRESION_DESTACADA` / `PROGRESIONES_GALERIA` (`data/site.js`); las 42 imágenes en `public/assets/progresiones/<id>-NN.webp` (fases renumeradas correlativas; el orden de cada secuencia se validó visualmente al importar — los sufijos «(n)» del paquete original traían huecos y regeneraciones fuera de orden). Los títulos (`tipo` + `materiales`) provienen de los nombres de carpeta que entregó la clienta; no parafrasear. La pausa por interacción reutiliza `useAutoplayInteraction` (una instancia por pieza); `motion=reduced` apaga autoplay y transiciones pero mantiene la navegación manual. Estilos: bloque «Progresiones de obra» en `extras.css`.

### Marquee de palabras — `components/TaglineMarquee.jsx`

Ticker que recorre `['ver', 'creer', 'diseñar', 'fabricar', 'habitar']` en bucle.

- Todas las palabras en **minúscula** y **sin punto final** (ajuste explícito del cliente).
- **Sin separador-punto** entre palabras: el espacio (`gap`) lo da la flex layout, no un `<span class="dot">`.
- Tipografía controlada por `<html data-marquee>` (4 valores). Default `sansplana` = Manrope 700 + `transform: scaleY(0.82)`.
- **Tamaño deliberadamente contenido**: `font-size: clamp(1.1rem, 2vw, 1.7rem)` + padding vertical `.5rem`. El cliente lo quiere como **banner sutil de cierre** del primer viewport — si lo subes deja de caber sobre el fold y rompes la composición Landing → Carrusel → Marquee → (resto al scroll).

### Instagram — enlace discreto en el footer (2026-07-04)

Enlace de texto `Instagram · @gurruchaga3d` en la columna Contacto de `SiteFooter.jsx` (donde antes estuvo Facebook), más la fila de Instagram en la página Contacto. Se oculta si `ESTUDIO.instagram` está vacío. **Historia**: el 2026-07-03 se probó un banner prominente bajo el carrusel (`InstagramBanner.jsx`); Yago pidió revertirlo el 2026-07-04 — Instagram debe ser discreto y al pie, no protagonista arriba. El componente y su CSS (§ "Banner Instagram" en `extras.css`) se eliminaron; no recrear el banner sin pedido explícito.

### Firma "Unlimited" — `UnlimitedSignature` en `components/SiteFooter.jsx` (2026-07-03)

Franja mínima (~90px) tras el footer en las tres páginas: *"¿Te gustó esta web?" · "La hicimos en Unlimited Systems" · botón "Conocé Unlimited →"* hacia `https://unlimited-systems.net` (nueva pestaña). Estética **deliberadamente ajena** al sitio: fondo `#0a0a0a` fijo y sans de sistema, con colores hardcoded para que NO reaccione a paletas ni al panel de Tweaks. Vive dentro de `SiteFooter.jsx` (mismo fragment) para aparecer en toda la web sin tocar cada página. CSS en `extras.css` (§ "Firma Unlimited").

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
| Secuencias de proceso | `web/src/pages/Landing.jsx`, datos en `web/src/data/site.js` |
| Enlace Instagram (footer, columna Contacto) | `web/src/components/SiteFooter.jsx` |
| Firma Unlimited (tras el footer, todas las páginas) | `web/src/components/SiteFooter.jsx` (función `UnlimitedSignature`) |
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

---

## Iteración #297 (2026-08-17) — peticiones del cliente sobre gurru-test

- `components/SelectField.jsx` — desplegable propio (listbox accesible) que
  sustituye al `<select>` nativo en el formulario: el menú del sistema no
  respetaba la estética y era ilegible sobre el fondo oscuro.
- `components/AttachmentsField.jsx` — subida de fotos/planos con botón grande,
  drag & drop, miniaturas y compresión en canvas (1920 px, JPEG 0.82) antes de
  mandar los archivos en base64 al API.
- `hooks/useInView.js` — los pases de progresión sólo corren cuando están a la
  vista y rebobinan a la fase 01 al salir; ritmo 2200 ms (tarjetas 2600 ms) y
  pausa de 7 s tras tocar.
- Galería de obras a **dos** columnas, sin rótulos "N fases"; carátula del
  destacado idéntica a las de la galería.
- `.lightbox` pasa a columna (foto → título → barra apaisada): la barra ya no
  tapa el título.
- `.services` usa `grid-template-rows: subgrid` para que las cuatro cards
  alineen numerito, título, párrafo y foto.
- Disclaimer del carrusel repaginado (rayitas laterales sólo ≥721 px).

Detalle y verificación: `docs/changelog/2026-08-17_mejoras-cliente-297.md`.
