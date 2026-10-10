export interface Point {
  x: number;
  y: number;
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Flight {
  from: Point;
  bend: Point;
  to: Point;
  start: number;
  duration: number;
}

export type Side = 'above' | 'left' | 'right' | 'below';

const MAX_LEAN = 22;
const MAX_ARC = 190;
const WIDE = 4;
const SQUEEZE = 12;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);

/**
 * `swerve` bows the path away from the straight line: 0 flies direct, 1 takes a
 * wide arc, and the sign picks the side it bows to.
 */
export const planFlight = (from: Point, to: Point, start: number, swerve: number): Flight => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  const arc = Math.min(distance * 0.38, MAX_ARC) * swerve;
  const normal = distance ? { x: -dy / distance, y: dx / distance } : { x: 0, y: 0 };

  return {
    from,
    to,
    bend: { x: from.x + dx / 2 + normal.x * arc, y: from.y + dy / 2 + normal.y * arc },
    start,
    duration: distance ? clamp(380 + distance * 1.3, 520, 1500) : 0,
  };
};

/** Pulls the arc back in so the middle of the flight stays inside `bounds`. */
export const contain = (flight: Flight, bounds: Box): Flight => {
  const pull = (from: number, bend: number, to: number, low: number, high: number) => {
    const middle = (from + 2 * bend + to) / 4;
    return bend + (clamp(middle, low, high) - middle) * 2;
  };

  return {
    ...flight,
    bend: {
      x: pull(flight.from.x, flight.bend.x, flight.to.x, bounds.left, bounds.right),
      y: pull(flight.from.y, flight.bend.y, flight.to.y, bounds.top, bounds.bottom),
    },
  };
};

/** The swerve sign that makes the arc rise instead of dip. */
export const climbing = (from: Point, to: Point) => (to.x > from.x ? -1 : 1);

/** Bends a flight already under way toward a destination that has moved. */
export const retarget = (flight: Flight, to: Point): Flight => ({
  ...flight,
  to,
  bend: {
    x: flight.bend.x + (to.x - flight.to.x) / 2,
    y: flight.bend.y + (to.y - flight.to.y) / 2,
  },
});

export const progressOf = (flight: Flight, now: number) =>
  flight.duration ? clamp((now - flight.start) / flight.duration, 0, 1) : 1;

export const positionAt = (flight: Flight, now: number): Point => {
  const t = ease(progressOf(flight, now));
  const u = 1 - t;

  return {
    x: u * u * flight.from.x + 2 * u * t * flight.bend.x + t * t * flight.to.x,
    y: u * u * flight.from.y + 2 * u * t * flight.bend.y + t * t * flight.to.y,
  };
};

/** Degrees of tilt for a horizontal speed in px per second: it banks into the move. */
export const leanFor = (speedX: number) => clamp(speedX * 0.05, -MAX_LEAN, MAX_LEAN);

/**
 * Where to stand so the control itself stays uncovered: on top of it when there
 * is room inside the stage, beside or under it otherwise.
 */
export const perchBy = (
  control: Box,
  stage: Box | null,
  size: Size,
  prefer?: Side,
): { at: Point; side: Side } => {
  const wide = control.right - control.left > size.w * WIDE;
  const x = wide ? control.right - size.w - 10 : (control.left + control.right - size.w) / 2;
  const y = (control.top + control.bottom - size.h) / 2;

  const spots: { side: Side; at: Point }[] = [
    { side: 'above', at: { x, y: control.top - size.h } },
    { side: 'left', at: { x: control.left - size.w - 6, y } },
    { side: 'right', at: { x: control.right + 6, y } },
    { side: 'below', at: { x, y: control.bottom } },
  ];
  spots.sort((a, b) => Number(b.side === prefer) - Number(a.side === prefer));

  if (!stage) return spots[0];

  // A spot that only just misses still counts: it gets nudged back inside below.
  const fits = ({ at }: { at: Point }) =>
    at.x >= stage.left - SQUEEZE &&
    at.x + size.w <= stage.right + SQUEEZE &&
    at.y >= stage.top - SQUEEZE &&
    at.y + size.h <= stage.bottom + SQUEEZE;
  const spot = spots.find(fits) ?? spots[0];

  return {
    side: spot.side,
    at: {
      x: clamp(spot.at.x, stage.left, Math.max(stage.left, stage.right - size.w)),
      y: clamp(spot.at.y, stage.top, Math.max(stage.top, stage.bottom - size.h)),
    },
  };
};
