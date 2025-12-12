import { useState, useRef } from 'react';
import axios from 'axios';
import { analyzeVideo, saveVideo } from '../../services/api';
import type { VideoMetadata } from '../../types';
import { ProgressBar } from '../ProgressBar';
import { ReviewForm } from '../ReviewForm';
import styles from './styles.module.css';

export const IngestSection = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<boolean>(false);

  const handleAnalyze = async () => { 
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);
    abortRef.current = false;
    
    console.log(`[Ingest] Starting analysis for URL: ${url}`);
    
    try {
      const result = await analyzeVideo(url);
      
      if (abortRef.current) {
        console.log('[Ingest] Analysis cancelled by user. Ignoring result.');
        return;
      }

      console.log('[Ingest] Analysis received successfully', result);
      setData(result);
    } catch (err: any) {
      if (abortRef.current) return;

      console.error('[Ingest] Error during analysis:', err);
      
      let errorMessage = 'Failed to analyze video. Please check backend.';
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 504) {
          errorMessage = 'The AI is taking too long to respond (Timeout). Please try a shorter video (less than 1 min) or try again in a moment.';
        } else if (err.response?.status === 429) {
          errorMessage = 'You are going too fast! Please wait a minute before trying again (Rate Limit).';
        } else if (err.response?.data?.detail) {
          errorMessage = `Error: ${err.response.data.detail}`;
        }
      }

      setError(errorMessage);
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    setLoading(false);
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        console.log("[Ingest] Saving data...", finalData);

        await saveVideo(finalData);

        alert("Video saved successfully! 🎉");

        setData(null);
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
          onCancel={() => setData(null)} 
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
               onClick={handleCancel}
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