import { useState } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { useQuotaQuery } from '../../hooks/useQuotaQuery';
import { ReviewWelcome } from '../ReviewWelcome';
import { helpAt, useRobot } from '../../context/robotContext';
import { useStatus } from '../../context/status';
import { CONTACT_URL } from '../../constants/contact';
import styles from './styles.module.css';

/** What an account waiting for approval sees where the link would go. */
export const ReviewLock = () => {
  const { t } = useI18n();
  const robot = useRobot();
  const { setStatus } = useStatus();
  const { quota } = useQuotaQuery();
  const [explaining, setExplaining] = useState(false);

  const tried = () => {
    setStatus(t.ingest.status.locked, 4000);
    robot.notify({ kind: 'addLocked' });
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{t.ingest.urlLabel}</label>
      <div className={`${styles.inputRow} ${styles.locked}`} title={t.ingest.locked.field} onClick={tried}>
        <input
          type="text"
          className="win95-inset win95-input"
          placeholder={t.ingest.urlPlaceholder}
          aria-label={t.ingest.locked.field}
          disabled
        />
        <button type="button" className={`win95-btn ${styles.runButton}`} disabled>
          {t.ingest.next}
        </button>
      </div>

      <div className={`win95-border ${styles.notice}`} role="status" {...helpAt('ingest.locked')}>
        <strong>{t.ingest.locked.title}</strong>
        <span>{t.ingest.locked.body}</span>
        <span className={styles.noticeFoot}>
          {t.ingest.locked.contact}{' '}
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
            {CONTACT_URL.replace(/^https:\/\/www\./, '')}
          </a>
        </span>
        <button type="button" className={styles.more} onClick={() => setExplaining(true)}>
          {t.quota.reviewMore}
        </button>
      </div>

      {explaining && <ReviewWelcome analyses={quota?.limit ?? 2} onClose={() => setExplaining(false)} />}
    </div>
  );
};
