import type { IconZone } from '../Desktop/icons';
import {
  DRAWN,
  NAMED,
  type Ease,
  type EmoteKey,
  type Point,
  type Shooed,
  type Stage,
} from './stage';

const ROBOT = { w: 46, h: 53 };
const TASKBAR = 30;
// Where the feathers of the duster are, from its top left corner, when it faces right.
const DUSTER: Point = { x: 58, y: 56 };

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** The measures every act works from. Taken once, when the show begins. */
const measure = (s: Stage) => {
  const { w, h } = s.screen();
  const centre = w / 2 - ROBOT.w / 2;
  // High on the screen: what it says hangs under it, over the top of the text.
  return { w, h, centre, talkAt: { x: centre, y: clamp(h * 0.07, 36, 64) } };
};

type Scene = ReturnType<typeof measure>;

/**
 * The icons, each hammered together where it stands: an outline, a third of the
 * picture with each of three blows, then its name. The program is the robot's
 * own house, and gets a look from a step back and a polish besides.
 */
const buildIcons = async (s: Stage, quick: boolean) => {
  const order: [IconZone, EmoteKey][] = [
    ['bin', 'one'],
    ['computer', 'two'],
    ['app', 'three'],
  ];
  const blow = quick ? 200 : 360;

  for (const [zone, said] of order) {
    const slot = s.box(zone);
    if (slot) {
      // To the right of it and turned its way, so the hammer comes down on the picture.
      const beside = { x: slot.left + slot.width / 2 + 20, y: Math.max(2, slot.top - 36) };
      s.look({ face: 'stern' });
      await s.fly(beside, quick ? 380 : 650, { flip: true });
      s.build(zone, 1);
      await s.wait(quick ? 100 : 260);
      s.look({ tool: 'hammer', pose: 'hammer' });
      for (const built of [2, 3, DRAWN] as const) {
        await s.wait(blow);
        s.build(zone, built);
      }
      await s.wait(quick ? 100 : 220);

      if (zone === 'app') {
        const back = { x: beside.x + 16, y: beside.y };
        s.look({ tool: null, face: 'curious' });
        await s.fly(back, quick ? 150 : 240, { pose: 'hover', flip: true });
        await s.wait(quick ? 240 : 520);
        s.look({ face: 'happy' });
        await s.fly(beside, quick ? 130 : 220, { pose: 'hover', then: 'dust', flip: true });
        s.look({ tool: 'duster' });
        s.shine('app');
        s.emote('polish', quick ? 700 : 1200);
        await s.wait(quick ? 520 : 1000);
        s.shine(null);
      }

      s.look({ tool: null, pose: 'hover', face: 'happy' });
    }
    s.build(zone, NAMED);
    s.emote(said, quick ? 800 : 1300);
    await s.wait(quick ? 180 : 420);
  }

  s.look({ flip: false, face: 'stern' });
};

/** The taskbar, pulled up from under the screen. Unhurried, it slips twice first. */
const raiseTaskbar = async (s: Stage, { h, centre }: Scene, quick: boolean) => {
  const grip = (by: number) => ({ x: centre, y: h - TASKBAR * (1 - by) - ROBOT.h + 8 });
  const lookOn = { x: centre, y: h - 130 };
  const pull = async (to: number, ms: number, grunt: EmoteKey | null) => {
    await s.fly(grip(0.86), 320, { then: 'heave' });
    s.look({ face: 'strain' });
    if (grunt) s.emote(grunt);
    await Promise.all([
      s.taskbar(to, ms),
      s.fly(grip(to), ms, { pose: 'heave', then: 'heave', ease: 'ease-out' }),
    ]);
  };
  const slip = async (face: 'wow' | 'angry', said: EmoteKey) => {
    s.look({ face });
    await Promise.all([s.taskbar(0.86, 150), s.fly(lookOn, 300, { ease: 'ease-out' })]);
    s.emote(said);
    await s.wait(650);
  };

  s.look({ face: 'curious' });
  await s.fly(lookOn, quick ? 600 : 900);
  if (!quick) s.emote('bar');
  await s.taskbar(0.86, 250);

  if (!quick) {
    await s.wait(550);
    await pull(0.5, 650, 'heave');
    await slip('wow', 'slip');
    await pull(0.3, 750, 'heaveAgain');
    await slip('angry', 'slipAgain');
  }

  await pull(-0.15, 420, quick ? null : 'barUp');
  await Promise.all([
    s.taskbar(0, 130),
    s.fly(grip(0), 130, { pose: 'heave', ease: 'ease-in' }),
  ]);
  s.look({ face: 'phew' });
  if (!quick) s.emote('phew');
  await s.wait(quick ? 250 : 800);
};

