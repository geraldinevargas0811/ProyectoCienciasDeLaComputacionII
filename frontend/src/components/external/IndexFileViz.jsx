import FileBlocks from './FileBlocks';

// Visualización doble para la búsqueda secuencial CON ÍNDICES:
// arriba la estructura de índices (en memoria) y abajo la estructura principal
// de datos organizada en bloques.
export default function IndexFileViz({ records, blockSize, total = null, indexEntries, activeEntry, activeBlock, activeSlot, foundPosition }) {
  return <div className="index-viz">
    <div className="index-lane">
      <div className="lane-title">Archivo de índices <small>(en memoria · 0 accesos a disco)</small></div>
      {indexEntries.length > 0 ? (
        <div className="index-entries">
          {indexEntries.map((entry, i) => (
            <div key={entry.block} className={`index-entry${activeEntry === i ? ' index-entry--active' : ''}`} title={`Última clave del Bloque ${entry.address}`}>
              <span className="index-entry__key">{entry.last ?? '—'}</span>
              <span className="index-entry__addr">→ Bloque {entry.address}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="viz-empty">El índice se construye con la última clave de cada bloque al ingresar datos.</p>
      )}
    </div>
    <div className="index-lane">
      <div className="lane-title">Archivo principal de datos <small>(dispositivo de almacenamiento)</small></div>
      <FileBlocks records={records} blockSize={blockSize} total={total} activeBlock={activeBlock} activeSlot={activeSlot} foundPosition={foundPosition} />
    </div>
    <div className="viz-legend">
      <span><i className="legend__chip legend__chip--index" /> Entrada consultada en el índice</span>
      <span><i className="legend__chip legend__chip--access" /> Bloque leyéndose en disco</span>
      <span><i className="legend__chip legend__chip--compare" /> Registro comparado</span>
      <span><i className="legend__chip legend__chip--found" /> Registro encontrado</span>
    </div>
  </div>;
}