import { useMemo, useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { buildSimulation, keyInfo, parseKeys, searchTree } from '../../../utils/residueTrees';

// Configuración del encaje automático del árbol: círculos separados por niveles,
// sin solapamientos y con los padres centrados sobre sus hijos.
const NODE_R = 20;
const X_SPACING = 82;
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

  // Posición horizontal de cada nodo: las hojas usan su columna; los demás quedan
  // centrados sobre el rango horizontal que abarcan sus hijos.
  const computeX = (node) => {
    const entries = childrenEntries(node);
    if (entries.length === 0) {
      pos[node.id] = leafX[node.id] * X_SPACING;
      return pos[node.id];
    }
    const xs = entries.map(([, edge]) => computeX(edge.node));
    pos[node.id] = xs.reduce((a, b) => a + b, 0) / xs.length;
    return pos[node.id];
  };

  walkDepth(tree, 0);
  assignLeaves(tree);
  computeX(tree);

  const width = Math.max(360, (leafCount - 1) * X_SPACING + NODE_R * 2 + PAD * 2);
  const height = (maxDepth + 1) * Y_SPACING + NODE_R * 2 + PAD;

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

  return (
    <div className="tree-canvas tree-canvas--svg">
      <svg width={width} height={height} role="img" aria-label="Árbol de búsqueda">
        <g>
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
        <g>
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
  );
}

const labels = { digital: 'Árbol de búsqueda digital', residue: 'Árbol de búsqueda por residuos', multiple: 'Árbol por residuos múltiples' };

