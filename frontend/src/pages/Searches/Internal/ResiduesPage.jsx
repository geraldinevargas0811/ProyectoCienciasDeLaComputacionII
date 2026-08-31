import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { buildSimulation, keyInfo, parseKeys, searchTree } from '../../../utils/residueTrees';

// Configuración del encaje automático del árbol: círculos separados por niveles,
// sin solapamientos y con los padres centrados sobre sus hijos.
const NODE_R = 20;
const Y_SPACING = 96;
const PAD = 30;

function layoutTree(tree) {
  const pos = {};      // id -> x (coordenada horizontal)
  const yDepths = {};  // id -> profundidad (0 = raíz)
  const nodes = {};    // id -> nodo
  let leafCount = 0;
  let maxDepth = 0;

  // Hijos ordenados por etiqueta: garantiza que la rama 0 (izquierda) precede a la
  // rama 1 (derecha) y, para residuos múltiples, 00 < 01 < 10 < 11.
  const childrenEntries = (node) => Object.entries(node.children ?? {}).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

  const walkDepth = (node, depth) => {
    nodes[node.id] = node;
    yDepths[node.id] = depth;
    if (depth > maxDepth) maxDepth = depth;
    childrenEntries(node).forEach(([, edge]) => walkDepth(edge.node, depth + 1));
  };

  // Orden in-orden para repartir las hojas: cada hoja recibe una columna única.
  const leafX = {};
  const assignLeaves = (node) => {
    const entries = childrenEntries(node);
    if (entries.length === 0) { leafX[node.id] = leafCount; leafCount += 1; return; }
    entries.forEach(([, edge]) => assignLeaves(edge.node));
  };

  // Espaciado horizontal adaptativo: cuantas más hojas, más compacto queda el dibujo.
  const spacing = leafCount > 24 ? 34 : leafCount > 12 ? 52 : leafCount > 6 ? 72 : 86;

  // Posición horizontal de cada nodo: las hojas usan su columna; los nodos con dos hijos
  // quedan centrados sobre el rango que abarcan sus hijos. Cuando un nodo tiene UN solo hijo
  // ya no se centra sobre él (eso produciría una arista vertical), sino que se desplaza hacia
  // el lado que corresponde al bit: bit 0 (hijo izquierdo) → el padre queda a la derecha del
  // hijo; bit 1 (hijo derecho) → el padre queda a la izquierda del hijo.
  const computeX = (node) => {
    const entries = childrenEntries(node);
    if (entries.length === 0) {
      pos[node.id] = leafX[node.id] * spacing;
      return pos[node.id];
    }
    if (entries.length === 1) {
      const [label, edge] = entries[0];
      const childX = computeX(edge.node);
      const dir = String(label).endsWith('1') ? 1 : -1;
      pos[node.id] = childX - dir * (spacing / 2);
      return pos[node.id];
    }
    const xs = entries.map(([, edge]) => computeX(edge.node));
    pos[node.id] = xs.reduce((a, b) => a + b, 0) / xs.length;
    return pos[node.id];
  };

  walkDepth(tree, 0);
  assignLeaves(tree);
  computeX(tree);

  const width = Math.max(360, (leafCount - 1) * spacing + NODE_R * 2 + PAD * 2);
  const height = (maxDepth + 1) * Y_SPACING + NODE_R * 2 + PAD;

  // Centrado horizontal: se desplaza todo el dibujo para que la raíz (y el conjunto de
  // hojas) quede centrado en el ancho del lienzo, incluso cuando el árbol es pequeño.
  const contentMid = ((leafCount - 1) * spacing) / 2 + NODE_R + PAD;
  const offset = width / 2 - contentMid;
  Object.keys(pos).forEach((id) => { pos[id] += offset; });

  const edges = [];
  const collectEdges = (node) => {
    childrenEntries(node).forEach(([label, edge]) => {
      edges.push({ from: node.id, to: edge.node.id, label });
      collectEdges(edge.node);
    });
  };
  collectEdges(tree);

  const cx = (id) => pos[id] + NODE_R + PAD;
  const cy = (id) => yDepths[id] * Y_SPACING + NODE_R + 18;

  return { nodes, edges, width, height, cx, cy, NODE_R };
}

