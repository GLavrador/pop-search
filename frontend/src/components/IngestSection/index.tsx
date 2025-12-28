import { useState, useEffect } from 'react';
import { useVideoAnalysis } from '../../hooks/useVideoAnalysis';
import { useStatus } from '../../context/StatusContext';
import { saveVideo } from '../../services/api';
import type { VideoMetadata } from '../../types';
import { ReviewForm } from '../ReviewForm';
import { URLInputView } from './URLInputView';
import styles from './styles.module.css';

const createEmptyMetadata = (url: string): VideoMetadata => ({
  titulo_sugerido: '',
  descricao_completa: '',
  url_original: url,
  metadados_estruturados: {
    pessoas: [],
    elementos_cenario: [],
    audio: {
      transcricao: '',
      musica: null,
      artista: null,
    },
    tags_busca: []
  }
});

export const IngestSection = () => {
  const [url, setUrl] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState<VideoMetadata | null>(null);
  const { analyze, cancel, reset, loading, data, error } = useVideoAnalysis();
  const { setStatus } = useStatus();

  useEffect(() => {
    if (data) {
      setStatus('Analysis finished successfully. Please review data below.', 5000);
    }
  }, [data, setStatus]);

  useEffect(() => {
    if (error) {
      setStatus('Analysis failed. Check the error box for details.', 5000);
    }
  }, [error, setStatus]);

  const handleAnalyze = async () => {
    if (!url) {
      setStatus('Error: Please enter a URL first.', 3000);
      return;
    }
    setStatus('Analyzing video... Please wait.');
    await analyze(url);
  };

  const handleOpenManualForm = () => {
    if (!url) {
      setStatus('Error: Please enter a URL first.', 3000);
      return;
    }
    setManualData(createEmptyMetadata(url));
    setStatus('Manual mode: Fill in the video details below.');
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        setStatus("Saving data to database...");
        console.log("[Ingest] Saving data...", finalData);
        
        await saveVideo(finalData);
        
        setStatus("Video saved successfully! Ready for next.", 5000);
        reset(); 
        setManualData(null);
        setUrl('');
      } catch (err) {
        console.error("[Ingest] Save failed", err);
        setStatus("Error: Failed to save video. Check console.", 5000);
      }
  };

  const handleCancelLoading = () => {
    cancel();
    setStatus("Analysis cancelled by user.", 3000);
  };

  const handleCancelReview = () => {
    reset();
    setManualData(null);
    setStatus("Operation cancelled.");
  };

  if (data) {
    return (
      <div className={styles.reviewContainer}>
        <ReviewForm 
          initialData={data} 
          onSave={handleSave} 
          onCancel={handleCancelReview} 
        />
      </div>
    );
  }

  if (manualData) {
    return (
      <div className={styles.reviewContainer}>
        <ReviewForm 
          initialData={manualData} 
          onSave={handleSave} 
          onCancel={handleCancelReview} 
        />
      </div>
    );
  }

  return (
    <URLInputView 
      url={url}
      onUrlChange={setUrl}
      onAnalyze={handleAnalyze}
      onOpenManualForm={handleOpenManualForm}
      onCancel={handleCancelLoading}
      loading={loading}
      error={error}
      manualMode={manualMode}
      onManualModeChange={setManualMode}
    />
  );
};
