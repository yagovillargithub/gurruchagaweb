// Carruseles múltiples — 3 variantes seleccionables
// Estilo readymag-inspirado: paralelo (filas opuestas), infinito (hover), diagonal

const { useState: useState_C, useEffect: useEffect_C, useMemo: useMemo_C } = React;

function Carousel({ variant = "paralelo", items = [] }) {
  if (variant === "diagonal") return <CarouselDiagonal items={items} />;
  if (variant === "infinito") return <CarouselInfinito items={items} />;
  return <CarouselParalelo items={items} />;
}

// ─── Paralelo: 3 filas, direcciones opuestas, velocidades distintas ───
function CarouselParalelo({ items }) {
  // Distribuir items en 3 filas equilibradas, mezcladas
  const rows = useMemo_C(() => {
    const r1 = [], r2 = [], r3 = [];
    items.forEach((it, i) => {
      if (i % 3 === 0) r1.push(it);
      else if (i % 3 === 1) r2.push(it);
      else r3.push(it);
    });
    // Si no hay suficientes, rellenar
    while (r1.length < 4) r1.push(...items);
    while (r2.length < 4) r2.push(...items);
    while (r3.length < 4) r3.push(...items);
    return [r1, r2, r3];
  }, [items]);

  return (
    <div className="cv-paralelo">
      {rows.map((row, idx) => (
        <div key={idx} className={`row r${idx + 1}`}>
          {/* duplicado para loop */}
          {[...row, ...row].map((it, i) => (
            <div key={`${idx}-${i}`} className={`card ${idx === 1 ? "tall" : ""}`}>
              <img src={it.img} alt={it.titulo} loading="lazy" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Infinito: una sola fila, hover scale + label ───
function CarouselInfinito({ items }) {
  const doubled = [...items, ...items, ...items];
  return (
    <div className="cv-infinito">
      <div className="track">
        {doubled.map((it, i) => (
          <div key={i} className="card">
            <img src={it.img} alt={it.titulo} loading="lazy" />
            <span className="label">{it.titulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Diagonal: dos filas rotadas -7deg en direcciones opuestas ───
function CarouselDiagonal({ items }) {
  const half = Math.ceil(items.length / 2);
  const r1 = items.slice(0, half);
  const r2 = items.slice(half);
  while (r1.length < 4) r1.push(...items);
  while (r2.length < 4) r2.push(...items);
  return (
    <div className="cv-diagonal" style={{ width: "120%", marginLeft: "-10%" }}>
      <div className="row r1">
        {[...r1, ...r1].map((it, i) => (
          <div key={`a-${i}`} className="card">
            <img src={it.img} alt={it.titulo} loading="lazy" />
          </div>
        ))}
      </div>
      <div className="row r2">
        {[...r2, ...r2].map((it, i) => (
          <div key={`b-${i}`} className="card">
            <img src={it.img} alt={it.titulo} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}

window.Carousel = Carousel;
