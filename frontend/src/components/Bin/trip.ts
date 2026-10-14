import type { Trashable } from '../Desktop/icons';
import type { Box, Line, Mood, Outcome, Point, Stage } from './stage';

const ROBOT = { w: 46, h: 53 };
// How far under the top of its picture the mouth of the bin is.
const MOUTH = 9;
// What it says on the way is on screen at least this long, however short the way.
const READ_FOR = 2600;
const WHOLE: Point = { x: 1, y: 1 };
// Squeezed as far as it goes: all of it fits behind the front of the bin.
const SMALL: Point = { x: 0.3, y: 0.3 };
// How much of it shows over the edge when only its head is out: the antenna and the eyes.
const HEAD = 24;
const AHEAD: Point = { x: 0, y: 0 };

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

export interface Going {
  mood: Mood;
  turn: number;
}

export interface Return {
  /** What comes out with it, in the order it comes out. Nothing, when it leaves empty handed. */
  rescued: readonly Trashable[];
  turn: number;
}

/**
 * The bin stands in the corner of the screen, with no room over it for a robot
 * on its head. So the robot takes it out into the open first, and everything
 * that follows is measured from where it puts it down.
 */
const measure = (s: Stage) => {
  const { w } = s.screen();
  const home = s.bin();
  const by = { x: clamp(64, 0, Math.max(0, w - home.left - home.width - 56)), y: 104 };
  const spot = { x: home.left + by.x, y: home.top + by.y };
  const centre = spot.x + home.width / 2 - ROBOT.w / 2;
  const rim = spot.y + MOUTH;
  return {
    home,
    by,
    spot,
    centre,
    rim,
    mouth: { x: spot.x + home.width / 2, y: rim },
    over: { x: centre, y: spot.y - ROBOT.h - 14 },
    aside: { x: centre + 44, y: spot.y - 26 },
    // The middle of the bin, under its mouth: where the robot is once it is in.
    within: { x: centre, y: spot.y + home.height * 0.58 - ROBOT.h / 2 },
    // All of it under the mouth, at its own size: on the way out nothing of it shows until it is over the edge.
    below: { x: centre, y: rim + 2 },
  };
};

const under = (bin: Box): Point => ({
  x: bin.left + bin.width / 2 - ROBOT.w / 2,
  y: bin.top + bin.height - 8,
});

const beside = (bin: Box): Point => ({ x: bin.left + bin.width + 10, y: Math.max(2, bin.top - 8) });

const flightTime = (from: Point, to: Point) =>
  clamp(Math.hypot(to.x - from.x, to.y - from.y) * 2.4, 520, 1500);

const faceFor = (mood: Mood) => (mood === 'reluctant' ? 'disgust' : 'brave');
const going = ({ mood, turn }: Going): Line => ({ on: 'going', mood, turn });
const back = (outcome: Outcome, turn: number): Line => ({ on: 'back', outcome, turn });

/** A struggle in the mouth of the bin: it rocks from side to side, and the bin with it. */
const wriggle = async (s: Stage, times: number, each: number) => {
  for (let i = 0; i < times; i += 1) {
    s.look({ turn: 180 + (i % 2 ? 9 : -9) });
    s.rattle('jam');
    await s.wait(each);
  }
  s.look({ turn: 180 });
};

/**
 * The way in. It flies to the bin saying its piece, pulls the bin out to where
 * there is room, and turns on its head with its jets on. All of it is in sight
 * the whole time: it lands on the mouth of the bin and does not fit, makes itself
 * thin and gets its head in, then squeezes smaller still and goes down, feet last.
 */
export const goIn = async (s: Stage, from: Point, how: Going) => {
  const { home, by, spot, centre, rim, mouth, over, within } = measure(s);
  const face = faceFor(how.mood);
  const grip = under(home);
  const flown = flightTime(from, grip);

  s.appear(from, { pose: 'hover', face });
  s.say(going(how));
  // Seen where it was before it sets off, or it would be at the bin the moment it is drawn.
  await s.wait(40);
  await s.fly(grip, flown, { talking: true, then: 'tug' });
  s.look({ talking: false });
  s.emote('grab');
  await s.wait(380);
  await Promise.all([
    s.carry(by, 640),
    s.fly({ x: grip.x + by.x, y: grip.y + by.y }, 640, { pose: 'tug', then: 'hover' }),
  ]);
  await s.wait(Math.max(200, READ_FOR - flown - 1020));
  s.say(null);

  await s.fly(over, 400, { then: 'hover', gaze: { x: 0, y: 1 } });
  await s.wait(420);

  // On its head, feet in the air, and the jets that held it up now push it down.
  await s.fly({ x: centre, y: over.y - 8 }, 240, { pose: 'hover', turn: 180, ease: 'ease-out' });
  s.look({ pose: 'fly' });
  await s.wait(460);

  // As it is, it only comes down on the mouth of the bin and is flattened there.
  await s.fly({ x: centre, y: rim - ROBOT.h + 5 }, 200, { ease: 'ease-in', then: 'fly' });
  s.look({ face: 'strain', squeeze: { x: 1.16, y: 0.84 } });
  s.emote('stuck');
  await wriggle(s, 4, 170);

  s.look({ squeeze: WHOLE });
  await s.fly({ x: centre, y: over.y }, 300, { pose: 'hover', then: 'hover', ease: 'ease-out' });
  s.look({ face: 'worried' });
  s.emote('tight');
  await s.wait(900);

  // Arms in and as thin as it can make itself: its head goes in, and that is all.
  s.look({ face: 'strain', squeeze: { x: 0.68, y: 1.1 }, pose: 'fly' });
  s.emote('again');
  await s.wait(420);
  s.behind(spot);
  await s.fly({ x: centre, y: rim - ROBOT.h + 14 }, 190, { ease: 'ease-in', then: 'fly' });
  await wriggle(s, 5, 120);

  // Smaller and smaller as the jets force it down, until the feet are gone as well.
  s.look({ squeeze: { x: 0.5, y: 0.94 } });
  await s.fly({ x: centre, y: rim - ROBOT.h + 19 }, 200, { ease: 'ease-in', then: 'fly' });
  s.rattle('jam');
  await s.wait(160);
  await s.fly(within, 340, { squeeze: SMALL, ease: 'ease-in', then: 'fly' });
  s.rattle('gulp');
  s.emote('in', 700);
  await s.wait(760);
  s.vanish();
  s.behind(null);
  await s.iris(mouth, true, 620);
};

