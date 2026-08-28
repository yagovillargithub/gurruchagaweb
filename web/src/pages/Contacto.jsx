import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, AlertCircle, Paperclip, X as XIcon, Instagram } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import SelectField from '../components/SelectField.jsx';
import AttachmentsField from '../components/AttachmentsField.jsx';
import { ESTUDIO, PROYECTOS, CATEGORIAS } from '../data/site.js';

const TIPOS_PROYECTO = [
  { value: 'cocina', label: 'Cocina a medida' },
  { value: 'living', label: 'Living / TV / Librería' },
  { value: 'dormitorio', label: 'Dormitorio' },
  { value: 'placard', label: 'Placards / vestidor' },
  { value: 'bano', label: 'Baño' },
  { value: 'integral', label: 'Proyecto integral' },
  { value: 'otro', label: 'Otro' },
];

// Los adjuntos viajan en el JSON del POST en base64: el API los reenvía como
// attachments del correo. Las fotos ya vienen reescaladas del navegador.
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    reader.readAsDataURL(file);
  });
}

const initialForm = {
  nombre: '',
  email: '',
  telefono: '',
  proyecto: 'cocina',
  mensaje: '',
  website: '', // honeypot
};

function categoriaToProyecto(cat) {
  if (cat === 'cocinas') return 'cocina';
  if (cat === 'librerias-living') return 'living';
  if (cat === 'dormitorios') return 'dormitorio';
  if (cat === 'placards') return 'placard';
  if (cat === 'banos') return 'bano';
  return 'otro';
}

