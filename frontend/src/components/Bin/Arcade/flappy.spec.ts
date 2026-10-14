import { describe, it, expect } from 'vitest';
import { FLAPPY, boxesOf, createFlappy, stepFlappy, type FlappyState } from './flappy';
import { STEP } from './loop';
import type { Input } from './play';

const IDLE: Input = { jump: false, duck: false };
const FLAP: Input = { jump: true, duck: false };
const WIDTH = 384;

const { bot, hit, menu, gap, floor, ceiling } = FLAPPY;

// Flaps when its feet come near the menu under the next gap, and at no other time.
const pilot = (state: FlappyState): Input => {
  const ahead = state.menus.find((pair) => pair.x + menu.w > bot.x + hit.x);
  const low = (ahead?.gap ?? (ceiling + floor) / 2) + gap / 2 - 12;
  const feet = state.y + hit.y + hit.h;
  return { jump: !state.started || (state.vy >= 0 && feet > low), duck: false };
};

const play = (
  state: FlappyState,
  seconds: number,
  input: (state: FlappyState) => Input = () => IDLE,
) => {
  let now = state;
  for (let i = 0; i < seconds / STEP && !now.over; i += 1) now = stepFlappy(now, input(now), STEP);
  return now;
};

describe('flappy', () => {
  it('should wait in the air until the first flap', () => {
    const start = createFlappy(WIDTH, 1);

    const waited = play(start, 3);

    expect(waited.started).toBe(false);
    expect(waited.y).toBe(start.y);
    expect(waited.menus).toHaveLength(0);
  });

  it('should rise on a flap and fall back without another', () => {
    const start = stepFlappy(createFlappy(WIDTH, 1), FLAP, STEP);

    const up = play(start, 0.2);
    const down = play(up, 0.6);

    expect(start.started).toBe(true);
    expect(up.y).toBeLessThan(start.y);
    expect(down.y).toBeGreaterThan(up.y);
  });

  it('should burn its jets at full for an instant on each flap, and not between them', () => {
    const start = createFlappy(WIDTH, 1);
    expect(start.flare).toBe(0);

    const flapped = stepFlappy(start, FLAP, STEP);
    const soonAfter = play(flapped, FLAPPY.flare / 2);
    const later = play(flapped, FLAPPY.flare + 0.05);
    const again = stepFlappy(later, FLAP, STEP);

    expect(flapped.flare).toBe(FLAPPY.flare);
    expect(soonAfter.flare).toBeGreaterThan(0);
    expect(soonAfter.flare).toBeLessThan(FLAPPY.flare);
    expect(later.flare).toBe(0);
    expect(again.flare).toBe(FLAPPY.flare);
  });

  it('should end on the taskbar when nothing holds it up', () => {
    const fell = play(stepFlappy(createFlappy(WIDTH, 1), FLAP, STEP), 5);

    expect(fell.over).toBe(true);
    expect(fell.y).toBe(floor - bot.h);
    expect(fell.score).toBe(0);
  });

  it('should not fly higher than the menu bar, and not end there either', () => {
    const high = play(createFlappy(WIDTH, 1), 0.5, () => FLAP);

    expect(high.y).toBe(ceiling);
    expect(high.over).toBe(false);
  });

  it('should open the menus one after the other, each pair a fixed way apart', () => {
    const flown = play(createFlappy(WIDTH, 3), 4, pilot);

    const [first, second] = flown.menus;
    expect(flown.menus.length).toBeGreaterThanOrEqual(2);
    expect(second.x - first.x).toBeCloseTo(FLAPPY.every, 5);
    flown.menus.forEach((pair) => {
      const [down, up] = boxesOf(pair);
      expect(down.h).toBeGreaterThanOrEqual(menu.least - 0.001);
      expect(up.h).toBeGreaterThanOrEqual(menu.least - 0.001);
      expect(up.y - (down.y + down.h)).toBeCloseTo(gap, 5);
    });
  });

  it('should end the flight on a menu', () => {
    const start = stepFlappy(createFlappy(WIDTH, 1), FLAP, STEP);
    const inTheWay = {
      ...start,
      y: 20,
      vy: 0,
      menus: [{ id: 0, x: bot.x, gap: 150, passed: false }],
    };

    expect(stepFlappy(inTheWay, IDLE, STEP).over).toBe(true);
  });

  it('should count a point for each pair it gets past, once', () => {
    const start = stepFlappy(createFlappy(WIDTH, 1), FLAP, STEP);
    const mid = (ceiling + floor) / 2;
    const behind = {
      ...start,
      y: mid - bot.h / 2,
      vy: 0,
      menus: [{ id: 0, x: bot.x + hit.x - menu.w - 1, gap: mid, passed: false }],
    };

    const after = stepFlappy(behind, FLAP, STEP);
    const later = stepFlappy(after, IDLE, STEP);

    expect(after.score).toBe(1);
    expect(later.score).toBe(1);
  });

  it.each([1, 2, 3, 4, 5])(
    'should let a player who flaps in time get well past the goal, from seed %i',
    (seed) => {
      const flown = play(createFlappy(WIDTH, seed), 40, pilot);

      expect(flown.over).toBe(false);
      expect(flown.score).toBeGreaterThan(FLAPPY.goal * 2);
    },
  );

  it('should play the same game again from the same seed', () => {
    const once = play(createFlappy(WIDTH, 9), 12, pilot);
    const twice = play(createFlappy(WIDTH, 9), 12, pilot);
    const other = play(createFlappy(WIDTH, 10), 12, pilot);

    expect(twice.menus).toEqual(once.menus);
    expect(other.menus.map((pair) => pair.gap)).not.toEqual(once.menus.map((pair) => pair.gap));
  });

  it('should fall to the taskbar after the hit, and stay over', () => {
    const start = stepFlappy(createFlappy(WIDTH, 1), FLAP, STEP);
    const hitHigh = stepFlappy(
      { ...start, y: 20, vy: 0, menus: [{ id: 0, x: bot.x, gap: 150, passed: false }] },
      IDLE,
      STEP,
    );

    let down = hitHigh;
    for (let i = 0; i < 2 / STEP; i += 1) down = stepFlappy(down, FLAP, STEP);

    expect(down.over).toBe(true);
    expect(down.y).toBe(floor - bot.h);
    expect(down.score).toBe(hitHigh.score);
  });
});
