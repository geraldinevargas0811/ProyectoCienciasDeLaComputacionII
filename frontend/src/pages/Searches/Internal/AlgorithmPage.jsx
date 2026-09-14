import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import MemoryStructure from '../../../components/memory/MemoryStructure';
import { CreateStructurePanel, OperationsBlock, ResultPanel, VisualizationPanel } from '../../../components/search/SearchPanels';
import { binaryDelete, binarySearch, isSortedAscending, sequentialDelete, sequentialSearch } from '../../../utils/searchAlgorithms';

const generateKeys = (count, digits) => {
  const maximum = 10 ** digits;
  if (count > maximum) return null;
  const generated = new Set();
  while (generated.size < count) generated.add(String(Math.floor(Math.random() * maximum)).padStart(digits, '0'));
  return [...generated];
};

export default function AlgorithmPage({ type }) {
  const binary = type === 'binary';
  const title = binary ? 'Búsqueda binaria' : 'Búsqueda secuencial';
  const [size, setSize] = useState('5');
  const [keySize, setKeySize] = useState('2');
  const [created, setCreated] = useState(false);
  const [values, setValues] = useState(null);
  const [lastInserted, setLastInserted] = useState(null);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState(null);
  const timers = useRef([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      timers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const filledCount = values ? values.filter((value) => value !== null).length : 0;
  const digitsPattern = new RegExp(`^\\d{${keySize}}$`);

  const createStructure = () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
    const count = Number(size);
    if (!Number.isInteger(count) || count <= 0) { setCreateMessage({ type: 'error', text: 'Indica un tamaño válido para la estructura.' }); return; }
    setValues(Array(count).fill(null));
    setCreated(true);
    setLastInserted(null);
    setResult(null);
    setStepIndex(0);
    setBusy(false);
    setCreateMessage({ type: 'success', text: 'Estructura creada y vacía: lista para el ingreso de datos.' });
  };

  const fillAt = (index, value) => {
    setValues((current) => current.map((item, position) => (position === index ? value : item)));
    setLastInserted(index);
  };

  const insertManual = async (rawValue) => {
    if (!values) return { type: 'error', text: 'Crea la estructura antes de ingresar datos.' };
    const value = String(rawValue ?? '').replace(/\D/g, '');
    if (!digitsPattern.test(value)) return { type: 'error', text: `El dato debe ser numérico y tener ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    const position = values.findIndex((item) => item === null);
    if (position === -1) return { type: 'error', text: 'La estructura está completa.' };
    if (values.some((item) => item === value)) return { type: 'error', text: 'La estructura no admite datos repetidos.' };
    fillAt(position, value);
    setResult(null);
    setStepIndex(0);
    return { type: 'success', text: `Dato ${value} insertado en la celda ${position}.` };
  };

  const generateAutomatic = async () => {
    if (!values) return { type: 'error', text: 'Crea la estructura antes de generar datos.' };
    const nullPositions = values.map((item, index) => (item === null ? index : -1)).filter((index) => index >= 0);
    const count = nullPositions.length;
    if (count === 0) return { type: 'error', text: 'La estructura está completa.' };
    const generated = generateKeys(count, Number(keySize));
    if (!generated) return { type: 'error', text: `No es posible generar ${count} claves únicas de ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    if (binary) generated.sort((left, right) => Number(left) - Number(right));
    const next = [...values];
    setBusy(true);
    generated.forEach((value, index) => {
      timers.current.push(setTimeout(() => {
        if (!mounted.current) return;
        next[nullPositions[index]] = value;
        setValues([...next]);
        setLastInserted(nullPositions[index]);
        if (index === generated.length - 1) setBusy(false);
      }, 480 * (index + 1)));
    });
    setResult(null);
    setStepIndex(0);
    return { type: 'success', text: 'Generación automática en curso…' };
  };

  const runSearch = async (key) => {
    if (!values || !created) return { type: 'error', text: 'Crea una estructura antes de buscar.' };
    const normalized = String(key ?? '').replace(/\D/g, '');
    if (!digitsPattern.test(normalized)) return { type: 'error', text: `La clave a buscar debe tener ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    const filled = values.filter((value) => value !== null);
    if (filled.length === 0) return { type: 'error', text: 'Ingresa datos antes de buscar.' };
    if (binary && !isSortedAscending(filled)) return { type: 'error', text: 'La búsqueda binaria requiere datos ordenados de forma ascendente.' };
    const searchResult = binary ? binarySearch(filled, normalized) : sequentialSearch(filled, normalized);
    setResult({ ...searchResult, type: 'search' });
    setStepIndex(0);
    const displayIndex = searchResult.found ? searchResult.index + (binary ? 1 : 0) : null;
    return { type: searchResult.found ? 'success' : 'error', text: searchResult.found ? `Clave ${normalized} encontrada en la celda ${displayIndex}.` : `La clave ${normalized} no fue encontrada.` };
  };

  const runDelete = async (key) => {
    if (!values || !created) return { type: 'error', text: 'Crea una estructura antes de eliminar.' };
    const normalized = String(key ?? '').replace(/\D/g, '');
    if (!digitsPattern.test(normalized)) return { type: 'error', text: `La clave a eliminar debe tener ${keySize} dígito${keySize === '1' ? '' : 's'}.` };
    if (values.every((value) => value === null)) return { type: 'error', text: 'Ingresa datos antes de eliminar.' };
    const deleteResult = binary ? binaryDelete(values, normalized) : sequentialDelete(values, normalized);
    setResult({ ...deleteResult, type: 'delete' });
    setStepIndex(0);
    if (deleteResult.found) setValues(deleteResult.steps[deleteResult.steps.length - 1].values);
    const displayIndex = deleteResult.found ? deleteResult.index + (binary ? 1 : 0) : null;
    return { type: deleteResult.found ? 'success' : 'error', text: deleteResult.found ? `Clave ${normalized} eliminada de la celda ${displayIndex}.` : `La clave ${normalized} no fue encontrada: no se eliminó nada.` };
  };

  const runClear = async () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
    setCreated(false);
    setValues(null);
    setLastInserted(null);
    setResult(null);
    setStepIndex(0);
    setBusy(false);
    setCreateMessage({ type: 'success', text: 'Limpieza completa: configura y crea una nueva estructura cuando quieras.' });
    return { type: 'success', text: 'Limpieza completa: se borraron los datos, la estructura, los pasos y los resultados.' };
  };

  const resetSteps = () => {
    setResult(null);
    setStepIndex(0);
  };

  const activeStep = result?.steps[stepIndex];
  const isDelete = result?.type === 'delete';
  const visibleValues = isDelete && activeStep?.values ? activeStep.values : (values ?? []);
  const showRange = binary && activeStep && !isDelete && activeStep.lower !== undefined;
  // Conjunto ACUMULATIVO de posiciones evaluadas en todos los pasos hasta el actual:
  // garantiza que ninguna casilla evaluada anteriormente desaparezca de la vista.
  const evaluatedPositions = useMemo(() => {
    if (!result) return [];
    const positions = new Set();
    result.steps.slice(0, stepIndex + 1).forEach((step) => {
      if (step.currentIndex !== undefined && step.currentIndex !== null) positions.add(step.currentIndex);
      if (step.removedIndex !== undefined && step.removedIndex !== null) positions.add(step.removedIndex);
    });
    return [...positions];
  }, [result, stepIndex]);
  const displayValues = visibleValues;
  // En binaria el arreglo completo define las posiciones y el intervalo activo se
  // acota con "interval" (las evaluadas previamente se agregan de forma acumulativa).
  const interval = showRange ? [activeStep.lower, activeStep.upper] : undefined;

  let highlight = {};
  if (result) {
    highlight = {
      currentIndex: activeStep?.currentIndex,
      discardedIndices: activeStep?.discardedIndices ?? [],
      stepAction: activeStep?.action,
      foundIndex: activeStep?.found && activeStep.action === 'found' ? activeStep.currentIndex : undefined,
    };
  } else if (lastInserted !== null && values) {
    highlight = { currentIndex: lastInserted, stepAction: 'inserted', discardedIndices: [], foundIndex: undefined };
  }

  return (
    <>
      <PageHeader title={title} />
      <div className="lab-layout">
        <div className="lab-layout__controls">
          <CreateStructurePanel size={size} onSizeChange={setSize} keySize={keySize} onKeySizeChange={setKeySize} onCreate={createStructure} message={createMessage} />
          {created && (
            <OperationsBlock busy={busy} insertedCount={filledCount} total={Number(size) || 0} onInsert={insertManual} onGenerate={generateAutomatic} disabled={busy} onSearch={runSearch} onDelete={runDelete} onClear={runClear} />
          )}
          {result && <ResultPanel result={result} binary={binary} />}
        </div>
        <div className="lab-layout__visual">
          <section className="panel">
            <h2>Visualización de memoria</h2>
            {created ? (
              <MemoryStructure values={displayValues} currentIndex={highlight.currentIndex} discardedIndices={highlight.discardedIndices} foundIndex={highlight.foundIndex} stepAction={highlight.stepAction} evaluatedPositions={evaluatedPositions} interval={interval} positionOffset={binary ? 1 : 0} />
            ) : <div className="visualization-placeholder"><span>○</span></div>}
          </section>
          {result && <VisualizationPanel binary={binary} result={result} stepIndex={stepIndex} onStepChange={setStepIndex} onReset={resetSteps} />}
        </div>
      </div>
    </>
  );
}