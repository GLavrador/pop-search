const ROBOT_W = 46;
const EDGE = 6;
// Two lines of it, and how far down the screen the head has to be for them to fit over it.
const TALL = 44;
const HEADROOM = 48;
// Over the head it starts this far in from the shoulder and ends this far under the top of it.
const OVER = { in: 8, down: 3 };
// Beside the head it starts this far out from the shoulder, this far under the top of it.
const BESIDE = { out: 2, down: 4 };
// With this much to its right it stays there. Beside the head that is the side
// away from what it is working on, so it takes less to keep it.
const AT_EASE = 180;
const SNUG = 96;
// The corner the skip button is in. On a screen narrower than the other figure
// the icons run along the top towards it, and so does whatever is muttered by them.
const CORNER = { w: 90, h: 38 };
const NARROW = 520;

export interface EmoteSpot {
  /** Beside the head, for want of room over it. */
  low: boolean;
  side: 'left' | 'right';
  /** How wide it can be before it has to break in two lines. */
  room: number;
  /** How far under the top of the head it starts, when beside it. */
  drop: number;
}

/** Where what the robot mutters goes, so that all of it stays on the screen and off the skip button. */
export const emoteSpot = (x: number, y: number, screen: number): EmoteSpot => {
  const low = y < HEADROOM;
  const under = screen < NARROW ? CORNER.h - y : 0;
  const drop = low ? Math.max(BESIDE.down, under) : 0;
  const top = low ? y + drop : y + OVER.down - TALL;
  const inset = low ? -BESIDE.out : OVER.in;
  const right = screen - (top < CORNER.h ? CORNER.w : EDGE) - (x + ROBOT_W - inset);
  const left = x + inset - EDGE;
  const side = right >= (low ? SNUG : AT_EASE) || right >= left ? 'right' : 'left';
  return { low, side, room: Math.max(side === 'right' ? right : left, 0), drop };
};
