import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAnalysisJob } from '../../hooks/useAnalysisJob';
import { useStatus } from '../../context/status';
import { validationErrorMessage } from '../../utils/validationError';
import { lookUpPost, saveVideo } from '../../services/api';
import type { RunningStage, VideoMetadata } from '../../types';
import { ReviewForm } from '../ReviewForm';
import { QuotaMeter } from '../QuotaMeter';
import { URLInputView } from './URLInputView';
import { DraftNotice } from './DraftNotice';
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

const EVERY_FIELD = { analyzeScenes: true, analyzeAudio: true };

export const IngestSection = () => {
  const [url, setUrl] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualData, setManualData] = useState<VideoMetadata | null>(null);
  const analysis = useAnalysisJob();
  const queryClient = useQueryClient();
  const { isLoading, stage, data, draft, duplicate, error } = analysis;
  const { setStatus } = useStatus();
  const { t } = useI18n();
  const robot = useRobot();
  const toldLoading = useRef(false);
  const toldStage = useRef<RunningStage | null>(null);
  const toldData = useRef<VideoMetadata | undefined>(undefined);
  const toldError = useRef<string | null>(null);
  const toldDraft = useRef<string | null>(null);
  const toldDuplicate = useRef<string | null>(null);

  // The link of the analysis in hand: after a reload the field starts empty.
  const jobUrl = analysis.url ?? url;

  // Told from here, not from the button: an analysis found still running after
  // a reload is one to keep watch over as well.
  useEffect(() => {
    if (isLoading === toldLoading.current) return;
    toldLoading.current = isLoading;
    if (isLoading) robot.notify({ kind: 'analysisStarted' });
  }, [isLoading, robot]);

  useEffect(() => {
    if (stage) setStatus(t.ingest.status.stage(t.ingest.stages[stage]));
  }, [stage, setStatus, t.ingest.status, t.ingest.stages]);

  useEffect(() => {
    if (stage === toldStage.current) return;
    toldStage.current = stage;
    if (stage && stage !== 'queued') robot.notify({ kind: 'analysisStage', stage });
  }, [stage, robot]);

  useEffect(() => {
    if (data === toldData.current) return;
    toldData.current = data;
    if (data) robot.notify({ kind: 'analysisDone', title: data.titulo_sugerido });
  }, [data, robot]);

  const openManualForm = useCallback(
    (link: string) => {
      setManualData(createEmptyMetadata(link));
      setStatus(t.ingest.status.manual);

      // Asked for apart, so the form never waits on X: the text of the post
      // lands in its field when it arrives, unless one was typed there first.
      lookUpPost(link)
        .then((post) => {
          if (!post) return;
          setManualData((current) =>
            current && current.url_original === link && !current.post ? { ...current, post } : current,
          );
        })
        .catch(() => {});
    },
    [setStatus, t.ingest.status.manual],
  );

  // The way out it offers is the manual form, opened on the link that just failed.
  useEffect(() => {
    if (error === toldError.current) return;
    toldError.current = error;
    if (!error) return;

    robot.notify({ kind: 'analysisFailed', manual: () => openManualForm(jobUrl) });
  }, [error, robot, jobUrl, openManualForm]);

  useEffect(() => {
    const id = draft?.id ?? null;
    if (id === toldDraft.current) return;
    toldDraft.current = id;
    if (!id) return;

    setStatus(t.ingest.status.draft, 5000);
    robot.notify({ kind: 'draftFound' });
  }, [draft, robot, setStatus, t.ingest.status.draft]);

  useEffect(() => {
    const id = duplicate?.id ?? null;
    if (id === toldDuplicate.current) return;
    toldDuplicate.current = id;
    if (!id) return;

    setStatus(t.ingest.status.duplicate, 5000);
    robot.notify({ kind: 'analysisDuplicate' });
  }, [duplicate, robot, setStatus, t.ingest.status.duplicate]);

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
    analysis.start(url, options);
  };

  const handleOpenManualForm = () => {
    if (!performValidation()) return;
    openManualForm(url);
    robot.notify({ kind: 'manualOpened' });
  };

  const backToStart = () => {
    // Also lets go of a failure already read, or it would greet the next link.
    analysis.close();
    setManualData(null);
    setUrl('');
    setStatus(t.ingest.status.reset, 3000);
  };

  const handleSave = async (finalData: VideoMetadata) => {
      try {
        setStatus(t.ingest.status.saving);
        await saveVideo(finalData);
        // The library stays mounted behind its tab, so it would never ask again.
        queryClient.invalidateQueries({ queryKey: ['myVideos'] });
        setStatus(t.ingest.status.saved, 5000);
        robot.notify({ kind: 'saved' });
        // Nothing to discard: saving already cleared the analysis on the server.
        backToStart();
      } catch (err: unknown) {
        console.error("Failed to save video to database:", err);
        setStatus(validationErrorMessage(err) ?? t.ingest.status.saveFailed, 5000);
        robot.notify({ kind: 'saveFailed' });
      }
  };

  const handleCancelLoading = () => {
    analysis.discard();
    setStatus(t.ingest.status.cancelled, 3000);
    robot.notify({ kind: 'analysisCancelled' });
  };

  const handleCancelReview = () => {
    if (!manualData) analysis.discard();
    backToStart();
  };

  const handleDiscardDraft = () => {
    analysis.discard();
    setStatus(t.ingest.status.discarded, 3000);
  };

  // What the user typed in by hand comes first: it is the newer of the two.
  const formDataToReview = manualData || data;
  const shownFields = manualData ? EVERY_FIELD : (analysis.options ?? EVERY_FIELD);

  if (formDataToReview) {
    return (
      <div className={styles.reviewContainer}>
        <ReviewForm
          initialData={formDataToReview}
          onSave={handleSave}
          onCancel={handleCancelReview}
          showScenes={shownFields.analyzeScenes}
          showAudio={shownFields.analyzeAudio}
        />
      </div>
    );
  }

  if (draft) {
    return (
      <div className={styles.ingestContainer}>
        <QuotaMeter />
        <DraftNotice draft={draft} onResume={analysis.resume} onDiscard={handleDiscardDraft} />
      </div>
    );
  }

  return (
    <div className={styles.ingestContainer}>
      <QuotaMeter />
      <URLInputView
        url={isLoading ? jobUrl : url}
        onUrlChange={setUrl}
        onAnalyze={handleAnalyze}
        onOpenManualForm={handleOpenManualForm}
        onCancel={handleCancelLoading}
        loading={isLoading}
        stage={stage}
        error={error}
        duplicate={duplicate}
        onDismissDuplicate={analysis.close}
        manualMode={manualMode}
        onManualModeChange={setManualMode}
      />
    </div>
  );
};
