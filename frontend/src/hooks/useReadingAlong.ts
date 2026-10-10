import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dictionary } from '../i18n/en';
import type { Reaction } from '../components/Assistant/pilot';
import type { Face } from '../components/Assistant/trips';
import type { Variety } from '../components/Assistant/variety';

type Says = Dictionary['robot']['says'];
type Quirk = keyof Says['quirks'];
type Hint = keyof Says['hints'];
type Verdict = keyof Says['title'];

interface Options {
  react: (reaction: Reaction) => void;
  vary: Variety;
  /** Its lines, in whatever language is on when it speaks. */
  says: () => Says;
}

/** What the search will make of the text, as far as its advice goes. */
export interface SearchContext {
  /** True when quotes mean an exact phrase in the mode that is on. */
  operators: boolean;
  /** True when there is a broader precision left to try. */
  canWiden: boolean;
}

// Reading over a shoulder is a bad habit it only gives in to now and then.
const CHANCE = 0.35;
const REST = 20000;
const BURST_GAP = 2500;
const PAUSE = 1300;
const CAUGHT_AFTER = 1600;
const CAUGHT_AFTER_ADVICE = 2500;
const LEAVES_AFTER = 1700;
const LONE_CHANCE = 0.6;
const LONG_SEARCH = 45;

const REVIEW_AFTER = 1400;
const FLIGHT_TO_TITLE = 1300;
const WORD_EVERY = 480;
const WORDS_READ = 4;
const TITLE_MIN_WORDS = 5;
const TITLE_LONG_WORDS = 14;
const VERDICT_FOR = 3000;

const QUIRK_FACES: Record<Quirk, Face> = {
  cleared: 'curious',
  shouting: 'wow',
  stuck: 'curious',
  long: 'wow',
};
const VERDICT_FACES: Record<Verdict, Face> = { good: 'happy', short: 'curious', long: 'wow' };

/** The word being typed, or the one just finished, short enough to say back. */
export const lastWord = (text: string) =>
  (text.trim().split(/\s+/).pop() ?? '')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    .slice(0, 18);

/** Something odd about the typing itself. Each oddity is remarked on once per search. */
const quirkOf = (before: string, text: string, done: Set<Quirk>): Quirk | null => {
  if (!text.trim()) {
    done.clear();
    return before.trim().length >= 4 ? 'cleared' : null;
  }

  const word = lastWord(text);
  const found: Quirk | null = /(.)\1{4,}$/u.test(text)
    ? 'stuck'
    : word.length >= 4 && word === word.toUpperCase() && word !== word.toLowerCase()
      ? 'shouting'
      : text.length >= LONG_SEARCH
        ? 'long'
        : null;
  if (!found || done.has(found)) return null;
  done.add(found);
  return found;
};

/** A word of advice the text calls for, if any. */
const hintFor = (text: string, { operators, canWiden }: SearchContext): Hint | null => {
  if (/"[^"]+"/.test(text)) return operators ? 'quoted' : 'quotedIgnored';
  return canWiden && text.trim().split(/\s+/).length === 1 ? 'lone' : null;
};

/**
 * The robot's nosiness about what is written on screen. Sometimes it comes over
 * to the search field and reads along, mumbling the word as it grows. At a pause
 * it says the word out loud or offers a word of advice, then remembers its
 * manners, covers its eyes and goes back to its place. A title the AI has just
 * written it reads openly, and says what it thinks of it.
 */
