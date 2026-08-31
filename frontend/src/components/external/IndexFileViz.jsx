import FileBlocks from './FileBlocks';
import { splitBlocks } from '../../utils/external/fileBlocks';

// Visualización para la búsqueda secuencial CON ÍNDICES.
// Cada índice (I1, I2, I3…) se representa como un BLOQUE/CUBETA independiente
// que contiene los registros que le pertenecen, tal como una estructura
// académica de búsqueda externa: ÍNDICE → CUBETA → REGISTROS.
export default function IndexFileViz({ records, blockSize, total = null, indexEntries, activeEntry, activeBlock, activeSlot, foundPosition }) {
  const blocks = records.length ? splitBlocks(records, blockSize) : [];

  return <div className="index-viz">
    <div className="index-lane">
      <div className="lane-title">Estructura de índices <small>(cada bloque es un índice · en memoria · 0 accesos a disco)</small></div>
      {blocks.length > 0 ? (
        <div className="idx-blocks">
          {blocks.map((block, b) => {
            const activeIndex = activeEntry === b;
            const isBlockRead = activeBlock === b;
            const entry = indexEntries[b];
            return (
              <div
                key={b}
                className={`idx-block${activeIndex ? ' idx-block--active' : ''}${isBlockRead ? ' idx-block--reading' : ''}`}
              >
                <div className="idx-block__head">
                  <strong className="idx-block__id">I{b + 1}</strong>
                  {entry && (
                    <span className="idx-block__ref">clave máx. {entry.last ?? '—'} → B{entry.address}</span>
                  )}
                </div>
                <div className="idx-block__list">
                  {block.map((record, slotIndex) => {
                    const position = b * blockSize + slotIndex + 1;
                    const isComparing = (activeIndex || isBlockRead) && activeSlot === slotIndex;
                    const isFound = foundPosition === position;
                    const classes = [
                      'idx-record',
                      isComparing ? 'idx-record--active' : '',
                      isFound ? 'idx-record--found' : '',
                    ].filter(Boolean).join(' ');
                    return (
                      <div key={position} className={classes} title={record ? `Posición ${position}` : 'Vacío'}>
                        <span className="idx-record__pos">{position}</span>
                        <span className="idx-record__key">{record ? `● Reg ${position}` : '○ Vacío'}</span>
                      </div>
                    );
                  })}
                  {block.length === 0 && (
                    <div className="idx-record idx-record--empty" title="Vacío">
                      <span className="idx-record__pos">—</span>
                      <span className="idx-record__key">○ Vacío</span>
                    </div>
                  )}
                </div>
                <div className="idx-block__footer">{block.length} registro(s)</div>
              </div>
            );
          })}
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
      <span><i className="legend__chip legend__chip--index" /> Índice consultado</span>
      <span><i className="legend__chip legend__chip--access" /> Bloque leyéndose en disco</span>
      <span><i className="legend__chip legend__chip--compare" /> Registro comparado</span>
      <span><i className="legend__chip legend__chip--found" /> Registro encontrado</span>
    </div>
  </div>;
}
