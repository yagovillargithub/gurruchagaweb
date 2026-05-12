import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, AlertCircle, Paperclip, X as XIcon } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import { ESTUDIO, PROYECTOS, CATEGORIAS } from '../data/site.js';

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
  if (cat === 'librerias-tv') return 'living';
  if (cat === 'comercios') return 'comercio';
  if (cat === 'container') return 'container';
  if (cat === 'casas') return 'integral';
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

  const onChange = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

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
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Error ${res.status}`);
      }
      setStatus({ state: 'ok', msg: '¡Listo! Te respondemos en 24–48hs.' });
      setForm(initialForm);
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
                <img className="icon" src="/assets/icon-whatsapp.png" alt="" />
                <div>
                  <div className="label">WhatsApp</div>
                  <div className="value">{ESTUDIO.whatsapp}</div>
                </div>
              </a>

              <a
                className="contact-row"
                href={ESTUDIO.facebook}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <img className="icon" src="/assets/icon-facebook.png" alt="" />
                <div>
                  <div className="label">Facebook</div>
                  <div className="value">{ESTUDIO.facebookHandle}</div>
                </div>
              </a>

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

              <div className="map-frame" style={{ marginTop: '1rem', minHeight: 280 }}>
                <iframe
                  title="Ubicación AG Studio · Santa Rosa, La Pampa"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=-64.3%2C-36.65%2C-64.25%2C-36.6&amp;layer=mapnik&amp;marker=-36.625%2C-64.275"
                  loading="lazy"
                />
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
                    <select
                      id="proyecto"
                      value={form.proyecto}
                      onChange={onChange('proyecto')}
                    >
                      <option value="cocina">Cocina a medida</option>
                      <option value="living">Living / TV / Librería</option>
                      <option value="placard">Placards / vestidor</option>
                      <option value="comercio">Local comercial / oficina</option>
                      <option value="container">Container habitable</option>
                      <option value="integral">Proyecto integral</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="mensaje">Contanos brevemente</label>
                  <textarea
                    id="mensaje"
                    value={form.mensaje}
                    onChange={onChange('mensaje')}
                    placeholder="Medidas aprox., uso del espacio, plazos, presupuesto estimado…"
                    required
                  />
                </div>

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
