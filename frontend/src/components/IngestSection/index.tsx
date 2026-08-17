import { useState, useEffect } from 'react';
import { useVideoAnalysisMutation } from '../../hooks/useVideoAnalysisMutation';
import { useStatus } from '../../context/StatusContext';
import { saveVideo } from '../../services/api';
import type { VideoMetadata } from '../../types';
import { ReviewForm } from '../ReviewForm';
import { QuotaMeter } from '../QuotaMeter';
import { URLInputView } from './URLInputView';
import { IngestAssistant } from '../IngestAssistant';
import { createVideoUrlInputSchema } from '../../schemas/videoMetadata';
import { useI18n } from '../../i18n/languageContext';
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
    }
  }
});

export const IngestSection = () => {
  const [url, setUrl] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState<VideoMetadata | null>(null);
  const { analyze, reset, isLoading, data, error } = useVideoAnalysisMutation();
  const { setStatus } = useStatus();
  const { t } = useI18n();

  const [analyticsOptions, setAnalyticsOptions] = useState({ analyzeScenes: true, analyzeAudio: true });

  useEffect(() => {
    if (data) {
      setStatus(t.ingest.status.analysed, 5000);
    }
  }, [data, setStatus, t.ingest.status.analysed]);

  useEffect(() => {
    if (error) {
      setStatus(t.ingest.status.failed, 5000);
    }
  }, [error, setStatus, t.ingest.status.failed]);

  const performValidation = (): boolean => {
    const result = createVideoUrlInputSchema(t.validation).safeParse(url);
    if (!result.success) {
      const reason = result.error.issues[0]?.message || t.validation.invalidUrl;
      setStatus(t.ingest.status.invalid(reason), 3000);
      return false;
    }
    return true;
  };

  const handleAnalyze = (options: { analyzeScenes: boolean; analyzeAudio: boolean }) => {
    if (!performValidation()) return;
    setAnalyticsOptions(options);
    setStatus(t.ingest.status.analysing);
    analyze(url, options);
  };

  const handleOpenManualForm = () => {
    if (!performValidation()) return;
    setManualData(createEmptyMetadata(url));
    setAnalyticsOptions({ analyzeScenes: true, analyzeAudio: true }); // By default show all in manual mode
    setStatus(t.ingest.status.manual);
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        setStatus(t.ingest.status.saving);
        await saveVideo(finalData);
        setStatus(t.ingest.status.saved, 5000);
        handleCancelReview();
      } catch (err: unknown) {
        console.error("Failed to save video to database:", err);
        setStatus(t.ingest.status.saveFailed, 5000);
      }
  };

  const handleCancelLoading = () => {
    reset();
    setStatus(t.ingest.status.cancelled, 3000);
  };

  const handleCancelReview = () => {
    reset();
    setManualData(null);
    setUrl('');
    setStatus(t.ingest.status.reset, 3000);
  };

  const formDataToReview = data || manualData;

  const assistantState = {
    url,
    manualMode,
    isAnalyzing: isLoading,
    hasError: !!error,
    reviewing: !!formDataToReview,
  };

  if (formDataToReview) {
    return (
      <div className={styles.reviewContainer}>
        <IngestAssistant {...assistantState} />
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
    <div className={styles.ingestContainer}>
      <QuotaMeter />
      <IngestAssistant {...assistantState} />
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
    </div>
  );
};
