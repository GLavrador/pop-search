import {useState} from 'react';
import { findPresetByThreshold } from '../../constants/searchPresets';
import { SEARCH_MODES, findSearchMode, type SearchMode } from '../../constants/searchModes';
import styles from './styles.module.css';

const THRESHOLD_HELP =
  'Controls how strict the semantic (meaning-based) matching is. Higher values ' +
  'return fewer but more precise results.';

const MODE_HELP =
  'Chooses how a video qualifies as a match: by meaning, by the literal words ' +
  'you typed, or both.';

/*
 * These operators are already supported by websearch_to_tsquery in the RPC;
 * nothing here is new behaviour. They were simply undiscoverable. The first row
 * documents the default, which is the non-obvious one: extra words narrow the
 * search rather than widening it.
 */
const SEARCH_SYNTAX = [
  { example: 'baleia bebê', meaning: 'Both words required. Every extra word narrows the search.' },
  { example: '"baleia assassina"', meaning: 'That exact phrase, in that order.' },
  { example: 'baleia -orca', meaning: 'Contains the first, excludes the second.' },
  { example: 'baleia or golfinho', meaning: 'Either word is enough.' },
] as const;

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
  const activePreset = findPresetByThreshold(threshold);
  const activeMode = findSearchMode(mode);
  const thresholdApplies = activeMode.usesThreshold;

  return (
    <>
      <div className={styles.header}>
        <label className={`${labelClassName ?? ''} ${styles.headerLabel}`}>Search Query:</label>
        <button
          type="button"
          className={`win95-btn ${styles.toggleButton}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▲ Hide Advanced' : '▼ Advanced'}
        </button>
      </div>

      {isOpen && (
        <div className={`win95-border ${styles.panel}`}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>Search Mode</legend>

            <div className={styles.groupHeader}>
              <span className={styles.modeHint}>{activeMode.hint}</span>
              <span className={styles.help} title={MODE_HELP}>
                i
              </span>
            </div>

            <div className={styles.modeButtons} role="group" aria-label="Search mode">
              {SEARCH_MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  title={option.hint}
                  aria-pressed={option.id === mode}
                  onClick={() => onModeChange(option.id)}
                  className={`win95-btn ${styles.modeButton} ${option.id === mode ? 'win95-btn-pressed' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.group} disabled={!thresholdApplies}>
            <legend className={styles.legend}>Match Threshold</legend>

            <div className={styles.groupHeader}>
              <span className={styles.value}>
                {Math.round(threshold * 100)}%
                <span className={styles.presetName}>
                  {activePreset ? ` (${activePreset.label})` : ' (Custom)'}
                </span>
              </span>
              <span className={styles.help} title={THRESHOLD_HELP}>
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
              aria-label="Match threshold"
            />

            <div className={styles.scale}>
              <span>More results</span>
              <span>Fewer, stricter</span>
            </div>

            {!thresholdApplies && (
              <p className={styles.disabledNote}>
                Not used in <strong>{activeMode.label}</strong> mode: matching is
                literal, so nothing is scored by similarity.
              </p>
            )}
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Search Syntax</legend>

            <p
              className={activeMode.supportsOperators ? styles.syntaxScope : styles.syntaxUnavailable}
            >
              {activeMode.operatorScope}
            </p>

            {activeMode.supportsOperators && (
              <dl className={styles.syntaxList}>
                {SEARCH_SYNTAX.map(({ example, meaning }) => (
                  <div key={example} className={styles.syntaxRow}>
                    <dt className={styles.syntaxExample}>{example}</dt>
                    <dd className={styles.syntaxMeaning}>{meaning}</dd>
                  </div>
                ))}
              </dl>
            )}
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Results</legend>

            <div className={styles.row}>
              <label htmlFor="max-results" className={`${labelClassName ?? ''} ${styles.rowLabel}`}>
                Max results per search
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
