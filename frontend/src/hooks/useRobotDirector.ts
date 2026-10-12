import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { en, type Dictionary } from '../i18n/en';
import { useI18n } from '../i18n/languageContext';
import {
  findHelp,
  type HelpKey,
  type PressKey,
  type RobotEvent,
  type RobotVoice,
  type TypedWord,
} from '../context/robotContext';
import type { Cue, Mission, Reaction, Target, Zone } from '../components/Assistant/pilot';
import type { Face } from '../components/Assistant/trips';
import { createVariety } from '../components/Assistant/variety';
import type { RobotHandle } from '../components/Assistant/RobotPilot';
import type { Aim } from '../components/Demo/spotlight';
import type { Tab } from '../constants/tabs';
import type { AnalysisStep } from '../constants/analysis';
import { findSearchMode } from '../constants/searchModes';
import { PRECISION_PRESETS } from '../constants/searchPresets';
import { useReadingAlong } from './useReadingAlong';

export interface LineCopy {
  text: ReactNode;
  title?: string;
  /** Label of the one thing the balloon offers to do. */
  action?: string;
}

/** One thing the robot says: where it stands to say it, and how long it stays said. */
export interface Line {
  id: number;
  /** Who started it: the user asking, something the user did, or the robot itself. */
  rank: 'ask' | 'react' | 'tip';
  /** Read at render time, so it follows a change of language. */
  copy: (t: Dictionary) => LineCopy;
  /** What the balloon's button does, when its copy offers one. */
  run?: () => void;
  cue: Cue;
  target: Target;
  aim?: Aim;
  /** Lets whatever it was about take it back: a new search drops the last one's advice. */
  topic?: 'search' | 'analysis' | 'server';
  /** Gone after this long on its own; null stays until dismissed. */
  ttl: number | null;
}

/** Where the robot should be and how, without the parts that never change. */
export type Brief = Pick<Mission, 'utterance' | 'cue' | 'target' | 'aim' | 'roam' | 'speech'>;

interface DirectorOptions {
  /** True while the guide has the robot: it then keeps quiet about everything else. */
  guiding: boolean;
}

const RANK = { tip: 0, react: 1, ask: 2 };
const LINE_SPEECH = 2200;
const WAIT_BETWEEN_LINES = 18000;
const REVISIT_CHATTER = 0.4;
const SAME_PRESS_GAP = 1500;

// Most buttons get a smile. These few get a different look.
const PRESS_FACES: Partial<Record<PressKey, Face>> = {
  advancedOpen: 'curious',
  modeSemantic: 'curious',
  stricter: 'curious',
  authSubmit: 'curious',
  reviewCancel: 'neutral',
  editCancel: 'neutral',
  removeAsk: 'worried',
  back: 'neutral',
};

const mark = (zone: Zone) => () =>
  document.querySelector<HTMLElement>(`[data-robot-zone="${zone}"]`);
// The bin and the top of the window it handles with its body alone; these get a balloon.
const DROPS = {
  computer: mark('computer'),
  app: mark('app'),
  clock: mark('clock'),
  start: mark('start'),
  close: mark('close'),
};
const BESIDE_ICON: Aim = { from: 'right' };

// Matched against what was typed with the accents taken off, so "robô" is "robo".
const TYPED_WORDS: Record<TypedWord, RegExp> = {
  cat: /\b(gat[oa]s?|gatinh[oa]s?|cats?|kittens?)\b/,
  robot: /\b(robos?|robots?|bip)\b/,
  dog: /\b(cachorr[oa]s?|doguinhos?|dogs?|pupp(y|ies))\b/,
  bin: /\b(lixo|lixeira|trash|rubbish)\b/,
  home: /\bpop ?search\b/,
};
const TYPED_LOOKS: Record<TypedWord, Reaction> = {
  cat: { face: 'wow', move: 'jolt' },
  robot: { face: 'happy', move: 'hop' },
  dog: { face: 'happy', move: 'nod' },
  bin: { face: 'worried', move: 'shake' },
  home: { face: 'happy', move: 'nod' },
};

