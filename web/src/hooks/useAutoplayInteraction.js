import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_RESUME_DELAY = 1500;

/**
 * Pausa un autoplay mientras el usuario interactúa con su región.
 * El hover se mantiene pausado hasta salir; clic, touch y arrastre reanudan
 * después de un breve periodo de inactividad.
 */
export default function useAutoplayInteraction(resumeDelay = DEFAULT_RESUME_DELAY) {
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimer = useRef(null);
  const interaction = useRef({
    hovering: false,
    pointerDown: false,
  });

  const clearResumeTimer = useCallback(() => {
    if (resumeTimer.current !== null) {
      window.clearTimeout(resumeTimer.current);
      resumeTimer.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    clearResumeTimer();
    setIsPaused(true);
  }, [clearResumeTimer]);

  const resumeAfterInactivity = useCallback(() => {
    clearResumeTimer();
    if (interaction.current.hovering || interaction.current.pointerDown) return;

    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = null;
      setIsPaused(false);
    }, resumeDelay);
  }, [clearResumeTimer, resumeDelay]);

  useEffect(() => clearResumeTimer, [clearResumeTimer]);
  useEffect(() => {
    const finishPointerInteraction = () => {
      if (!interaction.current.pointerDown) return;
      interaction.current.pointerDown = false;
      resumeAfterInactivity();
    };

    // También termina correctamente si el usuario suelta el puntero fuera de
    // la región (un clic sin arrastre no siempre conserva pointer capture).
    window.addEventListener('pointerup', finishPointerInteraction);
    window.addEventListener('pointercancel', finishPointerInteraction);
    return () => {
      window.removeEventListener('pointerup', finishPointerInteraction);
      window.removeEventListener('pointercancel', finishPointerInteraction);
    };
  }, [resumeAfterInactivity]);

  const interactionProps = {
    onPointerEnter: (event) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        interaction.current.hovering = true;
        pause();
      }
    },
    onPointerLeave: (event) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        interaction.current.hovering = false;
        resumeAfterInactivity();
      }
    },
    onPointerDown: () => {
      interaction.current.pointerDown = true;
      pause();
    },
    onPointerMove: () => {
      if (interaction.current.pointerDown) pause();
    },
    onPointerUp: () => {
      interaction.current.pointerDown = false;
      resumeAfterInactivity();
    },
    onPointerCancel: () => {
      interaction.current.pointerDown = false;
      resumeAfterInactivity();
    },
    onClick: () => {
      pause();
      resumeAfterInactivity();
    },
    // Se mantienen explícitos además de Pointer Events para navegadores táctiles
    // antiguos y para que la intención de pausa en touch sea inequívoca.
    onTouchStart: pause,
    onTouchEnd: resumeAfterInactivity,
    onTouchCancel: resumeAfterInactivity,
  };

  return { isPaused, interactionProps };
}