/** The Start button, put on the bar with one blow of the hammer. */
const installStart = async (s: Stage, { h }: Scene, quick: boolean) => {
  const bar = s.box('taskbar');
  // Just past the button and turned back towards it, the hammer over its middle.
  const beside = { x: 40, y: (bar?.top ?? h - TASKBAR) - 44 };

  s.look({ face: 'stern' });
  await s.fly(beside, quick ? 450 : 750, { then: 'hammer', flip: true });
  s.look({ tool: 'hammer' });
  await s.wait(quick ? 230 : 400);
  s.start();
  s.look({ tool: null, pose: 'hover', face: 'happy' });
  s.emote('start', quick ? 800 : 1400);
  await s.wait(quick ? 200 : 700);
  s.look({ flip: false });
};

/** The clock: hammered together, then switched on. Unhurried, it first shows an hour nobody set. */
const buildClock = async (s: Stage, { w, h }: Scene, quick: boolean) => {
  const bar = s.box('taskbar');
  const dial = { x: w - 85, y: (bar?.top ?? h - TASKBAR) - 47 };

  s.look({ face: 'stern' });
  await s.fly(dial, quick ? 600 : 900, { then: 'hammer' });
  s.look({ tool: 'hammer' });
  if (!quick) s.emote('hammer');
  await s.wait(quick ? 260 : 500);
  s.clock('frame');
  await s.wait(quick ? 260 : 550);
  s.clock('blank');

  if (quick) {
    await s.wait(260);
    s.look({ tool: null, pose: 'cheer', face: 'happy' });
    s.clock('on');
    await s.wait(350);
    return;
  }

  await s.wait(450);
  s.look({ tool: null, pose: 'point-down', face: 'curious' });
  await s.wait(300);
  s.clock('unset');
  s.emote('unset');
  await s.wait(1400);
  s.look({ face: 'stern' });
  await s.fly({ x: dial.x, y: dial.y + 7 }, 90, { pose: 'point-down', then: 'point-down', ease: 'ease-in' });
  s.clock('on');
  await s.fly(dial, 110, { pose: 'cheer', then: 'cheer', ease: 'ease-out' });
  s.look({ face: 'happy' });
  s.emote('ticking');
  await s.wait(900);
};

/**
 * The blue, shooed off with a feather duster: it flies across two rows of it at
 * a time, one way and then back, and the pieces it reaches run from it.
 */
