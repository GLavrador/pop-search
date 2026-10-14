import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Trashable } from '../Desktop/icons';
import { createVariety } from '../Assistant/variety';
import { createStore } from '../../utils/store';
import { comeOut, comeOutCalmly, goIn, goInCalmly, leftAt } from './trip';
import {
  IDLE,
  type Actor,
  type BinView,
  type Box,
  type Mood,
  type Point,
  type Rattle,
  type Stage,
} from './stage';

interface BinOptions {
  /** The robot is on its way in: whatever else had it has to let go. */
  onEnter: () => void;
}

const CUT_SHORT = Symbol('cut short');
const BIN = '[data-robot="icon"][data-robot-zone="bin"]';
const ART = 32;
// Where the bin is on a desktop that has not been laid out, top left corner of its picture.
const NOWHERE: Box = { left: 30, top: 12, width: ART, height: ART };
// Half of what it says on the way in is one mood and half the other, three ways of each.
const MOODS: readonly Mood[] = ['reluctant', 'willing'];
const GOINGS = [0, 1, 2, 3, 4, 5];
const OPEN = { x: 0, y: 0, state: 'open', ms: 0 } as const;

const RATTLES: Record<Rattle, { frames: Keyframe[]; ms: number }> = {
  jam: {
    frames: [
      { transform: 'translate(0, 0) rotate(0deg)' },
      { transform: 'translate(-2px, 1px) rotate(-8deg)' },
      { transform: 'translate(2px, 2px) rotate(7deg)' },
      { transform: 'translate(-1px, 1px) rotate(-3deg)' },
      { transform: 'translate(0, 0) rotate(0deg)' },
    ],
    ms: 200,
  },
  gulp: {
    frames: [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.24, 0.78)' },
      { transform: 'scale(0.88, 1.16)' },
      { transform: 'scale(1.05, 0.96)' },
      { transform: 'scale(1, 1)' },
    ],
    ms: 440,
  },
  pop: {
    frames: [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(0.84, 1.22)' },
      { transform: 'scale(1.14, 0.9)' },
      { transform: 'scale(1, 1)' },
    ],
    ms: 300,
  },
};

const AT_REST: Actor = {
  x: 0,
  y: 0,
  ms: 0,
  ease: 'ease-in-out',
  pose: 'hover',
  face: 'neutral',
  lean: 0,
  turn: 0,
  squeeze: { x: 1, y: 1 },
  gaze: { x: 0, y: 0 },
  talking: false,
  line: null,
  emote: null,
};

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);
const screen = () => ({ w: window.innerWidth, h: window.innerHeight });
const wantsCalm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Measured from where it is laid out, not from where it is drawn: the robot may have carried it off.
const binBox = (): Box => {
  const icon = document.querySelector<HTMLElement>(BIN);
  const within = icon?.offsetParent?.getBoundingClientRect();
  if (!icon || !within) return NOWHERE;
  return {
    left: within.left + icon.offsetLeft + (icon.offsetWidth - ART) / 2,
    top: within.top + icon.offsetTop + 4,
    width: ART,
    height: ART,
  };
};

const robotNow = (): Point | null => {
  const box = document.querySelector('[data-robot-body]')?.getBoundingClientRect();
  return box && box.width > 0 ? { x: box.left, y: box.top } : null;
};

/**
 * The bin, and what was thrown in it. The robot goes in after it, and comes out
 * with it or without: the rest happens inside, where the choice is made.
 */
