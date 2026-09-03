import { describe, it, expect } from 'vitest';
import { buildTourFrames, TOUR_STEP_IDS, TOUR_TAB, type TourStepId } from './tourScript';
import { pt } from '../i18n/pt';
import { en } from '../i18n/en';

const script = (cards: Partial<Record<TourStepId, string[]>>) =>
  Object.fromEntries(
    TOUR_STEP_IDS.map((id) => [id, cards[id] ?? ['x']])
  ) as Record<TourStepId, string[]>;

describe('buildTourFrames', () => {
  it('should flatten every card of every step into one walk', () => {
    const frames = buildTourFrames(script({ welcome: ['a', 'b'], search: ['c'] }));

    expect(frames).toHaveLength(TOUR_STEP_IDS.length + 1);
    expect(frames.slice(0, 3).map((frame) => frame.text)).toEqual(['a', 'b', 'c']);
  });

  it('should keep both cards of a step on that step number', () => {
    const frames = buildTourFrames(script({ welcome: ['a', 'b'] }));

    expect(frames[0].step).toBe(1);
    expect(frames[1].step).toBe(1);
    expect(frames[2].step).toBe(2);
  });

  it('should carry the tab each step belongs to', () => {
    const frames = buildTourFrames(script({}));

    frames.forEach((frame) => expect(frame.tab).toBe(TOUR_TAB[frame.id]));
  });

  it('should never send the tutorial to the admin screen', () => {
    expect(Object.values(TOUR_TAB)).not.toContain('admin');
  });
});

describe('the shipped script', () => {
  it.each([
    ['pt', pt],
    ['en', en],
  ])('should have cards for every step in %s', (_language, dictionary) => {
    TOUR_STEP_IDS.forEach((id) => {
      expect(dictionary.tour.script[id].length).toBeGreaterThan(0);
    });
  });

  it('should walk the same number of frames in both languages', () => {
    expect(buildTourFrames(pt.tour.script)).toHaveLength(buildTourFrames(en.tour.script).length);
  });
});
