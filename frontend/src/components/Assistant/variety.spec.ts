import { describe, it, expect } from 'vitest';
import { createVariety } from './variety';

const LINES = ['one', 'two', 'three'];

describe('varying what is said', () => {
  it('should never say the same thing twice in a row', () => {
    const vary = createVariety();
    let before = vary('greeting', LINES);

    for (let i = 0; i < 200; i += 1) {
      const now = vary('greeting', LINES);
      expect(now).not.toBe(before);
      before = now;
    }
  });

  it('should go through the whole list before repeating any of it', () => {
    const vary = createVariety();

    for (let round = 0; round < 20; round += 1) {
      const said = new Set(LINES.map(() => vary('greeting', LINES)));
      expect(said.size).toBe(LINES.length);
    }
  });

  it('should keep each subject on its own turn', () => {
    const vary = createVariety(() => 0);

    const first = vary('greeting', LINES);
    vary('farewell', LINES);

    expect(vary('greeting', LINES)).not.toBe(first);
  });

  it('should just repeat when there is only one thing to say', () => {
    const vary = createVariety();

    expect(vary('only', ['same'])).toBe('same');
    expect(vary('only', ['same'])).toBe('same');
  });
});
