import type { Box, Point, Side, Size } from './flight';
import type { Variety } from './variety';

export type Face =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'wow'
  | 'sleepy'
  | 'worried'
  | 'dizzy'
  | 'yawn'
  | 'shy'
  | 'angry'
  | 'aghast'
  | 'stern'
  | 'strain'
  | 'phew';

export type Pose =
  | 'stand'
  | 'fly'
  | 'heave'
  | 'tug'
  | 'hammer'
  | 'dust'
  | 'wave'
  | 'cheer'
  | 'sit'
  | 'peek'
  | 'dangle'
  | 'brake'
  | 'hover'
  | 'point-down'
  | 'point-up'
  | 'point-left'
  | 'point-right';

export interface Stop {
  at: Point;
  side?: Side;
  /** How it settles there, when the place itself decides it: a ledge is for sitting. */
  pose?: Pose;
}

/** One stop: where to go, how to look once there, and how long to stay. */
export interface Leg {
  where: () => Stop | null;
  /** Starts the flight from here instead: it had left the screen. */
  from?: () => Point;
  pose: Pose | ((side?: Side) => Pose);
  face: Face;
  /** Where the eyes rest, as a direction; 'wander' lets them drift. */
  gaze?: Point | 'wander' | ((side?: Side) => Point | 'wander');
  emote?: () => string;
  hold: number;
  layer?: 'behind';
  /** Covers the distance in a fraction of the usual time. */
  swift?: boolean;
  /** Flies straight instead of taking an arc. */
  direct?: boolean;
  onLand?: () => void;
  /** The stop the current step asks for, as opposed to a trip of its own. */
  mission?: boolean;
  /** Degrees its body is turned once there. Only a robot in hiding has one. */
  turn?: number;
}

export interface Emotes {
  heavy: string;
  sorry: string;
  knock: string;
  puzzled: string;
  grabbed: readonly string[];
  bin: readonly string[];
  hiding: readonly string[];
  dizzy: readonly string[];
  enough: readonly string[];
  lurk: readonly string[];
  found: readonly string[];
  flip: readonly string[];
  roof: readonly string[];
  yawn: readonly string[];
  woke: readonly string[];
}

/** What a trip may use of the robot and of the screen it lives on. */
export interface Scene {
  size: Size;
  position: () => Point | null;
  onScreen: (at: Point) => Point;
  emotes: () => Emotes;
  /** Runs something later, on the same clock the flight uses. */
  after: (ms: number, run: () => void) => void;
  /** A one-off movement of the body that leaves the pose alone. */
  move: (frames: Keyframe[], duration: number) => void;
  /** Says the next change to the window is the robot's own doing, not a new errand. */
  prank: (ms: number) => void;
  /** How long since the user last typed or clicked. */
  idleFor: () => number;
  /** Chooses among ways of saying one thing, never the same twice running. */
  vary: Variety;
}

interface Trip {
  /** How likely it is next to the others. Below 1 for the ones that should stay a surprise. */
  odds: number;
  /** Empty when the trip is not possible on this screen. */
  plan: (scene: Scene) => Leg[];
}

const AHEAD: Point = { x: 0, y: 0 };
const DOWN: Point = { x: 0, y: 1 };
const BUSY_FOR = 12000;

export const HOP = [
  { transform: 'translateY(0)' },
  { transform: 'translateY(-16px)', offset: 0.45 },
  { transform: 'translateY(0)' },
];
const WIGGLE = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(-13deg)' },
  { transform: 'rotate(13deg)' },
  { transform: 'rotate(-13deg)' },
  { transform: 'rotate(13deg)' },
  { transform: 'rotate(-13deg)' },
  { transform: 'rotate(0deg)' },
];
const LOOM = [
  { transform: 'scale(1)' },
  { transform: 'scale(1.55)', offset: 0.12 },
  { transform: 'scale(1.55)', offset: 0.88 },
  { transform: 'scale(1)' },
];
const FLASH = [
  { backgroundColor: '#000080', backgroundImage: 'none', color: '#ffffff' },
  { backgroundColor: '#000080', backgroundImage: 'none', color: '#ffffff' },
];

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);
const pick = <T>(items: readonly T[]): T | undefined =>
  items[Math.floor(Math.random() * items.length)];
