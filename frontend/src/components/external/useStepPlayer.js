import { useEffect, useRef, useState } from 'react';

// Controlador del modo paso a paso: reproduce la secuencia de pasos de un
// algoritmo con los botones [INICIAR] [PAUSAR] [SIGUIENTE] [REINICIAR].
export function useStepPlayer(total) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const stopTimer = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
  };

  useEffect(() => stopTimer, []);
  useEffect(() => {
    setStepIndex(0);
    setPlaying(false);
    stopTimer();
  }, [total]);

  const play = () => {
    stopTimer();
    setPlaying(true);
    timer.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= total - 1) { stopTimer(); setPlaying(false); return prev; }
        return prev + 1;
      });
    }, 750);
  };

  // INICIAR: si ya terminó, vuelve al inicio y reproduce desde allí.
  const start = () => {
    if (total <= 0) return;
    if (stepIndex >= total - 1) setStepIndex(0);
    play();
  };

  const pause = () => { stopTimer(); setPlaying(false); };
  const next = () => { stopTimer(); setPlaying(false); setStepIndex((prev) => Math.min(total - 1, prev + 1)); };
  const reset = () => { stopTimer(); setPlaying(false); setStepIndex(0); };

  return { stepIndex, playing, start, pause, next, reset, total };
}