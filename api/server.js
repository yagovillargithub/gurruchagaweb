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

const app = express();
app.set('trust proxy', 1); // Apache reverse proxy
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
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

function buildEmail({ nombre, email, telefono, proyecto, mensaje, ip, ua, ref }) {
  const proyectoLabel = PROYECTO_LABELS[proyecto] || proyecto || 'Sin especificar';
  const subject = `Nuevo contacto · ${nombre} · ${proyectoLabel}`;
  const refLine = ref ? `Referencia: ${ref.titulo} (id: ${ref.id})\n` : '';
  const text =
    `Nuevo mensaje desde demogurru.unlimited-systems.net\n` +
    `\n` +
    `Nombre:    ${nombre}\n` +
    `Email:     ${email}\n` +
    `Teléfono:  ${telefono || '—'}\n` +
    `Proyecto:  ${proyectoLabel}\n` +
    refLine +
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
      <div style="margin-top:20px;font-size:.7rem;color:#999;letter-spacing:.05em;">
        IP ${escapeHtml(ip)} · ${escapeHtml(ua)}<br/>${new Date().toISOString()}
      </div>
    </td></tr>
  </table>
</body></html>`.trim();

  return { subject, text, html };
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

app.post('/api/contact', limiter, async (req, res) => {
  try {
    const { nombre, email, telefono, proyecto, mensaje, website, proyectoRef } = req.body || {};

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

    const { subject, text, html } = buildEmail({
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: (telefono || '').trim(),
      proyecto: proyectoSan,
      mensaje: mensaje.trim(),
      ip,
      ua,
      ref: refSan,
    });

    const attachments = [];
    if (refSan) {
      const att = await loadReferenceAttachment(refSan);
      if (att) attachments.push(att);
    }

    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: email.trim(),
      subject,
      text,
      html,
      attachments,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[contact] send failed:', err?.message || err);
    res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje.' });
  }
});

app.use((err, _req, res, _next) => {
  if (err && err.message === 'Origin not allowed') {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
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
