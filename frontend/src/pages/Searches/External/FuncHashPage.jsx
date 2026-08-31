import { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import HashTableViz from '../../../components/external/HashTableViz';
import BucketDirectory from '../../../components/external/BucketDirectory';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import ExternalResult from '../../../components/external/ExternalResult';
import StepControls from '../../../components/external/StepControls';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { generateKeys } from '../../../utils/external/dataGenerators';
import { computeHashTable, HASH_ORDER } from '../../../utils/external/hashFunctions';
import { buildBucketFile, searchBucketFile, collisionsByPosition } from '../../../utils/external/buckets';

const digitOptions = [
  ['1', '1 dígito'],
  ['2', '2 dígitos'],
  ['3', '3 dígitos'],
];
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

// Panel de "claves" compartido por las funciones hash y las colisiones.
function KeyControls({ size, onSizeChange, digits, onDigitsChange, keyCount, onKeyCountChange, onGenerate, onManualInsert, onClear, capacity, onCapacityChange, message, onNotify, preview = '' }) {
  const [manual, setManual] = useState('');
  const run = async (handler) => {
    const response = await handler?.();
    if (response) {
      onNotify?.(response);
      if (response.type === 'success') setManual('');
    }
  };
  return <section className="panel">
    <h2>Claves del archivo hasheado</h2>
    <div className="form-grid">
      <label>M (nº de posiciones/cubetas)<input type="number" min="2" step="1" value={size} onChange={(event) => onSizeChange(digitsOnly(event.target.value))} /></label>
      <label>Dígitos de las claves<select value={digits} onChange={(event) => onDigitsChange(event.target.value)}>{digitOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
      <label>Nº de claves a generar<input type="number" min="1" step="1" value={keyCount} onChange={(event) => onKeyCountChange(digitsOnly(event.target.value))} /></label>
      {onCapacityChange && <label>Capacidad por cubeta (C)<input type="number" min="1" step="1" value={capacity} onChange={(event) => onCapacityChange(digitsOnly(event.target.value))} /></label>}
    </div>
    <div className="data-panel__actions">
      <button type="button" className="button button--primary" onClick={() => run(onGenerate)}>Generar claves</button>
      <button type="button" className="button button--secondary" onClick={() => run(onClear)}>Limpiar claves</button>
    </div>
    <div className="operation">
      <label>Ingresar clave manual<input inputMode="numeric" placeholder="Clave numérica" value={manual} onChange={(event) => setManual(digitsOnly(event.target.value))} /></label>
      <button type="button" className="button button--secondary" disabled={!manual} onClick={() => run(() => onManualInsert?.(manual))}>Insertar</button>
    </div>
    {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
    <div className="keys-panel"><small>Claves: {preview || '—'}</small></div>
  </section>;
}

// La vista previa de claves necesita el estado real; se ajusta desde el padre.
export default function FuncHashPage() {
  const [tab, setTab] = useState('modulo');
  const [size, setSize] = useState('10');
  const [digits, setDigits] = useState('2');
  const [keyCount, setKeyCount] = useState('10');
  const [capacity, setCapacity] = useState('2');
  const [keys, setKeys] = useState([]);
  const [message, setMessage] = useState(null);

  const [hashResult, setHashResult] = useState(null);   // { table, steps } para funciones y colisiones
  const [bucketData, setBucketData] = useState(null);   // { directory, steps, collisions } para cubetas
  const [searchData, setSearchData] = useState(null);   // { result, timeMs, target }
  const [collisionFunc, setCollisionFunc] = useState('modulo');

  const isFunctionTab = !['cubetas', 'colisiones'].includes(tab);
  const activeFunction = isFunctionTab ? tab : collisionFunc;

  const shownSteps = searchData ? searchData.result.steps : (bucketData ? bucketData.steps : (hashResult ? hashResult.steps : []));
  const total = shownSteps.length;
  const player = useStepPlayer(total);
  const step = shownSteps[player.stepIndex];

  // Cambiar de pestaña limpia los resultados de la vista anterior.
  useEffect(() => {
    setHashResult(null);
    setBucketData(null);
    setSearchData(null);
  }, [tab]);

  // Generación y validación de claves (común a todas las pestañas).
  const addKey = (raw) => {
    const key = String(raw ?? '').replace(/\D/g, '');
    if (!key) return { type: 'error', text: 'Escribe una clave numérica.' };
    if (key.length > Number(digits)) return { type: 'error', text: `La clave debe tener hasta ${digits} dígitos.` };
    if (keys.includes(key)) return { type: 'error', text: 'La clave ya fue ingresada.' };
    setKeys((current) => [...current, key]);
    setHashResult(null); setSearchData(null);
    return { type: 'success', text: `Clave ${key} registrada.` };
  };

  const clearKeys = () => {
    setKeys([]);
    setHashResult(null); setBucketData(null); setSearchData(null);
    return { type: 'success', text: 'Claves borradas.' };
  };

  const generateRandom = () => {
    const count = Number(keyCount);
    const existing = keys.length;
    const generated = generateKeys(count, Number(digits));
    if (!generated) return { type: 'error', text: 'No es posible generar claves únicas con esos dígitos.' };
    const merged = [...keys, ...generated.filter((k) => !keys.includes(k))];
    setKeys(merged);
    setHashResult(null); setBucketData(null); setSearchData(null);
    return { type: 'success', text: `${generated.length} claves generadas${existing ? ' (se agregaron a las existentes)' : ''}.` };
  };

  // Pestaña de FUNCIÓN HASH: calcular posiciones y detectar colisiones.
  const calculateHash = () => {
    if (keys.length === 0) return { type: 'error', text: 'Genera o ingresa claves antes de calcular.' };
    const M = Number(size);
    const table = computeHashTable(keys, M, activeFunction);
    const steps = table.results.map((r) => ({ type: 'hash', key: r.key, position: r.position, text: r.text }));
    steps.push({
      type: 'done',
      collisions: table.collisions.length,
      description: `Cálculo finalizado: ${keys.length} clave(s) ubicada(s) en ${M} posición(es). Se produjeron ${table.collisions.length} colisión(es) (posiciones con más de una clave).`,
    });
    setHashResult({ table, steps });
    setSearchData(null);
    setBucketData(null);
    return { type: 'success', text: `${keys.length} claves transformadas. Revisa el paso a paso y las colisiones.` };
  };

  // Pestaña CUBETAS: construir el archivo de cubetas.
  const buildBuckets = () => {
    if (keys.length === 0) return { type: 'error', text: 'Genera o ingresa claves antes de construir el archivo.' };
    const built = buildBucketFile({ keys, size: Number(size), capacity: Number(capacity) || 2, hashFunction: activeFunction });
    setBucketData(built);
    setHashResult(null);
    setSearchData(null);
    return { type: 'success', text: `Archivo de cubetas construido: ${built.collisions.length} desbordamiento(s).` };
  };

  // Pestaña CUBETAS: buscar una clave dentro de las cubetas.
  const searchBucket = (raw) => {
    const target = String(raw ?? '').trim();
    if (!target) return { type: 'error', text: 'Escribe la clave a buscar.' };
    if (!bucketData) return { type: 'error', text: 'Construye primero el archivo de cubetas (presiona el botón de la pestaña CUBETAS).' };
    const t0 = performance.now();
    const result = searchBucketFile(target, { directory: bucketData.directory, size: Number(size), capacity: Number(capacity) || 2, hashFunction: activeFunction });
    setSearchData({ result, target, timeMs: Math.max(1, Math.round(performance.now() - t0)) });
    return { type: result.found ? 'success' : 'error', text: result.found ? `Clave ${target} encontrada en la CUBETA ${result.position}.` : `Clave ${target} no encontrada (se recorrió la CUBETA ${result.position}).` };
  };

  // Controles que comparten todas las pestañas (mostrados durante la edición).
  const controls = (
    <KeyControls
      size={size} onSizeChange={setSize}
      digits={digits} onDigitsChange={(v) => { setDigits(v); setKeys([]); }}
      keyCount={keyCount} onKeyCountChange={setKeyCount}
      capacity={capacity} onCapacityChange={tab === 'cubetas' ? setCapacity : null}
      onGenerate={generateRandom} onManualInsert={addKey} onClear={clearKeys}
      message={message} onNotify={setMessage}
      preview={keys.join(' ')}
    />
  );

  const currentStepText = step?.text ?? step?.description;

  return (
    <>
      <PageHeader title="BÚSQUEDA POR TRANSFORMACIÓN DE CLAVES" eyebrow="FUNC HASH" description="Búsqueda mediante funciones hash: cada clave se transforma en una posición/cubeta del archivo con la función seleccionada. Si dos claves producen la misma posición se produce una colisión." />
      <Tabs
        tabs={[
          ...HASH_ORDER.map((fn) => [fn, { modulo: 'FUNCIÓN MÓDULO', cuadrado: 'FUNCIÓN CUADRADO', truncamiento: 'FUNCIÓN TRUNCAMIENTO', plegamiento: 'FUNCIÓN PLEGAMIENTO', conversion: 'FUNCIÓN CONVERSIÓN DE BASES' }[fn]]),
          ['cubetas', 'CUBETAS'],
          ['colisiones', 'COLISIONES'],
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="external-grid">
        <div className="external-grid__controls">{controls}</div>
        <div className="external-grid__visual">
          <div className="data-panel__actions">
            {isFunctionTab && <button type="button" className="button button--primary" onClick={async () => { const response = await calculateHash(); setMessage(response); }}>Calcular posiciones</button>}
            {tab === 'cubetas' && <button type="button" className="button button--primary" onClick={async () => { const response = await buildBuckets(); setMessage(response); }}>Construir archivo de cubetas</button>}
          </div>
          {isFunctionTab && (
            <section className="panel">
              <h2>CLAVE → FUNCIÓN HASH → POSICIÓN/CUBETA {hashResult?.table.collisions.length > 0 && <small className="hash-warn">({hashResult.table.collisions.length} colisión(es))</small>}</h2>
              {hashResult ? (
                <HashTableViz size={Number(size)} byPosition={hashResult.table.byPosition} activePosition={step?.type === 'hash' ? step.position : undefined} />
              ) : <div className="visualization-placeholder"><span>⌗</span></div>}
            </section>
          )}

          {tab === 'cubetas' && (
            <section className="panel">
              <h2>Directorio de cubetas</h2>
              {bucketData ? (
                <BucketDirectory
                  directory={step?.directory ?? bucketData.directory}
                  capacity={Number(capacity) || 2}
                  activeBucket={step?.position}
                  activeBlock={step?.block}
                  activeSlot={step?.slot}
                  found={step?.type === 'found'}
                />
              ) : <div className="visualization-placeholder"><span>▦</span></div>}
              {bucketData && !searchData && bucketData.collisions.length > 0 && (
                <div className="panel__aside">
                  <strong>{bucketData.collisions.length} desbordamiento(s)</strong>
                  <p>Las cubetas llenas enlazaron bloques de desbordamiento (la estrategia utilizada para resolver la colisión).</p>
                </div>
              )}
            </section>
          )}

          {tab === 'colisiones' && (
            <section className="panel">
              <h2>Colisiones generadas por la función</h2>
              <div className="operation">
          <label>Probar con la función<select value={collisionFunc} onChange={(event) => { setCollisionFunc(event.target.value); setHashResult(null); setSearchData(null); }}>
            {HASH_ORDER.map((fn) => <option key={fn} value={fn}>{({ modulo: 'FUNCIÓN MÓDULO', cuadrado: 'FUNCIÓN CUADRADO', truncamiento: 'FUNCIÓN TRUNCAMIENTO', plegamiento: 'FUNCIÓN PLEGAMIENTO', conversion: 'FUNCIÓN CONVERSIÓN DE BASES' })[fn]}</option>)}
          </select></label>
          <button type="button" className="button button--primary" onClick={async () => { const response = await calculateHash(); setMessage(response); }}>Detectar colisiones</button>
        </div>
              {hashResult ? (
                <>
                  <HashTableViz size={Number(size)} byPosition={hashResult.table.byPosition} activePosition={step?.type === 'hash' ? step.position : undefined} />
                  {hashResult.table.collisions.length > 0 ? (
                    <div className="collision-list">
                      <h3>Resumen de colisiones</h3>
                      {hashResult.table.collisions.map((collision) => (
                        <article className="collision-card" key={collision.position}>
                          <h4>Posición/Cubeta {collision.position}</h4>
                          <p className="collision-card__claves">Claves: {collision.keys.map((k) => <code key={k}>{k}</code>).join(' + ')}</p>
                          <small>Colisión entre {collision.keys.length} claves que generaron la misma posición. Estrategia de resolución: almacenamiento en la misma cubeta (encadenamiento / bloque de desbordamiento si se llena).</small>
                        </article>
                      ))}
                    </div>
                  ) : <p className="validation-message validation-message--success">No se detectaron colisiones con las claves actuales: cada clave cae en una posición distinta. Agrega más claves o cambia el tamaño M para provocarlas.</p>}
                </>
              ) : <div className="visualization-placeholder"><span>⌗</span></div>}
            </section>
          )}

          {tab === 'cubetas' && (
            <section className="panel">
              <h2>Buscar clave en las cubetas</h2>
              <CubetaSearch onSearch={searchBucket} disabled={!bucketData} message={message} />
            </section>
          )}

          {tab === 'cubetas' && searchData && (
            <ExternalResult result={{ ...searchData.result, key: searchData.target }} timeMs={searchData.timeMs} />
          )}

          {shownSteps.length > 0 && (
            <>
              <ExplanationPanel
                index={player.stepIndex}
                total={total}
                playing={player.playing}
                description={currentStepText}
                chips={[
                  ['ACCIÓN', step?.type === 'done' && tab === 'cubetas' ? 'archivo construido' : ({ insert: 'inserción', hash: 'transformación', access: 'acceso a disco', compare: 'comparación', start: 'inicio', found: 'encontrado', notfound: 'no encontrado', done: 'fin' }[step?.type] ?? step?.type ?? '')],
                  ['CUBETA', step?.position ?? '—'],
                  ['Accesos', step?.accesses ?? 0],
                  ['Comparaciones', step?.comparisons ?? 0],
                ]}
              />
              <StepControls {...player} />
            </>
          )}
          {shownSteps.length === 0 && <div className="placeholder-hint">
            {tab === 'cubetas'
              ? 'Genera claves y presiona el botón de la pestaña para construir el directorio de cubetas; luego puedes buscar una clave.'
              : 'Genera claves y calcula las posiciones para ver el paso a paso y las colisiones.'}
          </div>}
        </div>
      </div>
    </>
  );
}

function CubetaSearch({ onSearch, disabled, message }) {
  const [target, setTarget] = useState('');
  const [msg, setMsg] = useState(null);
  return <div>
    <div className="operation">
      <label>Clave a buscar<input inputMode="numeric" placeholder="Clave" value={target} onChange={(event) => setTarget(digitsOnly(event.target.value))} /></label>
      <button type="button" className="button button--primary" disabled={disabled || !target} onClick={async () => { const response = await onSearch(target); if (response) setMsg(response); }}>Buscar</button>
    </div>
    {(message || msg) && <p className={`validation-message validation-message--${(message || msg).type}`} role="status">{(message || msg).text}</p>}
  </div>;
}