import {useState} from 'react';
import { findPresetByThreshold } from '../../constants/searchPresets';
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
  labelClassName?: string;
}

export const AdvancedSearchOptions = ({ threshold, onThresholdChange, limit, onLimitChange, mode, onModeChange, labelClassName }: AdvancedSearchOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();
  const robot = useRobot();
  const activePreset = findPresetByThreshold(threshold);
  const activeMode = findSearchMode(mode);
  const activeModeText = t.searchModes[activeMode.id];
  const thresholdApplies = activeMode.usesThreshold;

  return (
    <>
      <div className={styles.header}>
        <label className={`${labelClassName ?? ''} ${styles.headerLabel}`}>{t.advanced.queryLabel}</label>
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

            <span className={styles.modeHint}>{activeModeText.hint}</span>

            <div className={styles.modeButtons} role="group" aria-label={t.advanced.modeGroupLabel}>
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
                  className={`win95-btn ${styles.modeButton} ${option.id === mode ? 'win95-btn-pressed' : ''}`}
                >
                  {t.searchModes[option.id].label}
                </button>
              ))}
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

            <span className={styles.value}>
              {Math.round(threshold * 100)}%
              <span className={styles.presetName}>
                {activePreset ? ` (${t.presets[activePreset.id].label})` : t.advanced.custom}
              </span>
            </span>

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
            />

            <div className={styles.scale}>
              <span>{t.advanced.scaleLow}</span>
              <span>{t.advanced.scaleHigh}</span>
            </div>

            {!thresholdApplies && (
              <p className={styles.disabledNote}>
                {t.advanced.thresholdDisabled(activeModeText.label)}
              </p>
            )}
          </fieldset>

          <fieldset className={styles.group} {...helpAt('search.syntax')}>
            <legend className={styles.legend}>{t.advanced.syntaxLegend}</legend>

            <p
              className={activeMode.supportsOperators ? styles.syntaxScope : styles.syntaxUnavailable}
            >
              {activeModeText.operatorScope}
            </p>

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
          </fieldset>

          <fieldset className={styles.group} {...helpAt('search.limit')}>
            <legend className={styles.legend}>{t.advanced.resultsLegend}</legend>

            <div className={styles.row}>
              <label htmlFor="max-results" className={`${labelClassName ?? ''} ${styles.rowLabel}`}>
                {t.advanced.maxResults}
              </label>
              <select
                id="max-results"
                className={`win95-inset win95-input ${styles.select}`}
                value={limit}
                onChange={(e) => {
                  robot.notify({ kind: 'pressed', what: 'limit' });
                  onLimitChange(Number(e.target.value));
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </fieldset>
        </div>
      )}
    </>
  );
};
