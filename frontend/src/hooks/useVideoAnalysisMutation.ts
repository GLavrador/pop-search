import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeVideo } from '../services/api';
import { useI18n } from '../i18n/languageContext';
import type { VideoMetadata } from '../types';

interface UseVideoAnalysisMutationReturn {
    analyze: (url: string, options: { analyzeScenes: boolean; analyzeAudio: boolean }) => void;
    reset: () => void;
    isLoading: boolean;
    data: VideoMetadata | undefined;
    error: string | null;
}

export const useVideoAnalysisMutation = (): UseVideoAnalysisMutationReturn => {
    const queryClient = useQueryClient();
    const { t } = useI18n();

    const mutation = useMutation({
        mutationFn: async ({ url, options }: { url: string; options: { analyzeScenes: boolean; analyzeAudio: boolean } }) => {
            const controller = new AbortController();
            return analyzeVideo(url, options, controller.signal);
        },
        // Settled, not success: a failed analysis is charged too.
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['quota'] });
        },
    });

    const getErrorMessage = (error: unknown): string => {
        if (!error) return '';

        const err = error as { response?: { status?: number; data?: { detail?: string } } };

        // Checked first: 429 now covers both the per-minute rate limit and the
        // monthly quota, and only the server knows which one it was.
        if (err.response?.data?.detail) return err.response.data.detail;

        if (err.response?.status === 504) return t.ingest.errors.timeout;
        if (err.response?.status === 429) return t.ingest.errors.rateLimited;
        if (err.response?.status === 401) return t.ingest.errors.unauthorized;
        return t.ingest.errors.generic;
    };

    return {
        analyze: (url, options) => mutation.mutate({ url, options }),
        reset: mutation.reset,
        isLoading: mutation.isPending,
        data: mutation.data,
        error: mutation.error ? getErrorMessage(mutation.error) : null,
    };
};
