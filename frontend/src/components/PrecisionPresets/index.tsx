import { PRECISION_PRESETS, findPresetByThreshold } from '../../constants/searchPresets';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

interface PrecisionPresetsProps {
  threshold: number;
  onThresholdChange: (val: number) => void;
  disabled?: boolean;
}

export const PrecisionPresets = ({ threshold, onThresholdChange, disabled }: PrecisionPresetsProps) => {
  const { t } = useI18n();
  const activePreset = findPresetByThreshold(threshold);

  return (
    <div className={styles.container}>
      <span className={styles.label}>{t.presets.caption}</span>

      <div className={styles.buttonGroup} role="group" aria-label={t.presets.groupLabel}>
        {PRECISION_PRESETS.map((preset) => {
          const isActive = activePreset?.id === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              title={t.presets[preset.id].hint}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onThresholdChange(preset.threshold)}
              className={`win95-btn ${styles.presetButton} ${isActive ? 'win95-btn-pressed' : ''}`}
            >
              {t.presets[preset.id].label}
            </button>
          );
        })}
      </div>

      {!activePreset && (
        <span className={styles.custom}>
          {t.presets.custom(Math.round(threshold * 100))}
        </span>
      )}
    </div>
  );
};
