# 2026-07-24 · Nuevos carruseles de proceso (tarea backlog #248)

## Qué

Integración en la home de las siete colecciones nuevas del RAR adjunto a la
tarea. La octava colección (el placard) ya era la secuencia destacada existente
y no se duplica.

### Cambios

- Nueva sección «Del espacio vacío al mueble terminado» después del bloque
  «Lo que hacemos».
- Selector de siete proyectos y visor único de proceso:
  - clic en cada proyecto para cambiar de colección;
  - clic en la imagen para avanzar de fase;
  - botones numerados para elegir una fase concreta;
  - fundido entre fases y avance manual para facilitar la comparación;
  - navegación manual intacta con movimiento reducido.
- Composición responsive: lista lateral en escritorio y selector horizontal con
  `scroll-snap` en móvil.
- 30 imágenes PNG convertidas a WebP `q82 preset picture`: 2,55 MB en total.
- Nombres públicos descriptivos y genéricos, sin trasladar los nombres de
  cliente presentes en las carpetas originales.
- Orden de cada colección determinado por el número entre paréntesis del nombre
  original. Las etapas ausentes en dos carpetas no se recrean.

## Datos y assets

- Datos: `PROCESOS` en `web/src/data/site.js`.
- UI: `ProcessShowcase` y `TransformationSequence` en
  `web/src/pages/Landing.jsx`.
- Estilos: bloque «Expositor de procesos» en `web/src/styles/extras.css`.
- Imágenes: `web/public/assets/procesos/*.webp`.

## Validación

- Vite transformó los 1.952 módulos sin errores de código; el empaquetado llegó
  al final de la transformación y volvió a caer con el `SIGSYS` conocido de
  Rollup en esta jaula.
- Servidor Vite local: 30/30 WebP nuevos respondieron HTTP 200.
- Prueba interactiva real con Chromium mediante `jarvis-uicheck`:
  - selección de «Cocina blanca integral»;
  - clic sobre el marco: fase 1 → fase 2;
  - selector numerado: salto a fase 4;
  - selección de «Armario con banco» y clic: fase 1 → fase 2;
  - ambos flujos devolvieron `ok=true`.
- Capturas y reportes JSON:
  `/home/jarvis/shared/entregas/backlog-248-nuevos-carouseles-proceso/`.
