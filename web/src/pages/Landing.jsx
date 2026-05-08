import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import TaglineMarquee from '../components/TaglineMarquee.jsx';
import Carousel from '../components/Carousel.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { ESTUDIO, PROYECTOS, CATEGORIAS } from '../data/site.js';
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

      <section className="hero">
        <div className="shell">
          <motion.div
            className="hero-eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="eyebrow">Estudio · {ESTUDIO.ciudad}</span>
            <span className="eyebrow">
              Desde {ESTUDIO.desde} / {new Date().getFullYear()}
            </span>
          </motion.div>
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <span className="word-1">arancha</span>
            <span className="word-2">gurruchaga</span>
          </motion.h1>
          <motion.div
            className="hero-meta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <p className="lede">
              Estudio de <strong>diseño y fabricación de mobiliario</strong> a medida. Pensamos
              cocinas, livings, comercios y soluciones habitables que duran: proyecto, render 3D,
              taller propio y montaje en obra.
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
            <h2 className="h2" style={{ maxWidth: '14ch' }}>
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
              <h3>Taller propio</h3>
              <p>Carpintería, melamina, laqueados y maderas macizas. Calidad bajo control.</p>
            </article>
            <article className="service">
              <span className="num">03 / Obra</span>
              <h3>Montaje y dirección</h3>
              <p>Coordinamos plomería, electricidad y herrería para entregar todo terminado.</p>
            </article>
            <article className="service">
              <span className="num">04 / Comercios</span>
              <h3>Locales y oficinas</h3>
              <p>Equipamiento integral para gastronomía, retail y consultorios.</p>
            </article>
            <article className="service">
              <span className="num">05 / Container</span>
              <h3>Container habitable</h3>
              <p>Soluciones modulares para oficinas, locales o vivienda compacta.</p>
            </article>
            <article className="service">
              <span className="num">06 / Decoración</span>
              <h3>Estilismo y selección</h3>
              <p>Acompañamos en la elección de iluminación, textiles y revestimientos.</p>
            </article>
          </motion.div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-elev)' }}>
        <div className="shell">
          <span className="eyebrow">Estudio</span>
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
                en taller propio para garantizar terminaciones impecables.
              </p>
              <div className="stat">
                <span className="num">10+</span>
                <span className="label">años de estudio</span>
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

      <section className="section">
        <motion.div
          className="shell"
          style={{ textAlign: 'center', display: 'grid', gap: '2rem', justifyItems: 'center' }}
          {...fadeUp}
        >
          <span className="eyebrow">Próximo proyecto</span>
          <h2 className="display" style={{ fontSize: 'var(--fs-mega)', maxWidth: '14ch' }}>
            ¿Imaginás algo? <em>Lo fabricamos.</em>
          </h2>
          <p className="lede" style={{ textAlign: 'center' }}>
            Contanos qué ambiente o local querés transformar y armamos un anteproyecto sin
            compromiso.
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
