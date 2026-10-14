import { WORLD_H, overlaps, roll, type Input, type Playing, type Rect } from './play';

/**
 * The robot runs. Old hardware lies in its way, to be jumped, and now and then
 * a window flies at it at head height, to be ducked under.
 */
export const DINO = {
  goal: 250,
  floor: WORLD_H - 40,
  gravity: 1700,
  jump: -560,
  /** What ducking adds to its weight while it is in the air: it comes down sooner. */
  dive: 2800,
  speed: { first: 190, most: 400, gain: 5.5 },
  /** How much ground makes a point. */
  perPoint: 20,
  /** The least time between two things in its way, and how much longer it may be. */
  space: { least: 0.95, spread: 0.9 },
  /** No window flies before this many points, so that jumping is learnt first. */
  windowsFrom: 40,
  windowOdds: 0.3,
  /** How much faster than the ground a flying window comes. */
  windSpeed: 50,
  windLead: 90,
  bot: { x: 48, w: 34, h: 39 },
  standing: { x: 8, y: 6, w: 18, h: 33 },
  ducking: { x: 5, y: 21, w: 24, h: 18 },
} as const;

export type Kind = 'floppy' | 'floppies' | 'hourglass' | 'error' | 'monitor' | 'window';

/** How big each thing is, and how far over the ground it comes. */
export const SHAPES: Record<Kind, { w: number; h: number }> = {
  floppy: { w: 18, h: 20 },
  floppies: { w: 33, h: 23 },
  hourglass: { w: 16, h: 28 },
  error: { w: 44, h: 19 },
  monitor: { w: 30, h: 30 },
  window: { w: 28, h: 20 },
};

/** A window at head height has to be ducked under. One higher up is only in the way of a jump. */
export const FLIGHT = { head: 26, high: 64 } as const;

const ON_THE_GROUND: readonly Kind[] = ['floppy', 'floppies', 'hourglass', 'error', 'monitor'];

export interface Hazard {
  id: number;
  kind: Kind;
  x: number;
  /** How far over the ground its underside is. */
  lift: number;
}

export interface DinoState extends Playing {
  /** The top of the robot. */
  y: number;
  vy: number;
  ducking: boolean;
  speed: number;
  dist: number;
  hazards: Hazard[];
  /** How much more ground goes by before the next thing shows up. */
  until: number;
  nextId: number;
  seed: number;
}

const { floor, bot } = DINO;
const STANDING_Y = floor - bot.h;

export const createDino = (width: number, seed: number): DinoState => ({
  width,
  started: false,
  over: false,
  score: 0,
  y: STANDING_Y,
  vy: 0,
  ducking: false,
  speed: DINO.speed.first,
  dist: 0,
  hazards: [],
  until: 0,
  nextId: 0,
  seed,
});

export const onGround = (state: DinoState) => state.y >= STANDING_Y;

export const boxOf = ({ kind, x, lift }: Hazard): Rect => {
  const { w, h } = SHAPES[kind];
  return { x, y: floor - lift - h, w, h };
};

/** The part of the robot that counts. Ducked, that is a lower and longer part of it. */
export const bodyOf = (state: Pick<DinoState, 'y' | 'ducking'>): Rect => {
  const part = state.ducking && state.y >= STANDING_Y ? DINO.ducking : DINO.standing;
  return { x: bot.x + part.x, y: state.y + part.y, w: part.w, h: part.h };
};

export const stepDino = (state: DinoState, input: Input, dt: number): DinoState => {
  if (state.over) return state;
  if (!state.started && !input.jump) return { ...state, ducking: input.duck };

  const grounded = onGround(state);
  const weight = DINO.gravity + (input.duck && !grounded ? DINO.dive : 0);
  let vy = grounded && input.jump ? DINO.jump : state.vy + weight * dt;
  let y = state.y + vy * dt;
  if (y >= STANDING_Y) {
    y = STANDING_Y;
    vy = 0;
  }

  const speed = Math.min(DINO.speed.most, state.speed + DINO.speed.gain * dt);
  const by = speed * dt;
  const dist = state.dist + by;
  const score = Math.floor(dist / DINO.perPoint);

  let { seed, nextId, until } = state;
  const hazards = state.hazards
    .map((hazard) => ({
      ...hazard,
      x: hazard.x - by - (hazard.kind === 'window' ? DINO.windSpeed * dt : 0),
    }))
    .filter((hazard) => hazard.x + SHAPES[hazard.kind].w > -8);

  until -= by;
  if (until <= 0) {
    const [kindChance, afterKind] = roll(seed);
    const [liftChance, afterLift] = roll(afterKind);
    const [spaceChance, afterSpace] = roll(afterLift);
    seed = afterSpace;

    const flies = score >= DINO.windowsFrom && kindChance < DINO.windowOdds;
    const kind = flies
      ? 'window'
      : ON_THE_GROUND[Math.floor(liftChance * ON_THE_GROUND.length) % ON_THE_GROUND.length];
    const lift = flies ? (liftChance < 0.72 ? FLIGHT.head : FLIGHT.high) : 0;
    // A window gains on what is ahead of it, so it sets off from further back.
    hazards.push({ id: nextId, kind, x: state.width + 12 + (flies ? DINO.windLead : 0), lift });
    nextId += 1;
    until = speed * (DINO.space.least + spaceChance * DINO.space.spread);
  }

  const ducking = input.duck;
  const body = bodyOf({ y, ducking });
  const over = hazards.some((hazard) => overlaps(body, boxOf(hazard)));

  return {
    ...state,
    started: true,
    over,
    score,
    y,
    vy,
    ducking,
    speed,
    dist,
    hazards,
    until,
    nextId,
    seed,
  };
};
