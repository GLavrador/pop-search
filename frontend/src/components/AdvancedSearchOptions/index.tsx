import {useState} from 'react';
import { findPresetByThreshold } from '../../constants/searchPresets';
import { SEARCH_MODES, findSearchMode, type SearchMode } from '../../constants/searchModes';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

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
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? t.advanced.hide : t.advanced.show}
        </button>
      </div>

      {isOpen && (
        <div className={`win95-border ${styles.panel}`}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>{t.advanced.modeLegend}</legend>

            <div className={styles.groupHeader}>
              <span className={styles.modeHint}>{activeModeText.hint}</span>
              <span className={styles.help} title={t.advanced.modeHelp}>
                i
              </span>
            </div>

            <div className={styles.modeButtons} role="group" aria-label={t.advanced.modeGroupLabel}>
              {SEARCH_MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  title={t.searchModes[option.id].hint}
                  aria-pressed={option.id === mode}
                  onClick={() => onModeChange(option.id)}
                  className={`win95-btn ${styles.modeButton} ${option.id === mode ? 'win95-btn-pressed' : ''}`}
                >
                  {t.searchModes[option.id].label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group} disabled={!thresholdApplies}>
            <legend className={styles.legend}>{t.advanced.thresholdLegend}</legend>

            <div className={styles.groupHeader}>
              <span className={styles.value}>
                {Math.round(threshold * 100)}%
                <span className={styles.presetName}>
                  {activePreset ? ` (${t.presets[activePreset.id].label})` : t.advanced.custom}
                </span>
              </span>
              <span className={styles.help} title={t.advanced.thresholdHelp}>
                i
              </span>
            </div>

            <input
              type="range"
              min="0.1"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
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

          <fieldset className={styles.group}>
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

          <fieldset className={styles.group}>
            <legend className={styles.legend}>{t.advanced.resultsLegend}</legend>

            <div className={styles.row}>
              <label htmlFor="max-results" className={`${labelClassName ?? ''} ${styles.rowLabel}`}>
                {t.advanced.maxResults}
              </label>
              <select
                id="max-results"
                className={`win95-inset win95-input ${styles.select}`}
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
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
