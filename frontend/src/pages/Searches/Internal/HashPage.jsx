import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import MemoryStructure from '../../../components/memory/MemoryStructure';
import { CreateStructurePanel, InsertDataPanel, OperationsPanel, VisualizationPanel } from '../../../components/search/SearchPanels';
import { deleteHash, searchHash, transformHash } from '../../../services/hashApi';

const generateKeys = (count, digits) => {
  const minimum = digits === 1 ? 0 : 10 ** (digits - 1);
  const available = 10 ** digits - minimum;
  if (count > available) return null;
  const generated = new Set();
  while (generated.size < count) generated.add(String(Math.floor(Math.random() * available) + minimum));
  return [...generated];
};

export default function HashPage() {
  const [size, setSize] = useState('10');
  const [keySize, setKeySize] = useState('2');
  const [hashFunction, setHashFunction] = useState('modulo');
  const [collisionMethod, setCollisionMethod] = useState('linear');
  const [created, setCreated] = useState(false);
  const [insertedKeys, setInsertedKeys] = useState([]);
  const [pendingKeys, setPendingKeys] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);
  const [playing, setPlaying] = useState(false);
  const timers = useRef([]);
  const digitsPattern = new RegExp(`^\\d{${keySize}}$`);

  // Detiene cualquier animación en curso y limpia sus temporizadores.
  const clearTimers = () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
    setPlaying(false);
  };

  // Reproduce en la tabla hash, paso a paso y con intervalo, la secuencia de
  // evaluación/collsisión/inserción de un tramo de pasos. Cada estado (amarillo,
  // rojo, verde) permanece visible durante un intervalo antes del siguiente.
  const playSteps = (from, totalSteps, onDone) => {
    clearTimers();
    setPlaying(true);
    for (let index = from; index < totalSteps; index += 1) {
      timers.current.push(setTimeout(() => {
        setStepIndex(index);
        if (index === totalSteps - 1) { setPlaying(false); onDone?.(); }
      }, 700 * (index - from + 1)));
    }
  };

  const manualStep = (index) => {
    clearTimers();
    setStepIndex(index);
  };

  useEffect(() => () => { timers.current.forEach((timer) => clearTimeout(timer)); }, []);

  const currentConfiguration = () => ({ keySize, size: Number(size), hashFunction, collisionMethod });

  const resetAll = (nextHash = hashFunction, nextCollision = collisionMethod) => {
    clearTimers();
    setInsertedKeys([]);
    setPendingKeys(null);
    setConfiguration(null);
    setResult(null);
    setStepIndex(0);
    setCreateMessage(null);
    setHashFunction(nextHash);
    setCollisionMethod(nextCollision);
  };

  const createTable = () => {
    clearTimers();
    const count = Number(size);
    if (!Number.isInteger(count) || count <= 0) { setCreateMessage({ type: 'error', text: 'Indica un tamaño válido para la estructura.' }); return; }
    setCreated(true);
    setInsertedKeys([]);
    setPendingKeys(null);
    setConfiguration(currentConfiguration());
    setResult(null);
    setStepIndex(0);
    setCreateMessage({ type: 'success', text: 'Tabla creada y vacía: lista para el ingreso de claves.' });
  };

  const stepStartOf = (steps, key) => {
    const index = steps.findIndex((step) => step.key === key && step.action === 'processing');
    return index >= 0 ? index : 0;
  };

  const buildTable = async (keys, active) => {
    const response = await transformHash({ keys, size: active.size, hashFunction: active.hashFunction, collisionMethod: active.collisionMethod });
    return response;
  };

  const insertKey = async (rawValue) => {
    if (!created) return { type: 'error', text: 'Crea la tabla antes de ingresar claves.' };
    const key = String(rawValue ?? '').replace(/\D/g, '');
    if (!digitsPattern.test(key)) return { type: 'error', text: `La clave debe ser numérica y tener ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    if (insertedKeys.includes(key)) return { type: 'error', text: 'La tabla no admite claves repetidas.' };
    const nextKeys = [...insertedKeys, key];
    setBusy(true);
    try {
      const active = configuration ?? currentConfiguration();
      const response = await buildTable(nextKeys, active);
      setResult(response);
      setInsertedKeys(nextKeys);
      setConfiguration(active);
      const start = stepStartOf(response.steps, key);
      setStepIndex(start);
      playSteps(start, response.steps.length);
      return { type: 'success', text: `Clave ${key} procesada: revisa la transformación paso a paso.` };
    } catch (error) {
      return { type: 'error', text: error instanceof TypeError ? 'No fue posible conectar con el backend.' : error.message };
    } finally {
      setBusy(false);
    }
  };

  const generateAutomatic = async () => {
    if (!created) return { type: 'error', text: 'Crea la tabla antes de generar claves.' };
    const remaining = Number(size) - insertedKeys.length;
    if (remaining <= 0) return { type: 'error', text: 'La tabla está completa.' };
    const generated = generateKeys(remaining, Number(keySize));
    if (!generated) return { type: 'error', text: `No es posible generar ${remaining} claves únicas de ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    // Las claves generadas quedan a la vista antes de insertar (fuente única de verdad).
    setPendingKeys(generated);
    return { type: 'success', text: 'Generación completa: revisa las claves mostradas y presiona insertar para el paso a paso.' };
  };

  const insertPending = async () => {
    if (!pendingKeys) return { type: 'error', text: 'Primero genera las claves automáticamente.' };
    const nextKeys = [...insertedKeys, ...pendingKeys];
    setBusy(true);
    try {
      const active = configuration ?? currentConfiguration();
      const response = await buildTable(nextKeys, active);
      setResult(response);
      setInsertedKeys(nextKeys);
      setConfiguration(active);
      setStepIndex(0);
      playSteps(0, response.steps.length);
      return { type: 'success', text: 'Claves generadas e insertadas: recorre la transformación paso a paso.' };
    } catch (error) {
      return { type: 'error', text: error instanceof TypeError ? 'No fue posible conectar con el backend.' : error.message };
    } finally {
      setBusy(false);
    }
  };

  const runSearch = async (target) => {
    if (!created || !result || insertedKeys.length === 0) return { type: 'error', text: 'Crea la tabla e ingresa claves antes de buscar.' };
    if (!digitsPattern.test(target)) return { type: 'error', text: `La clave debe ser numérica y tener ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    setBusy(true);
    try {
      const active = configuration ?? currentConfiguration();
      const searchResult = await searchHash({ keys: insertedKeys, size: active.size, hashFunction: active.hashFunction, collisionMethod: active.collisionMethod, target });
      setResult(searchResult);
      setConfiguration(active);
      setStepIndex(0);
      playSteps(0, searchResult.steps.length);
      return { type: 'success', text: 'Búsqueda ejecutada: revisa el recorrido sobre la tabla.' };
    } catch (error) {
      return { type: 'error', text: error instanceof TypeError ? 'No fue posible conectar con el backend.' : error.message };
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async (target) => {
    if (!created || insertedKeys.length === 0) return { type: 'error', text: 'Crea la tabla e ingresa claves antes de eliminar.' };
    if (!digitsPattern.test(target)) return { type: 'error', text: `La clave debe ser numérica y tener ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    setBusy(true);
    try {
      const active = configuration ?? currentConfiguration();
      const deleteResult = await deleteHash({ keys: insertedKeys, size: active.size, hashFunction: active.hashFunction, collisionMethod: active.collisionMethod, target });
      setResult(deleteResult);
      setConfiguration(active);
      setStepIndex(0);
      playSteps(0, deleteResult.steps.length);
      // La clave eliminada se retira de las claves que representan el estado persistente de la tabla,
      // de modo que las operaciones posteriores (inserción, búsqueda) parten de la tabla resultante.
      setInsertedKeys((current) => current.filter((key) => key !== target));
      return { type: 'success', text: `Clave ${target} eliminada: revisa el recorrido paso a paso.` };
    } catch (error) {
      return { type: 'error', text: error instanceof TypeError ? 'No fue posible conectar con el backend.' : error.message };
    } finally {
      setBusy(false);
    }
  };

  const runClear = async () => {
    clearTimers();
    setResult(null);
    setInsertedKeys([]);
    setPendingKeys(null);
    setConfiguration(null);
    setStepIndex(0);
    setCreateMessage({ type: 'success', text: 'Tabla reiniciada: lista para comenzar de nuevo.' });
    return { type: 'success', text: 'Tabla limpia: configura y crea una nueva estructura cuando quieras.' };
  };

  const onHashChange = (next) => {
    resetAll(next, collisionMethod);
  };
  const onCollisionChange = (next) => {
    resetAll(hashFunction, next);
  };

  const activeStep = result?.steps[stepIndex];
  const emptyTable = Array((configuration?.size ?? Number(size)) || 1).fill(null);
  const visibleTable = activeStep?.tableSnapshot ?? result?.table ?? emptyTable;
  const visibleNested = activeStep?.nestedSnapshot ?? result?.nested ?? [];
  const visibleLists = activeStep?.listsSnapshot ?? result?.lists ?? [];
  const isSearchRun = result?.algorithm?.startsWith('Búsqueda');
  const isDeleteRun = result?.algorithm?.startsWith('Eliminación');
  const finalStep = result?.steps?.[result.steps.length - 1];

  return (
    <>
      <PageHeader title="Transformación por claves" />
      <div className="lab-layout">
        <div className="lab-layout__controls">
          <CreateStructurePanel hash size={size} onSizeChange={setSize} keySize={keySize} onKeySizeChange={setKeySize} hashFunction={hashFunction} onHashFunctionChange={onHashChange} collisionMethod={collisionMethod} onCollisionMethodChange={onCollisionChange} onCreate={createTable} busy={busy} message={createMessage} />
          {created && <InsertDataPanel fieldLabel="Clave" busy={busy} insertedCount={insertedKeys.length} total={Number(size) || 0} onInsert={insertKey} onGenerate={generateAutomatic} />}
          {pendingKeys && (
            <section className="panel keys-panel">
              <h2>Claves a ingresar</h2>
              <p>{pendingKeys.join(' → ')}</p>
              <small>Se insertarán en exactamente este orden.</small>
              <div className="step-controls"><button type="button" className="button button--primary" onClick={insertPending} disabled={busy || playing}>{playing ? 'Insertando…' : 'Insertar todas'}</button></div>
            </section>
          )}
          {created && <OperationsPanel disabled={busy || playing} onSearch={runSearch} onDelete={runDelete} onClear={runClear} />}
        </div>
        <div className="lab-layout__visual">
          <section className="panel">
            <h2>Visualización de la tabla hash</h2>
            <MemoryStructure
              hash
              values={visibleTable}
              currentIndex={activeStep?.current}
              initialIndex={activeStep?.initial}
              currentArray={activeStep?.currentArray ?? 0}
              currentNode={activeStep?.currentNode ?? -1}
              collisionIndices={activeStep?.attempts?.filter((attempt) => attempt.occupied).map((attempt) => attempt.position) ?? []}
              stepAction={activeStep?.action}
              nested={visibleNested}
              lists={visibleLists}
              nestedByPosition={result?.nestedByPosition ?? []}
              collisionMethod={configuration?.collisionMethod ?? collisionMethod}
            />
          </section>
          {result && (isSearchRun || isDeleteRun) && finalStep && ['found', 'discarded', 'deleted'].includes(finalStep.action) && (
            <p className={`validation-message validation-message--${finalStep.action === 'discarded' ? 'error' : 'success'}`} role="status">{finalStep.description}</p>
          )}
          {result && <VisualizationPanel hash result={result} stepIndex={stepIndex} onStepChange={manualStep} playing={playing} configuration={configuration} />}
          {result && result.collisions.length > 0 && (
            <section className="panel">
              <h2>Resumen de colisiones</h2>
              {result.collisions.map((collision, index) => (
                <article className="collision-summary" key={`${collision.key}-${index}`}>
                  <strong>Clave {collision.key} · posición inicial {collision.initial}</strong>
                  <span>Método: {collision.method}</span>
                  <p>{collision.attempts.map((attempt) => `${attempt.position} → ${attempt.occupied ? 'ocupada' : 'libre'}`).join(' · ')}</p>
                  <small>Posición final: {collision.finalPosition}</small>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
