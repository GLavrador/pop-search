import { useState, type ReactNode } from 'react';
import { RESULT_LIMITS } from '../../constants/searchPresets';
import { SEARCH_MODES, findSearchMode, type SearchMode } from '../../constants/searchModes';
import { useI18n } from '../../i18n/languageContext';
import { helpAt, useRobot } from '../../context/robotContext';
import styles from './styles.module.css';

const MODE_PRESSES = {
  hybrid: 'modeHybrid',
  semantic: 'modeSemantic',
  text: 'modeText',
} as const;

interface AdvancedSearchOptionsProps {
  threshold: number;
  onThresholdChange: (val: number) => void;
  limit: number;
  onLimitChange: (val: number) => void;
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  /** The quick options, which share the row of the button that opens the fine ones. */
  children?: ReactNode;
}

export const AdvancedSearchOptions = ({
  threshold,
  onThresholdChange,
  limit,
  onLimitChange,
  mode,
  onModeChange,
  children,
}: AdvancedSearchOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();
  const robot = useRobot();
  const activeMode = findSearchMode(mode);
  const activeModeText = t.searchModes[activeMode.id];
  const thresholdApplies = activeMode.usesThreshold;
  const percent = Math.round(threshold * 100);

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.quick}>{children}</div>
        <button
          type="button"
          className={`win95-btn ${styles.toggleButton}`}
          aria-expanded={isOpen}
          onClick={() => {
            robot.notify({ kind: 'pressed', what: isOpen ? 'advancedClose' : 'advancedOpen' });
            setIsOpen(!isOpen);
          }}
          {...helpAt(isOpen ? 'search.advancedOpen' : 'search.advanced')}
        >
          {isOpen ? t.advanced.hide : t.advanced.show}
        </button>
      </div>

      {isOpen && (
        <div className={styles.panel}>
          <fieldset className={styles.group} {...helpAt('search.mode')}>
            <legend className={styles.legend}>
              {t.advanced.modeLegend}
              <button
                type="button"
                className={styles.help}
                aria-label={t.robot.ask(t.advanced.modeLegend)}
                onClick={(event) => robot.explain('search.mode', event.currentTarget)}
              >
                i
              </button>
            </legend>

            <div className={styles.field}>
              <div className={styles.choices} role="group" aria-label={t.advanced.modeGroupLabel}>
                {SEARCH_MODES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    title={t.searchModes[option.id].hint}
                    aria-pressed={option.id === mode}
                    onClick={() => {
                      if (option.id !== mode) {
                        robot.notify({ kind: 'pressed', what: MODE_PRESSES[option.id] });
                      }
                      onModeChange(option.id);
                    }}
                    className={`win95-btn ${styles.choice} ${option.id === mode ? 'win95-btn-pressed' : ''}`}
                  >
                    {t.searchModes[option.id].label}
                  </button>
                ))}
              </div>
              <p className={styles.note}>{activeModeText.hint}</p>
            </div>
          </fieldset>

          <fieldset
            className={styles.group}
            disabled={!thresholdApplies}
            {...helpAt('search.threshold')}
          >
            {/* The legend is the one part of a disabled fieldset that stays usable. */}
            <legend className={styles.legend}>
              {t.advanced.thresholdLegend}
              <button
                type="button"
                className={styles.help}
                aria-label={t.robot.ask(t.advanced.thresholdLegend)}
                onClick={(event) => robot.explain('search.threshold', event.currentTarget)}
              >
                i
              </button>
            </legend>

            <div className={styles.field}>
              <div className={styles.gauge}>
                <span className={styles.end}>{t.advanced.scaleLow}</span>
                <input
                  type="range"
                  min="0.1"
                  max="0.99"
                  step="0.01"
                  value={threshold}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    if (next !== threshold) {
                      robot.notify({ kind: 'pressed', what: next > threshold ? 'stricter' : 'looser' });
                    }
                    onThresholdChange(next);
                  }}
                  className={styles.slider}
                  aria-label={t.advanced.thresholdLabel}
                  aria-valuetext={`${percent}%`}
                />
                <span className={`${styles.end} ${styles.far}`}>{t.advanced.scaleHigh}</span>
                <span className={styles.readout}>{percent}%</span>
              </div>

              {!thresholdApplies && (
                <p className={styles.note}>{t.advanced.thresholdDisabled(activeModeText.label)}</p>
              )}
            </div>
          </fieldset>

          <fieldset className={styles.group} {...helpAt('search.limit')}>
            <legend className={styles.legend}>{t.advanced.resultsLegend}</legend>

            <div className={styles.field}>
              <div
                className={`${styles.choices} ${styles.short}`}
                role="group"
                aria-label={t.advanced.maxResults}
              >
                {RESULT_LIMITS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === limit}
                    onClick={() => {
                      if (option !== limit) robot.notify({ kind: 'pressed', what: 'limit' });
                      onLimitChange(option);
                    }}
                    className={`win95-btn ${styles.choice} ${option === limit ? 'win95-btn-pressed' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.group} {...helpAt('search.syntax')}>
            <legend className={styles.legend}>{t.advanced.syntaxLegend}</legend>

            <div className={styles.field}>
              {activeMode.supportsOperators && (
                <dl className={styles.syntaxList}>
                  {t.advanced.syntax.map(({ example, meaning }) => (
                    <div key={example} className={styles.syntaxRow}>
                      <dt className={styles.syntaxExample}>{example}</dt>
                      <dd className={styles.syntaxMeaning}>{meaning}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <p className={activeMode.supportsOperators ? styles.note : styles.unavailable}>
                {activeModeText.operatorScope}
              </p>
            </div>
          </fieldset>
        </div>
      )}
    </>
  );
};
