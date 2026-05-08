// Componentes compartidos: Header, Footer, Marquee, Tweaks wrapper
// Se cargan globalmente vía window para que cada página los use.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ─────────────────────────────────────────────────────────
// Header / Nav
// ─────────────────────────────────────────────────────────
function SiteHeader({ active = "inicio" }) {
  return (
    <header className="site-header">
      <a className="brand-mark" href="index.html" aria-label="AG Studio · inicio">
        <img src="assets/logo-marca.png" alt="" />
        <span>AG · Studio</span>
      </a>
      <nav>
        <ul className="nav-list">
          <li><a href="index.html" className={active === "inicio" ? "is-active" : ""}>Inicio</a></li>
          <li><a href="expositor.html" className={active === "expositor" ? "is-active" : ""}>Expositor</a></li>
          <li><a href="contacto.html" className={active === "contacto" ? "is-active" : ""}>Contacto</a></li>
        </ul>
      </nav>
      <a className="nav-cta" href="contacto.html">
        Pedí presupuesto <span aria-hidden="true">→</span>
      </a>
    </header>
  );
}

// ─────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────
function SiteFooter() {
  const E = window.ESTUDIO;
  const yr = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="col">
        <h4>Estudio</h4>
        <p style={{margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'var(--display-italic)', fontSize: '1.6rem', lineHeight: 1, color: 'var(--fg)'}}>
          arancha<br/>GURRUCHAGA
        </p>
        <p style={{marginTop: '.5rem', color: 'var(--fg-soft)'}}>{E.rubro}</p>
      </div>
      <div className="col">
        <h4>Navegación</h4>
        <ul>
          <li><a href="index.html">Inicio</a></li>
          <li><a href="expositor.html">Expositor</a></li>
          <li><a href="contacto.html">Contacto</a></li>
        </ul>
      </div>
      <div className="col">
        <h4>Contacto</h4>
        <ul>
          <li><a href={E.whatsappLink}>WhatsApp · {E.whatsapp}</a></li>
          <li><a href={E.facebook}>Facebook · {E.facebookHandle}</a></li>
          <li><a href={`mailto:${E.email}`}>{E.email}</a></li>
        </ul>
      </div>
      <div className="col">
        <h4>Ubicación</h4>
        <ul>
          <li>{E.ciudad}</li>
          <li>{E.pais}</li>
          <li>Estudio desde {E.desde}</li>
        </ul>
      </div>
      <div className="footer-bottom">
        <span>© {yr} {E.marca} · Ver. Creer.</span>
        <span>Diseño y fabricación de mobiliario</span>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────
// Marquee tagline
// ─────────────────────────────────────────────────────────
function TaglineMarquee({ words = ["Ver.", "Creer.", "Diseñar.", "Fabricar.", "Habitar."] }) {
  const items = Array.from({ length: 4 }).flatMap((_, i) => words.map((w, j) => ({ w, k: `${i}-${j}` })));
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {items.map(({ w, k }) => (
          <React.Fragment key={k}>
            <span>{w}</span>
            <span className="dot"></span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { SiteHeader, SiteFooter, TaglineMarquee });
