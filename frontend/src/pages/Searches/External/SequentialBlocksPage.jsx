import { useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import DataPanel from '../../../components/external/DataPanel';
import FileBlocks from '../../../components/external/FileBlocks';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import ExternalResult from '../../../components/external/ExternalResult';
import StepControls from '../../../components/external/StepControls';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { randomRecords, nameFor } from '../../../utils/external/dataGenerators';
import { sqrtBlockSize } from '../../../utils/external/fileBlocks';
import { sequentialBlockSearch } from '../../../utils/external/sequentialBlock';

// BÚSQUEDA SECUENCIAL — USANDO BLOQUES (sección de la BÚSQUEDA SECUENCIAL).
export default function SequentialBlocksPage() {
  const [count, setCount] = useState('8');
  const [digits, setDigits] = useState('2');
  const [tab, setTab] = useState('search');
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
    if (!Number.isInteger(n) || n < 1) { setMessage({ type: 'error', text: 'Indica un número de registros válido.' }); return; }
    setRecords([]);
    setResult(null);
    setMessage({ type: 'success', text: `Archivo creado: capacidad N = ${n} registros. BLOQUE = √N = √${n} = ${sqrtBlockSize(n)}. Genera o ingresa los registros.` });
  };

  const generate = () => {
    if (!records) return { type: 'error', text: 'Crea el archivo antes de generar registros.' };
    const generated = randomRecords(records.length, Number(digits));
    if (!generated) return { type: 'error', text: 'No es posible generar claves únicas con esos dígitos.' };
    setRecords(generated);
    setResult(null);
    return { type: 'success', text: `${records.length} registros aleatorios generados con claves únicas.` };
  };

  const insertManual = (raw) => {
    if (!records) return { type: 'error', text: 'Crea el archivo antes de ingresar registros.' };
    const key = String(raw ?? '').replace(/\D/g, '');
    if (!key || key.length > Number(digits)) return { type: 'error', text: `La clave debe tener hasta ${digits} dígitos.` };
    if (records.some((r) => r.key === key)) return { type: 'error', text: 'La clave ya existe en el archivo.' };
    setRecords([...records, { key, name: nameFor(records) }]);
    setResult(null);
    return { type: 'success', text: `Registro ${key} añadido al final del archivo. N ahora es ${records.length + 1}.` };
  };

  const runSearch = async (target) => {
    if (!records || records.length === 0) return { type: 'error', text: 'Crea el archivo con registros antes de buscar.' };
    const t0 = performance.now();
    const res = sequentialBlockSearch(records, String(target), blockSize);
    setResult(res);
    setLastTarget(String(target));
    setTimeMs(Math.max(1, Math.round(performance.now() - t0)));
    setTab('search');
    return { type: res.found ? 'success' : 'error', text: res.found ? `Clave ${target} encontrada en el BLOQUE ${res.block}, posición ${res.position}.` : `La clave ${target} no se encuentra en el archivo.` };
  };

  const activeSlot = step?.slot ?? null;
  const activeBlock = step?.block ?? null;

  return (
    <>
      <PageHeader title="USANDO BLOQUES" eyebrow="Búsqueda Secuencial" description={`Búsqueda secuencial recorriendo los bloques del archivo. BLOQUE = √N con N = ${records ? records.length : count} registros → ${blockSize} registro(s) por bloque.`} />
      <Tabs tabs={[['search', 'USANDO BLOQUES'], ['about', 'Explicación']]} active={tab} onChange={setTab} />
      {tab === 'about' ? (
        <section className="panel intro-readme">
          <h2>Explicación — Búsqueda secuencial usando bloques</h2>
          <p>El archivo de N registros se divide en <b>bloques</b>. Según las notas del profesor, <b>BLOQUE = √N</b>: el tamaño de cada bloque es la raíz cuadrada del número de registros (redondeada hacia arriba). Así, el archivo queda partido en ⌈N / √N⌉ bloques.</p>
          <p>La búsqueda recorre los bloques en orden. Cada vez que se consulta un bloque se produce un <b>acceso a disco</b> (la lectura de un bloque completo); dentro del bloque las comparaciones contra cada registro se hacen en memoria.</p>
          <p>La vista resalta el <b>bloque en consulta</b> durante la búsqueda y muestra el número de accesos y de comparaciones.</p>
        </section>
      ) : (
        <div className="external-grid">
          <div className="external-grid__controls">
            <DataPanel
              count={count} onCountChange={setCount}
              digits={digits} onDigitsChange={setDigits}
              onCreate={createFile} onGenerate={generate} onManualInsert={insertManual} onSearch={runSearch}
              message={message} loaded={loaded} existingCount={records?.length ?? 0}
              createLabel="Crear archivo"
            />
            {result && <ExternalResult result={{ ...result, key: lastTarget }} timeMs={timeMs} />}
          </div>
          <div className="external-grid__visual">
            <section className="panel">
              <h2>Visualización del archivo por bloques</h2>
              {records ? (
                <FileBlocks records={records} blockSize={blockSize} activeBlock={activeBlock} activeSlot={activeSlot} foundPosition={result?.found ? result.position : null} />
              ) : <div className="visualization-placeholder"><span>▤</span></div>}
            </section>
            {result ? (
              <>
                <ExplanationPanel index={player.stepIndex} total={totalSteps} playing={player.playing} description={step?.description} chips={[['BLOQUE', activeBlock != null ? activeBlock + 1 : '—'], ['Accesos', step?.accesses ?? 0], ['Comparaciones', step?.comparisons ?? 0]]} />
                <StepControls {...player} />
              </>
            ) : <div className="placeholder-hint">Configura el archivo y presiona Buscar para iniciar el paso a paso.</div>}
          </div>
        </div>
      )}
    </>
  );
}