/** The way in for whoever asked for less motion: it says its piece where it is, and is inside. */
export const goInCalmly = async (s: Stage, from: Point, how: Going) => {
  const { mouth } = measure(s);

  s.appear(from, { pose: 'hover', face: faceFor(how.mood), talking: true });
  s.say(going(how));
  await s.wait(READ_FOR);
  s.say(null);
  s.vanish();
  await s.iris(mouth, true, 0);
};

/**
 * The way out. With what it went for, it shoots out of the bin and the icons
 * after it, each to its place. Empty handed it climbs out quietly. Either way it
 * comes up through the mouth of the bin at its own size, and nothing of it is
 * seen until it is over the edge. Then the bin goes back to its corner, as every
 * icon does.
 */
export const comeOut = async (s: Stage, { rescued, turn }: Return) => {
  const { by, centre, rim, mouth, aside, below } = measure(s);

  await s.carry(by, 0);
  s.through(rim);
  await s.iris(mouth, false, 520);
  await s.wait(260);

  if (rescued.length) {
    s.rattle('jam');
    await s.wait(280);
    s.rattle('jam');
    await s.wait(280);
    s.appear(below, { pose: 'fly', face: 'happy' });
    await s.wait(40);
    s.rattle('pop');
    s.emote('out', 900);
    await s.fly({ x: centre, y: rim - ROBOT.h - 44 }, 360, { ease: 'ease-out', then: 'hover' });
    s.through(null);
    await s.fly(aside, 320, { then: 'hover', gaze: { x: -1, y: 0.5 } });

    for (const zone of rescued) {
      s.rattle('pop');
      s.release(zone);
      await s.wait(430);
    }
    await s.wait(420);
    s.look({ pose: 'cheer', gaze: AHEAD, talking: true });
    s.say(back('rescued', turn));
    await s.wait(READ_FOR);
  } else {
    // First its head over the edge, and a look each way.
    s.appear(below, { pose: 'peek', face: 'neutral' });
    await s.wait(40);
    await s.fly({ x: centre, y: rim - HEAD }, 320, { pose: 'peek', ease: 'ease-out' });
    await s.wait(360);
    s.look({ gaze: { x: -1, y: 0 } });
    await s.wait(380);
    s.look({ gaze: { x: 1, y: 0 } });
    await s.wait(380);
    await s.fly({ x: centre, y: rim - ROBOT.h - 10 }, 460, {
      pose: 'hover',
      then: 'hover',
      gaze: AHEAD,
    });
    s.through(null);
    await s.fly(aside, 380, { then: 'hover' });
    s.look({ face: 'phew', talking: true });
    s.say(back('left', turn));
    await s.wait(READ_FOR - 400);
  }

  s.look({ talking: false, pose: 'hover' });
  s.say(null);
  await s.carry(null, 240);
  s.emote('back', 1100);
  await s.wait(1100);
};

export const comeOutCalmly = async (s: Stage, { rescued, turn }: Return) => {
  const { home, mouth } = measure(s);
  const won = rescued.length > 0;

  await s.carry(null, 0);
  await s.iris(mouth, false, 0);
  s.appear(beside(home), { pose: won ? 'cheer' : 'hover', face: won ? 'happy' : 'phew', talking: true });
  rescued.forEach((zone) => s.release(zone));
  s.say(back(won ? 'rescued' : 'left', turn));
  await s.wait(READ_FOR);
  s.say(null);
};

/** Where the robot is left once the trip is over, for whoever takes it from there. */
export const leftAt = (s: Stage, calm: boolean): Point => {
  const { home, aside } = measure(s);
  return calm ? beside(home) : aside;
};
