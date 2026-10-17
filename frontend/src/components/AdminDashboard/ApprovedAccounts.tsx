import { useApprovedAccountsQuery } from '../../hooks/useReviewQueries';
import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import { VideoSummary } from './VideoSummary';
import { formatDate } from './formatDate';
import styles from './styles.module.css';

/** The accounts approved in the last days, and what each has added since. */
export const ApprovedAccounts = () => {
  const { t, locale } = useI18n();
  const query = useApprovedAccountsQuery();
  const accounts = query.data ?? [];
  const copy = t.admin.approved;

  return (
    <div {...helpAt('admin.approved')}>
      {query.isPending ? (
        <p className={styles.empty}>{t.admin.pending.loading}</p>
      ) : query.isError ? (
        <p className={styles.empty}>{copy.loadFailed}</p>
      ) : accounts.length === 0 ? (
        <p className={styles.empty}>{copy.empty}</p>
      ) : (
        <ul className={styles.pending}>
          {accounts.map((account) => (
            <li key={account.user_id} className={styles.pendingRow}>
              <span>
                <strong>{account.display_name}</strong>{' '}
                <span className={styles.cardHint}>
                  {copy.on(formatDate(account.approved_at, locale))} · {copy.count(account.video_count)}
                </span>
              </span>
              {account.videos.map((video) => (
                <VideoSummary
                  key={video.id}
                  video={video}
                  added={copy.added(formatDate(video.created_at, locale))}
                />
              ))}
              {account.video_count > account.videos.length && (
                <span className={styles.cardHint}>
                  {copy.more(account.video_count - account.videos.length)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.note}>{copy.note}</p>
    </div>
  );
};
