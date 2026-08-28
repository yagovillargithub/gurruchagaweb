import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import Carousel from '../components/Carousel.jsx';
import Lightbox from '../components/Lightbox.jsx';
import ProgressionGallery, { ProgressionPlayer } from '../components/ProgressionShowcase.jsx';
import {
  ESTUDIO,
  PROYECTOS,
  CAROUSEL,
  PROGRESION_DESTACADA,
  PROGRESIONES_GALERIA,
  CATEGORIAS,
  MODULAR,
} from '../data/site.js';
import { useTweaks } from '../tweaks/TweaksContext.jsx';

const LANDING_LIGHTBOX_ITEMS = PROYECTOS;

// Fade-up que dispara siempre al montar (no por scroll). El whileInView con
// IntersectionObserver es frágil en captures full-page y en algunos casos deja
// secciones por debajo del fold inicial en opacity:0. Para una landing corta
// como ésta, animar todas las secciones al montar es perfectamente aceptable:
// el usuario las verá aparecer suavemente al cargar y nunca verá un hueco
// vacío al hacer scroll rápido o sacar captures.
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] },
};

export default function Landing() {
  const { tweaks } = useTweaks();
  const navigate = useNavigate();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openProject = (item) => {
    const idx = LANDING_LIGHTBOX_ITEMS.findIndex((p) => p.id === item.id);
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
        <Carousel
          variant={tweaks.carousel}
          items={CAROUSEL}
          onItemClick={openProject}
          speeds={[tweaks.carouselSpeedR1, tweaks.carouselSpeedR2, tweaks.carouselSpeedR3]}
          autoScroll={tweaks.motion !== 'reduced'}
        />
        {/* Repaginado (#297): "por AG-studio" va pegado a "Proyectos
            realizados" (misma línea) y la coletilla cae debajo. Antes el flex
            de una sola línea partía la frase en dos columnas en móvil. */}
        <p className="carousel-disclaimer">
          <span className="carousel-disclaimer-main">
            <strong>Proyectos realizados</strong> por AG-studio
          </span>
          <span className="carousel-disclaimer-sub">
            todas las imágenes son obra propia
          </span>
        </p>
      </section>

      <Lightbox
        items={LANDING_LIGHTBOX_ITEMS}
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

      {/* "Página 2" — presentación a la izquierda y evolución del montaje
          en un marco fijo a la derecha. Las imágenes se sustituyen mediante
          fundidos: este bloque no es otro carrusel horizontal. */}
      <section id="arancha" className="intro-section">
        <div className="intro-grain" aria-hidden="true" />
        <motion.div
          className="intro-layout shell"
          {...fadeUp}
        >
          <div className="intro-content">
            <div className="intro-eyebrow-row">
              <span className="intro-badge">
                <span className="intro-badge-dot" aria-hidden="true" />
                AG-studio · {ESTUDIO.ciudad}
              </span>
              <span className="intro-eyebrow intro-eyebrow-vercreer">
                <em>Ver. Creer.</em>
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
              Formación en distintas áreas de las bellas artes —
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
            </div>
          </div>

          <div className="intro-transformation">
            <div className="intro-transformation-head">
              <span className="intro-pre">Proyecto destacado</span>
              <span>De la obra al resultado final</span>
            </div>
            <ProgressionPlayer
              progresion={PROGRESION_DESTACADA}
              autoPlay={tweaks.motion !== 'reduced'}
              eager
            />
            {/* Misma carátula que las obras de la galería (#297): tipo en la
                display italic y materiales en mono, para que el destacado no
                cante distinto del resto. */}
            <div className="progression-meta">
              <span>Obra real · clic para avanzar</span>
              <strong>{PROGRESION_DESTACADA.tipo}</strong>
              <small>{PROGRESION_DESTACADA.materiales}</small>
            </div>
          </div>
        </motion.div>

        {/* Galería de progresiones (tarea #295): las demás obras del paquete
            «montaje obra», justo debajo del proyecto destacado — miniaturas
            que rotan solas y se amplían en un popup con la misma dinámica.
            Sustituye al antiguo expositor de procesos; conserva su ancla. */}
        <motion.div className="progression-gallery shell" id="procesos" {...fadeUp}>
          <div className="progression-gallery-head">
            <span className="eyebrow">Obra real · paso a paso</span>
            <div className="progression-gallery-copy">
              <h2 className="h2">
                Del espacio vacío <em>al mueble terminado.</em>
              </h2>
              <p className="lede">
                Elegí un proyecto y recorré cómo toma forma: fabricación, montaje
                y terminaciones, fase por fase.
              </p>
            </div>
          </div>
          <ProgressionGallery
            progresiones={PROGRESIONES_GALERIA}
            autoPlay={tweaks.motion !== 'reduced'}
          />
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
                src="/assets/foto-card-proyecto.webp"
                alt=""
                loading="lazy"
                decoding="async"
                width="1448"
                height="1086"
              />
            </article>
            <article className="service">
              <span className="num">02 / Producción</span>
              <h3>Carpintería Rosignolo</h3>
              <p>
                Socios productivos con todo un desarrollo en La Pampa. Taller
                industrial perfectamente equipado: carpintería, melamina y maderas
                macizas.
              </p>
              <img
                className="service-photo"
                src="/assets/foto-card-produccion.webp"
                alt=""
                loading="lazy"
                decoding="async"
                width="1448"
                height="1086"
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
                src="/assets/foto-card-obra.webp"
                alt=""
                loading="lazy"
                decoding="async"
                width="1448"
                height="1086"
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
                src="/assets/foto-card-comercios.webp"
                alt=""
                loading="lazy"
                decoding="async"
                width="1448"
                height="1086"
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
            <div className="modular-card-body">
              <span className="eyebrow modular-eyebrow">Novedad · línea nueva</span>
              {/* El propio logotipo MODULAR hace de título (pedido del cliente):
                  más grande y prominente, sobre tarjeta clara para legibilidad
                  sobre el fondo oscuro del teaser. */}
              <img
                className="modular-card-logo"
                src="/assets/logo-modular-naranja.webp"
                alt="Modular · diseño funcional en melamina"
                loading="lazy"
                decoding="async"
                width="1563"
                height="467"
              />
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
