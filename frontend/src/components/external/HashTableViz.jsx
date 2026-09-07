// Tabla de la FUNCIÓN HASH por TAMAÑO DE ESTRUCTURA (M posiciones).
// Cuadrícula simple: cada celda es una POSICIÓN y muestra únicamente el número
// de la clave (o las claves) que cayó en ella. Nada de información extra; solo
// se resalta la posición consultada durante el paso a paso.
export default function HashTableViz({ size, byPosition, activePosition }) {
  const cells = [];
  for (let p = 1; p <= size; p += 1) {
    const keys = byPosition?.[p] ?? [];
    const isActive = activePosition === p;
    const isCollision = keys.length > 1;
    cells.push(
      <div key={p} className={`hash-cell${isActive ? ' hash-cell--active' : ''}${isCollision ? ' hash-cell--collision' : ''}`}>
        <strong className="hash-cell__keys">{keys.length ? keys.join(' · ') : '·'}</strong>
        {isCollision && <span className="hash-cell__badge">×{keys.length}</span>}
      </div>
    );
  }

  return <div className="hash-grid">
    <div className="hash-grid__head">Tamaño de la estructura: <strong>M = {size}</strong> posiciones</div>
    <div className="hash-grid__table">{cells}</div>
    <div className="viz-legend">
      <span><i className="legend__chip legend__chip--collision" /> Colisión: 2+ claves en la misma posición</span>
    </div>
  </div>;
}