import { useState } from 'react';
import './App.css'; 
import { analyzeVideo } from './services/api';
import type { VideoMetadata } from './types';
import { ReviewForm } from './components/ReviewForm';

function App() {
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

  // mock
  const handleSave = (finalData: VideoMetadata) => {
    console.log("Saving to Supabase...", finalData);
    alert("Data ready to be saved! (Check console)");
  };

  return (
    <div className="container">
      <h1>Pop Search - Ingestion</h1>
      
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
    </div>
  );
}

export default App;