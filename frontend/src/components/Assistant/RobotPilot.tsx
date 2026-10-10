import { useEffect, useRef, type RefObject } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { Robot } from './Robot';
import { createPilot, type Cue, type Pilot } from './pilot';
import type { Aim } from '../Demo/spotlight';
import styles from './styles.module.css';

interface RobotPilotProps {
  /** Changes whenever the robot has something new to say. */
  utterance: number;
  cue: Cue;
  /** The empty seat kept for it inside the assistant panel. */
  home: RefObject<HTMLElement | null>;
  /** The spotlight of the current step, when it has one. */
  target: HTMLElement | null;
  aim: Aim | null;
  /** The scrolling panel: while pointing it never leaves it, so it covers no chrome. */
  stage: RefObject<HTMLElement | null>;
}

export const RobotPilot = ({ utterance, cue, home, target, aim, stage }: RobotPilotProps) => {
  const { t } = useI18n();
  const sky = useRef<HTMLDivElement>(null);
  const craft = useRef<HTMLButtonElement>(null);
  const emote = useRef<HTMLSpanElement>(null);
  const pilot = useRef<Pilot | null>(null);

  useEffect(() => {
    if (!sky.current || !craft.current || !emote.current) return;

    const flying = createPilot({
      sky: sky.current,
      craft: craft.current,
      emote: emote.current,
      home,
      stage,
    });
    pilot.current = flying;

    return () => {
      flying.dispose();
      pilot.current = null;
    };
  }, [home, stage]);

  useEffect(() => {
    pilot.current?.brief({ utterance, cue, target, aim, beeps: t.guide.beeps });
  }, [utterance, cue, target, aim, t.guide.beeps]);

  return (
    <div ref={sky} className={styles.sky}>
      <button
        ref={craft}
        type="button"
        className={styles.craft}
        title={t.guide.poke}
        aria-label={t.guide.poke}
        onClick={() => pilot.current?.poke()}
      >
        <Robot />
        <span ref={emote} className={styles.emote} />
      </button>
    </div>
  );
};
