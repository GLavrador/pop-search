import { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { ProgressBar } from '../ProgressBar';

interface URLInputViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
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

  return (
    <div className={styles.container}>
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
            onClick={onAnalyze} 
          >
            Run Analysis
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