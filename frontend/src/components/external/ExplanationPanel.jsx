// Panel de explicación: muestra el paso actual del algoritmo y su descripción,
// acompañado de las métricas relevantes de ese paso (accesos, comparaciones, etc.).
export default function ExplanationPanel({ index, total, description, chips = [], playing = false }) {
  return <section className="panel">
    <h2>Explicación de lo que hace el algoritmo</h2>
    <div className="algorithm-step" aria-live="polite">
      <span>Paso {Math.min(index + 1, Math.max(total, 1))} de {total}{playing ? ' · reproduciendo…' : ''}</span>
      {chips.length > 0 && <div className="chips">{chips.map(([label, value]) => <span key={label} className="chip"><b>{label}</b>{value}</span>)}</div>}
      <p>{description}</p>
    </div>
  </section>;
}