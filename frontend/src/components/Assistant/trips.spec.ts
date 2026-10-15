import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '../../i18n/en';
import { createVariety } from './variety';
import { planFlight } from './flight';
import { TRIPS, bounces, createRotation, pauseBetween, type Leg, type Scene } from './trips';

const ICONS = [
  ['bin', 'Recycle Bin'],
  ['computer', 'My Computer'],
  ['app', 'Pop Search'],
  ['tricks', 'Tricks'],
] as const;

const box = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height, right: left + width, bottom: top + height }) as DOMRect;

/** The desktop as the trips find it: one column of icons, with those in the bin left as empty places. */
const desktop = (trashed: string[] = []) => {
  document.body.innerHTML = '';
  ICONS.forEach(([zone, name], index) => {
    const icon = document.createElement('button');
    icon.dataset.slot = zone;
    if (trashed.includes(zone)) {
      icon.setAttribute('data-trashed', '');
    } else {
      icon.dataset.robot = 'icon';
      icon.dataset.robotZone = zone;
    }
    icon.innerHTML = `<span></span><span>${name}</span>`;
    vi.spyOn(icon, 'getBoundingClientRect').mockReturnValue(box(8, 8 + index * 66, 76, 58));
    document.body.append(icon);
  });
};

const landmarkAt = (name: string, at: DOMRect) => {
  const node = document.createElement('div');
  node.dataset.robot = name;
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue(at);
  document.body.append(node);
  return node;
};
const windowOver = (frame: DOMRect) => landmarkAt('window', frame);

/** Everything a trip may go to: the window, and the taskbar with its buttons and clock. */
const screenful = () => {
  desktop();
  windowOver(box(150, 100, 700, 500));
  landmarkAt('taskbar', box(0, 738, 1024, 30));
  landmarkAt('start', box(2, 740, 60, 26));
  landmarkAt('task', box(70, 740, 160, 26)).setAttribute('aria-pressed', 'true');
  landmarkAt('clock', box(950, 740, 70, 26)).textContent = '11:15';
};

const scene = (over: Partial<Scene> = {}): Scene => ({
  size: { w: 46, h: 53 },
  position: () => ({ x: 600, y: 300 }),
  onScreen: (at) => at,
  emotes: () => en.guide.emotes,
  after: () => {},
  move: () => {},
  say: () => {},
  prank: () => {},
  idleFor: () => 0,
  vary: createVariety(() => 0),
  ...over,
});

const said = (legs: Leg[]) => legs.map((leg) => leg.emote?.() ?? null);

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('counting the icons', () => {
  it('should count every icon there is and be at ease when none is missing', () => {
    desktop();

    const legs = TRIPS.count.plan(scene());

    expect(said(legs)).toEqual(['one...', 'two...', 'three...', 'four...', expect.any(String)]);
    expect(en.guide.emotes.allThere).toContain(said(legs)[4]);
    expect(legs[4].face).toBe('happy');
  });

  it('should find the empty place of an icon in the bin, say so, and say it will fetch it later', () => {
    desktop(['computer']);

    const legs = TRIPS.count.plan(scene());

    const lines = said(legs);
    expect(lines[0]).toBe('one...');
    expect(lines[1]).toContain('My Computer');
    expect(legs[1].face).toBe('wow');
    expect(en.guide.emotes.later).toContain(lines[2]);
    expect(lines.slice(3)).toEqual(['two...', 'three...']);
    // Nothing more once it has counted: no "all present" with one gone.
    expect(lines.some((line) => en.guide.emotes.allThere.includes(line ?? ''))).toBe(false);
  });

  it('should leave out the icons under the window, which it cannot get at', () => {
    desktop();
    windowOver(box(0, 140, 900, 600));

    const legs = TRIPS.count.plan(scene());

    expect(said(legs).slice(0, 2)).toEqual(['one...', 'two...']);
    expect(legs).toHaveLength(3);
  });
});

describe('the robot on its own portrait', () => {
  it('should say that is it, then hold the very pose of the icon', () => {
    desktop();

    const legs = TRIPS.itsMe.plan(scene());

    expect(said(legs)[0]).toBe('that is me!');
    expect(legs[1]).toMatchObject({ pose: 'statue', face: 'neutral', gaze: { x: 0, y: 0 } });
  });

  it('should not do it with the Tricks icon in the bin', () => {
    desktop(['tricks']);

    expect(TRIPS.itsMe.plan(scene())).toEqual([]);
  });
});

