import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const STORAGE_KEY = 'gurru:tweaks:v3';

export const DEFAULTS = {
  mode: 'light',
  palette: 'azul',
  type: 'editorial',
  density: 'amplio',
  carousel: 'paralelo',
  carouselSpeed: 5,             // 1..10 → mult 0.2..2.0
  carouselHeight: 0.82,         // ahora número 0.65..1.20 (slider continuo)
  uiScale: 1.0,                 // 0.85..1.30 — escala header/botones/logo
  marquee: 'sansplana',
  accent: null,
  motion: 'full',
};

const TweaksCtx = createContext(null);

function speedToMultiplier(level) {
  const n = Math.max(1, Math.min(10, Number(level) || 5));
  return Math.round((n / 5) * 100) / 100;
}

function clamp(n, min, max) {
  if (typeof n !== 'number' || Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, n));
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // sanity-clamp por si manipulan localStorage
    const out = { ...DEFAULTS, ...parsed };
    out.carouselHeight = clamp(out.carouselHeight, 0.65, 1.2) ?? DEFAULTS.carouselHeight;
    out.uiScale = clamp(out.uiScale, 0.85, 1.3) ?? DEFAULTS.uiScale;
    return out;
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

  const speedMult = speedToMultiplier(t.carouselSpeed);
  r.style.setProperty('--carousel-speed-mult', String(speedMult));
  r.style.setProperty('--carousel-h-scale', String(t.carouselHeight));
  r.style.setProperty('--ui-scale', String(t.uiScale));

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
