import FileBlocks from './FileBlocks';

// Visualización doble para la búsqueda secuencial CON ÍNDICES:
// arriba el ARCHIVO DE ÍNDICES (en memoria) y abajo el archivo principal de
// datos organizado en bloques.
export default function IndexFileViz({ records, blockSize, indexEntries, activeEntry, activeBlock, activeSlot, foundPosition }) {
  return <div className="index-viz">
    <div className="index-lane">
      <div className="lane-title">ARCHIVO DE ÍNDICES <small>(en memoria · 0 accesos a disco)</small></div>
      <div className="index-entries">
        {indexEntries.map((entry, i) => (
          <div key={entry.block} className={`index-entry${activeEntry === i ? ' index-entry--active' : ''}`}>
            <span className="index-entry__range">[{entry.first ?? '—'}..{entry.last ?? '—'}]</span>
            <span className="index-entry__keys">{entry.count} clave(s)</span>
            <span className="index-entry__addr">→ BLOQUE {entry.address}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="index-lane">
      <div className="lane-title">ARCHIVO PRINCIPAL DE DATOS <small>(dispositivo de almacenamiento)</small></div>
      <FileBlocks records={records} blockSize={blockSize} activeBlock={activeBlock} activeSlot={activeSlot} foundPosition={foundPosition} />
    </div>
  </div>;
}