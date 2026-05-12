const DEFAULT_WORDS = [
  'ver', 'creer', 'imaginar', 'diseñar', 'medir', 'cortar', 'lijar',
  'ensamblar', 'pulir', 'laquear', 'fabricar', 'instalar', 'habitar',
  'transformar', 'crear', 'soñar', 'durar', 'cuidar', 'cocinar',
];

export default function TaglineMarquee({ words = DEFAULT_WORDS }) {
  // Duplicamos varias veces para que el bucle CSS translateX(-50%) no muestre huecos
  const items = Array.from({ length: 3 }).flatMap((_, i) =>
    words.map((w, j) => ({ w, k: `${i}-${j}` })),
  );
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {items.map(({ w, k }) => (
          <span key={k}>{w}</span>
        ))}
      </div>
    </div>
  );
}
