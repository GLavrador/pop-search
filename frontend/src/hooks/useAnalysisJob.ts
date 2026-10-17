import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { discardAnalysis, getAnalysis, startAnalysis } from '../services/api';
import { ANALYSIS_LOST_AFTER_MS, ANALYSIS_POLL_MS } from '../constants/analysis';
import { useI18n } from '../i18n/languageContext';
import type {
  AnalysisJob,
  AnalysisStage,
  ExistingVideo,
  RunningStage,
  VideoMetadata,
} from '../types';

const KEY = ['analysis'] as const;

interface AnalysisOptions {
  analyzeScenes: boolean;
  analyzeAudio: boolean;
}

/**
 * `watched` tells an analysis followed on this screen from one found already
 * finished: the first opens its review by itself, the second waits to be asked.
 */
type Followed = AnalysisJob & { watched: boolean };

interface Refusal {
  response?: { status?: number; data?: { detail?: unknown; existing?: ExistingVideo } };
}

const RUNNING: readonly AnalysisStage[] = ['queued', 'downloading', 'uploading', 'watching', 'writing'];

// Only a step it knows counts as running: anything else would be waited on for ever.
const isRunning = (job: AnalysisJob | null | undefined): boolean =>
  !!job && RUNNING.includes(job.stage);

interface UseAnalysisJobReturn {
  start: (url: string, options: AnalysisOptions) => void;
  /** Stops a running analysis, or throws away a finished one. */
  discard: () => void;
  /** Lets go of an analysis the server has already cleared, as a save does. */
  close: () => void;
  /** Opens the review of an analysis found waiting. */
  resume: () => void;
  isLoading: boolean;
  stage: RunningStage | null;
  url: string | null;
  options: AnalysisOptions | null;
  data: VideoMetadata | undefined;
  draft: AnalysisJob | null;
  duplicate: ExistingVideo | null;
  error: string | null;
  /** The server refused because the account already added its one video before approval. */
  refusedAsLocked: boolean;
}

export const useAnalysisJob = (): UseAnalysisJobReturn => {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const query = useQuery({
    queryKey: KEY,
    queryFn: async ({ signal }): Promise<Followed | null> => {
      const job = await getAnalysis(signal);
      if (!job) return null;

      const before = queryClient.getQueryData<Followed | null>(KEY);
      const sameRun = before?.id === job.id;

      if (!isRunning(job) && sameRun && isRunning(before)) {
        queryClient.invalidateQueries({ queryKey: ['quota'] });
      }

      // A failure is told once: the server forgets it as soon as it was read.
      if (job.stage === 'failed') discardAnalysis().catch(() => {});

      return { ...job, watched: isRunning(job) || (sameRun && !!before?.watched) };
    },
    refetchInterval: (current) => (isRunning(current.state.data) ? ANALYSIS_POLL_MS : false),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const starting = useMutation({
    mutationFn: ({ url, options }: { url: string; options: AnalysisOptions }) =>
      startAnalysis(url, options),
    onMutate: () => {
      // The failure of the last attempt has been read by now.
      queryClient.setQueryData<Followed | null>(KEY, (current) =>
        current?.stage === 'failed' ? null : current,
      );
    },
    onSuccess: (job) => {
      queryClient.setQueryData<Followed>(KEY, { ...job, watched: true });
      if (!isRunning(job)) queryClient.invalidateQueries({ queryKey: ['quota'] });
    },
    onError: (error: Refusal) => {
      if (error.response?.status === 403) queryClient.invalidateQueries({ queryKey: ['quota'] });
      // Refused because one is already running elsewhere: follow that one.
      if (error.response?.status === 409 && !error.response.data?.existing) {
        queryClient.invalidateQueries({ queryKey: KEY });
      }
    },
  });

  const discarding = useMutation({
    mutationFn: discardAnalysis,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: KEY });
      queryClient.setQueryData(KEY, null);
      starting.reset();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['quota'] });
    },
  });

  const refusalMessage = (error: Refusal | null): string | null => {
    if (!error || error.response?.data?.existing || error.response?.status === 403) return null;

    // Checked first: 429 covers both the per-minute rate limit and the monthly
    // quota, and only the server knows which one it was.
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;

    if (error.response?.status === 504) return t.ingest.errors.timeout;
    if (error.response?.status === 429) return t.ingest.errors.rateLimited;
    if (error.response?.status === 401) return t.ingest.errors.unauthorized;
    return t.ingest.errors.generic;
  };

  const job = query.data ?? null;
  // The analysis may well be going on, but with no news of it there is nothing to show.
  const lost =
    isRunning(job) &&
    query.isError &&
    query.errorUpdatedAt - query.dataUpdatedAt > ANALYSIS_LOST_AFTER_MS;
  const running = isRunning(job) && !lost;
  const isLoading = starting.isPending || running;
  const finished = job?.stage === 'done' ? job : null;
  const refusal = (starting.error as Refusal | null) ?? null;

  return {
    start: (url, options) => starting.mutate({ url, options }),
    discard: () => discarding.mutate(),
    close: () => {
      queryClient.setQueryData(KEY, null);
      starting.reset();
    },
    resume: () => {
      queryClient.setQueryData<Followed | null>(KEY, (current) =>
        current ? { ...current, watched: true } : current,
      );
    },
    isLoading,
    stage: running && job ? (job.stage as RunningStage) : starting.isPending ? 'queued' : null,
    url: job?.url ?? null,
    options: job ? { analyzeScenes: job.analyze_scenes, analyzeAudio: job.analyze_audio } : null,
    data: (finished?.watched && finished.result) || undefined,
    draft: finished && !finished.watched ? finished : null,
    duplicate: isLoading ? null : (refusal?.response?.data?.existing ?? null),
    error: isLoading
      ? null
      : lost
        ? t.ingest.errors.lost
        : job?.stage === 'failed'
          ? (job.error?.detail ?? t.ingest.errors.generic)
          : refusalMessage(refusal),
    refusedAsLocked: !isLoading && refusal?.response?.status === 403,
  };
};
