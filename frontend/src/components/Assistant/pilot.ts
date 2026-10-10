import type { RefObject } from 'react';
import {
  climbing,
  contain,
  leanFor,
  perchBy,
  planFlight,
  positionAt,
  progressOf,
  retarget,
  type Box,
  type Flight,
  type Point,
  type Side,
} from './flight';
import type { Aim } from '../Demo/spotlight';

export type Cue = 'greet' | 'teach' | 'cheer';

type Face = 'neutral' | 'happy' | 'curious' | 'wow';

type Pose =
  | 'stand'
  | 'fly'
  | 'wave'
  | 'cheer'
  | 'sit'
  | 'peek'
  | 'point-down'
  | 'point-up'
  | 'point-left'
  | 'point-right';

export interface Mission {
  /** Changes whenever the robot has something new to say. */
  utterance: number;
  cue: Cue;
  /** The spotlight of the current step, when it has one. */
  target: HTMLElement | null;
  aim: Aim | null;
  beeps: readonly string[];
}

interface Parts {
  sky: HTMLElement;
  craft: HTMLElement;
  emote: HTMLElement;
  /** The seat kept for the robot inside the assistant panel. */
  home: RefObject<HTMLElement | null>;
  /** The scrolling panel it must stay inside while pointing. */
  stage: RefObject<HTMLElement | null>;
}

export interface Pilot {
  brief: (mission: Mission) => void;
  poke: () => void;
  dispose: () => void;
}

interface Spot {
  at: Point;
  side?: Side;
}

/** One stop: where to go, how to look once there, and how long to stay. */
interface Leg {
  where: () => Spot | null;
  pose: Pose | ((side?: Side) => Pose);
  face: Face;
  /** Where the eyes rest, as a direction; 'wander' lets them drift. */
  gaze?: Point | 'wander' | ((side?: Side) => Point);
  emote?: () => string;
  hold: number;
  layer?: 'behind' | 'top';
  /** The stop the current step asks for, as opposed to a trip of its own. */
  mission?: boolean;
}

const ROBOT = { w: 46, h: 53 };
const AHEAD: Point = { x: 0, y: 0 };
const EYE_TRAVEL = { x: 2.2, y: 1.3 };
const HEAD_TURN = 1.6;

const FIRST_DWELL = 16000;
const DWELL = 12000;
const SEAT_DWELL = 8000;
const SPEECH = { greet: 3200, teach: 1900, cheer: 1900 };
const POINTER_MEMORY = 1600;
const REMEASURE_EVERY = 110;

const LAYERS = { behind: '0', front: '', top: '120' };

const SQUASH = [
  { transform: 'scale(1.1, 0.86)' },
  { transform: 'scale(0.97, 1.04)' },
  { transform: 'scale(1)' },
];
const JOLT = [
  { transform: 'translateY(0) scale(1)' },
  { transform: 'translateY(-10px) scale(0.94, 1.08)' },
  { transform: 'translateY(0) scale(1)' },
];
const SPIN = [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }];

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);
const pick = <T>(items: readonly T[]): T | undefined =>
  items[Math.floor(Math.random() * items.length)];
const landmark = (name: string) => document.querySelector<HTMLElement>(`[data-robot="${name}"]`);

