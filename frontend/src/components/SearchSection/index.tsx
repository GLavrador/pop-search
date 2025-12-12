import { useState } from "react";
import { useVideoSearch } from "../../hooks/useVideoSearch";
import { VideoCard } from "../VideoCard";
import { ProgressBar } from "../ProgressBar";
import styles from "./styles.module.css";

export const SearchSection = () => {
  const [query, setQuery] = useState("");
  const { search, cancel, results, loading, hasSearched } = useVideoSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
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
             <div className={styles.loadingGroup}>
               <ProgressBar />
               <button 
                 type="button" 
                 onClick={cancel}
                 className="win95-btn"
                 style={{ minWidth: 'auto' }}
               >
                 Cancel
               </button>
             </div>
          ) : (
            <button type="submit" className="win95-btn" style={{ minWidth: '140px' }}>
              Find Now
            </button>
          )}
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