import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { ESTUDIO } from '../data/site.js';

export default function SiteFooter() {
  const yr = new Date().getFullYear();
  return (
    <>
    <footer className="site-footer">
      <div className="col">
        <h4>AG-studio</h4>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontStyle: 'var(--display-italic)',
            fontSize: '1.6rem',
            lineHeight: 1,
            color: 'var(--fg)',
          }}
        >
          arancha
          <br />
          GURRUCHAGA
        </p>
        <p style={{ marginTop: '.5rem', color: 'var(--fg-soft)' }}>{ESTUDIO.rubro}</p>
      </div>
      <div className="col">
        <h4>Navegación</h4>
        <ul>
          <li>
            <Link to="/">Inicio</Link>
          </li>
          <li>
            <Link to="/expositor">Expositor</Link>
          </li>
          <li>
            <Link to="/contacto">Contacto</Link>
          </li>
        </ul>
      </div>
      <div className="col">
        <h4>Contacto</h4>
        <ul>
          <li>
            <a href={ESTUDIO.whatsappLink} target="_blank" rel="noreferrer">
              WhatsApp · {ESTUDIO.whatsapp}
            </a>
          </li>
          {/* Instagram discreto en el footer (decisión: nada prominente arriba).
              Mismo contrato que la fila de Contacto: handle vacío = no se pinta. */}
          {ESTUDIO.instagram && (
            <li>
              <a
                href={
                  ESTUDIO.instagramUrl ||
                  `https://instagram.com/${ESTUDIO.instagram.replace(/^@/, '')}`
                }
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}
              >
                <Instagram size={14} aria-hidden="true" />
                Arancha Gurruchaga · {ESTUDIO.instagram}
              </a>
            </li>
          )}
          <li>
            <a href={`mailto:${ESTUDIO.email}`}>{ESTUDIO.email}</a>
          </li>
        </ul>
      </div>
      <div className="col">
        <h4>Ubicación</h4>
        <ul>
          <li>{ESTUDIO.ciudad}</li>
          <li>{ESTUDIO.pais}</li>
          <li>Desde {ESTUDIO.desde}</li>
        </ul>
      </div>
      <div className="footer-bottom">
        <span>
          © {yr} {ESTUDIO.marca} · Ver. Creer.
        </span>
        <span>Diseño y fabricación de mobiliario</span>
      </div>
    </footer>
    {/* La firma va pegada tras el footer en todas las páginas. */}
    <UnlimitedSignature />
    </>
  );
}

// Firma discreta del estudio que construyó la web. Estética deliberadamente
// ajena a la paleta AG (fondo casi negro fijo, sans de sistema): es un portal
// hacia Unlimited, no parte del universo visual del taller. Colores hardcoded
// a propósito — no debe reaccionar al panel de Tweaks ni a las paletas.
function UnlimitedSignature() {
  return (
    <aside className="unlimited-signature">
      <p className="unlimited-hook">¿Te gustó esta web?</p>
      <p className="unlimited-sub">La hicimos en Unlimited Systems</p>
      <a
        className="unlimited-link"
        href="https://unlimited-systems.net"
        target="_blank"
        rel="noopener"
      >
        Conocé Unlimited →
      </a>
    </aside>
  );
}
