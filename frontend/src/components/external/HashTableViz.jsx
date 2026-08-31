// Tabla de la FUNCIÓN HASH ordenada por TAMAÑO DE ESTRUCTURA (M posiciones).
// Muestra cada posición (slot) de la estructura según el tamaño M elegido y las
// claves que cayeron en ella, igual para todos los métodos de transformación.
// Resalta la posición activa, la encontrada y las colisiones.
export default function HashTableViz({ size, byPosition, activePosition, foundPosition }) {
  const slots = [];
  for (let p = 1; p <= size; p += 1) {
    const keys = byPosition?.[p] ?? [];
    const isCollision = keys.length > 1;
    const isActive = activePosition === p;
    const isFound = foundPosition === p;
    slots.push(
      <div
        key={p}
        className={`hash-slot${isCollision ? ' hash-slot--collision' : ''}${isActive ? ' hash-slot--active' : ''}${isFound ? ' hash-slot--found' : ''}`}
      >
        <span className="hash-slot__index">{p}</span>
        <span className="hash-slot__keys">{keys.length ? keys.map((k) => `<${k}>`).join(' ') : '·'}</span>
        <span className="hash-slot__count">{keys.length}{isCollision ? ' · colisión' : ''}</span>
      </div>
    );
  }
  return <div className="hash-structure" aria-label={`Estructura de ${size} posiciones`}>
    <div className="hash-structure__head">Tamaño de la estructura: <strong>M = {size}</strong> posiciones</div>
    <div className="hash-structure__grid">{slots}</div>
    <div className="viz-legend">
      <span><i className="legend__chip legend__chip--compare" /> Posición consultada</span>
      <span><i className="legend__chip legend__chip--collision" /> Colisión (2+ claves)</span>
    </div>
  </div>;
}
