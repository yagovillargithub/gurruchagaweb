import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Lightbox({
  items,
  openIndex,
  onClose,
  onChange,
  captionFor,
  cta, // (item) => ReactNode renderizado dentro de la barra inferior
}) {
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onChange((openIndex - 1 + items.length) % items.length);
      if (e.key === 'ArrowRight') onChange((openIndex + 1) % items.length);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openIndex, items.length, onClose, onChange]);

  return (
    <AnimatePresence>
      {openIndex !== null && items[openIndex] && (
        <motion.div
          className="lightbox"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            className="close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
          <button
            className="nav prev"
            onClick={(e) => {
              e.stopPropagation();
              onChange((openIndex - 1 + items.length) % items.length);
            }}
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>
          <button
            className="nav next"
            onClick={(e) => {
              e.stopPropagation();
              onChange((openIndex + 1) % items.length);
            }}
            aria-label="Siguiente"
          >
            <ChevronRight size={36} />
          </button>
          <motion.img
            key={items[openIndex].id || openIndex}
            src={items[openIndex].img}
            alt={items[openIndex].titulo}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <div className="caption">
            {captionFor ? captionFor(items[openIndex]) : items[openIndex].titulo}
          </div>

          {cta && (
            <motion.div
              className="lightbox-cta"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              {cta(items[openIndex])}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
