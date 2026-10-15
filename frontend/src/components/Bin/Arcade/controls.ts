import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { Input } from './play';

const JUMP = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK = new Set(['ArrowDown', 'KeyS']);

// A key pressed on a button or in a field belongs to that, not to the game.
const elsewhere = (target: EventTarget | null) =>
  target instanceof Element && target.closest('button, a, input, textarea, select') !== null;

// A touch on something that answers belongs to that. A button that cannot be pressed answers nothing.
const answers = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest('button:not(:disabled), a, input, textarea, select, [role="application"]') !== null;

/**
 * What the player is asking for, from the keyboard and from whatever on screen
 * stands in for it. A jump is taken once and is gone. A duck lasts while held.
 * On a touch screen anywhere under the game is a jump as well, down to the foot
 * of the screen, where the thumb is.
 */
export const useControls = (on: boolean, field?: RefObject<HTMLElement | null>) => {
  const held = useRef({ jump: false, duck: false });

  useEffect(() => {
    held.current = { jump: false, duck: false };
    if (!on) return;

    const byThumb = (event: PointerEvent) => {
      const game = field?.current;
      if (event.pointerType === 'mouse' || !game || game.closest('[inert]') || answers(event.target)) return;
      if (event.clientY > game.getBoundingClientRect().bottom) held.current.jump = true;
    };

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
    document.addEventListener('pointerdown', byThumb);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', letGo);
      document.removeEventListener('pointerdown', byThumb);
    };
  }, [on, field]);

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
