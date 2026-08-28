import { useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import useAutoplayInteraction from '../hooks/useAutoplayInteraction.js';

// MIN_PER_ROW: cada fila base se rellena hasta este nº de items para que,
// duplicada con [...row, ...row] y con el transform translate(-50%), no haya
// huecos visibles ni siquiera en pantallas anchas.
const MIN_PER_ROW = 14;

function pad(arr, min, src) {
  const out = arr.slice();
  while (out.length < min) out.push(...src);
  return out;
}

// ─── Fila marquee accionada por JS ──────────────────────────────────────────
// Antes el auto-scroll era una animación CSS (translateX). La movemos a JS
// (requestAnimationFrame sobre `transform`) para poder:
//   · pausarla al pasar el ratón por encima (mirar una obra con calma), y
//   · arrastrarla con ratón o dedo para moverla a mano.
// El track lleva los items duplicados ([...row,...row]); el offset se envuelve
// por la mitad del ancho (una copia) para un bucle continuo sin saltos.
// touch-action:pan-y deja libre el scroll vertical de la página en móvil.
// La pausa por interacción vive AQUÍ (una instancia del hook por fila) y no en
// el contenedor: mirar una obra debe detener sólo su fila, las demás siguen.
function MarqueeRow({
  className,
  direction = 'left',
  baseSeconds = 60,
  speed = 0.4,
  autoScroll = true,
  children,
}) {
  const { isPaused, interactionProps } = useAutoplayInteraction();
  // Desestructurado explícito: los 4 handlers de puntero se componen a mano con
  // la lógica de arrastre; el resto (enter/leave, click, touch) va por spread.
  const {
    onPointerDown: pauseDown,
    onPointerMove: pauseMove,
    onPointerUp: pauseUp,
    onPointerCancel: pauseCancel,
    ...pauseProps
  } = interactionProps;
  const elRef = useRef(null);
  const st = useRef({
    offset: 0,
    half: 1,
    raf: 0,
    last: 0,
    inited: false,
    drag: { active: false, startX: 0, startOffset: 0, moved: false, id: null },
  });

  const wrap = (o, half) => {
    // Normaliza a (-half, 0]; ambas copias son idénticas → bucle sin salto.
    let v = o % half;
    if (v > 0) v -= half;
    return v;
  };

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return undefined;
    const measure = () => {
      const s = st.current;
      const half = el.scrollWidth / 2 || 1;
      s.half = half;
      if (!s.inited) {
        s.offset = direction === 'right' ? -half : 0;
        s.inited = true;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [direction]);

  useEffect(() => {
    const el = elRef.current;
    const s = st.current;
    const sign = direction === 'right' ? 1 : -1;
    const tick = (ts) => {
      const last = s.last || ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      s.last = ts;
      if (autoScroll && !isPaused && !s.drag.active && s.half > 1) {
        const v = (s.half / baseSeconds) * speed; // px/s — replica el ritmo CSS
        s.offset = wrap(s.offset + sign * v * dt, s.half);
      }
      if (el) el.style.transform = `translate3d(${s.offset}px,0,0)`;
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
  }, [direction, baseSeconds, speed, autoScroll, isPaused]);

  const onPointerDown = (e) => {
    const s = st.current;
    s.drag = { active: true, startX: e.clientX, startOffset: s.offset, moved: false, id: e.pointerId, captured: false };
    // OJO: NO capturamos el puntero aquí. Capturar en pointerdown desvía el
    // evento `click` fuera del botón y rompía el clic de la obra en escritorio.
    // Capturamos sólo cuando el gesto resulta ser un arrastre real (en move).
  };
  const onPointerMove = (e) => {
    const s = st.current;
    if (!s.drag.active) return;
    const dx = e.clientX - s.drag.startX;
    if (!s.drag.moved && Math.abs(dx) > 4) {
      s.drag.moved = true;
      // Ahora sí: arrastre real → capturamos (ratón) para seguir fuera de la
      // fila. Un clic limpio no llega aquí, así que el clic de la obra funciona.
      if (e.pointerType === 'mouse') {
        try { elRef.current.setPointerCapture(e.pointerId); s.drag.captured = true; } catch { /* noop */ }
      }
    }
    if (s.drag.moved) s.offset = wrap(s.drag.startOffset + dx, s.half || 1);
  };
  const endDrag = () => {
    const s = st.current;
    if (s.drag.captured && s.drag.id != null && elRef.current) {
      try { elRef.current.releasePointerCapture(s.drag.id); } catch { /* noop */ }
    }
    s.drag.active = false;
    s.drag.captured = false;
    s.drag.id = null;
    s.last = 0; // reinicia dt para que no pegue un salto al reanudar
  };
  // Si hubo arrastre, anula el click que dispararía el lightbox de esa obra.
  const onClickCapture = (e) => {
    const s = st.current;
    if (s.drag.moved) {
      e.stopPropagation();
      e.preventDefault();
      s.drag.moved = false;
    }
  };

  return (
    <div
      ref={elRef}
      className={className}
      style={{ touchAction: 'pan-y' }}
      {...pauseProps}
      onPointerDown={(e) => { pauseDown(e); onPointerDown(e); }}
      onPointerMove={(e) => { pauseMove(e); onPointerMove(e); }}
      onPointerUp={(e) => { pauseUp(e); endDrag(); }}
      onPointerCancel={(e) => { pauseCancel(e); endDrag(); }}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}

// Card de carrusel. Las obras marcadas con `pulse` "laten" (zoom tipo corazón)
// para invitar a clicar; el resto son obras clicables normales.
function CarouselCard({ it, extraClass = '', onItemClick, showLabel = false, pulse = false }) {
  const img = <img src={it.img} alt={it.titulo} loading="lazy" draggable={false} />;

  return (
    <button
      type="button"
      className={`card ${pulse ? 'card-pulse' : ''} ${extraClass}`.replace(/\s+/g, ' ').trim()}
      onClick={() => onItemClick && onItemClick(it)}
      aria-label={`Ampliar ${it.titulo}`}
    >
      {img}
      {showLabel && <span className="label">{it.titulo}</span>}
    </button>
  );
}

// El contenedor ya NO pausa: cada fila gestiona su propia pausa (ver MarqueeRow
// y DiagonalRow), de modo que detener una fila no congela a sus hermanas.
export default function Carousel({ variant = 'paralelo', items = [], onItemClick, speeds, autoScroll = true }) {
  let content;

  if (variant === 'diagonal') {
    content = <CarouselDiagonal items={items} onItemClick={onItemClick} />;
  } else if (variant === 'infinito') {
    content = (
      <CarouselInfinito
        items={items}
        onItemClick={onItemClick}
        speeds={speeds}
        autoScroll={autoScroll}
      />
    );
  } else {
    content = (
      <CarouselParalelo
        items={items}
        onItemClick={onItemClick}
        speeds={speeds}
        autoScroll={autoScroll}
      />
    );
  }

  return <div className="carousel-interaction">{content}</div>;
}

function CarouselParalelo({ items, onItemClick, speeds, autoScroll }) {
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

  // Pulso "late" en una posición fija de las filas 1 y 3 (la fila 2 queda
  // limpia). Pocas instancias = afford­ance discreta, "alguna de las imágenes".
  const pulseAt = [3, null, 4];
  const dirs = ['left', 'right', 'left'];
  const baseSecs = [60, 50, 70];

  return (
    <div className="cv-paralelo">
      {rows.map((row, idx) => {
        const anchor = pulseAt[idx];
        return (
          <MarqueeRow
            key={idx}
            className={`row r${idx + 1}`}
            direction={dirs[idx]}
            baseSeconds={baseSecs[idx]}
            speed={speeds?.[idx] ?? 0.4}
            autoScroll={autoScroll}
          >
            {[...row, ...row].map((it, i) => (
              <CarouselCard
                key={`${idx}-${i}`}
                it={it}
                extraClass={idx === 1 ? 'wide' : ''}
                onItemClick={onItemClick}
                pulse={anchor !== null && i % row.length === anchor}
              />
            ))}
          </MarqueeRow>
        );
      })}
    </div>
  );
}

function CarouselInfinito({ items, onItemClick, speeds, autoScroll }) {
  const padded = useMemo(() => pad([...items], MIN_PER_ROW, items), [items]);
  return (
    <div className="cv-infinito">
      <MarqueeRow
        className="track"
        direction="left"
        baseSeconds={70}
        speed={speeds?.[0] ?? 0.4}
        autoScroll={autoScroll}
      >
        {[...padded, ...padded].map((it, i) => (
          <CarouselCard key={i} it={it} onItemClick={onItemClick} showLabel />
        ))}
      </MarqueeRow>
    </div>
  );
}

// La diagonal sigue animándose con CSS: la pausa es la clase `is-autoplay-paused`
// puesta en la propia fila (no en el contenedor), para no congelar a la hermana.
function DiagonalRow({ className, children }) {
  const { isPaused, interactionProps } = useAutoplayInteraction();
  return (
    <div
      className={`${className} ${isPaused ? 'is-autoplay-paused' : ''}`.trim()}
      {...interactionProps}
    >
      {children}
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
      <DiagonalRow className="row r1">
        {[...r1, ...r1].map((it, i) => (
          <CarouselCard key={`a-${i}`} it={it} onItemClick={onItemClick} />
        ))}
      </DiagonalRow>
      <DiagonalRow className="row r2">
        {[...r2, ...r2].map((it, i) => (
          <CarouselCard key={`b-${i}`} it={it} onItemClick={onItemClick} />
        ))}
      </DiagonalRow>
    </div>
  );
}
