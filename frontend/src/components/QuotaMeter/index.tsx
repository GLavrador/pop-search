import { useQuotaQuery } from '../../hooks/useQuotaQuery';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

// Rendered in UTC because the window is counted in UTC on the server. In local
// time, midnight on the 1st reads as the 31st, telling the user the quota
// renews before the month is over.
const formatDate = (value: string, locale: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(locale, { timeZone: 'UTC' });
};

export const QuotaMeter = () => {
  const { quota, isLoading } = useQuotaQuery();
  const { t, locale } = useI18n();

  if (isLoading && !quota) {
    return <div className={styles.meter}><span className={styles.note}>{t.quota.loading}</span></div>;
  }

  if (!quota) {
    return null;
  }

  const isExhausted = quota.remaining === 0;
  const percent = quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 0;

  return (
    <div className={`${styles.meter} ${isExhausted ? styles.exhausted : ''}`}>
      <div className={styles.row}>
        <span className={styles.label}>{t.quota.label}</span>
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
          aria-label={t.quota.barLabel}
        />
      </div>

      {quota.tokens_this_month > 0 && (
        <span className={styles.note}>
          {t.quota.tokens(quota.tokens_this_month.toLocaleString(locale))}
        </span>
      )}

      {isExhausted ? (
        <span className={styles.warning}>
          {t.quota.exhausted(formatDate(quota.resets_at, locale))}
        </span>
      ) : (
        <span className={styles.note}>
          {t.quota.remaining(quota.remaining, formatDate(quota.resets_at, locale))}
        </span>
      )}
    </div>
  );
};
