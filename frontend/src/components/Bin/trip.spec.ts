import { describe, it, expect } from 'vitest';
import { en } from '../../i18n/en';
import { pt } from '../../i18n/pt';
import { comeOut, comeOutCalmly, goIn, goInCalmly, leftAt } from './trip';
import type { Box, Stage } from './stage';

const SCREEN = { w: 1100, h: 700 };
const BIN: Box = { left: 30, top: 12, width: 32, height: 32 };
const ROBOT = { w: 46, h: 53 };
const FROM = { x: 600, y: 300 };
// The mouth of the bin once it has been carried out of its corner.
const RIM = BIN.top + 104 + 9;
// Slower than this and a line is gone before most people are through it.
const MS_A_LETTER = 40;

interface Shown {
  what: string;
  from: number;
  until: number;
}

/** A stage where nothing takes any time, that writes down everything asked of it. */
const record = (screen = SCREEN) => {
  const log: string[] = [];
  const lines: Shown[] = [];
  const at = { x: 0, y: 0 };
  let now = 0;
  const note = (entry: string) => {
    log.push(entry);
  };
  const pass = async (ms: number) => {
    now += ms;
  };
  const stage: Stage = {
    screen: () => screen,
    bin: () => BIN,
    wait: pass,
    appear: (to, look) => {
      Object.assign(at, to);
      note(`appear ${look?.pose ?? ''} ${look?.face ?? ''}`.trim());
    },
    fly: (to, ms, flight) => {
      Object.assign(at, to);
      note(`fly ${Math.round(to.x)},${Math.round(to.y)}`);
      if (flight?.squeeze) note(`squeeze ${flight.squeeze.x}`);
      return pass(ms);
    },
    look: (look) => {
      if (look.face) note(`face ${look.face}`);
      if (look.pose) note(`pose ${look.pose}`);
      if (look.squeeze) note(`squeeze ${look.squeeze.x}`);
    },
    say: (line) => {
      const open = lines[lines.length - 1];
      if (open && open.until < 0) open.until = now;
      if (!line) {
        note('hush');
        return;
      }
      const what = line.on === 'going' ? `${line.mood} ${line.turn}` : `${line.outcome} ${line.turn}`;
      note(`say ${what}`);
      lines.push({ what, from: now, until: -1 });
    },
    emote: (emote) => note(`emote ${emote}`),
    carry: (by, ms) => {
      note(by ? `carry ${by.x},${by.y}` : 'carry home');
      return pass(ms);
    },
    rattle: (how) => note(`rattle ${how}`),
    behind: (bin) => note(bin ? 'behind' : 'in front'),
    through: (rim) => note(rim === null ? 'whole' : `through ${rim}`),
    iris: (_, open, ms) => {
      note(open ? 'open' : 'shut');
      return pass(ms);
    },
    release: (zone) => note(`release ${zone}`),
    vanish: () => note('vanish'),
  };
  return { stage, log, lines, at };
};

const only = (log: string[], start: string) => log.filter((entry) => entry.startsWith(start));
const inOrder = (log: string[], milestones: string[]) => {
  let from = 0;
  const reached = milestones.map((entry) => {
    const found = log.indexOf(entry, from);
    from = found + 1;
    return found;
  });
  expect(reached).not.toContain(-1);
};

