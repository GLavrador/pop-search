import { describe, it, expect } from 'vitest';
import { angleOf, coast, hangFrom, steady, swing, throwOf, type Hang } from './carry';

const FRAME = 16;

const carried = (hang: Hang, from: { x: number; y: number }, to: { x: number; y: number }, frames: number) => {
  let state = hang;
  for (let i = 1; i <= frames; i += 1) {
    const at = (k: number) => ({
      x: from.x + ((to.x - from.x) * k) / frames,
      y: from.y + ((to.y - from.y) * k) / frames,
    });
    state = swing(state, at(i - 1), at(i), FRAME);
  }
  return state;
};

describe('carrying the robot', () => {
  it('should hang straight down while the pointer is still', () => {
    const pivot = { x: 100, y: 100 };

    const hang = carried(hangFrom(pivot), pivot, pivot, 30);

    expect(angleOf(hang, pivot)).toBeCloseTo(0, 5);
  });

  it('should trail behind a pointer that moves, feet last', () => {
    const from = { x: 100, y: 100 };
    const to = { x: 400, y: 100 };

    const hang = carried(hangFrom(from), from, to, 12);

    expect(angleOf(hang, to)).toBeGreaterThan(0.3);
  });

  it('should swing past the middle once the pointer stops, then come to rest', () => {
    const from = { x: 100, y: 100 };
    const to = { x: 400, y: 100 };
    let hang = carried(hangFrom(from), from, to, 12);

    const angles: number[] = [];
    for (let i = 0; i < 300; i += 1) {
      hang = swing(hang, to, to, FRAME);
      angles.push(angleOf(hang, to));
    }

    expect(Math.min(...angles)).toBeLessThan(-0.1);
    expect(Math.abs(angles[angles.length - 1])).toBeLessThan(0.02);
  });

  it('should never go over the top, however hard it is yanked', () => {
    const from = { x: 0, y: 100 };
    const to = { x: 900, y: 100 };
    let hang = hangFrom(from);

    for (let i = 0; i < 6; i += 1) {
      hang = swing(hang, i % 2 ? to : from, i % 2 ? from : to, FRAME);
      expect(Math.abs(angleOf(hang, i % 2 ? from : to))).toBeLessThanOrEqual(1.16);
    }
  });

  it('should read the speed of a throw from the last stretch of the drag', () => {
    const trail = [
      { x: 0, y: 0, at: 0 },
      { x: 20, y: 0, at: 40 },
      { x: 60, y: 0, at: 80 },
    ];

    const speed = throwOf(trail, 85);

    expect(speed.x).toBeCloseTo(750);
    expect(speed.y).toBeCloseTo(0);
  });

  it('should count a release after a pause as putting it down, not throwing it', () => {
    const trail = [
      { x: 0, y: 0, at: 0 },
      { x: 60, y: 0, at: 40 },
    ];

    expect(throwOf(trail, 300)).toEqual({ x: 0, y: 0 });
  });

  it('should cap how hard it can be thrown', () => {
    const trail = [
      { x: 0, y: 0, at: 0 },
      { x: 900, y: 0, at: 30 },
    ];

    expect(throwOf(trail, 31).x).toBe(1500);
  });

  it('should slide on after a throw and lose its speed', () => {
    let state = { at: { x: 0, y: 0 }, speed: { x: 1000, y: 0 } };

    for (let i = 0; i < 120; i += 1) state = coast(state.at, state.speed, FRAME);

    expect(state.at.x).toBeGreaterThan(150);
    expect(state.at.x).toBeLessThan(260);
    expect(state.speed.x).toBeLessThan(1);
  });

  it('should wobble back to upright after it is let go', () => {
    let state = { angle: 0.6, rate: 0 };
    const angles: number[] = [];

    for (let i = 0; i < 90; i += 1) {
      state = steady(state.angle, state.rate, FRAME);
      angles.push(state.angle);
    }

    expect(Math.min(...angles)).toBeLessThan(-0.05);
    expect(Math.abs(state.angle)).toBeLessThan(0.01);
  });
});
