import { useState, useEffect } from "react";
import { useVideoSearchQuery } from "../../hooks/useVideoSearchQuery";
import { useStatus } from "../../context/StatusContext";
import { VideoCard } from "../VideoCard";
import { TaskProgress } from "../TaskProgress";
import { AdvancedSearchOptions } from "../AdvancedSearchOptions";
import { PrecisionPresets } from "../PrecisionPresets";
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD } from "../../constants/searchPresets";
import styles from "./styles.module.css";

export const SearchSection = () => {
  const [query, setQuery] = useState("");
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const { search, results, isLoading, hasSearched, error } = useVideoSearchQuery();
  const { setStatus } = useStatus();

  useEffect(() => {
    if (error) {
      setStatus(`Search failed: ${error}`, 5000);
    }
  }, [error, setStatus]);

  useEffect(() => {
    if (hasSearched && query.trim()) {
      const handler = setTimeout(() => {
        const isNewSearch = search(query, threshold, limit);
        if (isNewSearch) {
          setStatus(`Searching database for: "${query}"...`);
        }
      }, 1000);
      return () => clearTimeout(handler);
    }
  }, [threshold, limit]);

  useEffect(() => {
    if (!isLoading && hasSearched && !error) {
      const count = results.length;
      if (count === 0) {
        setStatus("Search finished. No objects found.", 5000);
      } else {
        setStatus(`Search finished. Found ${count} object(s).`, 5000);
      }
    }
  }, [isLoading, hasSearched, error, results.length, setStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const isNewSearch = search(query, threshold, limit);
    if (isNewSearch) {
      setStatus(`Searching database for: "${query}"...`);
    } else {
      const count = results.length;
      setStatus(count === 0 ? "Search finished. No objects found." : `Search finished. Found ${count} object(s).`, 3000);
    }
  };

  const handleCancel = () => {
    setStatus("Search cancelled.", 3000);
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
          labelClassName={styles.label}
        />

        <PrecisionPresets
          threshold={threshold}
          onThresholdChange={setThreshold}
          disabled={isLoading}
        />

        <div className={styles.inputRow}>
          <input
            type="text"
            placeholder="Type to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`win95-inset win95-input`}
            disabled={isLoading}
          />
          
          {!isLoading && (
            <button type="submit" className={`win95-btn ${styles.submitButton}`}>
              Find Now
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
        {isLoading && <p className={styles.loadingText}>Querying database...</p>}
        
        {!isLoading && error && (
          <div className="win95-border win95-error">
            <span>⚠️</span>
            <strong>{error}</strong>
          </div>
        )}

        {!isLoading && !error && hasSearched && results.length === 0 && (
          <div className="win95-border" style={{ padding: '4px 8px', backgroundColor: '#ffffe1', marginTop: '5px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95em' }}>
              <strong>0 found.</strong> No semantic match above{' '}
              <strong>{Math.round(threshold * 100)}%</strong> and no exact term found.
              Try the <strong>Broad</strong> precision or different keywords.
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