const plain = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
// Under the panel, so the balloon lands on the desktop and not on what the user needs next.
const FROM_UNDER: Aim = { from: 'below', free: true };
// The bar, not the list of steps above it: that is the thing to sit on.
const PROGRESS = () =>
  findHelp('ingest.progress')?.querySelector<HTMLElement>('[role="progressbar"]') ?? null;
const ERROR_BOX = () => findHelp('ingest.error');
const EMPTY_BOX = () => findHelp('search.empty');
const SEARCH_FIELD = () => findHelp('search.query')?.querySelector<HTMLElement>('input') ?? null;
const TITLE_FIELD = () => findHelp('review.general')?.querySelector<HTMLElement>('input') ?? null;
const BROADEST = Math.min(...PRECISION_PRESETS.map((preset) => preset.threshold));

const AT_REST: Brief = { utterance: 'rest', cue: 'rest', target: null, aim: null, roam: 'calm' };
const WATCHING: Brief = {
  utterance: 'watch',
  cue: 'watch',
  target: PROGRESS,
  aim: null,
  roam: 'never',
};

// Perched on a field, reading what is in it.
const READING: Record<'search' | 'title', Brief> = {
  search: { utterance: 'read', cue: 'watch', target: SEARCH_FIELD, aim: null, roam: 'never' },
  title: { utterance: 'read-title', cue: 'watch', target: TITLE_FIELD, aim: null, roam: 'never' },
};

const isHelpKey = (key: string | undefined): key is HelpKey =>
  key !== undefined && key in en.robot.help;

