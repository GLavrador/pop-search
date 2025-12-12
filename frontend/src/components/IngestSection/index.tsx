import { useState } from 'react';
import { useVideoAnalysis } from '../../hooks/useVideoAnalysis';
import { useStatus } from '../../context/StatusContext';
import { saveVideo } from '../../services/api';
import type { VideoMetadata } from '../../types';
import { TaskProgress } from '../TaskProgress';
import { ReviewForm } from '../ReviewForm';
import styles from './styles.module.css';

export const IngestSection = () => {
  const [url, setUrl] = useState('');
  const { analyze, cancel, reset, loading, data, error } = useVideoAnalysis();
  const { setStatus } = useStatus();

  const handleAnalyze = async () => {
    if (!url) {
      setStatus('Error: Please enter a URL first.', 3000);
      return;
    }
    setStatus('Analyzing video... Please wait.');
    
    await analyze(url);
    
    setStatus('Analysis finished. Please review data.');
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        setStatus("Saving data to database...");
        console.log("[Ingest] Saving data...", finalData);
        
        await saveVideo(finalData);
        
        setStatus("Video saved successfully! Ready for next.", 5000);
        reset(); 
        setUrl('');
      } catch (err) {
        console.error("[Ingest] Save failed", err);
        setStatus("Error: Failed to save video. Check console.", 5000);
      }
  };

  if (data) {
    return (
      <div className={styles.reviewContainer}>
        <ReviewForm 
          initialData={data} 
          onSave={handleSave} 
          onCancel={() => {
            reset();
            setStatus("Operation cancelled.");
          }} 
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
          className="win95-inset win95-input"
          placeholder="https://..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        
        {loading ? (
          <TaskProgress onCancel={() => {
            cancel();
            setStatus("Analysis cancelled by user.", 3000);
          }} />
        ) : (
          <button 
            className="win95-btn"
            style={{ minWidth: '140px' }}
            onClick={handleAnalyze} 
          >
            Run Analysis
          </button>
        )}
      </div>

      {error && (
        <div className="win95-border win95-error">
          <span>⚠️</span>
          <strong>{error}</strong>
        </div>
      )}
    </div>
  );
};