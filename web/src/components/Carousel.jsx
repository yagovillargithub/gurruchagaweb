import { useMemo } from 'react';

// MIN_PER_ROW: cada fila base se rellena hasta este nº de items para que,
// duplicada con [...row, ...row] y con animación translate(-50%), no haya
// huecos visibles ni siquiera en pantallas anchas.
const MIN_PER_ROW = 14;

function pad(arr, min, src) {
  const out = arr.slice();
  while (out.length < min) out.push(...src);
  return out;
}

export default function Carousel({ variant = 'paralelo', items = [], onItemClick }) {
  if (variant === 'diagonal') return <CarouselDiagonal items={items} onItemClick={onItemClick} />;
  if (variant === 'infinito') return <CarouselInfinito items={items} onItemClick={onItemClick} />;
  return <CarouselParalelo items={items} onItemClick={onItemClick} />;
}

function CarouselParalelo({ items, onItemClick }) {
  const rows = useMemo(() => {
    if (!items.length) return [[], [], []];
    const r1 = [];
    const r2 = [];
    const r3 = [];
    items.forEach((it, i) => {
      if (i % 3 === 0) r1.push(it);
      else if (i % 3 === 1) r2.push(it);
      else r3.push(it);
    });
    return [
      pad(r1, MIN_PER_ROW, items),
      pad(r2, MIN_PER_ROW, items),
      pad(r3, MIN_PER_ROW, items),
    ];
  }, [items]);

  return (
    <div className="cv-paralelo">
      {rows.map((row, idx) => (
        <div key={idx} className={`row r${idx + 1}`}>
          {[...row, ...row].map((it, i) => (
            <button
              key={`${idx}-${i}`}
              type="button"
              className={`card ${idx === 1 ? 'wide' : ''}`}
              onClick={() => onItemClick && onItemClick(it)}
              aria-label={`Ampliar ${it.titulo}`}
            >
              <img src={it.img} alt={it.titulo} loading="lazy" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function CarouselInfinito({ items, onItemClick }) {
  const padded = useMemo(() => pad([...items], MIN_PER_ROW, items), [items]);
  return (
    <div className="cv-infinito">
      <div className="track">
        {[...padded, ...padded].map((it, i) => (
          <button
            key={i}
            type="button"
            className="card"
            onClick={() => onItemClick && onItemClick(it)}
            aria-label={`Ampliar ${it.titulo}`}
          >
            <img src={it.img} alt={it.titulo} loading="lazy" />
            <span className="label">{it.titulo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CarouselDiagonal({ items, onItemClick }) {
  const [r1, r2] = useMemo(() => {
    if (!items.length) return [[], []];
    const half = Math.ceil(items.length / 2);
    return [
      pad(items.slice(0, half), MIN_PER_ROW, items),
      pad(items.slice(half), MIN_PER_ROW, items),
    ];
  }, [items]);

  return (
    <div className="cv-diagonal" style={{ width: '120%', marginLeft: '-10%' }}>
      <div className="row r1">
        {[...r1, ...r1].map((it, i) => (
          <button
            key={`a-${i}`}
            type="button"
            className="card"
            onClick={() => onItemClick && onItemClick(it)}
            aria-label={`Ampliar ${it.titulo}`}
          >
            <img src={it.img} alt={it.titulo} loading="lazy" />
          </button>
        ))}
      </div>
      <div className="row r2">
        {[...r2, ...r2].map((it, i) => (
          <button
            key={`b-${i}`}
            type="button"
            className="card"
            onClick={() => onItemClick && onItemClick(it)}
            aria-label={`Ampliar ${it.titulo}`}
          >
            <img src={it.img} alt={it.titulo} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
