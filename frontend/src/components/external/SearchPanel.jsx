import { useState } from 'react';
import { Button } from '../common/UI';

// Panel de operaciones externo con la misma composición que OperationsPanel de
// las búsquedas internas (Buscar / Limpiar); las búsquedas sobre archivos no
// requieren la operación de eliminar.
export default function SearchPanel({ disabled = false, maxLength = null, onSearch, onClear }) {
  const [searchKey, setSearchKey] = useState('');
  const [message, setMessage] = useState(null);
  const runSearch = async () => {
    if (!searchKey) { setMessage({ type: 'error', text: 'Indica la clave a buscar.' }); return; }
    const response = await onSearch?.(searchKey);
    if (response) setMessage(response);
  };
  const runClear = async () => {
    const response = await onClear?.();
    if (response) setMessage(response);
  };
  return <section className="panel">
    <h2>Operaciones</h2>
    <div className="operation">
      <label>Buscar<input inputMode="numeric" maxLength={maxLength} value={searchKey} onChange={(event) => setSearchKey(event.target.value.replace(/\D/g, ''))} placeholder="Clave" /></label>
      <Button variant="secondary" disabled={disabled} onClick={runSearch}>Buscar</Button>
    </div>
    <Button variant="secondary" disabled={disabled} className="operation-clear" onClick={runClear}>Limpiar</Button>
    {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
  </section>;
}