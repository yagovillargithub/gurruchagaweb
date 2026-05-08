import { Link } from 'react-router-dom';
import { ESTUDIO } from '../data/site.js';

export default function SiteFooter() {
  const yr = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="col">
        <h4>Estudio</h4>
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
          <li>
            <a href={ESTUDIO.facebook} target="_blank" rel="noreferrer">
              Facebook · {ESTUDIO.facebookHandle}
            </a>
          </li>
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
          <li>Estudio desde {ESTUDIO.desde}</li>
        </ul>
      </div>
      <div className="footer-bottom">
        <span>
          © {yr} {ESTUDIO.marca} · Ver. Creer.
        </span>
        <span>Diseño y fabricación de mobiliario</span>
      </div>
    </footer>
  );
}
