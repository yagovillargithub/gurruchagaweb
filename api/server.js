import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PORT = Number(process.env.PORT || 3100);
const HOST = process.env.HOST || '127.0.0.1';

const SMTP_HOST = process.env.SMTP_HOST || 'mail.unlimited-systems.net';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = (process.env.SMTP_SECURE ?? 'true') === 'true';
const SMTP_USER = process.env.SMTP_USER || 'info@unlimited-systems.net';
const SMTP_PASS = process.env.SMTP_PASS || '';

const MAIL_FROM = process.env.MAIL_FROM || 'AG Studio <info@unlimited-systems.net>';
const MAIL_TO = process.env.MAIL_TO || 'gurru999@gmail.com';
const STATIC_ROOT = process.env.STATIC_ROOT || '/var/www/demogurru/web';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://demogurru.unlimited-systems.net')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!SMTP_PASS) {
  console.warn('[boot] SMTP_PASS no está seteada. El endpoint /api/contact fallará.');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// Adjuntos del formulario (#297): el visitante puede sumar fotos/planos. Van
// en el JSON en base64 (el navegador ya reescala las fotos), así que /api/contact
// necesita un límite propio. El resto de rutas siguen con los 32 kB de antes.
const MAX_ADJUNTOS = 6;
const MAX_ADJUNTO_BYTES = 8 * 1024 * 1024;
const MAX_ADJUNTOS_BYTES = 15 * 1024 * 1024;
const ADJUNTO_MIME = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/heic', 'heic'],
  ['image/heif', 'heif'],
  ['application/pdf', 'pdf'],
]);

const app = express();
app.set('trust proxy', 1); // Apache reverse proxy
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
const jsonSmall = express.json({ limit: '32kb' });
const jsonContact = express.json({ limit: '24mb' }); // 15 MB de adjuntos + base64 (+33%)
app.use((req, res, next) =>
  (req.path === '/api/contact' ? jsonContact : jsonSmall)(req, res, next),
);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / same-origin
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed'));
    },
  }),
);

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Probá en unos minutos.' },
});

const PROYECTO_LABELS = {
  cocina: 'Cocina a medida',
  living: 'Living / TV / Librería',
  placard: 'Placards / vestidor',
  comercio: 'Local comercial / oficina',
  container: 'Container habitable',
  integral: 'Proyecto integral',
  otro: 'Otro',
};

