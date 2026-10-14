import { useCallback, useEffect, useRef, useState } from 'react';
import type { Face, Pose } from '../../Assistant/trips';
import type { Closing, Move } from './Clutter';

interface Point {
  x: number;
  y: number;
}

/** The robot as it goes round the disk putting it in order. */
export interface Sweeper extends Point {
  ms: number;
  ease: 'ease-in-out' | 'linear';
  pose: Pose;
  face: Face;
  lean: number;
  talking: boolean;
  /** It has the broom of Disk Cleanup in hand. */
  broom: boolean;
}

interface Where {
  /** Where it comes on: where the robot stood. */
  from: Point;
  /** Where it goes once it is done, if anywhere: where the robot stands in the bin. */
  back: () => Point | null;
  /** The files to put in line, once the rest is clean. */
  order: () => readonly Move[];
}

const CUT_SHORT = Symbol('cut short');
const ROBOT = { w: 46, h: 53 };
// Where the tip of each hand is, when it points that way, from the corner of the robot.
const HAND = { left: { x: -3, y: 37 }, right: { x: 49, y: 37 } };
// Long enough to read what it says it is about to do before it does it.
const SAYS_FOR = 2000;
const TO_ERROR = 420;
const AIM = 160;
const SWEEP = 1100;
// How far from the middle of a file the middle of the robot is, when it pushes it or pulls it.
const BEHIND = 50;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

const shown = (node: Element) => node.getClientRects().length > 0;

const middleOf = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => ({
  x: x + w / 2,
  y: y + h / 2,
});

/**
 * The robot cleaning up the inside of the bin once the disk is defragmented.
 * First it says what it is about to do, standing still. Then it closes the
 * errors that were left open, one at a time, pressing the button of each; it
 * sweeps the wear off the screen with a broom from one side to the other; and
 * it pushes and pulls the files one by one into line, as on a desktop.
 */
export const useSweep = (onDone: () => void) => {
  const [sweeper, setSweeper] = useState<Sweeper | null>(null);
  const [closing, setClosing] = useState<Closing>({});
  const [wiping, setWiping] = useState(false);
  const running = useRef<AbortController | null>(null);
  const live = useRef(onDone);

  useEffect(() => {
    live.current = onDone;
  });

  useEffect(() => () => running.current?.abort(), []);

  const sweep = useCallback(({ from, back, order }: Where) => {
    if (running.current) return;
    const control = new AbortController();
    const { signal } = control;
    running.current = control;

    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const id = setTimeout(resolve, ms);
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(id);
            reject(CUT_SHORT);
          },
          { once: true },
        );
      });
    let at = from;
    const look = (patch: Partial<Sweeper>) => setSweeper((now) => now && { ...now, ...patch });
    const go = (to: Point, ms: number, patch: Partial<Sweeper> = {}) => {
      const lean = clamp((to.x - at.x) / 30, -9, 9);
      at = to;
      setSweeper((now) => now && { ...now, pose: 'fly', ease: 'ease-in-out', ...patch, ...to, ms, lean });
      return wait(ms);
    };
    const onScreen = (to: Point) => ({
      x: clamp(to.x, 4, window.innerWidth - ROBOT.w - 4),
      y: clamp(to.y, 4, window.innerHeight - ROBOT.h - 4),
    });

    // Its hand on the button, from the side there is room on.
    const press = async (index: number, button: DOMRect) => {
      const aim = middleOf({ x: button.left, y: button.top, w: button.width, h: button.height });
      const fromRight = aim.x - HAND.left.x + ROBOT.w + 4 <= window.innerWidth;
      const hand = fromRight ? HAND.left : HAND.right;
      const spot = { x: aim.x - hand.x, y: aim.y - hand.y };
      await go(spot, TO_ERROR, { pose: 'fly' });
      look({ pose: fromRight ? 'point-left' : 'point-right', lean: 0 });
      await wait(AIM);
      // In it goes, and the button with it.
      const nudge = fromRight ? -2 : 2;
      await go({ x: spot.x + nudge, y: spot.y }, 70, { pose: fromRight ? 'point-left' : 'point-right' });
      setClosing((now) => ({ ...now, [index]: 'pressed' }));
      await wait(240);
      await go(spot, 70, { pose: fromRight ? 'point-left' : 'point-right' });
      setClosing((now) => ({ ...now, [index]: 'closed' }));
      await wait(200);
    };

    // From behind it, it pushes; from in front of it, it pulls.
    const shift = async ({ from: lies, to, go: slide }: Move, pull: boolean) => {
      const start = middleOf(lies);
      const end = middleOf(to);
      const far = Math.hypot(end.x - start.x, end.y - start.y);
      if (far < 4) return;
      const way = { x: (end.x - start.x) / far, y: (end.y - start.y) / far };
      const side = pull ? BEHIND : -BEHIND;
      const by = (point: Point) =>
        onScreen({
          x: point.x + way.x * side - ROBOT.w / 2,
          y: point.y + way.y * side - ROBOT.h / 2,
        });
      const first = by(start);
      await go(first, clamp(Math.hypot(first.x - at.x, first.y - at.y) * 0.55, 120, 260));
      look({ pose: 'tug', lean: 0 });
      await wait(70);
      const ms = clamp(far * 0.65, 200, 380);
      slide(ms);
      await go(by(end), ms, { pose: 'tug' });
    };

    const script = async () => {
      setSweeper({
        ...from,
        ms: 0,
        ease: 'ease-in-out',
        pose: 'hover',
        face: 'brave',
        lean: 0,
        talking: true,
        broom: false,
      });
      await wait(SAYS_FOR);

      // The errors left open, one at a time. The one on top of a pile goes first.
      const errors = [...document.querySelectorAll<HTMLElement>('[data-bin-inside] [data-error]')]
        .filter(shown)
        .reverse();
      for (const error of errors) {
        const button = error.querySelector(error.dataset.closeWith === 'button' ? '[data-button]' : '[data-close]');
        await press(Number(error.dataset.error), (button ?? error).getBoundingClientRect());
      }

      // Then the wear, swept off from one side of the disk to the other.
      const disk = document.querySelector('[data-bin-inside] [data-disk]')?.getBoundingClientRect();
      const lane = disk ? disk.top + disk.height * 0.5 - ROBOT.h / 2 : window.innerHeight / 2;
      const left = disk ? disk.left + 4 : 4;
      const right = disk ? disk.right - ROBOT.w - 20 : window.innerWidth - ROBOT.w - 4;
      await go({ x: left, y: lane }, 420, { talking: false });
      look({ broom: true, face: 'happy' });
      setWiping(true);
      await go({ x: right, y: lane }, SWEEP, { ease: 'linear', broom: true });
      look({ broom: false, lean: 0 });

      // And the files, one by one, into line.
      const moves = order();
      for (const [index, move] of moves.entries()) await shift(move, index % 2 === 1);

      const home = back();
      if (home) await go(home, 520, { pose: 'hover' });
    };

    void script()
      .catch((reason: unknown) => {
        if (reason !== CUT_SHORT) throw reason;
      })
      .finally(() => {
        if (signal.aborted) return;
        running.current = null;
        setSweeper(null);
        live.current();
      });
  }, []);

  return { sweeper, closing, wiping, sweep };
};