describe('the robot going into the bin', () => {
  it('should say its piece on the way, with the face that goes with it', async () => {
    const reluctant = record();
    const willing = record();

    await goIn(reluctant.stage, FROM, { mood: 'reluctant', turn: 1 });
    await goIn(willing.stage, FROM, { mood: 'willing', turn: 0 });

    inOrder(reluctant.log, ['appear hover disgust', 'say reluctant 1', 'hush']);
    inOrder(willing.log, ['appear hover brave', 'say willing 0', 'hush']);
  });

  it('should be drawn where it was before it sets off for the bin, so that it is seen to fly there', async () => {
    const { stage, log } = record();
    const { wait } = stage;
    stage.wait = (ms) => {
      log.push('wait');
      return wait(ms);
    };

    await goIn(stage, FROM, { mood: 'willing', turn: 0 });

    const setOff = log.findIndex((entry) => entry.startsWith('fly'));
    expect(log.slice(0, setOff)).toEqual(['appear hover brave', 'say willing 0', 'wait']);
  });

  it('should take the bin out of its corner before anything else, to where there is room over it', async () => {
    const { stage, log, at } = record();

    await goIn(stage, FROM, { mood: 'willing', turn: 0 });

    inOrder(log, ['emote grab', 'carry 64,104', 'behind']);
    // Over the bin where it was put down, with all of the robot on the screen.
    const flights = only(log, 'fly').map((entry) => entry.slice(4).split(',').map(Number));
    expect(flights.every(([, y]) => y >= 2)).toBe(true);
    expect(at.x).toBeCloseTo(BIN.left + 64 + BIN.width / 2 - ROBOT.w / 2, 5);
  });

  it('should not fit the first time, make itself thin, and squeeze smaller still to get in', async () => {
    const { stage, log } = record();

    await goIn(stage, FROM, { mood: 'willing', turn: 0 });

    inOrder(log, [
      'pose fly',
      'face strain',
      'squeeze 1.16',
      'emote stuck',
      'rattle jam',
      'squeeze 1',
      'emote tight',
      'squeeze 0.68',
      'emote again',
      'behind',
      'rattle jam',
      'squeeze 0.5',
      'squeeze 0.3',
      'rattle gulp',
      'emote in',
      'vanish',
      'in front',
      'open',
    ]);
    expect(log[log.length - 1]).toBe('open');
  });

  it('should be seen whole while it tries, and go behind the front of the bin only to go in', async () => {
    const { stage, log, at } = record();
    const tries: { y: number; hidden: boolean }[] = [];
    const { fly, behind } = stage;
    let hidden = false;
    let onItsHead = false;
    stage.behind = (bin) => {
      hidden = bin !== null;
      behind(bin);
    };
    stage.fly = (to, ms, flight) => {
      if (onItsHead) tries.push({ y: to.y, hidden });
      if (flight?.turn === 180) onItsHead = true;
      return fly(to, ms, flight);
    };

    await goIn(stage, FROM, { mood: 'reluctant', turn: 0 });

    const top = BIN.top + 104;
    const rim = top + 9;
    const [landed, backUp, headIn] = tries;
    // The first time it comes down on the mouth of the bin and no further, in front of it.
    expect(landed.hidden).toBe(false);
    expect(landed.y + ROBOT.h - rim).toBeLessThan(8);
    expect(backUp.y + ROBOT.h).toBeLessThan(rim);
    // Then its head goes in, and the rest of it is still there to be seen.
    expect(headIn.hidden).toBe(true);
    expect(headIn.y).toBeGreaterThan(landed.y);
    expect(headIn.y).toBeLessThan(rim - ROBOT.h / 2);
    // In the end all of it is in the middle of the bin, small.
    expect(at.y + ROBOT.h / 2).toBeGreaterThan(rim);
    expect(at.y + ROBOT.h / 2).toBeLessThan(top + BIN.height);
    expect(log.indexOf('squeeze 0.3')).toBeGreaterThan(log.indexOf('behind'));
  });

  it('should keep the bin on the screen where there is little of it', async () => {
    const { stage, log } = record({ w: 130, h: 600 });

    await goIn(stage, { x: 60, y: 300 }, { mood: 'willing', turn: 0 });

    expect(only(log, 'carry')).toEqual(['carry 12,104']);
  });

  it('should only say its piece and be inside, for whoever asked for less motion', async () => {
    const { stage, log } = record();

    await goInCalmly(stage, FROM, { mood: 'reluctant', turn: 2 });

    expect(log).toEqual(['appear hover disgust', 'say reluctant 2', 'hush', 'vanish', 'open']);
  });

  it.each([
    ['English', en],
    ['Portuguese', pt],
  ])('should leave every line in %s on screen long enough to be read', async (_, { bin }) => {
    for (const mood of ['reluctant', 'willing'] as const) {
      for (let turn = 0; turn < bin.going[mood].length; turn += 1) {
        const near = record();
        await goIn(near.stage, { x: 30, y: 40 }, { mood, turn });
        const calm = record();
        await goInCalmly(calm.stage, FROM, { mood, turn });

        const needed = bin.going[mood][turn].length * MS_A_LETTER;
        for (const { lines } of [near, calm]) {
          expect(lines[0].until - lines[0].from).toBeGreaterThanOrEqual(needed);
        }
      }
    }
  });

  it('should have as many ways of going in reluctant as of going in willing', () => {
    for (const { bin } of [en, pt]) {
      expect(bin.going.reluctant).toHaveLength(3);
      expect(bin.going.willing).toHaveLength(3);
    }
  });
});

