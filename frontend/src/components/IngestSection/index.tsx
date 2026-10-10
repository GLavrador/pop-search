import { useState, useEffect, useRef } from 'react';
import { useVideoAnalysisMutation } from '../../hooks/useVideoAnalysisMutation';
import { useStatus } from '../../context/StatusContext';
import { saveVideo } from '../../services/api';
import type { VideoMetadata } from '../../types';
import { ReviewForm } from '../ReviewForm';
import { QuotaMeter } from '../QuotaMeter';
import { URLInputView } from './URLInputView';
import { createVideoUrlInputSchema } from '../../schemas/videoMetadata';
import { useI18n } from '../../i18n/languageContext';
import { useRobot } from '../../context/robotContext';
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
  const robot = useRobot();
  const toldData = useRef<VideoMetadata | undefined>(undefined);
  const toldError = useRef<string | null>(null);

  const [analyticsOptions, setAnalyticsOptions] = useState({ analyzeScenes: true, analyzeAudio: true });

  useEffect(() => {
    if (data === toldData.current) return;
    toldData.current = data;
    if (data) robot.notify({ kind: 'analysisDone', title: data.titulo_sugerido });
  }, [data, robot]);

  // The way out it offers is the manual form, opened on the link that just failed.
  useEffect(() => {
    if (error === toldError.current) return;
    toldError.current = error;
    if (!error) return;

    robot.notify({
      kind: 'analysisFailed',
      manual: () => {
        setManualData(createEmptyMetadata(url));
        setAnalyticsOptions({ analyzeScenes: true, analyzeAudio: true });
        setStatus(t.ingest.status.manual);
      },
    });
  }, [error, robot, url, setStatus, t.ingest.status.manual]);

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
      robot.notify({ kind: 'urlRejected' });
      return false;
    }
    return true;
  };

  const handleAnalyze = (options: { analyzeScenes: boolean; analyzeAudio: boolean }) => {
    if (!performValidation()) return;
    setAnalyticsOptions(options);
    setStatus(t.ingest.status.analysing);
    robot.notify({ kind: 'analysisStarted' });
    analyze(url, options);
  };

  const handleOpenManualForm = () => {
    if (!performValidation()) return;
    setManualData(createEmptyMetadata(url));
    setAnalyticsOptions({ analyzeScenes: true, analyzeAudio: true }); // By default show all in manual mode
    setStatus(t.ingest.status.manual);
    robot.notify({ kind: 'manualOpened' });
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        setStatus(t.ingest.status.saving);
        await saveVideo(finalData);
        setStatus(t.ingest.status.saved, 5000);
        robot.notify({ kind: 'saved' });
        handleCancelReview();
      } catch (err: unknown) {
        console.error("Failed to save video to database:", err);
        setStatus(t.ingest.status.saveFailed, 5000);
        robot.notify({ kind: 'saveFailed' });
      }
  };

  const handleCancelLoading = () => {
    reset();
    setStatus(t.ingest.status.cancelled, 3000);
    robot.notify({ kind: 'analysisCancelled' });
  };

  const handleCancelReview = () => {
    reset();
    setManualData(null);
    setUrl('');
    setStatus(t.ingest.status.reset, 3000);
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
    <div className={styles.ingestContainer}>
      <QuotaMeter />
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
