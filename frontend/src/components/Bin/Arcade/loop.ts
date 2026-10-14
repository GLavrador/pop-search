import { useEffect, useRef } from 'react';

// The game moves in steps this long whatever the screen draws at, so it plays the same on any of them.
export const STEP = 1 / 120;
// A frame that took longer than this is a pause, not a leap forward.
const MOST = 0.1;

interface Loop {
  /** Moves the game on by one step of time. */
  step: (dt: number) => void;
  /** Shows where it got to. Once a frame, however many steps that frame took. */
  draw: () => void;
}

/** Runs a game for as long as it is on, and not at all while the page is out of sight. */
export const useGameLoop = (on: boolean, loop: Loop) => {
  const live = useRef(loop);

  useEffect(() => {
    live.current = loop;
  });

  useEffect(() => {
    if (!on) return;

    let frame = 0;
    let last: number | null = null;
    let owed = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (last !== null) owed += Math.min(MOST, Math.max(0, (now - last) / 1000));
      last = now;
      if (owed < STEP) return;
      while (owed >= STEP) {
        live.current.step(STEP);
        owed -= STEP;
      }
      live.current.draw();
    };
    // Back in sight, it carries on from where it was and not from where it would have got to.
    const onSight = () => {
      last = null;
    };

    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onSight);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', onSight);
    };
  }, [on]);
};