const shooBlue = async (s: Stage, { w, h }: Scene, quick: boolean) => {
  const { cols, rows } = s.tiles();
  const cell = { w: w / cols, h: h / rows };
  const across = Math.max(quick ? 400 : 760, cols * (quick ? 34 : 68));

  s.look({ tool: 'duster', face: 'stern' });

  for (let top = 0, pass = 0; top < rows; top += 2, pass += 1) {
    const deep = Math.min(2, rows - top);
    const heading = pass % 2 === 0 ? 1 : -1;
    const flip = heading < 0;
    const over = (col: number) => ({
      x: (col + 0.5) * cell.w - (flip ? ROBOT.w - DUSTER.x : DUSTER.x),
      y: clamp((top + deep / 2) * cell.h - DUSTER.y, 4, h - ROBOT.h - 4),
    });
    const column = (step: number) => (flip ? cols - 1 - step : step);

    await s.fly(over(column(0)), pass === 0 ? (quick ? 500 : 800) : 240, {
      pose: 'dust',
      then: 'dust',
      flip,
    });
    if (!quick && pass === 0) s.emote('shoo');
    if (!quick && pass === 2) s.emote('shooMore');

    for (let step = 0; step < cols; step += 1) {
      const col = column(step);
      if (step > 0) {
        await s.fly(over(col), across / cols, { pose: 'dust', then: 'dust', ease: 'linear', flip });
      }

      // Ahead of the duster and away from its line: up from the row above it, down from the one below.
      const pieces: Shooed[] = [];
      for (let row = top; row < top + deep; row += 1) {
        const index = row * cols + col;
        const stray = ((index * 37) % 11) / 11 - 0.5;
        const upward = deep === 2 ? row === top : col % 2 === 0;
        pieces.push({
          index,
          x: heading * (0.6 + 0.4 * stray),
          y: (upward ? -1 : 1) * (0.75 - 0.3 * stray),
        });
      }
      s.shoo(pieces);
    }
  }

  await s.wait(quick ? 300 : 500);
  s.look({ tool: null, pose: 'cheer', face: 'happy', flip: false });
  if (!quick) s.emote('clean');
  await s.wait(quick ? 250 : 800);
};

/** The program: knocked on, and when that does nothing, rolled open by hand. */
const openProgram = async (s: Stage, { h }: Scene, quick: boolean) => {
  const icon = s.box('app');
  if (icon && !quick) {
    // It jumps on the icon, or bumps it from underneath where there is no room on top.
    const under = icon.top < ROBOT.h - 12;
    const onIcon = {
      x: icon.left + (icon.width - ROBOT.w) / 2,
      y: under ? icon.top + icon.height - 6 : icon.top - ROBOT.h + 14,
    };
    const into = under ? -7 : 7;
    const knock = async (said: EmoteKey) => {
      for (let tap = 0; tap < 2; tap += 1) {
        s.press('app');
        await s.fly({ x: onIcon.x, y: onIcon.y + into }, 90, { pose: 'stand', then: 'stand', ease: 'ease-in' });
        await s.fly(onIcon, 110, { pose: 'stand', then: 'stand', ease: 'ease-out' });
        s.press(null);
        await s.wait(70);
      }
      s.emote(said);
    };
    s.look({ face: 'stern' });
    await s.fly(onIcon, 900, { then: 'stand' });
    await knock('knock');
    s.look({ face: 'curious' });
    await s.wait(800);
    s.look({ face: 'angry' });
    await knock('knockHard');
    await s.wait(500);
  }

  s.openWindow();
  await s.wait(80);
  const frame = s.box('window');
  if (!frame) {
    await s.roll(0, 0);
    return;
  }

  const hang = (by: number) => ({
    x: frame.left + (frame.width - ROBOT.w) / 2,
    y: Math.min(frame.top + frame.height * (1 - by) - 8, h - 96),
  });
  const haul = (by: number, ms: number, ease: Ease = 'ease-out') =>
    Promise.all([s.roll(by, ms), s.fly(hang(by), ms, { pose: 'tug', then: 'tug', ease })]);

  s.look({ face: 'stern' });
  await s.fly(hang(0.94), quick ? 550 : 800, { then: 'tug' });
  await s.roll(0.94, 150);
  s.look({ face: 'strain' });
  if (!quick) s.emote('pull');

  if (quick) {
    await haul(0.5, 420);
    await haul(0, 420);
  } else {
    await haul(0.7, 520);
    await s.wait(160);
    await haul(0.45, 520);
    s.look({ face: 'wow' });
    await haul(0.62, 170, 'ease-in');
    s.emote('slipped');
    await s.wait(420);
    s.look({ face: 'strain' });
    s.emote('pullHard');
    await haul(0.2, 620);
    await haul(0, 380);
  }

  s.look({ face: 'phew', pose: 'hover' });
  if (!quick) s.emote('open');
  await s.wait(quick ? 300 : 900);
};

