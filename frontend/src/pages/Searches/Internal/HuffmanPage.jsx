import { useMemo, useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { buildHuffman, searchCharacter, encodeText } from '../../../utils/huffman';

// ============================================================================
// Configuración del dibujo del árbol: raíz arriba, hijos debajo, hojas abajo,
// líneas que unen padres con hijos, 0 a la izquierda y 1 a la derecha.
// ============================================================================
const NODE_W = 58;   // ancho de la caja hoja
const NODE_H = 46;   // alto de la caja hoja
const CIRCLE_R = 24; // radio de los nodos internos
const Y_SPACING = 92;
const PAD = 30;

const SPACE_SYMBOLS = ['_', '-', '/', '\\'];

// Recolecta todos los nodos (hojas e internos) y las aristas del árbol.
function collectLayout(root) {
  const nodes = []; // { node, depth, indexInOrder }
  const edges = []; // { from, to, bit }
  const leafCounts = { count: 0, maxDepth: 0 };
  const depthOf = new Map();

  const assignDepth = (node, depth) => {
    depthOf.set(node.id, depth);
    if (depth > leafCounts.maxDepth) leafCounts.maxDepth = depth;
    if (node.isLeaf) return;
    assignDepth(node.left, depth + 1);
    assignDepth(node.right, depth + 1);
  };

  const assignX = (node) => {
    if (node.isLeaf) {
      node._x = leafCounts.count;
      leafCounts.count += 1;
      return node._x;
    }
    const lx = assignX(node.left);
    const rx = assignX(node.right);
    node._x = (lx + rx) / 2;
    return node._x;
  };

  const collect = (node) => {
    nodes.push({ node, depth: depthOf.get(node.id) });
    if (!node.isLeaf) {
      edges.push({ from: node.id, to: node.left.id, bit: 0 });
      edges.push({ from: node.id, to: node.right.id, bit: 1 });
      collect(node.left);
      collect(node.right);
    }
  };

  if (root) { assignDepth(root, 0); assignX(root); collect(root); }
  return { nodes, edges, leafCounts };
}

function layoutTree(root) {
  if (!root) return null;
  const { nodes, edges, leafCounts } = collectLayout(root);

  // Espaciado horizontal adaptativo según el número de hojas.
  const spacing = leafCounts.count > 24 ? 40 : leafCounts.count > 12 ? 58 : leafCounts.count > 6 ? 78 : 92;

  const width = Math.max(420, (leafCounts.count - 1) * spacing + NODE_W * 2 + PAD * 2);
  const height = Math.max(300, (leafCounts.maxDepth + 1) * Y_SPACING + NODE_H * 2 + PAD);

  // Lectura de posición horizontal acumulada (+ compensación para centrar).
  const contentMid = ((leafCounts.count - 1) * spacing) / 2 + NODE_W / 2 + PAD;
  const offset = width / 2 - contentMid;

  const getX = (nodeId) => { const n = nodes.find((e) => e.node.id === nodeId).node; return n._x * spacing + offset + PAD + NODE_W / 2; };
  const getY = (nodeId) => { const d = nodes.find((e) => e.node.id === nodeId).depth; return d * Y_SPACING + PAD + NODE_H; };

  return { nodes, edges, width, height, getX, getY, leafCounts };
}

// Visibilidad del árbol según el "paso" alcanzado: cada nodo tiene `step`; los
// nodos con step <= depth son visibles (permite ver crecer el árbol).
function visibleIds(tree, depth) {
  const ids = new Set();
  if (!tree) return ids;
  const walk = (n) => {
    if (n.step <= depth) ids.add(n.id);
    if (!n.isLeaf) { walk(n.left); walk(n.right); }
  };
  walk(tree);
  return ids;
}

function HuffmanTree({ tree, depth, activePath = [] }) {
  const [zoom, setZoom] = useState(1);
  const layout = useMemo(() => layoutTree(tree), [tree]);
  if (!layout) return <div className="visualization-placeholder"><span>○</span></div>;

  const visible = visibleIds(tree, depth);
  const activeSet = new Set(activePath);
  const z = Math.round(zoom * 10) / 10;

  const edgeActive = (e) => activeSet.has(e.from) && activeSet.has(e.to);
  const isVisible = (id) => visible.has(id);

  return (
    <div className="tree-viewer">
      <div className="tree-viewer__toolbar">
        <button type="button" title="Acercar" onClick={() => setZoom((v) => Math.min(2, Math.round((v + 0.1) * 10) / 10))} disabled={z >= 2}>+</button>
        <button type="button" title="Alejar" onClick={() => setZoom((v) => Math.max(0.4, Math.round((v - 0.1) * 10) / 10))} disabled={z <= 0.4}>−</button>
        <button type="button" title="Restablecer zoom" onClick={() => setZoom(1)}>⇱</button>
        <span className="tree-viewer__zoom">{Math.round(z * 100)}%</span>
      </div>
      <div className="tree-canvas tree-canvas--svg">
        <div className="tree-canvas__zoom" style={{ width: layout.width * z, height: layout.height * z }}>
          <svg width={layout.width * z} height={layout.height * z} role="img" aria-label="Árbol de Huffman">
            <g transform={`scale(${z})`}>
              {layout.edges.filter((e) => isVisible(e.to)).map((e) => {
                const dx = layout.getX(e.to) - layout.getX(e.from);
                const dy = layout.getY(e.to) - layout.getY(e.from);
                const mx = (layout.getX(e.from) + layout.getX(e.to)) / 2;
                const my = (layout.getY(e.from) + layout.getY(e.to)) / 2;
                return <g key={`${e.from}-${e.to}`}>
                  <line className={`tree-edge${edgeActive(e) ? ' tree-edge--active' : ''}`} x1={layout.getX(e.from)} y1={layout.getY(e.from)} x2={layout.getX(e.to)} y2={layout.getY(e.to)} />
                  <text className="tree-edge-label" x={mx - 10 - (dx > 0 ? 0 : 0) + (dx === 0 ? 12 : 0)} y={my - 12} textAnchor={dx === 0 ? 'start' : 'middle'}>{e.bit}</text>
                </g>;
              })}
            </g>
            <g transform={`scale(${z})`}>
              {layout.nodes.filter(({ node }) => isVisible(node.id)).map(({ node }) => {
                const x = layout.getX(node.id);
                const y = layout.getY(node.id);
                const isActive = activeSet.has(node.id);
                const cx = x; const cy = y;
                if (node.isLeaf) {
                  const lx = x - NODE_W / 2; const ly = y - NODE_H / 2;
                  return <g key={node.id}>
                    <rect className={`huffman-leaf${isActive ? ' huffman-leaf--active' : ''}`} x={lx} y={ly} width={NODE_W} height={NODE_H} rx="8" />
                    <text className="huffman-leaf-char" x={cx} y={cy - 2} textAnchor="middle">{node.character}</text>
                    <text className="huffman-leaf-freq" x={cx} y={cy + 16} textAnchor="middle">{node.fraction}</text>
                  </g>;
                }
                return <g key={node.id}>
                  <circle className={`tree-node-circle tree-node-circle--key${isActive ? ' tree-node-circle--active' : ''}`} cx={cx} cy={cy} r={CIRCLE_R} />
                  <text className="huffman-internal-freq" x={cx} y={cy} textAnchor="middle" dominantBaseline="central">{node.fraction}</text>
                </g>;
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function HuffmanPage() {
  const [input, setInput] = useState('');
  const [casePolicy, setCasePolicy] = useState('preserve');
  const [spaceSymbol, setSpaceSymbol] = useState('_');
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [charSearch, setCharSearch] = useState('');
  const [charResult, setCharResult] = useState(null);
  const [charStep, setCharStep] = useState(0);
  const [textSearch, setTextSearch] = useState('');
  const [textResult, setTextResult] = useState(null);

  const normalized = useMemo(() => {
    const text = casePolicy === 'uppercase' ? input.toUpperCase() : casePolicy === 'lowercase' ? input.toLowerCase() : input;
    return text;
  }, [input, casePolicy]);

  const processedText = useMemo(() => normalized.replace(/ /g, spaceSymbol), [normalized, spaceSymbol]);

  // Lista de pasos (frames) para la barra de navegación paso a paso.
  const frames = useMemo(() => {
    if (!result) return [];
    const list = [];
    list.push({ type: 'input', title: 'Paso 1 · Entrada del texto' });
    list.push({ type: 'length', title: 'Paso 2 · Longitud y bits iniciales' });
    list.push({ type: 'frequencies', title: 'Paso 3 · Frecuencias' });
    list.push({ type: 'ordered', title: 'Paso 4 · Frecuencias ordenadas' });
    result.sumSteps.forEach((s, i) => list.push({ type: 'sum', title: `Suma ${i + 1} · ${s.aText} + ${s.bText} = ${s.sumFraction}`, sumIndex: i }));
    list.push({ type: 'equation', title: 'Ecuación final' });
    list.push({ type: 'tree', title: 'Árbol completo' });
    list.push({ type: 'codes', title: 'Tabla de códigos' });
    list.push({ type: 'encoding', title: 'Codificación del texto' });
    list.push({ type: 'result', title: 'Resultado final' });
    return list;
  }, [result]);

  const treeDepth = useMemo(() => {
    if (!result) return 0;
    const frame = frames[frameIndex];
    if (!frame) return 0;
    if (frame.type === 'sum') return frame.sumIndex + 1;
    if (['tree', 'codes', 'encoding', 'result'].includes(frame.type)) return result.sumSteps.length;
    return 0; // sin árbol en pasos previos
  }, [frames, frameIndex, result]);

  const process = () => {
    const text = normalized.replace(/ /g, spaceSymbol);
    if (!text.trim()) { setNotice({ type: 'error', text: 'El texto está vacío: ingresa al menos un carácter.' }); return; }
    const chars = [...text];
    const built = buildHuffman(chars);
    setResult(built);
    setFrameIndex(0);
    setCharResult(null);
    setCharStep(0);
    setTextResult(null);
    setNotice({ type: 'success', text: `Texto procesado (${built.length} caracteres). Revisa el proceso paso a paso.` });
  };

  const resetAll = () => {
    setResult(null);
    setFrameIndex(0);
    setCharResult(null);
    setCharStep(0);
    setTextResult(null);
    setNotice({ type: 'success', text: 'Árbol reiniciado: lista para una nueva construcción.' });
  };

  const runCharSearch = () => {
    if (!result) { setNotice({ type: 'error', text: 'Primero procesa un texto y construye el árbol.' }); return; }
    if (!charSearch) { setNotice({ type: 'error', text: 'Ingresa un carácter a buscar.' }); return; }
    const target = charSearch[0];
    const res = searchCharacter(result.tree, target);
    setCharResult(res);
    setCharStep(0);
    setNotice({ type: res.found ? 'success' : 'error', text: res.found ? `Carácter "${target}" encontrado.` : `El carácter "${target}" no existe en el alfabeto.` });
  };

  const runTextSearch = () => {
    if (!result) { setNotice({ type: 'error', text: 'Primero procesa un texto y construye el árbol.' }); return; }
    if (!textSearch) { setNotice({ type: 'error', text: 'Ingresa un texto para codificar.' }); return; }
    const target = casePolicy === 'uppercase' ? textSearch.toUpperCase() : casePolicy === 'lowercase' ? textSearch.toLowerCase() : textSearch;
    const searchable = target.replace(/ /g, spaceSymbol);
    const res = encodeText(result.tree, searchable);
    setTextResult(res);
    setNotice({ type: res.missing.length === 0 ? 'success' : 'error', text: res.missing.length === 0 ? 'Texto codificado correctamente.' : `Caracteres no encontrados: ${[...new Set(res.missing)].join(', ')}` });
  };

  const currentFrame = frames[frameIndex];
  const activeCharStep = charResult?.steps[charStep];

  const searchActivePath = activeCharStep ? activeCharStep.nodeIds : [];
  const treeDepthToShow = charResult ? result.sumSteps.length : treeDepth;
  const activePath = charResult ? searchActivePath : [];

  const freqTotalCheck = result
    ? `Σ frecuencias = ${result.orderedFrequencies.reduce((a, f) => a + f.count, 0)} (${result.length} caracteres) · Σ probabilidades = ${result.orderedFrequencies.reduce((a, f) => a + f.probability, 0).toFixed(2)} (100%)`
    : '';

  return (
    <>
      <PageHeader title="Árboles de Huffman" description="Construye, codifica y busca con el árbol de Huffman paso a paso." />
      <div className="huffman-layout">
        <div className="lab-layout__controls">
          <section className="panel">
            <h2>Ingreso de texto</h2>
            <label>Palabra o texto
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ej. CIENCIAS o HOLA MUNDO" />
            </label>
            <label style={{ marginTop: 12 }}>Política de mayúsculas/minúsculas
              <select value={casePolicy} onChange={(e) => setCasePolicy(e.target.value)}>
                <option value="preserve">Conservar tal como se escribe</option>
                <option value="uppercase">Convertir todo a MAYÚSCULAS</option>
                <option value="lowercase">Convertir todo a minúsculas</option>
              </select>
            </label>
            {/ /.test(input) && (
              <div className="huffman-space">
                <p>El texto contiene espacios. Selecciona el carácter que representará cada espacio:</p>
                <div className="huffman-space__options">
                  {SPACE_SYMBOLS.map((s) => (
                    <button key={s} type="button" className={`button button--secondary ${spaceSymbol === s ? 'active' : ''}`} onClick={() => setSpaceSymbol(s)}>{s === '\\' ? '\\' : s}</button>
                  ))}
                </div>
                <p className="huffman-space__note">{spaceSymbol === '\\' ? '\\' : spaceSymbol} → ESPACIO</p>
              </div>
            )}
            <div className="step-controls" style={{ justifyContent: 'flex-start' }}>
              <Button onClick={process}>Procesar texto</Button>
            </div>
          </section>

          {result && (
            <section className="panel">
              <h2>Datos del texto</h2>
              <p className="huffman-data-line"><strong>Texto normalizado:</strong> <code>{processedText}</code></p>
              <p className="huffman-data-line"><strong>Longitud:</strong> {result.length} caracteres</p>
              <p className="huffman-data-line"><strong>Bits iniciales:</strong> {result.length} × 8 = <strong>{result.initialBits}</strong> bits</p>
              <p className="validation-message validation-message--success">{freqTotalCheck}</p>
            </section>
          )}

          {result && currentFrame?.type === 'frequencies' && (
            <section className="panel">
              <h2>Frecuencias</h2>
              <div className="huffman-table-wrap">
                <table className="binary-table">
                  <thead><tr><th>Carácter</th><th>Frecuencia</th><th>Probabilidad</th></tr></thead>
                  <tbody>{result.rawFrequencies.map((f) => (
                    <tr key={f.character}><td>{f.character === ' ' ? '_' : f.character}</td><td>{f.count}</td><td>{f.fraction} · {(f.probability * 100).toFixed(1)}%</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          )}

          {result && currentFrame?.type === 'ordered' && (
            <section className="panel">
              <h2>Frecuencias ordenadas</h2>
              <ol className="insertion-order">{result.orderedFrequencies.map((f) => (
                <li key={f.character}>{f.character === ' ' ? '_' : f.character} → <code>{f.fraction}</code> · {(f.probability * 100).toFixed(1)}%</li>
              ))}</ol>
            </section>
          )}

          {result && currentFrame?.type === 'sum' && (
            <section className="panel">
              <h2>Suma {currentFrame.sumIndex + 1}</h2>
              {(() => { const s = result.sumSteps[currentFrame.sumIndex]; return (
                <>
                  <p className="huffman-sum">{s.aText} + {s.bText} = <strong>{s.sumFraction}</strong></p>
                  <p className="huffman-level">Nivel {s.level}: el nuevo nodo tiene frecuencia <strong>{s.sumFraction}</strong>.</p>
                  <p className="huffman-forest"><strong>Lista actual:</strong> {s.forest.map((n) => (n.character ?? 'Σ' ) + `(${n.frequency}/${result.total})`).join(' · ') || '—'}</p>
                </>
              ); })()}
            </section>
          )}

          {result && currentFrame?.type === 'equation' && (
            <section className="panel">
              <h2>Ecuación final</h2>
              <p className="huffman-equation"><code>{result.equation}</code></p>
              <p className="huffman-level">Resultado: <strong>{result.total}/{result.total}</strong> (100% de las apariciones).</p>
            </section>
          )}

          {result && currentFrame?.type === 'codes' && (
            <section className="panel">
              <h2>Tabla de códigos</h2>
              <div className="huffman-table-wrap">
                <table className="binary-table">
                  <thead><tr><th>Carácter</th><th>Frecuencia</th><th>Probabilidad</th><th>Código</th></tr></thead>
                  <tbody>{result.table.map((row) => (
                    <tr key={row.character}><td>{row.character === ' ' ? '_' : row.character}</td><td>{row.fraction}</td><td>{(row.probability * 100).toFixed(1)}%</td><td><code>{row.code}</code></td></tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          )}

          {result && currentFrame?.type === 'encoding' && (
            <section className="panel">
              <h2>Codificación del texto</h2>
              <div className="huffman-encoded">{result.encodedChars.map((e, i) => (
                <span key={i}><b>{e.character === ' ' ? '_' : e.character}</b>→<code>{e.code}</code></span>
              ))}</div>
              <p className="huffman-encoded-full"><code>{result.encoded}</code></p>
            </section>
          )}

          {result && currentFrame?.type === 'result' && (
            <section className="panel">
              <h2>Comparación de bits</h2>
              <p className="huffman-data-line"><strong>Bits originales:</strong> {result.initialBits}</p>
              <p className="huffman-data-line"><strong>Bits Huffman:</strong> {result.finalBits}</p>
              <p className="huffman-data-line"><strong>Ahorro:</strong> {result.savings} bits</p>
              <p className="huffman-data-line"><strong>Reducción:</strong> {result.reduction.toFixed(2)}%</p>
            </section>
          )}

          {result && (
            <section className="panel">
              <h2>Búsquedas</h2>
              <div className="operation">
                <label>Buscar carácter<input maxLength="1" value={charSearch} onChange={(e) => setCharSearch(e.target.value)} placeholder="Ej. C" /></label>
                <Button variant="secondary" onClick={runCharSearch}>Buscar</Button>
              </div>
              <div className="operation">
                <label>Buscar texto<input value={textSearch} onChange={(e) => setTextSearch(e.target.value)} placeholder="Ej. CIENCIAS" /></label>
                <Button variant="secondary" onClick={runTextSearch}>Codificar</Button>
              </div>
              <Button variant="secondary" className="operation-clear" onClick={resetAll}>Reiniciar</Button>
            </section>
          )}

          {notice && <p className={`validation-message validation-message--${notice.type}`} role="status">{notice.text}</p>}
        </div>

        <div className="lab-layout__visual">
          <section className="panel">
            <h2>Árbol de Huffman</h2>
            {result ? (
              <HuffmanTree tree={result.tree} depth={treeDepthToShow} activePath={activePath} />
            ) : <div className="visualization-placeholder"><span>○</span><p>Procesa un texto para construir el árbol.</p></div>}
          </section>

          {result && (
            <section className="panel">
              <h2>{charResult ? 'Recorrido de búsqueda' : 'Paso a paso'}</h2>
              {charResult ? (
                <div className="algorithm-step">
                  <span>Búsqueda de "{charSearch[0] ?? '?'}" · paso {Math.min(charStep + 1, charResult.steps.length)} de {charResult.steps.length}</span>
                  <p>{activeCharStep?.text ?? charResult.text ?? ''}</p>
                  {charResult.code && <p className="huffman-search-code">Código Huffman: <code>{charResult.code}</code> · {charResult.found ? 'Carácter encontrado' : 'No encontrado'}</p>}
                  <div className="step-controls"><Button variant="secondary" disabled={charStep === 0} onClick={() => setCharStep(charStep - 1)}>Anterior</Button><Button variant="secondary" disabled={charStep >= charResult.steps.length - 1} onClick={() => setCharStep(charStep + 1)}>Siguiente</Button></div>
                </div>
              ) : (
                <div className="algorithm-step">
                  <span>{currentFrame?.title ?? 'Listo'}</span>
                  {currentFrame?.type === 'sum' && (() => { const s = result.sumSteps[currentFrame.sumIndex]; return <p>Se suman {s.aText} y {s.bText}. La frecuencia resultante <strong>{s.sumFraction}</strong> sube al nivel {s.level} y se reincorpora a la lista.</p>; })()}
                  {currentFrame?.type === 'input' && <p>Texto normalizado: <code>{processedText}</code>. Se trabaja con el orden original de los caracteres.</p>}
                  {currentFrame?.type === 'length' && <p>Longitud {result.length} · Bits iniciales = {result.length} × 8 = {result.initialBits}.</p>}
                  {currentFrame?.type === 'equation' && <p>La combinación final agrupa todas las frecuencias hasta la raíz: <code>{result.equation}</code>.</p>}
                  {currentFrame?.type === 'tree' && <p>Árbol completo con todas las hojas, frecuencias y las ramas 0/1.</p>}
                  {currentFrame?.type === 'result' && <p>Bits originales {result.initialBits} → Huffman {result.finalBits}. Ahorro de {result.savings} bits ({result.reduction.toFixed(2)}%).</p>}
                  <div className="step-controls">
                    <Button variant="secondary" disabled={frameIndex === 0} onClick={() => setFrameIndex(frameIndex - 1)}>Anterior</Button>
                    <Button disabled={frameIndex >= frames.length - 1} onClick={() => setFrameIndex(frameIndex + 1)}>Siguiente</Button>
                    <Button variant="secondary" disabled={frameIndex >= frames.length - 1} onClick={() => setFrameIndex(frames.length - 1)}>Último paso</Button>
                    <Button variant="secondary" onClick={() => setFrameIndex(0)}>Reiniciar pasos</Button>
                  </div>
                </div>
              )}
            </section>
          )}

          {result && textResult && (
            <section className="panel">
              <h2>Resultado de codificación del texto</h2>
              <div className="huffman-encoded">{textResult.results.map((r, i) => (
                <span key={i}><b>{r.character === ' ' ? '_' : r.character}</b>→<code>{r.code ?? '?'}</code>{!r.found && ' ⚠'}</span>
              ))}</div>
              <p className="huffman-encoded-full"><code>{textResult.full}</code></p>
              <p className="huffman-data-line"><strong>Cantidad de bits:</strong> {textResult.bits}</p>
              {textResult.missing.length > 0 && <p className="validation-message validation-message--error">Caracteres no encontrados en el alfabeto: {[...new Set(textResult.missing)].join(', ')}</p>}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
