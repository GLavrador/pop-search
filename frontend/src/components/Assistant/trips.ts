import { planFlight, type Box, type Point, type Side, type Size } from './flight';
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
  | 'phew'
  | 'disgust'
  | 'brave';

export type Pose =
  | 'stand'
  | 'fly'
  | 'blast'
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
  | 'run'
  | 'duck'
  | 'statue'
  | 'knock'
  | 'tune'
  | 'point-down'
  | 'point-up'
  | 'point-left'
  | 'point-right';

export interface Stop {
  at: Point;
  side?: Side;
  /** How it settles there, when the place itself decides it: a ledge is for sitting. */
  pose?: Pose;
  /** The side of it the balloon hangs on, when the place leaves only that one free. */
  hang?: 'left' | 'right';
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
  /** Playing hide and seek: found, the game is up. */
  seeking?: boolean;
  /** The colour its lights glow in on the way there and once there. */
  tint?: number;
  /** Gets out of the way at the first sign of the user: it was only passing the time. */
  skittish?: boolean;
}

export interface Emotes {
  heavy: string;
  sorry: string;
  knock: string;
  puzzled: string;
  grabbed: readonly string[];
  dizzy: readonly string[];
  enough: readonly string[];
  lurk: readonly string[];
  found: readonly string[];
  flip: readonly string[];
  roof: readonly string[];
  yawn: readonly string[];
  woke: readonly string[];
  /** One, two, three: said over each icon as it is counted. */
  counting: readonly string[];
  allThere: readonly string[];
  /** An icon is not where it should be. Takes the name under the empty place. */
  missing: readonly ((name: string) => string)[];
  later: readonly string[];
  hiding: readonly string[];
  unseen: readonly string[];
  itsMe: string;
  likeMe: readonly string[];
  glass: readonly string[];
  saver: readonly string[];
  /** Caught at something it was only doing to pass the time. */
  caught: readonly string[];
  dialing: string;
  modem: string;
  online: readonly string[];
  binFull: readonly string[];
  binEmpty: readonly string[];
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
  move: (frames: Keyframe[], duration: number, easing?: string) => void;
  /** A word over its head, there and then, for this long. */
  say: (text: string, ms: number) => void;
  /** Says the next change to the window is the robot's own doing, not a new errand. */
  prank: (ms: number) => void;
  /** How long since the user last typed, clicked or moved the pointer. */
  idleFor: () => number;
  /** Chooses among ways of saying one thing, never the same twice running. */
  vary: Variety;
}

interface Trip {
  /** Empty when the trip is not possible on this screen, or not right now. */
  plan: (scene: Scene) => Leg[];
}

const AHEAD: Point = { x: 0, y: 0 };
const DOWN: Point = { x: 0, y: 1 };
const BUSY_FOR = 12000;
// As a screen saver it keeps bouncing about for this long, and then stops.
const SAVER_FOR = 15000;
const MOST_BOUNCES = 40;
const TINTS = 4;

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
export const NOD = [
  { transform: 'translateY(0)' },
  { transform: 'translateY(3px)' },
  { transform: 'translateY(0)' },
  { transform: 'translateY(3px)' },
  { transform: 'translateY(0)' },
];
export const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(0)' },
];
export const JOLT = [
  { transform: 'translateY(0) scale(1)' },
  { transform: 'translateY(-10px) scale(0.94, 1.08)' },
  { transform: 'translateY(0) scale(1)' },
];

// Right up against the glass, from the far side of it: squashed flat on arriving, a bump at each knock.
const NEAR = 3.4;
const close = (x: number, offset: number, y = x): Keyframe => ({
  transform: `scale(${x}, ${y})`,
  transformOrigin: '50% 50%',
  offset,
});
const GLASS: Keyframe[] = [
  { ...close(1, 0), easing: 'ease-in' },
  close(NEAR, 0.15),
  close(NEAR * 1.07, 0.19, NEAR * 0.94),
  close(NEAR, 0.24),
  ...[0.36, 0.5, 0.64].flatMap((knock) => [
    close(NEAR, knock),
    close(NEAR * 1.04, knock + 0.03),
    close(NEAR, knock + 0.06),
  ]),
  { ...close(NEAR, 0.82), easing: 'ease-in-out' },
  close(1, 1),
];
const GLASS_MS = 4000;
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
/** Where an icon stands when nothing moves it: one that went down the bin is still drawn over the bin. */
const placeOf = (icon: HTMLElement): Box => {
  const within = icon.offsetParent?.getBoundingClientRect();
  if (!within) return icon.getBoundingClientRect();
  const left = within.left + icon.offsetLeft;
  const top = within.top + icon.offsetTop;
  return { left, top, right: left + icon.offsetWidth, bottom: top + icon.offsetHeight };
};
/** Under the window an icon can neither be seen nor got at. */
const underWindow = (node: HTMLElement) => {
  const frame = boxOf(openWindow());
  const box = placeOf(node);
  const x = (box.left + box.right) / 2;
  const y = (box.top + box.bottom) / 2;
  return frame !== null && x > frame.left && x < frame.right && y > frame.top && y < frame.bottom;
};
const icons = () =>
  [...document.querySelectorAll<HTMLElement>('[data-robot="icon"]')].filter((icon) => !underWindow(icon));
