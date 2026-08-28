# 2026-08-17 — Mejoras y correcciones del cliente sobre gurru-test (tarea #297)

Nueve peticiones que arancha mandó por WhatsApp (capturas en el adjunto de la
ficha). Todas se aplican al frontend `web/`, salvo la última, que además toca
`api/server.js`.

## Qué se cambió

1. **Galería de obras a dos columnas** (`.progression-grid`). A tres columnas
   se leía como un collage desordenado — el cliente no quiere collage en las
   obras. Con 7 progresiones, la última se centra a caballo de las dos.
2. **Carátula del proyecto destacado igual que las de la galería**
   (`Landing.jsx` + `.progression-meta`): tipo en display italic y materiales
   en mono, misma forma y tipografía que las tarjetas de obra.
3. **Barra de acciones del lightbox apaisada y debajo del título**
   (`app.css .lightbox` pasa a columna; `.lightbox-cta` deja de flotar). Antes
   tapaba el título de la foto, sobre todo en móvil.
4. **Desplegable propio en el formulario** (`components/SelectField.jsx`): el
   `<select>` nativo abría el menú del sistema, ajeno a la estética y casi
   ilegible en escritorio sobre fondo oscuro. Listbox accesible (teclado,
   `aria-*`), mismos tokens que el resto de campos.
5. **Disclaimer del carrusel repaginado**: "Proyectos realizados **por
   AG-studio**" en una línea y la coletilla debajo. En móvil se partía en dos
   columnas descuadradas; ahora es texto corrido centrado y las rayitas
   laterales sólo aparecen a partir de 721 px.
6. **Pase de las progresiones más rápido, arranque en la fase 01 y pausa al
   tocar** (`ProgressionShowcase.jsx` + `hooks/useInView.js`): intervalo
   3800 → 2200 ms (tarjetas 4200 → 2600 ms), el visor rebobina y se detiene
   mientras está fuera de pantalla (el cliente percibía el orden como
   aleatorio porque llevaba rodando desde la carga) y tras un clic/tap se
   queda parado 7 s en vez de 1,5 s.
7. **Fuera los rótulos "N fases"**: badge de la miniatura eliminado, el badge
   del visor pasa a "Fase 03" (sin total) y los textos "Obra real · N fases ·
   clic para avanzar" pierden el conteo.
8. **Cards de servicios alineadas** (`.services` con `grid-template-rows:
   subgrid`): numerito, título, párrafo y foto arrancan a la misma altura en
   las cuatro aunque un título ocupe dos líneas. Fallback con `min-height` en
   el `h3` para navegadores sin subgrid.
9. **El formulario acepta adjuntos** (`components/AttachmentsField.jsx` +
   `api/server.js`): botón grande y explicativo ("Sumá fotos, planos o
   medidas"), arrastrar y soltar, miniaturas y borrado por archivo.

## Adjuntos: cómo funciona

- **Cliente**: hasta 6 archivos, 8 MB por archivo y 15 MB en total (JPG, PNG,
  WEBP, GIF, HEIC o PDF). Las fotos se reescalan en el navegador a 1920 px y
  JPEG 0.82 antes de enviarse (una foto de móvil pasa de ~4 MB a ~400 KB). Si
  el navegador no sabe decodificar el formato, se manda el original.
- **Transporte**: van en el JSON del POST `/api/contact` en base64. Es la vía
  que evita añadir dependencias (multer/busboy) al API — el VPS despliega sin
  `npm install` fiable y el volumen es pequeño.
- **API**: `/api/contact` tiene su propio límite de body (24 MB); el resto de
  rutas siguen con los 32 kB de siempre. `parseAdjuntos()` valida whitelist de
  MIME, tamaño por archivo y total, sanea el nombre (`path.basename` +
  filtrado, nunca se escribe a disco) y comprueba los **magic bytes** para que
  el MIME declarado no mienta. Lo que no pasa el filtro se descarta en
  silencio; la respuesta devuelve `adjuntos: <n>` aceptados.
- El correo lista los archivos recibidos (texto y HTML) y el asunto indica
  cuántos son.

## Verificación en vivo (2026-08-17)

Build servido en local (`web/dist`) con un API de pruebas apuntando a un SMTP
falso, conducido con Chromium por el servicio `jarvis-uicheck`:

- Disclaimer: "PROYECTOS REALIZADOS POR AG-STUDIO" en una línea + coletilla,
  también a 390 px.
- Destacado: entra en `FASE 01`, avanza a `FASE 02` en 2,6 s y, tras un clic,
  se queda en la misma fase 4,5 s después.
- Galería: 2 columnas, cero rótulos "N fases" (`.progression-card-count` no
  existe en el DOM).
- Servicios a 1200 px: los cuatro párrafos y las cuatro fotos arrancan a la
  misma altura.
- Lightbox (1440 y 390): el título ya no queda tapado; la barra va debajo, con
  los dos botones en fila.
- Contacto: el desplegable propio abre, lista las 7 opciones y selecciona
  ("Placards / vestidor"); envío real desde el navegador → correo recibido con
  el tipo de proyecto elegido.
- Adjuntos: POST con 4 archivos (webp legítimo, PDF con nombre
  `../../etc/passwd`, `.exe` y un PNG falso) → aceptados 2, el PDF saneado a
  `passwd.pdf`, ejecutable y PNG mentiroso rechazados; el correo llega con los
  dos adjuntos y su listado.

Capturas antes/después en `shared/entregas/297-mejoras-gurru-test/`.

## Zonas grises / pendiente

- La instancia de API de **staging** (`demogurru-api-test`, `:3101`,
  `/opt/demogurru-api-test`) es de root: hay que copiarle el `server.js` nuevo
  para que gurru-test acepte adjuntos. Mientras no se haga, el formulario de
  staging funciona igual **sin** archivos, y con archivos devuelve error.
- La subida de archivos se ejerció por HTTP con el payload exacto que arma el
  front (el checker de UI disponible no puede rellenar un `input[type=file]`).
  El resto del formulario sí se ejerció con navegador.
- Sigue pendiente el email de autorespuesta al visitante (ahora tendría más
  sentido: acusa recibo de los archivos).

## Repaso adversario (mismo día)

Un verificador independiente ejerció los nueve criterios contra el build (2
columnas medidas en 660px+660px, intervalos del pase de 2118/2215 ms, dispersión
0 px en la alineación de las cards, sin solape en el lightbox, y una batería de
ataques al endpoint: ELF disfrazado de PNG, script como imagen, `../../` en el
nombre, 30 MB de payload → 413, y superar los topes por archivo/total). Veredicto
APTO. Se corrigieron los tres defectos menores que encontró:

- `AttachmentsField.jsx` — el cleanup de las object URLs capturaba el array del
  primer render (deps `[]`) y no revocaba nada al desmontar; ahora usa una ref
  con la lista viva.
- `Contacto.jsx` — el mensaje de éxito contaba los archivos del navegador; ahora
  usa el `adjuntos` que devuelve el API y, si el servidor descartó todos, invita
  a mandarlos por WhatsApp en vez de decir que llegaron.
- `SelectField.jsx` — `role="combobox"` y `aria-activedescendant` en el botón
  (donde vive el foco), no en el `<ul>`.
