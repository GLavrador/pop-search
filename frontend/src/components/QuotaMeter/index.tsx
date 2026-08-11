import { useQuotaQuery } from '../../hooks/useQuotaQuery';
import styles from './styles.module.css';

// Rendered in UTC because the window is counted in UTC on the server. In local
// time, midnight on the 1st reads as the 31st, telling the user the quota
// renews before the month is over.
const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { timeZone: 'UTC' });
};

export const QuotaMeter = () => {
  const { quota, isLoading } = useQuotaQuery();

  if (isLoading && !quota) {
    return <div className={styles.meter}><span className={styles.note}>Loading usage...</span></div>;
  }

  if (!quota) {
    return null;
  }

  const isExhausted = quota.remaining === 0;
  const percent = quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 0;

  return (
    <div className={`${styles.meter} ${isExhausted ? styles.exhausted : ''}`}>
      <div className={styles.row}>
        <span className={styles.label}>Analyses this month</span>
        <span className={styles.count}>
          {quota.used} / {quota.limit}
        </span>
      </div>

      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={quota.used}
          aria-valuemin={0}
          aria-valuemax={quota.limit}
          aria-label="Analyses used this month"
        />
      </div>

      {isExhausted ? (
        <span className={styles.warning}>
          Limit reached. Renews on {formatDate(quota.resets_at)}. You can still
          add videos manually.
        </span>
      ) : (
        <span className={styles.note}>
          {quota.remaining} left, renews on {formatDate(quota.resets_at)}
        </span>
      )}
    </div>
  );
};
