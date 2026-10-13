import type { Dictionary } from '../../i18n/en';
import type { Face, Pose } from '../Assistant/trips';
import type { IconZone } from '../Desktop/icons';
import type { Store } from '../../utils/store';

export type LineKey = keyof Dictionary['rebuild']['says'];
export type EmoteKey = keyof Dictionary['rebuild']['emotes'];

/** Why the desktop is being built: the program went in the bin, or the page has just opened. */
export type Kind = 'crash' | 'setup';

/** Nothing there, its box, its box with dashes, flashing an hour nobody set, running. */
export type ClockState = 'none' | 'frame' | 'blank' | 'unset' | 'on';

/**
 * How much of an icon is there: nothing, its outline, a third of its picture
 * with each of three blows, its name being written under it, and last an icon
 * like any other.
 */
export type Built = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const DRAWN: Built = 4;
export const NAMED: Built = 5;
export const WHOLE: Built = 6;

export type Tool = 'hammer' | 'duster' | null;
export type Ease = 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';

export interface Point {
  x: number;
  y: number;
}

/** How far along something is, from 0 (in place) to 1 (out of sight), and how long it takes to get there. */
export interface Slide {
  by: number;
  ms: number;
}

/** The robot of the show: where it is, how it looks and what it has in its hand. */
export interface Actor extends Point {
  ms: number;
  ease: Ease;
  pose: Pose;
  face: Face;
  lean: number;
  /** Turned to face left: what it holds is then on its left. */
  flip: boolean;
  /** Where its eyes are turned, from -1 (left) to 1 (right). */
  gaze: number;
  tool: Tool;
  line: LineKey | null;
  talking: boolean;
  emote: EmoteKey | null;
}

/** A piece of the blue, shooed off: the way it went, each part from -1 to 1. */
export interface Shooed extends Point {
  index: number;
}

export interface Tiles {
  cols: number;
  rows: number;
  /** Null while a piece is still in place. */
  fled: readonly (Point | null)[];
}

export interface RebuildView {
  /** Nothing happening, the icon on its way down the bin, or the show itself. */
  phase: 'idle' | 'swallowing' | 'show';
  kind: Kind;
  built: Record<IconZone, Built>;
  pressed: IconZone | null;
  /** The icon being polished, which gleams while it is. */
  shining: IconZone | null;
  taskbar: Slide;
  /** The Start button is on the taskbar. It is put there after the bar itself. */
  start: boolean;
  clock: ClockState;
  /** How much of the window is still rolled up, while it is being opened by hand. */
  shut: Slide | null;
}

/**
 * The robot of the show, and the blue that covers the desktop in the pieces it is
 * cleaned up in. Kept in stores because they change many times a second.
 */
export type Cast = Store<Actor | null>;
export type Blue = Store<Tiles | null>;

export type Look = Partial<Pick<Actor, 'pose' | 'face' | 'tool' | 'flip' | 'gaze'>>;

export interface Flight extends Omit<Look, 'pose'> {
  /** The pose on the way. Flying, unless it says otherwise. */
  pose?: Pose;
  /** The pose once there. */
  then?: Pose;
  ease?: Ease;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Everything the show can do to the screen. The scripts only ever talk to this. */
export interface Stage {
  screen: () => { w: number; h: number };
  box: (what: IconZone | 'taskbar' | 'window') => Box | null;
  wait: (ms: number) => Promise<void>;
  appear: (at: Point, look?: Look) => void;
  fly: (to: Point, ms: number, flight?: Flight) => Promise<void>;
  look: (look: Look) => void;
  say: (line: LineKey, ms: number) => Promise<void>;
  emote: (emote: EmoteKey, ms?: number) => void;
  build: (zone: IconZone, built: Built) => void;
  shine: (zone: IconZone | null) => void;
  press: (zone: IconZone | null) => void;
  taskbar: (by: number, ms: number) => Promise<void>;
  /** Puts the Start button on the taskbar. */
  start: () => void;
  clock: (state: ClockState) => void;
  tiles: () => { cols: number; rows: number };
  shoo: (pieces: Shooed[]) => void;
  /** Opens the window for real, rolled all the way up. */
  openWindow: () => void;
  roll: (by: number, ms: number) => Promise<void>;
  /** Puts everything back at once, leaving only the robot of the show. */
  mend: () => void;
}

export const ALL_ICONS: readonly IconZone[] = ['bin', 'computer', 'app'];

const ALL_BUILT: Record<IconZone, Built> = { bin: WHOLE, computer: WHOLE, app: WHOLE };

export const IDLE: RebuildView = {
  phase: 'idle',
  kind: 'crash',
  built: ALL_BUILT,
  pressed: null,
  shining: null,
  taskbar: { by: 0, ms: 0 },
  start: true,
  clock: 'on',
  shut: null,
};

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** How many pieces the blue is cut into on a screen of this size. */
export const gridFor = (w: number, h: number) => ({
  cols: clamp(Math.round(w / 95), 5, 14),
  rows: clamp(Math.round(h / 95), 5, 9),
});

/** The desktop with nothing on it, as the show finds it. */
export const wrecked = (kind: Kind): RebuildView => ({
  ...IDLE,
  phase: 'show',
  kind,
  built: { bin: 0, computer: 0, app: 0 },
  taskbar: { by: 1, ms: 0 },
  start: false,
  clock: 'none',
});

/** The blue over all of a screen of this size, every piece of it in place. */
export const blueOver = (w: number, h: number): Tiles => {
  const grid = gridFor(w, h);
  return { ...grid, fled: Array<Point | null>(grid.cols * grid.rows).fill(null) };
};
