import { useState, useEffect } from "react";
import { useVideoSearchQuery } from "../../hooks/useVideoSearchQuery";
import { useStatus } from "../../context/StatusContext";
import { VideoCard } from "../VideoCard";
import { TaskProgress } from "../TaskProgress";
import { AdvancedSearchOptions } from "../AdvancedSearchOptions";
import { PrecisionPresets } from "../PrecisionPresets";
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD } from "../../constants/searchPresets";
import { DEFAULT_SEARCH_MODE, findSearchMode, type SearchMode } from "../../constants/searchModes";
import { useI18n } from "../../i18n/languageContext";
import styles from "./styles.module.css";

export const SearchSection = () => {
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [mode, setMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE);
  const thresholdApplies = findSearchMode(mode).usesThreshold;
  const { search, results, isLoading, hasSearched, error } = useVideoSearchQuery();
  const { setStatus } = useStatus();
  const { t } = useI18n();

  useEffect(() => {
    if (error) {
      setStatus(t.search.status.failed(error), 5000);
    }
  }, [error, setStatus, t.search.status]);

  useEffect(() => {
    if (hasSearched && query.trim()) {
      const handler = setTimeout(() => {
        const isNewSearch = search(query, threshold, limit, mode);
        if (isNewSearch) {
          setStatus(t.search.status.running(query));
        }
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [threshold, limit, mode]);

  useEffect(() => {
    if (!isLoading && hasSearched && !error) {
      const count = results.length;
      if (count === 0) {
        setStatus(t.search.status.none, 5000);
      } else {
        setStatus(t.search.status.found(count), 5000);
      }
    }
  }, [isLoading, hasSearched, error, results.length, setStatus, t.search.status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const isNewSearch = search(query, threshold, limit, mode);
    if (isNewSearch) {
      setStatus(t.search.status.running(query));
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
        <AdvancedSearchOptions
          threshold={threshold}
          onThresholdChange={setThreshold}
          limit={limit}
          onLimitChange={setLimit}
          mode={mode}
          onModeChange={setMode}
          labelClassName={styles.label}
        />

        <PrecisionPresets
          threshold={threshold}
          onThresholdChange={setThreshold}
          disabled={isLoading || !thresholdApplies}
        />

        <div className={styles.inputRow}>
          <input
            type="text"
            placeholder={t.search.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`win95-inset win95-input`}
            disabled={isLoading}
          />

          {!isLoading && (
            <button type="submit" className={`win95-btn ${styles.submitButton}`}>
              {t.search.submit}
            </button>
          )}
        </div>

        {isLoading && (
            <div className={styles.progressRow}>
              <TaskProgress onCancel={handleCancel} />
            </div>
        )}
      </form>

      {shouldShowSeparator && <hr className={styles.separator} />}

      <div className={styles.resultsList}>
        {isLoading && <p className={styles.loadingText}>{t.search.loading}</p>}

        {!isLoading && error && (
          <div className="win95-border win95-error">
            <span>⚠️</span>
            <strong>{error}</strong>
          </div>
        )}

        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="win95-border" style={{ padding: '4px 8px', backgroundColor: '#ffffe1', marginTop: '5px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95em' }}>
              <strong>{t.search.emptyTitle}</strong>{' '}
              {thresholdApplies
                ? t.search.emptyWithThreshold(Math.round(threshold * 100))
                : t.search.emptyLiteral}
            </span>
          </div>
        )}

        {results.map((video) => (
          <VideoCard key={video.id} data={video} />
        ))}
      </div>
    </div>
  );
};
