import { NavLink, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-mark" to="/" aria-label="AG Studio · inicio">
        <img src="/assets/logo-anagrama.png" alt="" />
        <span>AG · Studio</span>
      </Link>
      <nav>
        <ul className="nav-list">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'is-active' : '')}>
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
