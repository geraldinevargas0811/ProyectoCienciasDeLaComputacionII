import { useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import MemoryStructure from '../../../components/memory/MemoryStructure';
import { ConfigurationPanel, ResultPanel, SearchInput, VisualizationPanel } from '../../../components/search/SearchPanels';

export default function AlgorithmPage({ type }) {
  const binary = type === 'binary'; const title = binary ? 'Búsqueda binaria' : 'Búsqueda secuencial';
  const description = binary ? 'Encuentra una clave reduciendo el intervalo de una estructura ordenada.' : 'Localiza una clave comparándola con cada elemento de la estructura.';
  const [structureValues, setStructureValues] = useState(binary ? [12, 25, 31, 47, 83] : [25, 83, 12, 47, 31]);
  return <><PageHeader eyebrow="Búsquedas / Memoria interna" title={title} description={description} /><div className="lab-layout"><div className="lab-layout__controls"><ConfigurationPanel binary={binary} onStructureCreated={setStructureValues} /><SearchInput /><ResultPanel /></div><div className="lab-layout__visual"><section className="panel"><h2>Visualización de memoria</h2><p className="panel__intro">Índice y valor almacenado en cada celda.</p><MemoryStructure values={structureValues} /></section><VisualizationPanel /></div></div></>;
}
