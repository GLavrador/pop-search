import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { en, type Dictionary } from '../i18n/en';
import { useI18n } from '../i18n/languageContext';
import {
  findHelp,
  type HelpKey,
  type PressKey,
  type RobotEvent,
  type RobotVoice,
} from '../context/robotContext';
import type { Cue, Mission, Reaction, Target, Zone } from '../components/Assistant/pilot';
import type { Face } from '../components/Assistant/trips';
import { createVariety } from '../components/Assistant/variety';
import type { RobotHandle } from '../components/Assistant/RobotPilot';
import type { Aim } from '../components/Demo/spotlight';
import type { Tab } from '../constants/tabs';

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
  topic?: 'search' | 'analysis';
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
  back: 'neutral',
};

const icon = (zone: Zone) => () =>
  document.querySelector<HTMLElement>(`[data-robot-zone="${zone}"]`);
const ICONS = { computer: icon('computer'), app: icon('app') };
const BESIDE_ICON: Aim = { from: 'right' };
// Under the panel, so the balloon lands on the desktop and not on what the user needs next.
const FROM_UNDER: Aim = { from: 'below', free: true };
const PROGRESS = () => findHelp('ingest.progress');
const ERROR_BOX = () => findHelp('ingest.error');
const EMPTY_BOX = () => findHelp('search.empty');

const AT_REST: Brief = { utterance: 'rest', cue: 'rest', target: null, aim: null, roam: 'calm' };
const WATCHING: Brief = {
  utterance: 'watch',
  cue: 'watch',
  target: PROGRESS,
  aim: null,
  roam: 'never',
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
  const vary = useMemo(() => createVariety(), []);
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

  const explain = useCallback(
    (key: HelpKey, node: HTMLElement) => {
      say({ rank: 'ask', copy: (t) => t.robot.help[key], cue: 'teach', target: node, ttl: null });
    },
    [say],
  );

  /** Dropped on the bin it runs for it on its own; the other icons get a word. */
  const dropped = useCallback(
    (zone: Zone | null) => {
      if (zone !== 'computer' && zone !== 'app') return;
      const turn = vary(`drop.${zone}`, [0, 1, 2]);
      say({
        rank: 'react',
        copy: ({ robot }) => ({ text: robot.drop[zone][turn % robot.drop[zone].length] }),
        cue: zone === 'app' ? 'cheer' : 'teach',
        target: ICONS[zone],
        aim: BESIDE_ICON,
        ttl: 6500,
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
          react({
            face: PRESS_FACES[event.what] ?? 'happy',
            emote: vary(`press.${event.what}`, says.press[event.what]),
          });
          break;
        }
        case 'searchStarted':
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
          say({
            rank: 'react',
            topic: 'analysis',
            copy: ({ robot }) => ({ text: robot.lines.watching }),
            cue: 'watch',
            target: PROGRESS,
            ttl: 6500,
          });
          break;
        case 'analysisDone':
          setWatching(false);
          hush('analysis');
          react({ face: 'happy', emote: vary('analysed', says.analysed), move: 'hop' });
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
        case 'manualOpened':
          hush('analysis');
          react({ face: 'happy', emote: vary('manual', says.manual) });
          break;
        case 'saved':
          react({ face: 'happy', emote: vary('saved', says.saved), move: 'spin', ms: 2000 });
          break;
        case 'saveFailed':
          react({ face: 'worried', emote: vary('saveFailed', says.saveFailed), move: 'shake' });
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
      }
    },
    [hush, put, react, say, vary],
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
    return guide ?? (watching ? WATCHING : AT_REST);
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
