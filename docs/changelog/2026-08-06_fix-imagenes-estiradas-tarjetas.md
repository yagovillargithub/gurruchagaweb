# 2026-08-06 — Fix: fotos estiradas en vertical en las tarjetas del home

## Qué pasaba

En `gurruchagaweb.com`, las 4 fotos de la sección **"Lo que hacemos, integralmente"**
salían deformadas: ancho de la columna (~316 px) pero **1086 px de alto**, es decir
la altura intrínseca del fichero. Aspecto de "imagen rota / alargada".

## Causa raíz

En el pase de imágenes a WebP (`docs/changelog/2026-07-23_optimizacion-imagenes-webp.md`)
se añadieron atributos `width="1448" height="1086"` a los `<img>` para evitar CLS.

Los atributos `width`/`height` de HTML son **presentation hints**: entran en la cascada
con la prioridad más baja del origen autor, pero **solo los pisa una regla CSS que
declare esa misma propiedad**. `.service-photo` declaraba `width: 100%` pero **no
declaraba `height`**, así que:

- el `width: 100%` del CSS ganaba al `width="1448"` → ancho 316 px ✅
- el `height="1086"` del atributo sobrevivía intacto → alto 1086 px ❌
- con `height` ya resuelto, el `aspect-ratio: 4 / 3` **no se aplica** (solo actúa
  cuando una de las dos dimensiones es `auto`), y `object-fit: cover` no recorta:
  la imagen se estira

El reset global de `app.css` era `img { display: block; max-width: 100%; }` — sin
`height: auto`, que es justo la mitad del par canónico `max-width:100% / height:auto`.

## Qué se ha hecho

1. **Fuente** (`web/src/styles/app.css`, línea del reset):
   `img { display: block; max-width: 100%; height: auto; }` + comentario del porqué.
   Aplicado en el clon del VPS `/home/jarvis/workspace/gurruchagaweb` (que es el
   **origen real del bundle desplegado**) y en el clon local `C:\GitHub\gurruchagaweb`.
   Arregla de raíz cualquier `<img>` presente o futura con atributos de dimensión;
   las reglas que sí fijan altura (`.brand-mark img`, `.cv-* img`, `.mosaic .tile img`,
   `.transformation-frame img`, `.contact-row .icon`) son más específicas y no cambian.

2. **Producción — publicación quirúrgica, no rebuild**:
   - `/var/www/demogurru/web/assets/index-C-vU9l5t.css` → copia parcheada como
     `index-C-vU9l5t-imgfix.css` (única diferencia: `;height:auto` en el reset).
   - `index.html` apunta al fichero nuevo (backup en `index.html.bak-20260806`).
   - Nombre nuevo **obligatorio**: los assets se sirven con
     `Cache-Control: public, max-age=31536000, immutable`; parchear el fichero
     existente no habría llegado a quien ya lo tenía en caché.

## Zona gris importante

**No se hizo `deploy.ps1 -Step frontend`** a propósito:

- El repo local `C:\GitHub\gurruchagaweb` está **bifurcado y por detrás** del clon del
  VPS (local aún tiene las tarjetas en `.png` de 2 MB, sin WebP, sin Instagram en
  header, sin secuencia de transformación). Desplegar desde local **regresaría** el sitio.
- El clon del VPS tiene trabajo **construido pero sin publicar** desde el 24-jul
  (`docs/changelog/2026-07-24_nuevos-carouseles-proceso.md`, imágenes
  `web/public/assets/procesos/*.webp`, `dist/` del 24-jul ≠ lo servido del 23-jul).
  Un rebuild habría publicado esa funcionalidad sin que nadie lo haya pedido.

Por eso el fix se publicó como parche de CSS aislado. **El próximo build real desde el
clon del VPS ya incluirá el `height: auto` en fuente** y podrá borrar el
`index-C-vU9l5t-imgfix.css`.

## Verificación

`scripts/visual-check.ps1 -BaseUrl https://gurruchagaweb.com -NoServerStart` sobre
`/`, `/expositor`, `/contacto` (1440×900) y `/` en 375×812:

- tarjetas del home en 4:3 correcto; alto de la home 5751 px → 4868 px
- el logo MODULAR del teaser también se recuperó (se veía como caja blanca vacía)
- `/expositor` (17135 px) y `/contacto` idénticos antes/después — sin regresión

## Rollback

```bash
ssh root@185.213.25.188 'cd /var/www/demogurru/web && cp -a index.html.bak-20260806 index.html'
```
