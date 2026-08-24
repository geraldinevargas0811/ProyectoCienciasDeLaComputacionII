import { useState } from 'react';
import { Button } from '../common/UI';

const digitsOnly = (value) => value.replace(/\D/g, '');
function NumericField({ value, onChange, min = '0', ...props }) {
  return <input type="number" min={min} step="1" inputMode="numeric" value={value} onChange={(event) => onChange(digitsOnly(event.target.value))} {...props} />;
}

export function ConfigurationPanel({ binary = false, hash = false, onStructureCreated }) {
  const [size, setSize] = useState('10');
  const [keySize, setKeySize] = useState('2');
  const [entryMode, setEntryMode] = useState('automatic');
  const [keys, setKeys] = useState(Array(10).fill(''));
  const [hashFunction, setHashFunction] = useState('modulo');
  const [collisionMethod, setCollisionMethod] = useState('linear');
  const [message, setMessage] = useState(null);
  const structureName = hash ? 'tabla' : 'estructura';
  const updateSize = (value) => {
    setSize(value);
    const count = Number(value);
    if (Number.isInteger(count) && count > 0) setKeys((current) => Array.from({ length: count }, (_, index) => current[index] ?? ''));
  };
  const generateKeys = () => {
    const count = Number(size); const digits = Number(keySize);
    const minimum = digits === 1 ? 0 : 10 ** (digits - 1);
    const available = (10 ** digits) - minimum;
    if (count > available) return { error: `No es posible generar ${count} claves únicas de ${digits} dígito${digits === 1 ? '' : 's'}. Selecciona un tamaño de clave mayor.` };
    const generated = new Set();
    while (generated.size < count) generated.add(String(Math.floor(Math.random() * available) + minimum));
    const values = [...generated];
    return { values: binary ? values.sort((left, right) => Number(left) - Number(right)) : values };
  };
  const validate = () => {
    const count = Number(size); const digits = Number(keySize);
    if (!Number.isInteger(count) || count <= 0) return `Indica un tamaño válido para la ${structureName}.`;
    if (entryMode === 'manual') {
      const pattern = new RegExp(`^\\d{${digits}}$`);
      if (keys.length !== count || keys.some((key) => !pattern.test(key))) return `Cada clave debe ser numérica y tener exactamente ${digits} dígito${digits === 1 ? '' : 's'}.`;
      if (new Set(keys).size !== keys.length) return 'No se permiten claves repetidas. Ajusta los valores ingresados.';
    }
    return null;
  };
  const createStructure = async () => {
    const error = validate();
    if (error) { setMessage({ type: 'error', text: error }); return; }
    const generated = entryMode === 'automatic' ? generateKeys() : null;
    if (generated?.error) { setMessage({ type: 'error', text: generated.error }); return; }
    const values = entryMode === 'manual' ? [...keys] : generated.values;
    const response = await onStructureCreated?.(values, { keySize: String(keySize), size: Number(size), hashFunction, collisionMethod });
    setMessage(response ?? { type: 'success', text: entryMode === 'manual' ? `La ${structureName} es válida y está lista para visualizarse.` : `La ${structureName} está configurada y lista para visualizarse.` });
  };
  return <section className="panel"><h2>Configurar {structureName}</h2><div className="form-grid"><label>{hash ? 'Tamaño / rango de la tabla' : 'Tamaño / rango de la estructura'}<NumericField min="1" value={size} onChange={updateSize} /></label><label>Tamaño de las claves<select value={keySize} onChange={(event) => setKeySize(event.target.value)}><option value="1">1 dígito</option><option value="2">2 dígitos</option><option value="3">3 dígitos</option></select></label><label>Ingreso de datos<select value={entryMode} onChange={(event) => { setEntryMode(event.target.value); setMessage(null); }}><option value="automatic">Generación automática</option><option value="manual">Inserción manual</option></select></label>{hash && <><label>Función hash (posición inicial)<select value={hashFunction} onChange={(event) => setHashFunction(event.target.value)}><option value="modulo">Módulo</option><option value="square">Cuadrado</option><option value="truncation">Truncamiento</option><option value="folding">Plegamiento</option></select></label><label>Solución de colisiones<select value={collisionMethod} onChange={(event) => setCollisionMethod(event.target.value)}><option value="linear">Prueba lineal</option><option value="quadratic">Prueba cuadrática</option><option value="double">Doble función hash</option><option value="nested">Arreglos anidados</option><option value="linked">Listas enlazadas</option></select></label></>}</div>{entryMode === 'manual' && <div className="manual-inputs"><p>Ingresa {size || 'las'} clave{Number(size) === 1 ? '' : 's'} numérica{Number(size) === 1 ? '' : 's'} sin repetir.</p>{keys.map((key, index) => <label key={index}>Clave {index + 1}<NumericField value={key} onChange={(value) => setKeys((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))} aria-label={`Clave ${index + 1}`} /></label>)}</div>}{entryMode === 'automatic' && <p className="notice">Se generarán claves numéricas únicas con el tamaño seleccionado.</p>}{hash && hashFunction !== 'modulo' && <p className="notice">Método pendiente de parametrización según la metodología del curso.</p>}{binary && <p className="notice">Esta búsqueda requiere una estructura ordenada.</p>}{message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}<Button onClick={createStructure}>Crear {structureName}</Button></section>;
}

