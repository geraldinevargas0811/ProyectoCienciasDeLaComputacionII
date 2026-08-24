import { useMemo, useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import { buildSimulation, keyInfo, parseKeys, searchTree } from '../../../utils/residueTrees';

function TreeNode({ node, active = [] }) {
  const entries = Object.entries(node.children ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return <li className="tree-node"><div className={`tree-node__box tree-node__box--${node.kind} ${active.includes(node.id) ? 'tree-node__box--active' : ''}`}>{node.kind === 'link' ? <><strong>Enlace</strong><small>vacío</small></> : <><strong>{node.key}</strong><small>{node.value} · {node.binary}</small></>}</div>{entries.length > 0 && <ul className={`tree-node__children tree-node__children--${Math.min(entries.length, 4)}`}>{entries.map(([label, item]) => <div className="tree-node__branch" key={`${node.id}-${label}`}><span>{item.label}</span><TreeNode node={item.node} active={active} /></div>)}</ul>}</li>;
}

function TreeView({ tree, active }) { return tree ? <div className="tree-canvas"><ul className="tree-root"><TreeNode node={tree} active={active} /></ul></div> : <div className="visualization-placeholder"><span>○</span><p>Configura las claves para construir el árbol.</p></div>; }

const labels = { digital: 'Árbol de búsqueda digital', residue: 'Árbol de búsqueda por residuos', multiple: 'Árbol por residuos múltiples' };

export default function ResiduesPage() {
  const [type, setType] = useState('digital'); const [rawKeys, setRawKeys] = useState('P, R, A, M, Z'); const [m, setM] = useState('2');
  const [simulation, setSimulation] = useState(null); const [step, setStep] = useState(-1); const [notice, setNotice] = useState(null); const [search, setSearch] = useState(''); const [searchResult, setSearchResult] = useState(null); const [searchStep, setSearchStep] = useState(0);
  const multiple = type === 'multiple'; const parsed = useMemo(() => parseKeys(rawKeys), [rawKeys]); const maxM = 3;
  const generate = () => {
    const numericM = Number(m);
    if (!parsed.length) return setNotice({ type: 'error', text: 'Ingresa al menos una letra entre A y Z.' });
    if (new Set(parsed).size !== parsed.length) return setNotice({ type: 'error', text: 'No se permiten letras repetidas.' });
    if (multiple && (!Number.isInteger(numericM) || numericM < 1 || numericM > maxM)) return setNotice({ type: 'error', text: 'm debe ser un entero entre 1 y 3 para conservar una visualización clara.' });
    setSimulation(buildSimulation(parsed, type, multiple ? numericM : 1)); setStep(-1); setSearchResult(null); setNotice({ type: 'success', text: 'Estructura preparada. Avanza una inserción a la vez o muestra el resultado final.' });
  };
  const current = step >= 0 ? simulation?.steps[step] : null;
  const visibleTree = current?.tree ?? (step === -1 ? (type === 'digital' ? null : simulation?.steps[0]?.tree?.kind === 'link' ? { id: 'r', kind: 'link', children: {} } : null) : simulation?.tree);
  const runSearch = () => {
    const info = keyInfo(search); if (!info) return setNotice({ type: 'error', text: 'La clave a buscar debe ser una letra entre A y Z.' });
    if (!simulation) return setNotice({ type: 'error', text: 'Primero genera el árbol.' });
    const result = searchTree(simulation.tree, info.key, type, Number(m)); setSearchResult(result); setSearchStep(0); setNotice({ type: result.found ? 'success' : 'error', text: result.found ? `${info.key} fue encontrada.` : `${info.key} no existe en el árbol.` });
  };
  const activeSearch = searchResult?.steps[searchStep];
  return <><PageHeader eyebrow="Búsquedas / Memoria interna" title="Búsqueda por residuos" description="Construye árboles digitales y por residuos a partir de posiciones alfabéticas; cada clave usa siempre 5 bits." />
    <div className="residue-layout"><div className="lab-layout__controls"><section className="panel"><h2>Configurar árbol</h2><div className="form-grid"><label>Tipo de árbol<select value={type} onChange={(event) => { setType(event.target.value); setSimulation(null); setStep(-1); setSearchResult(null); }}><option value="digital">Búsqueda digital</option><option value="residue">Por residuos</option><option value="multiple">Por residuos múltiples</option></select></label>{multiple && <label>m (bits por nivel)<input type="number" min="1" max="3" value={m} onChange={(event) => setM(event.target.value.replace(/\D/g, ''))} /></label>}</div><label>Claves a insertar (A–Z)<input value={rawKeys} onChange={(event) => setRawKeys(event.target.value)} placeholder="P, R, A, M, Z" /></label><p className="notice">Se conserva el orden ingresado. A=1 hasta Z=26; el binario se rellena a 5 dígitos.{multiple && ` M = 2^m = ${2 ** (Number(m) || 0)} ramas posibles.`}</p>{notice && <p className={`validation-message validation-message--${notice.type}`} role="status">{notice.text}</p>}<Button onClick={generate}>Generar estructura</Button></section>
      <section className="panel"><h2>Orden de inserción</h2><ol className="insertion-order">{simulation?.accepted.map((item, index) => <li key={item.key} className={index === step ? 'active' : ''}>{item.key} → {item.value} → <code>{item.binary}</code></li>) ?? <li>Genera el árbol para ver las claves.</li>}</ol></section>
      <section className="panel search-input"><h2>Buscar clave</h2><label>Clave a buscar<input maxLength="1" value={search} onChange={(event) => setSearch(event.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} placeholder="Ej. R" /></label><Button onClick={runSearch}>Buscar</Button>{searchResult && <div className="algorithm-step"><span>Búsqueda · paso {Math.min(searchStep + 1, searchResult.steps.length)} de {searchResult.steps.length}</span><p>{activeSearch?.text ?? 'No hay recorrido posible.'}</p><div className="step-controls"><Button variant="secondary" disabled={searchStep === 0} onClick={() => setSearchStep(searchStep - 1)}>Anterior</Button><Button variant="secondary" disabled={searchStep >= searchResult.steps.length - 1} onClick={() => setSearchStep(searchStep + 1)}>Siguiente</Button></div></div>}</section></div>
      <div className="lab-layout__visual"><section className="panel"><h2>{labels[type]}</h2><p className="panel__intro">{type === 'digital' ? 'Cada nodo contiene una clave; no se crean nodos de enlace.' : multiple ? `Cada enlace usa grupos consecutivos de ${m} bits. El último grupo puede tener menos bits, sin rellenarlo.` : 'La raíz y los nodos intermedios son enlaces vacíos. 0 es izquierda y 1 es derecha.'}</p><TreeView tree={visibleTree} active={activeSearch?.path ?? current?.path ?? []} /></section>
      <section className="panel"><h2>Construcción paso a paso</h2>{current ? <div className="algorithm-step"><span>Inserción {step + 1} de {simulation.steps.length}</span><small>Clave actual: {current.info.key} · Posición: {current.info.value} · Binario: {current.info.binary}</small>{current.details.map((detail, index) => <p key={index}>{detail}</p>)}</div> : <div className="visualization-placeholder"><span>↓</span><p>Selecciona “Siguiente paso” para insertar la primera clave.</p></div>}<div className="step-controls"><Button variant="secondary" disabled={!simulation || step < 0} onClick={() => setStep(step - 1)}>Anterior</Button><Button disabled={!simulation || step >= simulation.steps.length - 1} onClick={() => setStep(step + 1)}>Siguiente paso</Button><Button variant="secondary" disabled={!simulation} onClick={() => setStep(simulation.steps.length - 1)}>Ver resultado final</Button><Button variant="secondary" disabled={!simulation} onClick={() => { setStep(-1); setSearchResult(null); }}>Reiniciar</Button></div></section></div></div></>;
}
