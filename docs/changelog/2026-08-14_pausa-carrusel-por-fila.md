# 2026-08-14 — La pausa del carrusel pasa a ser por fila (tarea #294)

## Qué
Al pasar el ratón por una fila del carrusel del home se detenían **todas** las filas.
Ahora se detiene únicamente la fila señalada; las demás siguen rodando.

## Por qué
`useAutoplayInteraction()` se llamaba **una sola vez** en `Carousel` y su `isPaused`
se pasaba como prop `interactionPaused` a las tres filas. El contenedor
`.carousel-interaction` cubría las tres, así que el hover en cualquiera pausaba el
conjunto. Causa raíz: la pausa vivía en el nivel equivocado del árbol.

## Cambios
- `web/src/components/Carousel.jsx`
  - `MarqueeRow` (paralelo e infinito, animación por `requestAnimationFrame`) llama
    ahora al hook él mismo; se elimina la prop `interactionPaused` y el ref `hover`
    manual (redundante con el `isPaused` del hook).
  - Los 4 handlers de puntero se componen explícitamente (pausa del hook + lógica de
    arrastre) por desestructuración; el resto (`enter/leave`, `click`, `touch`) por spread.
  - Nuevo `DiagonalRow`: envuelve cada fila de la variante diagonal (animación CSS) y
    le pone la clase `is-autoplay-paused` a sí misma.
  - `Carousel` ya no llama al hook; conserva el div `.carousel-interaction` como
    contenedor neutro.
- `web/src/styles/app.css`: selector `.carousel-interaction.is-autoplay-paused .cv-diagonal .row`
  → `.cv-diagonal .row.is-autoplay-paused`.

## Zonas grises / avisos
- El bloque `.cv-diagonal .row.is-autoplay-paused` debe permanecer **después** de
  `.row.r1`/`.row.r2` (misma especificidad; el atajo `animation` posterior resetearía
  `animation-play-state` y la pausa dejaría de funcionar sin error visible).
- Reanudación con el retardo de 1500 ms del hook (igual que antes, cuando lo imponía el
  contenedor). En móvil, un scroll vertical sobre una fila puede dejarla parada ~1,5 s;
  si molesta, `useAutoplayInteraction(0)` en `MarqueeRow`.
- El div `.carousel-interaction` ya no tiene ni handlers ni reglas CSS: candidato a
  limpieza futura, se deja por si vuelve a hacer falta como punto de scoping.
- Pendiente de a11y (preexistente, no introducido aquí): el foco de teclado sobre una
  tarjeta no pausa la fila. Se cerraría añadiendo `onFocusCapture`/`onBlurCapture` al
  hook, lo que beneficiaría también a las secuencias de Landing.
- Validación: `npx vite build` transforma los 1953 módulos sin errores; el build no
  puede completarse en el entorno del agente (limitación de sandbox preexistente,
  "Bad system call" también sin cambios). Falta la comprobación visual manual en
  Windows (`scripts\visual-check.ps1` no captura animación).
