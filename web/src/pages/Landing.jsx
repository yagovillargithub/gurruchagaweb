import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import TaglineMarquee from '../components/TaglineMarquee.jsx';
import Carousel from '../components/Carousel.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { ESTUDIO, PROYECTOS, CATEGORIAS, MODULAR } from '../data/site.js';
import { useTweaks } from '../tweaks/TweaksContext.jsx';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] },
};

export default function Landing() {
  const { tweaks } = useTweaks();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openProject = (item) => {
    const idx = PROYECTOS.findIndex((p) => p.id === item.id);
    if (idx >= 0) setLightboxIndex(idx);
  };

  const goToExpositorByCategory = (item) => {
    setLightboxIndex(null);
    const cat = item?.categoria || 'todos';
    navigate(`/expositor?cat=${encodeURIComponent(cat)}`);
  };

  return (
    <>
      <SiteHeader />

      {/* Carrusel arriba del todo */}
      <section className="carousel-section top">
        <Carousel variant={tweaks.carousel} items={PROYECTOS} onItemClick={openProject} />
        <p className="carousel-disclaimer">
          <strong>Proyectos realizados</strong> por el taller · todas las imágenes son obra propia
        </p>
      </section>

      <Lightbox
        items={PROYECTOS}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
        captionFor={(p) =>
          `${p.titulo} · ${CATEGORIAS.find((c) => c.id === p.categoria)?.label} · ${p.anio}`
        }
        cta={(item) => {
          const catLabel = CATEGORIAS.find((c) => c.id === item.categoria)?.label || 'similares';
          return (
            <>
              <div className="lightbox-cta-text">
                <span className="lightbox-cta-eyebrow">¿te gusta este estilo?</span>
                <span className="lightbox-cta-attach">
                  ver más proyectos en {catLabel.toLowerCase()}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-primary lightbox-cta-btn"
                onClick={() => goToExpositorByCategory(item)}
              >
                <LayoutGrid size={14} /> Ver similares
                <ArrowRight size={16} className="arr" />
              </button>
            </>
          );
        }}
      />

      <TaglineMarquee />

      {/* Crédito de fabricación: somos socios de Carpintería Rosignolo
          La imagen de fondo es placeholder (proyecto en roble) — sustituir por
          foto real del taller cuando esté disponible. */}
      <section
        className="rosignolo-section"
        style={{ '--rosignolo-bg': "url('/assets/proyectos/living-tv-roble.jpg')" }}
      >
        <div className="rosignolo-overlay" aria-hidden="true" />
        <div className="rosignolo-grain" aria-hidden="true" />
        <motion.div
          className="rosignolo-content shell"
          {...fadeUp}
        >
          <div className="rosignolo-eyebrow-row">
            <span className="rosignolo-badge">
              <span className="rosignolo-badge-dot" aria-hidden="true" />
              Socios productivos
            </span>
            <span className="rosignolo-eyebrow">
              Producción · La Pampa, Argentina
            </span>
          </div>

          <h2 className="rosignolo-title">
            <span className="rosignolo-pre">Fabricado en sociedad con</span>
            <span className="rosignolo-brand">
              Carpintería <em>Rosignolo</em>
            </span>
          </h2>

          <p className="rosignolo-lede">
            Cada mueble que ves en este sitio se produce íntegramente en el
            taller de <strong>Carpintería Rosignolo</strong>, nuestros socios de
            fabricación. La <strong>dirección creativa</strong> y los <strong>renders 3D</strong>
            vienen de AG Studio; la <strong>materia prima, el corte, el ensamble y las
            terminaciones</strong> son obra de su carpintería. Una alianza que junta
            visión de diseño y oficio de carpintería.
          </p>

          <div className="rosignolo-meta">
            <div className="rosignolo-meta-item">
              <span className="rosignolo-meta-num">10+</span>
              <span className="rosignolo-meta-lbl">años en sociedad</span>
            </div>
            <div className="rosignolo-meta-sep" aria-hidden="true" />
            <div className="rosignolo-meta-item">
              <span className="rosignolo-meta-num">100%</span>
              <span className="rosignolo-meta-lbl">producción propia</span>
            </div>
            <div className="rosignolo-meta-sep" aria-hidden="true" />
            <div className="rosignolo-meta-item">
              <span className="rosignolo-meta-num">AG × R</span>
              <span className="rosignolo-meta-lbl">diseño × oficio</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="hero">
        <div className="shell">
          <motion.div
            className="hero-eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="eyebrow">Taller · {ESTUDIO.ciudad}</span>
            <span className="eyebrow">
              Desde {ESTUDIO.desde} / {new Date().getFullYear()}
            </span>
          </motion.div>
          <motion.h1
            className="hero-title hero-title-pro"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span className="word-1" data-text="arancha">arancha</span>
            <span className="word-sep" aria-hidden="true" />
            <span className="word-2" data-text="gurruchaga">gurruchaga</span>
          </motion.h1>
          <motion.div
            className="hero-meta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <p className="lede">
              Taller de <strong>diseño y fabricación de mobiliario</strong> a medida. Pensamos
              cocinas, livings, comercios y soluciones habitables que duran: proyecto, render 3D,
              producción propia y montaje en obra.
            </p>
            <div>
              <p className="label">Tagline</p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'var(--display-italic)',
                  fontSize: '1.6rem',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Ver. Creer.
              </p>
            </div>
            <div>
              <p className="label">Servicios</p>
              <p style={{ margin: 0 }}>Amoblamientos · Diseño · Decoración</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <motion.div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              marginBottom: '3rem',
              gap: '2rem',
              flexWrap: 'wrap',
            }}
            {...fadeUp}
          >
            <h2 className="h2" style={{ whiteSpace: 'nowrap' }}>
              Lo que hacemos<em>, integralmente</em>.
            </h2>
            <p className="lede" style={{ margin: 0 }}>
              Cada proyecto pasa por las cuatro etapas. Vos elegís dónde entramos.
            </p>
          </motion.div>
          <motion.div className="services" {...fadeUp}>
            <article className="service">
              <span className="num">01 / Diseño</span>
              <h3>Proyecto y render 3D</h3>
              <p>Relevamiento, planos, despiece y visualización fotorrealista. Ver antes de creer.</p>
            </article>
            <article className="service">
              <span className="num">02 / Producción</span>
              <h3>Producción propia</h3>
              <p>Carpintería, melamina, laqueados y maderas macizas. Calidad bajo control.</p>
            </article>
            <article className="service">
              <span className="num">03 / Obra</span>
              <h3>Montaje y dirección</h3>
              <p>
                Coordinamos contigo relevamiento de medidas, confección de planos, fabricación
                e instalación. Todo según tus tiempos.
              </p>
            </article>
            <article className="service">
              <span className="num">04 / Comercios</span>
              <h3>Amoblamiento integral</h3>
              <p>Para gastronomía, retail, consultorios…</p>
            </article>
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-elev)' }}>
        <div className="shell">
          <span className="eyebrow">Taller</span>
          <motion.div className="about-grid" style={{ marginTop: '1.5rem' }} {...fadeUp}>
            <div>
              <h2 className="h2">
                Diseñar es ver
                <br />
                antes de creer.
              </h2>
            </div>
            <div className="stat-stack">
              <p className="lede">
                Trabajamos desde <strong>{ESTUDIO.ciudad}</strong> con clientes de toda la región
                pampeana. Cada mueble se piensa al detalle, se renderiza para validar y se fabrica
                en producción propia para garantizar terminaciones impecables.
              </p>
              <div className="stat">
                <span className="num">10+</span>
                <span className="label">años de taller</span>
              </div>
              <div className="stat">
                <span className="num">240</span>
                <span className="label">proyectos entregados</span>
              </div>
              <div className="stat">
                <span className="num">100%</span>
                <span className="label">a medida, en taller propio</span>
              </div>
              <div className="stat">
                <span className="num">3D</span>
                <span className="label">render previo en cada proyecto</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="modular-teaser">
        <div className="shell">
          <motion.a
            className="modular-card"
            href={MODULAR.url}
            target="_blank"
            rel="noopener"
            {...fadeUp}
          >
            <div className="modular-card-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="44" height="44">
                <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <path d="M16 4 L28 10 L28 22 L16 28 L4 22 L4 10 Z" />
                  <path d="M16 4 L16 16 L4 10" />
                  <path d="M16 16 L28 10" />
                  <path d="M16 16 L16 28" />
                </g>
              </svg>
            </div>
            <div className="modular-card-body">
              <span className="eyebrow modular-eyebrow">Novedad · línea nueva</span>
              <h3 className="modular-title">
                Modular<em>.</em>
              </h3>
              <p className="modular-lede">
                Estamos desarrollando una <strong>línea nueva de muebles modulares</strong>:
                cocina, baño y placard. Sistema configurable, pensado para crecer con tu espacio.
              </p>
              <span className="modular-meta">{MODULAR.descriptor}</span>
            </div>
            <div className="modular-card-cta">
              <span className="modular-cta-label">Conocer Modular</span>
              <ArrowUpRight size={20} className="modular-cta-arrow" />
            </div>
          </motion.a>
        </div>
      </section>

      <section className="section">
        <motion.div
          className="shell"
          style={{ textAlign: 'center', display: 'grid', gap: '2rem', justifyItems: 'center' }}
          {...fadeUp}
        >
          <span className="eyebrow eyebrow-lg">Próximo proyecto</span>
          <h2 className="display" style={{ fontSize: 'var(--fs-mega)', maxWidth: '14ch' }}>
            ¿Imaginás algo? <em>Lo fabricamos.</em>
          </h2>
          <p className="lede" style={{ textAlign: 'center' }}>
            Contanos qué ambiente o local querés transformar y hablamos.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/contacto">
              Empecemos <ArrowRight size={16} className="arr" />
            </Link>
            <Link className="btn btn-ghost" to="/expositor">
              Ver expositor <ArrowUpRight size={16} className="arr" />
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </>
  );
}
