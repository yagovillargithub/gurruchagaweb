import { useEffect, useRef, useState, forwardRef } from 'react';
import { useTweaks, FACTORY_PRESETS } from './TweaksContext.jsx';

const PALETTES = [
  { value: 'azul',  label: 'Azul AG',       hero: '#6b85a0', rest: ['#f5f3ee', '#1f3552'] },
  { value: 'azul2', label: 'Navy AG',       hero: '#3b435c', rest: ['#aec0d6', '#f5f3ee'] },
  { value: 'mono',  label: 'Mono',          hero: '#0e0f10', rest: ['#a8a8a8', '#8a9bb0'] },
  { value: 'warm',  label: 'Cálida',        hero: '#efeae0', rest: ['#261e15', '#6b85a0'] },
  { value: 'verde', label: 'Verde',         hero: '#6b8d6e', rest: ['#ebefe7', '#2d4534'] },
];

const TYPES = [
  { value: 'editorial',    label: 'Editorial' },
  { value: 'display-fino', label: 'Bodoni' },
  { value: 'grotesque',    label: 'Bricolage' },
  { value: 'miso',         label: 'Miso' },
];

const MARQUEES = [
  { value: 'sansplana',  label: 'Plana' },
  { value: 'display',    label: 'Display' },
  { value: 'condensada', label: 'Condens.' },
  { value: 'mono',       label: 'Mono' },
];

const DENSITIES = [
  { value: 'amplio',   label: 'Amplio' },
  { value: 'compacto', label: 'Compacto' },
];

const RADII = [
  { value: 'recto',       label: 'Recto' },
  { value: 'redondeado',  label: 'Redondeado' },
];

const CAROUSEL_VARIANTS = [
  { value: 'paralelo', label: 'Paralelo' },
  { value: 'infinito', label: 'Infinito' },
  { value: 'diagonal', label: 'Diagonal' },
];

const MODES = [
  { value: 'navy',  label: 'Navy' },
  { value: 'light', label: 'Claro' },
  { value: 'dark',  label: 'Oscuro' },
];

const HERO_LAYOUTS = [
  { value: 'cascade', label: 'Cascada' },
  { value: 'stacked', label: 'Pila' },
  { value: 'inline',  label: 'Línea' },
  { value: 'split',   label: 'Split' },
  { value: 'mirror',  label: 'Espejo' },
];

const HERO_ACCENTS = [
  { value: 'none',   label: 'Ninguna' },
  { value: 'first',  label: '1ª' },
  { value: 'second', label: '2ª' },
  { value: 'both',   label: 'Ambas' },
];

const HERO_SEPARATORS = [
  { value: 'none', label: '—' },
  { value: 'dot',  label: '·' },
  { value: 'line', label: '─' },
  { value: 'star', label: '✦' },
];

const ACCENT_PRESETS = [
  '#6b85a0', '#3b435c', '#1f3552', '#c08552', '#9aa888', '#d29b9b', '#1a1c1f',
];

