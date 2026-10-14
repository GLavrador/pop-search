import { useCallback, useEffect, useRef } from 'react';
import type { Input } from './play';

const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK = new Set(['ArrowDown', 'KeyS']);

// A key pressed on a button or in a field belongs to that, not to the game.
const elsewhere = (target: EventTarget | null) =>
  target instanceof Element && target.closest('button, a, input, textarea, select') !== null;

/**
 * What the player is asking for, from the keyboard and from whatever on screen
 * stands in for it. A jump is taken once and is gone. A duck lasts while held.
 */
export const useControls = (on: boolean) => {
  const held = useRef({ jump: false, duck: false });

  useEffect(() => {
    held.current = { jump: false, duck: false };
    if (!on) return;

    const onDown = (event: KeyboardEvent) => {
      const jump = JUMP.has(event.code);
      if ((!jump && !DUCK.has(event.code)) || elsewhere(event.target)) return;
      // The page must not scroll under the game.
      event.preventDefault();
      if (jump && !event.repeat) held.current.jump = true;
      if (!jump) held.current.duck = true;
    };
    const onUp = (event: KeyboardEvent) => {
      if (DUCK.has(event.code)) held.current.duck = false;
    };
    const letGo = () => {
      held.current.duck = false;
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', letGo);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', letGo);
    };
  }, [on]);

  const take = useCallback((): Input => {
    const now = { ...held.current };
    held.current.jump = false;
    return now;
  }, []);
  const jump = useCallback(() => {
    held.current.jump = true;
  }, []);
  const duck = useCallback((down: boolean) => {
    held.current.duck = down;
  }, []);

  return { take, jump, duck };
};