export const createPilot = ({ sky, craft, emote, home, stage }: Parts): Pilot => {
  const svg = craft.querySelector('svg');
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const size = { w: craft.offsetWidth || ROBOT.w, h: craft.offsetHeight || ROBOT.h };

  let mission: Mission | null = null;
  let briefed = false;
  let visits = 0;
  let lastTrip = '';

  let pos: Point | null = null;
  let flight: Flight | null = null;
  let leg: Leg | null = null;
  let side: Side | undefined;
  let queue: Leg[] = [];
  let holdUntil = 0;

  let face: Face = 'neutral';
  let lean = 0;
  const gaze = { x: 0, y: 0 };
  let talkUntil = 0;
  let wowUntil = 0;
  let emoteUntil = 0;

  let clock = 0;
  let measuredAt = 0;
  let shifted = false;
  let pokes = 0;
  let pointer: (Point & { at: number }) | null = null;
  let raf = 0;

  const setFlag = (name: string, value: string | null) => {
    if (value === null) craft.removeAttribute(name);
    else if (craft.getAttribute(name) !== value) craft.setAttribute(name, value);
  };

  const boxOf = (node: Element | null): Box | null => (node ? node.getBoundingClientRect() : null);

  const onScreen = (at: Point): Point => ({
    x: clamp(at.x, 2, Math.max(2, window.innerWidth - size.w - 2)),
    y: clamp(at.y, 2, Math.max(2, window.innerHeight - size.h - 2)),
  });

  const say = (text: string, until: number) => {
    if (!text) return;
    emote.textContent = text;
    emote.toggleAttribute('data-flip', (pos?.x ?? 0) > window.innerWidth - 160);
    emote.setAttribute('data-on', '');
    emoteUntil = until;
  };

  const hush = () => {
    emote.removeAttribute('data-on');
    emoteUntil = 0;
  };

  /** Next to the control the step is about, or back in its seat when there is none. */
  const station = (): Leg => {
    const cue = mission?.cue ?? 'teach';
    const returning = visits > 0;

    return {
      mission: true,
      hold: mission?.target ? (returning ? DWELL : FIRST_DWELL) : SEAT_DWELL + SPEECH[cue],
      face: cue === 'teach' || returning ? 'neutral' : 'happy',
      where: () => {
        const target = mission?.target;
        if (target?.isConnected) {
          const control = (mission?.aim?.pick && target.querySelector(mission.aim.pick)) || target;
          const spot = perchBy(
            control.getBoundingClientRect(),
            boxOf(stage.current),
            size,
            mission?.aim?.from,
          );
          return { at: onScreen(spot.at), side: spot.side };
        }
        const seat = boxOf(home.current);
        return seat ? { at: { x: seat.left, y: seat.top } } : null;
      },
      pose: (where) => {
        if (cue === 'cheer' && !returning) return 'cheer';
        if (where === 'above') return 'point-down';
        if (where === 'below') return 'point-up';
        if (where === 'left') return 'point-right';
        if (where === 'right') return 'point-left';
        return cue === 'greet' && !returning ? 'wave' : 'stand';
      },
      gaze: (where) => {
        if (where === 'above') return { x: 0, y: 1 };
        if (where === 'below') return { x: 0, y: -1 };
        if (where === 'left') return { x: 1, y: 0.2 };
        if (where === 'right') return { x: -1, y: 0.2 };
        return AHEAD;
      },
    };
  };

  /** Things it goes off to do when left alone for a while. Empty when not possible here. */
  const trips: Record<string, () => Leg[]> = {
    icon: () => {
      const icon = pick([...document.querySelectorAll<HTMLElement>('[data-robot="icon"]')]);
      if (!icon) return [];
      return [
        {
          where: () => {
            const box = icon.getBoundingClientRect();
            const fitsRight = box.right + 4 + size.w <= window.innerWidth;
            return {
              at: onScreen({
                x: fitsRight ? box.right + 4 : box.left - size.w - 4,
                y: box.top + (box.height - size.h) / 2,
              }),
              side: fitsRight ? 'right' : 'left',
            };
          },
          pose: 'stand',
          face: 'curious',
          gaze: (where) => ({ x: where === 'right' ? -1 : 1, y: 0.3 }),
          emote: () => pick(['?', '!', 'hm...']) ?? '',
          hold: 2400,
        },
      ];
    },

    clock: () => {
      const dial = landmark('clock');
      const bar = landmark('taskbar');
      if (!dial || !bar) return [];
      return [
        {
          where: () => {
            const box = dial.getBoundingClientRect();
            return {
              at: onScreen({
                x: box.left + (box.width - size.w) / 2,
                y: bar.getBoundingClientRect().top - size.h,
              }),
            };
          },
          pose: 'point-down',
          face: 'curious',
          gaze: { x: 0, y: 1 },
          emote: () => dial.textContent?.trim() ?? '',
          hold: 2800,
        },
      ];
    },

    sit: () => {
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
          layer: 'top',
        },
      ];
    },

    peek: () => {
      const frame = boxOf(landmark('window'));
      if (!frame) return [];
      const height = frame.bottom - frame.top;
      const width = frame.right - frame.left;
      const down = frame.top + 50 + Math.random() * Math.max(0, height - 100 - size.h);
      const spots: Spot[] = [];
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
          gaze: (where) => ({ x: where === 'right' ? 1 : where === 'left' ? -1 : 0, y: 0.5 }),
          hold: 2300,
          layer: 'behind',
        },
      ];
    },

    zigzag: () => {
      const floor = (boxOf(landmark('taskbar'))?.top ?? window.innerHeight) - size.h - 6;
      const frame = boxOf(landmark('window'));
      const ceiling = frame && floor - frame.bottom > 10 ? frame.bottom + 2 : 8;
      if (floor <= ceiling) return [];
      const height = () => ceiling + Math.random() * (floor - ceiling);
      const far = window.innerWidth - size.w - 10;
      const startLeft = (pos?.x ?? 0) > window.innerWidth / 2;
      const sweep = (left: boolean, hold: number, last = false): Leg => {
        const at = { x: left ? 10 : far, y: height() };
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

    rooftop: () => {
      const frame = landmark('window');
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
  };

  const excursion = (): Leg[] => {
    if (still) return [];
    const names = Object.keys(trips)
      .filter((name) => name !== lastTrip)
      .sort(() => Math.random() - 0.5);
    for (const name of names) {
      const legs = trips[name]();
      if (legs.length) {
        lastTrip = name;
        return legs;
      }
    }
    return [];
  };

  const land = (now: number) => {
    if (!leg) return;
    flight = null;
    face = leg.face;
    holdUntil = now + leg.hold;
    if (leg.mission) visits += 1;
    if (leg.emote) say(leg.emote(), holdUntil);
    if (!still) svg?.animate?.(SQUASH, { duration: 260, easing: 'ease-out' });
  };

  /** Sets off for a stop. False when the stop cannot be found yet. */
  const depart = (next: Leg, now: number, speech = 0) => {
    const spot = next.where();
    if (!spot) return false;

    leg = next;
    side = spot.side;
    hush();
    sky.style.zIndex = LAYERS[next.layer === 'behind' ? 'behind' : 'front'];

    // First time on stage: it flies in from beyond the right edge.
    pos ??= { x: window.innerWidth + 12, y: Math.max(16, spot.at.y - 110) };

    const bow = (0.45 + Math.random() * 0.55) * (Math.random() < 0.8 ? 1 : -1);
    const plan = contain(planFlight(pos, spot.at, now, bow * climbing(pos, spot.at)), {
      left: 4,
      top: 4,
      right: window.innerWidth - size.w - 4,
      bottom: window.innerHeight - size.h - 4,
    });
    flight = still ? { ...plan, duration: 0 } : plan;
    if (speech) talkUntil = now + flight.duration + speech;
    return true;
  };

  const advance = (now: number) => {
    if (!queue.length && leg?.mission) queue = excursion();

    const next = queue.shift();
    if (next) depart(next, now);
    else if (leg?.mission) holdUntil = now + DWELL;
    else depart(station(), now, 600);
  };

  const tick = (now: number) => {
    raf = window.requestAnimationFrame(tick);
    const dt = clock ? clamp(now - clock, 1, 80) : 16;
    clock = now;

    if (briefed) {
      queue = [];
      visits = 0;
      briefed = !depart(station(), now, SPEECH[mission?.cue ?? 'teach']);
    }
    if (!leg || !pos) return;

    if (leg.mission && now - measuredAt > REMEASURE_EVERY) shifted = true;

    let speedX = 0;
    let heading: Point | null = null;

    if (flight) {
      if (shifted && leg.mission) {
        const spot = leg.where();
        if (spot) {
          flight = retarget(flight, spot.at);
          side = spot.side;
        }
      }
      const next = positionAt(flight, now);
      const dx = next.x - pos.x;
      const dy = next.y - pos.y;
      const moved = Math.hypot(dx, dy);
      speedX = (dx / dt) * 1000;
      if (moved > 0.05) heading = { x: dx / moved, y: dy / moved };
      pos = next;
      if (progressOf(flight, now) >= 1) land(now);
    } else {
      if (shifted && leg.mission) {
        const spot = leg.where();
        if (spot) {
          side = spot.side;
          const off = Math.hypot(spot.at.x - pos.x, spot.at.y - pos.y);
          if (off > 30 && !still) {
            flight = planFlight(pos, spot.at, now, 0.3 * climbing(pos, spot.at));
          } else {
            pos = spot.at;
          }
        }
      }
      if (!flight && now >= holdUntil) advance(now);
    }

    if (shifted) measuredAt = now;
    shifted = false;
    if (!leg || !pos) return;

    const flying = flight !== null;
    lean += ((flying ? leanFor(speedX) : 0) - lean) * Math.min(1, dt / 110);

    let want: Point = AHEAD;
    if (flying) {
      want = heading ?? want;
    } else if (pointer && now - pointer.at < POINTER_MEMORY) {
      const dx = pointer.x - (pos.x + size.w / 2);
      const dy = pointer.y - (pos.y + size.h * 0.35);
      const far = Math.hypot(dx, dy) || 1;
      want = { x: dx / far, y: dy / far };
    } else if (leg.gaze === 'wander') {
      want = { x: Math.sin(now / 700), y: 0.1 };
    } else if (leg.gaze) {
      const rest = typeof leg.gaze === 'function' ? leg.gaze(side) : leg.gaze;
      // Now and then it looks up from the control at whoever is watching.
      want = leg.mission && now % 4200 > 3300 ? AHEAD : rest;
    }
    const ease = Math.min(1, dt / 120);
    gaze.x += (want.x - gaze.x) * ease;
    gaze.y += (want.y - gaze.y) * ease;

    craft.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    craft.style.setProperty('--lean', `${lean.toFixed(1)}deg`);
    craft.style.setProperty('--look-x', `${(gaze.x * EYE_TRAVEL.x).toFixed(2)}px`);
    craft.style.setProperty('--look-y', `${(gaze.y * EYE_TRAVEL.y).toFixed(2)}px`);
    craft.style.setProperty('--turn', `${(gaze.x * HEAD_TURN).toFixed(2)}px`);

    const pose = typeof leg.pose === 'function' ? leg.pose(side) : leg.pose;
    setFlag('data-pose', flying ? 'fly' : pose);
    setFlag('data-face', now < wowUntil ? 'wow' : flying ? 'neutral' : face);
    setFlag('data-talking', now < talkUntil ? '' : null);

    if (!flying && leg.layer === 'top') sky.style.zIndex = LAYERS.top;
    if (emoteUntil && now >= emoteUntil) hush();
  };

  const onLayout = () => {
    shifted = true;
  };
  const onPointer = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY, at: clock };
  };

  window.addEventListener('resize', onLayout);
  window.addEventListener('scroll', onLayout, true);
  window.addEventListener('pointermove', onPointer, { passive: true });
  raf = window.requestAnimationFrame(tick);

  return {
    brief: (next) => {
      const unchanged =
        mission !== null &&
        mission.utterance === next.utterance &&
        mission.target === next.target &&
        mission.aim === next.aim &&
        mission.cue === next.cue;
      mission = next;
      if (!unchanged) briefed = true;
    },

    poke: () => {
      pokes += 1;
      const lines = mission?.beeps ?? [];
      if (lines.length) say(lines[pokes % lines.length], clock + 1300);
      wowUntil = clock + 800;
      talkUntil = Math.max(talkUntil, clock + 600);
      if (still) return;
      const spinning = pokes % 4 === 0;
      svg?.animate?.(spinning ? SPIN : JOLT, { duration: spinning ? 620 : 420, easing: 'ease-out' });
    },

    dispose: () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
      window.removeEventListener('pointermove', onPointer);
      sky.style.zIndex = '';
    },
  };
};
