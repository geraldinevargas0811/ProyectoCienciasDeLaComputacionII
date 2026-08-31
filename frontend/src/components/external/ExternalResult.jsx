// Resultado de la búsqueda externa: clave buscada, resultado, posición,
// bloque/cubeta, comparaciones, accesos y tiempo.
export default function ExternalResult({ result, timeMs, targetLabel = 'Clave buscada' }) {
  if (!result) return null;
  const found = Boolean(result.found);
  const location = result.block != null
    ? `Bloque ${result.block}`
    : result.bucket != null
      ? `Cubeta ${result.bucket}`
      : '—';
  return <section className="panel result-panel">
    <h2>Resultado</h2>
    <div className="result-grid">
      <div><span>{targetLabel}</span><strong>{result.key ?? result.target ?? '—'}</strong></div>
      <div><span>Resultado</span><strong>{found ? 'Encontrado' : 'No encontrado'}</strong></div>
      <div><span>Posición</span><strong>{result.position != null ? result.position : '—'}</strong></div>
      <div><span>Bloque/Cubeta</span><strong>{location}</strong></div>
      <div><span>Comparaciones</span><strong>{result.comparisons != null ? result.comparisons : '—'}</strong></div>
      <div><span>Accesos</span><strong>{result.accesses != null ? result.accesses : '—'}</strong></div>
      <div><span>Tiempo</span><strong>{timeMs != null ? `${timeMs} ms` : '—'}</strong></div>
    </div>
  </section>;
}