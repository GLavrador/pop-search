import { useState, useEffect } from 'react';
import { useVideoAnalysisMutation } from '../../hooks/useVideoAnalysisMutation';
import { useStatus } from '../../context/StatusContext';
import { saveVideo } from '../../services/api';
import type { VideoMetadata } from '../../types';
import { ReviewForm } from '../ReviewForm';
import { URLInputView } from './URLInputView';
import { videoUrlInputSchema } from '../../schemas/videoMetadata';
import styles from './styles.module.css';

const validateUrl = (url: string): { success: boolean; error?: string } => {
  const result = videoUrlInputSchema.safeParse(url);
  if (result.success) {
    return { success: true };
  }
  const errorMessage = result.error.issues[0]?.message || 'Invalid URL';
  return { success: false, error: errorMessage };
};

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
    }
  }
});

export const IngestSection = () => {
  const [url, setUrl] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState<VideoMetadata | null>(null);
  const { analyze, reset, isLoading, data, error } = useVideoAnalysisMutation();
  const { setStatus } = useStatus();

  const [analyticsOptions, setAnalyticsOptions] = useState({ analyzeScenes: false, analyzeAudio: false });

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

  const performValidation = (): boolean => {
    const validation = validateUrl(url);
    if (!validation.success) {
      setStatus(`Error: ${validation.error}`, 3000);
      return false;
    }
    return true;
  };

  const handleAnalyze = (options: { analyzeScenes: boolean; analyzeAudio: boolean }) => {
    if (!performValidation()) return;
    setAnalyticsOptions(options);
    setStatus('Analyzing video... Please wait.');
    analyze(url, options);
  };

  const handleOpenManualForm = () => {
    if (!performValidation()) return;
    setManualData(createEmptyMetadata(url));
    setAnalyticsOptions({ analyzeScenes: true, analyzeAudio: true }); // By default show all in manual mode
    setStatus('Manual mode: Fill in the video details below.');
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        setStatus("Saving data to database...");
        await saveVideo(finalData);
        setStatus("Video saved successfully! Ready for next.", 5000);
        handleCancelReview();
      } catch (err: unknown) {
        console.error("Failed to save video to database:", err);
        setStatus("Error: Failed to save video. Please try again.", 5000);
      }
  };

  const handleCancelLoading = () => {
    reset();
    setStatus("Analysis cancelled by user.", 3000);
  };

  const handleCancelReview = () => {
    reset();
    setManualData(null);
    setUrl('');
    setStatus("Ready for next video.", 3000);
  };

  const formDataToReview = data || manualData;

  if (formDataToReview) {
    return (
      <div className={styles.reviewContainer}>
        <ReviewForm 
          initialData={formDataToReview} 
          onSave={handleSave} 
          onCancel={handleCancelReview} 
          showScenes={analyticsOptions.analyzeScenes}
          showAudio={analyticsOptions.analyzeAudio}
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
      loading={isLoading}
      error={error}
      manualMode={manualMode}
      onManualModeChange={setManualMode}
    />
  );
};
