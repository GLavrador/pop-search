import { createContext, useContext } from 'react';
import type { Dictionary } from '../i18n/en';

export type HelpKey = keyof Dictionary['robot']['help'];

/** Marks a control as one the robot can find and explain. */
export const helpAt = (key: HelpKey) => ({ 'data-help': key });

/** The control with that mark that is on screen right now: hidden tabs hold copies. */
export const findHelp = (key: HelpKey): HTMLElement | null =>
  [...document.querySelectorAll<HTMLElement>(`[data-help="${key}"]`)].find(
    (node) => node.getClientRects().length > 0,
  ) ?? null;

export interface RobotVoice {
  /** Has it explain a control, standing next to `node`. */
  explain: (key: HelpKey, node: HTMLElement) => void;
}

const SILENT: RobotVoice = {
  explain: () => {},
};

// Defaulted, not undefined: a component rendered on its own just has no robot.
export const RobotContext = createContext<RobotVoice>(SILENT);

export const useRobot = () => useContext(RobotContext);
