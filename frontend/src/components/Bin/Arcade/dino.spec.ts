import { describe, it, expect } from 'vitest';
import {
  DINO,
  FLIGHT,
  SHAPES,
  bodyOf,
  boxOf,
  createDino,
  onGround,
  stepDino,
  type DinoState,
  type Hazard,
} from './dino';
import { STEP } from './loop';
import { overlaps, type Input } from './play';

const IDLE: Input = { jump: false, duck: false };
const JUMP: Input = { jump: true, duck: false };
const DUCK: Input = { jump: false, duck: true };
const WIDTH = 384;

const { bot, floor } = DINO;

// Jumps what lies on the ground and ducks what flies at its head, each when it is close.
const pilot = (state: DinoState): Input => {
  const ahead = state.hazards.find((hazard) => hazard.x + SHAPES[hazard.kind].w > bot.x + 6);
  if (!ahead) return { jump: !state.started, duck: false };
  const away = ahead.x - (bot.x + 26);
  if (ahead.kind !== 'window') return { jump: !state.started || away < state.speed * 0.16, duck: false };
  return { jump: false, duck: ahead.lift === FLIGHT.head && away < state.speed * 0.3 };
};

const play = (
  state: DinoState,
  seconds: number,
  input: (state: DinoState) => Input = () => IDLE,
) => {
  let now = state;
  for (let i = 0; i < seconds / STEP && !now.over; i += 1) now = stepDino(now, input(now), STEP);
  return now;
};

const running = (hazards: Hazard[] = []): DinoState => ({
  ...stepDino(createDino(WIDTH, 1), JUMP, STEP),
  y: floor - bot.h,
  vy: 0,
  hazards,
  until: 100000,
});

describe('dino', () => {
  it('should stand still until the first jump', () => {
    const waited = play(createDino(WIDTH, 1), 3);

    expect(waited.started).toBe(false);
    expect(waited.dist).toBe(0);
    expect(waited.hazards).toHaveLength(0);
  });

  it('should jump from the ground and come back down to it', () => {
    const up = play(running(), 0.3, (state) => (onGround(state) ? JUMP : IDLE));
    const down = play(up, 0.6);

    expect(up.y).toBeLessThan(floor - bot.h - 60);
    expect(onGround(down)).toBe(true);
  });

  it('should not jump again in the air', () => {
    const once = play(running(), 0.5, (state) => (onGround(state) ? JUMP : IDLE));
    const mashed = play(running(), 0.5, () => JUMP);

    expect(mashed.y).toBeCloseTo(once.y, 5);
  });

  it('should come down sooner when it ducks in the air', () => {
    const start = stepDino(running(), JUMP, STEP);

    const floated = play(start, 0.45);
    const dived = play(start, 0.45, () => DUCK);

    expect(onGround(floated)).toBe(false);
    expect(onGround(dived)).toBe(true);
  });

  it('should count ground gone by, and get faster as it goes', () => {
    const ran = play(running(), 4);

    expect(ran.speed).toBeGreaterThan(DINO.speed.first);
    expect(ran.score).toBe(Math.floor(ran.dist / DINO.perPoint));
    expect(ran.score).toBeGreaterThan(30);
  });

  it('should never go faster than its top speed', () => {
    const state = { ...running(), speed: DINO.speed.most - 0.01 };

    expect(play(state, 2).speed).toBe(DINO.speed.most);
  });

  it('should end on what lies in its way', () => {
    const blocked = running([{ id: 0, kind: 'monitor', x: bot.x + 4, lift: 0 }]);

    expect(stepDino(blocked, IDLE, STEP).over).toBe(true);
  });

  it('should clear what lies in its way with a jump in time', () => {
    const state = running([{ id: 0, kind: 'error', x: bot.x + 60, lift: 0 }]);

    const cleared = play(state, 1, pilot);

    expect(cleared.over).toBe(false);
    expect(cleared.hazards).toHaveLength(0);
  });

  it('should be hit by a window at head height standing, and pass under it ducked', () => {
    const coming: Hazard = { id: 0, kind: 'window', x: bot.x + 6, lift: FLIGHT.head };

    expect(stepDino(running([coming]), IDLE, STEP).over).toBe(true);
    expect(stepDino(running([coming]), DUCK, STEP).over).toBe(false);
  });

  it('should pass under a window that flies high, unless it jumps into it', () => {
    const high: Hazard = { id: 0, kind: 'window', x: bot.x + 40, lift: FLIGHT.high };

    const under = play(running([high]), 0.5);
    const into = play(running([high]), 0.5, (state) => (onGround(state) ? JUMP : IDLE));

    expect(under.over).toBe(false);
    expect(into.over).toBe(true);
  });

  it('should take a lower, longer shape when it ducks on the ground', () => {
    const standing = bodyOf({ y: floor - bot.h, ducking: false });
    const ducked = bodyOf({ y: floor - bot.h, ducking: true });
    const window = boxOf({ id: 0, kind: 'window', x: ducked.x, lift: FLIGHT.head });

    expect(ducked.h).toBeLessThan(standing.h);
    expect(ducked.y + ducked.h).toBe(floor);
    expect(overlaps(standing, window)).toBe(true);
    expect(overlaps(ducked, window)).toBe(false);
  });

  it('should send no window before jumping has been learnt', () => {
    let state = stepDino(createDino(WIDTH, 4), JUMP, STEP);
    const kinds = new Set<string>();
    while (!state.over && state.score < DINO.windowsFrom) {
      state = stepDino(state, pilot(state), STEP);
      state.hazards.forEach((hazard) => kinds.add(hazard.kind));
    }

    expect(state.over).toBe(false);
    expect(kinds.has('window')).toBe(false);
  });

  it.each([1, 2, 3, 4, 5])(
    'should let a player who reacts in time get well past the goal, from seed %i',
    (seed) => {
      const ran = play(createDino(WIDTH, seed), 60, pilot);

      expect(ran.over).toBe(false);
      expect(ran.score).toBeGreaterThan(DINO.goal * 2);
    },
  );

  it('should send windows as well, once the run is under way', () => {
    let state = createDino(WIDTH, 2);
    const kinds = new Set<string>();
    for (let i = 0; i < 60 / STEP && !state.over; i += 1) {
      state = stepDino(state, pilot(state), STEP);
      state.hazards.forEach((hazard) => kinds.add(`${hazard.kind}:${hazard.lift}`));
    }

    expect(kinds.has(`window:${FLIGHT.head}`)).toBe(true);
    expect(kinds.has(`window:${FLIGHT.high}`)).toBe(true);
    expect([...kinds].filter((kind) => !kind.startsWith('window')).length).toBeGreaterThanOrEqual(4);
  });

  it('should play the same run again from the same seed', () => {
    const once = play(createDino(WIDTH, 9), 15, pilot);
    const twice = play(createDino(WIDTH, 9), 15, pilot);

    expect(twice.hazards).toEqual(once.hazards);
    expect(twice.dist).toBe(once.dist);
  });
});