const iconOf = (zone: string) => {
  const icon = document.querySelector<HTMLElement>(`[data-robot="icon"][data-robot-zone="${zone}"]`);
  return icon && !underWindow(icon) ? icon : null;
};
/** Every place on the desktop an icon stands in, in order: with its icon, or empty while the icon is in the bin. */
const slots = () =>
  [...document.querySelectorAll<HTMLElement>('[data-slot]')].filter((slot) => !underWindow(slot));
const isEmpty = (slot: HTMLElement) => slot.hasAttribute('data-trashed');
const nameOf = (slot: HTMLElement) => slot.lastElementChild?.textContent?.trim() ?? '';
const animate = (node: Element, frames: Keyframe[], duration: number) =>
  node.animate?.(frames, { duration, easing: 'ease-out' });

/** Next to a desktop shortcut, on whichever side has room. */
const beside = (icon: HTMLElement, { size, onScreen }: Scene, overlap = 0) => (): Stop => {
  const box = placeOf(icon);
  const fitsRight = box.right + 4 + size.w <= window.innerWidth;
  return {
    at: onScreen({
      x: fitsRight ? box.right + 4 - overlap : box.left - size.w - 4 + overlap,
      y: (box.top + box.bottom - size.h) / 2,
    }),
    side: fitsRight ? 'right' : 'left',
  };
};

// Turned towards what it stands beside, and pointing at it.
const toward = (side?: Side): Point => ({ x: side === 'right' ? -1 : 1, y: 0.3 });
const pointAt = (side?: Side): Pose => (side === 'right' ? 'point-left' : 'point-right');

