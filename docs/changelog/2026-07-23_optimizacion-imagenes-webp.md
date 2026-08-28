# 2026-07-23 · Optimización de imágenes → WebP (tarea backlog #239)

## Qué
Auditoría y optimización del uso de imágenes del front Vite (`web/`) para reducir
peso y mejorar tiempos de carga / Lighthouse, sin regresiones visuales.

### Cambios
- **PNG pesados → WebP** (conversión con `ffmpeg -c:v libwebp`), actualizando las
  referencias en el código:
  - Fotos de las 4 tarjetas de servicio de la home (`foto-card-*`): lossy q82
    `preset picture`. ~2.1 MB c/u → ~130 KB c/u.
  - Logos del header (`logo-ag-studio`, `logo-arancha-azul`, `logo-arancha-crema`,
    `logo-arancha-variantes`) y `logo-modular-naranja`, `logo-ag-watermark`,
    `icon-whatsapp`.
  - `logo-ag-studio` y `logo-ag-watermark` (transparencia crítica) → **WebP lossless**
    para preservar alfa y nitidez de bordes (este ffmpeg descarta alfa en lossy).
  - `logo-modular-naranja` va sobre tarjeta `background:#fff` → aplanado sobre blanco
    (el fondo crema forma parte del diseño original del logo; sin costura visible).
- **Atributos anti-CLS**: `width`/`height` intrínsecos + `decoding="async"` en las
  fotos de servicio (`.service-photo`, 1448×1086 = 4:3, coherente con el
  `aspect-ratio:4/3` del CSS), `icon-whatsapp` (36×36) y `logo-modular-naranja`.
  El logo del header queda sin `width/height` fijos a propósito: es dinámico
  (varias variantes con distinta proporción) y un ratio fijo daría reserva errónea.
- **Lazy loading**: ya presente en las fotos below-the-fold; se añade `loading="lazy"`
  al logo del teaser Modular. El hero/secuencia de destacados mantiene `eager` en el
  primer frame.
- **Assets muertos eliminados** (sin ninguna referencia en el código): `logo-vercreer.png`
  (3.7 MB), `icon-facebook.png` (208 KB), `logo-marca.png` (76 KB),
  `logo-ag-arancha-azul.png` (200 KB). Se borran también los PNG ya sustituidos por WebP.
- Se conserva `logo-anagrama.png` como favicon (compatibilidad amplia; 46 KB).

### Impacto
- Imágenes efectivamente descargadas por la página: **~8.9 MB → ~0.6 MB (−93%)**.
  Solo la home (4 tarjetas) pasa de ~6.5 MB a ~0.43 MB.
- Payload total del deploy reducido en **~12 MB** (incluye los 4.2 MB de assets muertos).
- Las imágenes del expositor/carrusel (`assets/proyectos/*`, 236 ficheros) y
  `assets/destacados/*` ya eran WebP bien dimensionadas: **no se tocan**.

## Por qué así
- Se sigue el patrón ya existente en el repo (`foto-card-obra.webp` ya estaba en WebP
  con `<img>` plano, sin `<picture>`): WebP es soporte universal en navegadores
  modernos, así que no se añade fallback `<picture>`/PNG. Más simple y consistente.
- Conversión puntual (no pipeline en build) porque instalar un plugin
  (`vite-plugin-imagemin`/sharp) requiere red, no disponible en el sandbox. WebP queda
  como formato commiteado; un pipeline automático en build sigue siendo mejora futura
  opcional.

## Zonas grises / notas
- **El API no se ve afectado**: `loadReferenceAttachment()` solo lee de
  `assets/proyectos/*` (ya WebP, whitelist `(jpe?g|png|webp)` intacta). Ningún asset
  de raíz que toqué es leído por el API.
- **Build de producción**: no se pudo ejecutar `npm run build` en el sandbox del agente
  por seccomp (SIGSYS en el codegen nativo de Rollup 4 — reproducible también sobre el
  código original, ajeno a este cambio). Validación realizada: `vite` transforma los
  1952 módulos sin error (JSX válido), dev server sirve todos los WebP como
  `image/webp` 200, auditoría ref→fichero completa e inspección visual directa de los
  WebP generados. El ejecutor de deploy (`jarvis-projectdeploy`, systemd como `jarvis`)
  compila fuera de ese sandbox y hace health-check + rollback.
