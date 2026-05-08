// Landing — Gurruchaga
const { useState: useS, useEffect: useE, useMemo: useM } = React;

function Landing() {
  const [tweaks, setTweaks] = useS(window.GURRU_TWEAK_DEFAULTS);
  const E = window.ESTUDIO;
  const proyectos = window.PROYECTOS;

  return (
    <>
      <window.SiteHeader active="inicio" />

      {/* HERO */}
      <section className="hero">
        <div className="shell">
          <div className="hero-eyebrow">
            <span className="eyebrow">Estudio · {E.ciudad}</span>
            <span className="eyebrow">Desde {E.desde} / {new Date().getFullYear()}</span>
          </div>
          <h1 className="hero-title">
            <span className="word-1">arancha</span>
            <span className="word-2">gurruchaga</span>
          </h1>
          <div className="hero-meta">
            <p className="lede">
              Estudio de <strong>diseño y fabricación de mobiliario</strong> a medida.
              Pensamos cocinas, livings, comercios y soluciones habitables que duran:
              proyecto, render 3D, taller propio y montaje en obra.
            </p>
            <div>
              <p className="label">Tagline</p>
              <p style={{fontFamily:'var(--font-display)', fontStyle:'var(--display-italic)', fontSize:'1.6rem', lineHeight:1, margin:0}}>Ver. Creer.</p>
            </div>
            <div>
              <p className="label">Servicios</p>
              <p style={{margin:0}}>Amoblamientos · Diseño · Decoración</p>
            </div>
          </div>
        </div>
      </section>

      <window.TaglineMarquee />

      {/* CARRUSEL MULTIPLE */}
      <section className="carousel-section">
        <div className="carousel-head">
          <h2 className="h2">Trabajos<br/><em>recientes</em>.</h2>
          <p className="right">
            Una selección de proyectos del último ciclo. Cocinas, livings y locales
            comerciales fabricados en taller. Probá las variantes del carrusel desde el panel de Tweaks.
          </p>
        </div>
        <window.Carousel variant={tweaks.carousel} items={proyectos} />
      </section>

      {/* SERVICIOS */}
      <section className="section">
        <div className="shell">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'end', marginBottom:'3rem', gap:'2rem', flexWrap:'wrap'}}>
            <h2 className="h2" style={{maxWidth:'14ch'}}>Lo que hacemos<em>, integralmente</em>.</h2>
            <p className="lede" style={{margin:0}}>
              Cada proyecto pasa por las cuatro etapas. Vos elegís dónde entramos.
            </p>
          </div>
          <div className="services">
            <article className="service">
              <span className="num">01 / Diseño</span>
              <h3>Proyecto y render 3D</h3>
              <p>Relevamiento, planos, despiece y visualización fotorrealista. Ver antes de creer.</p>
            </article>
            <article className="service">
              <span className="num">02 / Producción</span>
              <h3>Taller propio</h3>
              <p>Carpintería, melamina, laqueados y maderas macizas. Calidad bajo control.</p>
            </article>
            <article className="service">
              <span className="num">03 / Obra</span>
              <h3>Montaje y dirección</h3>
              <p>Coordinamos plomería, electricidad y herrería para entregar todo terminado.</p>
            </article>
            <article className="service">
              <span className="num">04 / Comercios</span>
              <h3>Locales y oficinas</h3>
              <p>Equipamiento integral para gastronomía, retail y consultorios.</p>
            </article>
            <article className="service">
              <span className="num">05 / Container</span>
              <h3>Container habitable</h3>
              <p>Soluciones modulares para oficinas, locales o vivienda compacta.</p>
            </article>
            <article className="service">
              <span className="num">06 / Decoración</span>
              <h3>Estilismo y selección</h3>
              <p>Acompañamos en la elección de iluminación, textiles y revestimientos.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ABOUT + STATS */}
      <section className="section" style={{background:'var(--bg-elev)'}}>
        <div className="shell">
          <span className="eyebrow">Estudio</span>
          <div className="about-grid" style={{marginTop:'1.5rem'}}>
            <div>
              <h2 className="h2">Diseñar es ver<br/>antes de creer.</h2>
            </div>
            <div className="stat-stack">
              <p className="lede">
                Trabajamos desde <strong>{E.ciudad}</strong> con clientes de toda la región pampeana.
                Cada mueble se piensa al detalle, se renderiza para validar y se fabrica en taller propio
                para garantizar terminaciones impecables.
              </p>
              <div className="stat"><span className="num">10+</span><span className="label">años de estudio</span></div>
              <div className="stat"><span className="num">240</span><span className="label">proyectos entregados</span></div>
              <div className="stat"><span className="num">100%</span><span className="label">a medida, en taller propio</span></div>
              <div className="stat"><span className="num">3D</span><span className="label">render previo en cada proyecto</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section">
        <div className="shell" style={{textAlign:'center', display:'grid', gap:'2rem', justifyItems:'center'}}>
          <span className="eyebrow">Próximo proyecto</span>
          <h2 className="display" style={{fontSize:'var(--fs-mega)', maxWidth:'14ch'}}>
            ¿Imaginás algo? <em>Lo fabricamos.</em>
          </h2>
          <p className="lede" style={{textAlign:'center'}}>
            Contanos qué ambiente o local querés transformar y armamos un anteproyecto sin compromiso.
          </p>
          <div style={{display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center'}}>
            <a className="btn btn-primary" href="contacto.html">Empecemos <span className="arr">→</span></a>
            <a className="btn btn-ghost" href="expositor.html">Ver expositor <span className="arr">↗</span></a>
          </div>
        </div>
      </section>

      <window.SiteFooter />
      {window.GurruTweaksWithSubscriber && <window.GurruTweaksWithSubscriber onChange={setTweaks} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<Landing />);
