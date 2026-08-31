import { useState } from 'react';

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const digitsOptions = [
  ['2', '2 dígitos'],
  ['3', '3 dígitos'],
  ['4', '4 dígitos'],
];

// Panel compartido para configurar el archivo de registros: número de
// registros, generación automática, ingreso manual y selección de la clave
// que se buscará. Cada página le pasa solo los manejadores que necesita.
export default function DataPanel({
  count = '12',
  onCountChange,
  digits = '3',
  onDigitsChange,
  onCreate,
  onGenerate,
  onManualInsert,
  onSearch,
  message,
  busy = false,
  loaded = false,
  existingCount = 0,
  createLabel = 'Crear archivo',
}) {
  const [manual, setManual] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [localMessage, setLocalMessage] = useState(null);
  const shown = message ?? localMessage;

  const submit = async (handler, value) => {
    const response = await handler?.(value);
    if (response) {
      setLocalMessage(response);
      if (response.type === 'success') setManual('');
    }
  };

  const runSearch = async () => {
    if (!searchKey) { setLocalMessage({ type: 'error', text: 'Escribe la clave a buscar.' }); return; }
    await submit(onSearch, searchKey);
  };

  return <section className="panel">
    <h2>Archivo de registros</h2>
    <div className="form-grid">
      <label>Nº de registros (N)<input type="number" min="1" step="1" value={count} onChange={(event) => onCountChange(digitsOnly(event.target.value))} /></label>
      <label>Dígitos de las claves<select value={digits} onChange={(event) => onDigitsChange(event.target.value)}>{digitsOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
    </div>
    <div className="data-panel__actions">
      <button type="button" className="button button--primary" disabled={busy} onClick={() => submit(onCreate)}>Crear archivo</button>
      <button type="button" className="button button--secondary" disabled={busy || !loaded} onClick={() => submit(onGenerate)}>Generar registros aleatorios</button>
    </div>
    <div className="operation">
      <label>Ingresar registro manual<small>{existingCount ? `${existingCount} registro(s) en el archivo.` : 'El nombre se asigna automáticamente.'}</small>
        <input inputMode="numeric" placeholder="Clave numérica" value={manual} onChange={(event) => setManual(digitsOnly(event.target.value))} /></label>
      <button type="button" className="button button--secondary" disabled={busy || !loaded || !manual} onClick={() => submit(onManualInsert, manual)}>Insertar</button>
    </div>
    <div className="operation">
      <label>Clave a buscar<small>Selecciona la clave para ejecutar la búsqueda.</small>
        <input inputMode="numeric" placeholder="Clave" value={searchKey} onChange={(event) => setSearchKey(digitsOnly(event.target.value))} /></label>
      <button type="button" className="button button--primary" disabled={busy || !loaded || !searchKey} onClick={runSearch}>Buscar</button>
    </div>
    {shown && <p className={`validation-message validation-message--${shown.type}`} role="status">{shown.text}</p>}
  </section>;
}