import { useState } from "react";
import { searchVideos } from "../../services/api";
import type { SearchResult } from "../../types";
import { VideoCard } from "../VideoCard";
import styles from "./styles.module.css";

export const SearchSection = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      console.log(`[UI] Searching for: ${query}`);
      const data = await searchVideos({ query });
      setResults(data);
    } catch (err) {
      console.error("[UI] Search error", err);
      alert("Error accessing database index.");
    } finally {
      setLoading(false);
    }
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
            className={`win95-inset ${styles.input}`}
          />
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Searching..." : "Find Now"}
          </button>
        </div>
      </form>

      <div className={styles.resultsList}>
        {loading && <p style={{ textAlign: 'center', padding: 20 }}>Querying database...</p>}
        
        {!loading && hasSearched && results.length === 0 && (
          <p style={{ textAlign: 'center', color: 'red' }}>0 objects found.</p>
        )}

        {results.map((video) => (
          <VideoCard key={video.id} data={video} />
        ))}
      </div>
    </div>
  );
};