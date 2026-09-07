// DIRECTORIO DE CUBETAS para las búsquedas dinámicas.
// Cuadrícula simple: cada celda es una CUBETA y muestra únicamente los números
// de las claves que contiene (un "·" si está vacía). La cubeta consultada se
// resalta y el motivo de una expansión/reducción (M: X → Y) se indica al pie.
export default function DynamicViz({ buckets, activeBucket, reason }) {
  const total = buckets.reduce((acc, b) => acc + b.length, 0);
  const size = buckets.length || 1;
  const density = total / size;
  const pct = Math.min(100, Math.max(0, density * 100));

  return (
    <div className="dyn-grid">
      <div className="dyn-grid__table">
        {buckets.map((block, index) => {
          const n = index + 1;
          const active = activeBucket === n;
          const keys = block.length ? block.join(' · ') : '·';
          return (
            <div key={n} className={`dyn-cell${active ? ' dyn-cell--active' : ''}`}>
              <strong className="dyn-cell__keys">{keys}</strong>
              <span className="dyn-cell__id">C{n}</span>
            </div>
          );
        })}
      </div>

      <div className="dyn-density">
        <div className="dyn-density__head">
          Densidad de ocupación: <strong>{density.toFixed(2)}</strong>
        </div>
        <div className="dyn-density__bar">
          <span className="dyn-density__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {reason && <div className="dynamic-reason">{reason}</div>}
    </div>
  );
}