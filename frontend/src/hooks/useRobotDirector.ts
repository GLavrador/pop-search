import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Dictionary } from '../i18n/en';
import type { HelpKey, RobotVoice } from '../context/robotContext';
import type { Cue, Mission, Target } from '../components/Assistant/pilot';
import type { RobotHandle } from '../components/Assistant/RobotPilot';
import type { Aim } from '../components/Demo/spotlight';

export interface LineCopy {
  text: ReactNode;
  title?: string;
}

/** One thing the robot says: where it stands to say it, and how long it stays said. */
export interface Line {
  id: number;
  /** Who started it: the user asking, something the user did, or the robot itself. */
  rank: 'ask' | 'react' | 'tip';
  /** Read at render time, so it follows a change of language. */
  copy: (t: Dictionary) => LineCopy;
  cue: Cue;
  target: Target;
  aim?: Aim;
  /** Gone after this long on its own; null stays until dismissed. */
  ttl: number | null;
}

/** Where the robot should be and how, without the parts that never change. */
export type Brief = Pick<Mission, 'utterance' | 'cue' | 'target' | 'aim' | 'roam' | 'speech'>;

const AT_REST: Brief = { utterance: 'rest', cue: 'rest', target: null, aim: null, roam: 'calm' };
const LINE_SPEECH = 2200;

export const useRobotDirector = () => {
  const [line, setLine] = useState<Line | null>(null);
  const lastId = useRef(0);
  const handle = useRef<RobotHandle>(null);

  const say = useCallback((next: Omit<Line, 'id'>) => {
    lastId.current += 1;
    setLine({ ...next, id: lastId.current });
  }, []);

  const dismiss = useCallback(() => setLine(null), []);

  const explain = useCallback(
    (key: HelpKey, node: HTMLElement) => {
      say({ rank: 'ask', copy: (t) => t.robot.help[key], cue: 'teach', target: node, ttl: null });
    },
    [say],
  );

  useEffect(() => {
    if (!line || line.ttl === null) return;
    const id = setTimeout(
      () => setLine((current) => (current?.id === line.id ? null : current)),
      line.ttl,
    );
    return () => clearTimeout(id);
  }, [line]);

  // An answer the user asked for goes away as soon as they move on to something else.
  useEffect(() => {
    if (line?.rank !== 'ask') return;

    const onPress = (event: PointerEvent) => {
      const within =
        event.target instanceof Element && event.target.closest('[data-robot-says], [data-robot-body]');
      if (!within) setLine(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLine(null);
    };

    document.addEventListener('pointerdown', onPress);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPress);
      document.removeEventListener('keydown', onKey);
    };
  }, [line]);

  const voice = useMemo<RobotVoice>(() => ({ explain }), [explain]);

  /** What it should be doing now: its own line first, then the guide, then nothing much. */
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
    return guide ?? AT_REST;
  };

  return { voice, line, dismiss, handle, briefOver };
};
