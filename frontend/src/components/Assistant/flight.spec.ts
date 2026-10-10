import { describe, it, expect } from 'vitest';
import {
  climbing,
  contain,
  leanFor,
  perchBy,
  planFlight,
  positionAt,
  progressOf,
  retarget,
} from './flight';

const LEFT = { x: 100, y: 400 };
const RIGHT = { x: 500, y: 400 };
const ROBOT = { w: 46, h: 53 };
const STAGE = { left: 200, top: 300, right: 1000, bottom: 700 };

describe('robot flight', () => {
  it('should leave the straight line when told to swerve', () => {
    const flight = planFlight(LEFT, RIGHT, 0, 1);
    const halfway = positionAt(flight, flight.duration / 2);

    expect(halfway.x).toBeCloseTo(300, 0);
    expect(Math.abs(halfway.y - 400)).toBeGreaterThan(40);
  });

  it('should fly direct with no swerve', () => {
    const flight = planFlight(LEFT, RIGHT, 0, 0);

    expect(positionAt(flight, flight.duration / 2).y).toBeCloseTo(400, 5);
  });

  it('should start where it was and land exactly on the destination', () => {
    const flight = planFlight(LEFT, RIGHT, 1000, -0.8);

    expect(positionAt(flight, 1000)).toEqual(LEFT);
    expect(positionAt(flight, 1000 + flight.duration)).toEqual(RIGHT);
    expect(positionAt(flight, 99_999)).toEqual(RIGHT);
  });

  it('should arc upward in either direction when asked to climb', () => {
    const out = planFlight(LEFT, RIGHT, 0, climbing(LEFT, RIGHT));
    const back = planFlight(RIGHT, LEFT, 0, climbing(RIGHT, LEFT));

    expect(positionAt(out, out.duration / 2).y).toBeLessThan(400);
    expect(positionAt(back, back.duration / 2).y).toBeLessThan(400);
  });

  it('should take longer over a longer distance, within limits', () => {
    const hop = planFlight(LEFT, { x: 130, y: 400 }, 0, 0);
    const crossing = planFlight(LEFT, RIGHT, 0, 0);
    const marathon = planFlight(LEFT, { x: 9000, y: 400 }, 0, 0);

    expect(hop.duration).toBeLessThan(crossing.duration);
    expect(hop.duration).toBeGreaterThanOrEqual(520);
    expect(marathon.duration).toBeLessThanOrEqual(1500);
  });

  it('should keep its arc on screen when flying along an edge', () => {
    const screen = { left: 0, top: 0, right: 1200, bottom: 800 };
    const skimming = planFlight({ x: 100, y: 20 }, { x: 900, y: 20 }, 0, -1);
    const kept = contain(skimming, screen);

    expect(positionAt(skimming, skimming.duration / 2).y).toBeLessThan(0);
    expect(positionAt(kept, kept.duration / 2).y).toBeGreaterThanOrEqual(0);
    expect(positionAt(kept, kept.duration)).toEqual({ x: 900, y: 20 });
  });

  it('should be over at once when it is already there', () => {
    const flight = planFlight(LEFT, LEFT, 0, 1);

    expect(progressOf(flight, 0)).toBe(1);
    expect(positionAt(flight, 0)).toEqual(LEFT);
  });

  it('should bend toward a destination that moved, without jumping', () => {
    const flight = planFlight(LEFT, RIGHT, 0, 1);
    const moved = retarget(flight, { x: 500, y: 600 });

    expect(positionAt(moved, 0)).toEqual(LEFT);
    expect(positionAt(moved, moved.duration)).toEqual({ x: 500, y: 600 });
  });

  it('should lean into the direction of travel, up to a limit', () => {
    expect(leanFor(200)).toBeGreaterThan(0);
    expect(leanFor(-200)).toBeLessThan(0);
    expect(leanFor(0)).toBe(0);
    expect(leanFor(50_000)).toBe(22);
    expect(leanFor(-50_000)).toBe(-22);
  });
});

describe('where the robot stands', () => {
  it('should stand on top of a button when there is room', () => {
    const button = { left: 600, top: 500, right: 700, bottom: 528 };
    const { at, side } = perchBy(button, STAGE, ROBOT);

    expect(side).toBe('above');
    expect(at.y + ROBOT.h).toBe(button.top);
    expect(at.x + ROBOT.w / 2).toBe(650);
  });

  it('should move beside a control that sits near the top of the stage', () => {
    const toggle = { left: 850, top: 336, right: 980, bottom: 364 };
    const { at, side } = perchBy(toggle, STAGE, ROBOT);

    expect(side).toBe('left');
    expect(at.x + ROBOT.w).toBeLessThanOrEqual(toggle.left);
  });

  it('should drop under a control that leaves no room above or beside', () => {
    const bar = { left: 200, top: 310, right: 1000, bottom: 340 };
    const { at, side } = perchBy(bar, STAGE, ROBOT);

    expect(side).toBe('below');
    expect(at.y).toBe(bar.bottom);
  });

  it('should honour a preferred side when it fits', () => {
    const checkbox = { left: 210, top: 500, right: 320, bottom: 513 };
    const { at, side } = perchBy(checkbox, STAGE, ROBOT, 'right');

    expect(side).toBe('right');
    expect(at.x).toBe(checkbox.right + 6);
  });

  it('should accept a spot that only just misses, nudged back inside', () => {
    const toggle = { left: 850, top: 306, right: 980, bottom: 330 };
    const { at, side } = perchBy(toggle, STAGE, ROBOT);

    expect(side).toBe('left');
    expect(at.y).toBe(STAGE.top);
  });

  it('should keep to the corner of a wide control instead of its middle', () => {
    const input = { left: 220, top: 500, right: 980, bottom: 530 };

    expect(perchBy(input, STAGE, ROBOT).at.x).toBe(input.right - ROBOT.w - 10);
  });

  it('should never leave the stage', () => {
    const offstage = { left: 20, top: 40, right: 70, bottom: 60 };
    const { at } = perchBy(offstage, STAGE, ROBOT);

    expect(at.x).toBeGreaterThanOrEqual(STAGE.left);
    expect(at.y).toBeGreaterThanOrEqual(STAGE.top);
    expect(at.x + ROBOT.w).toBeLessThanOrEqual(STAGE.right);
    expect(at.y + ROBOT.h).toBeLessThanOrEqual(STAGE.bottom);
  });
});
