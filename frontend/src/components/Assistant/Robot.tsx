import styles from './styles.module.css';

interface RobotProps {
  className?: string;
  /** Runs the one-shot mouth and arm animations. Restart them by changing the key. */
  talking?: boolean;
}

export const Robot = ({ className = '', talking = false }: RobotProps) => (
  <svg
    viewBox="0 0 52 60"
    className={`${styles.robot} ${className}`}
    aria-hidden="true"
    focusable="false"
  >
    <g>
      <circle className={styles.led} cx="26" cy="3.5" r="3" />
      <path d="M26 11 V6" />

      <rect
        className={talking ? styles.armLeft : ''}
        x="3"
        y="40"
        width="9"
        height="4.5"
      />
      <rect
        className={talking ? styles.armRight : ''}
        x="40"
        y="40"
        width="9"
        height="4.5"
      />

      <rect x="22.5" y="33" width="7" height="5" />
      <rect x="12" y="37" width="28" height="17" />
      <rect x="15" y="54" width="8" height="4" />
      <rect x="29" y="54" width="8" height="4" />
      <circle className={styles.chest} cx="26" cy="45" r="3" />

      <rect x="9" y="11" width="34" height="23" />
      <rect className={styles.face} x="13" y="15" width="26" height="15" />
      <circle className={styles.eye} cx="20" cy="20.5" r="2.8" />
      <circle className={`${styles.eye} ${styles.eyeRight}`} cx="32" cy="20.5" r="2.8" />
      <rect
        className={`${styles.mouth} ${talking ? styles.mouthTalking : ''}`}
        x="20"
        y="25.5"
        width="12"
        height="2.6"
      />
    </g>
  </svg>
);
