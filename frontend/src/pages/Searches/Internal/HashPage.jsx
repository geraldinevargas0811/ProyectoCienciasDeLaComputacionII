import { useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import MemoryStructure from '../../../components/memory/MemoryStructure';
import { ConfigurationPanel, SearchInput, VisualizationPanel } from '../../../components/search/SearchPanels';
import { searchHash, transformHash } from '../../../services/hashApi';

export default function HashPage() {
  const [result, setResult] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const createTable = async (keys, nextConfiguration) => {
    try {
      const nextResult = await transformHash({ keys, size: nextConfiguration.size, hashFunction: nextConfiguration.hashFunction, collisionMethod: nextConfiguration.collisionMethod });
      setResult(nextResult); setConfiguration(nextConfiguration); setStepIndex(0);
      return { type: 'success', text: 'Tabla creada. Recorre la inserción paso a paso.' };
    } catch (error) {
      return { type: 'error', text: error instanceof TypeError ? 'No fue posible conectar con el backend. Inícialo para construir la tabla.' : error.message };
    }
  };
  const runSearch = async (target) => {
    if (!result || !configuration) return { type: 'error', text: 'Primero crea la tabla para buscar una clave.' };
    try {
      const searchResult = await searchHash({ keys: result.initialStructure, size: configuration.size, hashFunction: configuration.hashFunction, collisionMethod: configuration.collisionMethod, target });
      setResult(searchResult); setStepIndex(0);
      return { type: 'success', text: 'Búsqueda ejecutada. Revisa el recorrido sobre la tabla.' };
    } catch (error) { return { type: 'error', text: error instanceof TypeError ? 'No fue posible conectar con el backend.' : error.message }; }
  };
  const activeStep = result?.steps[stepIndex];
  const visibleTable = activeStep?.tableSnapshot ?? result?.table;
  const visibleNested = activeStep?.nestedSnapshot ?? result?.nested;
  const visibleLists = activeStep?.listsSnapshot ?? result?.lists;
  const isSearchRun = result?.algorithm?.startsWith('Búsqueda');
  const finalStep = result?.steps?.[result.steps.length - 1];
  return (
    <>
      <PageHeader eyebrow="Búsquedas / Memoria interna" title="Transformación de claves / tablas hash" description="La función hash elige la posición inicial; el método seleccionado resuelve únicamente las colisiones." />
      <div className="lab-layout">
        <div className="lab-layout__controls">
          <ConfigurationPanel hash onStructureCreated={createTable} />
          {result && (
            <>
              <section className="panel keys-panel"><h2>Datos a insertar</h2><p>{result.initialStructure.join(' → ')}</p><small>Se procesan exactamente en este orden.</small></section>
              <SearchInput keySize={configuration?.keySize} onSearch={runSearch} />
            </>
          )}
          <VisualizationPanel hash result={result} stepIndex={stepIndex} onStepChange={setStepIndex} configuration={configuration} />
        </div>
        <div className="lab-layout__visual">
          <section className="panel">
            <h2>Visualización de la tabla hash</h2>
            <p className="panel__intro">Amarillo: evaluando · rojo: colisión · verde: disponible, insertada o encontrada · gris: descartada.</p>
            {isSearchRun && finalStep && ['found', 'discarded'].includes(finalStep.action) && (
              <p className={`validation-message validation-message--${finalStep.action === 'found' ? 'success' : 'error'}`} role="status">{finalStep.description}</p>
            )}
            {result ? (
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
                nestedByPosition={result.nestedByPosition}
                collisionMethod={configuration?.collisionMethod}
              />
            ) : <p className="notice">Configura y crea una tabla para visualizar la estructura vacía y su construcción progresiva.</p>}
          </section>
          {result?.collisions.length > 0 && (
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
