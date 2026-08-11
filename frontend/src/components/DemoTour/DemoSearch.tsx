import { useState } from 'react';
import { VideoCard } from '../VideoCard';
import { DEMO_QUERY, DEMO_SEARCH_RESULTS } from '../../constants/demoVideo';
import styles from './styles.module.css';

export const DemoSearch = () => {
  const [hasSearched, setHasSearched] = useState(false);

  return (
    <div className={styles.demoBox}>
      <p className={styles.demoLabel}>Try it: search for “{DEMO_QUERY}”</p>

      <div className={styles.searchRow}>
        <input
          type="text"
          readOnly
          value={DEMO_QUERY}
          className="win95-inset win95-input"
          aria-label="Example search"
        />
        <button type="button" className="win95-btn" onClick={() => setHasSearched(true)}>
          Find Now
        </button>
      </div>

      {hasSearched && (
        <>
          <div className={styles.results}>
            {DEMO_SEARCH_RESULTS.map((result) => (
              <VideoCard key={result.id} data={result} />
            ))}
          </div>
          <p className={styles.hint}>
            Look at the badge on each result. The first contains the word and is
            about a cat, so it matched both ways. The second never says “gato” —
            a spinning giraffe came up because the search understood the idea.
            The third matched only on the word.
          </p>
          <p className={styles.hint}>
            In <strong>Exact</strong> mode the giraffe would disappear. In{' '}
            <strong>Semantic</strong> mode the third one would.
          </p>
        </>
      )}
    </div>
  );
};
