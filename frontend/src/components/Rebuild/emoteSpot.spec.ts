import { describe, it, expect } from 'vitest';
import { emoteSpot } from './emoteSpot';

const DESKTOP = 1100;
const PHONE = 390;
const SMALL_PHONE = 320;
const SCREENS = [SMALL_PHONE, 360, PHONE, 430, 600, 768, 1366];
const ROBOT_W = 46;
// As the styles draw them: the longest thing it mutters, on two lines, and the skip button.
const LONGEST = { w: 190, h: 44 };
const skipButton = (screen: number) => ({ left: screen - 86, right: screen - 10, top: 10, bottom: 34 });

/** The most room what it mutters can take up at that spot. */
const boxAt = (x: number, y: number, screen: number) => {
  const { low, side, room, drop } = emoteSpot(x, y, screen);
  const width = Math.min(room, LONGEST.w);
  const top = low ? y + drop : y + 3 - LONGEST.h;
  const edge = side === 'right' ? x + (low ? 48 : 38) : x + (low ? -2 : 8) - width;
  return { left: edge, right: edge + width, top, bottom: top + LONGEST.h };
};

describe('where what the robot mutters goes', () => {
  it('should be over its head and to its right when there is room for that', () => {
    expect(emoteSpot(500, 300, DESKTOP)).toEqual({ low: false, side: 'right', room: 556, drop: 0 });
  });

  it('should change sides by the right edge of the screen', () => {
    expect(emoteSpot(1015, 620, DESKTOP)).toMatchObject({ low: false, side: 'left' });
  });

  it('should come down beside its head at the top of the screen, where over it is off the screen', () => {
    // Where it stands to build the bin, the first icon.
    expect(emoteSpot(66, 2, DESKTOP)).toMatchObject({ low: true, side: 'right', drop: 4 });
    expect(emoteSpot(66, 48, DESKTOP)).toMatchObject({ low: false });
  });

  it('should go under the line of the skip button on a phone, where the icons run along the top towards it', () => {
    // By the third icon of the row.
    expect(emoteSpot(200, 2, PHONE)).toEqual({ low: true, side: 'right', room: 136, drop: 36 });
    expect(emoteSpot(60, 2, PHONE)).toMatchObject({ side: 'right', drop: 36 });
  });

  it('should go over to the left of the icon it is working on only when the right has next to nothing', () => {
    expect(emoteSpot(200, 2, SMALL_PHONE)).toMatchObject({ low: true, side: 'left', room: 192 });
  });

  it('should keep to the left of its head where the right would take it into the skip button', () => {
    // Where it speaks from, top centre of a phone.
    expect(emoteSpot(172, 59, PHONE)).toMatchObject({ low: false, side: 'left' });
    expect(emoteSpot(172, 300, PHONE)).toMatchObject({ low: false, side: 'right' });
  });

  it('should always have room for a few words, wherever it is on any screen', () => {
    const cramped: string[] = [];
    for (const screen of SCREENS) {
      for (const y of [2, 33, 34, 47, 48, 78, 79, 300]) {
        for (let x = 0; x <= screen - ROBOT_W; x += 1) {
          if (emoteSpot(x, y, screen).room < 96) cramped.push(`${screen}: ${x},${y}`);
        }
      }
    }

    expect(cramped).toEqual([]);
  });

  it('should never leave the screen nor run into the skip button', () => {
    const astray: string[] = [];
    for (const screen of SCREENS) {
      const button = skipButton(screen);
      for (let y = 2; y <= 120; y += 1) {
        // Further right than this the robot is itself under the button.
        for (let x = 0; x <= button.left - ROBOT_W; x += 1) {
          const box = boxAt(x, y, screen);
          const onScreen = box.left >= 0 && box.right <= screen && box.top >= 0;
          const offButton =
            box.right <= button.left || box.left >= button.right || box.top >= button.bottom || box.bottom <= button.top;
          if (!onScreen || !offButton) astray.push(`${screen}: ${x},${y}`);
        }
      }
    }

    expect(astray).toEqual([]);
  });
});
