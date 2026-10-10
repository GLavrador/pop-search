import styles from './styles.module.css';

interface RobotProps {
  className?: string;
}

/**
 * Every pose and face is drawn here at once. Which ones show is decided by the
 * data-pose, data-face and data-talking attributes of whatever wraps the robot.
 */
export const Robot = ({ className = '' }: RobotProps) => (
  <svg
    viewBox="0 0 52 60"
    className={`${styles.robot} ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <g className={styles.rig}>
      <g className={styles.jet}>
        <path d="M16.5 58 L19 66 L21.5 58 Z" />
        <path d="M30.5 58 L33 66 L35.5 58 Z" />
      </g>

      <rect className={styles.legL} x="15" y="54" width="8" height="4" />
      <rect className={styles.legR} x="29" y="54" width="8" height="4" />
      <rect className={styles.armL} x="3" y="40" width="9" height="4.5" />
      <rect className={styles.armR} x="40" y="40" width="9" height="4.5" />
      <rect x="22.5" y="33" width="7" height="5" />
      <rect x="12" y="37" width="28" height="17" />
      <circle className={styles.chest} cx="26" cy="45" r="3" />

      <g className={styles.head}>
        <path d="M26 11 V6" />
        <circle className={styles.led} cx="26" cy="3.5" r="3" />
        <rect x="9" y="11" width="34" height="23" />
        <rect className={styles.face} x="13" y="15" width="26" height="15" />

        <g className={styles.gaze}>
          <g className={styles.eyesRound}>
            <circle className={styles.eye} cx="20" cy="20.5" r="2.8" />
            <circle className={`${styles.eye} ${styles.eyeRight}`} cx="32" cy="20.5" r="2.8" />
          </g>
          <g className={styles.eyesHappy}>
            <path d="M17 22 L20 18.6 L23 22" />
            <path d="M29 22 L32 18.6 L35 22" />
          </g>
          <g className={styles.eyesWide}>
            <circle cx="20" cy="20.3" r="3.5" />
            <circle cx="32" cy="20.3" r="3.5" />
            <rect className={styles.pupil} x="19.1" y="19.4" width="1.8" height="1.8" />
            <rect className={styles.pupil} x="31.1" y="19.4" width="1.8" height="1.8" />
          </g>

          <rect className={styles.mouthFlat} x="20" y="25.5" width="12" height="2.6" />
          <path className={styles.mouthSmile} d="M20.5 25 V28 H31.5 V25" />
          <rect className={styles.mouthOh} x="24" y="24.8" width="4" height="3.8" />
        </g>
      </g>
    </g>
  </svg>
);