function isEmail(s) {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEmail({ nombre, email, telefono, proyecto, mensaje, ip, ua, ref, adjuntos = [] }) {
  const proyectoLabel = PROYECTO_LABELS[proyecto] || proyecto || 'Sin especificar';
  const subject =
    `Nuevo contacto · ${nombre} · ${proyectoLabel}` +
    (adjuntos.length ? ` · ${adjuntos.length} adjunto${adjuntos.length > 1 ? 's' : ''}` : '');
  const refLine = ref ? `Referencia: ${ref.titulo} (id: ${ref.id})\n` : '';
  const adjuntosLine = adjuntos.length
    ? `Adjuntos del visitante:\n` +
      adjuntos.map((a) => `  · ${a.filename} (${formatBytes(a.bytes)})`).join('\n') +
      `\n`
    : '';
  const text =
    `Nuevo mensaje desde demogurru.unlimited-systems.net\n` +
    `\n` +
    `Nombre:    ${nombre}\n` +
    `Email:     ${email}\n` +
    `Teléfono:  ${telefono || '—'}\n` +
    `Proyecto:  ${proyectoLabel}\n` +
    refLine +
    adjuntosLine +
    `\n` +
    `Mensaje:\n${mensaje}\n` +
    `\n` +
    `— meta —\n` +
    `IP:  ${ip}\n` +
    `UA:  ${ua}\n` +
    `Fecha: ${new Date().toISOString()}\n`;

  const refRowHtml = ref
    ? `<tr><td style="padding:8px 0;color:#666;">Referencia</td><td style="padding:8px 0;">${escapeHtml(ref.titulo)} <span style="color:#999;font-family:monospace;font-size:.85em;">(adjunta)</span></td></tr>`
    : '';
  const refImageHtml = ref
    ? `<div style="margin-top:18px;padding:0;border:1px solid #e6e2d7;border-radius:10px;overflow:hidden;"><img src="cid:proyectoRef" alt="${escapeHtml(ref.titulo)}" style="display:block;width:100%;height:auto;" /></div>`
    : '';
  const adjuntosHtml = adjuntos.length
    ? `<div style="margin-top:18px;padding:14px 16px;background:#f6f4ef;border-radius:10px;">
         <div style="font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#888;margin-bottom:8px;">Archivos que envió ${escapeHtml(nombre)}</div>
         <ul style="margin:0;padding-left:18px;font-size:.9rem;color:#333;">
           ${adjuntos
             .map(
               (a) =>
                 `<li>${escapeHtml(a.filename)} <span style="color:#999;">(${formatBytes(a.bytes)})</span></li>`,
             )
             .join('')}
         </ul>
       </div>`
    : '';

  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;background:#f6f4ef;padding:24px;">
  <table style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e2d7;">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #eee;">
      <div style="font-family:Georgia,serif;font-style:italic;font-size:1.6rem;color:#1f3552;line-height:1;">arancha<br/>GURRUCHAGA</div>
      <div style="font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:#888;margin-top:.6rem;">Nuevo contacto · demogurru</div>
    </td></tr>
    <tr><td style="padding:20px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:.95rem;">
        <tr><td style="padding:8px 0;color:#666;width:120px;">Nombre</td><td style="padding:8px 0;">${escapeHtml(nombre)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}" style="color:#1f3552;">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;">Teléfono</td><td style="padding:8px 0;">${escapeHtml(telefono || '—')}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Proyecto</td><td style="padding:8px 0;">${escapeHtml(proyectoLabel)}</td></tr>
        ${refRowHtml}
      </table>
      <div style="margin-top:18px;padding:16px;background:#f6f4ef;border-radius:10px;white-space:pre-wrap;line-height:1.5;">${escapeHtml(mensaje)}</div>
      ${refImageHtml}
      ${adjuntosHtml}
      <div style="margin-top:20px;font-size:.7rem;color:#999;letter-spacing:.05em;">
        IP ${escapeHtml(ip)} · ${escapeHtml(ua)}<br/>${new Date().toISOString()}
      </div>
    </td></tr>
  </table>
</body></html>`.trim();

  return { subject, text, html };
}

// ─── Adjuntos subidos por el visitante (#297) ───────────────────────────────
// Defensa en profundidad: whitelist de MIME, tamaño por fichero y total,
// nombre saneado (nunca se escribe a disco, pero viaja al cliente de correo) y
// comprobación de los magic bytes para que el MIME declarado no mienta.
function magicMatches(buf, mime) {
  if (buf.length < 12) return false;
  const ascii = (start, end) => buf.subarray(start, end).toString('latin1');
  switch (mime) {
    case 'image/jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    case 'image/png':
      return ascii(1, 4) === 'PNG';
    case 'image/gif':
      return ascii(0, 4) === 'GIF8';
    case 'image/webp':
      return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'image/heic':
    case 'image/heif':
      return ascii(4, 8) === 'ftyp';
    case 'application/pdf':
      return ascii(0, 4) === '%PDF';
    default:
      return false;
  }
}

function sanitizeAttachmentName(name, mime) {
  const ext = ADJUNTO_MIME.get(mime);
  const base = path
    .basename(String(name || ''))
    .replace(/[^\w.\- ]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  const safe = base && base !== '.' && base !== '..' ? base : 'adjunto';
  return new RegExp(`\\.${ext}$`, 'i').test(safe) ? safe : `${safe}.${ext}`;
}

function parseAdjuntos(raw) {
  const attachments = [];
  const resumen = [];
  if (!Array.isArray(raw) || raw.length === 0) return { attachments, resumen };

  let total = 0;
  for (const item of raw.slice(0, MAX_ADJUNTOS)) {
    if (!item || typeof item !== 'object') continue;
    const mime = typeof item.tipo === 'string' ? item.tipo.toLowerCase().trim() : '';
    if (!ADJUNTO_MIME.has(mime)) continue;
    if (typeof item.datos !== 'string') continue;
    // base64 infla 4/3: cortamos antes de reservar memoria por un payload absurdo.
    if (item.datos.length > Math.ceil((MAX_ADJUNTO_BYTES * 4) / 3) + 1024) continue;

    const content = Buffer.from(item.datos, 'base64');
    if (!content.length || content.length > MAX_ADJUNTO_BYTES) continue;
    if (!magicMatches(content, mime)) continue;
    if (total + content.length > MAX_ADJUNTOS_BYTES) break;

    total += content.length;
    const filename = sanitizeAttachmentName(item.nombre, mime);
    attachments.push({ filename, content, contentType: mime });
    resumen.push({ filename, bytes: content.length });
  }
  return { attachments, resumen };
}

function formatBytes(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Resuelve y carga la imagen referenciada desde STATIC_ROOT, con guardia anti-traversal.
const REF_IMG_RE = /^\/assets\/proyectos\/[a-z0-9][a-z0-9-]*\.(jpe?g|png|webp)$/i;
async function loadReferenceAttachment(ref) {
  if (!ref || typeof ref !== 'object') return null;
  if (typeof ref.img !== 'string' || !REF_IMG_RE.test(ref.img)) return null;

  const rootAbs = path.resolve(STATIC_ROOT);
  const fileAbs = path.resolve(path.join(rootAbs, ref.img));
  if (!fileAbs.startsWith(rootAbs + path.sep)) return null;

  try {
    const content = await readFile(fileAbs);
    const filename = path.basename(fileAbs);
    return {
      filename,
      content,
      cid: 'proyectoRef',
      contentType: filename.toLowerCase().endsWith('.png')
        ? 'image/png'
        : filename.toLowerCase().endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg',
    };
  } catch (err) {
    console.warn('[contact] reference image not found:', ref.img, err?.code);
    return null;
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// Rate limit dedicado para feedback (más estricto: pocos por IP)
const tweaksLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados envíos. Probá en unos minutos.' },
});

const TWEAK_LABELS = {
  mode: 'Modo',
  palette: 'Paleta',
  type: 'Tipografía',
  density: 'Densidad',
  carousel: 'Variante carrusel',
  carouselSpeedR1: 'Velocidad fila 1',
  carouselSpeedR2: 'Velocidad fila 2',
  carouselSpeedR3: 'Velocidad fila 3',
  carouselHeight: 'Altura carrusel',
  uiScale: 'Escala UI',
  marquee: 'Marquee',
  accent: 'Acento',
  motion: 'Movimiento',
  carouselRadius: 'Bordes carrusel',
  imageRadius: 'Bordes imágenes',
  buttonRadius: 'Bordes botones',
  watermark: 'Marca de agua',
};

function generateRef() {
  return `TWK-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function buildTweaksEmail(state, url, ref) {
  const rows = Object.entries(state || {}).map(([k, v]) => [
    TWEAK_LABELS[k] ?? k,
    typeof v === 'boolean' ? (v ? 'Sí' : 'No') : v === null ? '—' : String(v),
  ]);
  const text =
    `Una visita marcó "me gusta esta configuración" en demogurru.\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
    `\n\nURL: ${url || '—'}\nRef: ${ref}\n`;
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:560px;padding:24px;background:#f6f4ef;">
      <div style="background:#fff;border:1px solid #e6e2d7;border-radius:14px;overflow:hidden;">
        <div style="padding:24px 28px;border-bottom:1px solid #eee;">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:1.5rem;color:#1f3552;line-height:1;">arancha<br/>GURRUCHAGA</div>
          <div style="font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:#888;margin-top:.6rem;">Tweaks · me gusta esta configuración</div>
        </div>
        <div style="padding:20px 28px;">
          <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
            ${rows
              .map(
                ([k, v]) => `
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;width:160px;">${escapeHtml(String(k))}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;"><code style="background:#f6f4ef;padding:2px 6px;border-radius:4px;font-size:.88rem;">${escapeHtml(String(v))}</code></td>
              </tr>`,
              )
              .join('')}
          </table>
          <p style="margin:18px 0 0;color:#666;font-size:12px;">URL: <a href="${escapeHtml(url || '')}" style="color:#1f3552;">${escapeHtml(url || '—')}</a></p>
          <p style="margin:4px 0 0;color:#999;font-size:11px;">Ref: ${escapeHtml(ref)}</p>
        </div>
      </div>
    </div>`.trim();
  return { text, html };
}

const TWEAK_KEYS = new Set(Object.keys(TWEAK_LABELS));
function sanitizeTweakState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!TWEAK_KEYS.has(k)) continue;
    if (v === null) { out[k] = null; continue; }
    if (typeof v === 'boolean' || typeof v === 'number') { out[k] = v; continue; }
    if (typeof v === 'string' && v.length <= 60) { out[k] = v; continue; }
  }
  return out;
}

