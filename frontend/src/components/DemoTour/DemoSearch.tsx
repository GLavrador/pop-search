import { useState } from 'react';
import { VideoCard } from '../VideoCard';
import { DEMO_QUERY, DEMO_SEARCH_RESULTS } from '../../constants/demoVideo';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

export const DemoSearch = () => {
  const [hasSearched, setHasSearched] = useState(false);
  const { t } = useI18n();

  return (
    <div className={styles.demoBox}>
      <p className={styles.demoLabel}>{t.tour.demoSearch.tryIt(DEMO_QUERY)}</p>

      <div className={styles.searchRow}>
        <input
          type="text"
          readOnly
          value={DEMO_QUERY}
          className="win95-inset win95-input"
          aria-label={t.tour.demoSearch.inputLabel}
        />
        <button type="button" className="win95-btn" onClick={() => setHasSearched(true)}>
          {t.tour.demoSearch.submit}
        </button>
      </div>

      {hasSearched && (
        <>
          <div className={styles.results}>
            {DEMO_SEARCH_RESULTS.map((result) => (
              <VideoCard key={result.id} data={result} />
            ))}
          </div>
          <p className={styles.hint}>{t.tour.demoSearch.badgeHint}</p>
          <p className={styles.hint}>{t.tour.demoSearch.modeHint}</p>
        </>
      )}
    </div>
  );
};
