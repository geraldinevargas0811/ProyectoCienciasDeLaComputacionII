import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import FileBlocks from './FileBlocks';
import { splitBlocks } from '../../utils/external/fileBlocks';

// Visualización para la búsqueda secuencial CON ÍNDICES.
// Cada índice (I1, I2, I3…) se representa como un BLOQUE/CUBETA independiente
// que contiene los registros que le pertenecen, tal como una estructura
// académica de búsqueda externa: ÍNDICE → CUBETA → REGISTROS.
//
// Los bloques van CONTIGUOS en horizontal, todos a la misma altura, y se
// conectan con una línea DIAGONAL: la punta sale desde abajo de cada índice y
// llega a la parte de arriba del siguiente. La línea representa el recorrido
// SECUENCIAL del índice (cada Consulta pasa de una entrada a la siguiente) y
// se vuelve activa cuando la búsqueda ya la atravesó.
const CONNECTOR_WIDTH = 46;
const STEP = 0;

export default function IndexFileViz({ records, blockSize, total = null, indexEntries, activeEntry, activeBlock, activeSlot, foundPosition }) {
  const blocks = records.length ? splitBlocks(records, blockSize) : [];

  // Índice (0-based) que se está consultando: la entrada del paso actual o, si
  // ya se leyó el bloque, la entrada que lo seleccionó (activeBlock). Con esto
  // se iluminan SOLO las conexiones realmente recorridas durante la búsqueda.
  const consultedIndex = activeEntry != null ? activeEntry : (activeBlock != null ? activeBlock : null);

  // Se mide la altura real de cada bloque para dibujar la diagonal exacta
  // desde el borde inferior de un índice hasta el borde superior del siguiente.
  const blockRefs = useRef([]);
  const [blockHeights, setBlockHeights] = useState([]);
  useLayoutEffect(() => {
    setBlockHeights(blocks.map((_, b) => blockRefs.current[b]?.offsetHeight ?? 0));
  }, [records, blockSize]);

  return <div className="index-viz">
    <div className="index-lane">
      <div className="lane-title">Estructura de índices <small>(cada bloque es un índice · en memoria · 0 accesos a disco)</small></div>
      {blocks.length > 0 ? (
        <div className="idx-blocks">
          <div className="idx-blocks__row">
            {blocks.map((block, b) => {
              const activeIndex = activeEntry === b;
              const isBlockRead = activeBlock === b;
              const entry = indexEntries[b];
              const connected = consultedIndex != null && b <= consultedIndex;
              const prevHeight = blockHeights[b - 1] || 0;
              const svgHeight = Math.max(prevHeight, STEP);
              return (
                <Fragment key={b}>
                  {b > 0 && (
                    <div className="idx-connector" style={{ marginTop: (b - 1) * STEP, height: svgHeight, opacity: prevHeight ? 1 : 0 }}>
                      {prevHeight > 0 && (
                        <svg
                          width={CONNECTOR_WIDTH}
                          height={svgHeight}
                          viewBox={`0 0 ${CONNECTOR_WIDTH} ${svgHeight}`}
                          className={`idx-connector__svg${connected ? ' idx-connector--active' : ''}`}
                          aria-hidden="true"
                        >
                          <line x1="2" y1={prevHeight} x2={CONNECTOR_WIDTH - 1} y2={STEP} className="idx-connector__line" />
                          <polygon className="idx-connector__head" points={`${CONNECTOR_WIDTH - 7},${STEP - 3} ${CONNECTOR_WIDTH},${STEP} ${CONNECTOR_WIDTH - 7},${STEP + 3}`} />
                        </svg>
                      )}
                    </div>
                  )}
                  <div
                    ref={(el) => { blockRefs.current[b] = el; }}
                    className={`idx-block${activeIndex ? ' idx-block--active' : ''}${isBlockRead ? ' idx-block--reading' : ''}`}
                    style={{ marginTop: b * STEP }}
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
                </Fragment>
              );
            })}
          </div>
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
      <span><i className="legend__chip legend__chip--link" /> Recorrido del índice</span>
      <span><i className="legend__chip legend__chip--access" /> Bloque leyéndose en disco</span>
      <span><i className="legend__chip legend__chip--compare" /> Registro comparado</span>
      <span><i className="legend__chip legend__chip--found" /> Registro encontrado</span>
    </div>
  </div>;
}