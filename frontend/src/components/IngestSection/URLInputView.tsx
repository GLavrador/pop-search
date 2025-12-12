import { TaskProgress } from '../TaskProgress';
import styles from './styles.module.css';

interface URLInputViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}

export const URLInputView = ({ 
  url, 
  onUrlChange, 
  onAnalyze, 
  onCancel, 
  loading, 
  error 
}: URLInputViewProps) => {
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
        
        {!loading && (
          <button 
            className="win95-btn"
            style={{ minWidth: '140px' }}
            onClick={onAnalyze} 
          >
            Run Analysis
          </button>
        )}
      </div>

      {loading && (
        <div className={styles.progressRow}>
          <TaskProgress onCancel={onCancel} />
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