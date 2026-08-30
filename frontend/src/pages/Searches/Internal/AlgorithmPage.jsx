import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import MemoryStructure from '../../../components/memory/MemoryStructure';
import { CreateStructurePanel, InsertDataPanel, OperationsPanel, ResultPanel, VisualizationPanel } from '../../../components/search/SearchPanels';
import { binaryDelete, binarySearch, isSortedAscending, sequentialDelete, sequentialSearch } from '../../../utils/searchAlgorithms';

const generateKeys = (count, digits) => {
  const minimum = digits === 1 ? 0 : 10 ** (digits - 1);
  const available = 10 ** digits - minimum;
  if (count > available) return null;
  const generated = new Set();
  while (generated.size < count) generated.add(String(Math.floor(Math.random() * available) + minimum));
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
    return { type: searchResult.found ? 'success' : 'error', text: searchResult.found ? `Clave ${normalized} encontrada en la celda ${searchResult.index}.` : `La clave ${normalized} no fue encontrada.` };
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
    return { type: deleteResult.found ? 'success' : 'error', text: deleteResult.found ? `Clave ${normalized} eliminada de la celda ${deleteResult.index}.` : `La clave ${normalized} no fue encontrada: no se eliminó nada.` };
  };

  const runClear = async () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
    if (values) setValues(values.map(() => null));
    setLastInserted(null);
    setResult(null);
    setStepIndex(0);
    setBusy(false);
    return { type: 'success', text: 'Estructura vacía: lista para ingresar nuevos datos.' };
  };

  const resetSteps = () => {
    setResult(null);
    setStepIndex(0);
  };

  const activeStep = result?.steps[stepIndex];
  const isDelete = result?.type === 'delete';
  const visibleValues = isDelete && activeStep?.values ? activeStep.values : (values ?? []);
  const showRange = binary && activeStep && !isDelete && activeStep.lower !== undefined;
  const displayValues = showRange ? visibleValues.slice(activeStep.lower, activeStep.upper + 1) : visibleValues;
  const startIndex = showRange ? activeStep.lower : undefined;

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
          {created && <InsertDataPanel busy={busy} insertedCount={filledCount} total={Number(size) || 0} onInsert={insertManual} onGenerate={generateAutomatic} />}
          {created && <OperationsPanel disabled={busy} onSearch={runSearch} onDelete={runDelete} onClear={runClear} />}
          {result && <ResultPanel result={result} binary={binary} />}
        </div>
        <div className="lab-layout__visual">
          <section className="panel">
            <h2>Visualización de memoria</h2>
            {created ? (
              <MemoryStructure values={displayValues} startIndex={startIndex} currentIndex={highlight.currentIndex} discardedIndices={highlight.discardedIndices} foundIndex={highlight.foundIndex} stepAction={highlight.stepAction} />
            ) : <div className="visualization-placeholder"><span>○</span></div>}
          </section>
          {result && <VisualizationPanel binary={binary} result={result} stepIndex={stepIndex} onStepChange={setStepIndex} onReset={resetSteps} />}
        </div>
      </div>
    </>
  );
}