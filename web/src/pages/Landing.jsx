import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import TaglineMarquee from '../components/TaglineMarquee.jsx';
import Carousel from '../components/Carousel.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { ESTUDIO, PROYECTOS, CAROUSEL, CATEGORIAS, MODULAR } from '../data/site.js';
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
        <Carousel variant={tweaks.carousel} items={CAROUSEL} onItemClick={openProject} />
        <p className="carousel-disclaimer">
          <strong>Proyectos realizados</strong> por AG-studio · todas las imágenes son obra propia
        </p>
      </section>

      <Lightbox
        items={PROYECTOS}
        openIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
        captionFor={(p) => {
          const cat = CATEGORIAS.find((c) => c.id === p.categoria)?.label;
          return [p.titulo, cat, p.anio].filter(Boolean).join(' · ');
        }}
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

      {/* "Página 2" — arancha presenta. Va justo después de la landing
          (carrusel + marquee). Fusiona el hero (nombre grande) con la
          presentación profesional + stats de cierre. Fondo de obra real
          con overlay para contraste. TODO: cuando llegue la foto real de
          arancha (retrato), usarla como --intro-bg en lugar del proyecto. */}
      <section
        className="intro-section"
        style={{ '--intro-bg': "url('/assets/proyectos/libreria-living-001.webp')" }}
      >
        <div className="intro-overlay" aria-hidden="true" />
        <div className="intro-grain" aria-hidden="true" />
        <motion.div
          className="intro-content shell"
          {...fadeUp}
        >
          <div className="intro-eyebrow-row">
            <span className="intro-badge">
              <span className="intro-badge-dot" aria-hidden="true" />
              AG-studio · {ESTUDIO.ciudad}
            </span>
            <span className="intro-eyebrow">
              Desde {ESTUDIO.desde} / {new Date().getFullYear()}
            </span>
          </div>

          <h2 className="intro-title">
            <span className="intro-pre">Detrás de AG-studio</span>
            <span className="intro-brand">
              arancha <em>gurruchaga</em>
            </span>
          </h2>

          {/* TODO bio definitiva: arancha tiene que pasar texto real. Lo de abajo es
              placeholder estructurado con los puntos que ella indicó en el doc
              (formación bellas artes, cientos de trabajos en España y aquí). */}
          <p className="intro-lede">
            Larga trayectoria en <strong>diseño de interiores y mobiliario a medida</strong>.
            Cientos de obras realizadas en España y otras tantas aquí, en la última
            década. Formación en distintas áreas de las bellas artes —
            <strong> arquitectura, diseño industrial</strong> y dirección de obra — que se
            traducen en proyectos que duran.
          </p>

          <p className="intro-claim">
            <strong>Diseño, planificación y fabricación de mobiliario a medida.</strong>
            {' '}Pensamos cocinas, livings, rincones y comercios — soluciones habitables
            que duran. <strong>Producción propia.</strong>
          </p>

          <div className="intro-meta">
            <div className="intro-meta-item">
              <span className="intro-meta-num">+20</span>
              <span className="intro-meta-lbl">años en el sector</span>
            </div>
            <div className="intro-meta-sep" aria-hidden="true" />
            <div className="intro-meta-item">
              <span className="intro-meta-num">+1000</span>
              <span className="intro-meta-lbl">obras realizadas</span>
            </div>
            <div className="intro-meta-sep" aria-hidden="true" />
            <div className="intro-meta-item">
              <span className="intro-meta-num">100%</span>
              <span className="intro-meta-lbl">producción propia</span>
            </div>
            <div className="intro-meta-sep" aria-hidden="true" />
            <div className="intro-meta-item">
              <span className="intro-meta-num">AG-studio</span>
              <span className="intro-meta-lbl">diseño · oficio</span>
            </div>
            <div className="intro-meta-sep" aria-hidden="true" />
            <div className="intro-meta-item intro-meta-ver-creer">
              <span className="intro-meta-num"><em>Ver. Creer.</em></span>
            </div>
          </div>
        </motion.div>
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
              <span className="num">01 / Proyecto</span>
              <h3>Proyecto</h3>
              <p>
                Tomamos nota de tus necesidades y gustos, y desarrollamos una propuesta
                personalizada para ese espacio de tu casa o negocio.
              </p>
              <img
                className="service-photo"
                src="/assets/foto-card-proyecto.png"
                alt=""
                loading="lazy"
              />
            </article>
            <article className="service">
              <span className="num">02 / Producción</span>
              <h3>Carpintería Rosignolo</h3>
              <p>
                Socios productivos con toda una vida en La Pampa. Taller industrial
                perfectamente equipado: carpintería, melamina, laqueados y maderas
                macizas.
              </p>
              <img
                className="service-photo"
                src="/assets/foto-card-produccion.png"
                alt=""
                loading="lazy"
              />
            </article>
            <article className="service">
              <span className="num">03 / Obra</span>
              <h3>Montaje y dirección</h3>
              <p>
                Coordinamos contigo relevamiento de medidas, confección de planos,
                fabricación e instalación. Todo según tus tiempos.
              </p>
              <img
                className="service-photo"
                src="/assets/foto-card-obra.png"
                alt=""
                loading="lazy"
              />
            </article>
            <article className="service">
              <span className="num">04 / Integral</span>
              <h3>Amoblamiento integral</h3>
              <p>
                Vivienda completa y comercios — gastronomía, retail, consultorios.
                Vos controlás todo el proceso, nosotros nos ocupamos del resto.
              </p>
              <img
                className="service-photo"
                src="/assets/foto-card-comercios.png"
                alt=""
                loading="lazy"
              />
            </article>
          </motion.div>
        </div>
      </section>

      <section className="section about-section" style={{ background: 'var(--bg-elev)' }}>
        <div className="shell">
          <span className="eyebrow">AG-studio</span>
          <motion.div className="about-grid" style={{ marginTop: '1.5rem' }} {...fadeUp}>
            <div>
              {/* En una línea — el cliente lo quiere así, no quebrar. */}
              <h2 className="h2 about-title">Diseñar es ver antes de creer.</h2>
            </div>
            <div className="stat-stack">
              <p className="lede">
                Trabajamos desde <strong>{ESTUDIO.ciudad}</strong> con clientes de toda la región
                pampeana. Cada mueble se piensa al detalle, se planifica y se fabrica en
                producción propia para garantizar terminaciones impecables.
              </p>
              <p className="about-closing">
                ¿Qué necesitás? <em>Pongamos en marcha la magia.</em>
              </p>
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
              {/* Logo MODULAR naranja oficial — diferenciado del azul AG-studio
                  porque Modular es un producto propio con su propia identidad. */}
              <img
                className="modular-card-logo"
                src="/assets/logo-modular-naranja.png"
                alt=""
              />
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

      <section className="section final-cta">
        <motion.div
          className="shell"
          style={{ textAlign: 'center', display: 'grid', gap: '2rem', justifyItems: 'center' }}
          {...fadeUp}
        >
          <span className="eyebrow eyebrow-lg">Próximo proyecto</span>
          <h2 className="display final-cta-title">
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
          {/* Cierre con la frase de marca — pedido explícito de arancha:
              "Ver. Creer." aparece como remate antes del footer. */}
          <p className="final-vercreer">
            <em>Ver. Creer.</em>
          </p>
        </motion.div>
      </section>

      <SiteFooter />
    </>
  );
}
