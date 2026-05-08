// Tweaks panel para Gurruchaga — paleta, tipografía, carrusel, modo, densidad
// Aplica los tweaks via data-attrs en <html> y los expone via window.useGurruchagaTweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "azul",
  "type": "editorial",
  "carousel": "paralelo",
  "mode": "light",
  "density": "amplio"
}/*EDITMODE-END*/;

function applyTweaksToRoot(t) {
  const r = document.documentElement;
  r.setAttribute("data-palette", t.palette);
  r.setAttribute("data-type", t.type);
  r.setAttribute("data-mode", t.mode);
  r.setAttribute("data-density", t.density);
}

// Aplica defaults de inmediato (antes del primer paint) — protege de FOUC
applyTweaksToRoot(TWEAK_DEFAULTS);

function GurruTweaks() {
  const { TweaksPanel, TweakSection, TweakRadio, TweakSelect, useTweaks } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyTweaksToRoot(t); }, [t]);

  return (
    <TweaksPanel title="Tweaks · Gurruchaga">
      <TweakSection title="Apariencia">
        <TweakRadio
          label="Modo"
          value={t.mode}
          onChange={(v) => setTweak("mode", v)}
          options={[
            { value: "light", label: "Claro" },
            { value: "dark",  label: "Oscuro" },
          ]}
        />
        <TweakSelect
          label="Paleta"
          value={t.palette}
          onChange={(v) => setTweak("palette", v)}
          options={[
            { value: "azul", label: "Azul AG + neutros" },
            { value: "mono", label: "Monocromo + acento azul" },
            { value: "warm", label: "Cálido (madera) + azul" },
          ]}
        />
        <TweakSelect
          label="Tipografía"
          value={t.type}
          onChange={(v) => setTweak("type", v)}
          options={[
            { value: "editorial",   label: "Sans + serif editorial (Manrope · Instrument)" },
            { value: "display-fino", label: "Sans + display fino (Manrope · Bodoni)" },
            { value: "grotesque",   label: "Solo grotesque (Bricolage)" },
          ]}
        />
        <TweakRadio
          label="Densidad"
          value={t.density}
          onChange={(v) => setTweak("density", v)}
          options={[
            { value: "amplio",    label: "Amplio" },
            { value: "compacto",  label: "Compacto" },
          ]}
        />
      </TweakSection>
      <TweakSection title="Carrusel del Home">
        <TweakSelect
          label="Variante"
          value={t.carousel}
          onChange={(v) => setTweak("carousel", v)}
          options={[
            { value: "paralelo", label: "Paralelo · 3 filas opuestas" },
            { value: "infinito", label: "Infinito · una fila + hover" },
            { value: "diagonal", label: "Diagonal · rotado -7°" },
          ]}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// Exponer estado global para que la landing lea el tipo de carrusel
function GurruTweaksWithSubscriber({ onChange }) {
  const { useTweaks } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaksToRoot(t); onChange && onChange(t); }, [t]);

  // Reusa la UI de GurruTweaks
  return <_GurruTweaksInner t={t} setTweak={setTweak} />;
}

function _GurruTweaksInner({ t, setTweak }) {
  const { TweaksPanel, TweakSection, TweakRadio, TweakSelect } = window;
  return (
    <TweaksPanel title="Tweaks · Gurruchaga">
      <TweakSection title="Apariencia">
        <TweakRadio label="Modo" value={t.mode} onChange={(v) => setTweak("mode", v)}
          options={[{ value: "light", label: "Claro" }, { value: "dark", label: "Oscuro" }]} />
        <TweakSelect label="Paleta" value={t.palette} onChange={(v) => setTweak("palette", v)}
          options={[
            { value: "azul", label: "Azul AG + neutros" },
            { value: "mono", label: "Monocromo + acento azul" },
            { value: "warm", label: "Cálido (madera) + azul" },
          ]} />
        <TweakSelect label="Tipografía" value={t.type} onChange={(v) => setTweak("type", v)}
          options={[
            { value: "editorial", label: "Editorial · Manrope + Instrument" },
            { value: "display-fino", label: "Display fino · Bodoni" },
            { value: "grotesque", label: "Grotesque · Bricolage" },
          ]} />
        <TweakRadio label="Densidad" value={t.density} onChange={(v) => setTweak("density", v)}
          options={[{ value: "amplio", label: "Amplio" }, { value: "compacto", label: "Compacto" }]} />
      </TweakSection>
      <TweakSection title="Carrusel del Home">
        <TweakSelect label="Variante" value={t.carousel} onChange={(v) => setTweak("carousel", v)}
          options={[
            { value: "paralelo", label: "Paralelo · 3 filas opuestas" },
            { value: "infinito", label: "Infinito · una fila + hover" },
            { value: "diagonal", label: "Diagonal · rotado -7°" },
          ]} />
      </TweakSection>
    </TweaksPanel>
  );
}

window.GurruTweaks = GurruTweaks;
window.GurruTweaksWithSubscriber = GurruTweaksWithSubscriber;
window.GURRU_TWEAK_DEFAULTS = TWEAK_DEFAULTS;
