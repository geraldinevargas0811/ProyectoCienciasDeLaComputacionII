import { useEffect, useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { InsertDataPanel } from '../../../components/search/SearchPanels';
import HashTableViz from '../../../components/external/HashTableViz';
import BucketDirectory from '../../../components/external/BucketDirectory';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { generateKeys, validKey, keyLengthError } from '../../../utils/external/dataGenerators';
import { computeHashTable, HASH_ORDER } from '../../../utils/external/hashFunctions';
import { buildBucketFile } from '../../../utils/external/buckets';

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

  const activeFunction = tab;

  const shownSteps = bucketData ? bucketData.steps : (hashResult ? hashResult.steps : []);
  const total = shownSteps.length;
  const player = useStepPlayer(total);
  const step = shownSteps[player.stepIndex];

  // Progreso del ingreso: la cuadrícula de la función se llena clave por clave
  // según el estado actual del directorio de cubetas (mismo recorrido).
  const placedPositions = (() => {
    if (!step?.directory) return null;
    const map = {};
    step.directory.forEach((cubeta, index) => {
      const keys = cubeta.blocks.flat();
      if (keys.length) map[index + 1] = keys;
    });
    return map;
  })();
  const gridActivePosition = step?.type === 'insert' ? step.position : undefined;

  useEffect(() => {
    setHashResult(null);
    setBucketData(null);
  }, [tab]);

  const createFile = () => {
    const M = Number(size);
    if (!Number.isInteger(M) || M < 2 || M % 2 !== 0) { setCreateMessage({ type: 'error', text: 'El número de cubetas debe ser par y mayor o igual a 2.' }); return; }
    setCreated(true);
    setKeys([]);
    setHashResult(null);
    setBucketData(null);
    setCreateMessage({ type: 'success', text: 'Estructura creada y vacía: lista para el ingreso de claves.' });
  };

  const addKey = (raw) => {
    if (!created) return { type: 'error', text: 'Crea la estructura antes de ingresar claves.' };
    const key = String(raw ?? '').replace(/\D/g, '');
    if (!key) return { type: 'error', text: 'Indica una clave a ingresar.' };
    if (!validKey(key, digits)) return keyLengthError('insert', digits);
    if (keys.includes(key)) return { type: 'error', text: 'La estructura no admite claves repetidas.' };
    setKeys((current) => [...current, key]);
    setHashResult(null); setBucketData(null);
    return { type: 'success', text: `Clave ${key} añadida: revisa las claves a ingresar.` };
  };

  const clearKeys = () => {
    setKeys([]);
    setHashResult(null); setBucketData(null);
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
    setHashResult(null); setBucketData(null);
    return { type: 'success', text: `${generated.length} claves generadas y añadidas: revisa las claves a ingresar.` };
  };

  const calculateHash = () => {
    if (keys.length === 0) return { type: 'error', text: 'Ingresa claves antes de calcular las posiciones.' };
    const M = Number(size);
    const C = Number(capacity) || 2;
    const table = computeHashTable(keys, M, activeFunction);
    const steps = table.results.map((r) => ({ type: 'hash', key: r.key, position: r.position, text: r.text }));
    steps.push({
      type: 'done',
      collisions: table.collisions.length,
      description: `Cálculo finalizado: ${keys.length} clave(s) ubicada(s) en ${M} posición(es). Cada posición se resuelve con su cubeta; las colisiones se atienden con bloques de desbordamiento.`,
    });
    setHashResult({ table, steps });

    // Cada posición se resuelve con su cubeta: la estructura de cubetas
    // almacena los registros y atiende las colisiones con desbordamiento.
    const built = buildBucketFile({ keys, size: M, capacity: C, hashFunction: activeFunction });
    setBucketData(built);
    return { type: 'success', text: `Posiciones y cubetas construidas: ${table.collisions.length} colisión(es) resuelta(s) con bloque(s) de desbordamiento.` };
  };

  const meta = [];
  if (['init', 'insert', 'done'].includes(step?.type)) {
    if (step?.position != null) meta.push(`Cubeta: ${step.position}`);
    if (step?.type === 'insert') meta.push(`Desbordamientos: ${step.collisions}`);
    meta.push(`Accesos: ${step?.accesses ?? 0}`);
  } else {
    if (step?.position != null) meta.push(`Cubeta: ${step.position}`);
    meta.push(`Accesos: ${step?.accesses ?? 0}`);
  }
  const currentKey = step?.key ?? null;

  const onAction = async (handler) => {
    const response = await handler();
    if (response) setActionMessage(response);
  };

  return (
    <>
      <PageHeader title="Búsqueda por transformación de claves" />
      <Tabs
        tabs={HASH_ORDER.map((fn) => [fn, HASH_LABELS[fn]])}
        active={tab}
        onChange={setTab}
      />

      <div className="lab-layout">
        <div className="lab-layout__controls">
          <section className="panel">
            <h2>Crear estructura</h2>
            <div className="form-grid">
              <label>M (tamaño de la estructura — nº de posiciones, par)<input type="number" min="2" step="2" inputMode="numeric" value={size} onChange={(event) => setSize(digitsOnly(event.target.value))} /></label>
              <label>Dígitos de las claves<select value={digits} onChange={(event) => { setDigits(event.target.value); setKeys([]); }}>{digitOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
              <label>Nº de claves a generar<input type="number" min="1" step="1" inputMode="numeric" value={keyCount} onChange={(event) => setKeyCount(digitsOnly(event.target.value))} /></label>
              <label>Capacidad por cubeta (C)<input type="number" min="1" step="1" inputMode="numeric" value={capacity} onChange={(event) => setCapacity(digitsOnly(event.target.value))} /></label>
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
            <Button onClick={() => onAction(calculateHash)}>Calcular posiciones</Button>
            <Button variant="secondary" className="operation-clear" onClick={() => { const r = clearKeys(); setActionMessage(r); }}>Limpiar</Button>
            {actionMessage && <p className={`validation-message validation-message--${actionMessage.type}`} role="status">{actionMessage.text}</p>}
          </section>
        </div>

        <div className="lab-layout__visual">
          {hashResult ? (
            <>
              <section className="panel">
                <h2>Visualización de la tabla hash (transformación de claves)</h2>
                <HashTableViz size={Number(size)} byPosition={placedPositions ?? hashResult.table.byPosition} activePosition={gridActivePosition} />
              </section>
              <section className="panel">
                <h2>Visualización de la estructura de cubetas</h2>
                <BucketDirectory
                  directory={step?.directory ?? bucketData.directory}
                  capacity={Number(capacity) || 2}
                  activeBucket={step?.position}
                />
                {bucketData.collisions.length > 0 && (
                  <div className="panel__aside">
                    <strong>{bucketData.collisions.length} desbordamiento(s)</strong>
                    <p>Las cubetas llenas enlazaron bloques de desbordamiento para no perder ninguna clave (la estrategia que resuelve la colisión).</p>
                  </div>
                )}
              </section>
            </>
          ) : created ? (
            <section className="panel">
              <h2>Visualización de la tabla hash (transformación de claves)</h2>
              <HashTableViz size={Number(size)} />
            </section>
          ) : <div className="visualization-placeholder"><span>⌗</span><p>Crea la estructura y calcula las posiciones para comenzar.</p></div>}

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