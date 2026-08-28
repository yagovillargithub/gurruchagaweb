import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, LayoutGrid, Maximize2, X } from 'lucide-react';
import useAutoplayInteraction from '../hooks/useAutoplayInteraction.js';
import useInView from '../hooks/useInView.js';
import { CATEGORIAS } from '../data/site.js';

// ─── Progresiones de obra (tarea #295) ──────────────────────────────────────
// Tres piezas sobre el mismo material:
//   · ProgressionPlayer  — visor de una progresión: fundido automático entre
//     fases, clic/swipe para avanzar y puntos para ir a una fase concreta.
//     Todas las fotos se muestran ENTERAS (object-fit: contain sobre negro):
//     el encuadre del marco es siempre el mismo y las bandas rellenan lo que
//     falte. Nunca se recorta la obra.
//   · ProgressionCard    — miniatura de galería. Rota sola sus fases (cada
//     tarjeta con un periodo distinto para no ir sincronizada con sus
//     hermanas) e invita a abrir el popup.
//   · ProgressionGallery — grid de miniaturas + popup (modal) con el player
//     grande. El popup repite la dinámica del visor principal.

// Ritmo del pase (#297): el cliente veía las secuencias como "imagen fija" al
// bajar con el móvil. Se acorta el intervalo para que la progresión se lea como
// una secuencia, no como una foto quieta.
const PLAYER_INTERVAL = 2200;
const CARD_INTERVAL = 2600;
// Al tocar/clicar, el pase se queda parado un buen rato (el visitante está
// mirando esa fase o avanzando a mano). Antes reanudaba a 1,5 s y parecía que
// no se detenía nunca.
const TOUCH_PAUSE = 7000;

