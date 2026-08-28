# 2026-07-04 — Revertido el banner de Instagram: enlace discreto en el footer

## Qué

1. **Eliminado `web/src/components/InstagramBanner.jsx`** (banner prominente bajo el
   carrusel de la home, añadido el 2026-07-03 en el commit `7054878`) junto con su
   import/uso en `Landing.jsx` y su bloque CSS en `extras.css` (§ "Banner Instagram").
2. **Añadido enlace discreto** `Instagram · @gurruchaga3d` en la columna Contacto de
   `SiteFooter.jsx` (posición análoga a donde estuvo Facebook antes del 7054878).
   Guardado por `ESTUDIO.instagram` — handle vacío = no se pinta, mismo contrato que
   la fila de la página Contacto.
3. Comentario de `ESTUDIO.instagram` en `site.js` actualizado (ya no existe el banner).

## Por qué

Pedido de Yago (backlog #8): el logo/enlace de Instagram debe volver a ser **discreto y
al final de la web**, no protagonista arriba. La fila de Instagram en la página Contacto
y la firma "Powered by Unlimited" (`UnlimitedSignature`) **quedan como están** — ambas
aprobadas.

## Zonas grises

- El handle `@gurruchaga3d` sigue **pendiente de confirmar con arancha** (TODO en
  `site.js` desde el 2026-07-03).
- Build verificado en el VPS con `copyPublicDir: false` (el seccomp del servicio de
  Jarvis mata `fchown`, que libuv usa al copiar `public/`). El build completo con copia
  de assets debe hacerse desde el portátil, donde también corre el visual-check
  (`scripts\visual-check.ps1`) antes del deploy `pwsh deploy/deploy.ps1 -Step frontend`.
- No recrear el banner prominente sin pedido explícito del cliente/Yago.
