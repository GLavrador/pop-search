import { useState, type ReactNode } from 'react';
import { DemoSearch } from './DemoSearch';
import { DemoUpload } from './DemoUpload';
import { useI18n } from '../../i18n/languageContext';
import type { Dictionary } from '../../i18n/en';
import styles from './styles.module.css';

type StepId = keyof Dictionary['tour']['steps'];

const STEP_IDS: StepId[] = ['welcome', 'search', 'ingest', 'manual', 'library', 'account'];

export const DemoTour = () => {
  const [index, setIndex] = useState(0);
  const { t } = useI18n();

  const id = STEP_IDS[index];
  const isLast = index === STEP_IDS.length - 1;
  const step = t.tour.steps[id];

  const bodyFor = (): ReactNode => {
    switch (id) {
      case 'search': {
        const search = t.tour.steps.search;
        return (
          <>
            {search.intro}
            <dl className={styles.definitions}>
              {search.definitions.map(({ term, definition }) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{definition}</dd>
                </div>
              ))}
            </dl>
            {search.outro}
            <DemoSearch />
          </>
        );
      }
      case 'ingest':
        return (
          <>
            {t.tour.steps.ingest.body}
            <DemoUpload />
          </>
        );
      default:
        return t.tour.steps[id].body;
    }
  };

  return (
    <div className={styles.tour}>
      <div className={styles.header}>
        <span className={styles.counter}>
          {t.tour.counter(index + 1, STEP_IDS.length)}
        </span>
        <span className={styles.tabName}>{step.tab}</span>
      </div>

      <div className={styles.track} aria-hidden="true">
        {STEP_IDS.map((stepId, i) => (
          <span
            key={stepId}
            className={`${styles.pip} ${i <= index ? styles.pipDone : ''}`}
          />
        ))}
      </div>

      <div className={`win95-border ${styles.panel}`}>
        <h2 className={styles.title}>{step.title}</h2>
        <div className={styles.body}>{bodyFor()}</div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="win95-btn"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
        >
          {t.tour.back}
        </button>
        <button
          type="button"
          className="win95-btn"
          onClick={() => setIndex(isLast ? 0 : index + 1)}
        >
          {isLast ? t.tour.restart : t.tour.next}
        </button>
      </div>
    </div>
  );
};
