import { useState, useEffect } from 'react';
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
  const [analyzeScenes, setAnalyzeScenes] = useState(false);
  const [analyzeAudio, setAnalyzeAudio] = useState(false);

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
          <label className={styles.label}>Insert URL:</label>
          <div className={styles.inputRow}>
            <input 
              type="text" 
              className="win95-inset win95-input"
              placeholder="https://..." 
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
                Next
              </button>
            )}

            {!loading && manualMode && (
              <button 
                className={`win95-btn ${styles.runButton}`}
                onClick={onOpenManualForm} 
              >
                Open Form
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
              Manual Input
            </label>
          </div>
        </>
      ) : (
        <div className={`win95-border ${styles.optionsContainer}`}>
          <div className={styles.optionsTitle}>Analysis Options</div>
          <div className={styles.optionsDescription}>
            By default, the AI returns a suggested title and a description for the video. Select additional fields below if needed.
          </div>
          
          <div className={styles.checkboxGroup}>
            {[
              { id: 'scenesCheckbox', label: 'Scenes elements', state: analyzeScenes, setter: setAnalyzeScenes },
              { id: 'audioCheckbox', label: 'Audio transcription', state: analyzeAudio, setter: setAnalyzeAudio }
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
              Back
            </button>
            <button 
              className={`win95-btn ${styles.runButton}`}
              onClick={handleRunAnalysis}
              disabled={loading}
            >
              Run Analysis
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
                Cancel
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