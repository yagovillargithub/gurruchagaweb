import { useEffect, useRef, useState } from 'react';

/**
 * Indica si el elemento está realmente a la vista. Se usa para que los
 * carruseles no avancen mientras nadie los mira: al volver a entrar en
 * pantalla arrancan desde la primera fotografía (el cliente percibía el
 * orden como "aleatorio" porque el visor llevaba rodando desde la carga).
 */
export default function useInView(threshold = 0.35) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}
