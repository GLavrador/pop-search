import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import type { ExistingVideo } from '../../types';
import styles from './styles.module.css';
import film from '../../assets/win98/movie_maker-0.png';

interface DuplicateNoticeProps {
  video: ExistingVideo;
  onDismiss: () => void;
}

const formatDate = (value: string, locale: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
};

/** One line saying what happened, and under it the video that is already there. */
export const DuplicateNotice = ({ video, onDismiss }: DuplicateNoticeProps) => {
  const { t, locale } = useI18n();

  return (
    <div className={`win95-border ${styles.copy}`} aria-live="polite" {...helpAt('ingest.duplicate')}>
      <div className={styles.copyHead}>
        <span className={styles.copyMark} aria-hidden="true">i</span>
        <p className={styles.copyMessage}>
          <strong>{t.ingest.duplicate.title}</strong> {t.ingest.duplicate.body}
        </p>
        <button
          type="button"
          className={styles.copyClose}
          aria-label={t.ingest.duplicate.dismiss}
          title={t.ingest.duplicate.dismiss}
          onClick={onDismiss}
        >
          ✕
        </button>
      </div>

      <div className={styles.copyVideo}>
        <img src={film} alt="" className={styles.copyIcon} />
        <span className={styles.copyTitle}>{video.titulo_video || video.url_original.trim()}</span>
        <span className={styles.copyDate}>
          {t.ingest.duplicate.added(formatDate(video.created_at, locale))}
        </span>
        <a
          className={`win95-btn ${styles.copyOpen}`}
          href={video.url_original.trim()}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.ingest.duplicate.open}
        </a>
      </div>
    </div>
  );
};
