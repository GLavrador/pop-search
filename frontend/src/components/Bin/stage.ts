import type { Dictionary } from '../../i18n/en';
import type { Face, Pose } from '../Assistant/trips';
import type { Trashable } from '../Desktop/icons';
import type { Borne } from '../Desktop/DesktopIcon';
import type { Store } from '../../utils/store';

export type EmoteKey = keyof Dictionary['bin']['emotes'];

/** How it feels about going in: it would rather not, or it is up for it. */
export type Mood = keyof Dictionary['bin']['going'];
/** How it comes out: with what it went for, or without. */
export type Outcome = keyof Dictionary['bin']['back'];

/** One of the things it says in full on the way in or once out, by where it is in the dictionary. */
export type Line =
  | { on: 'going'; mood: Mood; turn: number }
  | { on: 'back'; outcome: Outcome; turn: number };

export type Ease = 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The robot of the trip to the bin: where it is, which way up, and how hard it is squeezing. */
export interface Actor extends Point {
  ms: number;
  ease: Ease;
  pose: Pose;
  face: Face;
  lean: number;
  /** Degrees it is turned by. On its head is 180. */
  turn: number;
  /** How wide and how tall it makes itself, next to its own size. */
  squeeze: Point;
  gaze: Point;
  talking: boolean;
  line: Line | null;
  emote: EmoteKey | null;
}

export type Look = Partial<Pick<Actor, 'pose' | 'face' | 'turn' | 'squeeze' | 'gaze' | 'talking'>>;

export interface Flight extends Omit<Look, 'pose'> {
  /** The pose on the way. Flying, unless it says otherwise. */
  pose?: Pose;
  /** The pose once there. */
  then?: Pose;
  ease?: Ease;
}

/** A jolt of the bin: something is forced into it, goes down it, or comes out of it. */
export type Rattle = 'jam' | 'gulp' | 'pop';

/** The way into the bin, opening over the desktop from a point of the screen or closing down to it. */
export interface Iris extends Point {
  state: 'opening' | 'open' | 'closing';
  ms: number;
}

export interface BinView {
  /** Nothing going on, the robot on its way in, the inside of the bin, or the way out. */
  phase: 'idle' | 'entering' | 'inside' | 'leaving';
  /** Where the robot has taken the bin, off its place and into the open. */
  borne: Borne | null;
  /** Where the front of the bin is drawn again over the robot, so that what goes down behind it is in it. */
  front: Point | null;
  /** How far down the screen the mouth of the bin is, when nothing of the robot under it is seen. */
  hole: number | null;
  iris: Iris | null;
}

export const IDLE: BinView = { phase: 'idle', borne: null, front: null, hole: null, iris: null };

/** Kept in a store because it changes many times a second. */
export type Cast = Store<Actor | null>;

/** Everything a trip can do to the screen. The scripts only ever talk to this. */
export interface Stage {
  screen: () => { w: number; h: number };
  /** The picture of the bin, where it stands when nobody has moved it. */
  bin: () => Box;
  wait: (ms: number) => Promise<void>;
  appear: (at: Point, look?: Look) => void;
  fly: (to: Point, ms: number, flight?: Flight) => Promise<void>;
  look: (look: Look) => void;
  say: (line: Line | null) => void;
  emote: (emote: EmoteKey, ms?: number) => void;
  /** Takes the bin this far from its place, or lets it go back there with null. */
  carry: (by: Point | null, ms: number) => Promise<void>;
  rattle: (how: Rattle) => void;
  /** Puts the robot behind the front of the bin, whose picture is at that point, or back before it with null. */
  behind: (bin: Point | null) => void;
  /** Shows only what of the robot is over the mouth of the bin, that far down the screen, or all of it with null. */
  through: (rim: number | null) => void;
  /** Opens the inside of the bin over the desktop from that point, or closes it down to it. */
  iris: (at: Point, open: boolean, ms: number) => Promise<void>;
  /** One of the icons comes out of the bin and goes back to its place. */
  release: (zone: Trashable) => void;
  /** The robot is nowhere on the desktop. */
  vanish: () => void;
}
