import { useState } from 'react';
import { RANGE_OPTIONS, useAdminStatsQuery } from '../../hooks/useAdminStatsQuery';
import styles from './styles.module.css';

const n = (value: number) => value.toLocaleString();

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

  if (!isAdmin) {
    return <p className={styles.empty}>This page is for administrators.</p>;
  }

  if (error) {
    return <p className={styles.empty}>{error}</p>;
  }

  if (!stats) {
    return <p className={styles.empty}>{isLoading ? 'Loading statistics...' : 'No data yet.'}</p>;
  }

  const ceilingHit = stats.daily_limit > 0 && stats.analyses_today >= stats.daily_limit;
  const busiestDay = Math.max(1, ...stats.daily.map((point) => point.analyses));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Project statistics</h2>
        <div className={styles.ranges} role="group" aria-label="Time range">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              onClick={() => setDays(option)}
              className={`win95-btn ${styles.rangeButton} ${days === option ? 'win95-btn-pressed' : ''}`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      <div className={styles.cards}>
        <Card
          label="Avg per analysis"
          value={n(stats.avg_tokens)}
          hint={`median ${n(stats.median_tokens)} · ${stats.measured} measured`}
        />
        <Card
          label="Cheapest / priciest"
          value={`${n(stats.min_tokens)} / ${n(stats.max_tokens)}`}
          hint="tokens, one analysis"
        />
        <Card
          label="Analyses"
          value={n(stats.analyses)}
          hint={`${n(stats.saves)} saves · ${n(stats.tokens)} tokens total`}
        />
        <Card
          label="Failure rate"
          value={`${(stats.failure_rate * 100).toFixed(1)}%`}
          hint={`${n(stats.tokens_wasted)} tokens spent for nothing`}
          alert={stats.failure_rate > 0.1}
        />
        <Card
          label="Today"
          value={`${stats.analyses_today} / ${stats.daily_limit}`}
          hint={ceilingHit ? 'ceiling reached, nobody can analyse' : 'against the daily ceiling'}
          alert={ceilingHit}
        />
        <Card
          label="A full day would cost"
          value={n(stats.projected_tokens_at_limit)}
          hint="tokens, at the ceiling and current average"
        />
      </div>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Analyses per day</legend>
        {stats.daily.length === 0 ? (
          <p className={styles.empty}>Nothing in this range.</p>
        ) : (
          <div className={styles.bars}>
            {stats.daily.map((point) => (
              <div
                key={point.date}
                className={styles.bar}
                style={{ height: `${(point.analyses / busiestDay) * 100}%` }}
                title={`${point.date}: ${point.analyses} analyses, ${n(point.tokens)} tokens`}
              />
            ))}
          </div>
        )}
        <p className={styles.note}>
          Hover a bar for the exact day. Use this to see whether the ceiling is
          set anywhere near real demand.
        </p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Why analyses failed</legend>
        {stats.failures_by_reason.length === 0 ? (
          <p className={styles.empty}>No failures in this range.</p>
        ) : (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Count</th>
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
        <p className={styles.note}>
          Every failure here still cost tokens. A reason that repeats is worth
          fixing before raising anyone's limit.
        </p>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Consumption per account, this month</legend>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Analyses</th>
                <th>Tokens</th>
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
        <p className={styles.note}>
          Tokens are what count against the Google AI quota. Analyses are what
          each account is limited by.
        </p>
      </fieldset>
    </div>
  );
};
