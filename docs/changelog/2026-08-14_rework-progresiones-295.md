# 2026-08-14 — Rework total de las progresiones de obra (tarea #295)

## Qué

La muestra de progresiones de la home se rehace entera según la referencia
visual del cliente: **marco destacado arriba** (con sus fases pasando solas y
puntos dentro de la caja) y **miniaturas de las demás obras debajo**, que
rotan solas y se amplían en un **popup** con la misma dinámica (autoplay +
clic para avanzar). Desaparecen el carrusel multi-proyecto de la intro
(numeritos 01–08, tarea #258) y la sección «expositor de procesos» con
selector lateral (tarea #248).

Además se importa el paquete nuevo «montaje obra» (zip adjunto a la ficha):
**8 progresiones, 42 imágenes**, que sustituye por completo a los antiguos
`assets/destacados` (5) y `assets/procesos` (30).

## Por qué

Pedido directo de Yago (boceto adjunto en la ficha #295):
- Proyecto destacado fijo: **cocina en termoformado Blanco Snow** en la caja
  de arriba.
- Miniaturas profesionales con llamada a la acción clara («Ver progresión»,
  badge «N fases», mini-puntos de progreso, hover con elevación).
- **Las imágenes pasan solas en todos los casos** (destacado, miniaturas y
  popup) — verificado en vivo.
- **Encuadre siempre idéntico**: marco 4:3 y `object-fit: contain` sobre
  negro. Bandas negras cuando el formato no coincide; **nunca se recorta la
  imagen** (antes se perdía parte con `cover`). El paquete mezcla retratos,
  apaisados y panorámicas incluso dentro de una misma colección.

## Cambios

- `web/src/components/ProgressionShowcase.jsx` (nuevo): `ProgressionPlayer`
  (visor reutilizado por destacado y popup), `ProgressionCard` (miniatura con
  rotación propia desincronizada) y `ProgressionModal` + `ProgressionGallery`.
- `web/src/data/site.js`: `PROGRESIONES` / `PROGRESION_DESTACADA` /
  `PROGRESIONES_GALERIA` sustituyen a `DESTACADOS`, `PROCESOS` y
  `PROYECTOS_CARRUSEL_PRINCIPAL`. Títulos = `tipo` + `materiales` tomados de
  los nombres de carpeta de la clienta (p. ej. «Cocina · Termoformado Blanco
  Snow y melamina Petribí»).
- `web/src/pages/Landing.jsx`: la intro usa el player destacado + pie de
  título; la galería va justo debajo dentro de la misma sección (ancla
  `id="procesos"` conservada). Eliminados `TransformationSequence`,
  `FeaturedProjectCarousel`, `ProcessShowcase` y la sección
  `.processes-section`. El lightbox del carrusel superior ya no concatena
  `DESTACADOS`.
- `web/src/styles/extras.css`: bloque nuevo «Progresiones de obra» (player,
  fase-badge, dots, tarjetas, popup, responsive, `data-motion`); retirados los
  bloques `transformation-*`, `featured-*` y `process*`.
- `web/public/assets/progresiones/` (nuevo): 42 webp (`<id>-NN.webp`, q82,
  3,7 MB total — los PNG originales pesaban 78 MB). Retirados
  `assets/destacados/` y `assets/procesos/`.

## Orden de las fases (decisión documentada)

Los ficheros del zip traen sufijos «(n)» con huecos, duplicados y
regeneraciones fuera de orden. Se renumeró correlativo 01..NN por colección
**validando visualmente** la narrativa obra → montaje → terminado. Casos
especiales: `cocina-negro-matt` (dos «(3)»: el de las 12:42 es embalaje →
fase 02) y `libreria-everest` («(3)(1)» va tras «(3)»).

**Revisión del reinicio (mismo día)**: re-verificado todo el paquete contra el
zip por similitud de píxeles (42/42 emparejados 1:1, sin huecos) y corregidas
dos secuencias que rompían la narrativa:
- `cocina-negro-matt`: la antigua fase 04 (cocina vestida con taburetes y
  leña) iba ANTES que la 05 (misma cocina aún sin vestir, nevera con
  pegatinas y cajas de obra). Permutadas 04↔05.
- `libreria-everest`: la antigua fase 02 era el salón ya terminado con la
  estantería a medio vestir, delante de dos fases de montaje. Reordenado a
  obra (01) → montaje (02, ex-03) → estantería montada vacía (03, ex-04) →
  salón amueblado a medio vestir (04, ex-02) → estantería llena (05).

## Pruebas (en vivo, jarvis-uicheck sobre build servida en local)

Conducido con Chromium real contra `http://127.0.0.1:8095` (build de
producción): autoplay del destacado (FASE 01→02 sin tocar nada), apertura del
popup, autoplay dentro del popup, clic-para-avanzar (02→03), cierre con X,
salto directo con los puntos (dot 3 → FASE 03), rotación autónoma de las
miniaturas (fase 1→2) y CTA al expositor. Capturas desktop y móvil en
`/home/jarvis/shared/entregas/295-rework-progresiones/`.

## Zonas grises / avisos

- **Bug cazado en la prueba en vivo**: en `ProgressionCard` el spread
  `{...interactionProps}` tras `onClick` sobrescribía el handler de abrir el
  popup (el hook trae su propio `onClick`). Se compone a mano
  (`pauseClick` + `onOpen`). Si se añade otro botón con ese hook, cuidado con
  el orden de props.
- Las miniaturas arrancan todas en fase 01 (obra vacía): decisión deliberada,
  coherente con el titular «Del espacio vacío al mueble terminado»; en
  segundos la parrilla se desincroniza sola (periodos distintos por tarjeta).
- El `ok` global de jarvis-uicheck es `false` con `baseUrl` externo (exige
  `loggedIn` del panel); para webs de cliente hay que mirar `steps` y
  `observations`. Mejora futura del servicio, apuntada.
- **Build en la jaula del agente**: `vite build` moría con «Bad system call»
  en `copyPublicDir` (`fs.cp` usa `copy_file_range`, bloqueada por seccomp).
  Workaround permanente: `web/vite.config.agent.mjs` (build sin copyPublicDir)
  + copia de `public/` con Python (`shutil` sin sendfile). El deploy del
  ejecutor no está afectado (usa `npm run build` normal fuera de la jaula).
  Esto desbloquea la validación visual que la tarea #294 daba por imposible.
