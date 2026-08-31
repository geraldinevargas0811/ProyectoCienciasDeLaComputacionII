import StepControls from './StepControls';

export default function DynamicStepDetail({
  step,
  stepIndex = 0,
  total = 0,
  playing = false,
  activeBucket = null,
  collision = false,
  start,
  pause,
  next,
  reset,
}) {
  if (!step) return null;

  const label = `Paso ${Math.min(stepIndex + 1, Math.max(total, 1))} de ${total}`;
  const isInsert = step.kind === 'insert';
  const isExpansion = step.kind === 'expansion';
  const isReduction = step.kind === 'reduction';
  const isRemove = step.kind === 'remove';

  return (
    <section className="panel">
      <h2>Paso a paso</h2>
      <div className="dyn-step" aria-live="polite">
        <div className="dyn-step__header">
          <span className="dyn-step__label">
            {label}{playing ? ' · reproduciendo…' : ''}
          </span>
          {step.key && (
            <span className="dyn-step__key-badge">Clave: {step.key}</span>
          )}
          {isInsert && activeBucket && (
            <span className="dyn-step__bucket-badge">Cubeta {activeBucket}</span>
          )}
        </div>

        {isInsert && (
          <div className="dyn-step__phases">
            <div className="dyn-step__phase dyn-step__phase--key">
              <span className="dyn-step__phase-num">1</span>
              <div className="dyn-step__phase-body">
                <span className="dyn-step__phase-title">Clave</span>
                <span className="dyn-step__phase-value">{step.key}</span>
              </div>
            </div>
            <div className="dyn-step__arrow">→</div>
            <div className="dyn-step__phase dyn-step__phase--hash">
              <span className="dyn-step__phase-num">2</span>
              <div className="dyn-step__phase-body">
                <span className="dyn-step__phase-title">Función hash</span>
                <span className="dyn-step__phase-formula">H(K) = (K mod M) + 1</span>
              </div>
            </div>
            <div className="dyn-step__arrow">→</div>
            <div className="dyn-step__phase dyn-step__phase--result">
              <span className="dyn-step__phase-num">3</span>
              <div className="dyn-step__phase-body">
                <span className="dyn-step__phase-title">Cálculo</span>
                <span className="dyn-step__phase-formula">
                  H({step.key}) = ({step.key} mod {step.M}) + 1 = {step.position}
                </span>
              </div>
            </div>
            <div className="dyn-step__arrow">→</div>
            <div className="dyn-step__phase dyn-step__phase--bucket">
              <span className="dyn-step__phase-num">4</span>
              <div className="dyn-step__phase-body">
                <span className="dyn-step__phase-title">Cubeta destino</span>
                <span className="dyn-step__phase-value dyn-step__phase-value--highlight">
                  Cubeta {step.position}
                </span>
              </div>
            </div>
          </div>
        )}

        {!isInsert && !isExpansion && !isReduction && !isRemove && (
          <p className="dyn-step__description">{step.description}</p>
        )}

        {(isExpansion || isReduction) && (
          <div className="dyn-step__event">
            <div className="dyn-step__event-header">
              <span className="dyn-step__event-type">
                {isExpansion ? 'EXPANSIÓN' : 'REDUCCIÓN'} {step.mode === 'total' ? 'TOTAL' : 'PARCIAL'}
              </span>
            </div>
            <p className="dyn-step__description">{step.description}</p>
            <div className="dyn-step__event-stats">
              <span>M: {step.Mfrom} → {step.Mto}</span>
              <span>Registros movidos: {step.moved}</span>
              {step.kept !== undefined && <span>Permanecen: {step.kept}</span>}
            </div>
          </div>
        )}

        {isRemove && (
          <div className="dyn-step__remove">
            <p className="dyn-step__description">{step.description}</p>
          </div>
        )}

        {isInsert && collision && (
          <div className="dyn-step__collision">
            <span className="dyn-step__collision-tag">COLISIÓN</span>
            <p>
              La Cubeta {step.position} ya contenía registros. El algoritmo de
              transformación de claves ubica la clave con la misma función hash,
              de modo que varios registros comparten cubeta (almacenamiento
              soportado por el directorio sin pérdida de claves).
            </p>
          </div>
        )}

        {isInsert && (
          <p className="dyn-step__action">{step.description}</p>
        )}

        <div className="dyn-step__meta">
          <span className="dyn-step__meta-item">
            Cubetas (M): <strong>{step.M ?? '—'}</strong>
          </span>
          <span className="dyn-step__meta-item">
            Registros: <strong>{step.buckets?.flat()?.length ?? 0}</strong>
          </span>
          <span className="dyn-step__meta-item">
            Densidad: <strong>{step.density ?? '—'}</strong>
          </span>
          <span className="dyn-step__meta-item">
            Accesos: <strong>{step.accesses ?? 0}</strong>
          </span>
        </div>
      </div>
      {total > 0 && (
        <StepControls
          stepIndex={stepIndex}
          total={total}
          playing={playing}
          start={start}
          pause={pause}
          next={next}
          reset={reset}
        />
      )}
    </section>
  );
}
