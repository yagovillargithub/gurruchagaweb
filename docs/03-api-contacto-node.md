# API de contacto — `api/` Express + Nodemailer

> Backend mínimo del formulario de contacto de demogurru. Express + nodemailer contra Stalwart self-hosted. Implementa el endpoint `POST /api/contact` con honeypot, rate limit, anti path-traversal y adjuntado opcional de imagen del proyecto referenciado (flow "Quiero algo parecido").
> Última actualización: 2026-05-18.

---

## Resumen

Servicio Node 22 + Express 4 que escucha en `127.0.0.1:3100` (nunca expuesto directo — Apache es la única puerta pública). Recibe POSTs del formulario, valida, **opcionalmente** adjunta la imagen de un proyecto referenciado, manda mail por Stalwart (`info@unlimited-systems.net` → `gurru999@gmail.com`) y devuelve `{ok:true}` o `{ok:false, error}`.

## Estado actual

### Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `GET`  | `/api/health` | `{ok:true, ts}` — sanity check |
| `POST` | `/api/contact` | Recibe formulario, valida, opcionalmente adjunta imagen, envía mail, devuelve `{ok:true}` o `{ok:false, error}` |

### Body aceptado por `/api/contact`

```jsonc
{
  "nombre": "...",                 // 2-120 chars
  "email": "...",                  // regex básico, ≤200
  "telefono": "...",               // opcional, ≤60
  "proyecto": "cocina|living|...", // whitelist PROYECTO_LABELS
  "mensaje": "...",                // 5-4000 chars
  "website": "",                   // honeypot — si viene relleno, ok:true silencioso
  "proyectoRef": {                 // OPCIONAL — viene cuando el visitante hace
    "id":     "cocina-blanca",     //   "Quiero algo parecido" desde el lightbox.
    "titulo": "Cocina blanca…",    // Si pasa el saneo y el archivo existe en STATIC_ROOT,
    "img":    "/assets/proyectos/cocina-blanca-isla.jpg"  // se adjunta al correo.
  }
}
```

### Validaciones y seguridad (`server.js`)

- **Validación de campos**: rangos de longitud explícitos + `isEmail()` regex. Sin librería externa.
- **Honeypot `website`**: si viene relleno, devuelve `{ok:true}` silenciosamente (bot-trap; el bot cree que ha colado).
- **Rate limit**: 8 envíos / 10 min por IP (`express-rate-limit`, `trust proxy: 1` porque venimos detrás de Apache).
- **CORS** restringido a `ALLOWED_ORIGINS` del `.env`.
- **`proyectoRef` saneado**: solo se aceptan `{ id, titulo, img }`, todos strings cortos, `id` debe ser `^[a-z0-9-]+$`.
- **Anti path-traversal en adjunto** (defensa en dos capas — ver decisiones):
  1. **Regex whitelist**: `loadReferenceAttachment()` valida `img` contra `^/assets/proyectos/[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp)$`.
  2. **Verificación post-resolve**: `path.resolve(STATIC_ROOT + img)` y check explícito `result.startsWith(STATIC_ROOT + path.sep)`.
- **Fallo seguro**: si cualquiera de los dos checks falla o el archivo no existe, el correo se manda **sin adjunto** y se loguea warning. Nunca rompe el envío del formulario.

### `.env` del API (NO está en git)

Vive en `/opt/demogurru-api/.env` en producción y en `api/.env` local (gitignored). Permisos prod: `chmod 640 root:www-data` (el systemd corre como `www-data`).

```
PORT=3100
HOST=127.0.0.1
SMTP_HOST=mail.unlimited-systems.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@unlimited-systems.net
SMTP_PASS=lzmW3S!nAebYcVM^                            # ★ misma del admin Stalwart
MAIL_FROM=AG Studio <info@unlimited-systems.net>
MAIL_TO=gurru999@gmail.com
STATIC_ROOT=/var/www/demogurru/web                    # root para resolver imágenes adjuntas
ALLOWED_ORIGINS=https://demogurru.unlimited-systems.net,http://demogurru.unlimited-systems.net
```

