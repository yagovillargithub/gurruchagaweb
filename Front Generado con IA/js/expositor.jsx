// Expositor — mosaico Pinterest filtrable + lightbox
const { useState: uS, useEffect: uE, useMemo: uM, useCallback: uC } = React;

function Expositor() {
  const proyectos = window.PROYECTOS;
  const cats = window.CATEGORIAS;
  const [cat, setCat] = uS("todos");
  const [open, setOpen] = uS(null); // index del proyecto abierto

  // Conteos por categoría
  const counts = uM(() => {
    const m = { todos: proyectos.length };
    cats.forEach(c => { if (c.id !== "todos") m[c.id] = proyectos.filter(p => p.categoria === c.id).length; });
    return m;
  }, [proyectos, cats]);

  const filtered = uM(() => cat === "todos" ? proyectos : proyectos.filter(p => p.categoria === cat), [cat, proyectos]);

  // Cerrar lightbox con Escape, navegar con flechas
  uE(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") setOpen(i => (i - 1 + filtered.length) % filtered.length);
      if (e.key === "ArrowRight") setOpen(i => (i + 1) % filtered.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered.length]);

  return (
    <>
      <window.SiteHeader active="expositor" />

      {/* Header de página */}
      <section className="hero" style={{paddingBottom: '1rem'}}>
        <div className="shell">
          <div className="hero-eyebrow">
            <span className="eyebrow">Expositor / Trabajos</span>
            <span className="eyebrow">{filtered.length} proyectos</span>
          </div>
          <h1 className="hero-title" style={{fontSize: 'clamp(3rem, 8vw, 7rem)'}}>
            <span className="word-1">expositor</span>
            <span className="word-2" style={{paddingLeft:'clamp(2rem, 8vw, 6rem)'}}>de obra.</span>
          </h1>
          <p className="lede" style={{marginTop: '2rem', maxWidth: '64ch'}}>
            Catálogo de proyectos del estudio. Cocinas, livings, librerías, comercios y soluciones
            container fabricados a medida. Filtrá por categoría o hacé clic en cualquier obra
            para ampliarla.
          </p>

          {/* Filtros */}
          <div className="filter-bar">
            {cats.map(c => (
              <button
                key={c.id}
                className={`filter-chip ${cat === c.id ? "is-active" : ""}`}
                onClick={() => setCat(c.id)}
                type="button"
              >
                {c.label}
                <span className="count">{counts[c.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mosaico */}
      <section className="section" style={{paddingTop: '1rem'}}>
        <div className="shell">
          {filtered.length === 0 ? (
            <p style={{color:'var(--fg-muted)', padding:'4rem 0', textAlign:'center'}}>
              No hay proyectos en esta categoría todavía.
            </p>
          ) : (
            <div className="mosaic">
              {filtered.map((p, i) => (
                <button
                  key={p.id}
                  className="tile"
                  onClick={() => setOpen(i)}
                  type="button"
                  aria-label={`Abrir ${p.titulo}`}
                >
                  <img src={p.img} alt={p.titulo} loading="lazy" />
                  <span className="meta">
                    <span>
                      <span className="cat">{cats.find(c => c.id === p.categoria)?.label}</span>
                      <h4>{p.titulo}</h4>
                    </span>
                    <span style={{fontFamily:'var(--font-mono)', fontSize:'.7rem', opacity:.85}}>{p.anio}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {open !== null && filtered[open] && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button className="close" onClick={(e) => { e.stopPropagation(); setOpen(null); }} aria-label="Cerrar">×</button>
          <button className="nav prev" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + filtered.length) % filtered.length); }}>‹</button>
          <button className="nav next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % filtered.length); }}>›</button>
          <img src={filtered[open].img} alt={filtered[open].titulo} onClick={(e) => e.stopPropagation()} />
          <div className="caption">
            {filtered[open].titulo} · {cats.find(c => c.id === filtered[open].categoria)?.label} · {filtered[open].anio}
          </div>
        </div>
      )}

      <window.SiteFooter />
      {window.GurruTweaks && <window.GurruTweaks />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<Expositor />);
