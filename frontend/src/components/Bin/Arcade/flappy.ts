import { WORLD_H, overlaps, roll, type Input, type Playing, type Rect } from './play';

/**
 * The robot flies between menus: the ones that drop from the menu bar above,
 * and the Start menus that open from the taskbar below.
 */
export const FLAPPY = {
  goal: 10,
  /** The underside of the menu bar. Nothing flies higher. */
  ceiling: 14,
  /** The top of the taskbar. Touching it ends the flight. */
  floor: WORLD_H - 24,
  gravity: 760,
  flap: -236,
  fall: 400,
  /** How long its jets burn at full after each flap, in seconds. */
  flare: 0.17,
  speed: 118,
  /** How far apart the menus open, and how much room there is between each pair. */
  every: 176,
  gap: 86,
  menu: { w: 40, least: 18 },
  bot: { x: 70, w: 30, h: 35 },
  /** The part of the robot that counts: its head and body, not its antenna or its arms. */
  hit: { x: 6, y: 8, w: 18, h: 24 },
} as const;

export interface Menus {
  id: number;
  x: number;
  /** The middle of the room left between the two of them. */
  gap: number;
  passed: boolean;
}

export interface FlappyState extends Playing {
  /** The top of the robot. */
  y: number;
  vy: number;
  /** How much longer the jets burn at full for the last flap. Nothing, between flaps. */
  flare: number;
  menus: Menus[];
  nextId: number;
  seed: number;
  /** How far the world has gone by, for whatever only scrolls. */
  dist: number;
}

const { ceiling, floor, gap, menu, bot, hit } = FLAPPY;

const gapAt = (chance: number) => {
  const low = ceiling + menu.least + gap / 2;
  const high = floor - menu.least - gap / 2;
  return low + chance * (high - low);
};

export const createFlappy = (width: number, seed: number): FlappyState => ({
  width,
  started: false,
  over: false,
  score: 0,
  y: (ceiling + floor - bot.h) / 2,
  vy: 0,
  flare: 0,
  menus: [],
  nextId: 0,
  seed,
  dist: 0,
});

/** The two menus of a pair, as the boxes the robot must not touch. */
export const boxesOf = (pair: Menus): [Rect, Rect] => [
  { x: pair.x, y: ceiling, w: menu.w, h: pair.gap - gap / 2 - ceiling },
  { x: pair.x, y: pair.gap + gap / 2, w: menu.w, h: floor - pair.gap - gap / 2 },
];

export const stepFlappy = (state: FlappyState, input: Input, dt: number): FlappyState => {
  // Knocked out of the air, it drops to the taskbar and stays there.
  if (state.over) {
    const vy = Math.min(state.vy + FLAPPY.gravity * dt, FLAPPY.fall * 1.4);
    return { ...state, vy, flare: 0, y: Math.min(state.y + vy * dt, floor - bot.h) };
  }
  if (!state.started && !input.jump) return state;

  const vy = input.jump ? FLAPPY.flap : Math.min(state.vy + FLAPPY.gravity * dt, FLAPPY.fall);
  const y = Math.max(ceiling, state.y + vy * dt);
  const by = FLAPPY.speed * dt;

  let { seed, nextId, score } = state;
  const menus = state.menus
    .map((pair) => ({ ...pair, x: pair.x - by }))
    .filter((pair) => pair.x + menu.w > -8);

  const last = menus[menus.length - 1];
  if (!last || last.x <= state.width + 24 - FLAPPY.every) {
    const [chance, next] = roll(seed);
    seed = next;
    menus.push({
      id: nextId,
      x: last ? last.x + FLAPPY.every : state.width + 24,
      gap: gapAt(chance),
      passed: false,
    });
    nextId += 1;
  }

  const body: Rect = { x: bot.x + hit.x, y: y + hit.y, w: hit.w, h: hit.h };
  for (const pair of menus) {
    if (!pair.passed && pair.x + menu.w < body.x) {
      pair.passed = true;
      score += 1;
    }
  }

  const grounded = y + bot.h >= floor;
  const hitMenu = menus.some((pair) => boxesOf(pair).some((box) => overlaps(body, box)));

  return {
    ...state,
    started: true,
    over: grounded || hitMenu,
    score,
    y: grounded ? floor - bot.h : y,
    vy: y === ceiling && vy < 0 ? 0 : vy,
    flare: input.jump ? FLAPPY.flare : Math.max(0, state.flare - dt),
    menus,
    nextId,
    seed,
    dist: state.dist + by,
  };
};
