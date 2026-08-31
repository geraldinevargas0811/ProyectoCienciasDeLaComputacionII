// Botones obligatorios del modo paso a paso: [INICIAR] [PAUSAR] [SIGUIENTE] [REINICIAR].
export default function StepControls({ stepIndex, total, playing, start, pause, next, reset, disabled = false }) {
  return <div className="step-controls">
    <button type="button" className="button button--secondary" disabled={disabled || playing} onClick={start}>INICIAR</button>
    <button type="button" className="button button--secondary" disabled={disabled || !playing} onClick={pause}>PAUSAR</button>
    <button type="button" className="button button--secondary" disabled={disabled || playing || stepIndex >= total - 1} onClick={next}>SIGUIENTE</button>
    <button type="button" className="button button--secondary" disabled={disabled} onClick={reset}>REINICIAR</button>
  </div>;
}