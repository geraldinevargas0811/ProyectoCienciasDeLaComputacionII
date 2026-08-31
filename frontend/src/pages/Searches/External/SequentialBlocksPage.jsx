import { useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { InsertDataPanel } from '../../../components/search/SearchPanels';
import SearchPanel from '../../../components/external/SearchPanel';
import FileBlocks from '../../../components/external/FileBlocks';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import ExternalResult from '../../../components/external/ExternalResult';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { randomRecords, validKey, keyLengthError } from '../../../utils/external/dataGenerators';
import { sqrtBlockSize } from '../../../utils/external/fileBlocks';
import { sequentialBlockSearch } from '../../../utils/external/sequentialBlock';

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');
const keySizeOptions = [
  ['2', '2 dígitos'],
  ['3', '3 dígitos'],
  ['4', '4 dígitos'],
];

// BÚSQUEDA SECUENCIAL — USANDO BLOQUES (sección de la BÚSQUEDA SECUENCIAL).
export default function SequentialBlocksPage() {
  const [count, setCount] = useState('8');
  const [digits, setDigits] = useState('2');
  const [records, setRecords] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [timeMs, setTimeMs] = useState(null);
  const [lastTarget, setLastTarget] = useState(null);

  const blockSize = records && records.length ? sqrtBlockSize(records.length) : sqrtBlockSize(Number(count) || 1);
  const totalSteps = result?.steps?.length ?? 0;
  const player = useStepPlayer(totalSteps);
  const step = result?.steps?.[player.stepIndex];

  const loaded = records != null;

  const createFile = () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) { setMessage({ type: 'error', text: 'Indica un tamaño válido para la estructura.' }); return; }
    setRecords([]);
    setResult(null);
    setMessage({ type: 'success', text: 'Estructura creada y vacía: lista para el ingreso de datos.' });
  };

  const generate = () => {
    if (!records) return { type: 'error', text: 'Crea la estructura antes de generar registros.' };
    const n = (Number(count) || 0) - records.length;
    if (n <= 0) return { type: 'error', text: 'La estructura está completa.' };
    const generated = randomRecords(n, Number(digits));
    if (!generated) return { type: 'error', text: `No es posible generar ${n} claves únicas de ${digits} dígitos.` };
    setRecords(generated);
    setResult(null);
    return { type: 'success', text: `${n} registros aleatorios generados con claves únicas.` };
  };

  const insertManual = (raw) => {
    if (!records) return { type: 'error', text: 'Crea la estructura antes de ingresar datos.' };
    const key = String(raw ?? '').replace(/\D/g, '');
    if (!validKey(key, digits)) return keyLengthError('insert', digits);
    if (records.length >= Number(count)) return { type: 'error', text: 'La estructura está completa.' };
    if (records.some((r) => r.key === key)) return { type: 'error', text: 'La estructura no admite claves repetidas.' };
    setRecords([...records, { key }]);
    setResult(null);
    return { type: 'success', text: `Dato ${key} añadido al final de la estructura.` };
  };

  const runSearch = async (target) => {
    if (!records) return { type: 'error', text: 'Crea la estructura antes de buscar.' };
    if (records.length === 0) return { type: 'error', text: 'Ingresa datos antes de buscar.' };
    if (!validKey(target, digits)) return keyLengthError('search', digits);
    const t0 = performance.now();
    const res = sequentialBlockSearch(records, String(target), blockSize);
    setResult(res);
    setLastTarget(String(target));
    setTimeMs(Math.max(1, Math.round(performance.now() - t0)));
    return { type: res.found ? 'success' : 'error', text: res.found ? `Clave ${target} encontrada en el Bloque ${res.block}, posición ${res.position}.` : `La clave ${target} no fue encontrada en la estructura.` };
  };

  const clearFile = () => {
    setRecords([]);
    setResult(null);
    return { type: 'success', text: 'Estructura vacía: lista para ingresar nuevos datos.' };
  };

  const activeSlot = step?.slot ?? null;
  const activeBlock = step?.block ?? null;

  const meta = [
    activeBlock != null ? `Bloque consultado: ${activeBlock + 1}` : null,
    `Accesos: ${step?.accesses ?? 0}`,
    `Comparaciones: ${step?.comparisons ?? 0}`,
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Búsqueda secuencial usando bloques" />
      <div className="lab-layout">
          <div className="lab-layout__controls">
            <section className="panel">
              <h2>Crear estructura</h2>
              <div className="form-grid">
                <label>Tamaño de la estructura (N)<input type="number" min="1" step="1" inputMode="numeric" value={count} onChange={(event) => setCount(digitsOnly(event.target.value))} /></label>
                <label>Tamaño de las claves<select value={digits} onChange={(event) => setDigits(event.target.value)}>{keySizeOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
              </div>
              {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
              <Button onClick={createFile}>Crear estructura</Button>
            </section>
            {loaded && <InsertDataPanel insertedCount={records?.length ?? 0} total={Number(count) || 0} onInsert={insertManual} onGenerate={generate} />}
            {loaded && <SearchPanel onSearch={runSearch} maxLength={Number(digits)} />}
            {result && <ExternalResult result={{ ...result, key: lastTarget }} timeMs={timeMs} />}
          </div>
          <div className="lab-layout__visual">
            <section className="panel">
              <h2>Visualización de la estructura</h2>
              {records ? (
                <FileBlocks records={records} blockSize={blockSize} total={Number(count) || 0} activeBlock={activeBlock} activeSlot={activeSlot} foundPosition={result?.found ? result.position : null} />
              ) : <div className="visualization-placeholder"><span>▤</span><p>Crea la estructura para comenzar.</p></div>}
            </section>
            {result && (
              <ExplanationPanel
                {...player}
                currentKey={lastTarget}
                description={step?.description}
                meta={meta}
              />
            )}
          </div>
        </div>
    </>
  );
}