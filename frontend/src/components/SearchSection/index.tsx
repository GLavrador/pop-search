import { useState, useEffect, useEffectEvent, useRef } from "react";
import { useVideoSearchQuery } from "../../hooks/useVideoSearchQuery";
import { useStatus } from "../../context/status";
import { ResultList } from "../ResultList";
import { TaskProgress } from "../TaskProgress";
import { AdvancedSearchOptions } from "../AdvancedSearchOptions";
import { PrecisionPresets } from "../PrecisionPresets";
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD, PRECISION_PRESETS } from "../../constants/searchPresets";
import { DEFAULT_SEARCH_MODE, findSearchMode, type SearchMode } from "../../constants/searchModes";
import { useI18n } from "../../i18n/languageContext";
import { helpAt, useRobot } from "../../context/robotContext";
import { useSearchFacts } from "../../hooks/useSearchFacts";
import { useFatal } from "../../hooks/useFatal";

const BROADEST = Math.min(...PRECISION_PRESETS.map((preset) => preset.threshold));
// The path that took Windows 98 down for real. It does the same here, on purpose.
const FATAL_PATH = /^c:\\con\\con$/i;
import styles from "./styles.module.css";
import warningIcon from '../../assets/win98/msg_warning-0.png';

export const SearchSection = () => {
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [mode, setMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE);
  const thresholdApplies = findSearchMode(mode).usesThreshold;
  const { search, results, asked, isLoading, hasSearched, error, settledAt } = useVideoSearchQuery();
  const { setStatus } = useStatus();
  const { t } = useI18n();
  const robot = useRobot();
  const crash = useFatal();
  const toldAt = useRef(0);

  useSearchFacts('search', mode, threshold);

  useEffect(() => {
    if (error) {
      setStatus(t.search.status.failed(error), 5000);
    }
  }, [error, setStatus, t.search.status]);

  const repeatSearch = useEffectEvent(() => {
    if (hasSearched && query.trim()) {
      const handler = setTimeout(() => {
        const isNewSearch = search(query, threshold, limit, mode);
        if (isNewSearch) {
          setStatus(t.search.status.running(query));
          robot.notify({ kind: 'searchStarted' });
        }
      }, 1000);
      return () => clearTimeout(handler);
    }
  });

  useEffect(() => repeatSearch(), [threshold, limit, mode]);

  // Once per search that comes back, however often the settings around it
  // change, and not when a video is edited or deleted under the list.
  useEffect(() => {
    if (isLoading || !hasSearched || settledAt === toldAt.current) return;
    toldAt.current = settledAt;

    if (error) {
      robot.notify({ kind: 'searchFailed' });
      return;
    }

    const count = results.length;
    setStatus(count === 0 ? t.search.status.none : t.search.status.found(count), 5000);

    if (count > 0) {
      robot.notify({ kind: 'searchFound', count });
      return;
    }

    const again = (nextThreshold: number, nextMode: SearchMode) => () => {
      setThreshold(nextThreshold);
      setMode(nextMode);
      if (search(query, nextThreshold, limit, nextMode)) {
        setStatus(t.search.status.running(query));
      }
    };
    robot.notify({
      kind: 'searchEmpty',
      widen: thresholdApplies && threshold > BROADEST ? again(BROADEST, mode) : undefined,
      loosen: thresholdApplies ? undefined : again(threshold, DEFAULT_SEARCH_MODE),
    });
  }, [
    isLoading,
    hasSearched,
    settledAt,
    error,
    results.length,
    robot,
    search,
    query,
    threshold,
    limit,
    mode,
    thresholdApplies,
    setStatus,
    t.search.status,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (FATAL_PATH.test(query.trim())) {
      crash(new Error(t.search.conCon));
      return;
    }

    const isNewSearch = search(query, threshold, limit, mode);
    if (isNewSearch) {
      setStatus(t.search.status.running(query));
      robot.notify({ kind: 'searchStarted' });
    } else {
      const count = results.length;
      setStatus(count === 0 ? t.search.status.none : t.search.status.found(count), 3000);
    }
  };

  const handleCancel = () => {
    setStatus(t.search.status.cancelled, 3000);
  };

  const shouldShowSeparator = isLoading || hasSearched;

  return (
    <div className={styles.container}>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <div className={styles.query}>
          <label htmlFor="search-query" className={styles.label}>
            {t.advanced.queryLabel}
          </label>

          <div className={styles.inputRow} {...helpAt('search.query')}>
            <input
              id="search-query"
              type="text"
              placeholder={t.search.placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                robot.notify({ kind: 'typing', text: e.target.value, mode, threshold });
              }}
              className={`win95-inset win95-input`}
              disabled={isLoading}
            />

            {!isLoading && (
              <button type="submit" className={`win95-btn ${styles.submitButton}`}>
                {t.search.submit}
              </button>
            )}
          </div>
        </div>

        {isLoading && (
            <div className={styles.progressRow}>
              <TaskProgress onCancel={handleCancel} />
            </div>
        )}

        <AdvancedSearchOptions
          threshold={threshold}
          onThresholdChange={setThreshold}
          limit={limit}
          onLimitChange={setLimit}
          mode={mode}
          onModeChange={setMode}
        >
          <PrecisionPresets
            threshold={threshold}
            onThresholdChange={setThreshold}
            disabled={isLoading || !thresholdApplies}
          />
        </AdvancedSearchOptions>
      </form>

      {shouldShowSeparator && <hr className={styles.separator} />}

      <div className={styles.resultsList}>
        {isLoading && <p className={styles.loadingText}>{t.search.loading}</p>}

        {!isLoading && error && (
          <div className="win95-border win95-error">
            <img src={warningIcon} alt="" className="win98-warning" />
            <strong>{error}</strong>
          </div>
        )}

        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="win95-border" style={{ padding: '4px 8px', backgroundColor: '#ffffe1', marginTop: '5px', display: 'flex', alignItems: 'center' }} {...helpAt('search.empty')}>
            <span style={{ fontSize: '0.95em' }}>
              <strong>{t.search.emptyTitle}</strong>{' '}
              {thresholdApplies
                ? t.search.emptyWithThreshold(Math.round(threshold * 100))
                : t.search.emptyLiteral}
            </span>
          </div>
        )}

        <ResultList results={results} asked={asked ?? undefined} />
      </div>
    </div>
  );
};
