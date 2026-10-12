import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import type { AnalysisJob } from '../../types';
import styles from './styles.module.css';

interface DraftNoticeProps {
  draft: AnalysisJob;
  onResume: () => void;
  onDiscard: () => void;
}

const formatDate = (value: string, locale: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
};

export const DraftNotice = ({ draft, onResume, onDiscard }: DraftNoticeProps) => {
  const { t, locale } = useI18n();

  return (
    <div className={`win95-border ${styles.notice}`} {...helpAt('ingest.draft')}>
      <strong>{t.ingest.draft.title}</strong>
      <span>{t.ingest.draft.body}</span>
      <span className={styles.noticeSubject}>{draft.result?.titulo_sugerido || draft.url}</span>
      <span className={styles.noticeFoot}>
        {t.ingest.draft.analysed(formatDate(draft.created_at, locale))} {draft.url}
      </span>

      <div className={styles.noticeActions}>
        <button type="button" className="win95-btn" onClick={onResume}>
          {t.ingest.draft.resume}
        </button>
        <button type="button" className="win95-btn" onClick={onDiscard}>
          {t.ingest.draft.discard}
        </button>
      </div>
    </div>
  );
};
