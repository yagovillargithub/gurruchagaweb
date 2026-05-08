import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const STORAGE_KEY = 'gurru:tweaks:v2';

export const DEFAULTS = {
  mode: 'light',                // light | dark
  palette: 'azul',              // azul | azul2 | mono | warm | verde
  type: 'editorial',            // editorial | display-fino | grotesque | miso
  density: 'amplio',            // amplio | compacto
  carousel: 'paralelo',         // paralelo | infinito | diagonal
  carouselSpeed: 5,             // 1..10 → mult 0.2..2.0 (5 = 1x default)
  carouselHeight: 'medio',      // compacto | medio | alto
  marquee: 'sansplana',         // sansplana | display | condensada | mono
  accent: null,                 // null = paleta; o '#hexcolor'
  motion: 'full',               // full | reduced
};

const TweaksCtx = createContext(null);

const HEIGHT_TO_SCALE = {
  compacto: 0.75,
  medio: 0.88,
  alto: 1.0,
};

function speedToMultiplier(level) {
  // 1..10 → 0.2..2.0, with 5 ≈ 1.0
  const n = Math.max(1, Math.min(10, Number(level) || 5));
  return Math.round((n / 5) * 100) / 100;
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...DEFAULTS, ...parsed } : null;
  } catch {
    return null;
  }
}

function applyToRoot(t) {
  const r = document.documentElement;
  r.setAttribute('data-mode', t.mode);
  r.setAttribute('data-palette', t.palette);
  r.setAttribute('data-type', t.type);
  r.setAttribute('data-density', t.density);
  r.setAttribute('data-motion', t.motion);
  r.setAttribute('data-marquee', t.marquee);

  // Carousel runtime knobs (CSS vars)
  const speedMult = speedToMultiplier(t.carouselSpeed);
  const hScale = HEIGHT_TO_SCALE[t.carouselHeight] ?? 0.88;
  r.style.setProperty('--carousel-speed-mult', String(speedMult));
  r.style.setProperty('--carousel-h-scale', String(hScale));

  if (t.accent) {
    r.style.setProperty('--accent', t.accent);
  } else {
    r.style.removeProperty('--accent');
  }
}

export function TweaksProvider({ children }) {
  const [tweaks, setTweaks] = useState(() => readStored() ?? DEFAULTS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    applyToRoot(tweaks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    } catch {
      /* quota or disabled */
    }
  }, [tweaks]);

  const setKey = useCallback((k, v) => {
    setTweaks((s) => ({ ...s, [k]: v }));
  }, []);

  const reset = useCallback(() => setTweaks(DEFAULTS), []);
  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);
  const togglePanel = useCallback(() => setOpen((s) => !s), []);

  const value = useMemo(
    () => ({ tweaks, setKey, reset, open, openPanel, closePanel, togglePanel }),
    [tweaks, setKey, reset, open, openPanel, closePanel, togglePanel],
  );

  return <TweaksCtx.Provider value={value}>{children}</TweaksCtx.Provider>;
}

export function useTweaks() {
  const ctx = useContext(TweaksCtx);
  if (!ctx) throw new Error('useTweaks must be used inside TweaksProvider');
  return ctx;
}
