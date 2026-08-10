import { PRECISION_PRESETS, findPresetByThreshold } from '../../constants/searchPresets';
import styles from './styles.module.css';

interface PrecisionPresetsProps {
  threshold: number;
  onThresholdChange: (val: number) => void;
  disabled?: boolean;
}

export const PrecisionPresets = ({ threshold, onThresholdChange, disabled }: PrecisionPresetsProps) => {
  const activePreset = findPresetByThreshold(threshold);

  return (
    <div className={styles.container}>
      <span className={styles.label}>Precision:</span>

      <div className={styles.buttonGroup} role="group" aria-label="Search precision">
        {PRECISION_PRESETS.map((preset) => {
          const isActive = activePreset?.id === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              title={preset.hint}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onThresholdChange(preset.threshold)}
              className={`win95-btn ${styles.presetButton} ${isActive ? 'win95-btn-pressed' : ''}`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {!activePreset && (
        <span className={styles.custom}>
          Custom ({Math.round(threshold * 100)}%)
        </span>
      )}
    </div>
  );
};