const rebuild = async (s: Stage, scene: Scene, quick: boolean) => {
  await buildIcons(s, quick);
  await raiseTaskbar(s, scene, quick);
  await installStart(s, scene, quick);
  await buildClock(s, scene, quick);
  await shooBlue(s, scene, quick);
  await openProgram(s, scene, quick);
};

/**
 * After the program went in the bin: the robot cannot believe it, looks for what
 * used to be there, complains, and then puts the whole desktop back by hand.
 */
export const wreckShow = async (s: Stage) => {
  const scene = measure(s);
  const { w, h, centre, talkAt } = scene;

  await s.wait(1400);
  s.appear({ x: centre, y: -ROBOT.h - 20 }, { face: 'wow' });
  await s.fly(talkAt, 900);
  await s.wait(700);
  s.look({ face: 'aghast' });
  s.emote('no', 900);
  await s.wait(700);
  await s.say('disbelief', 2800);

  // Everywhere something used to be, a look to either side.
  const lookFor = async (at: Point, said: EmoteKey) => {
    s.look({ face: 'curious' });
    await s.fly(at, 650);
    s.look({ gaze: -1 });
    await s.wait(300);
    s.look({ gaze: 1 });
    await s.wait(300);
    s.look({ gaze: 0, face: 'worried' });
    s.emote(said, 1200);
    await s.wait(750);
  };
  await lookFor({ x: 34, y: 70 }, 'noIcons');
  await lookFor({ x: centre - Math.min(160, w * 0.2), y: h - 110 }, 'noBar');
  await lookFor({ x: w - 110, y: h - 110 }, 'noClock');

  await s.fly(talkAt, 850);
  await s.say('gone', 2400);
  s.look({ face: 'angry' });
  await s.say('who', 2900);
  s.look({ face: 'stern' });
  await s.say('fine', 2400);

  await rebuild(s, scene, false);

  s.look({ face: 'happy' });
  await s.fly(talkAt, 700);
  await s.say('done', 3000);
  await s.fly({ x: w + 40, y: talkAt.y - 20 }, 800);
};

/** The same complaint for whoever asked for less movement: no flying, and everything back at once. */
export const wreckCalmly = async (s: Stage) => {
  const { talkAt } = measure(s);

  await s.wait(1400);
  s.appear(talkAt, { face: 'aghast', pose: 'stand' });
  await s.say('disbelief', 2800);
  s.look({ face: 'angry' });
  await s.say('who', 2900);
  s.mend();
  s.look({ face: 'stern' });
  await s.say('done', 3000);
};

/** When the page has just opened: the same building, in good spirits and without the mishaps. */
export const setupShow = async (s: Stage) => {
  const scene = measure(s);
  const { w, centre, talkAt } = scene;

  await s.wait(400);
  s.appear({ x: centre, y: -ROBOT.h - 20 }, { face: 'happy' });
  await s.fly(talkAt, 700);
  // Nothing to either side: it has the whole place to make.
  s.look({ face: 'curious', gaze: -1 });
  await s.wait(230);
  s.look({ gaze: 1 });
  await s.wait(230);
  s.look({ gaze: 0, face: 'happy', pose: 'wave' });
  await s.say('hello', 1400);

  await rebuild(s, scene, true);

  s.look({ face: 'happy' });
  await s.fly(talkAt, 500, { then: 'wave' });
  s.emote('ready', 1200);
  await s.wait(650);
  await s.fly({ x: w + 40, y: talkAt.y - 20 }, 600);
};