export const useReadingAlong = ({ react, vary, says }: Options) => {
  const [reading, setReading] = useState<'search' | 'title' | null>(null);
  const session = useRef({
    phase: 'idle' as 'idle' | 'reading' | 'busy',
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
    rested: -REST,
    typedAt: 0,
    rolled: false,
    before: '',
    said: '',
    quirks: new Set<Quirk>(),
    hinted: new Set<Hint>(),
  });

  const stop = useCallback(() => {
    clearTimeout(session.current.timer);
    session.current.phase = 'idle';
    setReading(null);
  }, []);

  const caught = useCallback(() => {
    const state = session.current;
    state.phase = 'busy';
    state.rested = Date.now();
    react({
      face: 'shy',
      emote: vary('caught', says().caught),
      move: 'jolt',
      ms: 2400,
      avert: true,
    });
    state.timer = setTimeout(stop, LEAVES_AFTER);
  }, [react, says, stop, vary]);

  /** One more keystroke in the search field. `taken` when a word in it already got a reaction. */
  const typed = useCallback(
    (text: string, taken: boolean, context: SearchContext) => {
      const state = session.current;
      const now = Date.now();
      const before = state.before;
      state.before = text;
      if (now - state.typedAt > BURST_GAP) state.rolled = false;
      state.typedAt = now;

      if (state.phase === 'busy') return;
      clearTimeout(state.timer);

      if (state.phase === 'idle') {
        if (taken) return;

        const quirk = quirkOf(before, text, state.quirks);
        if (quirk) {
          react({ face: QUIRK_FACES[quirk], emote: vary(`quirk.${quirk}`, says().quirks[quirk]) });
          return;
        }

        // One roll per burst of typing, once there is something to read.
        if (state.rolled || lastWord(text).length < 2) return;
        state.rolled = true;
        if (now - state.rested < REST || Math.random() >= CHANCE) return;
        state.phase = 'reading';
        state.said = '';
        state.hinted.clear();
        setReading('search');
      }

      // Wiped under its nose: there is nothing left to pretend it was not reading.
      if (!text.trim()) {
        caught();
        return;
      }

      const word = lastWord(text) || lastWord(before);
      if (!taken) react({ face: 'curious', emote: `${word}...`, ms: 1500 });

      state.timer = setTimeout(() => {
        const hint = hintFor(text, context);
        const advice =
          hint !== null &&
          !state.hinted.has(hint) &&
          (hint !== 'lone' || Math.random() < LONE_CHANCE);
        // The same word, longer than when it last spoke, means it had jumped in too early.
        const grew =
          state.said !== '' && word.length > state.said.length && word.startsWith(state.said);

        if (advice && hint) {
          state.hinted.add(hint);
          react({ face: 'happy', emote: vary(`hint.${hint}`, says().hints[hint])(word), ms: 2300 });
        } else {
          const line = grew ? vary('got', says().got) : vary('echo', says().echo);
          react({ face: 'curious', emote: line(word), ms: 1500 });
        }
        state.said = word;
        state.timer = setTimeout(caught, advice ? CAUGHT_AFTER_ADVICE : CAUGHT_AFTER);
      }, PAUSE);
    },
    [caught, react, says, vary],
  );

  /** Goes over to a title the AI has just written, reads the start of it and gives a verdict. */
  const review = useCallback(
    (title: string) => {
      const state = session.current;
      const words = title.trim().split(/\s+/).filter(Boolean);
      clearTimeout(state.timer);
      if (!words.length) return;
      state.phase = 'busy';

      let read = 0;
      const mumble = () => {
        read += 1;
        if (read <= Math.min(words.length, WORDS_READ)) {
          const sofar = words.slice(0, read).join(' ').slice(0, 30);
          react({ face: 'curious', emote: `${sofar}...`, ms: 900 });
          state.timer = setTimeout(mumble, WORD_EVERY);
          return;
        }

        const verdict: Verdict =
          words.length < TITLE_MIN_WORDS
            ? 'short'
            : words.length > TITLE_LONG_WORDS
              ? 'long'
              : 'good';
        react({
          face: VERDICT_FACES[verdict],
          emote: vary(`title.${verdict}`, says().title[verdict]),
          move: verdict === 'good' ? 'nod' : undefined,
          ms: 2800,
        });
        state.timer = setTimeout(stop, VERDICT_FOR);
      };

      state.timer = setTimeout(() => {
        setReading('title');
        state.timer = setTimeout(mumble, FLIGHT_TO_TITLE);
      }, REVIEW_AFTER);
    },
    [react, says, stop, vary],
  );

  useEffect(() => {
    const state = session.current;
    return () => clearTimeout(state.timer);
  }, []);

  return { reading, typed, review, stop };
};