export function SearchInput({ keySize = '2', onSearch }) {
  const [searchKey, setSearchKey] = useState(''); const [message, setMessage] = useState(null);
  const runSearch = async () => {
    if (!new RegExp(`^\\d{${keySize}}$`).test(searchKey)) { setMessage({ type: 'error', text: `La clave debe ser numérica y tener exactamente ${keySize} dígito${keySize === '1' ? '' : 's'}.` }); return; }
    setMessage(await onSearch?.(searchKey) ?? null);
  };
  return <section className="panel search-input"><h2>Realizar búsqueda</h2><label>Clave a buscar<input type="number" min="0" step="1" inputMode="numeric" value={searchKey} onChange={(event) => setSearchKey(digitsOnly(event.target.value))} placeholder="Ej. 47" /></label>{message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}<Button onClick={runSearch}>Buscar</Button></section>;
}

export function VisualizationPanel({ hash = false, binary = false, result, stepIndex = 0, onStepChange, configuration }) {
  if (hash && result) { const step = result.steps[stepIndex]; const attempts = step.attempts ?? []; const method = { linear: 'Prueba lineal', quadratic: 'Prueba cuadrática', double: 'Doble función hash', nested: 'Arreglos anidados', linked: 'Listas enlazadas' }[configuration?.collisionMethod]; const hashName = { modulo: 'Módulo', square: 'Cuadrado', truncation: 'Truncamiento', folding: 'Plegamiento' }[configuration?.hashFunction]; return <section className="panel"><h2>Colisiones y resolución</h2><div className="algorithm-step" aria-live="polite"><span>Paso {stepIndex + 1} de {result.steps.length}{step.key ? ` · clave ${step.key}` : ''}</span><small>Función hash: {hashName} · Solución de colisiones: {method}</small>{step.initial > 0 && <small>Posición inicial: {step.initial}</small>}{step.currentArray > 0 && <small>Arreglo actual: {step.currentArray}{configuration?.collisionMethod === 'nested' ? ' (anidado)' : ''}</small>}{step.currentNode > 0 && <small>Nodo actual: nodo {step.currentNode} de la cadena</small>}<p>{step.description}</p>{attempts.length > 0 && <div className="attempt-list">{attempts.map((attempt, index) => <span key={`${attempt.position}-${index}`} className={attempt.occupied ? 'attempt--occupied' : 'attempt--free'}>{attempt.expression}: {attempt.occupied ? 'ocupada' : 'libre'}</span>)}</div>}</div><div className="step-controls"><Button variant="secondary" disabled={stepIndex === 0} onClick={() => onStepChange?.(stepIndex - 1)}>Anterior</Button><Button variant="secondary" disabled={stepIndex >= result.steps.length - 1} onClick={() => onStepChange?.(stepIndex + 1)}>Siguiente</Button><Button variant="secondary" disabled={stepIndex >= result.steps.length - 1} onClick={() => onStepChange?.(result.steps.length - 1)}>Último paso</Button></div></section>; }
  if (!hash && result) { const step = result.steps[stepIndex]; return <section className="panel"><h2>Visualización del algoritmo</h2><div className="algorithm-step" aria-live="polite"><span>Paso {stepIndex + 1} de {result.steps.length}</span>{binary && step.currentIndex !== undefined && <small>Inicio: {step.lower} · Fin: {step.upper} · Centro: {step.currentIndex} · Valor central: {step.middleValue}</small>}<p>{step.description}</p><small>Comparaciones acumuladas: {step.comparisons}</small></div><div className="step-controls"><Button variant="secondary" disabled={stepIndex === 0} onClick={() => onStepChange?.(stepIndex - 1)}>Anterior</Button><Button variant="secondary" disabled={stepIndex >= result.steps.length - 1} onClick={() => onStepChange?.(stepIndex + 1)}>Siguiente</Button></div></section>; }
  return <section className="panel"><h2>{hash ? 'Colisiones y resolución' : 'Visualización del algoritmo'}</h2><div className="visualization-placeholder"><span>○</span><p>{hash ? 'Aquí se mostrarán las colisiones y sus pasos de resolución.' : 'Aquí se mostrarán la celda actual, comparaciones y pasos de ejecución.'}</p><small>Área preparada para la animación</small></div></section>;
}

export function ResultPanel({ result, binary = false }) {
  return <section className="panel result-panel"><h2>Resultado</h2><div className="result-grid"><div><span>Resultado</span><strong>{result ? (result.found ? 'Encontrado' : 'No encontrado') : 'Pendiente'}</strong></div><div><span>Posición</span><strong>{result?.found ? result.index : '—'}</strong></div><div><span>Comparaciones</span><strong>{result ? result.comparisons : '—'}</strong></div><div><span>Complejidad</span><strong>{binary ? 'O(log n)' : 'O(n)'}</strong></div></div><small>{result ? 'Resultado de la búsqueda realizada.' : 'Crea una estructura y realiza una búsqueda para ver el resultado.'}</small></section>;
}
