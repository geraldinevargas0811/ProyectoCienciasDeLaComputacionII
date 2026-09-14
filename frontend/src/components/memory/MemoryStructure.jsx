import { useState } from 'react';

function stateFor(index, { currentIndex, collisionIndices, foundIndex, discardedIndices, stepAction }) {
  if (foundIndex === index) return 'found';
  if (currentIndex === index) {
    if (['inserted', 'available', 'free', 'found'].includes(stepAction)) return 'found';
    if (['collision', 'attempt'].includes(stepAction)) return 'collision';
    if (stepAction === 'deleted') return 'deleted';
    if (stepAction === 'discarded') return 'discarded';
    return 'evaluating';
  }
  if (collisionIndices.includes(index)) return 'discarded';
  return discardedIndices.includes(index) ? 'discarded' : undefined;
}

const NEUTRAL_OPTIONS = { currentIndex: undefined, currentArray: undefined, currentNode: -1, collisionIndices: [], foundIndex: undefined, discardedIndices: [], stepAction: undefined };

// Ancho aproximado que ocupa cada nodo extra de una lista enlazada (nodo + línea de conexión).
const CHAIN_NODE_WIDTH = 66;

// A partir de esta cantidad de posiciones la tabla pasa a representación compacta:
// primera posición, última posición y las que estén activas/evaluadas, con "…" en medio.
const COMPACT_THRESHOLD = 10;

// Los controles del zoom afectan únicamente el área del diagrama, nunca toda la página.
function ZoomToolbar({ zoom, onZoomChange }) {
  const z = Math.round(zoom * 100) / 100;
  return <div className="tree-viewer__toolbar">
    <button type="button" title="Acercar" onClick={() => onZoomChange(Math.min(2, Math.round((z + 0.1) * 10) / 10))} disabled={z >= 2}>+</button>
    <button type="button" title="Alejar" onClick={() => onZoomChange(Math.max(0.4, Math.round((z - 0.1) * 10) / 10))} disabled={z <= 0.4}>−</button>
    <button type="button" title="Restablecer zoom" onClick={() => onZoomChange(1)}>⇱</button>
    <span className="tree-viewer__zoom">{Math.round(z * 100)}%</span>
  </div>;
}

function displayValue(value) {
  return value === '*' ? '✕' : (value ?? '—');
}

function isEmptyValue(value) {
  return value === null || value === undefined;
}

// Dado un conjunto ordenado de posiciones a mostrar, intercala los marcadores "…"
// en los huecos. Cada elemento devuelto es { type: 'ellipsis' | 'row', position }.
function rowsWithEllipsis(positions) {
  const rows = [];
  let prev = null;
  positions.forEach((position) => {
    if (prev !== null && position - prev > 1) rows.push({ type: 'ellipsis', position, key: `gap-${prev}-${position}` });
    rows.push({ type: 'row', position });
    prev = position;
  });
  return rows;
}

// Posiciones visibles en modo compacto (1‑based): extremos + posiciones que ya
// fueron evaluadas durante el proceso (nunca desaparecen al avanzar la animación),
// cadenas enlazadas y las posiciones activas/discartadas del paso actual.
function compactHashPositions(total, stateOptions, forcedState, lists, evaluatedPositions) {
  const shown = new Set([1, total]);
  const add = (position) => { if (position !== undefined && position !== null && position >= 1 && position <= total) shown.add(position); };
  add(stateOptions.currentIndex);
  add(stateOptions.foundIndex);
  (stateOptions.collisionIndices ?? []).forEach(add);
  (stateOptions.discardedIndices ?? []).forEach(add);
  (evaluatedPositions ?? []).forEach(add);
  if (forcedState?.position !== undefined) add(forcedState.position);
  lists.forEach((chain, index) => { if (chain && chain.length > 1) shown.add(index + 1); });
  return [...shown].sort((a, b) => a - b);
}

function compactMemoryPositions(values, startIndex, stateOptions, evaluatedPositions) {
  const first = startIndex;
  const last = startIndex + values.length - 1;
  const shown = new Set([first, last]);
  const add = (position) => { if (position !== undefined && position !== null && position >= first && position <= last) shown.add(position); };
  add(stateOptions.currentIndex);
  add(stateOptions.foundIndex);
  (stateOptions.collisionIndices ?? []).forEach(add);
  (stateOptions.discardedIndices ?? []).forEach(add);
  (evaluatedPositions ?? []).forEach(add);
  values.forEach((value, index) => { if (!isEmptyValue(value) && value !== '*') shown.add(index + startIndex); });
  return [...shown].sort((a, b) => a - b);
}

function HashArray({ title, values, stateOptions, forcedState, lists = [], compact, evaluatedPositions = [] }) {
  const total = values.length;
  const positions = compact ? compactHashPositions(total, stateOptions, forcedState, lists, evaluatedPositions) : values.map((_, index) => index + 1);
  return <section className="hash-array"><h3>{title}</h3>{rowsWithEllipsis(positions).map((row) => {
    if (row.type === 'ellipsis') return <div className="hash-array__ellipsis" key={row.key}>…</div>;
    const position = row.position;
    const index = position - 1;
    const value = values[index];
    const chain = lists[index];
    const rowOptions = stateOptions.currentNode > 0 && stateOptions.currentIndex === position ? { ...stateOptions, currentIndex: undefined } : stateOptions;
    const rowState = forcedState?.position === position ? forcedState.state : stateFor(position, rowOptions);
    const embeddedState = value === '*' ? 'deleted' : undefined;
    return <div className={`hash-array__row${embeddedState ? ` memory-cell--${embeddedState}` : ''}${rowState ? ` memory-cell--${rowState}` : ''}`} key={position}><span>{position}</span><strong className={`hash-array__cell${embeddedState ? ' hash-array__cell--deleted' : ''}`}>{displayValue(value)}</strong>{chain?.length > 1 && <div className="hash-chain" aria-label={`Lista enlazada de la posición ${position}`}>{chain.slice(1).map((item, chainIndex) => { const nodeIndex = chainIndex + 1; const nodeState = stateOptions.currentNode === nodeIndex ? (['found', 'inserted', 'available'].includes(stateOptions.stepAction) ? 'found' : stateOptions.stepAction === 'collision' ? 'collision' : 'evaluating') : ''; return <span className={`hash-chain__node${nodeState ? ` memory-cell--${nodeState}` : ''}`} key={`${item}-${chainIndex}`}>{item}</span>; })}</div>}</div>;
  })}</section>;
}