export default function Contacto() {
  const [params, setParams] = useSearchParams();
  const refId = params.get('ref');

  const reference = useMemo(() => {
    if (!refId) return null;
    return PROYECTOS.find((p) => p.id === refId) || null;
  }, [refId]);

  const [form, setForm] = useState(() => {
    if (!reference) return initialForm;
    const cat = CATEGORIAS.find((c) => c.id === reference.categoria);
    return {
      ...initialForm,
      proyecto: categoriaToProyecto(reference.categoria),
      mensaje: `Vi este proyecto en su web (${reference.titulo}) y me gustaría algo similar. `,
    };
  });
  const [status, setStatus] = useState({ state: 'idle', msg: '' });
  const [files, setFiles] = useState([]);

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const setField = (k) => (v) => setForm((s) => ({ ...s, [k]: v }));

  const removeReference = () => {
    const next = new URLSearchParams(params);
    next.delete('ref');
    setParams(next, { replace: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status.state === 'sending') return;
    setStatus({ state: 'sending', msg: '' });
    try {
      const body = { ...form };
      if (reference) {
        body.proyectoRef = {
          id: reference.id,
          titulo: reference.titulo,
          img: reference.img,
        };
      }
      if (files.length) {
        body.adjuntos = await Promise.all(
          files.map(async ({ file }) => ({
            nombre: file.name,
            tipo: file.type || 'application/octet-stream',
            datos: await fileToBase64(file),
          })),
        );
      }
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      // Cuántos archivos entraron lo dice el servidor, no el navegador: puede
      // descartar alguno (formato que no es lo que dice ser, tamaño…).
      const recibidos = Number.isInteger(data.adjuntos) ? data.adjuntos : files.length;
      setStatus({
        state: 'ok',
        msg: recibidos
          ? `¡Listo! Recibimos tu consulta y ${recibidos} archivo${recibidos > 1 ? 's' : ''}. Te respondemos en 24–48hs.`
          : files.length
          ? '¡Listo! Recibimos tu consulta, pero no pudimos leer los archivos: mandalos por WhatsApp y los sumamos.'
          : '¡Listo! Te respondemos en 24–48hs.',
      });
      setForm(initialForm);
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      setFiles([]);
      if (reference) removeReference();
    } catch (err) {
      setStatus({
        state: 'err',
        msg: err.message || 'No se pudo enviar. Probá por WhatsApp.',
      });
    }
  };

  return (
    <>
      <SiteHeader />

      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="shell">
          <div className="hero-eyebrow">
            <span className="eyebrow">Contacto · Pedí presupuesto</span>
            <span className="eyebrow">Respuesta en 24–48hs</span>
          </div>
          <motion.h1
            className="hero-title"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="word-1">hablemos</span>
            <span className="word-2" style={{ paddingLeft: 'clamp(2rem, 10vw, 7rem)' }}>
              de tu idea.
            </span>
          </motion.h1>
          <p className="lede" style={{ marginTop: '2rem', maxWidth: '60ch' }}>
            Contanos qué ambiente o local querés transformar, sumá fotos o medidas si las tenés y te
            respondemos con una propuesta inicial. También podés escribirnos directamente por
            WhatsApp.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '2rem' }}>
        <div className="shell">
          <div className="contact-grid">
            <div className="contact-card">
              <span className="eyebrow">Canales directos</span>

              <a
                className="contact-row"
                href={ESTUDIO.whatsappLink}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <img className="icon" src="/assets/icon-whatsapp.webp" alt="" width="36" height="36" decoding="async" />
                <div>
                  <div className="label">WhatsApp</div>
                  <div className="value">{ESTUDIO.whatsapp}</div>
                </div>
              </a>

              {ESTUDIO.instagram && (
                <a
                  className="contact-row"
                  href={
                    ESTUDIO.instagramUrl ||
                    `https://instagram.com/${ESTUDIO.instagram.replace(/^@/, '')}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="icon-circle">
                    <Instagram size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="label">Instagram</div>
                    <div className="value">{ESTUDIO.instagram}</div>
                  </div>
                </a>
              )}

              <a
                className="contact-row"
                href={`mailto:${ESTUDIO.email}`}
                style={{ textDecoration: 'none' }}
              >
                <span className="icon-circle">@</span>
                <div>
                  <div className="label">Email</div>
                  <div className="value">{ESTUDIO.email}</div>
                </div>
              </a>

              <div className="contact-row">
                <span className="icon-circle" style={{ fontSize: '1rem' }}>
                  ◉
                </span>
                <div>
                  <div className="label">Taller</div>
                  <div className="value">
                    {ESTUDIO.ciudad}, {ESTUDIO.pais}
                  </div>
                </div>
              </div>

              {/* Mapa centrado en la zona del taller (Calle Clemente José
                  Andrada 145). Sin pin exacto: marcamos sólo un CÍRCULO DE ÁREA
                  que además tapa la etiqueta de calle central — pedido del
                  cliente: ubicación correcta pero sin revelar el nombre de la
                  calle ni el punto exacto. */}
              <div className="map-frame" style={{ marginTop: '1rem', minHeight: 280 }}>
                <iframe
                  title="Zona del taller · Santa Rosa, La Pampa"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-64.29674%2C-36.64159%2C-64.26274%2C-36.62259&amp;layer=mapnik"
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <span className="map-area" aria-hidden="true" />
                <span className="map-area-label">Zona · Santa Rosa</span>
              </div>
            </div>

            <div className="contact-card">
              <span className="eyebrow">Formulario</span>
              <h2 className="h2" style={{ maxWidth: '14ch' }}>
                Contanos sobre <em>tu proyecto</em>.
              </h2>

              <AnimatePresence>
                {reference && (
                  <motion.div
                    className="ref-banner"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="ref-banner-thumb-wrap" aria-hidden="true">
                      <img className="ref-banner-thumb" src={reference.img} alt={reference.titulo} />
                    </span>
                    <div className="ref-banner-text">
                      <span className="ref-banner-eyebrow">Referencia adjunta</span>
                      <span className="ref-banner-title">{reference.titulo}</span>
                      <span className="ref-banner-attach">
                        <Paperclip size={11} />
                        Adjuntaremos esta imagen a tu consulta
                      </span>
                    </div>
                    <button
                      type="button"
                      className="ref-banner-close"
                      onClick={removeReference}
                      aria-label="Quitar referencia"
                    >
                      <XIcon size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="form" onSubmit={onSubmit} noValidate>
                <div className="form-row-2">
                  <div className="field">
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      id="nombre"
                      required
                      value={form.nombre}
                      onChange={onChange('nombre')}
                      placeholder="Tu nombre"
                      autoComplete="name"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={onChange('email')}
                      placeholder="vos@email.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="field">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      id="telefono"
                      value={form.telefono}
                      onChange={onChange('telefono')}
                      placeholder="(opcional)"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="proyecto">Tipo de proyecto</label>
                    <SelectField
                      id="proyecto"
                      ariaLabel="Tipo de proyecto"
                      value={form.proyecto}
                      options={TIPOS_PROYECTO}
                      onChange={setField('proyecto')}
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="mensaje">Contanos brevemente</label>
                  <textarea
                    id="mensaje"
                    value={form.mensaje}
                    onChange={onChange('mensaje')}
                    placeholder="Medidas aprox., uso del espacio, plazos…"
                    required
                  />
                </div>

                <AttachmentsField
                  files={files}
                  onChange={setFiles}
                  disabled={status.state === 'sending'}
                />

                {/* honeypot anti-spam: no debe rellenarse */}
                <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
                  <label htmlFor="website">No rellenar</label>
                  <input
                    id="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={onChange('website')}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginTop: '.5rem',
                  }}
                >
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={status.state === 'sending'}
                  >
                    {status.state === 'sending' ? 'Enviando…' : 'Enviar consulta'}{' '}
                    <ArrowRight size={16} className="arr" />
                  </button>
                  <a
                    href={ESTUDIO.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost"
                  >
                    O directo por WhatsApp
                  </a>
                  {status.state === 'ok' && (
                    <motion.span
                      className="form-feedback ok"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Check size={14} /> {status.msg}
                    </motion.span>
                  )}
                  {status.state === 'err' && (
                    <motion.span
                      className="form-feedback err"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <AlertCircle size={14} /> {status.msg}
                    </motion.span>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
