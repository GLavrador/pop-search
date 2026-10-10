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
} from './flight';
import {
  HOP,
  hide,
  landmark,
  openWindow,
  planTrip,
  type Emotes,
  type Face,
  type Leg,
  type Pose,
  type Scene,
  type Stop,
} from './trips';
import {
  angleOf,
  coast,
  hangFrom,
  steady,
  swing,
  throwOf,
  type Hang,
  type Sample,
} from './carry';
import { createVariety } from './variety';
import type { Aim } from '../Demo/spotlight';

export type Cue = 'greet' | 'teach' | 'cheer' | 'rest' | 'watch' | 'worry' | 'sleep';

/** How restless it is between errands: the guide keeps it busy, the app lets it be. */
export type Roam = 'eager' | 'calm' | 'never';

/** A control, or a way to find it once it is on screen. */
export type Target = HTMLElement | (() => HTMLElement | null) | null;

export type Move = 'jolt' | 'spin' | 'hop' | 'nod' | 'shake';

/** The desktop icons it can be dropped on. Each one gets its own answer. */
export type Zone = 'bin' | 'computer' | 'app';

export interface Mission {
  /** Changes whenever the robot has something new to say. */
  utterance: number | string;
  cue: Cue;
  /** The control it is talking about, when there is one. */
  target: Target;
  aim: Aim | null;
  /** True while the app window is down on the taskbar, with nothing to point at. */
  parked: boolean;
  roam: Roam;
  /** How long its mouth keeps moving once it lands. Each cue has its own default. */
  speech?: number;
  beeps: readonly string[];
  emotes: Emotes;
}

/** Something it does on the spot, without leaving where it is. */
export interface Reaction {
  face?: Face;
  emote?: string;
  move?: Move;
  ms?: number;
}

interface Parts {
  sky: HTMLElement;
  craft: HTMLElement;
  emote: HTMLElement;
  /** Whatever hangs over it: what it is saying, or its menu. Filled in from outside. */
  balloon: HTMLElement;
  /** The seat kept for the robot inside the assistant panel. */
  home: RefObject<HTMLElement | null>;
  /** The scrolling panel it must stay inside while pointing. */
  stage: RefObject<HTMLElement | null>;
}

export interface Pilot {
  brief: (mission: Mission) => void;
  /** True when the click was spent bringing the window back. */
  poke: (quiet?: boolean) => boolean;
  react: (reaction: Reaction) => void;
  /** Keeps it where it is for as long as someone is using what hangs over it. */
  pin: (on: boolean) => void;
  /** Sends it off on a trip right away. */
  trick: () => void;
  /** Picked up by the pointer at that point of the screen. */
  grab: (x: number, y: number) => void;
  drag: (x: number, y: number) => void;
  /** Let go. Says what it was dropped on, if anything. */
  release: () => Zone | null;
  dispose: () => void;
}

const ROBOT = { w: 46, h: 53 };
const AHEAD: Point = { x: 0, y: 0 };
const EYE_TRAVEL = { x: 2.2, y: 1.3 };
const HEAD_TURN = 1.6;

const FIRST_DWELL = 16000;
const DWELL = 12000;
const SEAT_DWELL = 8000;
const CALM_FIRST = 24000;
const CALM_DWELL = 34000;
const CALM_SPREAD = 30000;
const SETTLED_FOR = 6000;
const SPEECH: Record<Cue, number> = {
  greet: 3200,
  teach: 1900,
  cheer: 1900,
  rest: 0,
  watch: 900,
  worry: 1400,
  sleep: 0,
};
const FACES: Record<Cue, Face> = {
  greet: 'happy',
  teach: 'neutral',
  cheer: 'happy',
  rest: 'neutral',
  watch: 'curious',
  worry: 'worried',
  sleep: 'sleepy',
};
const POINTER_MEMORY = 1600;
const REMEASURE_EVERY = 110;
const SWIFT = 0.3;
const SEATED = 9;
const ROOST_INSET = 118;
const BALLOON_GAP = 10;
const BALLOON_LIFT = 23;
const DROP_REACH = 14;
// Wherever it is caught, it ends up held by the antenna.
const HANDLE: Point = { x: 23, y: 4 };
const TRAIL = 8;
const BOUNCE = 0.45;
const BRACE = 0.03;
const MAX_BRACE = 24;
const SNORE_EVERY = 9000;

