import { useI18n } from '../../i18n/languageContext';
import { Robot } from './Robot';
import styles from './styles.module.css';

interface GuidePausedProps {
  index: number;
  total: number;
  onResume: () => void;
  onQuit: () => void;
}

export const GuidePaused = ({ index, total, onResume, onQuit }: GuidePausedProps) => {
  const { t } = useI18n();

  return (
    <div className={styles.paused}>
      <span className={styles.mini}>
        <Robot className={styles.robotSmall} />
      </span>
      <span className={styles.pausedText}>{t.guide.paused(index + 1, total)}</span>
      <button type="button" className={styles.link} onClick={onQuit}>
        {t.guide.quit}
      </button>
      <button type="button" className={`win95-btn ${styles.go}`} onClick={onResume}>
        {t.guide.resume}
      </button>
    </div>
  );
};