app.post('/api/tweaks-feedback', tweaksLimiter, async (req, res) => {
  try {
    const { state, url, website } = req.body || {};

    // Honeypot — bots rellenan website
    if (website && String(website).trim() !== '') {
      return res.json({ ok: true, ref: generateRef() });
    }

    const sanState = sanitizeTweakState(state);
    if (!sanState || Object.keys(sanState).length === 0) {
      return res.status(400).json({ ok: false, error: 'Configuración inválida.' });
    }
    const sanUrl = typeof url === 'string' && url.length <= 500 ? url : '';
    const ref = generateRef();
    const { text, html } = buildTweaksEmail(sanState, sanUrl, ref);

    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: `[Tweaks demogurru] Configuración favorita · ${ref}`,
      text,
      html,
    });

    res.json({ ok: true, ref });
  } catch (err) {
    console.error('[tweaks-feedback] send failed:', err?.message || err);
    res.status(500).json({ ok: false, error: 'No se pudo enviar la configuración.' });
  }
});

app.post('/api/contact', limiter, async (req, res) => {
  try {
    const { nombre, email, telefono, proyecto, mensaje, website, proyectoRef, adjuntos } =
      req.body || {};

    // honeypot — bots rellenan este campo invisible
    if (website && String(website).trim() !== '') {
      return res.json({ ok: true });
    }

    if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 120) {
      return res.status(400).json({ ok: false, error: 'Nombre inválido.' });
    }
    if (!isEmail(email) || email.length > 200) {
      return res.status(400).json({ ok: false, error: 'Email inválido.' });
    }
    if (typeof mensaje !== 'string' || mensaje.trim().length < 5 || mensaje.length > 4000) {
      return res.status(400).json({ ok: false, error: 'Mensaje muy corto o muy largo.' });
    }
    if (telefono && (typeof telefono !== 'string' || telefono.length > 60)) {
      return res.status(400).json({ ok: false, error: 'Teléfono inválido.' });
    }
    const proyectoSan = typeof proyecto === 'string' && proyecto.length <= 40 ? proyecto : 'otro';

    // Sanea la referencia: solo aceptamos id, titulo, img — y todo strings cortos.
    let refSan = null;
    if (proyectoRef && typeof proyectoRef === 'object') {
      const id = typeof proyectoRef.id === 'string' ? proyectoRef.id.slice(0, 80) : '';
      const titulo = typeof proyectoRef.titulo === 'string' ? proyectoRef.titulo.slice(0, 200) : '';
      const img = typeof proyectoRef.img === 'string' ? proyectoRef.img.slice(0, 200) : '';
      if (id && titulo && img && /^[a-z0-9-]+$/i.test(id)) {
        refSan = { id, titulo, img };
      }
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ua = String(req.headers['user-agent'] || '').slice(0, 200);

    const { attachments: userAttachments, resumen: adjuntosResumen } = parseAdjuntos(adjuntos);

    const { subject, text, html } = buildEmail({
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: (telefono || '').trim(),
      proyecto: proyectoSan,
      mensaje: mensaje.trim(),
      ip,
      ua,
      ref: refSan,
      adjuntos: adjuntosResumen,
    });

    const attachments = [];
    if (refSan) {
      const att = await loadReferenceAttachment(refSan);
      if (att) attachments.push(att);
    }
    attachments.push(...userAttachments);

    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: email.trim(),
      subject,
      text,
      html,
      attachments,
    });

    res.json({ ok: true, adjuntos: adjuntosResumen.length });
  } catch (err) {
    console.error('[contact] send failed:', err?.message || err);
    res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje.' });
  }
});

app.use((err, _req, res, _next) => {
  if (err && err.message === 'Origin not allowed') {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }
  if (err && err.type === 'entity.too.large') {
    return res
      .status(413)
      .json({ ok: false, error: 'Los archivos pesan demasiado. Probá con menos fotos.' });
  }
  console.error('[error]', err);
  res.status(500).json({ ok: false, error: 'Internal error' });
});

app.listen(PORT, HOST, () => {
  console.log(`[boot] demogurru-api listening on http://${HOST}:${PORT}`);
  console.log(`[boot] SMTP target: ${SMTP_HOST}:${SMTP_PORT} (secure=${SMTP_SECURE}) as ${SMTP_USER}`);
  console.log(`[boot] Mail to: ${MAIL_TO}`);
  console.log(`[boot] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
