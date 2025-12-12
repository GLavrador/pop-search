import { useState, useEffect } from "react";
import { useVideoSearch } from "../../hooks/useVideoSearch";
import { useStatus } from "../../context/StatusContext";
import { VideoCard } from "../VideoCard";
import { TaskProgress } from "../TaskProgress";
import styles from "./styles.module.css";

export const SearchSection = () => {
  const [query, setQuery] = useState("");
  const { search, cancel, results, loading, hasSearched, error } = useVideoSearch();
  const { setStatus } = useStatus();

  useEffect(() => {
    if (error) {
      setStatus(`Search failed: ${error}`, 5000);
    }
  }, [error, setStatus]);

  useEffect(() => {
    if (!loading && hasSearched && !error) {
      const count = results.length;
      if (count === 0) {
        setStatus("Search finished. No objects found.", 5000);
      } else {
        setStatus(`Search finished. Found ${count} object(s).`, 5000);
      }
    }
  }, [loading, hasSearched, error, results.length, setStatus]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setStatus(`Searching database for: "${query}"...`);
    await search(query);
  };

  const handleCancel = () => {
    cancel();
    setStatus("Search cancelled.");
  };

  return (
    <div className={styles.container}>
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <label className={styles.label}>Search Query:</label>
        
        <div className={styles.inputRow}>
          <input
            type="text"
            placeholder="Type to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`win95-inset win95-input`}
            disabled={loading}
          />
          
          {loading ? (
             <TaskProgress onCancel={handleCancel} />
          ) : (
            <button type="submit" className="win95-btn" style={{ minWidth: '140px' }}>
              Find Now
            </button>
          )}
        </div>
      </form>

      <div className={styles.resultsList}>
        {loading && <p style={{ textAlign: 'center', padding: 20 }}>Querying database...</p>}
        
        {!loading && error && (
          <div className="win95-border win95-error">
            <span>⚠️</span>
            <strong>{error}</strong>
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <p style={{ textAlign: 'center', color: 'red' }}>0 objects found.</p>
        )}

        {results.map((video) => (
          <VideoCard key={video.id} data={video} />
        ))}
      </div>
    </div>
  );
};