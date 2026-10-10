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
import { landmark, planTrip, type Emotes, type Face, type Leg, type Scene } from './trips';
import type { Aim } from '../Demo/spotlight';

export type Cue = 'greet' | 'teach' | 'cheer';

export interface Mission {
  /** Changes whenever the robot has something new to say. */
  utterance: number;
  cue: Cue;
  /** The spotlight of the current step, when it has one. */
  target: HTMLElement | null;
  aim: Aim | null;
  /** True while the app window is down on the taskbar, with nothing to point at. */
  parked: boolean;
  beeps: readonly string[];
  emotes: Emotes;
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
const SWIFT = 0.3;

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
  let prankUntil = 0;
  let pointer: (Point & { at: number }) | null = null;
  let later: { at: number; run: () => void }[] = [];
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

  const move = (frames: Keyframe[], duration: number) => {
    if (!still) svg?.animate?.(frames, { duration, easing: 'ease-out' });
  };

  const scene: Scene = {
    size,
    position: () => pos,
    onScreen,
    emotes: () => mission?.emotes ?? { heavy: '', sorry: '', knock: '', puzzled: '' },
    after: (ms, run) => later.push({ at: clock + ms, run }),
    move,
    prank: (ms) => {
      prankUntil = clock + ms;
    },
  };

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

  /** With the window minimized there is nothing to teach: it waits on the app's button. */
  const waiting = (): Leg => ({
    mission: true,
    hold: DWELL,
    face: 'neutral',
    pose: 'sit',
    gaze: 'wander',
    layer: 'top',
    where: () => {
      const button = boxOf(landmark('task'));
      const bar = boxOf(landmark('taskbar'));
      if (!button || !bar) return null;
      return {
        at: onScreen({
          x: (button.left + button.right - size.w) / 2,
          y: bar.top - size.h + 9,
        }),
      };
    },
  });

  /** Next to the control the step is about, or back in its seat when there is none. */
  const station = (): Leg => {
    if (mission?.parked) return waiting();

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

  const land = (now: number) => {
    if (!leg) return;
    flight = null;
    face = leg.face;
    holdUntil = now + leg.hold;
    if (leg.mission) visits += 1;
    if (leg.emote) say(leg.emote(), holdUntil);
    move(SQUASH, 260);
    leg.onLand?.();
  };

  /** Sets off for a stop. False when the stop cannot be found yet. */
  const depart = (next: Leg, now: number, speech = 0) => {
    const spot = next.where();
    if (!spot) return false;

    leg = next;
    side = spot.side;
    hush();
    sky.style.zIndex = LAYERS[next.layer === 'behind' ? 'behind' : 'front'];

    // First time on stage, or back from beyond the edge: it flies in from outside.
    pos = next.from?.() ?? pos ?? { x: window.innerWidth + 12, y: Math.max(16, spot.at.y - 110) };

    const bow = next.direct ? 0 : (0.45 + Math.random() * 0.55) * (Math.random() < 0.8 ? 1 : -1);
    const plan = planFlight(pos, spot.at, now, bow * climbing(pos, spot.at));
    const path = next.direct
      ? plan
      : contain(plan, {
          left: 4,
          top: 4,
          right: window.innerWidth - size.w - 4,
          bottom: window.innerHeight - size.h - 4,
        });
    const pace = still ? 0 : next.swift ? SWIFT : 1;
    flight = { ...path, duration: path.duration * pace };

    if (speech) talkUntil = now + flight.duration + speech;
    return true;
  };

  const advance = (now: number) => {
    if (!queue.length && leg?.mission && !still && !mission?.parked) {
      const trip = planTrip(scene, lastTrip);
      if (trip) {
        lastTrip = trip.name;
        queue = trip.legs;
      }
    }

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
      later = [];
      visits = 0;
      briefed = !depart(station(), now, SPEECH[mission?.cue ?? 'teach']);
    }
    if (!leg || !pos) return;

    if (later.length) {
      const due = later.filter((entry) => entry.at <= now);
      later = later.filter((entry) => entry.at > now);
      due.forEach((entry) => entry.run());
    }

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
      const sameStep =
        mission !== null &&
        mission.utterance === next.utterance &&
        mission.target === next.target &&
        mission.aim === next.aim &&
        mission.cue === next.cue;
      const unchanged = sameStep && mission?.parked === next.parked;
      // When it sent the window away itself, that is part of the act, not new orders.
      const itsOwnDoing = sameStep && clock < prankUntil;
      mission = next;
      if (!unchanged && !itsOwnDoing) briefed = true;
    },

    poke: () => {
      // Sitting on the taskbar button it is in the way of it, so it presses it for you.
      if (mission?.parked) {
        landmark('task')?.click();
        return;
      }

      pokes += 1;
      const lines = mission?.beeps ?? [];
      if (lines.length) say(lines[pokes % lines.length], clock + 1300);
      wowUntil = clock + 800;
      talkUntil = Math.max(talkUntil, clock + 600);
      const spinning = pokes % 4 === 0;
      move(spinning ? SPIN : JOLT, spinning ? 620 : 420);
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
