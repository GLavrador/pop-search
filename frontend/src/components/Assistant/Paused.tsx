import { useI18n } from '../../i18n/languageContext';
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
    <div className={`win95-border ${styles.paused}`}>
      <span className={styles.pausedIcon} aria-hidden="true">
        {t.guide.avatar}
      </span>
      <span className={styles.pausedText}>{t.guide.paused(index + 1, total)}</span>
      <button type="button" className={`win95-btn ${styles.pausedButton}`} onClick={onResume}>
        {t.guide.resume}
      </button>
      <button type="button" className={styles.quit} onClick={onQuit}>
        {t.guide.quit}
      </button>
    </div>
  );
};
