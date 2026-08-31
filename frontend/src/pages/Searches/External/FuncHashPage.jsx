import { useEffect, useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { InsertDataPanel } from '../../../components/search/SearchPanels';
import HashTableViz from '../../../components/external/HashTableViz';
import BucketDirectory from '../../../components/external/BucketDirectory';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import ExternalResult from '../../../components/external/ExternalResult';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { generateKeys, validKey, keyLengthError } from '../../../utils/external/dataGenerators';
import { computeHashTable, HASH_ORDER } from '../../../utils/external/hashFunctions';
import { buildBucketFile, searchBucketFile } from '../../../utils/external/buckets';

const digitOptions = [
  ['1', '1 dígito'],
  ['2', '2 dígitos'],
  ['3', '3 dígitos'],
];
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const HASH_LABELS = {
  modulo: 'Función módulo',
  cuadrado: 'Función cuadrado',
  truncamiento: 'Función truncamiento',
  plegamiento: 'Función plegamiento',
  conversion: 'Función conversión de bases',
};

export default function FuncHashPage() {
  const [tab, setTab] = useState('modulo');
  const [size, setSize] = useState('10');
  const [digits, setDigits] = useState('2');
  const [keyCount, setKeyCount] = useState('10');
  const [capacity, setCapacity] = useState('2');
  const [keys, setKeys] = useState([]);
  const [created, setCreated] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [hashResult, setHashResult] = useState(null);
  const [bucketData, setBucketData] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [collisionFunc, setCollisionFunc] = useState('modulo');

  const isFunctionTab = !['cubetas', 'colisiones'].includes(tab);
  const activeFunction = isFunctionTab ? tab : collisionFunc;
  const emptyDirectory = Array.from({ length: Number(size) }, () => ({ blocks: [[]] }));

  const shownSteps = searchData ? searchData.result.steps : (bucketData ? bucketData.steps : (hashResult ? hashResult.steps : []));
  const total = shownSteps.length;
  const player = useStepPlayer(total);
  const step = shownSteps[player.stepIndex];

  useEffect(() => {
    setHashResult(null);
    setBucketData(null);
    setSearchData(null);
  }, [tab]);

  const createFile = () => {
    const M = Number(size);
    if (!Number.isInteger(M) || M < 2) { setCreateMessage({ type: 'error', text: 'Indica un tamaño válido para la estructura.' }); return; }
    setCreated(true);
    setKeys([]);
    setHashResult(null);
    setBucketData(null);
    setSearchData(null);
    setCreateMessage({ type: 'success', text: 'Estructura creada y vacía: lista para el ingreso de claves.' });
  };

  const addKey = (raw) => {
    if (!created) return { type: 'error', text: 'Crea la estructura antes de ingresar claves.' };
    const key = String(raw ?? '').replace(/\D/g, '');
    if (!key) return { type: 'error', text: 'Indica una clave a ingresar.' };
    if (!validKey(key, digits)) return keyLengthError('insert', digits);
    if (keys.includes(key)) return { type: 'error', text: 'La estructura no admite claves repetidas.' };
    setKeys((current) => [...current, key]);
    setHashResult(null); setSearchData(null);
    return { type: 'success', text: `Clave ${key} añadida: revisa las claves a ingresar.` };
  };

  const clearKeys = () => {
    setKeys([]);
    setHashResult(null); setBucketData(null); setSearchData(null);
    return { type: 'success', text: 'Claves vacías: lista para ingresar nuevas claves.' };
  };

  const generateRandom = () => {
    if (!created) return { type: 'error', text: 'Crea la estructura antes de generar claves.' };
    const target = Math.max(0, (Number(keyCount) || 0) - keys.length);
    if (target === 0) return { type: 'success', text: 'Ya tienes las claves a ingresar.' };
    const generated = generateKeys(target, Number(digits));
    if (!generated) return { type: 'error', text: `No es posible generar ${target} claves únicas de ${digits} dígitos.` };
    const merged = [...keys, ...generated.filter((k) => !keys.includes(k))];
    setKeys(merged);
    setHashResult(null); setBucketData(null); setSearchData(null);
    return { type: 'success', text: `${generated.length} claves generadas y añadidas: revisa las claves a ingresar.` };
  };

  const calculateHash = () => {
    if (keys.length === 0) return { type: 'error', text: 'Ingresa claves antes de calcular las posiciones.' };
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
    return { type: 'success', text: 'Posiciones calculadas: revisa la transformación paso a paso.' };
  };

  const buildBuckets = () => {
    if (keys.length === 0) return { type: 'error', text: 'Ingresa claves antes de construir la estructura de cubetas.' };
    const built = buildBucketFile({ keys, size: Number(size), capacity: Number(capacity) || 2, hashFunction: activeFunction });
    setBucketData(built);
    setHashResult(null);
    setSearchData(null);
    return { type: 'success', text: 'Estructura de cubetas construida: revisa el directorio paso a paso.' };
  };

  const searchBucket = (raw) => {
    const target = String(raw ?? '').trim();
    if (!target) return { type: 'error', text: 'Indica la clave a buscar.' };
    if (!bucketData) return { type: 'error', text: 'Construye la estructura de cubetas antes de buscar.' };
    if (!validKey(target, digits)) return keyLengthError('search', digits);
    const t0 = performance.now();
    const result = searchBucketFile(target, { directory: bucketData.directory, size: Number(size), capacity: Number(capacity) || 2, hashFunction: activeFunction });
    setSearchData({ result, target, timeMs: Math.max(1, Math.round(performance.now() - t0)) });
    return { type: result.found ? 'success' : 'error', text: result.found ? `Clave ${target} encontrada en la Cubeta ${result.position}.` : `La clave ${target} no fue encontrada en la estructura.` };
  };

  const meta = [];
  if (step?.type === 'hash') {
    meta.push(`Cubeta: ${step.position}`);
  } else if (['init', 'insert', 'done'].includes(step?.type)) {
    if (step?.position != null) meta.push(`Cubeta: ${step.position}`);
    if (step?.type === 'insert') meta.push(`Desbordamientos: ${step.collisions}`);
    meta.push(`Accesos: ${step?.accesses ?? 0}`);
  } else {
    if (step?.position != null) meta.push(`Cubeta: ${step.position}`);
    meta.push(`Accesos: ${step?.accesses ?? 0}`);
    meta.push(`Comparaciones: ${step?.comparisons ?? 0}`);
  }
  const currentKey = step?.key ?? (searchData ? searchData.target : null);

  const onAction = async (handler) => {
    const response = await handler();
    if (response) setActionMessage(response);
  };

  return (
    <>
      <PageHeader title="Búsqueda por transformación de claves" />
      <Tabs
        tabs={[
          ...HASH_ORDER.map((fn) => [fn, HASH_LABELS[fn]]),
          ['cubetas', 'Cubetas'],
          ['colisiones', 'Colisiones'],
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="lab-layout">
        <div className="lab-layout__controls">
          <section className="panel">
            <h2>Crear estructura</h2>
            <div className="form-grid">
              <label>M (nº de posiciones/cubetas)<input type="number" min="2" step="1" inputMode="numeric" value={size} onChange={(event) => setSize(digitsOnly(event.target.value))} /></label>
              <label>Dígitos de las claves<select value={digits} onChange={(event) => { setDigits(event.target.value); setKeys([]); }}>{digitOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
              <label>Nº de claves a generar<input type="number" min="1" step="1" inputMode="numeric" value={keyCount} onChange={(event) => setKeyCount(digitsOnly(event.target.value))} /></label>
              {tab === 'cubetas' && <label>Capacidad por cubeta (C)<input type="number" min="1" step="1" inputMode="numeric" value={capacity} onChange={(event) => setCapacity(digitsOnly(event.target.value))} /></label>}
            </div>
            {createMessage && <p className={`validation-message validation-message--${createMessage.type}`} role="status">{createMessage.text}</p>}
            <Button onClick={createFile}>Crear estructura</Button>
          </section>

          {created && <InsertDataPanel fieldLabel="Clave" insertedCount={keys.length} total={Number(keyCount) || 0} onInsert={addKey} onGenerate={generateRandom} />}

          {keys.length > 0 && (
            <section className="panel keys-panel">
              <h2>Claves a ingresar</h2>
              <p>{keys.join(' → ')}</p>
              <small>Se transformarán en exactamente este orden con la función seleccionada.</small>
            </section>
          )}

          <section className="panel">
            <h2>Operaciones</h2>
            {isFunctionTab && <Button onClick={() => onAction(calculateHash)}>Calcular posiciones</Button>}
            {tab === 'cubetas' && <Button onClick={() => onAction(buildBuckets)}>Construir estructura de cubetas</Button>}
            {tab === 'cubetas' && <CubetaSearch disabled={!bucketData} maxLength={Number(digits)} onSearch={(target) => { const r = searchBucket(target); setActionMessage(r); return r; }} />}
            <Button variant="secondary" className="operation-clear" onClick={() => { const r = clearKeys(); setActionMessage(r); }}>Limpiar</Button>
            {actionMessage && <p className={`validation-message validation-message--${actionMessage.type}`} role="status">{actionMessage.text}</p>}
          </section>

          {tab === 'cubetas' && searchData && <ExternalResult result={{ ...searchData.result, key: searchData.target }} timeMs={searchData.timeMs} />}
        </div>

        <div className="lab-layout__visual">
          {isFunctionTab && (
            <section className="panel">
              <h2>Visualización de la tabla hash</h2>
              {hashResult ? (
                <HashTableViz size={Number(size)} byPosition={hashResult.table.byPosition} activePosition={step?.type === 'hash' ? step.position : undefined} />
              ) : created ? (
                <HashTableViz size={Number(size)} />
              ) : <div className="visualization-placeholder"><span>⌗</span><p>Crea la estructura y calcula las posiciones para comenzar.</p></div>}
            </section>
          )}

          {tab === 'cubetas' && (
            <section className="panel">
              <h2>Visualización de la estructura de cubetas</h2>
              {bucketData ? (
                <BucketDirectory
                  directory={step?.directory ?? bucketData.directory}
                  capacity={Number(capacity) || 2}
                  activeBucket={step?.position}
                  activeBlock={step?.block}
                  activeSlot={step?.slot}
                  found={step?.type === 'found'}
                />
              ) : created ? (
                <BucketDirectory directory={emptyDirectory} capacity={Number(capacity) || 2} />
              ) : <div className="visualization-placeholder"><span>▦</span><p>Construye la estructura de cubetas para comenzar.</p></div>}
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
                  {HASH_ORDER.map((fn) => <option key={fn} value={fn}>{HASH_LABELS[fn]}</option>)}
                </select></label>
                <Button onClick={() => onAction(calculateHash)}>Detectar colisiones</Button>
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
              ) : created ? (
                <HashTableViz size={Number(size)} />
              ) : <div className="visualization-placeholder"><span>⌗</span><p>Ingresa claves y detecta las colisiones para comenzar.</p></div>}
            </section>
          )}

          {shownSteps.length > 0 && (
            <ExplanationPanel
              {...player}
              currentKey={currentKey}
              description={step?.text ?? step?.description}
              meta={meta}
            />
          )}
        </div>
      </div>
    </>
  );
}

function CubetaSearch({ onSearch, disabled, maxLength = null }) {
  const [target, setTarget] = useState('');
  return <div className="operation">
    <label>Buscar<input inputMode="numeric" maxLength={maxLength} placeholder="Clave" value={target} onChange={(event) => setTarget(digitsOnly(event.target.value))} /></label>
    <Button variant="secondary" disabled={disabled || !target} onClick={async () => { const r = await onSearch(target); if (r && r.type === 'success') setTarget(''); }}>Buscar</Button>
  </div>;
}