import { describe, it, expect, afterEach } from 'vitest';
import { demoSearch, isDemoActive, setDemoActive, subscribeToDemo } from './demoMode';
import { DEMO_SEARCH_RESULTS } from '../constants/demoVideo';

const ids = (results: { id: string }[]) => results.map((row) => row.id);

// demo-1 matches both ways, demo-2 by meaning only, demo-3 by words only.
const [BOTH, MEANING, WORDS] = DEMO_SEARCH_RESULTS;

afterEach(() => setDemoActive(false));

describe('the demo flag', () => {
  it('should be off until something turns it on', () => {
    expect(isDemoActive()).toBe(false);
  });

  it('should tell subscribers when it changes, and stop after unsubscribing', () => {
    const seen: boolean[] = [];
    const unsubscribe = subscribeToDemo((value) => seen.push(value));

    setDemoActive(true);
    setDemoActive(false);
    unsubscribe();
    setDemoActive(true);

    expect(seen).toEqual([true, false]);
  });
});

describe('demoSearch', () => {
  it('should return every example at the default threshold', async () => {
    const results = await demoSearch({ query: 'gato', threshold: 0.6 });

    expect(ids(results)).toEqual([BOTH.id, MEANING.id, WORDS.id]);
  });

  it('should drop the loose meaning match when precision is raised', async () => {
    const results = await demoSearch({ query: 'gato', threshold: 0.7 });

    expect(ids(results)).toEqual([BOTH.id, WORDS.id]);
  });

  it('should keep every word match at an impossible threshold, as the real search does', async () => {
    const results = await demoSearch({ query: 'gato', threshold: 0.99 });

    expect(ids(results)).toEqual([BOTH.id, WORDS.id]);
    expect(ids(results)).not.toContain(MEANING.id);
  });

  it('should ignore the threshold entirely in text mode', async () => {
    const results = await demoSearch({ query: 'gato', threshold: 0.99, mode: 'text' });

    expect(ids(results)).toEqual([BOTH.id, WORDS.id]);
  });

  it('should drop word only matches in semantic mode', async () => {
    const results = await demoSearch({ query: 'gato', threshold: 0.6, mode: 'semantic' });

    expect(ids(results)).toEqual([BOTH.id, MEANING.id]);
  });
});