/** Where something going straight from `from` meets the walls of `room`, bounce after bounce. */
export const bounces = (from: Point, room: Box, heading: Point, count: number): Point[] => {
  const hits: Point[] = [];
  let at = from;
  let way = heading;
  for (let bounce = 0; bounce < count; bounce += 1) {
    const across = ((way.x > 0 ? room.right : room.left) - at.x) / way.x;
    const down = ((way.y > 0 ? room.bottom : room.top) - at.y) / way.y;
    const go = Math.max(0, Math.min(across, down));
    at = { x: at.x + way.x * go, y: at.y + way.y * go };
    hits.push(at);
    way = { x: across <= down ? -way.x : way.x, y: down <= across ? -way.y : way.y };
  }
  return hits;
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
    // Never on its own while the user is in the middle of something: it takes the window away.
    plan: (scene) => (scene.idleFor() < BUSY_FOR ? [] : stomp(scene)),
  },

  // It tries the Start button too. Nothing opens, which puzzles it.
  start: {
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

  // It comes right up to the glass from the other side, big as life, presses on it and knocks.
  glass: {
    plan: (scene) => {
      const at = scene.onScreen({
        x: (window.innerWidth - scene.size.w) / 2,
        y: window.innerHeight * 0.4 - scene.size.h / 2,
      });
      const where = () => ({ at });
      return [
        { where, pose: 'hover', face: 'happy', gaze: AHEAD, hold: 300, skittish: true },
        {
          where,
          pose: 'knock',
          face: 'curious',
          gaze: AHEAD,
          hold: GLASS_MS,
          skittish: true,
          onLand: () => {
            scene.move(GLASS, GLASS_MS, 'linear');
            scene.after(GLASS_MS * 0.17, () => scene.say(scene.emotes().knock, GLASS_MS * 0.62));
          },
        },
        {
          where,
          pose: 'hover',
          face: 'curious',
          gaze: 'wander',
          emote: () => scene.vary('glass', scene.emotes().glass),
          hold: 1800,
          skittish: true,
        },
      ];
    },
  },

  // It counts the icons on the desktop one by one. One missing puzzles it, and it says it will fetch it later.
  count: {
    plan: (scene) => {
      const places = slots();
      if (places.length < 2) return [];
      const { emotes, vary } = scene;
      let counted = 0;
      const legs = places.flatMap((slot): Leg[] => {
        const where = beside(slot, scene);
        if (isEmpty(slot)) {
          const name = nameOf(slot);
          return [
            {
              where,
              pose: pointAt,
              face: 'wow',
              gaze: toward,
              emote: () => vary('missing', emotes().missing)(name),
              hold: 2000,
              onLand: () => scene.move(SHAKE, 520),
            },
            {
              where,
              pose: 'stand',
              face: 'neutral',
              gaze: AHEAD,
              emote: () => vary('later', emotes().later),
              hold: 2200,
              onLand: () => scene.move(NOD, 520),
            },
          ];
        }
        counted += 1;
        const number = counted;
        return [
          {
            where,
            pose: pointAt,
            face: 'curious',
            gaze: toward,
            emote: () => emotes().counting[number - 1] ?? String(number),
            hold: 800,
            onLand: () => scene.move(NOD, 420),
          },
        ];
      });
      if (counted === places.length) {
        legs.push({
          where: beside(places[places.length - 1], scene),
          pose: 'cheer',
          face: 'happy',
          gaze: AHEAD,
          emote: () => vary('allThere', emotes().allThere),
          hold: 1700,
        });
      }
      return legs;
    },
  },

  // Hide and seek behind the window: it flies about back there, and now and then its eyes show over the top.
  hide: {
    plan: (scene) => {
      const frame = openWindow();
      if (!frame || frame.getBoundingClientRect().top - PEEKING < 2) return [];
      const { size } = scene;
      // From the left of the window (0) to its right (1).
      const across = (along: number) => {
        const { left, width } = frame.getBoundingClientRect();
        return left + 30 + along * Math.max(0, width - 60 - size.w);
      };
      // Out of sight behind the window, or with its eyes over the top of it.
      const spot = (along: number, up: boolean) => () => {
        const { top, height } = frame.getBoundingClientRect();
        return { at: { x: across(along), y: up ? top - PEEKING : top + Math.min(height / 3, 140) } };
      };
      const lurking = (along: number, hold: number): Leg => ({
        where: spot(along, false),
        pose: 'hover',
        face: 'curious',
        gaze: 'wander',
        hold,
        layer: 'behind',
        seeking: true,
      });
      const peeking = (along: number, face: Face, emote?: () => string): Leg => ({
        where: spot(along, true),
        pose: 'peek',
        face,
        gaze: { x: along < 0.5 ? 0.8 : -0.8, y: 0.5 },
        emote,
        hold: 1500,
        layer: 'behind',
        seeking: true,
        direct: true,
        swift: true,
      });
      const [first, second, third] = [0.15, 0.5, 0.85].sort(() => Math.random() - 0.5);
      return [
        { ...lurking(first, 1300), emote: () => scene.vary('hiding', scene.emotes().hiding) },
        lurking(second, 600),
        peeking(second, 'curious'),
        lurking(third, 600),
        peeking(third, 'wow'),
        lurking(first, 600),
        peeking(first, 'curious', () => scene.vary('hiding', scene.emotes().hiding)),
        {
          where: () => ({ at: { x: across(first), y: frame.getBoundingClientRect().top - size.h + 1 } }),
          pose: 'cheer',
          face: 'happy',
          gaze: AHEAD,
          emote: () => scene.vary('unseen', scene.emotes().unseen),
          hold: 1700,
          direct: true,
          swift: true,
        },
      ];
    },
  },

  // Beside its own portrait on the Tricks icon: that is me, it says, and strikes the very same pose.
  itsMe: {
    plan: (scene) => {
      const icon = iconOf('tricks');
      if (!icon) return [];
      const where = beside(icon, scene);
      return [
        {
          where,
          pose: pointAt,
          face: 'happy',
          gaze: toward,
          emote: () => scene.emotes().itsMe,
          hold: 1700,
          onLand: () => scene.move(HOP, 400),
        },
        { where, pose: 'statue', face: 'neutral', gaze: AHEAD, hold: 2400 },
        {
          where,
          pose: 'stand',
          face: 'happy',
          gaze: toward,
          emote: () => scene.vary('likeMe', scene.emotes().likeMe),
          hold: 1800,
        },
      ];
    },
  },

  // It turns into the screen saver for a while: wall to wall, a new colour at each bounce.
  saver: {
    plan: (scene) => {
      const from = scene.position();
      if (!from) return [];
      const { size } = scene;
      const floor = (boxOf(landmark('taskbar'))?.top ?? window.innerHeight) - size.h - 4;
      const room = { left: 4, top: 4, right: window.innerWidth - size.w - 4, bottom: floor };
      if (room.right - room.left < 200 || room.bottom - room.top < 150) return [];
      const start = { x: clamp(from.x, room.left, room.right), y: clamp(from.y, room.top, room.bottom) };
      const heading = {
        x: start.x < (room.left + room.right) / 2 ? 1 : -1,
        y: start.y < (room.top + room.bottom) / 2 ? 0.7 : -0.7,
      };
      const legs: Leg[] = [];
      let lasted = 0;
      let was = from;
      for (const [index, at] of bounces(start, room, heading, MOST_BOUNCES).entries()) {
        if (lasted >= SAVER_FOR) break;
        const hold = index === 0 ? 900 : 60;
        lasted += planFlight(was, at, 0, 0).duration + hold;
        was = at;
        legs.push({
          where: () => ({ at }),
          pose: 'fly',
          face: 'happy',
          gaze: AHEAD,
          emote: index === 0 ? () => scene.vary('saver', scene.emotes().saver) : undefined,
          hold,
          direct: true,
          tint: (index % TINTS) + 1,
          skittish: true,
        });
      }
      return legs;
    },
  },

  // It turns its antenna like a modem dialling in, lights flashing and body buzzing, until it gets a line.
  dialUp: {
    plan: (scene) => {
      const at = scene.position();
      if (!at) return [];
      const where = () => ({ at });
      return [
        {
          where,
          pose: 'tune',
          face: 'curious',
          gaze: { x: 0.3, y: -1 },
          emote: () => scene.emotes().dialing,
          hold: 1800,
        },
        {
          where,
          pose: 'tune',
          face: 'strain',
          gaze: { x: -0.3, y: -1 },
          emote: () => scene.emotes().modem,
          hold: 2000,
          onLand: () => scene.move(SHAKE, 600),
        },
        {
          where,
          pose: 'cheer',
          face: 'happy',
          gaze: AHEAD,
          emote: () => scene.vary('online', scene.emotes().online),
          hold: 1600,
        },
      ];
    },
  },

  // It leans over the bin for a look inside: full, it pulls a face; empty, it is pleased with it.
  binPeek: {
    plan: (scene) => {
      const bin = iconOf('bin');
      if (!bin) return [];
      const where = beside(bin, scene);
      const full = bin.querySelector('[data-full]') !== null;
      const lean = () => {
        const by = where().side === 'right' ? -1 : 1;
        scene.move(
          [
            { transform: 'translate(0, 0) rotate(0deg)' },
            { transform: `translate(${by * 6}px, 3px) rotate(${by * 14}deg)`, offset: 0.3 },
            { transform: `translate(${by * 6}px, 3px) rotate(${by * 14}deg)`, offset: 0.75 },
            { transform: 'translate(0, 0) rotate(0deg)' },
          ],
          1100,
        );
      };
      return [
        {
          where,
          pose: 'hover',
          face: 'curious',
          gaze: (side) => ({ ...toward(side), y: 0.8 }),
          hold: 1200,
          onLand: lean,
        },
        full
          ? {
              where,
              pose: 'stand',
              face: 'disgust',
              gaze: AHEAD,
              emote: () => scene.vary('binFull', scene.emotes().binFull),
              hold: 2000,
              onLand: () => scene.move(JOLT, 420),
            }
          : {
              where,
              pose: 'stand',
              face: 'happy',
              gaze: AHEAD,
              emote: () => scene.vary('binEmpty', scene.emotes().binEmpty),
              hold: 1800,
              onLand: () => scene.move(NOD, 520),
            },
      ];
    },
  },

  dance: {
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

/**
 * Goes through every trip, in an order shuffled afresh each round, before any of
 * them comes round again, and never the same one twice running. One that cannot
 * be made right now keeps its turn in the round, and another is made meanwhile.
 */
export const createRotation = (random: () => number = Math.random) => {
  const names = Object.keys(TRIPS);
  let round: string[] = [];
  let last = '';

  const shuffled = () => {
    const deck = [...names];
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  const first = (scene: Scene, from: readonly string[]) => {
    for (const name of from) {
      if (name === last) continue;
      const legs = TRIPS[name].plan(scene);
      if (legs.length) return { name, legs };
    }
    return null;
  };

  return (scene: Scene): { name: string; legs: Leg[] } | null => {
    if (!round.length) round = shuffled();
    const trip = first(scene, round) ?? first(scene, shuffled());
    if (trip) {
      round = round.filter((name) => name !== trip.name);
      last = trip.name;
    }
    return trip;
  };
};

// How long it stays put between trips, and how often each. Weights, not shares of a hundred.
const PAUSES: readonly { ms: number; weight: number }[] = [
  { ms: 15000, weight: 50 },
  { ms: 10000, weight: 20 },
  { ms: 20000, weight: 10 },
  { ms: 13000, weight: 30 },
];

/** How long to stay put before the next trip. */
export const pauseBetween = (roll = Math.random()) => {
  let left = roll * PAUSES.reduce((sum, { weight }) => sum + weight, 0);
  return PAUSES.find(({ weight }) => (left -= weight) < 0)?.ms ?? PAUSES[PAUSES.length - 1].ms;
};
