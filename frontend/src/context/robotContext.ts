import { createContext, useContext } from 'react';
import type { Dictionary } from '../i18n/en';
import type { Tab } from '../constants/tabs';

export type HelpKey = keyof Dictionary['robot']['help'];

/** The buttons inside the tabs it has something to say about. */
export type PressKey = keyof Dictionary['robot']['says']['press'];

/** Marks a control as one the robot can find and explain. */
export const helpAt = (key: HelpKey) => ({ 'data-help': key });

/** The control with that mark that is on screen right now: hidden tabs hold copies. */
export const findHelp = (key: HelpKey): HTMLElement | null =>
  [...document.querySelectorAll<HTMLElement>(`[data-help="${key}"]`)].find(
    (node) => node.getClientRects().length > 0,
  ) ?? null;

/** Things that happen in the app. The robot decides which of them deserve a word. */
export type RobotEvent =
  | { kind: 'tab'; tab: Tab }
  | { kind: 'pressed'; what: PressKey }
  | { kind: 'searchStarted' }
  | { kind: 'searchFound'; count: number }
  /** Each way out that is still open comes along, ready to run from the balloon. */
  | { kind: 'searchEmpty'; widen?: () => void; loosen?: () => void }
  | { kind: 'searchFailed' }
  | { kind: 'copied' }
  | { kind: 'urlRejected' }
  | { kind: 'analysisStarted' }
  | { kind: 'analysisDone' }
  | { kind: 'analysisFailed'; manual: () => void }
  | { kind: 'analysisCancelled' }
  | { kind: 'manualOpened' }
  | { kind: 'saved' }
  | { kind: 'saveFailed' }
  | { kind: 'signedIn'; name: string | null }
  | { kind: 'signedOut' }
  | { kind: 'language' }
  | { kind: 'closeAttempt'; attempt: number }
  | { kind: 'reopened' }
  | { kind: 'maximized'; on: boolean };

export interface RobotVoice {
  /** Has it explain a control, standing next to `node`. */
  explain: (key: HelpKey, node: HTMLElement) => void;
  notify: (event: RobotEvent) => void;
}

const SILENT: RobotVoice = {
  explain: () => {},
  notify: () => {},
};

// Defaulted, not undefined: a component rendered on its own just has no robot.
export const RobotContext = createContext<RobotVoice>(SILENT);

export const useRobot = () => useContext(RobotContext);
