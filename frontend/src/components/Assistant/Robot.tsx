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
      {/* Each flame belongs to its foot, so it points wherever the foot does. */}
      <g className={styles.legL}>
        <g className={styles.flame}>
          <path d="M16.2 58 C16.2 62.4 18.1 63.8 19 67 C19.9 63.8 21.8 62.4 21.8 58 Z" />
          <path
            className={styles.flameCore}
            d="M17.7 58 C17.7 60.6 18.6 61.4 19 63.4 C19.4 61.4 20.3 60.6 20.3 58 Z"
          />
        </g>
        <rect x="15" y="54" width="8" height="4" />
      </g>
      <g className={styles.legR}>
        <g className={styles.flame}>
          <path d="M30.2 58 C30.2 62.4 32.1 63.8 33 67 C33.9 63.8 35.8 62.4 35.8 58 Z" />
          <path
            className={styles.flameCore}
            d="M31.7 58 C31.7 60.6 32.6 61.4 33 63.4 C33.4 61.4 34.3 60.6 34.3 58 Z"
          />
        </g>
        <rect x="29" y="54" width="8" height="4" />
      </g>
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
          <g className={styles.eyesShut}>
            <rect x="17" y="20.4" width="6" height="1.8" />
            <rect x="29" y="20.4" width="6" height="1.8" />
          </g>
          <g className={styles.eyesDizzy}>
            <path d="M19.2 20.5 a0.8 0.8 0 1 0 1.6 0 a1.6 1.6 0 1 0 -3.2 0 a2.5 2.5 0 1 0 5 0" />
            <path d="M31.2 20.5 a0.8 0.8 0 1 0 1.6 0 a1.6 1.6 0 1 0 -3.2 0 a2.5 2.5 0 1 0 5 0" />
          </g>
          <g className={styles.brows}>
            <path d="M17 17.4 L22.6 15.9" />
            <path d="M29.4 15.9 L35 17.4" />
          </g>
          <g className={styles.browsAngry}>
            <path d="M16.6 15.9 L22.8 18" />
            <path d="M29.2 18 L35.4 15.9" />
          </g>
          <g className={styles.browsStern}>
            <path d="M16.8 16.9 H23.2" />
            <path d="M28.8 16.9 H35.2" />
          </g>
          <g className={styles.eyesTight}>
            <path d="M17.6 18.3 L22.4 20.6 L17.6 22.9" />
            <path d="M34.4 18.3 L29.6 20.6 L34.4 22.9" />
          </g>
          <g className={styles.eyesWide}>
            <circle cx="20" cy="20.3" r="3.5" />
            <circle cx="32" cy="20.3" r="3.5" />
            <rect className={styles.pupil} x="19.1" y="19.4" width="1.8" height="1.8" />
            <rect className={styles.pupil} x="31.1" y="19.4" width="1.8" height="1.8" />
          </g>
          {/* Half shut under lids that do not agree: one pulled down, one cocked. */}
          <g className={styles.eyesSour}>
            <rect x="17" y="20.8" width="6" height="2" />
            <rect x="29" y="20.2" width="6" height="2.6" />
            <path d="M16.6 17.6 L23.2 19.4" />
            <path d="M28.8 17.2 L35.4 16.4" />
          </g>
          {/* Set brows and a glint in each eye: it has made up its mind. */}
          <g className={styles.eyesKeen}>
            <path d="M16.4 16 L23 17.6" />
            <path d="M29 17.6 L35.6 16" />
            <rect className={styles.pupil} x="20.8" y="18.9" width="1.5" height="1.5" />
            <rect className={styles.pupil} x="32.8" y="18.9" width="1.5" height="1.5" />
          </g>

          <rect className={styles.mouthFlat} x="20" y="25.5" width="12" height="2.6" />
          <path className={styles.mouthSmile} d="M20.5 25 V28 H31.5 V25" />
          <rect className={styles.mouthOh} x="24" y="24.8" width="4" height="3.8" />
          <path className={styles.mouthFrown} d="M20.5 28.4 V25.6 H31.5 V28.4" />
          <path className={styles.mouthWavy} d="M20 27 l2 -1.7 l2 1.7 l2 -1.7 l2 1.7 l2 -1.7 l2 1.7" />
          <rect className={styles.mouthYawn} x="22.5" y="23.5" width="7" height="5.6" />
          <path
            className={styles.mouthGrit}
            d="M20.5 24.7 H31.5 V28.3 H20.5 Z M24.2 24.7 V28.3 M27.8 24.7 V28.3"
          />
          <path className={styles.mouthSour} d="M20 26.6 l2.4 -1.6 l2.4 1.6 l2.4 -1.6 l2.4 1.6 h2.4" />
          <rect className={styles.tongue} x="27.4" y="26.6" width="3.4" height="2.9" />
          <path className={styles.mouthGrin} d="M20 24.6 H32 V26.4 L29.6 28.6 H22.4 L20 26.4 Z" />
        </g>
        <path
          className={styles.sweat}
          d="M47 11.5 C48.5 13.7 49 14.5 49 15.3 a2 2 0 0 1 -4 0 C45 14.5 45.5 13.7 47 11.5 Z"
        />
      </g>

      {/* Both arms up and a hand on each side of the head: it cannot believe what it sees. */}
      <g className={styles.handsOnHead}>
        <path d="M8 41 L12.5 42 L9.6 15.5 L5.1 14.5 Z" />
        <path d="M44 41 L39.5 42 L42.4 15.5 L46.9 14.5 Z" />
        <rect x="3.5" y="9" width="7.5" height="6.5" />
        <rect x="41" y="9" width="7.5" height="6.5" />
      </g>

      {/* Both arms up and a hand over each eye. Drawn last, to go in front of the face. */}
      <g className={styles.hands}>
        <path d="M8.3 40.5 L12.7 42.5 L21.9 22.4 L17.5 20.4 Z" />
        <path d="M43.7 40.5 L39.3 42.5 L30.1 22.4 L34.5 20.4 Z" />
        <rect x="16" y="17.4" width="8" height="6.2" />
        <rect x="28" y="17.4" width="8" height="6.2" />
      </g>
    </g>
  </svg>
);
