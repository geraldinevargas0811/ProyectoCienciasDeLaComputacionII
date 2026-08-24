import { useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import MemoryStructure from '../../../components/memory/MemoryStructure';
import { ConfigurationPanel, ResultPanel, SearchInput, VisualizationPanel } from '../../../components/search/SearchPanels';
import { binarySearch, isSortedAscending, sequentialSearch } from '../../../utils/searchAlgorithms';

export default function AlgorithmPage({ type }) {
  const binary = type === 'binary';
  const title = binary ? 'Búsqueda binaria' : 'Búsqueda secuencial';
  const description = binary ? 'Encuentra una clave reduciendo el intervalo de una estructura ordenada.' : 'Localiza una clave comparándola con cada elemento de la estructura.';
  const [structureValues, setStructureValues] = useState(null);
  const [keySize, setKeySize] = useState('2');
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const placeholderValues = binary ? [12, 25, 31, 47, 83] : [25, 83, 12, 47, 31];
  const activeStep = result?.steps[stepIndex];
  const visibleRange = binary && structureValues && activeStep ? { start: activeStep.lower, end: activeStep.upper } : null;
  const visibleValues = visibleRange ? structureValues.slice(visibleRange.start, visibleRange.end + 1) : (structureValues ?? placeholderValues);
  const createStructure = (values, configuration) => {
    setStructureValues(values);
    setKeySize(configuration.keySize);
    setResult(null);
    setStepIndex(0);
  };
  const search = (key) => {
    if (!structureValues) return { type: 'error', text: 'Primero crea una estructura para realizar la búsqueda.' };
    if (binary && !isSortedAscending(structureValues)) return { type: 'error', text: 'La búsqueda binaria requiere que la estructura esté ordenada de forma ascendente.' };
    setResult(binary ? binarySearch(structureValues, key) : sequentialSearch(structureValues, key));
    setStepIndex(0);
    return { type: 'success', text: 'Búsqueda ejecutada. Revisa los pasos de la visualización.' };
  };
  return <><PageHeader eyebrow="Búsquedas / Memoria interna" title={title} description={description} /><div className="lab-layout"><div className="lab-layout__controls"><ConfigurationPanel binary={binary} onStructureCreated={createStructure} /><SearchInput keySize={keySize} onSearch={search} /><ResultPanel result={result} binary={binary} /></div><div className="lab-layout__visual"><section className="panel"><h2>Visualización de memoria</h2><p className="panel__intro">Índice y valor almacenado en cada celda.</p><MemoryStructure values={visibleValues} startIndex={visibleRange?.start} currentIndex={activeStep?.currentIndex} discardedIndices={activeStep?.discardedIndices} foundIndex={activeStep?.found ? activeStep.currentIndex : undefined} />{!structureValues && <small className="memory-placeholder">Datos demostrativos hasta crear la estructura.</small>}</section><VisualizationPanel binary={binary} result={result} stepIndex={stepIndex} onStepChange={setStepIndex} /></div></div></>;
}
