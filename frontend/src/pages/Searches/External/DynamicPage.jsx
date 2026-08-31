import { useState } from 'react';
import { Button, PageHeader } from '../../../components/common/UI';
import DynamicViz from '../../../components/external/DynamicViz';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { generateKeys, validKey, keyLengthError } from '../../../utils/external/dataGenerators';
import { runDynamicSim } from '../../../utils/external/dynamicHash';

const digitOptions = [
  ['1', '1 dígito'],
  ['2', '2 dígitos'],
];
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const TABS = [
  ['total', 'Expansiones totales'],
  ['partial', 'Expansiones parciales'],
  ['reductions', 'Reducciones totales y parciales'],
];

// BÚSQUEDAS DINÁMICAS POR TRANSFORMACIÓN DE CLAVES (OTRAS BÚSQUEDAS EXTERNAS).
export default function DynamicPage() {
  const [tab, setTab] = useState('total');
  const [initial, setInitial] = useState('4');
  const [digits, setDigits] = useState('1');
  const [keys, setKeys] = useState([]);
  const [created, setCreated] = useState(false);
  const [notice, setNotice] = useState(null);
  const [inputMode, setInputMode] = useState('manual');
  const [input, setInput] = useState('');
  const [autoCount, setAutoCount] = useState('10');
  const [sim, setSim] = useState(null);

  const total = sim?.steps.length ?? 0;
  const player = useStepPlayer(total);
  const step = sim?.steps?.[player.stepIndex];

  const changeTab = (next) => { setTab(next); setSim(null); setNotice(null); };

  const create = () => {
    const N = Number(initial);
    if (!Number.isInteger(N) || N < 2 || N % 2 !== 0) { setNotice({ type: 'error', text: 'El número inicial de cubetas debe ser par y mayor o igual a 2.' }); return; }
    setCreated(true);
    setKeys([]);
    setSim(null);
    setNotice({ type: 'success', text: 'Estructura creada y vacía: lista para el ingreso de claves.' });
  };

  const addManual = () => {
    const value = digitsOnly(input);
    if (!value) return setNotice({ type: 'error', text: 'Indica una clave a ingresar.' });
    if (!validKey(value, digits)) return setNotice(keyLengthError('insert', digits));
    if (keys.includes(value)) return setNotice({ type: 'error', text: 'La estructura no admite claves repetidas.' });
    setKeys([...keys, value]);
    setSim(null);
    setInput('');
    setNotice({ type: 'success', text: `Clave ${value} añadida: revisa las claves a insertar.` });
  };

  const generateAuto = () => {
    const count = Math.min(Math.max(Number(autoCount) || 1, 1), 99);
    const generated = generateKeys(count, Number(digits));
    if (!generated) return setNotice({ type: 'error', text: `No es posible generar ${count} claves únicas de ${digits} dígito${digits === '1' ? '' : 's'}.` });
    setKeys(generated);
    setSim(null);
    setNotice({ type: 'success', text: `${generated.length} claves únicas generadas en orden aleatorio.` });
  };

  const runSim = () => {
    if (!keys.length) return setNotice({ type: 'error', text: 'Primero ingresa las claves a insertar.' });
    const N = Number(initial);
    if (!Number.isInteger(N) || N < 2 || N % 2 !== 0) return setNotice({ type: 'error', text: 'El número inicial de cubetas debe ser par y mayor o igual a 2.' });
    const mode = tab === 'partial' ? 'partial' : 'total';
    const reduce = tab === 'reductions';
    const result = runDynamicSim({ keys, initial: N, mode, high: 0.75, low: 0.4, reduce });
    setSim(result);
    setNotice({ type: 'success', text: 'Simulación ejecutada: revisa el recorrido paso a paso.' });
  };

  const isEvent = step && ['expansion', 'reduction'].includes(step.kind);
  const bucketCount = step?.buckets?.flat()?.length ?? 0;

  const meta = [];
  if (isEvent) {
    meta.push(`Accesos antes: ${step.accessBefore}`);
    meta.push(`Accesos después: ${step.accesses}`);
    meta.push(`Registros movidos: ${step.moved}`);
    meta.push(`Permanecen: ${step.kept !== undefined ? step.kept : 'todos'}`);
  } else {
    meta.push(step?.kind === 'insert' ? `Cubeta: ${step.position}` : `Cubetas (M): ${step?.M ?? '—'}`);
    meta.push(`Registros: ${bucketCount}`);
    meta.push(`Densidad: ${step?.density ?? '—'}`);
    meta.push(`Accesos: ${step?.accesses ?? 0}`);
    meta.push(`Operaciones (c): ${step?.c ?? 0}`);
  }

  const lastInsertedKey = (() => {
    if (!sim) return null;
    let last = null;
    for (let i = 0; i <= player.stepIndex && i < sim.steps.length; i += 1) {
      if (sim.steps[i].kind === 'insert') last = sim.steps[i].key;
    }
    return last;
  })();

  return (
    <>
      <PageHeader title="Búsquedas dinámicas por transformación de claves" />
      <Tabs tabs={TABS} active={tab} onChange={changeTab} />
      <div className="lab-layout">
        <div className="lab-layout__controls">
          <section className="panel">
            <h2>Crear estructura</h2>
            <div className="form-grid">
              <label>N (cantidad inicial de cubetas — par)<input type="number" min="2" step="2" inputMode="numeric" value={initial} onChange={(event) => setInitial(digitsOnly(event.target.value))} /></label>
              <label>Dígitos de las claves<select value={digits} onChange={(event) => { setDigits(event.target.value); setKeys([]); setSim(null); }}>{digitOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
            </div>
            {tab === 'reductions' && <p className="notice">La simulación inserta primero las claves (con sus expansiones) y luego elimina la mitad de ellas automáticamente para provocar las reducciones y mostrar el proceso contrario.</p>}
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
                  <label>Clave<input inputMode="numeric" maxLength={Number(digits)} value={input} onChange={(event) => setInput(digitsOnly(event.target.value))} placeholder="Clave numérica" /></label>
                  <Button variant="secondary" onClick={addManual}>Añadir</Button>
                </div>
              ) : (
                <div className="automatic-entry">
                  <label>Cantidad<input type="number" min="1" step="1" inputMode="numeric" value={autoCount} onChange={(event) => setAutoCount(digitsOnly(event.target.value))} /></label>
                  <Button variant="secondary" onClick={generateAuto} style={{ marginTop: 7 }}>Generar automáticamente</Button>
                </div>
              )}
            </section>
          )}

          {created && keys.length > 0 && (
            <section className="panel keys-panel">
              <h2>Claves a insertar</h2>
              <ol className="insertion-order">
                {keys.map((k) => <li key={k} className={k === lastInsertedKey ? 'active' : ''}>{k}</li>)}
              </ol>
              <div className="step-controls"><button type="button" className="button button--primary" onClick={runSim} disabled={player.playing}>{player.playing ? 'Simulando…' : 'Ejecutar simulación'}</button></div>
            </section>
          )}

          {sim && (
            <section className="panel result-panel">
              <h2>Resultado</h2>
              <div className="result-grid">
                <div><span>Cubetas (T)</span><strong>{sim.result.M}</strong></div>
                <div><span>Registros</span><strong>{sim.result.records}</strong></div>
                <div><span>Densidad</span><strong>{(sim.result.records / sim.result.M).toFixed(2)}</strong></div>
                <div><span>Accesos</span><strong>{sim.result.accesses}</strong></div>
                <div><span>Operaciones (c)</span><strong>{sim.result.c}</strong></div>
                <div><span>Fórmula</span><strong>{tab === 'total' ? 'T = 2^c · N' : 'T = (1.5)^c · N'}</strong></div>
              </div>
            </section>
          )}
        </div>

        <div className="lab-layout__visual">
          <section className="panel">
            <h2>Visualización del directorio de cubetas</h2>
            {sim ? (
              <DynamicViz
                buckets={step?.buckets ?? sim.result.buckets}
                activeBucket={step?.kind === 'insert' || step?.kind === 'remove' ? step.position : null}
                reason={isEvent ? `M: ${step.Mfrom} → ${step.Mto} cubetas` : null}
              />
            ) : created ? (
              <DynamicViz buckets={Array.from({ length: Number(initial) }, () => [])} />
            ) : <div className="visualization-placeholder"><span>▦</span><p>Crea la estructura y genera claves para comenzar.</p></div>}
          </section>
          <section className="panel stat-strip">
            <div className="stat"><span>Cubetas (M)</span><strong>{step?.M ?? (sim ? sim.result.M : Number(initial))}</strong></div>
            <div className="stat"><span>Registros</span><strong>{bucketCount}</strong></div>
            <div className="stat"><span>Densidad</span><strong>{step?.density ?? '—'}</strong></div>
            <div className="stat"><span>Accesos</span><strong>{step?.accesses ?? 0}</strong></div>
            <div className="stat"><span>c</span><strong>{step?.c ?? 0}</strong></div>
          </section>
          {sim && (
            <ExplanationPanel
              {...player}
              currentKey={step?.key ?? null}
              description={step?.description}
              meta={meta}
            />
          )}
        </div>
      </div>
    </>
  );
}