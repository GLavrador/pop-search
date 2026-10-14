import { describe, it, expect } from 'vitest';
import { STUCK_AT, diskAt, leftOver, progressFor } from './disk';

const COLS = 60;
const COUNT = COLS * 40;

const share = (blocks: readonly string[], kind: string) =>
  blocks.filter((block) => block === kind).length / blocks.length;

describe('the disk the defragmenting was left on', () => {
  it('should be stuck where it was left until a game gets anywhere', () => {
    expect(progressFor(0)).toBe(STUCK_AT);
    expect(STUCK_AT).toBe(0.1);
  });

  it('should go the rest of the way as the goal is reached, and no further', () => {
    expect(progressFor(0.5)).toBeCloseTo(0.55, 5);
    expect(progressFor(1)).toBe(1);
    expect(progressFor(3)).toBe(1);
    expect(progressFor(-1)).toBe(STUCK_AT);
  });

  it('should leave mostly data, with free space, forgotten patches and a few bad blocks through it', () => {
    const left = leftOver(COUNT, COLS);

    expect(left).toHaveLength(COUNT);
    expect(share(left, 'data')).toBeGreaterThan(0.5);
    expect(share(left, 'free')).toBeGreaterThan(0.05);
    expect(share(left, 'lost')).toBeGreaterThan(0.05);
    expect(share(left, 'bad')).toBeGreaterThan(0);
    expect(share(left, 'moving')).toBeGreaterThan(0);
    expect(left).not.toContain('done');
  });

  it('should leave the same disk each time for the same size', () => {
    expect(leftOver(COUNT, COLS)).toEqual(leftOver(COUNT, COLS));
    expect(leftOver(COUNT, COLS, 5)).not.toEqual(leftOver(COUNT, COLS));
  });

  it('should be done from the top as far as it has got, and as it was left after that', () => {
    const left = leftOver(COUNT, COLS);

    const stuck = diskAt(left, STUCK_AT);
    const half = diskAt(left, 0.5);
    const whole = diskAt(left, 1);

    expect(stuck.slice(0, COUNT * STUCK_AT).every((block) => block === 'done')).toBe(true);
    expect(stuck.slice(COUNT * STUCK_AT)).toEqual(left.slice(COUNT * STUCK_AT));
    expect(share(half, 'done')).toBeCloseTo(0.5, 2);
    expect(whole.every((block) => block === 'done')).toBe(true);
  });
});