export const useBin = (options: BinOptions) => {
  const [trashed, setTrashed] = useState<readonly Trashable[]>([]);
  const [view, setView] = useState<BinView>(IDLE);
  const [cast] = useState(() => createStore<Actor | null>(null));
  const [exit, setExit] = useState<Point | null>(null);
  const [greeting, setGreeting] = useState(0);
  const vary = useMemo(() => createVariety(), []);
  const running = useRef<{ control: AbortController; settle: () => void } | null>(null);
  const live = useRef({ options, trashed, phase: view.phase });

  useEffect(() => {
    live.current = { options, trashed, phase: view.phase };
  });

  const play = useCallback(
    (script: (stage: Stage) => Promise<void>, settle: (stage: Stage) => void) => {
      const control = new AbortController();
      const { signal } = control;
      const timers = new Set<ReturnType<typeof setTimeout>>();
      const waiting = new Set<(reason: symbol) => void>();
      signal.addEventListener(
        'abort',
        () => {
          timers.forEach(clearTimeout);
          waiting.forEach((giveUp) => giveUp(CUT_SHORT));
        },
        { once: true },
      );

      const later = (ms: number, run: () => void) => {
        const id = setTimeout(() => {
          timers.delete(id);
          run();
        }, ms);
        timers.add(id);
      };
      const wait = (ms: number) =>
        new Promise<void>((resolve, reject) => {
          if (signal.aborted) {
            reject(CUT_SHORT);
            return;
          }
          waiting.add(reject);
          later(ms, () => {
            waiting.delete(reject);
            resolve();
          });
        });
      const change = (next: (now: BinView) => BinView) => {
        if (!signal.aborted) setView(next);
      };
      const act = (patch: Partial<Actor>) => {
        const now = cast.get();
        if (now && !signal.aborted) cast.set({ ...now, ...patch });
      };

      let at: Point = { x: 0, y: 0 };
      let emoteTurn = 0;

      const stage: Stage = {
        screen,
        bin: binBox,
        wait,
        appear: (to, look) => {
          at = to;
          if (!signal.aborted) cast.set({ ...AT_REST, ...look, ...to });
        },
        fly: async (to, ms, { pose = 'fly', then, ease = 'ease-in-out', ...look } = {}) => {
          const lean = clamp((to.x - at.x) / 30, -9, 9);
          at = to;
          act({ ...look, ...to, ms, ease, pose, lean });
          await wait(ms);
          act({ pose: then ?? pose, lean: 0 });
        },
        look: act,
        say: (line) => act({ line }),
        emote: (emote, ms = 1300) => {
          emoteTurn += 1;
          const turn = emoteTurn;
          act({ emote });
          later(ms, () => {
            if (turn === emoteTurn) act({ emote: null });
          });
        },
        carry: (by, ms) => {
          change((now) => ({ ...now, borne: by ? { ...by, ms } : now.borne && { x: 0, y: 0, ms } }));
          return wait(ms);
        },
        rattle: (how) => {
          if (signal.aborted || wantsCalm()) return;
          const { frames, ms } = RATTLES[how];
          document
            .querySelectorAll(`${BIN} > span, [data-bin-front]`)
            .forEach((node) => node.animate?.(frames, { duration: ms, easing: 'ease-out' }));
        },
        behind: (front) => change((now) => ({ ...now, front })),
        through: (hole) => change((now) => ({ ...now, hole })),
        iris: async (point, open, ms) => {
          change((now) => ({ ...now, iris: { ...point, state: open ? 'opening' : 'closing', ms } }));
          await wait(ms);
          if (!open) change((now) => ({ ...now, iris: null }));
        },
        release: (zone) => {
          if (!signal.aborted) setTrashed((list) => list.filter((item) => item !== zone));
        },
        vanish: () => {
          if (!signal.aborted) cast.set(null);
        },
      };

      const finish = () => {
        if (running.current?.control !== control) return;
        running.current = null;
        cast.set(null);
        settle(stage);
      };
      running.current = { control, settle: finish };

      void script(stage)
        .catch((reason: unknown) => {
          if (reason !== CUT_SHORT) throw reason;
        })
        .finally(() => {
          if (!signal.aborted) finish();
        });
    },
    [cast],
  );

  const trash = useCallback((zone: Trashable) => {
    setTrashed((list) => (list.includes(zone) ? list : [...list, zone]));
  }, []);

  /** In it goes, after what is there. False when there is nothing to go in for. */
  const visit = useCallback(() => {
    if (running.current || live.current.phase !== 'idle' || !live.current.trashed.length) {
      return false;
    }
    const from = robotNow() ?? { x: binBox().left + 60, y: binBox().top + 20 };
    const turn = vary('going', GOINGS);
    const how = { mood: MOODS[turn % MOODS.length], turn: Math.floor(turn / MOODS.length) };
    const calm = wantsCalm();

    live.current.options.onEnter();
    setExit(null);
    setGreeting(vary('greeting', [0, 1, 2]));
    setView({ ...IDLE, phase: 'entering' });
    play(
      (stage) => (calm ? goInCalmly : goIn)(stage, from, how),
      () => setView((now) => ({ ...IDLE, phase: 'inside', borne: now.borne, iris: OPEN })),
    );
    return true;
  }, [play, vary]);

  /** Out it comes, with everything that was in there or with nothing. */
  const leave = useCallback(
    (rescue: boolean) => {
      if (running.current || live.current.phase !== 'inside') return;
      const rescued = rescue ? [...live.current.trashed] : [];
      const turn = vary(rescue ? 'rescued' : 'left', [0, 1, 2]);
      const calm = wantsCalm();

      setView((now) => ({ ...now, phase: 'leaving', iris: OPEN }));
      play(
        (stage) => (calm ? comeOutCalmly : comeOut)(stage, { rescued, turn }),
        (stage) => {
          if (rescue) setTrashed([]);
          setExit(leftAt(stage, calm));
          setView(IDLE);
        },
      );
    },
    [play, vary],
  );

  /** Whatever scene is playing goes straight to its end. */
  const skip = useCallback(() => {
    const scene = running.current;
    if (!scene) return;
    scene.control.abort();
    scene.settle();
  }, []);

  /** The desktop was wiped and built again: nothing is in the bin, and nobody is in there either. */
  const empty = useCallback(() => {
    running.current?.control.abort();
    running.current = null;
    cast.set(null);
    setTrashed([]);
    setExit(null);
    setView(IDLE);
  }, [cast]);

  useEffect(
    () => () => {
      running.current?.control.abort();
      running.current = null;
    },
    [],
  );

  return {
    trashed,
    view,
    cast,
    exit,
    greeting,
    away: view.phase !== 'idle',
    trash,
    visit,
    leave,
    skip,
    empty,
  };
};

export type Bin = ReturnType<typeof useBin>;
