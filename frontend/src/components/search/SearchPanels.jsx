import { useState } from 'react';
import { Button } from '../common/UI';

const digitsOnly = (value) => value.replace(/\D/g, '');
function NumericField({ value, onChange, min = '0', ...props }) {
  return <input type="number" min={min} step="1" inputMode="numeric" value={value} onChange={(event) => onChange(digitsOnly(event.target.value))} {...props} />;
}

const keySizeOptions = [
  ['1', '1 dígito'],
  ['2', '2 dígitos'],
  ['3', '3 dígitos'],
  ['4', '4 dígitos'],
];

const hashFunctionOptions = [
  ['modulo', 'Módulo'],
  ['square', 'Cuadrado'],
  ['truncation', 'Truncamiento'],
  ['folding', 'Plegamiento'],
];

const collisionMethodOptions = [
  ['linear', 'Prueba lineal'],
  ['quadratic', 'Prueba cuadrática'],
  ['double', 'Doble función hash'],
  ['nested', 'Arreglos anidados'],
  ['linked', 'Listas enlazadas'],
];

export function CreateStructurePanel({ hash = false, size, onSizeChange, keySize = '2', onKeySizeChange, hashFunction = 'modulo', onHashFunctionChange, collisionMethod = 'linear', onCollisionMethodChange, onCreate, busy = false, message = null }) {
  return <section className="panel">
    <h2>Crear estructura</h2>
    <div className="form-grid">
      <label>Tamaño de la estructura<NumericField min="1" value={size} onChange={onSizeChange} /></label>
      <label>Tamaño de las claves<select value={keySize} onChange={(event) => onKeySizeChange?.(event.target.value)}>{keySizeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {hash && <>
        <label>Función hash<select value={hashFunction} onChange={(event) => onHashFunctionChange?.(event.target.value)}>{hashFunctionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Solución de colisiones<select value={collisionMethod} onChange={(event) => onCollisionMethodChange?.(event.target.value)}>{collisionMethodOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </>}
    </div>
    {hash && <p className="collision-hint">Debes seleccionar la solución de colisiones antes de crear la estructura. Si no seleccionas ninguna, se utilizará la solución lineal por defecto.</p>}
    {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
    <Button onClick={onCreate} disabled={busy}>Crear estructura</Button>
  </section>;
}

export function InsertDataPanel({ busy = false, disabled = false, insertedCount = 0, total = 0, fieldLabel = null, onInsert, onGenerate }) {
  const [mode, setMode] = useState('manual');
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState(null);
  const remaining = Math.max(total - insertedCount, 0);
  const submit = async () => {
    const response = await onInsert?.(inputValue);
    if (response) {
      setMessage(response);
      if (response.type === 'success') setInputValue('');
    }
  };
  const generate = async () => {
    const response = await onGenerate?.();
    if (response) setMessage(response);
  };
  const ready = !disabled && !busy && remaining > 0;
  return <section className="panel">
    <h2>Ingreso de datos</h2>
    <div className="segmented">
      <button type="button" className={`segmented__btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>Manual</button>
      <button type="button" className={`segmented__btn ${mode === 'automatic' ? 'active' : ''}`} onClick={() => setMode('automatic')}>Automático</button>
    </div>
    {mode === 'manual' ? (
      <div className="manual-entry">
        <label>{fieldLabel ?? `Dato ${insertedCount + 1}`}<input inputMode="numeric" value={inputValue} onChange={(event) => setInputValue(digitsOnly(event.target.value))} placeholder="Clave numérica" /></label>
        <Button variant="secondary" disabled={!ready} onClick={submit}>Insertar</Button>
      </div>
    ) : (
      <div className="automatic-entry">
        <p className="notice">Se generarán {remaining} clave{remaining === 1 ? '' : 's'} única{remaining === 1 ? '' : 's'}.</p>
        <Button disabled={!ready} onClick={generate}>{busy ? 'Generando…' : 'Generar automáticamente'}</Button>
      </div>
    )}
    {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
  </section>;
}

export function OperationsPanel({ disabled = false, onSearch, onDelete, onClear }) {
  const [searchKey, setSearchKey] = useState('');
  const [deleteKey, setDeleteKey] = useState('');
  const [message, setMessage] = useState(null);
  const runSearch = async () => {
    if (!searchKey) { setMessage({ type: 'error', text: 'Indica la clave a buscar.' }); return; }
    const response = await onSearch?.(searchKey);
    if (response) setMessage(response);
  };
  const runDelete = async () => {
    if (!deleteKey) { setMessage({ type: 'error', text: 'Indica la clave a eliminar.' }); return; }
    const response = await onDelete?.(deleteKey);
    if (response) setMessage(response);
  };
  const runClear = async () => {
    const response = await onClear?.();
    if (response) setMessage(response);
  };
  return <section className="panel">
    <h2>Operaciones</h2>
    <div className="operation">
      <label>Buscar<input inputMode="numeric" value={searchKey} onChange={(event) => setSearchKey(digitsOnly(event.target.value))} placeholder="Clave" /></label>
      <Button variant="secondary" disabled={disabled} onClick={runSearch}>Buscar</Button>
    </div>
    <div className="operation">
      <label>Eliminar<input inputMode="numeric" value={deleteKey} onChange={(event) => setDeleteKey(digitsOnly(event.target.value))} placeholder="Clave" /></label>
      <Button variant="secondary" disabled={disabled} onClick={runDelete}>Eliminar</Button>
    </div>
    <Button variant="secondary" disabled={disabled} className="operation-clear" onClick={runClear}>Limpiar</Button>
    {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
  </section>;
}

export function OperationsBlock({
  disabled = false,
  busy = false,
  insertedCount = 0,
  total = 0,
  fieldLabel = null,
  manualLabel = null,
  placeholder = 'Clave numérica',
  insertLabel = 'Insertar',
  inputMode = 'numeric',
  filter = digitsOnly,
  maxKeyLength = null,
  manualMaxLength = undefined,
  autoCount = null,
  onInsert,
  onGenerate,
  onSearch,
  onDelete,
  onClear,
  actionLabel = null,
  onAction = null,
  actionDisabled = false,
  clearLabel = 'Limpiar',
  clearLocked = true,
  unlimited = false,
  children,
}) {
  const [mode, setMode] = useState('manual');
  const [inputValue, setInputValue] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [deleteKey, setDeleteKey] = useState('');
  const [message, setMessage] = useState(null);
  const remaining = Math.max(total - insertedCount, 0);
  const ready = unlimited ? !busy : !busy && remaining > 0;
  const submit = async () => {
    const response = await onInsert?.(inputValue);
    if (response) {
      setMessage(response);
      if (response.type === 'success') setInputValue('');
    }
  };
  const generate = async () => { const response = await onGenerate?.(); if (response) setMessage(response); };
  const runSearch = async () => {
    if (!searchKey) { setMessage({ type: 'error', text: 'Indica la clave a buscar.' }); return; }
    const response = await onSearch?.(searchKey);
    if (response) setMessage(response);
  };
  const runDelete = async () => {
    if (!deleteKey) { setMessage({ type: 'error', text: 'Indica la clave a eliminar.' }); return; }
    const response = await onDelete?.(deleteKey);
    if (response) setMessage(response);
  };
  const runClear = async () => { const response = await onClear?.(); if (response) setMessage(response); };
  const runAction = async () => { const response = await onAction?.(); if (response) setMessage(response); };
  const showIngreso = Boolean(onInsert && onGenerate);
  return <section className="panel">
    <h2>Operaciones</h2>
    {showIngreso && (
      <>
        <div className="segmented">
          <button type="button" className={`segmented__btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>Manual</button>
          <button type="button" className={`segmented__btn ${mode === 'automatic' ? 'active' : ''}`} onClick={() => setMode('automatic')}>Automático</button>
        </div>
        {mode === 'manual' ? (
          <div className="manual-entry">
            <label>{manualLabel ?? fieldLabel ?? `Dato ${insertedCount + 1}`}<input inputMode={inputMode} maxLength={manualMaxLength} value={inputValue} onChange={(event) => setInputValue(filter(event.target.value))} placeholder={placeholder} /></label>
            <Button variant="secondary" disabled={!ready} onClick={submit}>{insertLabel}</Button>
          </div>
        ) : autoCount ? (
          <div className="automatic-entry">
            <label>Cantidad<input type="number" min="1" step="1" inputMode="numeric" value={autoCount.value} onChange={(event) => autoCount.onChange(digitsOnly(event.target.value))} /></label>
            <Button variant="secondary" onClick={generate} style={{ marginTop: 7 }}>Generar automáticamente</Button>
          </div>
        ) : (
          <div className="automatic-entry">
            <p className="notice">Se generarán {remaining} clave{remaining === 1 ? '' : 's'} única{remaining === 1 ? '' : 's'}.</p>
            <Button disabled={!ready} onClick={generate}>{busy ? 'Generando…' : 'Generar automáticamente'}</Button>
          </div>
        )}
      </>
    )}
    {children}
    {actionLabel && onAction && <div className="operation"><Button onClick={runAction} disabled={disabled || actionDisabled} style={{ width: '100%' }}>{actionLabel}</Button></div>}
    {onSearch && (
      <div className="operation">
        <label>Buscar<input inputMode="numeric" maxLength={maxKeyLength} value={searchKey} onChange={(event) => setSearchKey(filter(event.target.value))} placeholder="Clave" /></label>
        <Button variant="secondary" disabled={disabled} onClick={runSearch}>Buscar</Button>
      </div>
    )}
    {onDelete && (
      <div className="operation">
        <label>Eliminar<input inputMode="numeric" maxLength={maxKeyLength} value={deleteKey} onChange={(event) => setDeleteKey(filter(event.target.value))} placeholder="Clave" /></label>
        <Button variant="secondary" disabled={disabled} onClick={runDelete}>Eliminar</Button>
      </div>
    )}
    {onClear && <Button variant="secondary" disabled={clearLocked ? disabled : false} className="operation-clear" onClick={runClear}>{clearLabel}</Button>}
    {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
  </section>;
}

export function VisualizationPanel({ hash = false, binary = false, result, stepIndex = 0, onStepChange, onReset, configuration, playing = false }) {
  if (hash && result) {
    const step = result.steps[stepIndex];
    const attempts = step.attempts ?? [];
    const method = { linear: 'Prueba lineal', quadratic: 'Prueba cuadrática', double: 'Doble función hash', nested: 'Arreglos anidados', linked: 'Listas enlazadas' }[configuration?.collisionMethod];
    const hashName = { modulo: 'Módulo', square: 'Cuadrado', truncation: 'Truncamiento', folding: 'Plegamiento' }[configuration?.hashFunction];
    return <section className="panel"><h2>Paso a paso</h2><div className="algorithm-step" aria-live="polite"><span>Paso {stepIndex + 1} de {result.steps.length}{playing ? ' · reproduciendo…' : ''}{step.key ? ` · clave ${step.key}` : ''}</span><small>Función hash: {hashName} · Solución de colisiones: {method}</small>{step.initial > 0 && <small>Posición inicial: {step.initial}</small>}{step.currentArray > 0 && <small>Arreglo actual: {step.currentArray}{configuration?.collisionMethod === 'nested' ? ' (anidado)' : ''}</small>}{step.currentNode > 0 && <small>Nodo actual: nodo {step.currentNode} de la cadena</small>}<p>{step.description}</p>{attempts.length > 0 && <div className="attempt-list">{attempts.map((attempt, index) => <span key={`${attempt.position}-${index}`} className={attempt.occupied ? 'attempt--occupied' : 'attempt--free'}>{attempt.expression}: {attempt.occupied ? 'ocupada' : 'libre'}</span>)}</div>}</div><div className="step-controls"><Button variant="secondary" disabled={stepIndex === 0} onClick={() => onStepChange?.(stepIndex - 1)}>Anterior</Button><Button variant="secondary" disabled={stepIndex >= result.steps.length - 1} onClick={() => onStepChange?.(stepIndex + 1)}>Siguiente</Button><Button variant="secondary" disabled={stepIndex >= result.steps.length - 1} onClick={() => onStepChange?.(result.steps.length - 1)}>Último paso</Button>{onReset && <Button variant="secondary" onClick={onReset}>Reiniciar</Button>}</div></section>;
  }
  if (!hash && result) {
    const step = result.steps[stepIndex];
    return <section className="panel"><h2>Paso a paso</h2><div className="algorithm-step" aria-live="polite"><span>Paso {stepIndex + 1} de {result.steps.length}</span>{binary && step?.currentIndex !== undefined && <small>Inicio: {step.lower + 1} · Fin: {step.upper + 1} · Centro: {step.currentIndex + 1}{step.middleValue !== undefined ? ` · Valor central: ${step.middleValue}` : ''}</small>}<p>{step?.description}</p>{step?.comparisons !== undefined && <small>Comparaciones acumuladas: {step.comparisons}</small>}</div><div className="step-controls"><Button variant="secondary" disabled={stepIndex === 0} onClick={() => onStepChange?.(stepIndex - 1)}>Anterior</Button><Button variant="secondary" disabled={stepIndex >= result.steps.length - 1} onClick={() => onStepChange?.(stepIndex + 1)}>Siguiente</Button>{result.steps.length > 1 && <Button variant="secondary" disabled={stepIndex >= result.steps.length - 1} onClick={() => onStepChange?.(result.steps.length - 1)}>Último paso</Button>}{onReset && <Button variant="secondary" onClick={onReset}>Reiniciar</Button>}</div></section>;
  }
  return <section className="panel"><h2>Paso a paso</h2><div className="visualization-placeholder"><span>○</span></div></section>;
}

export function ResultPanel({ result, binary = false }) {
  const isDelete = result?.type === 'delete';
  let status = 'Pendiente';
  if (result) status = isDelete ? (result.found ? 'Eliminado' : 'No encontrado') : (result.found ? 'Encontrado' : 'No encontrado');
  return <section className="panel result-panel"><h2>Resultado</h2><div className="result-grid"><div><span>Resultado</span><strong>{status}</strong></div><div><span>Posición</span><strong>{result?.found ? (binary ? result.index + 1 : result.index) : '—'}</strong></div><div><span>Comparaciones</span><strong>{result ? result.comparisons : '—'}</strong></div><div><span>Complejidad</span><strong>{binary ? 'O(log n)' : 'O(n)'}</strong></div></div></section>;
}