export function MemoryCell({ index, value, state }) {
  return <div className={`memory-cell${state ? ` memory-cell--${state}` : ''}`}><span className="memory-cell__index">{index}</span><strong>{value ?? '—'}</strong></div>;
}

export default function MemoryStructure({ values = [25, 83, 12, 47, 31], hash = false, currentIndex, initialIndex = 0, currentArray = 0, currentNode = -1, discardedIndices = [], foundIndex, startIndex = 0, collisionIndices = [], stepAction, nested = [], lists = [], nestedByPosition = [], collisionMethod, evaluatedPositions = [], nestedEvaluatedPositions = {}, interval, positionOffset = 0 }) {
  const [zoom, setZoom] = useState(1);
  const stateOptions = { currentIndex, currentArray, currentNode, collisionIndices, foundIndex, discardedIndices, stepAction };
  if (!hash) {
    const compact = values.length > COMPACT_THRESHOLD;
    // En búsqueda binaria "interval" acota el tramo activo y las posiciones ya
    // evaluadas (historial) se agregan de forma ACUMULATIVA: ninguna desaparece.
    let positions;
    if (interval) {
      const shown = new Set();
      const add = (position) => { if (position !== undefined && position !== null && position >= 0 && position < values.length) shown.add(position); };
      for (let position = interval[0]; position <= interval[1]; position += 1) add(position);
      evaluatedPositions.forEach(add);
      positions = [...shown].sort((a, b) => a - b);
    } else {
      positions = compact ? compactMemoryPositions(values, startIndex, stateOptions, evaluatedPositions) : values.map((_, index) => index + startIndex);
    }
    const structure = <div className={`memory-structure${compact ? ' memory-structure--compact' : ''}`} aria-label="Representación visual de memoria">{rowsWithEllipsis(positions).map((row) => {
      if (row.type === 'ellipsis') return <div className="memory-cell memory-cell--ellipsis" key={row.key}>…</div>;
      const position = row.position;
      const index = interval ? position : position - startIndex;
      return <MemoryCell key={position} index={position + positionOffset} value={values[index]} state={stateFor(position, stateOptions)} />;
    })}</div>;
    return <div className="structure-viewer">
      <ZoomToolbar zoom={zoom} onZoomChange={setZoom} />
      <div className="structure-viewer__scroll"><div style={{ zoom, transformOrigin: 'top left', margin: '0 auto' }}>{structure}</div></div>
    </div>;
  }
  // Flujo lateral (arreglos anidados): mientras se trabaja en el arreglo K de una posición,
  // los arreglos anteriores de ESA misma posición quedaron en colisión y se muestran en rojo.
  const bucket = initialIndex || currentIndex || 0;
  const lateralChain = collisionMethod === 'nested' && currentArray > 0 ? (nestedByPosition[bucket - 1] ?? []) : [];
  const markCollidedArray = (arrayNumber) => lateralChain.includes(arrayNumber) && arrayNumber < currentArray ? { position: bucket, state: 'collision' } : undefined;
  const mainForcedState = collisionMethod === 'nested' && currentArray > 0 ? { position: bucket, state: 'collision' } : undefined;
  const maxExtraNodes = Math.max(0, ...lists.map((chain) => chain ? chain.length - 1 : 0));
  // Espacio en flujo reservado a la derecha para los nodos enlazados: garantiza scroll horizontal
  // sin deformar el arreglo principal ni superponer nodos con otros arreglos.
  const chainPadding = maxExtraNodes > 0 ? { paddingRight: maxExtraNodes * CHAIN_NODE_WIDTH } : undefined;
  const compact = values.length > COMPACT_THRESHOLD;
  return <div className="hash-table-viewer">
    <ZoomToolbar zoom={zoom} onZoomChange={setZoom} />
    <div className="hash-table-viewer__scroll">
      <div className={`hash-arrays${compact ? ' hash-arrays--compact' : ''}`} style={compact ? { zoom, transformOrigin: 'top left', ...chainPadding } : chainPadding} aria-label="Representación horizontal de la tabla hash"><HashArray title="Arreglo 0 (principal)" values={values} stateOptions={currentArray === 0 ? stateOptions : { ...NEUTRAL_OPTIONS }} forcedState={mainForcedState} lists={lists} compact={compact} evaluatedPositions={evaluatedPositions} />{nested.map((array, index) => { const arrayNumber = index + 1; return <HashArray key={index} title={`Arreglo ${arrayNumber}`} values={array} stateOptions={currentArray === arrayNumber ? stateOptions : { ...NEUTRAL_OPTIONS }} forcedState={markCollidedArray(arrayNumber)} compact={compact} evaluatedPositions={nestedEvaluatedPositions[arrayNumber] ?? []} />; })}</div>
    </div>
  </div>;
}