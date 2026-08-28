import { NavLink, Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTweaks } from '../tweaks/TweaksContext.jsx';

const LOGO_SRC = {
  'ag-studio':          '/assets/logo-ag-studio.webp',
  'arancha-azul':       '/assets/logo-arancha-azul.webp',
  'arancha-crema':      '/assets/logo-arancha-crema.webp',
  'arancha-variantes':  '/assets/logo-arancha-variantes.webp',
};

export default function SiteHeader() {
  const { tweaks, bumpHeaderClicks } = useTweaks();
  const { pathname } = useLocation();
  const logoSrc = LOGO_SRC[tweaks.brandLogo];

  // "Inicio" debe subir hasta el carrusel. Si ya estamos en la home, la ruta
  // no cambia y ScrollToTop no se dispara → hacemos el scroll suave a mano.
  // Desde otra página, el NavLink navega y ScrollToTop deja arriba (carrusel).
  const onInicio = () => {
    if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // El botón de Tweaks está oculto por defecto; se revela tras 15 clics en la
  // cabecera (cuenta cualquier clic dentro del header, también en logo/nav).
  return (
    <header className="site-header" onClick={bumpHeaderClicks}>
      {/* El logo AG-studio lleva a la presentación de arancha (sección #arancha
          de la home), no a la portada — pedido del cliente. */}
      <Link className="brand-mark" to="/#arancha" aria-label="AG-studio · sobre arancha GURRUCHAGA">
        {logoSrc ? (
          <img className="brand-mark-img" src={logoSrc} alt="AG-studio · arancha GURRUCHAGA" decoding="async" />
        ) : (
          <span className="brand-mark-name">AG-studio</span>
        )}
      </Link>
      <nav>
        <ul className="nav-list">
          <li>
            <NavLink to="/" end onClick={onInicio} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/expositor" className={({ isActive }) => (isActive ? 'is-active' : '')}>
              Expositor
            </NavLink>
          </li>
          <li>
            <NavLink to="/contacto" className={({ isActive }) => (isActive ? 'is-active' : '')}>
              Contacto
            </NavLink>
          </li>
        </ul>
      </nav>
      <Link className="nav-cta" to="/contacto">
        Pedí presupuesto <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </header>
  );
}
