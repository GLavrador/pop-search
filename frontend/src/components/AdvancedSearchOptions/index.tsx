import {useState} from 'react';
import { findPresetByThreshold } from '../../constants/searchPresets';
import styles from './styles.module.css';

const THRESHOLD_HELP =
  'Controls how strict the semantic (meaning-based) matching is. Higher values ' +
  'return fewer but more precise results.';

interface AdvancedSearchOptionsProps {
  threshold: number;
  onThresholdChange: (val: number) => void;
  limit: number;
  onLimitChange: (val: number) => void;
  labelClassName?: string;
}

export const AdvancedSearchOptions = ({ threshold, onThresholdChange, limit, onLimitChange, labelClassName }: AdvancedSearchOptionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const activePreset = findPresetByThreshold(threshold);

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
