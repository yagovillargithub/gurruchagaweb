# 2026-07-03 — Banner de Instagram en la home + firma "Unlimited" tras el footer

## Qué

1. **Banner de Instagram** (`web/src/components/InstagramBanner.jsx`, nuevo):
   bloque prominente justo debajo del carrusel de la home. Ícono Instagram
   (lucide) sobre chip con el degradado oficial IG, "¡Seguinos en Instagram!",
   subtítulo y CTA con el handle que abre el perfil en pestaña nueva. En mobile
   (≤640px) pasa a columna centrada. Todo el banner es un solo enlace.
2. **`ESTUDIO.instagram`** en `web/src/data/site.js` pasa de `''` a
   **`@gurruchaga3d`** — handle encontrado en el front legacy
   (`Front Generado con IA/js/data.js:35`). Al rellenarlo, la fila de Instagram
   de Contacto (que ya existía condicionada) aparece sola. **TODO en código:
   confirmar con arancha que la cuenta sigue activa.**
3. **Firma "Unlimited"** (`UnlimitedSignature`, dentro de
   `web/src/components/SiteFooter.jsx`): franja ~90px tras el footer en las 3
   páginas. "¿Te gustó esta web?" / "La hicimos en Unlimited Systems" / botón
   pill "Conocé Unlimited →" a `https://unlimited-systems.net`
   (`target="_blank" rel="noopener"`). Fondo `#0a0a0a` fijo + sans de sistema:
   estética a propósito ajena al universo AG, inmune a paletas/Tweaks.
4. CSS de ambos bloques al final de `web/src/styles/extras.css`.
5. Doc actualizada: `docs/02-frontend-web-vite.md` (secciones nuevas + tabla de
   ficheros clave + nota en Datos editables).

## Por qué

Pedido del operador: el público objetivo (argentino rural/semirural) vive en
Instagram → protagonismo del perfil nada más cargar. Y una firma-portal
discreta hacia Unlimited Systems como gancho comercial. No existía ninguna
mención previa "Powered by Unlimited" en el código (se verificó en src y en el
bundle `dist` desplegado): la firma es neta nueva, ya nacida en formato sutil.

## Zonas grises

- **Handle sin confirmar**: `@gurruchaga3d` viene del prototipo legacy. Si
  arancha usa otra cuenta, cambiar solo `ESTUDIO.instagram` en `site.js`.
- **Build Vite no ejecutado en el VPS**: `node_modules` no existe allí y el
  sandbox de Jarvis no tiene egreso a `registry.npmjs.org` (por diseño,
  `IPAddressDeny` + allowlist — ver `UNLIMITED_jarvis/brain/SELFHEAL.md` §4).
  Verificado en su lugar: sintaxis JSX con `tsc --noEmit` (0 errores) y balance
  de llaves CSS. **Pendiente**: `npm run build` + `visual-check.ps1` en la
  máquina del operador antes de desplegar.
- El primer viewport (header + carrusel + marquee sobre el fold en 1366×768)
  NO se toca: el banner entra después del disclaimer del carrusel, empuja lo
  que viene detrás, no lo que está encima.
