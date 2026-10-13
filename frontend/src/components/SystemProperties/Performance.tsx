import { useI18n } from '../../i18n/languageContext';
import { useLastSearch } from '../../services/searchTrace';
import { formatDuration } from '../../utils/duration';
import styles from './styles.module.css';

interface Step {
  label: string;
  /** Null when the search went without it. */
  ms: number | null;
}

export const Performance = () => {
  const { t, locale } = useI18n();
  const trace = useLastSearch();
  const copy = t.system.performance;

  if (!trace) return <p className={styles.lead}>{copy.none}</p>;

  const { serverMs, roundTripMs } = trace;
  const steps: Step[] =
    serverMs === null
      ? []
      : [
          { label: copy.steps.embed, ms: trace.embedMs },
          { label: copy.steps.db, ms: trace.dbMs ?? 0 },
          {
            label: copy.steps.rest,
            ms: Math.max(0, serverMs - (trace.embedMs ?? 0) - (trace.dbMs ?? 0)),
          },
          { label: copy.steps.network, ms: Math.max(0, roundTripMs - serverMs) },
        ];
  const share = (ms: number) => `${Math.min(100, (ms / Math.max(roundTripMs, 1)) * 100)}%`;

  return (
    <div className={styles.performance}>
      <p className={styles.lead}>
        {copy.last(trace.query, t.searchModes[trace.mode].label)}
        <span className={styles.found}>{copy.found(trace.found)}</span>
      </p>

      {steps.length === 0 ? (
        <p className={styles.pending}>{copy.unreported}</p>
      ) : (
        <ol className={styles.steps}>
          {steps.map(({ label, ms }) => (
            <li key={label} className={styles.step}>
              <span>{label}</span>
              {ms === null ? (
                <span className={styles.skipped}>{copy.skipped}</span>
              ) : (
                <>
                  <span className={styles.bar} aria-hidden="true">
                    <span style={{ width: share(ms) }} />
                  </span>
                  <span className={styles.time}>{formatDuration(ms, locale)}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      <p className={styles.total}>
        <span>{copy.total}</span>
        <strong className={styles.time}>{formatDuration(roundTripMs, locale)}</strong>
      </p>

      {steps.length > 0 && trace.embedMs !== null && <p className={styles.hint}>{copy.cached}</p>}
    </div>
  );
};
