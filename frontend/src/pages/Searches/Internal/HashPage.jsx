import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import MemoryStructure from '../../../components/memory/MemoryStructure';
import { CreateStructurePanel, OperationsBlock, VisualizationPanel } from '../../../components/search/SearchPanels';
import { deleteHash, searchHash, transformHash } from '../../../services/hashApi';

const generateKeys = (count, digits) => {
  const maximum = 10 ** digits;
  if (count > maximum) return null;
  const generated = new Set();
  while (generated.size < count) generated.add(String(Math.floor(Math.random() * maximum)).padStart(digits, '0'));
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
      const remainingKeys = insertedKeys.filter((key) => key !== target);
      setInsertedKeys(remainingKeys);
      setResult(deleteResult);
      setConfiguration(active);
      setStepIndex(0);
      playSteps(0, deleteResult.steps.length, async () => {
        if (remainingKeys.length > 0) {
          try {
            const rebuilt = await buildTable(remainingKeys, active);
            setResult(rebuilt);
            setStepIndex(rebuilt.steps.length - 1);
          } catch { /* silenciar errores de reconstrucción */ }
        } else {
          setResult(null);
        }
      });
      return { type: 'success', text: `Clave ${target} eliminada: la tabla se reorganiza automáticamente.` };
    } catch (error) {
      return { type: 'error', text: error instanceof TypeError ? 'No fue posible conectar con el backend.' : error.message };
    } finally {
      setBusy(false);
    }
  };

  const runClear = async () => {
    clearTimers();
    setCreated(false);
    setResult(null);
    setInsertedKeys([]);
    setPendingKeys(null);
    setConfiguration(null);
    setStepIndex(0);
    setCreateMessage({ type: 'success', text: 'Todo reiniciado: configura y crea una nueva estructura cuando quieras.' });
    return { type: 'success', text: 'Limpieza completa: se borraron todas las claves, la estructura y los resultados.' };
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
  // Conjunto ACUMULATIVO (1‑based) de posiciones evaluadas en todos los pasos hasta el
  // actual: las casillas que ya fueron probadas/colisionadas permanecen visibles.
  const evaluatedPositions = useMemo(() => {
    if (!result) return [];
    const positions = new Set();
    result.steps.slice(0, stepIndex + 1).forEach((step) => {
      if (step.initial > 0) positions.add(step.initial);
      if (step.current > 0) positions.add(step.current);
      (step.attempts ?? []).forEach((attempt) => { if (attempt.position > 0) positions.add(attempt.position); });
    });
    return [...positions];
  }, [result, stepIndex]);

  const nestedEvaluatedPositions = useMemo(() => {
    if (!result) return {};
    const byArray = {};
    result.steps.slice(0, stepIndex + 1).forEach((step) => {
      if (step.currentArray > 0) {
        const position = step.initial > 0 ? step.initial : step.current;
        if (position > 0) (byArray[step.currentArray] = byArray[step.currentArray] || new Set()).add(position);
      }
    });
    const map = {};
    Object.keys(byArray).forEach((key) => { map[key] = [...byArray[key]]; });
    return map;
  }, [result, stepIndex]);

  return (
    <>
      <PageHeader title="Transformación por claves" />
      <div className="lab-layout">
        <div className="lab-layout__controls">
          <CreateStructurePanel hash size={size} onSizeChange={setSize} keySize={keySize} onKeySizeChange={setKeySize} hashFunction={hashFunction} onHashFunctionChange={onHashChange} collisionMethod={collisionMethod} onCollisionMethodChange={onCollisionChange} onCreate={createTable} busy={busy} message={createMessage} />
          {created && (
            <OperationsBlock fieldLabel="Clave" busy={busy || playing} insertedCount={insertedKeys.length} total={Number(size) || 0} onInsert={insertKey} onGenerate={generateAutomatic} disabled={busy || playing} onSearch={runSearch} onDelete={runDelete} onClear={runClear}>
              {pendingKeys && (
                <div className="keys-panel keys-panel--embed">
                  <p>{pendingKeys.join(' → ')}</p>
                  <small>Se insertarán en exactamente este orden.</small>
                  <div className="step-controls"><button type="button" className="button button--primary" onClick={insertPending} disabled={busy || playing}>{playing ? 'Insertando…' : 'Insertar todas'}</button></div>
                </div>
              )}
            </OperationsBlock>
          )}
        </div>
        <div className="lab-layout__visual">
          {created ? (
            <>
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
                  evaluatedPositions={evaluatedPositions}
                  nestedEvaluatedPositions={nestedEvaluatedPositions}
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
            </>
          ) : (
            <section className="panel">
              <h2>Visualización de la tabla hash</h2>
              <div className="visualization-placeholder">
                <span>▦</span>
                <p>Configura los parámetros y presiona "Crear estructura" para ver la tabla hash.</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
