import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, MessageCircle, ArrowRight, Paperclip } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { CATEGORIAS, PROYECTOS, ESTUDIO } from '../data/site.js';

export default function Expositor() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialCat = params.get('cat');
  const validInitial =
    initialCat && CATEGORIAS.some((c) => c.id === initialCat) ? initialCat : 'todos';
  const [cat, setCat] = useState(validInitial);
  const [open, setOpen] = useState(null);

  // Sincroniza ?cat=... con el estado: cuando el usuario cambia el filtro,
  // actualizamos el query (replace, sin meter entrada en el history).
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (cat === 'todos') next.delete('cat');
    else next.set('cat', cat);
    if (next.toString() !== params.toString()) {
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  const counts = useMemo(() => {
    const m = { todos: PROYECTOS.length };
    CATEGORIAS.forEach((c) => {
      if (c.id !== 'todos') m[c.id] = PROYECTOS.filter((p) => p.categoria === c.id).length;
    });
    return m;
  }, []);

  const filtered = useMemo(
    () => (cat === 'todos' ? PROYECTOS : PROYECTOS.filter((p) => p.categoria === cat)),
    [cat],
  );

  const goToContactWithRef = (item) => {
    setOpen(null);
    navigate(`/contacto?ref=${encodeURIComponent(item.id)}`);
  };

  const buildWhatsappLink = (item) => {
    const imgUrl = `${window.location.origin}${item.img}`;
    const msg =
      `Hola! Vi este proyecto en su web y me gustaría algo similar:\n\n` +
      `${item.titulo}\n` +
      `${imgUrl}`;
    return `${ESTUDIO.whatsappLink}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      <SiteHeader />

      <section className="hero" style={{ paddingBottom: '1rem' }}>
        <div className="shell">
          <div className="hero-eyebrow">
            <span className="eyebrow">Expositor / Trabajos</span>
            <span className="eyebrow">{filtered.length} proyectos</span>
          </div>
          <motion.h1
            className="hero-title"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="word-1">expositor</span>
            <span className="word-2" style={{ paddingLeft: 'clamp(2rem, 8vw, 6rem)' }}>
              de obra.
            </span>
          </motion.h1>
          <p className="lede" style={{ marginTop: '2rem', maxWidth: '64ch' }}>
            Catálogo de proyectos del taller. Cocinas, livings, librerías, comercios y muebles a
            medida. Filtrá por categoría o hacé clic en cualquier obra para ampliarla.
          </p>

          <div className="filter-bar">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                className={`filter-chip ${cat === c.id ? 'is-active' : ''}`}
                onClick={() => setCat(c.id)}
                type="button"
              >
                {c.label}
                <span className="count">{counts[c.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '1rem' }}>
        <div className="shell">
          {filtered.length === 0 ? (
            <p style={{ color: 'var(--fg-muted)', padding: '4rem 0', textAlign: 'center' }}>
              No hay proyectos en esta categoría todavía.
            </p>
          ) : (
            <div className="mosaic">
              {filtered.map((p, i) => (
                <motion.button
                  key={p.id}
                  className="tile"
                  onClick={() => setOpen(i)}
                  type="button"
                  aria-label={`Abrir ${p.titulo}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: Math.min(i * 0.04, 0.3) }}
                >
                  <img src={p.img} alt={p.titulo} loading="lazy" />
                  <span className="meta">
                    <span>
                      <span className="cat">
                        {CATEGORIAS.find((c) => c.id === p.categoria)?.label}
                      </span>
                      <h4>{p.titulo}</h4>
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '.7rem',
                        opacity: 0.85,
                      }}
                    >
                      {p.anio}
                    </span>
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox
        items={filtered}
        openIndex={open}
        onClose={() => setOpen(null)}
        onChange={setOpen}
        captionFor={(p) =>
          `${p.titulo} · ${CATEGORIAS.find((c) => c.id === p.categoria)?.label} · ${p.anio}`
        }
        cta={(item) => (
          <>
            <div className="lightbox-cta-text">
              <span className="lightbox-cta-eyebrow">¿quiero algo parecido?</span>
              <span className="lightbox-cta-attach">
                <Paperclip size={12} />
                la imagen viaja con tu mensaje
              </span>
            </div>
            <div className="lightbox-cta-buttons">
              <a
                href={buildWhatsappLink(item)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost lightbox-cta-btn lightbox-cta-wa"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
              <button
                type="button"
                className="btn btn-primary lightbox-cta-btn"
                onClick={() => goToContactWithRef(item)}
              >
                <Mail size={14} /> Por email
                <ArrowRight size={16} className="arr" />
              </button>
            </div>
          </>
        )}
      />

      <SiteFooter />
    </>
  );
}
