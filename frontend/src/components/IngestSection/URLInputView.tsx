import { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';
import { ProgressBar } from '../ProgressBar';

interface URLInputViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyze: (options: { analyzeScenes: boolean; analyzeAudio: boolean }) => void;
  onOpenManualForm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  manualMode: boolean;
  onManualModeChange: (value: boolean) => void;
}

export const URLInputView = ({
  url,
  onUrlChange,
  onAnalyze,
  onOpenManualForm,
  onCancel,
  loading,
  error,
  manualMode,
  onManualModeChange
}: URLInputViewProps) => {
  const [showProgress, setShowProgress] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [analyzeScenes, setAnalyzeScenes] = useState(true);
  const [analyzeAudio, setAnalyzeAudio] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (loading) {
      setShowProgress(true);
    } else {
      const timer = setTimeout(() => {
        setShowProgress(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleNext = () => {
    if (url.trim()) {
      setStep(2);
    }
  };

  const handleRunAnalysis = () => {
    onAnalyze({ analyzeScenes, analyzeAudio });
  };

  return (
    <div className={styles.container}>
      {step === 1 ? (
        <>
          <label className={styles.label}>{t.ingest.urlLabel}</label>
          <div className={styles.inputRow}>
            <input
              type="text"
              className="win95-inset win95-input"
              placeholder={t.ingest.urlPlaceholder}
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              disabled={loading}
            />

            {!loading && !manualMode && (
              <button
                className={`win95-btn ${styles.runButton}`}
                onClick={handleNext}
                disabled={!url.trim()}
              >
                {t.ingest.next}
              </button>
            )}

            {!loading && manualMode && (
              <button
                className={`win95-btn ${styles.runButton}`}
                onClick={onOpenManualForm}
              >
                {t.ingest.openForm}
              </button>
            )}
          </div>

          <div className={styles.manualToggle}>
            <input
              type="checkbox"
              id="manualModeCheckbox"
              className={styles.manualCheckbox}
              checked={manualMode}
              onChange={(e) => onManualModeChange(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="manualModeCheckbox" className={styles.manualLabel}>
              {t.ingest.manualInput}
            </label>
          </div>
        </>
      ) : (
        <div className={`win95-border ${styles.optionsContainer}`}>
          <div className={styles.optionsTitle}>{t.ingest.optionsTitle}</div>
          <div className={styles.optionsDescription}>
            {t.ingest.optionsDescription}
          </div>

          <div className={styles.checkboxGroup}>
            {[
              { id: 'scenesCheckbox', label: t.ingest.scenes, state: analyzeScenes, setter: setAnalyzeScenes },
              { id: 'audioCheckbox', label: t.ingest.audio, state: analyzeAudio, setter: setAnalyzeAudio }
            ].map(({ id, label, state, setter }) => (
              <div key={id} className={`${styles.manualToggle} ${styles.checkboxOption}`}>
                <input
                  type="checkbox"
                  id={id}
                  className={styles.manualCheckbox}
                  checked={state}
                  onChange={(e) => setter(e.target.checked)}
                  disabled={loading}
                />
                <label htmlFor={id} className={`${styles.manualLabel} ${styles.checkboxOptionLabel}`}>
                  {label}
                </label>
              </div>
            ))}
          </div>

          <div className={styles.runAnalysisActions}>
            <button
              className="win95-btn"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              {t.common.back}
            </button>
            <button
              className={`win95-btn ${styles.runButton}`}
              onClick={handleRunAnalysis}
              disabled={loading}
            >
              {t.ingest.runAnalysis}
            </button>
          </div>
        </div>
      )}

      {showProgress && (
        <div className={styles.progressRow}>
          <div className={styles.progressContainer}>
            <ProgressBar loading={loading} />

            {loading && (
              <button
                type="button"
                onClick={onCancel}
                className={`win95-btn ${styles.cancelButton}`}
              >
                {t.common.cancel}
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="win95-border win95-error">
          <span>⚠️</span>
          <strong>{error}</strong>
        </div>
      )}
    </div>
  );
};
