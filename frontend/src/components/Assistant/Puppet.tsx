import type { CSSProperties } from 'react';
import { Robot } from './Robot';
import type { Face, Pose } from './trips';
import styles from './styles.module.css';

interface PuppetProps {
  pose: Pose;
  face: Face;
  talking?: boolean;
  /** Degrees it banks by. */
  lean?: number;
  /** Where its eyes are turned, each way from -1 to 1. */
  gaze?: { x: number; y: number };
  className?: string;
}

/** The robot as something else moves it: it looks the way it is told to and stays where it is put. */
export const Puppet = ({
  pose,
  face,
  talking = false,
  lean = 0,
  gaze = { x: 0, y: 0 },
  className = '',
}: PuppetProps) => (
  <span
    className={`${styles.puppet} ${className}`}
    data-pose={pose}
    data-face={face}
    data-talking={talking ? '' : undefined}
    style={
      {
        '--lean': `${lean}deg`,
        '--look-x': `${gaze.x * 2.2}px`,
        '--look-y': `${gaze.y * 1.3}px`,
        '--turn': `${gaze.x * 1.6}px`,
      } as CSSProperties
    }
  >
    <Robot />
  </span>
);
