import { useCallback, useEffect, useRef, useState } from 'react';
import { REBUILD_PACE, SWALLOW_MS } from '../../constants/rebuild';
import type { IconZone } from '../Desktop/icons';
import { setupShow, wreckCalmly, wreckShow } from './show';
import {
  IDLE,
  blueOver,
  createStore,
  gridFor,
  wrecked,
  type Actor,
  type Box,
  type Kind,
  type RebuildView,
  type Stage,
  type Tiles,
} from './stage';

interface RebuildOptions {
  /** The page has just opened: the desktop starts with nothing on it and is built at once. */
  intro: boolean;
  /** The screen is about to go blue: whatever is open has to go. */
  onWreck: () => void;
  /** The window is to be opened for real. Also called at the end, in case it never was. */
  onOpenWindow: () => void;
  /** The desktop is whole again, the show over or cut short. */
  onEnd: (kind: Kind) => void;
}

const CUT_SHORT = Symbol('cut short');

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

const SELECTORS: Record<IconZone | 'taskbar' | 'window', string> = {
  bin: '[data-robot="icon"][data-robot-zone="bin"]',
  computer: '[data-robot="icon"][data-robot-zone="computer"]',
  app: '[data-robot="icon"][data-robot-zone="app"]',
  taskbar: '[data-robot="taskbar"]',
  window: '[data-robot="window"]',
};

const boxOf = (what: keyof typeof SELECTORS): Box | null => {
  const box = document.querySelector(SELECTORS[what])?.getBoundingClientRect();
  return box ? { left: box.left, top: box.top, width: box.width, height: box.height } : null;
};

const screen = () => ({ w: window.innerWidth, h: window.innerHeight });
const freshBlue = () => blueOver(screen().w, screen().h);
const wantsCalm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const AT_REST: Actor = {
  x: 0,
  y: 0,
  ms: 0,
  ease: 'ease-in-out',
  pose: 'hover',
  face: 'neutral',
  lean: 0,
  flip: false,
  gaze: 0,
  tool: null,
  line: null,
  talking: false,
  emote: null,
};

/** The desktop being built by the robot: after the program goes in the bin, or as the page opens. */
export const useRebuild = (options: RebuildOptions) => {
  const [view, setView] = useState(() => (options.intro ? wrecked('setup') : IDLE));
  const [cast] = useState(() => createStore<Actor | null>(null));
  const [blue] = useState(() => createStore<Tiles | null>(options.intro ? freshBlue() : null));
  const running = useRef<{ control: AbortController; kind: Kind } | null>(null);
  const live = useRef(options);

  useEffect(() => {
    live.current = options;
  });

  const play = useCallback(
    async (kind: Kind, signal: AbortSignal) => {
      const timers = new Set<ReturnType<typeof setTimeout>>();
      const later = (ms: number, run: () => void) => {
        const id = setTimeout(() => {
          timers.delete(id);
          run();
        }, ms * REBUILD_PACE);
        timers.add(id);
      };
      const waiting = new Set<(reason: symbol) => void>();
      signal.addEventListener(
        'abort',
        () => {
          timers.forEach(clearTimeout);
          waiting.forEach((giveUp) => giveUp(CUT_SHORT));
        },
        { once: true },
      );

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

      const change = (next: (now: RebuildView) => RebuildView) => {
        if (!signal.aborted) setView(next);
      };
      const act = (patch: Partial<Actor>) => {
        const now = cast.get();
        if (now && !signal.aborted) cast.set({ ...now, ...patch });
      };

      let at = { x: 0, y: 0 };
      let emoteTurn = 0;

      const stage: Stage = {
        screen,
        box: boxOf,
        wait,
        appear: (to, look) => {
          at = to;
          if (!signal.aborted) cast.set({ ...AT_REST, ...look, ...to });
        },
        fly: async (to, ms, { pose = 'fly', then = 'hover', ease = 'ease-in-out', ...look } = {}) => {
          const lean = clamp((to.x - at.x) / 30, -9, 9);
          at = to;
          act({ ...look, ...to, ms: ms * REBUILD_PACE, ease, pose, lean });
          await wait(ms);
          act({ pose: then, lean: 0 });
        },
        look: act,
        say: async (line, ms) => {
          act({ line, talking: true, emote: null });
          await wait(ms - 500);
          act({ talking: false });
          await wait(500);
          act({ line: null });
        },
        emote: (emote, ms = 1500) => {
          emoteTurn += 1;
          const turn = emoteTurn;
          act({ emote });
          later(ms, () => {
            if (turn === emoteTurn) act({ emote: null });
          });
        },
        build: (zone, built) => change((now) => ({ ...now, built: { ...now.built, [zone]: built } })),
        shine: (zone) => change((now) => ({ ...now, shining: zone })),
        press: (zone) => change((now) => ({ ...now, pressed: zone })),
        taskbar: (by, ms) => {
          change((now) => ({ ...now, taskbar: { by, ms: ms * REBUILD_PACE } }));
          return wait(ms);
        },
        start: () => change((now) => ({ ...now, start: true })),
        clock: (clock) => change((now) => ({ ...now, clock })),
        tiles: () => gridFor(screen().w, screen().h),
        shoo: (pieces) => {
          const now = blue.get();
          if (!now || signal.aborted) return;
          const fled = [...now.fled];
          pieces.forEach(({ index, x, y }) => {
            fled[index] ??= { x, y };
          });
          blue.set({ ...now, fled });
        },
        openWindow: () => {
          change((now) => ({ ...now, shut: { by: 1, ms: 0 } }));
          live.current.onOpenWindow();
        },
        roll: (by, ms) => {
          change((now) => ({ ...now, shut: { by, ms: ms * REBUILD_PACE } }));
          return wait(ms);
        },
        mend: () => {
          if (signal.aborted) return;
          blue.set(null);
          change((now) => ({ ...IDLE, phase: 'show', kind: now.kind }));
          live.current.onOpenWindow();
        },
      };

      try {
        if (kind === 'crash') {
          await wait(SWALLOW_MS);
          live.current.onWreck();
        }
        blue.set(freshBlue());
        change(() => wrecked(kind));
        if (kind === 'setup') await setupShow(stage);
        else if (wantsCalm()) await wreckCalmly(stage);
        else await wreckShow(stage);
      } catch (reason) {
        if (reason !== CUT_SHORT) throw reason;
      }
    },
    [cast, blue],
  );

  /** Back to a desktop that works, wherever the show had got to. */
  const settle = useCallback(
    (control: AbortController) => {
      const show = running.current;
      if (show?.control !== control) return;
      running.current = null;
      cast.set(null);
      blue.set(null);
      setView(IDLE);
      live.current.onOpenWindow();
      live.current.onEnd(show.kind);
    },
    [cast, blue],
  );

  const begin = useCallback(
    (kind: Kind) => {
      if (running.current) return;
      const control = new AbortController();
      running.current = { control, kind };
      void play(kind, control.signal).finally(() => {
        if (!control.signal.aborted) settle(control);
      });
    },
    [play, settle],
  );

  // The page opening is the one show nobody asks for: it starts by itself.
  const { intro } = options;
  useEffect(() => {
    if (intro) begin('setup');
    return () => {
      running.current?.control.abort();
      running.current = null;
    };
  }, [intro, begin]);

  const trash = useCallback(() => {
    if (running.current) return;
    setView({ ...IDLE, phase: 'swallowing' });
    begin('crash');
  }, [begin]);

  const skip = useCallback(() => {
    const control = running.current?.control;
    if (!control) return;
    control.abort();
    settle(control);
  }, [settle]);

  return { view, cast, blue, trash, skip };
};
