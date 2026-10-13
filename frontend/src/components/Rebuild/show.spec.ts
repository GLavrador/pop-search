import { describe, it, expect } from 'vitest';
import { en } from '../../i18n/en';
import { pt } from '../../i18n/pt';
import { setupShow, wreckCalmly, wreckShow } from './show';
import type { Box, LineKey, Stage } from './stage';

const SCREEN = { w: 1100, h: 700 };
// Slower than this and a line is gone before most people are through it.
const MS_A_LETTER = 40;
const STILL_TO_READ_MS = 900;
const GRID = { cols: 4, rows: 5 };
const BOXES: Record<string, Box> = {
  bin: { left: 8, top: 8, width: 76, height: 58 },
  computer: { left: 8, top: 72, width: 76, height: 70 },
  app: { left: 8, top: 148, width: 76, height: 58 },
  taskbar: { left: 0, top: 670, width: 1100, height: 30 },
  window: { left: 150, top: 20, width: 800, height: 560 },
};

interface Told {
  kind: 'say' | 'emote' | 'fly';
  what: string;
  /** When it began, by a clock that only what is asked of the stage moves. */
  at: number;
  ms: number;
}

/** A stage where nothing takes any time, that writes down everything asked of it. */
const record = () => {
  const log: string[] = [];
  const told: Told[] = [];
  let now = 0;
  const note = (entry: string) => {
    log.push(entry);
  };
  const pass = async (ms: number) => {
    now += ms;
  };
  const stage: Stage = {
    screen: () => SCREEN,
    box: (what) => BOXES[what],
    wait: pass,
    appear: (at) => note(`appear ${Math.round(at.x)},${Math.round(at.y)}`),
    fly: (to, ms) => {
      note(`fly ${Math.round(to.x)},${Math.round(to.y)}`);
      told.push({ kind: 'fly', what: '', at: now, ms });
      return pass(ms);
    },
    look: (look) => {
      if (look.tool !== undefined) note(`tool ${look.tool}`);
      if (look.face) note(`face ${look.face}`);
      if (look.gaze) note(`gaze ${look.gaze}`);
    },
    say: (line, ms) => {
      note(`say ${line}`);
      told.push({ kind: 'say', what: line, at: now, ms });
      return pass(ms);
    },
    emote: (emote, ms = 1500) => {
      note(`emote ${emote}`);
      told.push({ kind: 'emote', what: emote, at: now, ms });
    },
    build: (zone, built) => note(`build ${zone} ${built}`),
    shine: (zone) => note(`shine ${zone}`),
    press: (zone) => note(`press ${zone}`),
    taskbar: (by, ms) => {
      note(`taskbar ${by}`);
      return pass(ms);
    },
    clock: (state) => note(`clock ${state}`),
    tiles: () => GRID,
    shoo: (pieces) => pieces.forEach(({ index }) => note(`shoo ${index}`)),
    start: () => note('start'),
    openWindow: () => note('open'),
    roll: (by, ms) => {
      note(`roll ${by}`);
      return pass(ms);
    },
    mend: () => note('mend'),
  };
  return { stage, log, told };
};

const only = (log: string[], start: string) => log.filter((entry) => entry.startsWith(start));
const inOrder = (log: string[], milestones: string[]) => {
  const reached = milestones.map((entry) => log.indexOf(entry));
  expect(reached).not.toContain(-1);
  expect(reached).toEqual([...reached].sort((a, b) => a - b));
};