export const landmark = (name: string) =>
  document.querySelector<HTMLElement>(`[data-robot="${name}"]`);
/** The app window, unless it is minimized or closed: then there is nothing to stand on. */
export const openWindow = () => {
  const frame = landmark('window');
  return frame?.getAttribute('aria-hidden') === 'true' ? null : frame;
};
const boxOf = (node: Element | null): Box | null => (node ? node.getBoundingClientRect() : null);
const icons = () => [...document.querySelectorAll<HTMLElement>('[data-robot="icon"]')];
const animate = (node: Element, frames: Keyframe[], duration: number) =>
  node.animate?.(frames, { duration, easing: 'ease-out' });

/** Next to a desktop shortcut, on whichever side has room. */
const beside = (icon: HTMLElement, { size, onScreen }: Scene, overlap = 0) => (): Stop => {
  const box = icon.getBoundingClientRect();
  const fitsRight = box.right + 4 + size.w <= window.innerWidth;
  return {
    at: onScreen({
      x: fitsRight ? box.right + 4 - overlap : box.left - size.w - 4 + overlap,
      y: box.top + (box.height - size.h) / 2,
    }),
    side: fitsRight ? 'right' : 'left',
  };
};

/** Standing on the taskbar, centred over one of its buttons. */
const onTaskbar = (button: HTMLElement, bar: HTMLElement, { size, onScreen }: Scene) => (): Stop => {
  const box = button.getBoundingClientRect();
  return {
    at: onScreen({
      x: box.left + (box.width - size.w) / 2,
      y: bar.getBoundingClientRect().top - size.h + 4,
    }),
  };
};

/**
 * It jumps on the app's own button down there and really presses it, so the
 * window goes away or comes back. It owns up, then jumps again to undo it.
 */
export const stomp = (scene: Scene): Leg[] => {
  const button = landmark('task');
  const bar = landmark('taskbar');
  if (!button || !bar) return [];

  const where = onTaskbar(button, bar, scene);
  const isOpen = () => button.getAttribute('aria-pressed') === 'true';
  const wasOpen = isOpen();
  const jump = (onImpact?: () => void) => {
    scene.move(HOP, 400);
    scene.after(300, () => {
      animate(button, FLASH, 420);
      onImpact?.();
    });
  };
  return [
    {
      where,
      pose: 'stand',
      face: 'happy',
      gaze: DOWN,
      hold: 1700,
      onLand: () => {
        scene.prank(8000);
        jump();
        scene.after(560, () => jump(() => button.click()));
      },
    },
    {
      where,
      pose: 'stand',
      face: 'wow',
      gaze: AHEAD,
      emote: () => scene.emotes().sorry,
      hold: 1900,
    },
    {
      where,
      pose: 'stand',
      face: 'neutral',
      gaze: DOWN,
      hold: 1400,
      onLand: () =>
        jump(() => {
          if (isOpen() !== wasOpen) button.click();
        }),
    },
  ];
};

const PEEKING = 25;

/**
 * Behind the window with just the top of its head and its eyes showing: over
 * the top edge, under the bottom one on its head, or sideways at either side.
 */
export const lurk = ({ size }: Scene, avoid?: Side): Leg[] => {
  const frame = boxOf(openWindow());
  if (!frame) return [];

  const floor = boxOf(landmark('taskbar'))?.top ?? window.innerHeight;
  const along = (from: number, to: number, body: number) =>
    from + 30 + Math.random() * Math.max(0, to - from - 60 - body);
  const across = () => along(frame.left, frame.right, size.w);
  const down = () => along(frame.top, frame.bottom, size.h);
  // Turned on its side it is as wide as it is tall, about the same middle.
  const sideways = (size.h - size.w) / 2;

  const spots: (Stop & { side: Side; turn: number; fits: boolean })[] = [
    {
      side: 'above',
      turn: 0,
      at: { x: across(), y: frame.top - PEEKING },
      fits: frame.top - PEEKING >= 2,
    },
    {
      side: 'below',
      turn: 180,
      at: { x: across(), y: frame.bottom + PEEKING - size.h },
      fits: frame.bottom + PEEKING <= floor - 2,
    },
    {
      side: 'left',
      turn: -90,
      at: { x: frame.left - PEEKING + sideways, y: down() },
      fits: frame.left - PEEKING >= 2,
    },
    {
      side: 'right',
      turn: 90,
      at: { x: frame.right + PEEKING - sideways - size.w, y: down() },
      fits: frame.right + PEEKING <= window.innerWidth - 2,
    },
  ];
  const open = spots.filter((spot) => spot.fits);
  const spot = pick(open.filter((candidate) => candidate.side !== avoid)) ?? pick(open);
  if (!spot) return [];

  return [
    {
      where: () => ({ at: spot.at, side: spot.side }),
      pose: 'peek',
      face: 'curious',
      gaze: 'wander',
      hold: 7000,
      layer: 'behind',
      swift: true,
      turn: spot.turn,
    },
  ];
};

