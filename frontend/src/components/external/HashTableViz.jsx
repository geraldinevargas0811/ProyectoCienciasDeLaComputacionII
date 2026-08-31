// Tabla de posiciones/cubetas de la FUNCIÓN HASH: muestra en qué posición cae
// cada clave y resalta las colisiones (posiciones con más de una clave).
export default function HashTableViz({ size, byPosition, activePosition, foundPosition }) {
  const rows = [];
  for (let p = 1; p <= size; p += 1) {
    const keys = byPosition?.[p] ?? [];
    const isCollision = keys.length > 1;
    const isActive = activePosition === p;
    const isFound = foundPosition === p;
    rows.push(
      <div
        key={p}
        className={`hash-row${isCollision ? ' hash-row--collision' : ''}${isActive ? ' hash-row--active' : ''}${isFound ? ' hash-row--found' : ''}`}
      >
        <span className="hash-row__pos">Cubeta {p}</span>
        <span className="hash-row__keys">{keys.length ? keys.map((k) => `<${k}>`).join(' ') : '·'}</span>
        <span className="hash-row__count">{keys.length} {isCollision ? '· colisión' : ''}</span>
      </div>
    );
  }
  return <div className="hash-table-viz">
    {rows}
    <div className="viz-legend">
      <span><i className="legend__chip legend__chip--compare" /> Cubeta consultada</span>
      <span><i className="legend__chip legend__chip--collision" /> Colisión (más de una clave)</span>
    </div>
  </div>;
}