function TreeCanvas({ tree, active = [] }) {
  const [zoom, setZoom] = useState(1);
  if (!tree) return <div className="visualization-placeholder"><span>○</span></div>;
  const { nodes, edges, width, height, cx, cy, NODE_R } = layoutTree(tree);
  const activeSet = new Set(active);
  const edgeActive = (edge) => activeSet.has(edge.from) && activeSet.has(edge.to);
  // El árbol digital etiqueta sus aristas como "b4=1"; lo que debe mostrarse sobre la
  // arista es únicamente el bit (0 o 1). Para residuos y residuos múltiples el label ya
  // es el bit o el grupo de bits (00, 01, ...) y se conserva tal cual.
  const displayLabel = (label) => {
    const match = /^b\d+=([01])$/.exec(label);
    return match ? match[1] : label;
  };
  const z = Math.round(zoom * 10) / 10;

  return (
    <div className="tree-viewer">
      <div className="tree-viewer__toolbar">
        <button type="button" title="Acercar" onClick={() => setZoom((v) => Math.min(2, Math.round((v + 0.1) * 10) / 10))} disabled={z >= 2}>+</button>
        <button type="button" title="Alejar" onClick={() => setZoom((v) => Math.max(0.4, Math.round((v - 0.1) * 10) / 10))} disabled={z <= 0.4}>−</button>
        <button type="button" title="Restablecer zoom" onClick={() => setZoom(1)}>⇱</button>
        <span className="tree-viewer__zoom">{Math.round(z * 100)}%</span>
      </div>
      <div className="tree-canvas tree-canvas--svg">
        <div className="tree-canvas__zoom" style={{ width: width * z, height: height * z }}>
          <svg width={width * z} height={height * z} role="img" aria-label="Árbol de búsqueda">
            <g transform={`scale(${z})`}>
              {edges.map((edge) => {
                const x1 = cx(edge.from); const y1 = cy(edge.from);
                const x2 = cx(edge.to); const y2 = cy(edge.to);
                const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
                const activeEdge = edgeActive(edge);
                return <g key={`${edge.from}-${edge.to}`}>
                  <line className={`tree-edge${activeEdge ? ' tree-edge--active' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
                  <text className="tree-edge-label" x={mx + (x1 === x2 ? 12 : -10)} y={my - 10} textAnchor="middle">{displayLabel(edge.label)}</text>
                </g>;
              })}
            </g>
            <g transform={`scale(${z})`}>
              {Object.values(nodes).map((node) => {
                const isKey = node.kind !== 'link';
                const isActive = activeSet.has(node.id);
                return <g key={node.id}>
                  <circle className={`tree-node-circle tree-node-circle--${isKey ? 'key' : 'link'}${isActive ? ' tree-node-circle--active' : ''}`} cx={cx(node.id)} cy={cy(node.id)} r={NODE_R} />
                  {isKey && <text className="tree-node-key" x={cx(node.id)} y={cy(node.id)} textAnchor="middle" dominantBaseline="central">{node.key}</text>}
                </g>;
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

const typeLabels = {
  digital: 'Árbol de búsqueda digital',
  residue: 'Árbol de búsqueda por residuos',
  multiple: 'Árbol de búsqueda por residuos múltiples',
};

// Convierte la secuencia de inserciones en una lista de fotogramas de animación.
// Por cada clave se generan tantos fotogramas como nodos tenga su recorrido, de modo
// que el nodo activo baja por el árbol antes de concluir la inserción de la clave.
function buildFrames(simulation) {
  const frames = [];
  (simulation?.steps ?? []).forEach((s, stepIndex) => {
    const path = s.path ?? [];
    const nodes = path.length ? path : [null];
    nodes.forEach((nodeId, j) => {
      frames.push({
        tree: s.tree,
        active: path.slice(0, j + 1),
        info: s.info,
        stepIndex,
        key: s.info?.key,
        duplicate: s.duplicate,
        detail: s.details[Math.min(j, s.details.length - 1)] ?? 'La clave se inserta.',
      });
    });
  });
  return frames;
}

export default function ResiduesPage() {
  const [type, setType] = useState('digital');
  const [m, setM] = useState('2');
  const [created, setCreated] = useState(false);
  const [keys, setKeys] = useState([]);            // claves a insertar (orden de ingreso)
  const [inputMode, setInputMode] = useState('manual');
  const [input, setInput] = useState('');
  const [autoCount, setAutoCount] = useState('5');
  const [simulation, setSimulation] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteKey, setDeleteKey] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchStep, setSearchStep] = useState(0);
  const timers = useRef([]);

  const multiple = type === 'multiple';
  const maxM = 8; // M = 2^m; se limita para conservar una visualización legible.
  const frames = useMemo(() => buildFrames(simulation), [simulation]);

  const clearTimers = () => { timers.current.forEach((t) => clearTimeout(t)); timers.current = []; setPlaying(false); };
  useEffect(() => () => { timers.current.forEach((t) => clearTimeout(t)); }, []);

  const playFrames = (from, total) => {
    clearTimers();
    setPlaying(true);
    for (let i = from; i < total; i += 1) {
      timers.current.push(setTimeout(() => {
        setFrameIndex(i);
        if (i === total - 1) { setPlaying(false); }
      }, 650 * (i - from + 1)));
    }
  };

  const manualFrame = (index) => { clearTimers(); setFrameIndex(index); };

  const create = () => {
    if (multiple) {
      const nm = Number(m);
      if (!Number.isInteger(nm) || nm < 1 || nm > maxM) { setNotice({ type: 'error', text: 'm debe ser un entero entre 1 y 8.' }); return; }
    }
    setCreated(true);
    setKeys([]);
    setSimulation(null);
    setSearchResult(null);
    setNotice({ type: 'success', text: 'Estructura lista: ingresa las claves a insertar.' });
  };

  const addManual = () => {
    const letters = parseKeys(input);
    if (!letters.length) return setNotice({ type: 'error', text: 'Ingresa una o más letras entre A y Z.' });
    const next = [...keys];
    letters.forEach((l) => { if (!next.includes(l)) next.push(l); });
    setKeys(next);
    setInput('');
    setNotice({ type: 'success', text: `Claves añadidas: ${letters.join(', ')}.` });
  };

  const generateAuto = () => {
    const count = Math.min(Math.max(Number(autoCount) || 5, 1), 26);
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (let i = pool.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    setKeys(pool.slice(0, count));
    setNotice({ type: 'success', text: `${count} claves únicas generadas en orden aleatorio.` });
  };

  const build = () => {
    if (!keys.length) return setNotice({ type: 'error', text: 'Primero ingresa las claves a insertar.' });
    if (new Set(keys).size !== keys.length) return setNotice({ type: 'error', text: 'No se permiten letras repetidas.' });
    const numericM = multiple ? Number(m) : 1;
    const sim = buildSimulation(keys, type, numericM);
    const totalFrames = buildFrames(sim).length;
    setSimulation(sim);
    setSearchResult(null);
    setFrameIndex(0);
    setNotice({ type: 'success', text: 'Estructura construida: se muestra la construcción paso a paso.' });
    // Reprogramar el avance tras montar los fotogramas.
    requestAnimationFrame(() => playFrames(0, totalFrames));
  };

  const currentFrame = frames[frameIndex];
  const runSearch = () => {
    const info = keyInfo(search); if (!info) return setNotice({ type: 'error', text: 'La clave a buscar debe ser una letra entre A y Z.' });
    if (!simulation) return setNotice({ type: 'error', text: 'Primero construye el árbol.' });
    const result = searchTree(simulation.tree, info.key, type, multiple ? Number(m) : 1);
    setSearchResult(result); setSearchStep(0);
    setNotice({ type: result.found ? 'success' : 'error', text: result.found ? `${info.key} fue encontrada.` : `${info.key} no existe en el árbol.` });
  };
  const runDelete = () => ({ type: 'error', text: 'La eliminación en los árboles no está implementada aún: revisa el reporte final.' });
  const runClear = () => { clearTimers(); setCreated(false); setKeys([]); setSimulation(null); setFrameIndex(0); setSearchResult(null); setSearch(''); setDeleteKey(''); setNotice({ type: 'success', text: 'Estructura vacía: lista para comenzar nuevamente.' }); };
  const activeSearch = searchResult?.steps[searchStep];

  const treeActive = (searchResult && activeSearch) ? activeSearch.path : (currentFrame?.active ?? []);
  const showTree = searchResult ? (simulation?.tree ?? null) : (currentFrame?.tree ?? simulation?.tree ?? null);

  const currentKeyIndex = currentFrame?.stepIndex ?? -1;
  const searchEnabled = Boolean(simulation);

  return (
    <>
      <PageHeader title="Búsqueda por residuos" />
      <div className="residue-layout">
        <div className="lab-layout__controls">
          <section className="panel">
            <h2>Crear estructura</h2>
            <div className="form-grid">
              <label>Tipo de árbol<select value={type} onChange={(event) => { setType(event.target.value); setSimulation(null); setFrameIndex(0); setSearchResult(null); }}><option value="digital">Árboles de búsqueda digital</option><option value="residue">Árboles de búsqueda por residuos</option><option value="multiple">Árboles de búsqueda por residuos múltiples</option></select></label>
              {multiple && <label>m (bits por nivel)<input type="number" min="1" max={maxM} value={m} onChange={(event) => setM(event.target.value.replace(/\D/g, ''))} /></label>}
            </div>
            {multiple && <p className="notice">M = 2<sup>m</sup> ramas: con m = {m || '?'} → {Number(m) >= 1 ? 2 ** Number(m) : '—'} enlaces posibles.</p>}
            {notice && <p className={`validation-message validation-message--${notice.type}`} role="status">{notice.text}</p>}
            <Button onClick={create}>Crear estructura</Button>
          </section>

          {created && (
            <section className="panel">
              <h2>Ingreso de datos</h2>
              <div className="segmented">
                <button type="button" className={`segmented__btn ${inputMode === 'manual' ? 'active' : ''}`} onClick={() => setInputMode('manual')}>Manual</button>
                <button type="button" className={`segmented__btn ${inputMode === 'automatic' ? 'active' : ''}`} onClick={() => setInputMode('automatic')}>Automático</button>
              </div>
              {inputMode === 'manual' ? (
                <div className="manual-entry">
                  <label>Claves (A–Z)<input value={input} onChange={(e) => setInput(e.target.value.toUpperCase().replace(/[^A-Z, ]/g, ''))} placeholder="P, R, A" /></label>
                  <Button variant="secondary" onClick={addManual}>Añadir</Button>
                </div>
              ) : (
                <div className="automatic-entry">
                  <label>Cantidad<input type="number" min="1" max="26" value={autoCount} onChange={(e) => setAutoCount(e.target.value.replace(/\D/g, ''))} /></label>
                  <Button variant="secondary" onClick={generateAuto} style={{ marginTop: 7 }}>Generar automáticamente</Button>
                </div>
              )}
            </section>
          )}

          {created && keys.length > 0 && (
            <section className="panel keys-panel">
              <h2>Claves a insertar</h2>
              <ol className="insertion-order">
                {keys.map((k, i) => <li key={k} className={i <= currentKeyIndex && currentKeyIndex >= 0 ? 'active' : ''}>{k}</li>)}
              </ol>
              <div className="step-controls"><button type="button" className="button button--primary" onClick={build} disabled={playing}>{playing ? 'Construyendo…' : 'Construir árbol'}</button></div>
            </section>
          )}

          {created && (
            <section className="panel">
              <h2>Tabla binaria</h2>
              <table className="binary-table">
                <thead><tr><th>K</th><th>ABC</th><th>Binario</th></tr></thead>
                <tbody>
                  {simulation ? simulation.accepted.map((item, index) => (
                    <tr key={item.key} className={index === currentKeyIndex ? 'active' : ''}><td>{item.key}</td><td>{item.value}</td><td><code>{item.binary}</code></td></tr>
                  )) : <tr className="empty"><td colSpan="3">Las claves se muestran al construirlas.</td></tr>}
                </tbody>
              </table>
            </section>
          )}

          {created && (
            <section className="panel">
              <h2>Operaciones</h2>
              <div className="operation">
                <label>Buscar<input maxLength="1" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="Ej. R" /></label>
                <Button variant="secondary" disabled={!searchEnabled} onClick={runSearch}>Buscar</Button>
              </div>
              <div className="operation">
                <label>Eliminar<input maxLength="1" value={deleteKey} onChange={(e) => setDeleteKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="Clave" /></label>
                <Button variant="secondary" disabled={!searchEnabled} onClick={() => { const r = runDelete(); setNotice(r); }}>Eliminar</Button>
              </div>
              <Button variant="secondary" className="operation-clear" onClick={() => { const r = runClear(); setNotice(r); }}>Limpiar</Button>
            </section>
          )}
        </div>

        <div className="lab-layout__visual">
          <section className="panel">
            <h2>{simulation ? typeLabels[type] : 'Estructura'}</h2>
            <TreeCanvas tree={showTree} active={treeActive} />
          </section>
          {simulation && (
            <section className="panel">
              <h2>Paso a paso</h2>
              {(searchResult && activeSearch) ? (
                <div className="algorithm-step">
                  <span>Búsqueda · paso {Math.min(searchStep + 1, searchResult.steps.length)} de {searchResult.steps.length}</span>
                  <p>{activeSearch.text ?? 'No hay recorrido posible.'}</p>
                  <div className="step-controls"><Button variant="secondary" disabled={searchStep === 0} onClick={() => setSearchStep(searchStep - 1)}>Anterior</Button><Button variant="secondary" disabled={searchStep >= searchResult.steps.length - 1} onClick={() => setSearchStep(searchStep + 1)}>Siguiente</Button></div>
                </div>
              ) : currentFrame ? (
                <div className="algorithm-step">
                  <span>Inserción {currentFrame.stepIndex + 1} de {simulation.steps.length}{playing ? ' · reproduciendo…' : ''}</span>
                  <small>Clave: {currentFrame.key} · Posición: {currentFrame.info?.value} · Binario: <code>{currentFrame.info?.binary}</code></small>
                  <p>{currentFrame.detail}</p>
                  <div className="step-controls">
                    <Button variant="secondary" disabled={frameIndex === 0} onClick={() => manualFrame(frameIndex - 1)}>Anterior</Button>
                    <Button disabled={frameIndex >= frames.length - 1} onClick={() => manualFrame(frameIndex + 1)}>Siguiente</Button>
                    <Button variant="secondary" disabled={frameIndex >= frames.length - 1} onClick={() => manualFrame(frames.length - 1)}>Último paso</Button>
                    <Button variant="secondary" onClick={() => manualFrame(0)}>Reiniciar</Button>
                  </div>
                </div>
              ) : <div className="visualization-placeholder"><span>↓</span><p>Construye el árbol para comenzar.</p></div>}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
