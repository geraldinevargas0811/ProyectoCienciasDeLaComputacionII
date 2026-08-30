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

function displayValue(value) {
  return value === '*' ? '✕' : (value ?? '—');
}

function HashArray({ title, values, stateOptions, forcedState, lists = [] }) {
  return <section className="hash-array"><h3>{title}</h3>{values.map((value, index) => {
    const position = index + 1;
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

export default function MemoryStructure({ values = [25, 83, 12, 47, 31], hash = false, currentIndex, initialIndex = 0, currentArray = 0, currentNode = -1, discardedIndices = [], foundIndex, startIndex = 0, collisionIndices = [], stepAction, nested = [], lists = [], nestedByPosition = [], collisionMethod }) {
  const stateOptions = { currentIndex, currentArray, currentNode, collisionIndices, foundIndex, discardedIndices, stepAction };
  if (!hash) return <div className="memory-structure" aria-label="Representación visual de memoria">{values.map((value, index) => { const originalIndex = index + startIndex; return <MemoryCell key={originalIndex} index={originalIndex} value={value} state={stateFor(originalIndex, stateOptions)} />; })}</div>;
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
  return <div className="hash-arrays" style={chainPadding} aria-label="Representación horizontal de la tabla hash"><HashArray title="Arreglo 0 (principal)" values={values} stateOptions={currentArray === 0 ? stateOptions : { ...NEUTRAL_OPTIONS }} forcedState={mainForcedState} lists={lists} />{nested.map((array, index) => { const arrayNumber = index + 1; return <HashArray key={index} title={`Arreglo ${arrayNumber}`} values={array} stateOptions={currentArray === arrayNumber ? stateOptions : { ...NEUTRAL_OPTIONS }} forcedState={markCollidedArray(arrayNumber)} />; })}</div>;
}
