import { useState } from 'react';
import { Button } from '../common/UI';

const digitsOnly = (value) => value.replace(/\D/g, '');

function NumericField({ value, onChange, min = '0', ...props }) {
  return (
    <input
      type="number"
      min={min}
      step="1"
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(digitsOnly(event.target.value))}
      {...props}
    />
  );
}

export function ConfigurationPanel({ binary = false, hash = false, onStructureCreated }) {
  const [size, setSize] = useState('10');
  const [keySize, setKeySize] = useState('2');
  const [entryMode, setEntryMode] = useState('automatic');
  const [keys, setKeys] = useState(Array(10).fill(''));
  const [message, setMessage] = useState(null);

  const structureName = hash ? 'tabla' : 'estructura';

  const updateSize = (value) => {
    setSize(value);

    const count = Number(value);

    if (Number.isInteger(count) && count > 0) {
      setKeys((current) =>
        Array.from(
          { length: count },
          (_, index) => current[index] ?? ''
        )
      );
    }
  };

  const updateKey = (index, value) => {
    setKeys((current) =>
      current.map((key, keyIndex) =>
        keyIndex === index ? digitsOnly(value) : key
      )
    );
  };

  const generateKeys = () => {
    const numericSize = Number(size);
    const numericKeySize = Number(keySize);
    const minimum = numericKeySize === 1 ? 0 : 10 ** (numericKeySize - 1);
    const maximum = (10 ** numericKeySize) - 1;
    const availableKeys = maximum - minimum + 1;

    if (numericSize > availableKeys) {
      return { error: `No es posible generar ${numericSize} claves únicas de ${numericKeySize} dígito${numericKeySize === 1 ? '' : 's'}. Selecciona un tamaño de clave mayor.` };
    }

    const generated = new Set();
    while (generated.size < numericSize) {
      generated.add(String(Math.floor(Math.random() * availableKeys) + minimum));
    }
    return { values: [...generated] };
  };

  const validate = () => {
    const numericSize = Number(size);
    const numericKeySize = Number(keySize);

    if (!Number.isInteger(numericSize) || numericSize <= 0) {
      return `Indica un tamaño válido para la ${structureName}.`;
    }

    if (entryMode === 'manual') {
      if (
        keys.length !== numericSize ||
        keys.some(
          (key) =>
            !new RegExp(`^\\d{${numericKeySize}}$`).test(key)
        )
      ) {
        return `Cada clave debe ser numérica y tener exactamente ${numericKeySize} dígito${
          numericKeySize === 1 ? '' : 's'
        }.`;
      }

      if (new Set(keys).size !== keys.length) {
        return 'No se permiten claves repetidas. Ajusta los valores ingresados.';
      }
    }

    return null;
  };

  const createStructure = () => {
    const error = validate();

    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    const generated = entryMode === 'automatic' && !hash ? generateKeys() : null;

    if (generated?.error) {
      setMessage({ type: 'error', text: generated.error });
      return;
    }

    if (!hash) {
      onStructureCreated?.(entryMode === 'manual' ? [...keys] : generated.values);
    }

    setMessage(
      {
        type: 'success',
        text:
          entryMode === 'manual'
            ? `La ${structureName} es válida y está lista para visualizarse.`
            : `La ${structureName} está configurada para generar claves numéricas únicas.`,
      }
    );
  };

  return (
    <section className="panel">
      <h2>Configurar {structureName}</h2>

      <div className="form-grid">
        <label>
          {hash
            ? 'Tamaño / rango de la tabla'
            : 'Tamaño / rango de la estructura'}

          <NumericField
            min="1"
            value={size}
            onChange={updateSize}
          />
        </label>

        <label>
          Tamaño de las claves

          <select
            value={keySize}
            onChange={(event) => setKeySize(event.target.value)}
          >
            <option value="1">1 dígito</option>
            <option value="2">2 dígitos</option>
            <option value="3">3 dígitos</option>
          </select>
        </label>

        <label>
          Ingreso de datos

          <select
            value={entryMode}
            onChange={(event) => {
              setEntryMode(event.target.value);
              setMessage(null);
            }}
          >
            <option value="automatic">Generación automática</option>
            <option value="manual">Inserción manual</option>
          </select>
        </label>

        {hash && (
          <label>
            Función hash

            <select>
              <option>Módulo</option>
              <option>Cuadrado</option>
              <option>Truncamiento</option>
              <option>Plegamiento</option>
            </select>
          </label>
        )}

        {hash && (
          <label>
            Solución de colisiones

            <select>
              <option>Lineal</option>
              <option>Cuadrática</option>
              <option>Doble hash</option>
              <option>Arreglos anidados</option>
            </select>
          </label>
        )}
      </div>

      {entryMode === 'manual' && (
        <div className="manual-inputs">
          <p>
            Ingresa {size || 'las'} clave
            {Number(size) === 1 ? '' : 's'} numérica
            {Number(size) === 1 ? '' : 's'} sin repetir.
          </p>

          {keys.map((key, index) => (
            <label key={index}>
              Clave {index + 1}

              <NumericField
                value={key}
                onChange={(value) => updateKey(index, value)}
                aria-label={`Clave ${index + 1}`}
              />
            </label>
          ))}
        </div>
      )}

      {entryMode === 'automatic' && (
        <p className="notice">
          Se generarán claves numéricas únicas con el tamaño seleccionado.
        </p>
      )}

      {binary && (
        <p className="notice">
          Esta búsqueda requiere una estructura ordenada.
        </p>
      )}

      {message && (
        <p
          className={`validation-message validation-message--${message.type}`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <Button onClick={createStructure}>
        Crear {structureName}
      </Button>
    </section>
  );
}

export function SearchInput() {
  const [searchKey, setSearchKey] = useState('');

  return (
    <section className="panel">
      <h2>Realizar búsqueda</h2>

      <label>
        Clave a buscar

        <input
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={searchKey}
          onChange={(event) =>
            setSearchKey(digitsOnly(event.target.value))
          }
          placeholder="Ej. 47"
        />
      </label>

      <Button>Buscar</Button>
    </section>
  );
}

export function VisualizationPanel({ hash = false }) {
  return (
    <section className="panel">
      <h2>
        {hash
          ? 'Colisiones y resolución'
          : 'Visualización del algoritmo'}
      </h2>

      <div className="visualization-placeholder">
        <span>◌</span>

        <p>
          {hash
            ? 'Aquí se mostrarán las colisiones y sus pasos de resolución.'
            : 'Aquí se mostrarán la celda actual, comparaciones y pasos de ejecución.'}
        </p>

        <small>Área preparada para la animación</small>
      </div>
    </section>
  );
}

export function ResultPanel() {
  return (
    <section className="panel">
      <h2>Resultado</h2>

      <div className="result-grid">
        <div>
          <span>Resultado</span>
          <strong>Demostración</strong>
        </div>

        <div>
          <span>Posición</span>
          <strong>3</strong>
        </div>

        <div>
          <span>Comparaciones</span>
          <strong>4</strong>
        </div>

        <div>
          <span>Complejidad</span>
          <strong>O(n)</strong>
        </div>
      </div>

      <small>
        Datos demostrativos; el algoritmo se integrará posteriormente.
      </small>
    </section>
  );
}
