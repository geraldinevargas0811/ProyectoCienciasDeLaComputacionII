// Visualización del directorio de CUBETAS.
// Cada cubeta muestra su bloque principal y, si hubo desbordamiento, los
// bloques enlazados. activeBucket/activeBlock/activeSlot resaltan el recorrido
// de la búsqueda dentro de la cubeta.
export default function BucketDirectory({ directory, capacity, activeBucket, activeBlock, activeSlot, found }) {
  return <div className="bucket-dir">
    {directory.map((cubeta, index) => {
      const bucketNumber = index + 1;
      const isActive = activeBucket === bucketNumber;
      return <div key={bucketNumber} className={`bucket${isActive ? ' bucket--active' : ''}`}>
        <div className="bucket__head">Cubeta {bucketNumber}</div>
        {cubeta.blocks.map((block, bi) => (
          <div key={bi} className={`bucket-block${isActive && activeBlock === bi ? ' bucket-block--active' : ''}`}>
            {bi > 0 && <span className="bucket-block__over">⟶ desbordamiento</span>}
            <div className="bucket-slots">
              {Array.from({ length: Math.max(capacity, block.length) }, (_, si) => {
                const value = block[si];
                const isHighlighted = isActive && activeBlock === bi && activeSlot === si && value != null;
                return <div
                  key={si}
                  className={`bucket-slot${isActive && bi === 0 && si === 0 && value == null ? ' bucket-slot--empty' : ''}${isHighlighted ? (found ? ' bucket-slot--found' : ' bucket-slot--active') : ''}`}
                >{value ?? '·'}</div>;
              })}
            </div>
          </div>
        ))}
        <div className="bucket__load">{cubeta.blocks.flat().length} registro(s)</div>
      </div>;
    })}
    <div className="viz-legend">
      <span><i className="legend__chip legend__chip--bucket" /> Cubeta destino</span>
      <span><i className="legend__chip legend__chip--block" /> Bloque leyéndose</span>
      <span><i className="legend__chip legend__chip--compare" /> Registro comparado</span>
      <span><i className="legend__chip legend__chip--found" /> Registro encontrado</span>
    </div>
  </div>;
}