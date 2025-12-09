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
      alert("Error performing search.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.searchBox} onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Ask something"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "..." : "Search"}
        </button>
      </form>

      <div className="results-list">
        {loading && <p style={{ textAlign: 'center', color: '#666' }}>Searching semantic vector space...</p>}
        
        {!loading && hasSearched && results.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>No relevant videos found.</p>
        )}

        {results.map((video) => (
          <VideoCard key={video.id} data={video} />
        ))}
      </div>
    </div>
  );
};