const LAYERS = { behind: '0', front: '' };

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
const NOD = [
  { transform: 'translateY(0)' },
  { transform: 'translateY(3px)' },
  { transform: 'translateY(0)' },
  { transform: 'translateY(3px)' },
  { transform: 'translateY(0)' },
];
const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(4px)' },
  { transform: 'translateX(0)' },
];
const MOVES: Record<Move, { frames: Keyframe[]; ms: number }> = {
  jolt: { frames: JOLT, ms: 420 },
  spin: { frames: SPIN, ms: 620 },
  hop: { frames: HOP, ms: 400 },
  nod: { frames: NOD, ms: 520 },
  shake: { frames: SHAKE, ms: 520 },
};

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

export const createPilot = ({ sky, craft, emote, balloon, home, stage }: Parts): Pilot => {
  const svg = craft.querySelector('svg');
  const vary = createVariety();
  const body = craft.querySelector<HTMLElement>('button');
  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const size = { w: craft.offsetWidth || ROBOT.w, h: craft.offsetHeight || ROBOT.h };

  let mission: Mission | null = null;
  let briefed = false;
  let visits = 0;
  let lastTrip = '';
  let wantTrick = false;

  let pos: Point | null = null;
  let flight: Flight | null = null;
  let leg: Leg | null = null;
  let perch: Stop | null = null;
  let queue: Leg[] = [];
  let holdUntil = 0;
  let pinned = false;
  let held: Point | null = null;
  let hand: Point = { x: 0, y: 0 };
  let grip: Point = HANDLE;
  let hang: Hang | null = null;
  let pivotWas: Point | null = null;
  let trail: Sample[] = [];
  let tilt = 0;
  let tiltRate = 0;
  let slide: Point | null = null;
  let landing = { scared: false, hold: 0 };

  let face: Face = 'neutral';
  let flash: Face = 'wow';
  let flashUntil = 0;
  let lean = 0;
  const gaze = { x: 0, y: 0 };
  let talkUntil = 0;
  let emoteUntil = 0;
  let snoreAt = 0;

  let clock = 0;
  let measuredAt = 0;
  let arrangedAt = 0;
  let tuckedAt = 0;
  let shifted = false;
  let balloonOn = false;
  let pokes = 0;
  let prankUntil = 0;
  let lastInput = 0;
  let pointer: (Point & { at: number }) | null = null;
  let later: { at: number; run: () => void }[] = [];
  let raf = 0;

  // Before the first frame there is no frame clock yet; both run on the same timeline.
  const present = () => clock || performance.now();

  const setFlag = (name: string, value: string | null) => {
    if (value === null) craft.removeAttribute(name);
    else if (craft.getAttribute(name) !== value) craft.setAttribute(name, value);
  };

  // A page that is not laid out reports empty boxes: that is no place to fly to.
  const boxOf = (node: Element | null): Box | null => {
    const box = node?.getBoundingClientRect();
    return box && (box.width > 0 || box.height > 0) ? box : null;
  };

  const shown = (node: HTMLElement | null | undefined): node is HTMLElement =>
    !!node && node.isConnected && node.getClientRects().length > 0;

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
    emotes: () =>
      mission?.emotes ?? {
        heavy: '',
        sorry: '',
        knock: '',
        puzzled: '',
        grabbed: [],
        bin: [],
        hiding: [],
      },
    after: (ms, run) => later.push({ at: clock + ms, run }),
    move,
    prank: (ms) => {
      prankUntil = clock + ms;
    },
    idleFor: () => clock - lastInput,
    vary,
  };

  /** Keeps the short label on screen: near an edge it slides along instead of running off it. */
  const tuck = () => {
    tuckedAt = clock;
    if (!pos) return;

    const width = emote.offsetWidth;
    const reach = Math.max(6, window.innerWidth - width - 6);
    // Up against the top of the screen there is no room over its head: it goes beside it.
    const beside = pos.y < 24;
    const fitsRight = pos.x + size.w + 6 + width <= window.innerWidth - 6;
    const left = beside
      ? fitsRight
        ? size.w + 6
        : -width - 6
      : clamp(pos.x + 36, 6, reach) - pos.x;

    emote.toggleAttribute('data-beside', beside);
    emote.style.left = `${Math.round(left)}px`;
  };

  const say = (text: string, until: number) => {
    if (!text) return;
    emote.textContent = text;
    emote.setAttribute('data-on', '');
    emoteUntil = until;
    tuck();
  };

  const hush = () => {
    emote.removeAttribute('data-on');
    emoteUntil = 0;
  };

  const label = (now: number) => {
    if (!emoteUntil) return;
    if (now >= emoteUntil) hush();
    else if (now - tuckedAt > REMEASURE_EVERY) tuck();
  };

  /**
   * Hangs the balloon over the robot and inside the screen. With no room above
   * it goes beside the robot, and only as a last resort under it, over the app.
   */
  const arrange = (now: number) => {
    arrangedAt = now;
    if (!pos || !balloon.firstElementChild) return;

    const width = balloon.offsetWidth;
    const height = balloon.offsetHeight;
    const fitsAbove = pos.y - height - BALLOON_GAP >= 4;
    const fitsBelow = pos.y + size.h + BALLOON_GAP + height <= window.innerHeight - 34;
    let hang = 'up';
    if (perch?.side === 'below') {
      hang = fitsBelow || !fitsAbove ? 'drop' : 'up';
    } else if (!fitsAbove) {
      const clear = !perch?.side && pos.y + size.h - BALLOON_LIFT - height >= 4;
      const reach = width + BALLOON_GAP + 8;
      if (clear && pos.x - reach >= 0) hang = 'left';
      else if (clear && pos.x + size.w + reach <= window.innerWidth) hang = 'right';
      else hang = 'drop';
    }

    const left = clamp(
      pos.x + size.w / 2 - width / 2,
      6,
      Math.max(6, window.innerWidth - width - 6),
    );
    balloon.style.setProperty('--shift', `${Math.round(left - pos.x)}px`);
    balloon.style.setProperty('--tail', `${Math.round(pos.x + size.w / 2 - left)}px`);
    if (balloon.getAttribute('data-hang') !== hang) balloon.setAttribute('data-hang', hang);
  };

  const aimed = (): HTMLElement | null => {
    const target = typeof mission?.target === 'function' ? mission.target() : mission?.target;
    if (!shown(target)) return null;
    const pick = mission?.aim?.pick;
    const control = pick ? target.querySelector<HTMLElement>(pick) : null;
    return shown(control) ? control : target;
  };

  const beside = (control: HTMLElement): Stop => {
    const box = control.getBoundingClientRect();
    // Inside the panel it keeps to the panel; anything else has the whole screen.
    const room =
      !mission?.aim?.free && stage.current?.contains(control)
        ? stage.current.getBoundingClientRect()
        : { left: 4, top: 4, right: window.innerWidth - 4, bottom: window.innerHeight - 4 };
    const tall = balloon.firstElementChild ? balloon.offsetHeight + BALLOON_GAP : 0;

    let spot = perchBy(box, room, size, mission?.aim?.from);
    // On top with no room left above, the balloon would drop over the control itself.
    if (tall && spot.side === 'above' && spot.at.y - tall < 4) {
      const under = perchBy(box, room, size, 'below');
      if (under.side === 'below') spot = under;
    }

    if (mission?.cue === 'watch' && spot.side === 'above') {
      return {
        at: onScreen({ x: spot.at.x, y: spot.at.y + SEATED }),
        side: 'above',
        pose: 'sit',
      };
    }
    return { at: onScreen(spot.at), side: spot.side };
  };

  const byClock = (): Stop | null => {
    const bar = boxOf(landmark('taskbar'));
    if (!bar) return null;
    const dial = boxOf(landmark('clock'));
    const right = dial ? dial.left - 16 : bar.right - 10;
    return {
      at: onScreen({ x: right - size.w, y: bar.top - size.h + SEATED }),
      pose: 'sit',
    };
  };

  /** With the window minimized there is nothing to teach: it waits on the app's button. */
  const onTask = (): Stop | null => {
    const button = boxOf(landmark('task'));
    const bar = boxOf(landmark('taskbar'));
    if (!button || !bar) return byClock();
    return {
      at: onScreen({
        x: (button.left + button.right - size.w) / 2,
        y: bar.top - size.h + SEATED,
      }),
      pose: 'sit',
    };
  };

  /** Where it lives between errands: up on the window, or down by the clock. */
  const roost = (): Stop | null => {
    const frame = openWindow();
    const box = boxOf(frame);
    if (!frame || !box) return byClock();

    if (box.top >= size.h - 8) {
      const x = clamp(box.right - size.w - ROOST_INSET, box.left + 8, box.right - size.w - 8);
      return { at: { x, y: box.top - size.h + SEATED }, pose: 'sit' };
    }

    // A window filling a small screen has the taskbar under it: the status bar is the ledge.
    const fills = box.top <= 1 && box.bottom >= window.innerHeight - 1;
    const ledge = fills ? boxOf(landmark('status')) : null;
    if (ledge) {
      return {
        at: { x: ledge.right - size.w - 12, y: ledge.top - size.h + SEATED },
        pose: 'sit',
      };
    }
    return byClock();
  };

  /** Next to the control it is talking about, in its seat, or wherever it lives. */
  const station = (): Leg => {
    const cue = mission?.cue ?? 'rest';
    const roam = mission?.roam ?? 'never';
    const returning = visits > 0;
    const points = cue === 'teach' || cue === 'greet' || cue === 'cheer';
    const festive = cue === 'greet' || cue === 'cheer';
    const speech = mission?.speech ?? SPEECH[cue];

    let hold = DWELL;
    if (roam === 'calm') hold = returning ? CALM_DWELL + Math.random() * CALM_SPREAD : CALM_FIRST;
    else if (roam === 'eager' && mission?.target) hold = returning ? DWELL : FIRST_DWELL;
    else if (roam === 'eager') hold = SEAT_DWELL + speech;

    return {
      mission: true,
      hold,
      face: festive && returning ? 'neutral' : FACES[cue],
      where: () => {
        if (cue === 'sleep') return byClock();
        if (mission?.parked) return onTask();

        const control = aimed();
        if (control) return beside(control);

        const seat = home.current;
        if (shown(seat)) {
          const box = seat.getBoundingClientRect();
          return { at: { x: box.left, y: box.top } };
        }
        return roost();
      },
      pose: (where) => {
        if (cue === 'cheer' && !returning) return 'cheer';
        if (points && where === 'above') return 'point-down';
        if (points && where === 'below') return 'point-up';
        if (points && where === 'left') return 'point-right';
        if (points && where === 'right') return 'point-left';
        return cue === 'greet' && !returning ? 'wave' : 'stand';
      },
      gaze: (where) => {
        if (where === 'above') return { x: 0, y: 1 };
        if (where === 'below') return { x: 0, y: -1 };
        if (where === 'left') return { x: 1, y: 0.2 };
        if (where === 'right') return { x: -1, y: 0.2 };
        if (cue === 'sleep') return { x: 0, y: 0.8 };
        return mission?.parked ? 'wander' : AHEAD;
      },
    };
  };

  const land = (now: number) => {
    if (!leg) return;
    flight = null;
    face = leg.face;
    holdUntil = now + (wantTrick ? 250 : leg.hold);
    if (leg.mission) visits += 1;
    if (leg.emote) say(leg.emote(), holdUntil);
    move(SQUASH, 260);
    leg.onLand?.();
    arrange(now);
  };

  /** Sets off for a stop. False when the stop cannot be found yet. */
  const depart = (next: Leg, now: number, speech = 0) => {
    const spot = next.where();
    if (!spot) return false;

    leg = next;
    perch = spot;
    hush();

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

  const zoneAt = (at: Point): Zone | null => {
    const x = at.x + size.w / 2;
    const y = at.y + size.h / 2;
    for (const node of document.querySelectorAll<HTMLElement>('[data-robot-zone]')) {
      const box = node.getBoundingClientRect();
      const inside =
        x >= box.left - DROP_REACH &&
        x <= box.right + DROP_REACH &&
        y >= box.top - DROP_REACH &&
        y <= box.bottom + DROP_REACH;
      if (inside) return (node.dataset.robotZone as Zone | undefined) ?? null;
    }
    return null;
  };

  /** Out of its own hands: drawn where physics puts it, turned about the point it is held by. */
  const toss = (now: number, pose: Pose, look: Face) => {
    if (!pos) return;
    craft.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    craft.style.setProperty('--lean', `${lean.toFixed(1)}deg`);
    if (body) {
      body.style.transformOrigin = `${grip.x.toFixed(1)}px ${grip.y.toFixed(1)}px`;
      body.style.transform = `rotate(${tilt.toFixed(3)}rad)`;
    }
    setFlag('data-pose', pose);
    setFlag('data-face', now < flashUntil ? flash : look);
    setFlag('data-talking', null);
    if (sky.style.zIndex !== LAYERS.front) sky.style.zIndex = LAYERS.front;
    if (balloonOn) {
      balloonOn = false;
      balloon.removeAttribute('data-on');
    }
    label(now);
  };

  /** In someone's hand it hangs from the pointer and swings with every move of it. */
  const carry = (now: number, dt: number) => {
    if (!pos || !held) return;

    const ease = Math.min(1, dt / 110);
    held = { x: held.x + (HANDLE.x - held.x) * ease, y: held.y + (HANDLE.y - held.y) * ease };
    grip = held;
    pos = onScreen({ x: hand.x - held.x, y: hand.y - held.y });
    lean -= lean * ease;

    const pivot = { x: pos.x + held.x, y: pos.y + held.y };
    if (!still) {
      hang = swing(hang ?? hangFrom(pivot), pivotWas ?? pivot, pivot, dt);
      const turned = angleOf(hang, pivot);
      tiltRate = ((turned - tilt) / dt) * 1000;
      tilt = turned;
    }
    pivotWas = pivot;

    toss(now, 'dangle', 'wow');
  };

  /** Back on its own feet: whatever it was doing before is over, and this spot is home for now. */
  const touchDown = (now: number) => {
    if (!pos) return;
    const here = pos;
    const { scared, hold } = landing;

    slide = null;
    hang = null;
    tilt = 0;
    tiltRate = 0;
    if (body) body.style.transform = '';

    leg = {
      where: () => ({ at: here }),
      pose: 'stand',
      face: scared ? 'worried' : 'neutral',
      hold,
    };
    perch = { at: here };
    face = leg.face;
    holdUntil = now + hold;
    move(SQUASH, 300);
    if (scared) queue = hide(scene);
  };

  /** Let go with some speed left: it fires its jets against it and leans back until it stops. */
  const settle = (now: number, dt: number) => {
    if (!pos || !slide) return;

    const next = coast(pos, slide, dt);
    const inside = onScreen(next.at);
    slide = {
      x: inside.x === next.at.x ? next.speed.x : -next.speed.x * BOUNCE,
      y: inside.y === next.at.y ? next.speed.y : -next.speed.y * BOUNCE,
    };
    pos = inside;

    ({ angle: tilt, rate: tiltRate } = steady(tilt, tiltRate, dt));
    const brace = clamp(-slide.x * BRACE, -MAX_BRACE, MAX_BRACE);
    lean += (brace - lean) * Math.min(1, dt / 80);

    const speed = Math.hypot(slide.x, slide.y);
    toss(now, speed > 40 ? 'brake' : 'stand', speed > 320 ? 'wow' : 'neutral');
    if (speed < 24 && Math.abs(tilt) < 0.03 && Math.abs(tiltRate) < 0.4) touchDown(now);
  };

  const advance = (now: number) => {
    const roam = mission?.roam ?? 'never';
    const restless =
      leg?.mission === true &&
      roam !== 'never' &&
      !still &&
      !mission?.parked &&
      mission?.cue !== 'sleep';

    if (!queue.length && (wantTrick || restless)) {
      // In the app it waits for a pause: nobody wants it crossing the screen as they type.
      if (!wantTrick && roam === 'calm' && now - lastInput < SETTLED_FOR) {
        holdUntil = now + 2500;
        return;
      }
      const trip = planTrip(scene, lastTrip);
      wantTrick = false;
      if (trip) {
        lastTrip = trip.name;
        queue = trip.legs;
      }
    }

    const next = queue.shift();
    if (next) depart(next, now);
    else if (leg?.mission) holdUntil = now + DWELL;
    else depart(station(), now, roam === 'eager' ? 600 : 0);
  };

  const tick = (now: number) => {
    raf = window.requestAnimationFrame(tick);
    // With no viewport there is nowhere to be: every box on the page is meaningless.
    if (!window.innerWidth || !window.innerHeight) return;
    const dt = clock ? clamp(now - clock, 1, 80) : 16;
    clock = now;

    if (held) {
      carry(now, dt);
      return;
    }
    if (slide) {
      settle(now, dt);
      return;
    }

    if (briefed) {
      queue = [];
      later = [];
      visits = 0;
      briefed = !depart(station(), now, mission?.speech ?? SPEECH[mission?.cue ?? 'rest']);
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
          perch = spot;
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
          perch = spot;
          const off = Math.hypot(spot.at.x - pos.x, spot.at.y - pos.y);
          if (off > 30 && !still) {
            flight = planFlight(pos, spot.at, now, 0.3 * climbing(pos, spot.at));
          } else {
            pos = spot.at;
          }
        }
      }
      if (!flight && !pinned && now >= holdUntil) advance(now);
    }

    if (shifted) measuredAt = now;
    shifted = false;
    if (!leg || !pos) return;

    const flying = flight !== null;
    const side = perch?.side;
    lean += ((flying ? leanFor(speedX) : 0) - lean) * Math.min(1, dt / 110);

    let want: Point = AHEAD;
    const rest = typeof leg.gaze === 'function' ? leg.gaze(side) : leg.gaze;
    if (flying) {
      want = heading ?? want;
    } else if (pointer && now - pointer.at < POINTER_MEMORY) {
      const dx = pointer.x - (pos.x + size.w / 2);
      const dy = pointer.y - (pos.y + size.h * 0.35);
      const far = Math.hypot(dx, dy) || 1;
      want = { x: dx / far, y: dy / far };
    } else if (rest === 'wander') {
      want = { x: Math.sin(now / 700), y: 0.1 };
    } else if (rest) {
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

    const pose = perch?.pose ?? (typeof leg.pose === 'function' ? leg.pose(side) : leg.pose);
    setFlag('data-pose', flying ? 'fly' : pose);
    setFlag('data-face', now < flashUntil ? flash : flying ? 'neutral' : face);
    setFlag('data-talking', now < talkUntil ? '' : null);

    const depth = leg.layer === 'behind' ? 'behind' : 'front';
    if (sky.style.zIndex !== LAYERS[depth]) sky.style.zIndex = LAYERS[depth];
    label(now);

    if (!flying && leg.mission && mission?.cue === 'sleep' && now >= snoreAt) {
      say('z z z', now + 2800);
      snoreAt = now + SNORE_EVERY;
    }

    const open = !flying && (pinned || leg.mission === true);
    if (open !== balloonOn) {
      balloonOn = open;
      balloon.toggleAttribute('data-on', open);
    }
    if (open && now - arrangedAt > REMEASURE_EVERY) arrange(now);
  };

  const onLayout = () => {
    shifted = true;
  };
  const onPointer = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY, at: clock };
  };
  const onInput = () => {
    lastInput = present();
  };

  window.addEventListener('resize', onLayout);
  window.addEventListener('scroll', onLayout, true);
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onInput, { passive: true });
  window.addEventListener('keydown', onInput);
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

    poke: (quiet = false) => {
      // Sitting on the taskbar button it is in the way of it, so it presses it for you.
      if (mission?.parked && mission.cue !== 'sleep') {
        landmark('task')?.click();
        return true;
      }

      const now = present();
      pokes += 1;
      const lines = mission?.beeps ?? [];
      if (!quiet && lines.length) say(lines[pokes % lines.length], now + 1300);
      flash = 'wow';
      flashUntil = now + 800;
      if (!quiet) talkUntil = Math.max(talkUntil, now + 600);
      const spinning = pokes % 4 === 0;
      move(spinning ? SPIN : JOLT, spinning ? 620 : 420);
      return false;
    },

    react: ({ face: look, emote: text, move: kind, ms = 1700 }) => {
      const now = present();
      if (look) {
        flash = look;
        flashUntil = now + ms;
      }
      if (text) {
        say(text, now + ms + 400);
        talkUntil = Math.max(talkUntil, now + 700);
      }
      if (kind) move(MOVES[kind].frames, MOVES[kind].ms);
    },

    pin: (on) => {
      pinned = on;
      if (!on) holdUntil = Math.max(holdUntil, present() + 1200);
    },

    trick: () => {
      wantTrick = true;
      holdUntil = 0;
    },

    grab: (x, y) => {
      const now = present();
      pos ??= { x: x - size.w / 2, y: y - size.h / 2 };
      hand = { x, y };
      held = { x: x - pos.x, y: y - pos.y };
      hang = null;
      pivotWas = null;
      trail = [];
      slide = null;
      flight = null;
      queue = [];
      later = [];
      lastInput = now;
      say(vary('grabbed', scene.emotes().grabbed), now + 1300);
    },

    drag: (x, y) => {
      if (!held) return;
      hand = { x, y };
      pos = onScreen({ x: x - held.x, y: y - held.y });
      trail = [...trail.slice(1 - TRAIL), { x, y, at: performance.now() }];
    },

    release: () => {
      if (!held || !pos) return null;
      held = null;

      const now = present();
      const zone = zoneAt(pos);
      const scared = zone === 'bin';

      // Put on an icon it stays on it; thrown anywhere else it carries on for a bit.
      slide = zone || still ? { x: 0, y: 0 } : throwOf(trail, performance.now());
      // Wherever it ends up it stays a moment, then goes back to what it was doing.
      landing = { scared, hold: scared ? 450 : zone ? 700 : 2400 };

      if (scared) {
        flash = 'worried';
        flashUntil = now + 1500;
        say(vary('bin', scene.emotes().bin), now + 1500);
        move(SHAKE, 520);
      }
      return zone;
    },

    dispose: () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', onLayout);
      window.removeEventListener('scroll', onLayout, true);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onInput);
      window.removeEventListener('keydown', onInput);
      sky.style.zIndex = '';
    },
  };
};
