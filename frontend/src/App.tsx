import { useState, useRef } from 'react';
import styles from './App.module.css';
import './App.css';
import { analyzeVideo, saveVideo } from './services/api';
import type { VideoMetadata } from './types';
import { RetroWindow } from './components/RetroWindow';
import { ReviewForm } from './components/ReviewForm';
import { SearchSection } from './components/SearchSection';
import { ProgressBar } from './components/ProgressBar';
import axios from 'axios';

type Tab = 'ingest' | 'search';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
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
    
    console.log(`[UI] Starting analysis for URL: ${url}`);
    
    try {
      const result = await analyzeVideo(url);
      
      if (abortRef.current) {
        console.log('[UI] Analysis cancelled by user. Ignoring result.');
        return;
      }

      console.log('[UI] Analysis received successfully', result);
      setData(result);
    } catch (err: any) {
      if (abortRef.current) return;

      console.error('[UI] Error during analysis:', err);
      
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
        console.log("[UI] Saving data...", finalData);

        await saveVideo(finalData);

        alert("Video saved successfully! 🎉");

        setData(null);
        setUrl('');
      } catch (err) {
        console.error("[UI] Save failed", err);
        alert("Failed to save video. Check console for details.");
      }
  };

  return (
    <div className={styles.appContainer}>      
      <RetroWindow title="Pop Search System" icon="💻">
        <div className={styles.mainPanel}>
          <div className={styles.navBar}>
            <button 
              onClick={() => setActiveTab('ingest')}
              className={`win95-border ${styles.navButton} ${activeTab === 'ingest' ? `win95-inset ${styles.active}` : ''}`}
            >
              💿 Add-Video.exe
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={`win95-border ${styles.navButton} ${activeTab === 'search' ? `win95-inset ${styles.active}` : ''}`}
            >
              🔍 Search.exe
            </button>
          </div>

          <hr className={styles.separator} />

          <div className={styles.contentArea}>
            {activeTab === 'ingest' ? (
              <>
                {!data ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{fontWeight: 'bold'}}>Insert URL:</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        type="text" 
                        className="win95-inset"
                        placeholder="https://..." 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={loading}
                        style={{ flex: 1, padding: 8 }}
                      />
                      
                      {loading ? (
                        <div style={{ display: 'flex', gap: 5, flex: 1, maxWidth: '200px' }}>
                          <ProgressBar />
                          <button 
                             className="win95-border"
                             onClick={handleCancel}
                             style={{ fontWeight: 'bold', padding: '0 10px', cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          className={`win95-border ${styles.actionButton}`}
                          onClick={handleAnalyze} 
                          style={{ padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Run Analysis
                        </button>
                      )}

                    </div>
                  </div>
                ) : null}

                {error && (
                  <div className="win95-border" style={{ marginTop: 20, padding: 10, background: '#ffffcc', color: 'red', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span>⚠️</span>
                    <strong>{error}</strong>
                  </div>
                )}

                {data && (
                  <div style={{ marginTop: 20 }}>
                    <ReviewForm 
                      initialData={data} 
                      onSave={handleSave} 
                      onCancel={() => setData(null)} 
                    />
                  </div>
                )}
              </>
            ) : (

              <SearchSection />

            )}
          </div>
        </div>
      </RetroWindow>

      <footer className={styles.footer}>
        <p>© 1998 Pop Search Corp. - All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;