describe('rebuilding the desktop after the program went in the bin', () => {
  it('should not believe it, look for what is gone and complain before lifting a finger', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    inOrder(log, [
      'face aghast',
      'say disbelief',
      'emote noIcons',
      'emote noBar',
      'emote noClock',
      'say gone',
      'face angry',
      'say who',
      'say fine',
      'build bin 1',
    ]);
    expect(only(log, 'gaze')).toEqual(Array(3).fill(['gaze -1', 'gaze 1']).flat());
  });

  it('should speak from the top of the screen', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    const spoken = log.indexOf('say disbelief');
    const [, height] = log[log.lastIndexOf('fly 527,49', spoken)].split(',');
    expect(Number(height)).toBeLessThan(SCREEN.h / 4);
  });

  it('should put everything back in the order it is told in', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    inOrder(log, [
      'build bin 5',
      'build computer 5',
      'build app 5',
      'taskbar 0',
      'start',
      'clock on',
      'shoo 0',
      'open',
      'roll 0',
      'say done',
    ]);
  });

  it('should build each icon in steps: outline, three blows of the hammer, then its name', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    expect(only(log, 'build bin')).toEqual([
      'build bin 1',
      'build bin 2',
      'build bin 3',
      'build bin 4',
      'build bin 5',
    ]);
    inOrder(log, ['build bin 1', 'tool hammer', 'build bin 2']);
  });

  it('should give the program more care than the rest: a look from a step back, and a polish', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    inOrder(log.slice(log.indexOf('build app 4')), [
      'build app 4',
      'face curious',
      'tool duster',
      'shine app',
      'emote polish',
      'shine null',
      'build app 5',
    ]);
    expect(only(log, 'shine')).toEqual(['shine app', 'shine null']);
  });

  it('should lose its grip on the taskbar twice before it comes up', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    expect(only(log, 'taskbar')).toEqual([
      'taskbar 0.86',
      'taskbar 0.5',
      'taskbar 0.86',
      'taskbar 0.3',
      'taskbar 0.86',
      'taskbar -0.15',
      'taskbar 0',
    ]);
  });

  it('should build the clock before switching it on', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    expect(only(log, 'clock')).toEqual(['clock frame', 'clock blank', 'clock unset', 'clock on']);
  });

  it('should shoo off every piece of the blue, two rows at a time, one way and then back', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    // Four columns, five rows: rows 0 and 1 left to right, 2 and 3 right to left, 4 alone.
    expect(only(log, 'shoo')).toEqual(
      [0, 4, 1, 5, 2, 6, 3, 7, 11, 15, 10, 14, 9, 13, 8, 12, 16, 17, 18, 19].map(
        (index) => `shoo ${index}`,
      ),
    );
  });

  it('should knock, and then let the window slip back once while rolling it open', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    expect(only(log, 'press')).toHaveLength(8);
    expect(only(log, 'roll')).toEqual([
      'roll 0.94',
      'roll 0.7',
      'roll 0.45',
      'roll 0.62',
      'roll 0.2',
      'roll 0',
    ]);
  });

  it('should never go above the top of the screen once it has come in', async () => {
    const { stage, log } = record();

    await wreckShow(stage);

    const heights = only(log, 'fly').map((entry) => Number(entry.split(',')[1]));
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(0);
  });

  it('should only complain, and mend everything at once, when asked for less movement', async () => {
    const { stage, log } = record();

    await wreckCalmly(stage);

    expect(only(log, 'fly')).toEqual([]);
    inOrder(log, ['say disbelief', 'say who', 'mend', 'say done']);
  });
});

describe('building the desktop as the page opens', () => {
  it('should greet, build everything and leave, with no complaint', async () => {
    const { stage, log } = record();

    await setupShow(stage);

    inOrder(log, [
      'say tidy',
      'build bin 5',
      'build computer 5',
      'build app 5',
      'taskbar 0',
      'start',
      'clock on',
      'shoo 0',
      'open',
      'roll 0',
      'emote ready',
    ]);
    expect(only(log, 'say')).toEqual(['say visit', 'say tidy']);
  });

  it('should be caught unready by the visit, look at the nothing to either side, then make the visitor at home', async () => {
    const { stage, log } = record();

    await setupShow(stage);

    inOrder(log, ['face wow', 'say visit', 'gaze -1', 'gaze 1', 'say tidy', 'build bin 1']);
  });

  it('should leave what it says up for as long as it takes to read, in either language', async () => {
    const { stage, told } = record();

    await setupShow(stage);

    const said = told.filter(({ kind }) => kind === 'say');
    expect(said).toHaveLength(2);
    said.forEach(({ what, ms }) => {
      const line = what as LineKey;
      const letters = Math.max(en.rebuild.says[line].length, pt.rebuild.says[line].length);
      expect(ms / letters).toBeGreaterThanOrEqual(MS_A_LETTER);
    });
  });

  it('should stay where it is until what it mutters has been read', async () => {
    const { stage, told } = record();

    await setupShow(stage);

    const muttered = told.filter(({ kind }) => kind === 'emote');
    expect(muttered.map(({ what }) => what)).toEqual([
      'one',
      'two',
      'polish',
      'three',
      'tricks',
      'start',
      'ready',
    ]);
    muttered.forEach((mutter) => {
      const off = told.slice(told.indexOf(mutter)).find(({ kind }) => kind === 'fly');
      expect((off?.at ?? Infinity) - mutter.at).toBeGreaterThanOrEqual(STILL_TO_READ_MS);
    });
  });

  it('should skip the mishaps: no slipping, no hour nobody set, no knocking', async () => {
    const { stage, log } = record();

    await setupShow(stage);

    expect(only(log, 'taskbar')).toEqual(['taskbar 0.86', 'taskbar -0.15', 'taskbar 0']);
    expect(only(log, 'clock')).toEqual(['clock frame', 'clock blank', 'clock on']);
    expect(only(log, 'press')).toEqual([]);
    expect(only(log, 'roll')).toEqual(['roll 0.94', 'roll 0.5', 'roll 0']);
  });
});
