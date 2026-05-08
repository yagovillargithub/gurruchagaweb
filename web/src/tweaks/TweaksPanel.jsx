import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, RotateCcw } from 'lucide-react';
import { useTweaks } from './TweaksContext.jsx';

const ACCENT_PRESETS = [
  '#6b85a0', // azul AG (default)
  '#3b435c', // navy intermedio (test)
  '#1f3552', // navy
  '#c08552', // teja
  '#9aa888', // verde salvia
  '#d29b9b', // rosa polvo
  '#1a1c1f', // grafito
];

const SECTIONS = [
  {
    key: 'mode',
    label: 'Modo',
    options: [
      { value: 'light', label: 'Claro' },
      { value: 'dark', label: 'Oscuro' },
    ],
  },
  {
    key: 'palette',
    label: 'Paleta',
    options: [
      { value: 'azul', label: 'Azul AG' },
      { value: 'azul2', label: 'Azul AG 2' },
      { value: 'mono', label: 'Monocromo' },
      { value: 'warm', label: 'Cálido' },
      { value: 'verde', label: 'Verde estudio' },
    ],
  },
  {
    key: 'type',
    label: 'Tipografía',
    options: [
      { value: 'editorial', label: 'Editorial' },
      { value: 'display-fino', label: 'Bodoni' },
      { value: 'grotesque', label: 'Bricolage' },
      { value: 'miso', label: 'Miso (Antonio)' },
    ],
  },
  {
    key: 'density',
    label: 'Densidad',
    options: [
      { value: 'amplio', label: 'Amplio' },
      { value: 'compacto', label: 'Compacto' },
    ],
  },
  {
    key: 'carousel',
    label: 'Carrusel del home',
    options: [
      { value: 'paralelo', label: 'Paralelo' },
      { value: 'infinito', label: 'Infinito' },
      { value: 'diagonal', label: 'Diagonal' },
    ],
  },
  {
    key: 'carouselHeight',
    label: 'Altura del carrusel',
    options: [
      { value: 'compacto', label: 'Compacta' },
      { value: 'medio', label: 'Media' },
      { value: 'alto', label: 'Alta' },
    ],
  },
  {
    key: 'marquee',
    label: 'Tipografía del marquee',
    options: [
      { value: 'sansplana', label: 'Sans plana' },
      { value: 'display', label: 'Display' },
      { value: 'condensada', label: 'Condensada' },
      { value: 'mono', label: 'Mono' },
    ],
  },
];

export default function TweaksPanel() {
  const { tweaks, setKey, reset, open, openPanel, closePanel } = useTweaks();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closePanel]);

  return (
    <>
      <motion.button
        type="button"
        className="tw-fab"
        onClick={openPanel}
        aria-label="Abrir panel de personalización"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <span className="pulse" aria-hidden="true" />
        <Sparkles size={14} aria-hidden="true" />
        <span>Personalizar</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="tw-overlay"
              onClick={closePanel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            />
            <motion.aside
              className="tw-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Personalización visual"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <header className="tw-head">
                <h3 className="tw-title">
                  Personalizar<em> · vista</em>
                </h3>
                <button
                  type="button"
                  className="tw-close"
                  onClick={closePanel}
                  aria-label="Cerrar panel"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="tw-body">
                {SECTIONS.map((section) => (
                  <section key={section.key} className="tw-section">
                    <p className="tw-section-label">{section.label}</p>
                    <div className="tw-chips">
                      {section.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`tw-chip ${
                            tweaks[section.key] === opt.value ? 'is-active' : ''
                          }`}
                          onClick={() => setKey(section.key, opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}

                <section className="tw-section">
                  <p className="tw-section-label">
                    Velocidad de animación <span className="tw-section-val">{tweaks.carouselSpeed}/10</span>
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={tweaks.carouselSpeed}
                    onChange={(e) => setKey('carouselSpeed', Number(e.target.value))}
                    className="tw-range"
                    aria-label="Velocidad de animación de carruseles"
                  />
                  <div className="tw-range-marks" aria-hidden="true">
                    <span>lento</span>
                    <span>rápido</span>
                  </div>
                </section>

                <section className="tw-section">
                  <p className="tw-section-label">Acento custom</p>
                  <div className="tw-color">
                    <label className="tw-color-swatch" style={{ background: tweaks.accent || 'var(--accent)' }}>
                      <input
                        type="color"
                        value={tweaks.accent || '#6b85a0'}
                        onChange={(e) => setKey('accent', e.target.value)}
                        aria-label="Elegir color de acento"
                      />
                    </label>
                    <div className="tw-color-presets">
                      {ACCENT_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`tw-color-preset ${tweaks.accent === c ? 'is-active' : ''}`}
                          style={{ background: c }}
                          onClick={() => setKey('accent', c)}
                          aria-label={`Acento ${c}`}
                        />
                      ))}
                      {tweaks.accent && (
                        <button
                          type="button"
                          className="tw-chip"
                          style={{ padding: '.25rem .65rem', fontSize: '.7rem' }}
                          onClick={() => setKey('accent', null)}
                        >
                          auto
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                <section className="tw-section">
                  <p className="tw-section-label">Movimiento</p>
                  <div className="tw-toggle">
                    <button
                      type="button"
                      className={`tw-switch ${tweaks.motion === 'reduced' ? 'is-on' : ''}`}
                      onClick={() =>
                        setKey('motion', tweaks.motion === 'reduced' ? 'full' : 'reduced')
                      }
                      aria-pressed={tweaks.motion === 'reduced'}
                      aria-label="Reducir animaciones"
                    />
                    <span>Reducir animaciones</span>
                  </div>
                </section>
              </div>

              <footer className="tw-foot">
                <button type="button" className="tw-reset" onClick={reset}>
                  <RotateCcw size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Reset
                </button>
                <span className="tw-foot-meta">se guarda en este navegador</span>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
