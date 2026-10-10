import type { Point } from './flight';

/** The robot hanging from the pointer: a weight on a short rod, pulled around by its top. */
export interface Hang {
  bob: Point;
  /** In px per second. */
  speed: Point;
}

export interface Sample extends Point {
  at: number;
}

const ROD = 110;
const GRAVITY = 4400;
const AIR = 2.2;
const STEP = 8;
const MAX_SWING = 1.15;
const MAX_SPEED = 4000;

const THROW_WINDOW = 110;
const PAUSE = 90;
const MAX_THROW = 1500;

const BRAKES = 4.4;
const STIFFNESS = 190;
const GRIP = 7.6;

const STILL: Point = { x: 0, y: 0 };

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

const capped = (speed: Point, limit: number): Point => {
  const size = Math.hypot(speed.x, speed.y);
  return size > limit ? { x: (speed.x / size) * limit, y: (speed.y / size) * limit } : speed;
};

export const hangFrom = (pivot: Point): Hang => ({
  bob: { x: pivot.x, y: pivot.y + ROD },
  speed: STILL,
});

/**
 * Moves the weight on by `dt` ms while the pivot travels from one point to the
 * other. The rod keeps its length, so a pivot that moves drags the weight along
 * and gravity swings it back.
 */
export const swing = (hang: Hang, from: Point, to: Point, dt: number): Hang => {
  const steps = Math.max(1, Math.round(dt / STEP));
  const h = dt / steps / 1000;
  let { bob, speed } = hang;

  for (let i = 1; i <= steps; i += 1) {
    const pivot = {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    };
    const drag = 1 - AIR * h;
    const dx = bob.x + speed.x * drag * h - pivot.x;
    const dy = bob.y + (speed.y + GRAVITY * h) * drag * h - pivot.y;

    // Past this it would go over the top, which a robot held by the head does not do.
    const angle = clamp(Math.atan2(dx, dy), -MAX_SWING, MAX_SWING);
    const next = { x: pivot.x + Math.sin(angle) * ROD, y: pivot.y + Math.cos(angle) * ROD };

    speed = capped({ x: (next.x - bob.x) / h, y: (next.y - bob.y) / h }, MAX_SPEED);
    bob = next;
  }
  return { bob, speed };
};

/** How far the body is turned, in radians. Positive swings its feet to the left. */
export const angleOf = (hang: Hang, pivot: Point) =>
  Math.atan2(pivot.x - hang.bob.x, hang.bob.y - pivot.y);

/** How fast the pointer was going when it let go, in px per second. Nothing after a pause. */
export const throwOf = (trail: readonly Sample[], now: number): Point => {
  const last = trail[trail.length - 1];
  if (!last || now - last.at > PAUSE) return STILL;

  const first = trail.find((sample) => last.at - sample.at <= THROW_WINDOW) ?? last;
  const span = last.at - first.at;
  if (span < 12) return STILL;

  return capped(
    { x: ((last.x - first.x) / span) * 1000, y: ((last.y - first.y) / span) * 1000 },
    MAX_THROW,
  );
};

/** One frame of sliding to a stop under its own thrusters. */
export const coast = (at: Point, speed: Point, dt: number): { at: Point; speed: Point } => {
  const h = dt / 1000;
  const keep = Math.exp(-BRAKES * h);
  return {
    at: { x: at.x + speed.x * h, y: at.y + speed.y * h },
    speed: { x: speed.x * keep, y: speed.y * keep },
  };
};

/** A stiff, slightly loose spring back to upright: it wobbles once or twice before it is still. */
export const steady = (angle: number, rate: number, dt: number): { angle: number; rate: number } => {
  const steps = Math.max(1, Math.round(dt / STEP));
  const h = dt / steps / 1000;
  for (let i = 0; i < steps; i += 1) {
    rate += (-STIFFNESS * angle - GRIP * rate) * h;
    angle += rate * h;
  }
  return { angle, rate };
};
