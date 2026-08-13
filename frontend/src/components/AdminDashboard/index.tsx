import { useState } from 'react';
import { RANGE_OPTIONS, useAdminStatsQuery } from '../../hooks/useAdminStatsQuery';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

interface CardProps {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
}

const Card = ({ label, value, hint, alert }: CardProps) => (
  <div className={`${styles.card} ${alert ? styles.alert : ''}`}>
    <span className={styles.cardLabel}>{label}</span>
    <span className={styles.cardValue}>{value}</span>
    {hint && <span className={styles.cardHint}>{hint}</span>}
  </div>
);

export const AdminDashboard = () => {
  const [days, setDays] = useState<number>(30);
  const { isAdmin, stats, isLoading, error } = useAdminStatsQuery(days);
  const { t, locale } = useI18n();

  const n = (value: number) => value.toLocaleString(locale);

  if (!isAdmin) {
    return <p className={styles.empty}>{t.admin.notAdmin}</p>;
  }

  if (error) {
    return <p className={styles.empty}>{error}</p>;
  }

  if (!stats) {
    return <p className={styles.empty}>{isLoading ? t.admin.loading : t.admin.noData}</p>;
  }

  const ceilingHit = stats.daily_limit > 0 && stats.analyses_today >= stats.daily_limit;
  const busiestDay = Math.max(1, ...stats.daily.map((point) => point.analyses));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t.admin.title}</h2>
        <div className={styles.ranges} role="group" aria-label={t.admin.rangeLabel}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              onClick={() => setDays(option)}
              className={`win95-btn ${styles.rangeButton} ${days === option ? 'win95-btn-pressed' : ''}`}
            >
              {t.admin.range(option)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.cards}>
        <Card
          label={t.admin.avgLabel}
          value={n(stats.avg_tokens)}
          hint={t.admin.avgHint(n(stats.median_tokens), stats.measured)}
        />
        <Card
          label={t.admin.extremesLabel}
          value={`${n(stats.min_tokens)} / ${n(stats.max_tokens)}`}
          hint={t.admin.extremesHint}
        />
        <Card
          label={t.admin.analysesLabel}
          value={n(stats.analyses)}
          hint={t.admin.analysesHint(n(stats.saves), n(stats.tokens))}
        />
        <Card
          label={t.admin.failureLabel}
          value={`${(stats.failure_rate * 100).toFixed(1)}%`}
          hint={t.admin.failureHint(n(stats.tokens_wasted))}
          alert={stats.failure_rate > 0.1}
        />
        <Card
          label={t.admin.todayLabel}
          value={`${stats.analyses_today} / ${stats.daily_limit}`}
          hint={ceilingHit ? t.admin.ceilingHit : t.admin.againstCeiling}
          alert={ceilingHit}
        />
        <Card
          label={t.admin.projectedLabel}
          value={n(stats.projected_tokens_at_limit)}
          hint={t.admin.projectedHint}
        />
      </div>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t.admin.perDayLegend}</legend>
        {stats.daily.length === 0 ? (
          <p className={styles.empty}>{t.admin.perDayEmpty}</p>
        ) : (
          <div className={styles.bars}>
            {stats.daily.map((point) => (
              <div
                key={point.date}
                className={styles.bar}
                style={{ height: `${(point.analyses / busiestDay) * 100}%` }}
                title={t.admin.barTitle(point.date, point.analyses, n(point.tokens))}
              />
            ))}
          </div>
        )}
        <p className={styles.note}>{t.admin.perDayNote}</p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t.admin.failuresLegend}</legend>
        {stats.failures_by_reason.length === 0 ? (
          <p className={styles.empty}>{t.admin.failuresEmpty}</p>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t.admin.reason}</th>
                  <th>{t.admin.count}</th>
                </tr>
              </thead>
              <tbody>
                {stats.failures_by_reason.map((row) => (
                  <tr key={row.reason}>
                    <td>{row.reason}</td>
                    <td className={styles.number}>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={styles.note}>{t.admin.failuresNote}</p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>{t.admin.perUserLegend}</legend>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t.admin.user}</th>
                <th>{t.admin.analysesLabel}</th>
                <th>{t.admin.tokens}</th>
              </tr>
            </thead>
            <tbody>
              {stats.per_user.map((row) => (
                <tr key={row.user_id}>
                  <td>{row.display_name}</td>
                  <td className={styles.number}>
                    {row.analyses} / {row.limit}
                  </td>
                  <td className={styles.number}>{n(row.tokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>{t.admin.perUserNote}</p>
      </fieldset>
    </div>
  );
};
