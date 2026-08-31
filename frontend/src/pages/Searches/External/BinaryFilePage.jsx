import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import DataPanel from '../../../components/external/DataPanel';
import FileBlocks from '../../../components/external/FileBlocks';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import ExternalResult from '../../../components/external/ExternalResult';
import StepControls from '../../../components/external/StepControls';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { randomRecords, nameFor } from '../../../utils/external/dataGenerators';
import { sqrtBlockSize, sortByKey, blockOf } from '../../../utils/external/fileBlocks';
import { binaryFileSearch } from '../../../utils/external/binaryFile';

// BÚSQUEDA BINARIA.
export default function BinaryFilePage() {
  const [count, setCount] = useState('8');
  const [digits, setDigits] = useState('2');
  const [tab, setTab] = useState('search');
  const [records, setRecords] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [timeMs, setTimeMs] = useState(null);
  const [lastTarget, setLastTarget] = useState(null);

  const blockSize = records && records.length ? sqrtBlockSize(records.length) : sqrtBlockSize(Number(count) || 1);
  const sorted = useMemo(() => (records && records.length ? sortByKey(records) : []), [records]);

  const totalSteps = result?.steps?.length ?? 0;
  const player = useStepPlayer(totalSteps);
  const step = result?.steps?.[player.stepIndex];

  const createFile = () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) { setMessage({ type: 'error', text: 'Indica un número de registros válido.' }); return; }
    setRecords([]);
    setResult(null);
    setMessage({ type: 'success', text: 'Archivo creado. La búsqueda binaria requiere un archivo organizado (ordenado por clave).' });
  };

  const generate = () => {
    if (!records) return { type: 'error', text: 'Crea el archivo antes de generar registros.' };
    const generated = randomRecords(records.length, Number(digits));
    if (!generated) return { type: 'error', text: 'No es posible generar claves únicas con esos dígitos.' };
    setRecords(generated);
    setResult(null);
    return { type: 'success', text: `${records.length} registros aleatorios generados y ordenados por clave.` };
  };

  const insertManual = (raw) => {
    if (!records) return { type: 'error', text: 'Crea el archivo antes de ingresar registros.' };
    const key = String(raw ?? '').replace(/\D/g, '');
    if (!key || key.length > Number(digits)) return { type: 'error', text: `La clave debe tener hasta ${digits} dígitos.` };
    if (records.some((r) => r.key === key)) return { type: 'error', text: 'La clave ya existe en el archivo.' };
    setRecords([...records, { key, name: nameFor(records) }]);
    setResult(null);
    return { type: 'success', text: `Registro ${key} añadido.` };
  };

  const runSearch = async (target) => {
    if (!records || records.length === 0) return { type: 'error', text: 'Crea el archivo con registros antes de buscar.' };
    const t0 = performance.now();
    const res = binaryFileSearch(sorted, String(target), blockSize);
    setResult({ ...res, key: String(target) });
    setLastTarget(String(target));
    setTimeMs(Math.max(1, Math.round(performance.now() - t0)));
    return { type: res.found ? 'success' : 'error', text: res.found ? `Clave ${target} encontrada en la posición ${res.position} (BLOQUE ${res.block}).` : `La clave ${target} no se encuentra en el archivo.` };
  };

  // Resaltar la posición central consultada en el paso actual.
  const midPosition = step?.middle != null ? step.middle : null;
  const midBlock = midPosition ? blockOf(midPosition, blockSize) : null;
  const midSlot = midPosition ? (midPosition - 1) % blockSize : null;

  return (
    <>
      <PageHeader title="BÚSQUEDA BINARIA" eyebrow="Búsquedas Externas" description="Búsqueda binaria sobre un archivo organizado/ordenado: en cada paso se consulta la posición central del intervalo y se reduce el espacio de búsqueda a la mitad, disminuyendo los accesos al dispositivo." />
      <Tabs tabs={[['search', 'BÚSQUEDA BINARIA'], ['about', 'Explicación']]} active={tab} onChange={setTab} />
      {tab === 'about' ? (
        <section className="panel intro-readme">
          <h2>Explicación — Búsqueda binaria en un archivo</h2>
          <p>El archivo debe estar <b>ordenado</b>. La búsqueda trabaja sobre las posiciones del archivo (1..N): se calcula la <b>posición central</b>, se consulta el registro que vive allí y se compara con la clave buscada.</p>
          <p>Cada consulta implica leer del disco el <b>bloque</b> que contiene esa posición (1 acceso). Después de cada comparación queda descartada la mitad del intervalo:</p>
          <ul>
            <li>Si la clave es menor que la central → se busca en la mitad izquierda.</li>
            <li>Si es mayor → se busca en la mitad derecha.</li>
          </ul>
          <p>Así el número de accesos es muy inferior al de la búsqueda secuencial (O(log N) en lugar de O(N)).</p>
        </section>
      ) : (
        <div className="external-grid">
          <div className="external-grid__controls">
            <DataPanel
              count={count} onCountChange={setCount}
              digits={digits} onDigitsChange={setDigits}
              onCreate={createFile} onGenerate={generate} onManualInsert={insertManual} onSearch={runSearch}
              message={message} loaded={records != null} existingCount={records?.length ?? 0}
            />
            {result && <ExternalResult result={{ ...result, key: lastTarget }} timeMs={timeMs} />}
          </div>
          <div className="external-grid__visual">
            <section className="panel">
              <h2>Visualización del archivo ordenado</h2>
              {records && records.length ? (
                <FileBlocks records={sorted} blockSize={blockSize} activeBlock={midBlock} activeSlot={midSlot} foundPosition={result?.found ? result.position : null} />
              ) : <div className="visualization-placeholder"><span>⇆</span></div>}
              {step?.type === 'compare' && (
                <div className="interval-bar">Intervalo actual: <b>posición {step.lower}</b> .. <b>posición {step.upper}</b> · centro = <b>{step.middle}</b></div>
              )}
            </section>
            {result ? (
              <>
                <ExplanationPanel index={player.stepIndex} total={totalSteps} playing={player.playing} description={step?.description} chips={[['Intervalo', step?.lower != null ? `${step.lower}..${step.upper}` : '—'], ['Centro', step?.middle ?? '—'], ['BLOQUE', step?.block ?? '—'], ['Accesos', step?.accesses ?? 0], ['Comparaciones', step?.comparisons ?? 0]]} />
                <StepControls {...player} />
              </>
            ) : <div className="placeholder-hint">Configura el archivo y presiona Buscar para iniciar el paso a paso.</div>}
          </div>
        </div>
      )}
    </>
  );
}