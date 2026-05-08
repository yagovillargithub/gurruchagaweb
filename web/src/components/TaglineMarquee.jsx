const DEFAULT_WORDS = ['ver', 'creer', 'diseñar', 'fabricar', 'habitar'];

export default function TaglineMarquee({ words = DEFAULT_WORDS }) {
  const items = Array.from({ length: 4 }).flatMap((_, i) =>
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
