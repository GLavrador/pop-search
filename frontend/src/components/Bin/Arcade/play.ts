/** What the player is asking for this instant: a jump just pressed, and a duck for as long as it is held. */
export interface Input {
  jump: boolean;
  duck: boolean;
}

/** What every game here keeps, whatever else it does. */
export interface Playing {
  /** How wide the world is, in the same units its height is fixed in. */
  width: number;
  /** False until the first jump: the game waits for the player to be ready. */
  started: boolean;
  over: boolean;
  score: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Every world is this tall. How wide it is depends on the screen it is played on. */
export const WORLD_H = 240;

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

/**
 * The next number of a sequence that depends only on where it started, from 0
 * up to 1, and the seed that gives the one after. A game played from the same
 * seed is the same game.
 */
export const roll = (seed: number): [number, number] => {
  const next = (seed + 0x6d2b79f5) | 0;
  let mixed = Math.imul(next ^ (next >>> 15), 1 | next);
  mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
  return [((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296, next];
};