export const TRIPS: Record<string, Trip> = {
  icon: {
    odds: 1,
    plan: (scene) => {
      const icon = pick(icons());
      if (!icon) return [];
      return [
        {
          where: beside(icon, scene),
          pose: 'stand',
          face: 'curious',
          gaze: (side) => ({ x: side === 'right' ? -1 : 1, y: 0.3 }),
          emote: () => pick(['?', '!', 'hm...']) ?? '',
          hold: 2400,
        },
      ];
    },
  },

  // It leans on a shortcut and pushes. The shortcut gives a little and comes back.
  shove: {
    odds: 0.9,
    plan: (scene) => {
      const icon = pick(icons());
      if (!icon) return [];
      const where = beside(icon, scene, 7);
      const push = () => {
        const from = scene.position();
        if (!from) return;
        const by = from.x > icon.getBoundingClientRect().left ? -7 : 7;
        const lurch = [
          { transform: 'translateX(0)' },
          { transform: `translateX(${by}px)`, offset: 0.35 },
          { transform: 'translateX(0)' },
        ];
        animate(icon, lurch, 620);
        scene.move(lurch, 620);
      };
      return [
        {
          where,
          pose: (side) => (side === 'right' ? 'point-left' : 'point-right'),
          face: 'neutral',
          gaze: (side) => ({ x: side === 'right' ? -1 : 1, y: 0.2 }),
          hold: 2400,
          onLand: () => {
            push();
            scene.after(780, push);
            scene.after(1560, push);
          },
        },
        {
          where,
          pose: 'stand',
          face: 'wow',
          gaze: AHEAD,
          emote: () => scene.emotes().heavy,
          hold: 1600,
        },
      ];
    },
  },

  clock: {
    odds: 1,
    plan: (scene) => {
      const dial = landmark('clock');
      const bar = landmark('taskbar');
      if (!dial || !bar) return [];
      return [
        {
          where: () => {
            const box = dial.getBoundingClientRect();
            return {
              at: scene.onScreen({
                x: box.left + (box.width - scene.size.w) / 2,
                y: bar.getBoundingClientRect().top - scene.size.h,
              }),
            };
          },
          pose: 'point-down',
          face: 'curious',
          gaze: DOWN,
          emote: () => dial.textContent?.trim() ?? '',
          hold: 2800,
        },
      ];
    },
  },

  sit: {
    odds: 0.9,
    plan: ({ size }) => {
      const bar = landmark('taskbar');
      if (!bar) return [];
      const edge = bar.getBoundingClientRect();
      const limit = (boxOf(landmark('clock'))?.left ?? edge.right) - size.w - 24;
      const from = Math.min(edge.left + 190, limit);
      const x = from + Math.random() * Math.max(0, limit - from);
      return [
        {
          where: () => ({ at: { x, y: bar.getBoundingClientRect().top - size.h + 9 } }),
          pose: 'sit',
          face: 'happy',
          gaze: 'wander',
          emote: () => '♪',
          hold: 4200,
        },
      ];
    },
  },

  stomp: {
    odds: 0.35,
    // Never on its own while the user is in the middle of something: it takes the window away.
    plan: (scene) => (scene.idleFor() < BUSY_FOR ? [] : stomp(scene)),
  },

  // It tries the Start button too. Nothing opens, which puzzles it.
  start: {
    odds: 0.5,
    plan: (scene) => {
      const button = landmark('start');
      const bar = landmark('taskbar');
      if (!button || !bar) return [];
      const where = onTaskbar(button, bar, scene);
      return [
        {
          where,
          pose: 'stand',
          face: 'curious',
          gaze: DOWN,
          hold: 1500,
          onLand: () => {
            scene.move(HOP, 400);
            scene.after(520, () => scene.move(HOP, 400));
          },
        },
        {
          where,
          pose: 'stand',
          face: 'curious',
          gaze: 'wander',
          emote: () => scene.emotes().puzzled,
          hold: 1900,
        },
      ];
    },
  },

  peek: {
    odds: 1,
    plan: ({ size }) => {
      const frame = boxOf(openWindow());
      if (!frame) return [];
      const height = frame.bottom - frame.top;
      const width = frame.right - frame.left;
      const down = frame.top + 50 + Math.random() * Math.max(0, height - 100 - size.h);
      const spots: Stop[] = [];
      if (frame.top > size.h * 0.6) {
        spots.push({
          side: 'above',
          at: {
            x: frame.left + 40 + Math.random() * Math.max(0, width - 80 - size.w),
            y: frame.top - size.h * 0.55,
          },
        });
      }
      if (window.innerWidth - frame.right > size.w * 0.6) {
        spots.push({ side: 'right', at: { x: frame.right - size.w * 0.42, y: down } });
      }
      if (frame.left > size.w * 0.6) {
        spots.push({ side: 'left', at: { x: frame.left - size.w * 0.58, y: down } });
      }
      const spot = pick(spots);
      if (!spot) return [];
      return [
        {
          where: () => spot,
          pose: 'peek',
          face: 'wow',
          gaze: (side) => ({ x: side === 'right' ? 1 : side === 'left' ? -1 : 0, y: 0.5 }),
          hold: 2300,
          layer: 'behind',
        },
      ];
    },
  },

  zigzag: {
    odds: 0.7,
    plan: ({ size, position }) => {
      const floor = (boxOf(landmark('taskbar'))?.top ?? window.innerHeight) - size.h - 6;
      const frame = boxOf(openWindow());
      const ceiling = frame && floor - frame.bottom > 10 ? frame.bottom + 2 : 8;
      if (floor <= ceiling) return [];
      const far = window.innerWidth - size.w - 10;
      const startLeft = (position()?.x ?? 0) > window.innerWidth / 2;
      const sweep = (left: boolean, hold: number, last = false): Leg => {
        const at = { x: left ? 10 : far, y: ceiling + Math.random() * (floor - ceiling) };
        return {
          where: () => ({ at }),
          pose: last ? 'cheer' : 'fly',
          face: 'happy',
          emote: last ? () => '✦' : undefined,
          hold,
        };
      };
      return [sweep(startLeft, 90), sweep(!startLeft, 90), sweep(startLeft, 1000, true)];
    },
  },

  // Out through one edge of the screen at full tilt, back in through the other.
  dash: {
    odds: 0.9,
    plan: ({ size, position }) => {
      const from = position();
      if (!from) return [];
      const rightward = from.x < window.innerWidth / 2;
      const beyond = 80;
      const exit = rightward ? window.innerWidth + beyond : -beyond - size.w;
      const entry = rightward ? -beyond - size.w : window.innerWidth + beyond;
      const lowest = Math.max(20, window.innerHeight - 160);
      const lane = clamp(from.y, 20, lowest);
      const back = clamp(lane + (Math.random() < 0.5 ? -90 : 90), 20, lowest);
      const stop = { x: window.innerWidth * (rightward ? 0.3 : 0.7) - size.w / 2, y: back };
      return [
        {
          where: () => ({ at: { x: exit, y: lane } }),
          pose: 'fly',
          face: 'happy',
          hold: 240,
          swift: true,
          direct: true,
        },
        {
          from: () => ({ x: entry, y: back }),
          where: () => ({ at: stop }),
          pose: 'cheer',
          face: 'happy',
          emote: () => 'zuuum!',
          hold: 1400,
          swift: true,
          direct: true,
        },
      ];
    },
  },

  rooftop: {
    odds: 0.7,
    plan: ({ size }) => {
      const frame = openWindow();
      if (!frame || frame.getBoundingClientRect().top < size.h) return [];
      return [
        {
          where: () => {
            const box = frame.getBoundingClientRect();
            return { at: { x: box.right - size.w - 34, y: box.top - size.h + 1 }, side: 'above' };
          },
          pose: 'point-down',
          face: 'curious',
          gaze: { x: 0.6, y: 1 },
          emote: () => pick(['_ □ X ?', 'hm...']) ?? '',
          hold: 2600,
        },
      ];
    },
  },

  // A nap on top of the window, until the next step wakes it.
  nap: {
    odds: 0.5,
    plan: ({ size }) => {
      const frame = openWindow();
      if (!frame || frame.getBoundingClientRect().top < size.h) return [];
      return [
        {
          where: () => {
            const box = frame.getBoundingClientRect();
            const room = Math.max(0, box.width - 150 - size.w);
            return { at: { x: box.left + 30 + Math.random() * room, y: box.top - size.h + 9 } };
          },
          pose: 'sit',
          face: 'sleepy',
          gaze: { x: 0, y: 0.8 },
          emote: () => 'z z z',
          hold: 6500,
        },
      ];
    },
  },

  // It comes right up to the glass and knocks, looking straight out.
  knock: {
    odds: 0.6,
    plan: (scene) => {
      const frame = boxOf(openWindow());
      const at = frame
        ? { x: (frame.left + frame.right - scene.size.w) / 2, y: frame.top - 12 }
        : { x: (window.innerWidth - scene.size.w) / 2, y: window.innerHeight * 0.3 };
      return [
        {
          where: () => ({ at: scene.onScreen(at) }),
          pose: 'wave',
          face: 'happy',
          gaze: AHEAD,
          emote: () => scene.emotes().knock,
          hold: 2500,
          onLand: () => scene.move(LOOM, 2400),
        },
      ];
    },
  },

  dance: {
    odds: 0.7,
    plan: (scene) => {
      const bar = landmark('taskbar');
      if (!bar) return [];
      const middle = window.innerWidth / 2 - scene.size.w / 2;
      const x = middle + (Math.random() - 0.5) * Math.min(360, window.innerWidth * 0.5);
      return [
        {
          where: () => ({
            at: scene.onScreen({ x, y: bar.getBoundingClientRect().top - scene.size.h - 2 }),
          }),
          pose: 'cheer',
          face: 'happy',
          emote: () => '♪♫',
          hold: 2700,
          onLand: () => scene.move(WIGGLE, 2600),
        },
      ];
    },
  },
};

