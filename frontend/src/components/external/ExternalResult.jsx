// Resultado de la búsqueda externa: clave buscada, resultado, posición,
// bloque/cubeta, comparaciones, accesos y tiempo.
export default function ExternalResult({ result, timeMs, targetLabel = 'CLAVE BUSCADA' }) {
  if (!result) return null;
  const found = Boolean(result.found);
  const location = result.block != null
    ? `BLOQUE ${result.block}`
    : result.bucket != null
      ? `CUBETA ${result.bucket}`
      : '—';
  return <section className="panel result-panel external-result">
    <h2>Resultado de la búsqueda</h2>
    <div className="result-grid">
      <div><span>{targetLabel}</span><strong>{result.key ?? result.target ?? '—'}</strong></div>
      <div><span>Resultado</span><strong>{found ? 'ENCONTRADO' : 'NO ENCONTRADO'}</strong></div>
      <div><span>Posición</span><strong>{result.position != null ? result.position : '—'}</strong></div>
      <div><span>Bloque/Cubeta</span><strong>{location}</strong></div>
      <div><span>Comparaciones</span><strong>{result.comparisons != null ? result.comparisons : '—'}</strong></div>
      <div><span>Accesos</span><strong>{result.accesses != null ? result.accesses : '—'}</strong></div>
      <div><span>Tiempo</span><strong>{timeMs != null ? `${timeMs} ms` : '—'}</strong></div>
    </div>
  </section>;
}