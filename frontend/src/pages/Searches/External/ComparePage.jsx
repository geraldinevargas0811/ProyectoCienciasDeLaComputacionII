import { useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { randomRecords, validKey, keyLengthError } from '../../../utils/external/dataGenerators';
import { sqrtBlockSize, sortByKey } from '../../../utils/external/fileBlocks';
import { sequentialBlockSearch } from '../../../utils/external/sequentialBlock';
import { sequentialIndexSearch } from '../../../utils/external/sequentialIndex';
import { binaryFileSearch } from '../../../utils/external/binaryFile';
import { buildBucketFile, searchBucketFile } from '../../../utils/external/buckets';

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

// Comparación de los métodos de búsqueda externa sobre la misma estructura
// comparaciones, accesos, tiempo, bloques/cubetas consultados y resultado.
export default function ComparePage() {
  const [count, setCount] = useState('16');
  const [digits, setDigits] = useState('3');
  const [target, setTarget] = useState('500');
  const [rows, setRows] = useState(null);
  const [records, setRecords] = useState(null);
  const [message, setMessage] = useState(null);

  const runCompare = () => {
    if (!target) { setMessage({ type: 'error', text: 'Indica la clave a buscar.' }); return; }
    if (!validKey(target, digits)) { setMessage(keyLengthError('search', digits)); return; }
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) { setMessage({ type: 'error', text: 'Indica un tamaño válido para la estructura.' }); return; }
    const unsorted = randomRecords(n, Number(digits));
    if (!unsorted) { setMessage({ type: 'error', text: `No es posible generar ${n} claves únicas de ${digits} dígitos.` }); return; }
    const sorted = sortByKey(unsorted);
    const blockSize = sqrtBlockSize(n);
    const M = Math.max(3, blockSize) + (Math.max(3, blockSize) % 2 !== 0 ? 1 : 0);

    const time = (fn) => { const t0 = performance.now(); const r = fn(); return { r, ms: Math.max(1, Math.round(performance.now() - t0)) }; };

    const seqBlock = time(() => sequentialBlockSearch(unsorted, target, blockSize));
    const seqIndex = time(() => sequentialIndexSearch(sorted, target, blockSize));
    const binaria = time(() => binaryFileSearch(sorted, target, blockSize));
    const cubetas = time(() => {
      const built = buildBucketFile({ keys: sorted.map((r) => r.key), size: M, capacity: 2, hashFunction: 'modulo' });
      return searchBucketFile(target, { directory: built.directory, size: M, capacity: 2, hashFunction: 'modulo' });
    });

    const data = [
      { metodo: 'Búsqueda secuencial (bloques)', ...seqBlock.r, ms: seqBlock.ms, location: seqBlock.r.block ? `Bloque ${seqBlock.r.block}` : '—', usado: 'Estructura en orden de inserción' },
      { metodo: 'Búsqueda secuencial (con índices)', ...seqIndex.r, ms: seqIndex.ms, location: seqIndex.r.block ? `Bloque ${seqIndex.r.block}` : '—', usado: 'Estructura ordenada + índice' },
      { metodo: 'Búsqueda binaria', ...binaria.r, ms: binaria.ms, location: binaria.r.block ? `Bloque ${binaria.r.block}` : '—', usado: 'Estructura ordenada' },
      { metodo: 'Búsqueda por transformación de claves (cubetas)', ...cubetas.r, ms: cubetas.ms, location: cubetas.r.bucket ? `Cubeta ${cubetas.r.bucket}` : '—', usado: `M = ${M} cubetas · capacidad 2` },
    ];

    const bestAccesses = Math.min(...data.map((d) => d.accesses));
    const bestComparisons = Math.min(...data.map((d) => d.comparisons));
    const bestTime = Math.min(...data.map((d) => d.ms));
    setRows(data.map((d) => ({ ...d, bestAcc: d.accesses === bestAccesses, bestCmp: d.comparisons === bestComparisons, bestTime: d.ms === bestTime })));
    setRecords(unsorted);
    setMessage({ type: 'success', text: 'Comparación ejecutada: revisa los resultados.' });
  };

  return (
    <>
      <PageHeader title="Comparación de métodos" />
      <div className="lab-layout">
        <div className="lab-layout__controls">
          <section className="panel">
            <h2>Parámetros de comparación</h2>
            <div className="form-grid">
              <label>Tamaño de la estructura (N)<input type="number" min="4" step="1" inputMode="numeric" value={count} onChange={(event) => setCount(digitsOnly(event.target.value))} /></label>
              <label>Dígitos de las claves<select value={digits} onChange={(event) => setDigits(event.target.value)}>{['2', '3', '4'].map((d) => <option key={d} value={d}>{d} dígitos</option>)}</select></label>
            </div>
            <div className="operation">
              <label>Clave a buscar<input inputMode="numeric" maxLength={Number(digits)} placeholder="Clave" value={target} onChange={(event) => setTarget(digitsOnly(event.target.value))} /></label>
              <Button onClick={runCompare}>Generar y comparar</Button>
            </div>
            {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
          </section>
          {records && (
            <section className="panel">
              <h2>Estructura generada</h2>
              <div className="keys-panel"><small>Orden de inserción: {records.map((r) => r.key).join(' ')}</small></div>
              <p className="panel__intro">BLOQUE = √{records.length} = {sqrtBlockSize(records.length)} registro(s) por bloque. La búsqueda con índices y la binaria requieren la estructura ordenada.</p>
            </section>
          )}
        </div>
        <div className="lab-layout__visual">
          <section className="panel">
            <h2>Resultados por método</h2>
            {rows ? (
              <div className="compare-scroll">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th>Método</th>
                      <th>Comparaciones</th>
                      <th>Accesos</th>
                      <th>Tiempo</th>
                      <th>Resultado</th>
                      <th>Bloque/Cubeta</th>
                      <th>Posición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.metodo}>
                        <td><strong>{row.metodo}</strong><small>{row.usado}</small></td>
                        <td className={row.bestCmp ? 'cmp-best' : ''}>{row.comparisons}</td>
                        <td className={row.bestAcc ? 'cmp-best' : ''}>{row.accesses}</td>
                        <td className={row.bestTime ? 'cmp-best' : ''}>{row.ms} ms</td>
                        <td>{row.found ? 'Encontrado' : 'No encontrado'}</td>
                        <td>{row.location}</td>
                        <td>{row.found ? `pos. ${row.position}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="visualization-placeholder"><span>⚖</span><p>Configura los parámetros y genera la comparación para comenzar.</p></div>}
          </section>
          {rows && (
            <section className="panel intro-readme">
              <h2>Análisis</h2>
              <p><b>Accesos a disco</b>: la búsqueda binaria lee solo un bloque por comparación (~log₂N), la secuencial con índices lee solo el bloque señalado por el índice y la secuencial por bloques recorre toda la estructura en el peor caso.</p>
              <p><b>Comparaciones</b>: la binaria hace muy pocas comparaciones sobre la estructura ordenada; la secuencial compara registro a registro (O(N)).</p>
              <p><b>Tiempo</b>: medido en el navegador para los pasos reales del algoritmo (una sola ejecución); varía según el equipo y la clave consultada.</p>
              <p>Las celdas verdes marcan el mejor valor de cada columna.</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}