Cambiar destinatario o credenciales:

```bash
ssh root@185.213.25.188
nano /opt/demogurru-api/.env       # editar MAIL_TO, SMTP_PASS, STATIC_ROOT…
systemctl restart demogurru-api
journalctl -u demogurru-api -n 20  # confirmar arranque OK
```

### El correo que llega

- `Subject`: `Nuevo contacto · {nombre} · {proyectoLabel}`
- `From`: `AG Studio <info@unlimited-systems.net>`
- `Reply-To`: email del visitante (responder en Gmail le contesta directo).
- HTML editorial (azul AG, Bodoni-style heading) + texto plano de fallback.
- **Si vino con `proyectoRef`**: fila "Referencia" en la tabla del HTML + imagen embebida vía `cid:proyectoRef` (Gmail la pinta inline) + disponible como adjunto descargable.

## Decisiones clave documentadas (zonas grises del operador)

### Flow "Quiero algo parecido" — por qué dos saltos

Cuando un visitante ve una obra en el carrusel y le gusta, el flujo es:

```
[Landing · carrusel]                  [Expositor]                    [Contacto / WhatsApp]
       │                                   │                                │
       ▼                                   ▼                                ▼
  click imagen                        click imagen                   correo / wa.me
       │                                   │                                │
       ▼                                   ▼                                ▼
  <Lightbox>                          <Lightbox>                     • por email:
       │                                   │                            POST /api/contact con
       │ CTA: "Ver similares"              │ CTA dual:                  proyectoRef → Stalwart
       ▼                                   │  · "Por email"             adjunta la imagen al
  navigate(                                │  · "WhatsApp"              correo a gurru999@gmail.com
   "/expositor                             │                          • por whatsapp:
   ?cat=<categoria>")                      │                            wa.me/<phone>?text=...
                                           │                            con link público a la imagen
                                           │                            (WA auto-renderiza preview)
```

**Por qué dos saltos**: el cliente decidió que la imagen del carrusel **no debe** lanzar contacto directo. La idea es que el visitante navegue primero al expositor con el filtro adecuado para ver variantes del mismo estilo. El compromiso (contacto) sucede en el expositor, donde el visitante ya tiene contexto. **Mantener este flow** al cambiar la web — saltar a contacto desde el carrusel sería un error de UX según el brief.

### Componentes que tocan el flow

| Pieza | Archivo | Qué hace |
|---|---|---|
| Lightbox modal | `web/src/components/Lightbox.jsx` | Recibe `cta(item) => ReactNode`. La barra inferior la pinta el padre. |
| Landing | `web/src/pages/Landing.jsx` | Lightbox con CTA `"Ver similares"` → `navigate('/expositor?cat=<categoria>')`. |
| Expositor | `web/src/pages/Expositor.jsx` | Lee `?cat=...` (`useSearchParams`) y sincroniza con filtro activo. Lightbox CTA dual: WhatsApp (`wa.me/...?text=...`) + Email (`navigate('/contacto?ref=<id>')`). |
| Contacto | `web/src/pages/Contacto.jsx` | Lee `?ref=<id>`. Si existe el proyecto en `PROYECTOS`, pinta banner con miniatura + título + aviso 📎 "Adjuntaremos esta imagen a tu consulta", y pre-rellena `proyecto` y `mensaje`. Al enviar, incluye `proyectoRef: { id, titulo, img }` en el body. |
| API | `api/server.js` | Sanea `proyectoRef`, llama a `loadReferenceAttachment()`, lo pasa a `nodemailer.sendMail({ attachments: [...] })` con `cid: 'proyectoRef'`. |

### URLs canónicas del flow

- `https://demogurru.unlimited-systems.net/expositor?cat=cocinas` — expositor con filtro. Compartible.
- `https://demogurru.unlimited-systems.net/contacto?ref=cocina-blanca` — formulario con referencia. Compartible.

### WhatsApp (opción del expositor)