describe('hide and seek behind the window', () => {
  it('should stay behind the window, with only its eyes over the top now and then, until it comes out', () => {
    desktop();
    windowOver(box(150, 100, 700, 500));

    const legs = TRIPS.hide.plan(scene());

    const hidden = legs.slice(0, -1);
    expect(hidden.length).toBeGreaterThan(4);
    hidden.forEach((leg) => expect(leg).toMatchObject({ layer: 'behind', seeking: true }));
    const peeks = hidden.filter((leg) => leg.pose === 'peek');
    expect(peeks.length).toBeGreaterThan(1);
    peeks.forEach((leg) => expect(leg.where()?.at.y).toBe(100 - 25));
    const out = legs[legs.length - 1];
    expect(out.layer).toBeUndefined();
    expect(out.where()?.at.y).toBeLessThan(100 - 25);
  });

  it('should not play with no window to hide behind, or no room over it', () => {
    desktop();
    expect(TRIPS.hide.plan(scene())).toEqual([]);

    windowOver(box(14, 14, 900, 700));
    expect(TRIPS.hide.plan(scene())).toEqual([]);
  });
});

describe('the screen saver', () => {
  it('should come on whenever its turn comes, and keep bouncing for about fifteen seconds', () => {
    desktop();

    const legs = TRIPS.saver.plan(scene());

    let from = { x: 600, y: 300 };
    const lasts = legs.reduce((sum, leg) => {
      const to = (leg.where() as { at: { x: number; y: number } }).at;
      const flight = planFlight(from, to, 0, 0).duration;
      from = to;
      return sum + flight + leg.hold;
    }, 0);
    expect(lasts).toBeGreaterThanOrEqual(15000);
    expect(lasts).toBeLessThan(17000);
  });

  it('should take a new colour at each bounce and give way at the first sign of the user', () => {
    desktop();

    const legs = TRIPS.saver.plan(scene());

    legs.slice(1).forEach((leg, index) => expect(leg.tint).not.toBe(legs[index].tint));
    legs.forEach((leg) => expect(leg.skittish).toBe(true));
  });

  it('should bounce from wall to wall without ever leaving the room', () => {
    const room = { left: 0, top: 0, right: 800, bottom: 500 };

    const hits = bounces({ x: 100, y: 100 }, room, { x: 1, y: 0.7 }, 6);

    expect(hits).toHaveLength(6);
    hits.forEach(({ x, y }) => {
      expect(x).toBeGreaterThanOrEqual(-0.001);
      expect(x).toBeLessThanOrEqual(800.001);
      expect(y).toBeGreaterThanOrEqual(-0.001);
      expect(y).toBeLessThanOrEqual(500.001);
      const onWall = [x, 800 - x, y, 500 - y].some((gap) => Math.abs(gap) < 0.001);
      expect(onWall).toBe(true);
    });
  });
});

describe('knocking on the glass', () => {
  it('should give way at the first sign of the user, close as it is', () => {
    desktop();

    const legs = TRIPS.glass.plan(scene());

    expect(legs.some((leg) => leg.pose === 'knock')).toBe(true);
    legs.forEach((leg) => expect(leg.skittish).toBe(true));
  });
});

describe('picking what to do next', () => {
  const idle = () => scene({ idleFor: () => 60000 });

  it('should do every trip there is room for once before any of them comes round again', () => {
    screenful();
    const possible = Object.keys(TRIPS).filter((name) => TRIPS[name].plan(idle()).length > 0);
    const next = createRotation();

    const done = possible.map(() => next(idle())?.name);

    expect(possible.length).toBeGreaterThan(15);
    expect(new Set(done)).toEqual(new Set(possible));
  });

  it('should never do the same thing twice running, round after round', () => {
    screenful();
    const next = createRotation();

    const done = Array.from({ length: 100 }, () => next(idle())?.name);

    done.slice(1).forEach((name, index) => expect(name).not.toBe(done[index]));
  });

  it('should keep the turn of a trip that cannot be made yet, and make it once it can', () => {
    screenful();
    const next = createRotation(() => 0);
    const busy = scene({ idleFor: () => 0 });

    const before = Array.from({ length: 6 }, () => next(busy)?.name);
    const later = Array.from({ length: 30 }, () => next(idle())?.name);

    expect(before).not.toContain('stomp');
    expect(later).toContain('stomp');
  });
});

describe('the pause between trips', () => {
  it('should be 15, 10, 20 or 13 seconds, by weights of 50, 20, 10 and 30', () => {
    const rolls = Array.from({ length: 1100 }, (_, index) => pauseBetween((index + 0.5) / 1100));

    const count = (ms: number) => rolls.filter((pause) => pause === ms).length;
    expect([count(15000), count(10000), count(20000), count(13000)]).toEqual([500, 200, 100, 300]);
  });
});