export const useRobotDirector = ({ guiding }: DirectorOptions) => {
  const { t } = useI18n();
  const [line, setLine] = useState<Line | null>(null);
  const [helping, setHelping] = useState(false);
  const [watching, setWatching] = useState(false);
  const lastId = useRef(0);
  const handle = useRef<RobotHandle>(null);
  const spoken = useRef<Line | null>(null);
  const visited = useRef(new Set<Tab>());
  const pressed = useRef<{ what: PressKey | null; at: number }>({ what: null, at: 0 });
  const noticed = useRef(new Set<TypedWord>());
  const vary = useMemo(() => createVariety(), []);
  const toldStep = useRef<AnalysisStep | null>(null);
  const live = useRef({ guiding, t });

  useEffect(() => {
    live.current = { guiding, t };
  });

  const put = useCallback((next: Line | null) => {
    spoken.current = next;
    setLine(next);
  }, []);

  /** Never over something of a higher rank: a tip does not talk over an answer. */
  const say = useCallback(
    (next: Omit<Line, 'id'>) => {
      const current = spoken.current;
      if (current && RANK[current.rank] > RANK[next.rank]) return;
      lastId.current += 1;
      put({ ...next, id: lastId.current });
    },
    [put],
  );

  const dismiss = useCallback(() => put(null), [put]);

  const hush = useCallback(
    (topic: Line['topic']) => {
      if (spoken.current?.topic === topic) put(null);
    },
    [put],
  );

  /** A word on the spot. While a balloon is up it keeps to the face and the move. */
  const react = useCallback((reaction: Reaction) => {
    handle.current?.react(spoken.current ? { ...reaction, emote: undefined } : reaction);
  }, []);

  const lines = useCallback(() => live.current.t.robot.says, []);
  const reader = useReadingAlong({ react, vary, says: lines });
  const { typed, review, stop: stopReading } = reader;

  const explain = useCallback(
    (key: HelpKey, node: HTMLElement) => {
      // Asked about itself it stays put: it cannot go and stand next to itself.
      const target = key === 'robot' ? null : node;
      say({ rank: 'ask', copy: (t) => t.robot.help[key], cue: 'teach', target, ttl: null });
    },
    [say],
  );

  /** Let go over something it has an opinion about. The bin and the roof need no words. */
  const dropped = useCallback(
    (zone: Zone | null) => {
      if (!zone || zone === 'bin' || zone === 'roof' || zone === 'task') return;

      const turn = vary(`drop.${zone}`, [0, 1, 2]);
      const time = DROPS.clock()?.textContent?.trim() ?? '';
      const onIcon = zone === 'computer' || zone === 'app';
      say({
        rank: 'react',
        copy: ({ robot }) => ({
          text:
            zone === 'clock'
              ? robot.drop.clock[turn % robot.drop.clock.length](time)
              : robot.drop[zone][turn % robot.drop[zone].length],
        }),
        cue: zone === 'app' ? 'cheer' : 'teach',
        target: DROPS[zone],
        aim: onIcon ? BESIDE_ICON : undefined,
        ttl: 6500,
      });

      // On the Start button it does what it always does there: jumps on it, to no avail.
      if (zone === 'start') {
        [900, 1500].forEach((ms) => setTimeout(() => handle.current?.react({ move: 'hop' }), ms));
      }
    },
    [say, vary],
  );

  // Each step of an analysis gets a word, once, in one of its wordings.
  const sayStep = useCallback(
    (step: AnalysisStep) => {
      if (toldStep.current === step) return;
      toldStep.current = step;

      const turn = vary(`step.${step}`, [0, 1, 2]);
      say({
        rank: 'react',
        topic: 'analysis',
        copy: ({ robot }) => ({ text: robot.lines.steps[step][turn % robot.lines.steps[step].length] }),
        cue: 'watch',
        target: PROGRESS,
        ttl: 7000,
      });
    },
    [say, vary],
  );

  const notify = useCallback(
    (event: RobotEvent) => {
      if (live.current.guiding) return;
      const { says } = live.current.t.robot;

      switch (event.kind) {
        case 'tab': {
          const firstVisit = !visited.current.has(event.tab);
          visited.current.add(event.tab);
          put(null);
          stopReading();
          if (firstVisit || Math.random() < REVISIT_CHATTER) {
            react({ face: 'happy', emote: vary(`tab.${event.tab}`, says.tabs[event.tab]) });
          }
          break;
        }
        case 'pressed': {
          // A slider reports every notch it passes: one remark covers the whole drag.
          const now = Date.now();
          const again = pressed.current.what === event.what;
          if (again && now - pressed.current.at < SAME_PRESS_GAP) break;
          pressed.current = { what: event.what, at: now };
          if (event.what === 'reviewCancel') stopReading();
          react({
            face: PRESS_FACES[event.what] ?? 'happy',
            emote: vary(`press.${event.what}`, says.press[event.what]),
          });
          break;
        }
        case 'typing': {
          const text = plain(event.text);
          const words = Object.keys(TYPED_WORDS) as TypedWord[];
          const fresh = words.find((word) => TYPED_WORDS[word].test(text) && !noticed.current.has(word));
          noticed.current = new Set(words.filter((word) => TYPED_WORDS[word].test(text)));
          if (fresh) react({ ...TYPED_LOOKS[fresh], emote: vary(`typed.${fresh}`, says.typed[fresh]) });
          const searching = findSearchMode(event.mode);
          typed(event.text, fresh !== undefined, {
            operators: searching.supportsOperators,
            canWiden: searching.usesThreshold && event.threshold > BROADEST,
          });
          break;
        }
        case 'searchStarted':
          stopReading();
          hush('search');
          react({ face: 'curious', emote: vary('searching', says.searching), ms: 1200 });
          break;
        case 'searchFound':
          react({ face: 'happy', emote: vary('found', says.found)(event.count), move: 'nod' });
          break;
        case 'searchEmpty': {
          const retry = event.widen ?? event.loosen;
          say({
            rank: 'react',
            topic: 'search',
            copy: ({ robot }) =>
              event.widen
                ? robot.lines.emptyWiden
                : event.loosen
                  ? robot.lines.emptyLoosen
                  : robot.lines.emptyStuck,
            run: retry,
            cue: 'teach',
            target: EMPTY_BOX,
            aim: FROM_UNDER,
            ttl: retry ? 16000 : 8000,
          });
          break;
        }
        case 'searchFailed':
          react({ face: 'worried', emote: vary('searchFailed', says.searchFailed), move: 'shake' });
          break;
        case 'copied':
          react({ face: 'happy', emote: vary('copied', says.copied), move: 'nod', ms: 1300 });
          break;
        case 'urlRejected':
          react({ face: 'curious', emote: vary('badLink', says.badLink), move: 'shake' });
          break;
        case 'analysisStarted':
          setWatching(true);
          // The download begins at once, before the first news of it arrives.
          toldStep.current = null;
          sayStep('downloading');
          break;
        case 'analysisStage':
          sayStep(event.stage);
          break;
        case 'analysisDone':
          setWatching(false);
          hush('analysis');
          react({ face: 'happy', emote: vary('analysed', says.analysed), move: 'hop' });
          review(event.title);
          break;
        case 'analysisFailed':
          setWatching(false);
          say({
            rank: 'react',
            topic: 'analysis',
            copy: ({ robot }) => robot.lines.analysisFailed,
            run: event.manual,
            cue: 'worry',
            target: ERROR_BOX,
            aim: FROM_UNDER,
            ttl: 22000,
          });
          break;
        case 'analysisCancelled':
          setWatching(false);
          hush('analysis');
          react({ emote: vary('cancelled', says.cancelled) });
          break;
        case 'analysisDuplicate':
          setWatching(false);
          hush('analysis');
          react({ face: 'curious', emote: vary('duplicate', says.duplicate), move: 'nod' });
          break;
        case 'draftFound':
          react({ face: 'happy', emote: vary('draft', says.draft) });
          break;
        case 'manualOpened':
          hush('analysis');
          react({ face: 'happy', emote: vary('manual', says.manual) });
          break;
        case 'saved':
          stopReading();
          react({ face: 'happy', emote: vary('saved', says.saved), move: 'spin', ms: 2000 });
          break;
        case 'saveFailed':
          react({ face: 'worried', emote: vary('saveFailed', says.saveFailed), move: 'shake' });
          break;
        case 'videoRemoved':
          react({ face: 'neutral', emote: vary('removed', says.removed), move: 'nod' });
          break;
        case 'videoRemoveFailed':
          react({ face: 'worried', emote: vary('removeFailed', says.removeFailed), move: 'shake' });
          break;
        case 'signedIn':
          react({ face: 'happy', emote: vary('hello', says.hello)(event.name), move: 'hop' });
          break;
        case 'signedOut':
          react({ emote: vary('bye', says.bye) });
          break;
        case 'language':
          react({ face: 'happy', emote: vary('language', says.language) });
          break;
        case 'closeAttempt':
          react({
            face: 'wow',
            emote: says.closing[Math.min(event.attempt, says.closing.length) - 1],
            move: 'jolt',
          });
          break;
        case 'reopened':
          react({ face: 'happy', emote: vary('reopened', says.reopened), move: 'hop' });
          break;
        case 'maximized':
          react({
            face: event.on ? 'wow' : 'neutral',
            emote: event.on ? vary('bigger', says.bigger) : vary('smaller', says.smaller),
          });
          break;
        case 'serverWaking':
          say({
            rank: 'tip',
            topic: 'server',
            copy: ({ robot }) => robot.lines.serverWaking,
            cue: 'teach',
            target: null,
            ttl: 12000,
          });
          break;
        case 'serverAwake':
          hush('server');
          react({ face: 'happy', emote: vary('serverAwake', says.serverAwake), move: 'hop' });
          break;
        case 'iconDropped':
          react({ face: 'curious', emote: vary('iconDropped', says.iconDropped) });
          break;
        case 'binThreat':
          react({ face: 'angry', emote: vary('binThreat', says.binThreat), move: 'jolt' });
          break;
        case 'appTrashed':
          put(null);
          react({ face: 'wow', emote: vary('appTrashed', says.appTrashed), move: 'jolt', ms: 900 });
          break;
        case 'serverDown':
          say({
            rank: 'react',
            topic: 'server',
            copy: ({ robot }) => robot.lines.serverDown,
            cue: 'worry',
            target: null,
            ttl: 14000,
          });
          break;
      }
    },
    [hush, put, react, review, say, sayStep, stopReading, typed, vary],
  );

  const stopHelp = useCallback(() => {
    setHelping(false);
    if (spoken.current?.rank === 'ask') put(null);
  }, [put]);

  const toggleHelp = useCallback(() => {
    if (helping) {
      stopHelp();
      return;
    }
    setHelping(true);
    say({
      rank: 'ask',
      copy: (t) => ({ text: t.robot.whatsThis.prompt }),
      cue: 'rest',
      target: null,
      ttl: null,
    });
  }, [helping, say, stopHelp]);

  /** The click that "what's this?" was waiting for. Anything unmarked keeps it waiting. */
  const pick = useCallback(
    (node: HTMLElement | null) => {
      const key = node?.dataset.help;
      if (node && isHelpKey(key)) {
        setHelping(false);
        explain(key, node);
        return;
      }
      say({
        rank: 'ask',
        copy: (t) => ({ text: t.robot.whatsThis.unknown }),
        cue: 'rest',
        target: null,
        ttl: null,
      });
    },
    [explain, say],
  );

  useEffect(() => {
    if (!line || line.ttl === null) return;
    const id = setTimeout(() => {
      if (spoken.current?.id === line.id) put(null);
    }, line.ttl);
    return () => clearTimeout(id);
  }, [line, put]);

  // An answer the user asked for goes away as soon as they move on to something else.
  useEffect(() => {
    if (line?.rank !== 'ask' || helping) return;

    const onPress = (event: PointerEvent) => {
      const within =
        event.target instanceof Element && event.target.closest('[data-robot-says], [data-robot-body]');
      if (!within) put(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') put(null);
    };

    document.addEventListener('pointerdown', onPress);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPress);
      document.removeEventListener('keydown', onKey);
    };
  }, [line, helping, put]);

  // A long analysis gets a word now and then, so the wait does not feel like a freeze.
  useEffect(() => {
    if (!watching) return;

    let beat = 0;
    const id = setInterval(() => {
      const index = beat;
      beat += 1;
      if (index >= en.robot.lines.waiting.length) {
        clearInterval(id);
        return;
      }
      say({
        rank: 'tip',
        topic: 'analysis',
        copy: ({ robot }) => ({ text: robot.lines.waiting[index] }),
        cue: 'watch',
        target: PROGRESS,
        ttl: 6500,
      });
    }, WAIT_BETWEEN_LINES);
    return () => clearInterval(id);
  }, [watching, say]);

  const voice = useMemo<RobotVoice>(() => ({ explain, notify }), [explain, notify]);

  /** What it should be doing now: its own line first, then the guide, then the app. */
  const briefOver = (guide: Brief | null): Brief => {
    if (line) {
      return {
        utterance: `line:${line.id}`,
        cue: line.cue,
        target: line.target,
        aim: line.aim ?? null,
        roam: 'never',
        speech: LINE_SPEECH,
      };
    }
    if (guide) return guide;
    if (watching) return WATCHING;
    return reader.reading ? READING[reader.reading] : AT_REST;
  };

  return {
    voice,
    notify,
    line,
    dismiss,
    handle,
    briefOver,
    helping,
    toggleHelp,
    stopHelp,
    pick,
    dropped,
  };
};
