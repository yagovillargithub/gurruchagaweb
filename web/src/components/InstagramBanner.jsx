import { Instagram, ArrowUpRight } from 'lucide-react';
import { ESTUDIO } from '../data/site.js';

// Banner prominente de Instagram — va justo debajo del carrusel de la home,
// visible nada más cargar (el público objetivo vive en Instagram y entra
// desde el celular). Mismo contrato que la fila de Contacto: si
// ESTUDIO.instagram está vacío no se renderiza nada (sin enlace roto).
export default function InstagramBanner() {
  if (!ESTUDIO.instagram) return null;
  const url = `https://instagram.com/${ESTUDIO.instagram.replace(/^@/, '')}`;
  return (
    <section className="ig-banner-section">
      <div className="shell">
        <a
          className="ig-banner"
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Instagram de AG-studio · ${ESTUDIO.instagram}`}
        >
          <span className="ig-banner-icon" aria-hidden="true">
            <Instagram size={22} />
          </span>
          <span className="ig-banner-text">
            <strong className="ig-banner-title">¡Seguinos en Instagram!</strong>
            <span className="ig-banner-sub">Obras, procesos y novedades del taller</span>
          </span>
          <span className="ig-banner-cta">
            {ESTUDIO.instagram}
            <ArrowUpRight size={15} aria-hidden="true" />
          </span>
        </a>
      </div>
    </section>
  );
}
