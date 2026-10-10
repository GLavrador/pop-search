import {
  useEffect,
  useImperativeHandle,
  useRef,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { useI18n } from '../../i18n/languageContext';
import { Robot } from './Robot';
import {
  createPilot,
  type Cue,
  type Pilot,
  type Reaction,
  type Roam,
  type Target,
  type Zone,
} from './pilot';
import type { Aim } from '../Demo/spotlight';
import { helpAt } from '../../context/robotContext';
import styles from './styles.module.css';

const DRAG_AFTER = 6;

/** The one-off things it can be asked to do, as opposed to where it should be. */
export interface RobotHandle {
  react: (reaction: Reaction) => void;
  trick: () => void;
}

interface RobotPilotProps {
  /** Changes whenever the robot has something new to say. */
  utterance: number | string;
  cue: Cue;
  /** The empty seat kept for it inside the assistant panel. */
  home: RefObject<HTMLElement | null>;
  /** The control it is talking about, when there is one. */
  target: Target;
  aim: Aim | null;
  /** True while the window is minimized: it waits on the taskbar instead of leaving. */
  parked: boolean;
  roam: Roam;
  speech?: number;
  /** The scrolling panel: while pointing it never leaves it, so it covers no chrome. */
  stage: RefObject<HTMLElement | null>;
  /** What a click on it does, for the tooltip and for screen readers. */
  label: string;
  /** Set while something hanging over it is in use, so it stays put under it. */
  pinned?: boolean;
  handle?: RefObject<RobotHandle | null>;
  /** Takes the click. Without it a click is just a poke. */
  onPoke?: () => void;
  /** It was dragged and let go, on one of the desktop icons or nowhere in particular. */
  onDrop?: (zone: Zone | null) => void;
  /** What hangs over it: what it is saying, or its menu. */
  children?: ReactNode;
}

export const RobotPilot = ({
  utterance,
  cue,
  home,
  target,
  aim,
  parked,
  roam,
  speech,
  stage,
  label,
  pinned = false,
  handle,
  onPoke,
  onDrop,
  children,
}: RobotPilotProps) => {
  const { t } = useI18n();
  const sky = useRef<HTMLDivElement>(null);
  const craft = useRef<HTMLDivElement>(null);
  const emote = useRef<HTMLSpanElement>(null);
  const balloon = useRef<HTMLDivElement>(null);
  const pilot = useRef<Pilot | null>(null);
  const press = useRef<{ x: number; y: number; carrying: boolean } | null>(null);
  const justDropped = useRef(false);

  useEffect(() => {
    if (!sky.current || !craft.current || !emote.current || !balloon.current) return;

    const flying = createPilot({
      sky: sky.current,
      craft: craft.current,
      emote: emote.current,
      balloon: balloon.current,
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
    pilot.current?.brief({
      utterance,
      cue,
      target,
      aim,
      parked,
      roam,
      speech,
      beeps: t.guide.beeps,
      emotes: t.guide.emotes,
    });
  }, [utterance, cue, target, aim, parked, roam, speech, t.guide.beeps, t.guide.emotes]);

  useEffect(() => {
    pilot.current?.pin(pinned);
  }, [pinned]);

  useImperativeHandle(
    handle,
    () => ({
      react: (reaction) => pilot.current?.react(reaction),
      trick: () => pilot.current?.trick(),
    }),
    [],
  );

  const handleClick = () => {
    // The click that ends a drag is not a click on the robot.
    if (justDropped.current) {
      justDropped.current = false;
      return;
    }
    const spent = pilot.current?.poke(onPoke !== undefined) ?? false;
    if (!spent) onPoke?.();
  };

  const handleDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    press.current = { x: event.clientX, y: event.clientY, carrying: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handleMove = (event: PointerEvent) => {
    const start = press.current;
    if (!start) return;

    if (!start.carrying) {
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_AFTER) return;
      start.carrying = true;
      pilot.current?.grab(start.x, start.y);
    }
    pilot.current?.drag(event.clientX, event.clientY);
  };

  const handleUp = () => {
    const carrying = press.current?.carrying ?? false;
    press.current = null;
    if (!carrying) return;

    justDropped.current = true;
    setTimeout(() => {
      justDropped.current = false;
    }, 0);
    onDrop?.(pilot.current?.release() ?? null);
  };

  return (
    <div ref={sky} className={styles.sky}>
      <div ref={craft} className={styles.craft}>
        <button
          type="button"
          className={styles.body}
          data-robot-body
          {...helpAt('robot')}
          title={label}
          aria-label={label}
          onClick={handleClick}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        >
          <Robot />
        </button>
        <span ref={emote} className={styles.emote} />
        <div ref={balloon} className={styles.balloon}>
          {children}
        </div>
      </div>
    </div>
  );
};
