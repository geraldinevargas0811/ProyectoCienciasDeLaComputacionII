import StepControls from './StepControls';

// Panel del paso a paso con la composición de las búsquedas internas:
// cabecera "Paso X de Y · reproduciendo… · clave K", metadatos del paso en
// <small> y el control de botones embebido en el mismo panel.
export default function ExplanationPanel({
  heading = 'Visualización del algoritmo',
  index = 0,
  total = 0,
  playing = false,
  description,
  meta = [],
  currentKey = null,
  start,
  pause,
  next,
  reset,
  disabled = false,
}) {
  const label = `Paso ${Math.min(index + 1, Math.max(total, 1))} de ${total}`;
  return (
    <section className="panel">
      <h2>{heading}</h2>
      <div className="algorithm-step" aria-live="polite">
        <span>{label}{playing ? ' · reproduciendo…' : ''}{currentKey != null ? ` · clave ${currentKey}` : ''}</span>
        {meta.map((line) => <small key={line}>{line}</small>)}
        <p>{description}</p>
      </div>
      {total > 0 && (
        <StepControls
          stepIndex={index}
          total={total}
          playing={playing}
          start={start}
          pause={pause}
          next={next}
          reset={reset}
          disabled={disabled}
        />
      )}
    </section>
  );
}