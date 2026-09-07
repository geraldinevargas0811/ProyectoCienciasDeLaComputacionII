import { splitBlocks } from '../../utils/external/fileBlocks';

// BÚSQUEDA SECUENCIAL — USANDO BLOQUES: cuadrícula de registros.
// Cada BLOQUE del archivo se representa como una FILA de la cuadrícula y cada
// REGISTRO como una celda, con tantas columnas como el tamaño de bloque
// BLOQUE = √N. El paso a paso resalta la fila (Bloque) que se está leyendo, la
// celda que se está comparando y la celda encontrada; las filas ya consultadas
// se atenúan para mostrar el avance de la búsqueda.
export default function BlocksGrid({ records, blockSize, total = null, activeBlock, activeSlot, foundPosition }) {
  const source = records.length ? records : (total ? Array.from({ length: total }, () => ({ key: null })) : []);
  const blocks = splitBlocks(source, blockSize);
  const cols = Math.max(1, blockSize);

  return <div className="seq-grid">
    {blocks.map((block, b) => {
      const act = activeBlock === b;
      const read = activeBlock != null && b < activeBlock;
      const waiting = activeBlock != null && b > activeBlock;
      const rowClasses = ['seq-row'];
      if (act) rowClasses.push('seq-row--active');
      if (read) rowClasses.push('seq-row--read');
      if (waiting) rowClasses.push('seq-row--waiting');
      const cells = [];
      for (let j = 0; j < cols; j += 1) {
        const record = block[j];
        const position = b * blockSize + j + 1;
        const isActive = act && activeSlot === j;
        const isCompared = act && activeSlot != null && j < activeSlot;
        const isFound = foundPosition === position;
        const cellClasses = ['seq-cell'];
        if (!record) cellClasses.push('seq-cell--empty');
        if (isCompared) cellClasses.push('seq-cell--compared');
        if (isFound) cellClasses.push('seq-cell--found');
        if (isActive) cellClasses.push('seq-cell--active');
        cells.push(
          <div key={position} className={cellClasses.join(' ')} title={record ? `Posición ${position}` : 'Vacío'}>
            <span className="seq-cell__pos">{record ? position : '·'}</span>
            {record && <strong className="seq-cell__key">{record.key}</strong>}
          </div>
        );
      }
      return (
        <div key={b} className={rowClasses.join(' ')}>
          <div className="seq-row__label">{act ? `Bloque ${b + 1} · leyendo` : `Bloque ${b + 1}`}</div>
          <div className="seq-row__cells" style={{ ['--cols']: cols }}>
            {cells}
          </div>
        </div>
      );
    })}

    <div className="viz-legend">
      <span><i className="legend__chip legend__chip--access" /> Bloque leyéndose</span>
      <span><i className="legend__chip legend__chip--compare" /> Registro comparado</span>
      <span><i className="legend__chip legend__chip--found" /> Registro encontrado</span>
    </div>
  </div>;
}