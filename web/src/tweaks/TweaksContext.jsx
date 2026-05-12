import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const STORAGE_KEY = 'gurru:tweaks:v5';
const PRESETS_KEY = 'gurru:tweaks:presets:v1';

export const DEFAULTS = {
  // Modo: 'navy' (default — fondo #41464f), 'light' (cream), 'dark' (muy oscuro).
  mode: 'navy',
  palette: 'azul',
  type: 'editorial',
  density: 'amplio',
  carousel: 'paralelo',

  // Velocidades independientes por fila del carrusel (rango 0.1 .. 3.0).
  // Anti's: a 1.0 ya era demasiado rápido; defaults bajos.
  carouselSpeedR1: 0.4,
  carouselSpeedR2: 0.35,
  carouselSpeedR3: 0.45,

  carouselHeight: 0.82,         // 0.65 .. 1.20
  uiScale: 1.0,                 // 0.85 .. 1.30
  marquee: 'sansplana',
  accent: null,
  motion: 'full',

  // Bordes: 'recto' (default, pedido del cliente) o 'redondeado'.
  carouselRadius: 'recto',
  imageRadius: 'recto',
  buttonRadius: 'redondeado',

  // Marca de agua sobre las imágenes
  watermark: true,

  // Hero customizer "arancha gurruchaga"
  heroLayout: 'cascade',          // cascade | stacked | inline | split | mirror
  heroSize: 1.0,                  // 0.6 .. 1.5 (escala del título)
  heroIndent: 0.10,               // 0 .. 1 (indent de la 2ª palabra como fracción del ancho)
  heroItalic: true,               // italic del título
  heroAccentWord: 'second',       // 'none' | 'first' | 'second' | 'both'
  heroStroke: false,              // outline / hollow
  heroLetterSpacing: -0.03,       // -0.06 .. 0.06
  heroSeparator: 'none',          // 'none' | 'dot' | 'line' | 'star'
};

export const FACTORY_PRESETS = [
  {
    id: 'factory-estudio',
    name: 'Estudio AG',
    description: 'Lo que ve ahora — azul AG, editorial, paralelo con bordes rectos.',
    state: { ...DEFAULTS },
  },
  {
    id: 'factory-showroom',
    name: 'Showroom',
    description: 'Modo oscuro, paleta navy AG2, carrusel infinito.',
    state: {
      ...DEFAULTS,
      mode: 'dark',
      palette: 'azul2',
      carousel: 'infinito',
      type: 'display-fino',
    },
  },
  {
    id: 'factory-warm',
    name: 'Pampa cálida',
    description: 'Modo claro, tonos madera, Bricolage, diagonal con bordes suaves.',
    state: {
      ...DEFAULTS,
      mode: 'light',
      palette: 'warm',
      type: 'grotesque',
      carousel: 'diagonal',
      imageRadius: 'redondeado',
      carouselRadius: 'redondeado',
    },
  },
  {
    id: 'factory-verde',
    name: 'Verde taller',
    description: 'Modo claro, paleta forestal, marquee condensado y ritmo lento.',
    state: {
      ...DEFAULTS,
      mode: 'light',
      palette: 'verde',
      marquee: 'condensada',
      carouselSpeedR1: 0.25,
      carouselSpeedR2: 0.22,
      carouselSpeedR3: 0.28,
    },
  },
  {
    id: 'factory-impacto',
    name: 'Impacto',
    description: 'Antonio (Miso), acento vivo y carrusel más rápido.',
    state: {
      ...DEFAULTS,
      type: 'miso',
      marquee: 'condensada',
      carouselSpeedR1: 1.2,
      carouselSpeedR2: 1.1,
      carouselSpeedR3: 1.3,
    },
  },
];

const TweaksCtx = createContext(null);

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
    const out = { ...DEFAULTS, ...parsed };
    out.carouselSpeedR1 = clamp(out.carouselSpeedR1, 0.1, 3.0) ?? DEFAULTS.carouselSpeedR1;
    out.carouselSpeedR2 = clamp(out.carouselSpeedR2, 0.1, 3.0) ?? DEFAULTS.carouselSpeedR2;
    out.carouselSpeedR3 = clamp(out.carouselSpeedR3, 0.1, 3.0) ?? DEFAULTS.carouselSpeedR3;
    out.carouselHeight = clamp(out.carouselHeight, 0.65, 1.2) ?? DEFAULTS.carouselHeight;
    out.uiScale = clamp(out.uiScale, 0.85, 1.3) ?? DEFAULTS.uiScale;
    out.heroSize = clamp(out.heroSize, 0.6, 1.5) ?? DEFAULTS.heroSize;
    out.heroIndent = clamp(out.heroIndent, 0, 1) ?? DEFAULTS.heroIndent;
    out.heroLetterSpacing = clamp(out.heroLetterSpacing, -0.06, 0.06) ?? DEFAULTS.heroLetterSpacing;
    return out;
  } catch {
    return null;
  }
}

function readPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 20);
  } catch {
    return [];
  }
}

function applyToRoot(t) {
  const r = document.documentElement;
  // mode: 'navy' es el default (no setea atributo); 'light' / 'dark' setean override.
  if (t.mode === 'navy') r.removeAttribute('data-mode');
  else r.setAttribute('data-mode', t.mode);
  r.setAttribute('data-palette', t.palette);
  r.setAttribute('data-type', t.type);
  r.setAttribute('data-density', t.density);
  r.setAttribute('data-motion', t.motion);
  r.setAttribute('data-marquee', t.marquee);
  r.setAttribute('data-carousel-radius', t.carouselRadius);
  r.setAttribute('data-image-radius', t.imageRadius);
  r.setAttribute('data-button-radius', t.buttonRadius);
  r.setAttribute('data-watermark', t.watermark ? 'on' : 'off');

  // Hero customizer
  r.setAttribute('data-hero-layout', t.heroLayout);
  r.setAttribute('data-hero-italic', t.heroItalic ? 'on' : 'off');
  r.setAttribute('data-hero-accent', t.heroAccentWord);
  r.setAttribute('data-hero-stroke', t.heroStroke ? 'on' : 'off');
  r.setAttribute('data-hero-separator', t.heroSeparator);

  // Velocidades por fila (mantenemos --carousel-speed-mult para marquee).
  const avg = (t.carouselSpeedR1 + t.carouselSpeedR2 + t.carouselSpeedR3) / 3;
  r.style.setProperty('--carousel-speed-r1', String(t.carouselSpeedR1));
  r.style.setProperty('--carousel-speed-r2', String(t.carouselSpeedR2));
  r.style.setProperty('--carousel-speed-r3', String(t.carouselSpeedR3));
  r.style.setProperty('--carousel-speed-mult', String(avg));

  r.style.setProperty('--carousel-h-scale', String(t.carouselHeight));
  r.style.setProperty('--ui-scale', String(t.uiScale));

  // Hero scale + indent + letter-spacing
  r.style.setProperty('--hero-scale', String(t.heroSize));
  r.style.setProperty('--hero-indent', String(t.heroIndent));
  r.style.setProperty('--hero-letter-spacing', `${t.heroLetterSpacing}em`);

  if (t.accent) {
    r.style.setProperty('--accent', t.accent);
  } else {
    r.style.removeProperty('--accent');
  }
}

function defaultPresetName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `Mi plantilla · ${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TweaksProvider({ children }) {
  const [tweaks, setTweaks] = useState(() => readStored() ?? DEFAULTS);
  const [presets, setPresets] = useState(() => readPresets());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    applyToRoot(tweaks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks));
    } catch {
      /* quota or disabled */
    }
  }, [tweaks]);

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch {
      /* ignore */
    }
  }, [presets]);

  const setKey = useCallback((k, v) => {
    setTweaks((s) => ({ ...s, [k]: v }));
  }, []);

  const setAll = useCallback((next) => {
    setTweaks(() => ({ ...DEFAULTS, ...next }));
  }, []);

  const reset = useCallback(() => setTweaks(DEFAULTS), []);

  const addPreset = useCallback(
    (name) => {
      const preset = {
        id: `user-${Date.now().toString(36)}`,
        name: (name || '').trim() || defaultPresetName(),
        state: tweaks,
        createdAt: Date.now(),
      };
      setPresets((prev) => [preset, ...prev].slice(0, 20));
      return preset;
    },
    [tweaks],
  );

  const removePreset = useCallback((id) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const applyPreset = useCallback(
    (id) => {
      const f = FACTORY_PRESETS.find((p) => p.id === id);
      if (f) {
        setAll(f.state);
        return;
      }
      const u = presets.find((p) => p.id === id);
      if (u) setAll(u.state);
    },
    [presets, setAll],
  );

  const openPanel = useCallback(() => setOpen(true), []);
  const closePanel = useCallback(() => setOpen(false), []);
  const togglePanel = useCallback(() => setOpen((s) => !s), []);

  const value = useMemo(
    () => ({
      tweaks,
      setKey,
      setAll,
      reset,
      presets,
      addPreset,
      removePreset,
      applyPreset,
      open,
      openPanel,
      closePanel,
      togglePanel,
    }),
    [tweaks, setKey, setAll, reset, presets, addPreset, removePreset, applyPreset, open, openPanel, closePanel, togglePanel],
  );

  return <TweaksCtx.Provider value={value}>{children}</TweaksCtx.Provider>;
}

export function useTweaks() {
  const ctx = useContext(TweaksCtx);
  if (!ctx) throw new Error('useTweaks must be used inside TweaksProvider');
  return ctx;
}
