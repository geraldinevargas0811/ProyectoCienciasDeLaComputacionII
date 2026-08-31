import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import DataPanel from '../../../components/external/DataPanel';
import IndexFileViz from '../../../components/external/IndexFileViz';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import ExternalResult from '../../../components/external/ExternalResult';
import StepControls from '../../../components/external/StepControls';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { randomRecords, nameFor } from '../../../utils/external/dataGenerators';
import { sqrtBlockSize, sortByKey } from '../../../utils/external/fileBlocks';
import { buildSparseIndex, sequentialIndexSearch } from '../../../utils/external/sequentialIndex';

// BÚSQUEDA SECUENCIAL — CON ÍNDICES.
export default function SequentialIndexPage() {
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
  const indexEntries = useMemo(() => (records && records.length ? buildSparseIndex(sorted, blockSize) : []), [sorted, blockSize]);

  const totalSteps = result?.steps?.length ?? 0;
  const player = useStepPlayer(totalSteps);
  const step = result?.steps?.[player.stepIndex];

  const createFile = () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) { setMessage({ type: 'error', text: 'Indica un número de registros válido.' }); return; }
    setRecords([]);
    setResult(null);
    setMessage({ type: 'success', text: 'Archivo creado. Se construirá un archivo de índices con una entrada por bloque (una vez que existan registros).' });
  };

  const generate = () => {
    if (!records) return { type: 'error', text: 'Crea el archivo antes de generar registros.' };
    const generated = randomRecords(records.length, Number(digits));
    if (!generated) return { type: 'error', text: 'No es posible generar claves únicas con esos dígitos.' };
    setRecords(generated);
    setResult(null);
    return { type: 'success', text: `${records.length} registros aleatorios generados. Se ordenan para la búsqueda con índices.` };
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
    const res = sequentialIndexSearch(sorted, String(target), blockSize);
    setResult({ ...res, key: String(target), indexReads: res.indexReads });
    setLastTarget(String(target));
    setTimeMs(Math.max(1, Math.round(performance.now() - t0)));
    return { type: res.found ? 'success' : 'error', text: res.found ? `Clave ${target} encontrada en el BLOQUE ${res.block}, posición ${res.position}.` : `La clave ${target} no se encuentra en el archivo.` };
  };

  return (
    <>
      <PageHeader title="CON ÍNDICES" eyebrow="Búsqueda Secuencial" description="El archivo de índices localiza la posición aproximada de la clave y luego se ejecuta la búsqueda secuencial sobre el archivo de datos." />
      <Tabs tabs={[['search', 'CON ÍNDICES'], ['about', 'Explicación']]} active={tab} onChange={setTab} />
      {tab === 'about' ? (
        <section className="panel intro-readme">
          <h2>Explicación — Búsqueda secuencial con índices</h2>
          <p>Existen dos estructuras: el <b>archivo principal de datos</b> (organizado/ordenado y dividido en bloques) y el <b>archivo de índices</b>.</p>
          <p>Cada entrada del índice guarda el primer registro del bloque, el último y la <b>dirección (bloque)</b> donde continúa la búsqueda. El índice se consulta en memoria (no produce accesos a disco) y permite localizar una <b>posición aproximada</b>; a partir de esa posición se realiza la búsqueda secuencial en el archivo de datos.</p>
          <p>La vista muestra la relación entre cada entrada del índice y la posición correspondiente del archivo.</p>
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
              <h2>Visualización: índice y archivo de datos</h2>
              {records && records.length ? (
                <IndexFileViz
                  records={sorted}
                  blockSize={blockSize}
                  indexEntries={indexEntries}
                  activeEntry={step?.type === 'index' ? step.entry : undefined}
                  activeBlock={step?.block != null ? step.block : null}
                  activeSlot={step?.slot ?? null}
                  foundPosition={result?.found ? result.position : null}
                />
              ) : <div className="visualization-placeholder"><span>▥</span></div>}
            </section>
            {result ? (
              <>
                <ExplanationPanel index={player.stepIndex} total={totalSteps} playing={player.playing} description={step?.description} chips={[['Índice', step?.indexReads ?? 0], ['Accesos', step?.accesses ?? 0], ['Comparaciones', step?.comparisons ?? 0]]} />
                <StepControls {...player} />
              </>
            ) : <div className="placeholder-hint">Configura el archivo y presiona Buscar para iniciar el paso a paso.</div>}
          </div>
        </div>
      )}
    </>
  );
}