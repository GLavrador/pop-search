import { useSyncExternalStore } from 'react';
import { CUES, type Cue } from './cues';

const OFF_KEY = 'pop-search:sound-off';
const VOLUME = 1;
// A sound this soon after a louder one would be lost under it.
const CROWD_MS = 150;
// What a press of the keyboard clicks on, as the pointer would: anything that does something.
const PRESSABLE =
  'button:not(:disabled), [role="tab"], a[href], input[type="checkbox"]:not(:disabled), select, summary, [data-robot-zone]';

const readOff = () => {
  try {
    return localStorage.getItem(OFF_KEY) !== null;
  } catch {
    return false;
  }
};

let off = readOff();
let context: AudioContext | null = null;
let master: GainNode | null = null;
let last = { at: -Infinity, rank: -1 };
const listeners = new Set<() => void>();

// Browsers let a page make sound only after the person has done something on it.
const wake = async () => {
  if (!context) {
    const Audio = window.AudioContext;
    if (!Audio) return;
    context = new Audio();
    master = context.createGain();
    master.gain.value = VOLUME;
    master.connect(context.destination);
  }
  if (context.state === 'suspended') await context.resume();
};

export const play = (cue: Cue) => {
  if (off || !context || !master || context.state !== 'running') return;
  if (document.visibilityState === 'hidden') return;

  const now = performance.now();
  const { rank, make } = CUES[cue];
  if (now - last.at < CROWD_MS && rank <= last.rank) return;
  last = { at: now, rank };
  make(context, master, context.currentTime + 0.01);
};

export const setSoundOn = (on: boolean) => {
  off = !on;
  try {
    if (off) localStorage.setItem(OFF_KEY, '1');
    else localStorage.removeItem(OFF_KEY);
  } catch {
    // Kept for this visit only.
  }
  listeners.forEach((listener) => listener());
  if (on) void wake().then(() => play('ding'));
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSoundOn = () => useSyncExternalStore(subscribe, () => !off);

/**
 * Every press of the mouse clicks, on something or on nothing, the first one
 * included. A finger clicks on a tap, not on the start of a scroll; a key, on
 * what it presses. Answers with the way to stop listening.
 */
export const installSound = () => {
  let finger = false;
  const pointed = (event: PointerEvent) => {
    finger = event.pointerType === 'touch';
    void wake().then(() => {
      if (!finger) play('click');
    });
  };
  const typed = () => {
    void wake();
  };
  const pressed = (event: MouseEvent) => {
    const fromKeyboard = event.detail === 0;
    const onSomething = event.target instanceof Element && event.target.closest(PRESSABLE) !== null;
    if (fromKeyboard ? onSomething : finger) play('click');
  };
  document.addEventListener('pointerdown', pointed, { capture: true });
  document.addEventListener('keydown', typed, { capture: true });
  document.addEventListener('click', pressed, { capture: true });

  return () => {
    document.removeEventListener('pointerdown', pointed, { capture: true });
    document.removeEventListener('keydown', typed, { capture: true });
    document.removeEventListener('click', pressed, { capture: true });
  };
};