/** Somewhere to cower: behind the far edge of the window, or half out of the screen. */
export const hide = ({ size, emotes, vary }: Scene): Leg[] => {
  const frame = boxOf(openWindow());
  const behind = frame !== null && window.innerWidth - frame.right > size.w * 0.6;
  const at = behind
    ? { x: frame.right - size.w * 0.42, y: frame.top + (frame.bottom - frame.top) * 0.3 }
    : { x: window.innerWidth - size.w * 0.5, y: window.innerHeight * 0.35 };
  return [
    {
      where: () => ({ at, side: 'right' }),
      pose: 'peek',
      face: 'worried',
      gaze: { x: -1, y: -0.4 },
      emote: () => vary('hiding', emotes().hiding),
      hold: 5200,
      layer: behind ? 'behind' : undefined,
      swift: true,
    },
  ];
};

/** Picks a trip by its odds, never the same one twice running. */
export const planTrip = (scene: Scene, last: string): { name: string; legs: Leg[] } | null => {
  const pool = Object.keys(TRIPS).filter((name) => name !== last);

  while (pool.length) {
    const total = pool.reduce((sum, name) => sum + TRIPS[name].odds, 0);
    let roll = Math.random() * total;
    const index = Math.max(
      0,
      pool.findIndex((name) => {
        roll -= TRIPS[name].odds;
        return roll <= 0;
      }),
    );
    const [name] = pool.splice(index, 1);
    const legs = TRIPS[name].plan(scene);
    if (legs.length) return { name, legs };
  }
  return null;
};