export default function TweaksPanel() {
  const {
    tweaks, setKey, reset,
    presets, addPreset, removePreset, applyPreset,
    open, openPanel, closePanel,
  } = useTweaks();

  const [presetsOpen, setPresetsOpen] = useState(false);
  const [stage, setStage] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState(null);
  const cardRef = useRef(null);
  const fabRef = useRef(null);
  const presetsRef = useRef(null);

  // Cierra panel con Escape o click fuera
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && closePanel();
    const onDoc = (e) => {
      const t = e.target;
      if (cardRef.current?.contains(t)) return;
      if (fabRef.current?.contains(t)) return;
      closePanel();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open, closePanel]);

  // Cierra dropdown de presets con click fuera
  useEffect(() => {
    if (!presetsOpen) return;
    const onDoc = (e) => {
      if (presetsRef.current?.contains(e.target)) return;
      setPresetsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [presetsOpen]);

  // Al cambiar tweaks, invalida estado del botón "Me gusta"
  useEffect(() => {
    if (stage === 'success' || stage === 'error') setStage('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tweaks]);

  async function submitFeedback() {
    setStage('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/tweaks-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: tweaks,
          url: typeof window !== 'undefined' ? window.location.href : '',
          website: '',
        }),
      });
      let json = {};
      try { json = await res.json(); } catch { /* empty */ }
      if (!res.ok || !json.ok) {
        setStage('error');
        setErrorMsg(json.error || 'No se pudo enviar la configuración.');
        return;
      }
      addPreset(''); // se guarda como plantilla local también
      setStage('success');
    } catch {
      setStage('error');
      setErrorMsg('Problema de red. Intentá de nuevo.');
    }
  }

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className="twk-fab"
        aria-label="Abrir panel de personalización"
        aria-expanded={open}
        onClick={() => (open ? closePanel() : openPanel())}
      >
        <span className="twk-fab-dot" aria-hidden="true" />
        <span className="twk-fab-lbl">Tweaks</span>
      </button>

      {open && (
        <div ref={cardRef} className="twk-panel" role="dialog" aria-label="Tweaks · AG Studio">
          <div className="twk-hd">
            <b>Tweaks · AG Studio</b>
            <button type="button" className="twk-x" aria-label="Cerrar panel" onClick={closePanel}>
              ✕
            </button>
          </div>

          <div className="twk-body">
            {/* Plantillas (presets) */}
            <PresetsDropdown
              ref={presetsRef}
              open={presetsOpen}
              onOpenChange={setPresetsOpen}
              factory={FACTORY_PRESETS}
              user={presets}
              onApply={(id) => { applyPreset(id); setPresetsOpen(false); }}
              onRemove={removePreset}
            />

            {/* Paleta */}
            <div className="twk-sect">Paleta</div>
            <div className="twk-chips" role="radiogroup" aria-label="Paleta">
              {PALETTES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={tweaks.palette === p.value}
                  aria-label={p.label}
                  title={p.label}
                  className={`twk-chip ${tweaks.palette === p.value ? 'is-on' : ''}`}
                  style={{ background: p.hero }}
                  onClick={() => setKey('palette', p.value)}
                >
                  <span>
                    {p.rest.map((c) => <i key={c} style={{ background: c }} />)}
                  </span>
                </button>
              ))}
            </div>

            <SegmentedRadio
              label="Modo"
              value={tweaks.mode}
              options={MODES}
              onChange={(v) => setKey('mode', v)}
            />

            {/* Tipografía */}
            <div className="twk-sect">Tipografía</div>
            <SegmentedRadio
              label="Familia"
              value={tweaks.type}
              options={TYPES}
              onChange={(v) => setKey('type', v)}
            />
            <SegmentedRadio
              label="Marquee"
              value={tweaks.marquee}
              options={MARQUEES}
              onChange={(v) => setKey('marquee', v)}
            />

            {/* Bordes */}
            <div className="twk-sect">Bordes</div>
            <SegmentedRadio
              label="Carrusel"
              value={tweaks.carouselRadius}
              options={RADII}
              onChange={(v) => setKey('carouselRadius', v)}
            />
            <SegmentedRadio
              label="Imágenes"
              value={tweaks.imageRadius}
              options={RADII}
              onChange={(v) => setKey('imageRadius', v)}
            />
            <SegmentedRadio
              label="Botones"
              value={tweaks.buttonRadius}
              options={RADII}
              onChange={(v) => setKey('buttonRadius', v)}
            />

            {/* Carrusel */}
            <div className="twk-sect">Carrusel</div>
            <SegmentedRadio
              label="Variante"
              value={tweaks.carousel}
              options={CAROUSEL_VARIANTS}
              onChange={(v) => setKey('carousel', v)}
            />

            <RangeRow
              label="Velocidad fila 1"
              value={tweaks.carouselSpeedR1}
              min={0.1} max={3.0} step={0.05}
              onChange={(v) => setKey('carouselSpeedR1', v)}
              format={(v) => v.toFixed(2)}
            />
            <RangeRow
              label="Velocidad fila 2"
              value={tweaks.carouselSpeedR2}
              min={0.1} max={3.0} step={0.05}
              onChange={(v) => setKey('carouselSpeedR2', v)}
              format={(v) => v.toFixed(2)}
            />
            <RangeRow
              label="Velocidad fila 3"
              value={tweaks.carouselSpeedR3}
              min={0.1} max={3.0} step={0.05}
              onChange={(v) => setKey('carouselSpeedR3', v)}
              format={(v) => v.toFixed(2)}
            />
            <RangeRow
              label="Altura"
              value={tweaks.carouselHeight}
              min={0.65} max={1.2} step={0.02}
              onChange={(v) => setKey('carouselHeight', v)}
              format={(v) => `${Math.round(v * 100)}%`}
            />

            {/* Layout */}
            <div className="twk-sect">Layout</div>
            <SegmentedRadio
              label="Densidad"
              value={tweaks.density}
              options={DENSITIES}
              onChange={(v) => setKey('density', v)}
            />
            <RangeRow
              label="Escala UI"
              value={tweaks.uiScale}
              min={0.85} max={1.3} step={0.02}
              onChange={(v) => setKey('uiScale', v)}
              format={(v) => `${Math.round(v * 100)}%`}
            />

            {/* Color */}
            <div className="twk-sect">Color de acento</div>
            <div className="twk-color">
              <label
                className="twk-color-swatch"
                style={{ background: tweaks.accent || 'var(--accent)' }}
                aria-label="Elegir color de acento"
              >
                <input
                  type="color"
                  value={tweaks.accent || '#6b85a0'}
                  onChange={(e) => setKey('accent', e.target.value)}
                />
              </label>
              <div className="twk-color-presets">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`twk-color-preset ${tweaks.accent === c ? 'is-on' : ''}`}
                    style={{ background: c }}
                    onClick={() => setKey('accent', c)}
                    aria-label={`Acento ${c}`}
                  />
                ))}
                {tweaks.accent && (
                  <button
                    type="button"
                    className="twk-color-reset"
                    onClick={() => setKey('accent', null)}
                    title="Volver al acento de la paleta"
                  >
                    auto
                  </button>
                )}
              </div>
            </div>

            {/* Arancha Gurruchaga — hero customizer */}
            <div className="twk-sect">Arancha Gurruchaga</div>
            <SegmentedRadio
              label="Layout"
              value={tweaks.heroLayout}
              options={HERO_LAYOUTS}
              onChange={(v) => setKey('heroLayout', v)}
            />
            <RangeRow
              label="Tamaño"
              value={tweaks.heroSize}
              min={0.6} max={1.5} step={0.02}
              onChange={(v) => setKey('heroSize', v)}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <RangeRow
              label="Indent 2ª palabra"
              value={tweaks.heroIndent}
              min={0} max={1} step={0.02}
              onChange={(v) => setKey('heroIndent', v)}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <RangeRow
              label="Letter-spacing"
              value={tweaks.heroLetterSpacing}
              min={-0.06} max={0.06} step={0.005}
              onChange={(v) => setKey('heroLetterSpacing', v)}
              format={(v) => `${v.toFixed(3)}em`}
            />
            <SegmentedRadio
              label="Acento"
              value={tweaks.heroAccentWord}
              options={HERO_ACCENTS}
              onChange={(v) => setKey('heroAccentWord', v)}
            />
            <SegmentedRadio
              label="Separador"
              value={tweaks.heroSeparator}
              options={HERO_SEPARATORS}
              onChange={(v) => setKey('heroSeparator', v)}
            />
            <div className="twk-row twk-row-h">
              <span className="twk-lbl">Itálica</span>
              <button
                type="button"
                role="switch"
                aria-checked={tweaks.heroItalic}
                aria-label="Itálica"
                className={`twk-toggle ${tweaks.heroItalic ? 'is-on' : ''}`}
                onClick={() => setKey('heroItalic', !tweaks.heroItalic)}
              >
                <i />
              </button>
            </div>
            <div className="twk-row twk-row-h">
              <span className="twk-lbl">Outline (hueco)</span>
              <button
                type="button"
                role="switch"
                aria-checked={tweaks.heroStroke}
                aria-label="Outline"
                className={`twk-toggle ${tweaks.heroStroke ? 'is-on' : ''}`}
                onClick={() => setKey('heroStroke', !tweaks.heroStroke)}
              >
                <i />
              </button>
            </div>

            {/* Sensación */}
            <div className="twk-sect">Sensación</div>
            <div className="twk-row twk-row-h">
              <span className="twk-lbl">Marca de agua</span>
              <button
                type="button"
                role="switch"
                aria-checked={tweaks.watermark}
                aria-label="Activar marca de agua"
                className={`twk-toggle ${tweaks.watermark ? 'is-on' : ''}`}
                onClick={() => setKey('watermark', !tweaks.watermark)}
              >
                <i />
              </button>
            </div>
            <div className="twk-row twk-row-h">
              <span className="twk-lbl">Reducir movimiento</span>
              <button
                type="button"
                role="switch"
                aria-checked={tweaks.motion === 'reduced'}
                aria-label="Reducir animaciones"
                className={`twk-toggle ${tweaks.motion === 'reduced' ? 'is-on' : ''}`}
                onClick={() => setKey('motion', tweaks.motion === 'reduced' ? 'full' : 'reduced')}
              >
                <i />
              </button>
            </div>

            {/* Acciones */}
            <div className="twk-actions">
              <button
                type="button"
                className={`twk-btn-primary ${stage === 'submitting' ? 'is-loading' : ''} ${stage === 'success' ? 'is-success' : ''} ${stage === 'error' ? 'is-error' : ''}`}
                onClick={submitFeedback}
                disabled={stage === 'submitting'}
                aria-live="polite"
              >
                {stage === 'idle' && (
                  <>
                    <span className="twk-heart" aria-hidden="true">♥</span>
                    Me gusta esta configuración
                  </>
                )}
                {stage === 'submitting' && (
                  <>
                    <span className="twk-spin" aria-hidden="true" />
                    Enviando…
                  </>
                )}
                {stage === 'success' && (
                  <>
                    <span aria-hidden="true">✓</span>
                    ¡Guardada y enviada!
                  </>
                )}
                {stage === 'error' && (
                  <>
                    <span aria-hidden="true">!</span>
                    Reintentar
                  </>
                )}
              </button>
              <p className="twk-help">
                Se guarda como plantilla local y le llega un correo al estudio.
              </p>
              {stage === 'error' && errorMsg && (
                <p className="twk-err" role="alert">{errorMsg}</p>
              )}
              <button type="button" className="twk-btn-secondary" onClick={reset}>
                Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SegmentedRadio({ label, value, options, onChange }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="twk-row">
      <span className="twk-lbl">{label}</span>
      <div className="twk-seg" role="radiogroup" aria-label={label}>
        <span
          className="twk-seg-thumb"
          style={{
            left: `calc(2px + ${idx} * (100% - 4px) / ${options.length})`,
            width: `calc((100% - 4px) / ${options.length})`,
          }}
        />
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeRow({ label, value, min, max, step, onChange, format }) {
  return (
    <div className="twk-row">
      <span className="twk-lbl">
        {label} <span className="twk-lbl-val">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        className="twk-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}

const PresetsDropdown = forwardRef(function PresetsDropdown(
  { open, onOpenChange, factory, user, onApply, onRemove },
  ref,
) {
  return (
    <div className="twk-presets" ref={ref}>
      <button
        type="button"
        className="twk-presets-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <span className="twk-presets-icon" aria-hidden="true">▦</span>
        <span>Plantillas</span>
        <span className="twk-presets-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="twk-presets-menu" role="listbox">
          <div className="twk-presets-group">De fábrica</div>
          {factory.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected="false"
              className="twk-presets-item"
              onClick={() => onApply(p.id)}
              title={p.description}
            >
              <span>{p.name}</span>
              <span className="twk-presets-desc">{p.description}</span>
            </button>
          ))}
          {user.length > 0 ? (
            <>
              <div className="twk-presets-group">Mis plantillas</div>
              {user.map((p) => (
                <div key={p.id} className="twk-presets-item-row">
                  <button
                    type="button"
                    className="twk-presets-item twk-presets-item--row"
                    onClick={() => onApply(p.id)}
                  >
                    <span>{p.name}</span>
                  </button>
                  <button
                    type="button"
                    className="twk-presets-del"
                    aria-label={`Eliminar ${p.name}`}
                    onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="twk-presets-empty">
              Pulse <b>Me gusta esta configuración</b> para guardar la actual aquí.
            </div>
          )}
        </div>
      )}
    </div>
  );
});
