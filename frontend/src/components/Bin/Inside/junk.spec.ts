import { describe, it, expect } from 'vitest';
import { lineUp, scatter, type Box } from './junk';

const AREA = { w: 1240, h: 580 };
// The bin's window, big in the middle, and the robot to the right of it.
const WINDOW: Box = { x: 140, y: 30, w: 770, h: 350 };
const ROBOT: Box = { x: 980, y: 120, w: 230, h: 200 };
const FILE = { w: 82, h: 62 };
const ERROR = { w: 284, h: 128 };

const meet = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inside = (box: Box) => box.x >= 0 && box.y >= 0 && box.x + box.w <= AREA.w && box.y + box.h <= AREA.h;

const placed = (boxes: (Box | null)[]) => boxes.filter((box): box is Box => box !== null);

describe('where what was thrown away lies', () => {
  const wanted = [
    { ...ERROR, x: 0, y: 1 },
    { ...ERROR, x: 1, y: 1 },
    { ...ERROR, x: 1, y: 0 },
    ...Array.from({ length: 10 }, (_, i) => ({ ...FILE, x: (i % 2) * 0.95, y: i / 10 })),
  ];

  it('should never cover the window or the robot, nor anything else, and stay on the disk', () => {
    const boxes = placed(scatter(AREA, wanted, [WINDOW, ROBOT]));

    expect(boxes.length).toBeGreaterThan(8);
    boxes.forEach((box, index) => {
      expect(inside(box)).toBe(true);
      expect(meet(box, WINDOW)).toBe(false);
      expect(meet(box, ROBOT)).toBe(false);
      boxes.slice(index + 1).forEach((other) => expect(meet(box, other)).toBe(false));
    });
  });

  it('should put each thing where it wants to be when there is room there', () => {
    const [corner] = scatter(AREA, [{ ...FILE, x: 0, y: 0 }], []);

    expect(corner).toEqual({ x: 8, y: 8, ...FILE });
  });

  it('should leave out what finds no room near where it wants to be, rather than put it anywhere', () => {
    const full: Box = { x: 0, y: 0, w: AREA.w, h: AREA.h - 60 };

    const [error] = scatter(AREA, [{ ...ERROR, x: 0.5, y: 0 }], [full]);

    expect(error).toBeNull();
  });

  it('should let windows left open lie a little over one another, never much, and never over the window', () => {
    const errors = [
      { ...ERROR, x: 0.02, y: 0.9, loose: true },
      { ...ERROR, x: 0.06, y: 0.97, loose: true },
    ];

    const [under, over] = placed(scatter(AREA, errors, [WINDOW, ROBOT]));

    const shared =
      Math.max(0, Math.min(under.x + under.w, over.x + over.w) - Math.max(under.x, over.x)) *
      Math.max(0, Math.min(under.y + under.h, over.y + over.h) - Math.max(under.y, over.y));
    expect(shared).toBeGreaterThan(0);
    expect(shared).toBeLessThanOrEqual(0.3 * ERROR.w * ERROR.h);
    expect(meet(under, WINDOW) || meet(over, WINDOW)).toBe(false);
  });

  it('should keep a file clear of a window left open, even where windows may pile up', () => {
    const [error, file] = scatter(
      AREA,
      [
        { ...ERROR, x: 0, y: 1, loose: true },
        { ...FILE, x: 0, y: 1 },
      ],
      [],
    );

    expect(meet(error as Box, file as Box)).toBe(false);
  });

  it('should fill a column from the top down to where the window cuts into it, as a desktop does', () => {
    const cell = { w: 92, h: 84 };
    const low: Box = { x: 0, y: 300, w: 300, h: 100 };

    const [first, second, third, fourth] = placed(lineUp(AREA, Array.from({ length: 4 }, () => FILE), [low], cell));

    expect([first.x, second.x, third.x]).toEqual([first.x, first.x, first.x]);
    expect(fourth.x).toBeGreaterThan(first.x);
    expect(fourth.y).toBe(first.y);
  });

  it('should line the files up in columns from the left, in cells clear of the window', () => {
    const cell = { w: 92, h: 80 };

    const boxes = lineUp(AREA, Array.from({ length: 9 }, () => FILE), [WINDOW, ROBOT], cell);

    const lined = placed(boxes);
    expect(lined).toHaveLength(9);
    lined.forEach((box) => expect(meet(box, WINDOW) || meet(box, ROBOT)).toBe(false));
    // The first column, top to bottom, before the next one.
    expect(lined[0].x).toBe(lined[1].x);
    expect(lined[1].y).toBeGreaterThan(lined[0].y);
    expect(new Set(lined.map((box) => (box.x - 5) % cell.w)).size).toBe(1);
  });
});
