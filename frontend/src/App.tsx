import { useState } from 'react';
import './App.css'; 
import { analyzeVideo, saveVideo } from './services/api';
import type { VideoMetadata } from './types';
import { ReviewForm } from './components/ReviewForm';
import { SearchSection } from './components/SearchSection'; 

type Tab = 'ingest' | 'search';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => { 
      if (!url) return;

      setLoading(true);
      setError(null);
      setData(null);

      console.log(`[UI] Starting analysis for URL: ${url}`);
      
      try {
        const result = await analyzeVideo(url);
        console.log('[UI] Analysis received successfully', result);
        setData(result);
      } catch (err) {
        console.error('[UI] Error during analysis:', err);
        setError('Failed to analyze video. Please check the console or backend status.');
      } finally {
        setLoading(false);
      }
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
    <div className="app-wrapper">
      <nav style={{ padding: '1rem', background: '#333', color: 'white', marginBottom: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '20px' }}>
          <b style={{ marginRight: 'auto' }}>Pop Search</b>
          <button 
            onClick={() => setActiveTab('ingest')}
            style={{ fontWeight: activeTab === 'ingest' ? 'bold' : 'normal', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            Add Video
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            style={{ fontWeight: activeTab === 'search' ? 'bold' : 'normal', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            Search
          </button>
        </div>
      </nav>

      <div className="container">
        {activeTab === 'ingest' ? (
          <>
            <h1>Video Ingestion</h1>
            {!data ? (
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Paste Twitter/X URL here..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
                <button onClick={handleAnalyze} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            ) : null}

            {error && <p className="error">{error}</p>}

            {data && (
              <div className="result-preview">
                <ReviewForm 
                  initialData={data} 
                  onSave={handleSave} 
                  onCancel={() => setData(null)} 
                />
              </div>
            )}
          </>
        ) : (
          <>
            <h1>Smart Search</h1>
            <SearchSection />
          </>
        )}
      </div>
    </div>
  );
}

export default App;