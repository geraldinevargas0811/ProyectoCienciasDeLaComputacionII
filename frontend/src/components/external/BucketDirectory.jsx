// Visualización del directorio de CUBETAS.
// Cada cubeta muestra su bloque principal y, si hubo desbordamiento, los
// bloques enlazados. activeBucket/activeBlock/activeSlot resaltan el recorrido
// de la búsqueda dentro de la cubeta.
//
// Cuando se está realizando una búsqueda (prop `flow`) se muestra además el
// flujo visual CLAVE → FUNCIÓN HASH → POSICIÓN/CUBETA: la clave buscada, la
// transformación de la clave y la cubeta destino. Los bloques ya leídos se
// marcan como "consultado" y los registros ya comparados se atenúan, para
// que el paso a paso muestre el desplazamiento dentro de la cubeta.
export default function BucketDirectory({ directory, capacity, activeBucket, activeBlock, activeSlot, found, flow }) {
  const searching = Boolean(flow);

  return <div className="bucket-viz">
    {flow && (
      <div className="search-flow" aria-label="Recorrido de la búsqueda">
        <div className={`search-flow__step search-flow__step--key${activeBlock == null ? ' search-flow__step--active' : ''}`}>
          <span className="search-flow__label">Clave buscada</span>
          <strong className="search-flow__value">{flow.target}</strong>
        </div>
        <span className="search-flow__arrow">⟶</span>
        <div className={`search-flow__step search-flow__step--fn${activeBlock == null ? ' search-flow__step--active' : ''}`}>
          <span className="search-flow__label">{flow.functionLabel}</span>
          <small className="search-flow__transform">{flow.transform}</small>
        </div>
        <span className="search-flow__arrow">⟶</span>
        <div className={`search-flow__step search-flow__step--pos${activeBlock != null ? ' search-flow__step--active' : ''}`}>
          <span className="search-flow__label">Posición / Cubeta obtenida</span>
          <strong className="search-flow__value">Cubeta {flow.position}</strong>
        </div>
      </div>
    )}

    <div className="bucket-dir">
      {directory.map((cubeta, index) => {
        const bucketNumber = index + 1;
        const isActive = activeBucket === bucketNumber;
        return <div key={bucketNumber} className={`bucket${isActive ? ' bucket--active' : ''}`}>
          <div className="bucket__head">Cubeta {bucketNumber}</div>
          {cubeta.blocks.map((block, bi) => {
            const isRead = searching && isActive && activeBlock != null && bi < activeBlock;
            const isWaiting = searching && isActive && activeBlock != null && bi > activeBlock;
            const blockClasses = [`bucket-block${isActive && activeBlock === bi ? ' bucket-block--active' : ''}`];
            if (isRead) blockClasses.push('bucket-block--read');
            if (isWaiting) blockClasses.push('bucket-block--waiting');
            return <div key={bi} className={blockClasses.join(' ')}>
              {bi > 0 && (
                <span className={`bucket-block__over${isActive && (activeBlock === bi || activeBlock == null) ? ' bucket-block__over--active' : ''}`}>
                  ⟶ desbordamiento
                </span>
              )}
              <span className="bucket-block__tag">{bi === 0 ? 'Bloque principal' : `Bloque de desbordamiento ${bi}`}</span>
              <div className="bucket-slots">
                {Array.from({ length: Math.max(capacity, block.length) }, (_, si) => {
                  const value = block[si];
                  const isHighlighted = isActive && activeBlock === bi && activeSlot === si && value != null;
                  const isCompared = searching && isActive && activeBlock === bi && activeSlot != null && si < activeSlot && value != null;
                  const slotClasses = [`bucket-slot${isActive && bi === 0 && si === 0 && value == null ? ' bucket-slot--empty' : ''}`];
                  if (isCompared) slotClasses.push('bucket-slot--compared');
                  if (isHighlighted) slotClasses.push(found ? 'bucket-slot--found' : 'bucket-slot--active');
                  return <div key={si} className={slotClasses.join(' ')}>{value ?? '·'}</div>;
                })}
              </div>
            </div>;
          })}
          <div className="bucket__load">{cubeta.blocks.flat().length} registro(s)</div>
        </div>;
      })}
    </div>

    <div className="viz-legend">
      <span><i className="legend__chip legend__chip--key" /> Clave buscada</span>
      <span><i className="legend__chip legend__chip--bucket" /> Cubeta destino</span>
      <span><i className="legend__chip legend__chip--block" /> Bloque leyéndose</span>
      <span><i className="legend__chip legend__chip--compare" /> Registro comparado</span>
      <span><i className="legend__chip legend__chip--found" /> Registro encontrado</span>
    </div>
  </div>;
}