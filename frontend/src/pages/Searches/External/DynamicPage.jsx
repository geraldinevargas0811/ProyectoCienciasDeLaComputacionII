import { useState } from 'react';
import { PageHeader } from '../../../components/common/UI';
import DynamicViz from '../../../components/external/DynamicViz';
import ExplanationPanel from '../../../components/external/ExplanationPanel';
import StepControls from '../../../components/external/StepControls';
import Tabs from '../../../components/external/Tabs';
import { useStepPlayer } from '../../../components/external/useStepPlayer';
import { generateKeys } from '../../../utils/external/dataGenerators';
import { runDynamicSim } from '../../../utils/external/dynamicHash';

const digitOptions = [
  ['1', '1 dígito'],
  ['2', '2 dígitos'],
];
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const TABS = [
  ['total', 'EXPANSIONES TOTALES'],
  ['partial', 'EXPANSIONES PARCIALES'],
  ['reductions', 'REDUCCIONES TOTALES Y PARCIALES'],
];

// BÚSQUEDAS DINÁMICAS POR TRANSFORMACIÓN DE CLAVES (OTRAS BÚSQUEDAS EXTERNAS).
export default function DynamicPage() {
  const [tab, setTab] = useState('total');
  const [initial, setInitial] = useState('4');
  const [digits, setDigits] = useState('1');
  const [keyCount, setKeyCount] = useState('10');
  const [keys, setKeys] = useState([]);
  const [sim, setSim] = useState(null);
  const [message, setMessage] = useState(null);

  const TABS_BY = { total: 'Expansiones totales', partial: 'Expansiones parciales', reductions: 'Reducciones' };

  const total = sim?.steps.length ?? 0;
  const player = useStepPlayer(total);
  const step = sim?.steps?.[player.stepIndex];

  // Cambiar pestaña reinicia la simulación.
  const changeTab = (next) => { setTab(next); setSim(null); setMessage(null); };

  const generateClaves = () => {
    const count = Number(keyCount);
    const generated = generateKeys(count, Number(digits));
    if (!generated) { setMessage({ type: 'error', text: 'No es posible generar claves únicas con esos dígitos.' }); return; }
    setKeys(generated);
    setSim(null);
    setMessage({ type: 'success', text: `${count} claves generadas. Presiona "Ejecutar simulación" para observar ${TABS_BY[tab].toLowerCase()}.` });
  };

  const runSim = () => {
    if (keys.length === 0) { setMessage({ type: 'error', text: 'Genera claves antes de ejecutar la simulación.' }); return; }
    const N = Number(initial);
    if (!Number.isInteger(N) || N < 1) { setMessage({ type: 'error', text: 'Indica un número inicial de cubetas válido.' }); return; }
    const mode = tab === 'partial' ? 'partial' : 'total';
    const reduce = tab === 'reductions';
    const result = runDynamicSim({ keys, initial: N, mode, high: 0.75, low: 0.4, reduce });
    setSim(result);
    setMessage({ type: 'success', text: `Simulación ejecutada: ${result.steps.length} pasos. Usa INICIAR o SIGUIENTE para recorrerla.` });
  };

  const formula = tab === 'total' ? 'T = 2^c · N' : 'T ≈ (1.5)^c · N';
  const isEvent = step && ['expansion', 'reduction'].includes(step.kind);
  const chips = isEvent
    ? [['Accesos antes', step.accessBefore], ['Accesos después', step.accesses], ['Mueve registros', step.moved], ['Permanecen', step.kept !== undefined ? step.kept : 'todos']]
    : [step?.kind === 'insert' ? ['CUBETA', step.position] : ['Cubetas (M)', step?.M], ['Registros', sim?.steps?.[player.stepIndex]?.buckets?.flat()?.length ?? 0], ['Densidad', step?.density ?? '—'], ['Accesos', step?.accesses ?? 0], ['c', step?.c ?? 0]];

  return (
    <>
      <PageHeader title="OTRAS BÚSQUEDAS EXTERNAS" eyebrow="Búsquedas Dinámicas" description="Operaciones dinámicas sobre la transformación de claves: el directorio de cubetas crece (expansión) o se reduce cuando la densidad de ocupación sube o baja de los umbrales. Modelo de referencia: EXPANSIONES TOTALES T = 2^c · N · EXPANSIONES PARCIALES T = (1.5)^c · N, donde T es el número de cubetas, N la cantidad inicial y c el número de operaciones." />
      <Tabs tabs={TABS} active={tab} onChange={changeTab} />
      <div className="external-grid">
        <div className="external-grid__controls">
          <section className="panel">
            <h2>Configuración de la simulación</h2>
            <div className="form-grid">
              <label>N (cantidad inicial de cubetas)<input type="number" min="1" step="1" value={initial} onChange={(event) => setInitial(digitsOnly(event.target.value))} /></label>
              <label>Dígitos de las claves<select value={digits} onChange={(event) => setDigits(event.target.value)}>{digitOptions.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
              <label>Nº de claves a insertar<input type="number" min="1" step="1" value={keyCount} onChange={(event) => setKeyCount(digitsOnly(event.target.value))} /></label>
            </div>
            <div className="data-panel__actions">
              <button type="button" className="button button--primary" onClick={generateClaves}>Generar claves</button>
              <button type="button" className="button button--secondary" onClick={runSim}>Ejecutar simulación</button>
            </div>
            <div className="threshold-note">
              <small>Umbrales del modelo: densidad ≥ 0.75 → expansión · densidad ≤ 0.40 → reducción.</small>
            </div>
            {message && <p className={`validation-message validation-message--${message.type}`} role="status">{message.text}</p>}
            {keys.length > 0 && <div className="keys-panel"><small>Claves: {keys.join(' ')}</small></div>}
            {tab === 'reductions' && (
              <p className="notice">La simulación inserta primero los registros (con sus expansiones) y luego elimina la mitad de ellos automáticamente para provocar las reducciones y mostrar el proceso contrario.</p>
            )}
          </section>
          {sim && (
            <section className="panel result-panel">
              <h2>Estado final</h2>
              <div className="result-grid">
                <div><span>Cubetas (T)</span><strong>{sim.result.M}</strong></div>
                <div><span>Registros</span><strong>{sim.result.records}</strong></div>
                <div><span>Densidad</span><strong>{(sim.result.records / sim.result.M).toFixed(2)}</strong></div>
                <div><span>Accesos</span><strong>{sim.result.accesses}</strong></div>
                <div><span>Operaciones (c)</span><strong>{sim.result.c}</strong></div>
                <div><span>Fórmula</span><strong>{formula}</strong></div>
              </div>
            </section>
          )}
        </div>
        <div className="external-grid__visual">
          <section className="panel">
            <h2>Directorio dinámico de cubetas</h2>
            {sim ? (
              <DynamicViz
                buckets={step?.buckets ?? sim.result.buckets}
                activeBucket={step?.kind === 'insert' || step?.kind === 'remove' ? step.position : null}
                reason={isEvent ? `M: ${step.Mfrom} → ${step.Mto} cubetas` : null}
              />
            ) : <div className="visualization-placeholder"><span>▦</span></div>}
          </section>
          <section className="panel stat-strip">
            <div className="stat"><span>Cubetas (M)</span><strong>{step?.M ?? (sim ? sim.result.M : Number(initial))}</strong></div>
            <div className="stat"><span>Registros</span><strong>{step?.buckets?.flat()?.length ?? 0}</strong></div>
            <div className="stat"><span>Densidad</span><strong>{step?.density ?? '—'}</strong></div>
            <div className="stat"><span>Accesos</span><strong>{step?.accesses ?? 0}</strong></div>
            <div className="stat"><span>c</span><strong>{step?.c ?? 0}</strong></div>
          </section>
          {sim ? (
            <>
              <ExplanationPanel index={player.stepIndex} total={total} playing={player.playing} description={step?.description} chips={chips} />
              <StepControls {...player} />
            </>
          ) : <div className="placeholder-hint">Genera claves y ejecuta la simulación para recorrer expansiones/reducciones paso a paso.</div>}
        </div>
      </div>
    </>
  );
}