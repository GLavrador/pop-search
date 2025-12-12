import { useState } from 'react';
import { useVideoAnalysis } from '../../hooks/useVideoAnalysis';
import { saveVideo } from '../../services/api';
import type { VideoMetadata } from '../../types';
import { ProgressBar } from '../ProgressBar';
import { ReviewForm } from '../ReviewForm';
import styles from './styles.module.css';

export const IngestSection = () => {
  const [url, setUrl] = useState('');
  const { analyze, cancel, reset, loading, data, error } = useVideoAnalysis();

  const handleAnalyze = () => {
    analyze(url);
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        console.log("[Ingest] Saving data...", finalData);
        await saveVideo(finalData);
        alert("Video saved successfully! 🎉");
        reset(); 
        setUrl('');
      } catch (err) {
        console.error("[Ingest] Save failed", err);
        alert("Failed to save video. Check console for details.");
      }
  };

  if (data) {
    return (
      <div className={styles.reviewContainer}>
        <ReviewForm 
          initialData={data} 
          onSave={handleSave} 
          onCancel={reset} 
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label className={styles.label}>Insert URL:</label>
      
      <div className={styles.inputRow}>
        <input 
          type="text" 
          className={`win95-inset ${styles.urlInput}`}
          placeholder="https://..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        
        {loading ? (
          <div className={styles.loadingGroup}>
            <ProgressBar />
            <button 
               className={`win95-border ${styles.cancelButton}`}
               onClick={cancel}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            className={`win95-border ${styles.actionButton}`}
            onClick={handleAnalyze} 
          >
            Run Analysis
          </button>
        )}
      </div>

      {error && (
        <div className={`win95-border ${styles.errorBox}`}>
          <span>⚠️</span>
          <strong>{error}</strong>
        </div>
      )}
    </div>
  );
};