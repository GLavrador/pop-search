import { useI18n } from '../../i18n/languageContext';
import type { Line } from '../../hooks/useRobotDirector';
import styles from './styles.module.css';

interface SpeechProps {
  line: Line;
  onDismiss: () => void;
}

/** What the robot is saying, in the balloon it carries around. */
export const Speech = ({ line, onDismiss }: SpeechProps) => {
  const { t } = useI18n();
  const copy = line.copy(t);

  return (
    <div className={styles.speech} role="status" data-robot-says>
      <button
        type="button"
        className={styles.close}
        title={t.robot.dismiss}
        aria-label={t.robot.dismiss}
        onClick={onDismiss}
      />
      {copy.title && <p className={styles.speechTitle}>{copy.title}</p>}
      <p className={styles.speechText}>{copy.text}</p>
      {copy.action && line.run && (
        <button
          type="button"
          className={`win95-btn ${styles.go}`}
          onClick={() => {
            line.run?.();
            onDismiss();
          }}
        >
          {copy.action}
        </button>
      )}
    </div>
  );
};