El botón de WhatsApp construye:
```
https://wa.me/5492954272523?text=
  Hola! Vi este proyecto en su web y me gustaría algo similar:%0A%0A
  <titulo>%0A
  https://demogurru.unlimited-systems.net/assets/proyectos/<file>.jpg
```

`wa.me` **no permite preadjuntar archivos** vía link — solo texto. El link a la imagen dispara la **preview automática** de WhatsApp al lado de la conversación cuando el cliente recibe el mensaje. Si en el futuro se quiere mandar el archivo de verdad, hay que pasar a WhatsApp Business API (de pago, mucho más complejo).

### Caso edge: el visitante quita la referencia en `/contacto`

El banner tiene un botón "X" que llama a `setParams(next, { replace: true })` quitando `?ref=` del query y limpiando la referencia. El formulario sigue funcionando sin adjuntar nada. El backend, sin `proyectoRef`, manda el correo sin attachment ni fila "Referencia".

### Defensa anti path-traversal — dos capas, no quitar ninguna

- **Capa 1 (regex)**: limita el shape del path. Solo `/assets/proyectos/<id>.<ext>` con `id` kebab-case ASCII y ext en `jpeg|jpg|png|webp`.
- **Capa 2 (filesystem)**: tras `path.resolve()`, verifica que el resultado siga `startsWith(STATIC_ROOT + path.sep)`.

Si un regex futuro se afloja por error, la capa 2 sigue blindando. Si `STATIC_ROOT` cambia por un valor exótico, la capa 1 ya filtró las rutas raras. **No quitar ninguna** pensando que la otra basta — defense in depth.

### Acoplamiento entre el bundle y el API

El API hace `readFile(STATIC_ROOT + img)` para adjuntar. Eso significa que el bundle del front (`/var/www/demogurru/web/assets/proyectos/`) y el API (`/opt/demogurru-api/`) **deben correr en la misma máquina** o al menos compartir ese path. Si en el futuro se separan (CDN para estático, API en otra máquina o Lambda), hay que cambiar `loadReferenceAttachment()` para bajar la imagen vía HTTPS desde el dominio público.

### Si llega `{ok:true}` del API pero el correo no llega a Gmail

El API devuelve `{ok:true}` solo si Stalwart aceptó MAIL FROM / RCPT TO / DATA con 250s. Si llega ese 200 OK pero el mail no llega, el problema está **aguas abajo de Stalwart** (entrega externa, SPF/DKIM/DMARC, reputación, Gmail spam). Ver [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md) (mail-tester y troubleshooting).

## Ficheros clave

| Qué | Dónde |
|---|---|
| Implementación del API | `api/server.js` |
| Dependencias y scripts | `api/package.json` |
| Ejemplo de `.env` para arrancar local | `api/.env.example` |
| `.env` real prod | `/opt/demogurru-api/.env` (en VPS, NO en git) |
| systemd unit | `deploy/demogurru-api.service` |

## Pendiente / no implementado

- Email de **autorespuesta al visitante** que rellena el formulario ("recibimos tu consulta, te respondemos en 24-48hs"). Hoy solo se manda aviso interno a `gurru999@gmail.com`.
- Campo extra `source: "carousel"|"expositor"|"contacto-direct"` para analytics. Hoy se distingue por la fila "Referencia" cuando hay `proyectoRef`.
- Listener 587 STARTTLS en Stalwart (de fábrica solo escucha 465). Si en el futuro un cliente externo necesita 587, ver [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md) §2.

## Referencias cruzadas

- **Frontend que dispara el flow**: [`02-frontend-web-vite.md`](02-frontend-web-vite.md) §Lightbox, §Carrusel.
- **Despliegue del API (`-Step api`)**: [`05-despliegue.md`](05-despliegue.md).
- **Mail server (Stalwart, listeners, SMTP_PASS, troubleshooting de entrega)**: [`../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md`](../../UNLIMITED_AI_BRAIN/compartido/02-mail-server-stalwart.md).
- **Histórico**: [`changelog/2026-05-07_bootstrap-vite-y-api.md`](changelog/2026-05-07_bootstrap-vite-y-api.md).