export default function ResiduesPage() {
  const [type, setType] = useState('digital'); const [rawKeys, setRawKeys] = useState('P, R, A, M, Z'); const [m, setM] = useState('2');
  const [simulation, setSimulation] = useState(null); const [step, setStep] = useState(-1); const [notice, setNotice] = useState(null); const [search, setSearch] = useState(''); const [deleteKey, setDeleteKey] = useState(''); const [searchResult, setSearchResult] = useState(null); const [searchStep, setSearchStep] = useState(0);
  const multiple = type === 'multiple'; const parsed = useMemo(() => parseKeys(rawKeys), [rawKeys]); const maxM = 3;
  const generate = () => {
    const numericM = Number(m);
    if (!parsed.length) return setNotice({ type: 'error', text: 'Ingresa al menos una letra entre A y Z.' });
    if (new Set(parsed).size !== parsed.length) return setNotice({ type: 'error', text: 'No se permiten letras repetidas.' });
    if (multiple && (!Number.isInteger(numericM) || numericM < 1 || numericM > maxM)) return setNotice({ type: 'error', text: 'm debe ser un entero entre 1 y 3 para conservar una visualización clara.' });
    setSimulation(buildSimulation(parsed, type, multiple ? numericM : 1)); setStep(-1); setSearchResult(null); setNotice({ type: 'success', text: 'Estructura creada: avanza una inserción a la vez o muestra el resultado final.' });
  };
  const current = step >= 0 ? simulation?.steps[step] : null;
  // Durante una búsqueda se muestra el árbol final completo para resaltar el recorrido.
  const visibleTree = searchResult ? (simulation?.tree ?? null) : (current?.tree ?? (step === -1 ? (type === 'digital' ? null : ((simulation?.steps[0]?.tree)?.kind === 'link' ? { id: 'r', kind: 'link', children: {} } : null)) : simulation?.tree));
  const runSearch = () => {
    const info = keyInfo(search); if (!info) return setNotice({ type: 'error', text: 'La clave a buscar debe ser una letra entre A y Z.' });
    if (!simulation) return setNotice({ type: 'error', text: 'Primero genera el árbol.' });
    const result = searchTree(simulation.tree, info.key, type, Number(m)); setSearchResult(result); setSearchStep(0); setNotice({ type: result.found ? 'success' : 'error', text: result.found ? `${info.key} fue encontrada.` : `${info.key} no existe en el árbol.` });
  };
  const runDelete = () => ({ type: 'error', text: 'La eliminación en los árboles no está implementada aún: revisa el reporte final.' });
  const runClear = () => { setSimulation(null); setStep(-1); setSearchResult(null); setSearch(''); setDeleteKey(''); return { type: 'success', text: 'Estructura vacía: lista para generar nuevamente.' }; };
  const activeSearch = searchResult?.steps[searchStep];
  return <><PageHeader title="Búsqueda por residuos" />
    <div className="residue-layout"><div className="lab-layout__controls"><section className="panel"><h2>Crear estructura</h2><div className="form-grid"><label>Tipo de árbol<select value={type} onChange={(event) => { setType(event.target.value); setSimulation(null); setStep(-1); setSearchResult(null); }}><option value="digital">Búsqueda digital</option><option value="residue">Por residuos</option><option value="multiple">Por residuos múltiples</option></select></label>{multiple && <label>m (bits por nivel)<input type="number" min="1" max="3" value={m} onChange={(event) => setM(event.target.value.replace(/\D/g, ''))} /></label>}</div><label>Claves a insertar (A–Z)<input value={rawKeys} onChange={(event) => setRawKeys(event.target.value)} placeholder="P, R, A, M, Z" /></label>{notice && <p className={`validation-message validation-message--${notice.type}`} role="status">{notice.text}</p>}<Button onClick={generate}>Crear estructura</Button></section>
      <section className="panel">
        <h2>Operaciones</h2>
        <div className="operation">
          <label>Eliminar<input maxLength="1" value={deleteKey} onChange={(event) => setDeleteKey(event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="Clave" /></label>
          <Button variant="secondary" onClick={() => { const response = runDelete(); setNotice(response); }}>Eliminar</Button>
        </div>
        <Button variant="secondary" className="operation-clear" onClick={() => { const response = runClear(); setNotice(response); }}>Limpiar</Button>
      </section>
      <section className="panel"><h2>Orden de inserción</h2><ol className="insertion-order">{simulation?.accepted.map((item, index) => <li key={item.key} className={index === step ? 'active' : ''}>{item.key} → {item.value} → <code>{item.binary}</code></li>) ?? <li>Genera la estructura para ver las claves.</li>}</ol></section>
      <section className="panel search-input"><h2>Buscar clave</h2><label>Clave a buscar<input maxLength="1" value={search} onChange={(event) => setSearch(event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="Ej. R" /></label><Button onClick={runSearch}>Buscar</Button>{searchResult && <div className="algorithm-step"><span>Búsqueda · paso {Math.min(searchStep + 1, searchResult.steps.length)} de {searchResult.steps.length}</span><p>{activeSearch?.text ?? 'No hay recorrido posible.'}</p><div className="step-controls"><Button variant="secondary" disabled={searchStep === 0} onClick={() => setSearchStep(searchStep - 1)}>Anterior</Button><Button variant="secondary" disabled={searchStep >= searchResult.steps.length - 1} onClick={() => setSearchStep(searchStep + 1)}>Siguiente</Button></div></div>}</section></div>
      <div className="lab-layout__visual"><section className="panel"><h2>{labels[type]}</h2><TreeCanvas tree={visibleTree} active={activeSearch?.path ?? current?.path ?? []} /></section>
      <section className="panel"><h2>Construcción paso a paso</h2>{current ? <div className="algorithm-step"><span>Inserción {step + 1} de {simulation.steps.length}</span><small>Clave actual: {current.info.key} · Posición: {current.info.value} · Binario: {current.info.binary}</small>{current.details.map((detail, index) => <p key={index}>{detail}</p>)}</div> : <div className="visualization-placeholder"><span>↓</span><p>Selecciona “Siguiente paso” para insertar la primera clave.</p></div>}<div className="step-controls"><Button variant="secondary" disabled={!simulation || step < 0} onClick={() => { setSearchResult(null); setStep(step - 1); }}>Anterior</Button><Button disabled={!simulation || step >= simulation.steps.length - 1} onClick={() => { setSearchResult(null); setStep(step + 1); }}>Siguiente paso</Button><Button variant="secondary" disabled={!simulation} onClick={() => { setSearchResult(null); setStep(simulation.steps.length - 1); }}>Ver resultado final</Button><Button variant="secondary" disabled={!simulation} onClick={() => { setStep(-1); setSearchResult(null); }}>Reiniciar</Button></div></section></div></div></>;
}
