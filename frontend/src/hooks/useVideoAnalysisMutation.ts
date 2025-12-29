import { useMutation } from '@tanstack/react-query';
import { analyzeVideo } from '../services/api';
import type { VideoMetadata } from '../types';

interface UseVideoAnalysisMutationReturn {
    analyze: (url: string) => void;
    reset: () => void;
    isLoading: boolean;
    data: VideoMetadata | undefined;
    error: string | null;
}

export const useVideoAnalysisMutation = (): UseVideoAnalysisMutationReturn => {
    const mutation = useMutation({
        mutationFn: async (url: string) => {
            const controller = new AbortController();
            return analyzeVideo(url, controller.signal);
        },
    });

    const getErrorMessage = (error: unknown): string => {
        if (!error) return '';

        const err = error as { response?: { status?: number; data?: { detail?: string } } };
        if (err.response?.status === 504) return 'Server Timeout (504). Video might be too long.';
        if (err.response?.status === 429) return 'Rate Limit Exceeded (429). Please wait.';
        if (err.response?.data?.detail) return `Error: ${err.response.data.detail}`;
        return 'Failed to analyze video.';
    };

    return {
        analyze: mutation.mutate,
        reset: mutation.reset,
        isLoading: mutation.isPending,
        data: mutation.data,
        error: mutation.error ? getErrorMessage(mutation.error) : null,
    };
};