describe('the robot coming out of the bin', () => {
  it('should shoot out with what it went for, each icon after it, and cheer', async () => {
    const { stage, log } = record();

    await comeOut(stage, { rescued: ['computer', 'tricks'], turn: 1 });

    inOrder(log, [
      `through ${RIM}`,
      'shut',
      'rattle jam',
      'appear fly happy',
      'rattle pop',
      'emote out',
      'whole',
      'release computer',
      'release tricks',
      'pose cheer',
      'say rescued 1',
      'hush',
      'carry home',
      'emote back',
    ]);
  });

  it('should climb out quietly when it leaves without them, and let nothing out', async () => {
    const { stage, log } = record();

    await comeOut(stage, { rescued: [], turn: 0 });

    inOrder(log, [
      `through ${RIM}`,
      'shut',
      'appear peek neutral',
      'whole',
      'face phew',
      'say left 0',
      'hush',
      'carry home',
    ]);
    expect(only(log, 'release')).toEqual([]);
    expect(only(log, 'rattle')).toEqual([]);
    expect(log).not.toContain('emote out');
  });

  it.each([
    ['with what it went for', ['computer'] as const],
    ['empty handed', [] as const],
  ])('should come up through the mouth of the bin at its own size, %s', async (_, rescued) => {
    const { stage, log } = record();
    const heights: { y: number; cut: boolean }[] = [];
    const { appear, fly, through } = stage;
    let cut = false;
    stage.through = (rim) => {
      cut = rim !== null;
      through(rim);
    };
    stage.appear = (to, look) => {
      heights.push({ y: to.y, cut });
      appear(to, look);
    };
    stage.fly = (to, ms, flight) => {
      heights.push({ y: to.y, cut });
      return fly(to, ms, flight);
    };

    await comeOut(stage, { rescued, turn: 0 });

    // It starts all of it under the edge, where none of it is seen, and is only seen whole once all of it is over.
    expect(heights[0]).toEqual({ y: expect.any(Number), cut: true });
    expect(heights[0].y).toBeGreaterThanOrEqual(RIM);
    const out = heights.findIndex(({ cut: hidden }) => !hidden);
    expect(heights[out - 1].y + ROBOT.h).toBeLessThanOrEqual(RIM);
    expect(only(log, 'squeeze')).toEqual([]);
  });

  it('should put the bin where it took it to before the way out opens, and back home at the end', async () => {
    const { stage, log } = record();

    await comeOut(stage, { rescued: ['tricks'], turn: 0 });

    expect(only(log, 'carry')).toEqual(['carry 64,104', 'carry home']);
    expect(log.indexOf('carry 64,104')).toBeLessThan(log.indexOf('shut'));
  });

  it('should end where the robot is taken over from', async () => {
    const moving = record();
    const calm = record();

    await comeOut(moving.stage, { rescued: ['computer'], turn: 0 });
    await comeOutCalmly(calm.stage, { rescued: ['computer'], turn: 0 });

    expect(leftAt(moving.stage, false)).toEqual(moving.at);
    expect(leftAt(calm.stage, true)).toEqual(calm.at);
  });

  it('should have the icons back and say so with no flying about, for whoever asked for less motion', async () => {
    const { stage, log } = record();

    await comeOutCalmly(stage, { rescued: ['computer', 'tricks'], turn: 2 });

    expect(log).toEqual([
      'carry home',
      'shut',
      'appear cheer happy',
      'release computer',
      'release tricks',
      'say rescued 2',
      'hush',
    ]);
  });

  it.each([
    ['English', en],
    ['Portuguese', pt],
  ])('should leave what it says once out in %s on screen long enough to be read', async (_, { bin }) => {
    for (const outcome of ['rescued', 'left'] as const) {
      for (let turn = 0; turn < bin.back[outcome].length; turn += 1) {
        const rescued = outcome === 'rescued' ? (['computer'] as const) : [];
        const moving = record();
        await comeOut(moving.stage, { rescued, turn });
        const calm = record();
        await comeOutCalmly(calm.stage, { rescued, turn });

        const needed = bin.back[outcome][turn].length * MS_A_LETTER;
        for (const { lines } of [moving, calm]) {
          expect(lines[0].until - lines[0].from).toBeGreaterThanOrEqual(needed);
        }
      }
    }
  });
});
