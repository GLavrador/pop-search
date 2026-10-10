import { useState } from 'react';
import { VideoCard } from '../VideoCard';
import { AdvancedSearchOptions } from '../AdvancedSearchOptions';
import { PrecisionPresets } from '../PrecisionPresets';
import { DEMO_QUERY, DEMO_SEARCH_RESULTS } from '../../constants/demoVideo';
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD } from '../../constants/searchPresets';
import { DEFAULT_SEARCH_MODE, findSearchMode, type SearchMode } from '../../constants/searchModes';
import { useI18n } from '../../i18n/languageContext';
import type { SearchStage, Spot } from '../../constants/guide';
import type { SearchResult } from '../../types';
import search from '../SearchSection/styles.module.css';
import styles from './styles.module.css';

interface DemoSearchProps {
  stage: SearchStage;
  spot: Spot;
  onAdvance: () => void;
}

// Same rule the backend applies: the threshold gates the vector branch only,
// and a mode drops the branch it does not use.
const qualifies = (result: SearchResult, mode: SearchMode, threshold: number) => {
  const byMeaning = mode !== 'text' && result.similarity >= threshold;
  const byWords = mode !== 'semantic' && (result.text_rank ?? 0) > 0;
  return byMeaning || byWords;
};

export const DemoSearch = ({ stage, spot, onAdvance }: DemoSearchProps) => {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [mode, setMode] = useState<SearchMode>(DEFAULT_SEARCH_MODE);
  const { t } = useI18n();

  const thresholdApplies = findSearchMode(mode).usesThreshold;
  const results = DEMO_SEARCH_RESULTS.filter((result) => qualifies(result, mode, threshold)).slice(
    0,
    limit,
  );

  const ring = (target: Spot) => (spot === target ? styles.spot : '');

  return (
    <div className={styles.panel}>
      <span className={styles.badge} title={t.guide.demo.badgeTitle}>
        {t.guide.demo.badge}
      </span>

      <div className={`${search.searchForm} ${ring('advanced')}`}>
        <AdvancedSearchOptions
          threshold={threshold}
          onThresholdChange={setThreshold}
          limit={limit}
          onLimitChange={setLimit}
          mode={mode}
          onModeChange={setMode}
          labelClassName={search.label}
        />

        <PrecisionPresets
          threshold={threshold}
          onThresholdChange={setThreshold}
          disabled={!thresholdApplies}
        />

        <div className={`${search.inputRow} ${ring('query')}`}>
          <input
            type="text"
            readOnly
            value={DEMO_QUERY}
            aria-label={t.search.placeholder}
            className="win95-inset win95-input"
          />
          <button type="button" className={`win95-btn ${search.submitButton}`} onClick={onAdvance}>
            {t.search.submit}
          </button>
        </div>
      </div>

      {stage === 'results' && (
        <>
          <hr className={search.separator} />

          <div className={`${styles.results} ${ring('results')}`}>
            {results.length === 0 ? (
              <div className={`win95-border ${styles.empty}`}>
                <strong>{t.search.emptyTitle}</strong>{' '}
                {thresholdApplies
                  ? t.search.emptyWithThreshold(Math.round(threshold * 100))
                  : t.search.emptyLiteral}
              </div>
            ) : (
              results.map((result) => <VideoCard key={result.id} data={result} />)
            )}
          </div>
        </>
      )}
    </div>
  );
};