export function ProgressionPlayer({
  progresion,
  autoPlay = true,
  interval = PLAYER_INTERVAL,
  eager = false,
  className = '',
}) {
  const [active, setActive] = useState(0);
  const swipe = useRef({ startX: 0, startY: 0, swiped: false });
  const { isPaused, interactionProps } = useAutoplayInteraction(TOUCH_PAUSE);
  const [viewRef, inView] = useInView(0.4);

  const items = progresion?.items || [];
  const total = items.length;

  const show = (index) => {
    if (!total) return;
    setActive((index + total) % total);
  };

  // Fuera de pantalla el pase se detiene y rebobina: así el visitante SIEMPRE
  // ve primero la fase 01 cuando el visor entra en su viewport.
  useEffect(() => {
    if (!inView) setActive(0);
  }, [inView]);

  useEffect(() => {
    if (!autoPlay || isPaused || !inView || total < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % total);
    }, interval);
    return () => window.clearInterval(timer);
  }, [autoPlay, isPaused, inView, total, interval]);

  if (!total) return null;

  const onPointerDown = (event) => {
    swipe.current = { startX: event.clientX, startY: event.clientY, swiped: false };
  };
  const onPointerUp = (event) => {
    const dx = event.clientX - swipe.current.startX;
    const dy = event.clientY - swipe.current.startY;
    if (Math.abs(dx) < 36 || Math.abs(dx) <= Math.abs(dy)) return;
    swipe.current.swiped = true;
    show(active + (dx < 0 ? 1 : -1));
  };
  const onFrameClick = () => {
    if (swipe.current.swiped) {
      swipe.current.swiped = false;
      return;
    }
    show(active + 1);
  };

  return (
    <div
      ref={viewRef}
      className={`progression-player ${className}`.trim()}
      role="region"
      aria-roledescription="secuencia"
      aria-label={`Progresión de obra: ${progresion.titulo}`}
      {...interactionProps}
    >
      <button
        type="button"
        className="progression-frame"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { swipe.current.swiped = false; }}
        onClick={onFrameClick}
        aria-label={`Mostrar siguiente fase de ${progresion.tipo}`}
      >
        {items.map((item, index) => (
          <img
            key={item.id}
            className={index === active ? 'is-active' : ''}
            src={item.img}
            alt={index === active ? item.titulo : ''}
            aria-hidden={index !== active}
            loading={eager && index === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}

        {/* Sin el total (#297): al cliente no le interesa publicar cuántas
            fotografías integran cada montaje. */}
        <span className="progression-fase" aria-live="polite">
          Fase {String(active + 1).padStart(2, '0')}
        </span>
      </button>

      <div className="progression-dots" role="group" aria-label="Elegir fase de la obra">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={index === active ? 'is-active' : ''}
            onClick={() => show(index)}
            aria-label={`Mostrar fase ${index + 1} de ${total}`}
            aria-pressed={index === active}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Cada tarjeta rota con un periodo propio (base + desfase por posición) para
// que la parrilla respire: si todas cambiaran a la vez parecería un glitch.
function ProgressionCard({ progresion, autoPlay = true, interval, onOpen }) {
  const [active, setActive] = useState(0);
  const { isPaused, interactionProps } = useAutoplayInteraction(TOUCH_PAUSE);
  const [viewRef, inView] = useInView(0.35);
  // El hook trae su propio onClick (pausa + reanudación). Se compone a mano
  // con el de abrir el popup: si se hiciera spread después del onClick propio,
  // el del hook lo sobrescribiría y la tarjeta dejaría de abrir nada.
  const { onClick: pauseClick, ...restInteraction } = interactionProps;

  const items = progresion.items;
  const total = items.length;

  useEffect(() => {
    if (!inView) setActive(0);
  }, [inView]);

  useEffect(() => {
    if (!autoPlay || isPaused || !inView || total < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % total);
    }, interval);
    return () => window.clearInterval(timer);
  }, [autoPlay, isPaused, inView, total, interval]);

  return (
    <button
      ref={viewRef}
      type="button"
      className="progression-card"
      aria-label={`Abrir la progresión de ${progresion.titulo}`}
      {...restInteraction}
      onClick={(event) => {
        pauseClick?.(event);
        onOpen(progresion);
      }}
    >
      <span className="progression-card-frame" aria-hidden="true">
        {items.map((item, index) => (
          <img
            key={item.id}
            className={index === active ? 'is-active' : ''}
            src={item.img}
            alt=""
            loading="lazy"
            draggable={false}
          />
        ))}
        <span className="progression-card-minidots">
          {items.map((item, index) => (
            <span key={item.id} className={index === active ? 'is-active' : ''} />
          ))}
        </span>
      </span>

      <span className="progression-card-info">
        <strong>{progresion.tipo}</strong>
        <small>{progresion.materiales}</small>
        <span className="progression-card-cta">
          <Maximize2 size={13} aria-hidden="true" />
          Ver progresión
          <ArrowRight size={13} className="arr" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

function ProgressionModal({ progresion, onClose, autoPlay = true }) {
  useEffect(() => {
    if (!progresion) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [progresion, onClose]);

  const catLabel = progresion
    ? CATEGORIAS.find((c) => c.id === progresion.categoria)?.label || 'similares'
    : '';

  return (
    <AnimatePresence>
      {progresion && (
        <motion.div
          className="progression-modal"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Progresión de ${progresion.titulo}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="progression-modal-panel"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="progression-modal-head">
              <div className="progression-modal-title">
                <span>Obra real · clic para avanzar</span>
                <strong>{progresion.tipo}</strong>
                <small>{progresion.materiales}</small>
              </div>
              <button
                type="button"
                className="progression-modal-close"
                onClick={onClose}
                aria-label="Cerrar la progresión"
              >
                <X size={18} />
              </button>
            </div>

            {/* key: al cambiar de proyecto el player arranca en la fase 1 */}
            <ProgressionPlayer
              key={progresion.id}
              progresion={progresion}
              autoPlay={autoPlay}
              eager
            />

            <div className="progression-modal-cta">
              <span>¿Te gusta este estilo?</span>
              <Link
                className="btn btn-primary progression-modal-btn"
                to={`/expositor?cat=${encodeURIComponent(progresion.categoria)}`}
              >
                <LayoutGrid size={14} /> Ver más en {catLabel.toLowerCase()}
                <ArrowRight size={16} className="arr" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProgressionGallery({ progresiones = [], autoPlay = true }) {
  const [open, setOpen] = useState(null);

  if (!progresiones.length) return null;

  return (
    <>
      <div className="progression-grid">
        {progresiones.map((progresion, index) => (
          <ProgressionCard
            key={progresion.id}
            progresion={progresion}
            autoPlay={autoPlay}
            interval={CARD_INTERVAL + (index % 4) * 260}
            onOpen={setOpen}
          />
        ))}
      </div>

      <ProgressionModal
        progresion={open}
        onClose={() => setOpen(null)}
        autoPlay={autoPlay}
      />
    </>
  );
}
