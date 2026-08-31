import { splitBlocks } from '../../utils/external/fileBlocks';

// Visualización del archivo externo dividido en BLOQUES.
// - disk-block--active : bloque que se está leyendo del disco.
// - disk-slot--active  : registro que se está comparando.
// - disk-slot--found   : registro encontrado.
export default function FileBlocks({ records, blockSize, activeBlock, activeSlot, foundPosition, searchedPosition = null }) {
  const blocks = splitBlocks(records, blockSize);
  return <div className="disk-file">
    {blocks.map((block, b) => {
      const act = activeBlock === b;
      return <div key={b} className={`disk-block${act ? ' disk-block--active' : ''}`}>
        <div className="disk-block__head">
          <strong>BLOQUE {b + 1}</strong>
          <span>dir {String(b + 1).padStart(2, '0')}</span>
          {act && <em className="disk-block__reading">→ leyendo…</em>}
        </div>
        <div className="disk-block__slots">
          {block.map((record, slotIndex) => {
            const position = b * blockSize + slotIndex + 1;
            const classes = [
              'disk-slot',
              act && activeSlot === slotIndex ? 'disk-slot--active' : '',
              foundPosition === position ? 'disk-slot--found' : '',
              searchedPosition != null && position <= searchedPosition && foundPosition === null ? 'disk-slot--searched' : '',
            ].filter(Boolean).join(' ');
            return <div key={position} className={classes} title={`Posición ${position}`}>
              <span className="disk-slot__pos">{position}</span>
              <strong className="disk-slot__key">{record.key}</strong>
              <small className="disk-slot__name">{record.name}</small>
            </div>;
          })}
        </div>
      </div>;
    })}
  </div>;
}