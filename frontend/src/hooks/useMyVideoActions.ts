import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { deleteVideo, updateVideo } from '../services/api';
import { useAuth } from '../context/authContext';
import type { MyVideo, SearchResult, VideoMetadata } from '../types';

interface UseMyVideoActionsReturn {
    update: (id: string, data: VideoMetadata) => Promise<MyVideo>;
    remove: (id: string) => Promise<void>;
}

const isMissing = (error: unknown): boolean =>
    (error as { response?: { status?: number } }).response?.status === 404;

export const useMyVideoActions = (): UseMyVideoActionsReturn => {
    const queryClient = useQueryClient();
    const { session } = useAuth();
    const userId = session?.user.id;

    const changeLibrary = useCallback(
        (change: (videos: MyVideo[]) => MyVideo[]) => {
            queryClient.setQueryData<MyVideo[]>(['myVideos', userId], (videos) => videos && change(videos));
        },
        [queryClient, userId],
    );

    // The results on screen show the same videos. They keep the time they came
    // back at, so a change under them is not taken for a new search.
    const changeResults = useCallback(
        (change: (results: SearchResult[]) => SearchResult[]) => {
            for (const query of queryClient.getQueryCache().findAll({ queryKey: ['videoSearch'] })) {
                queryClient.setQueryData<SearchResult[]>(
                    query.queryKey,
                    (results) => results && change(results),
                    { updatedAt: query.state.dataUpdatedAt },
                );
            }
        },
        [queryClient],
    );

    // A video the server does not know was deleted somewhere else, or the
    // server is older than this screen. Asking for the library again tells which.
    const settle = useCallback(
        async <T,>(request: Promise<T>): Promise<T> => {
            try {
                return await request;
            } catch (error) {
                if (isMissing(error)) queryClient.invalidateQueries({ queryKey: ['myVideos'] });
                throw error;
            }
        },
        [queryClient],
    );

    const update = useCallback(
        async (id: string, data: VideoMetadata) => {
            const saved = await settle(updateVideo(id, data));

            changeLibrary((videos) => videos.map((video) => (video.id === id ? saved : video)));
            changeResults((results) =>
                results.map((result) =>
                    result.id === id
                        ? {
                              ...result,
                              titulo_video: saved.titulo_video ?? result.titulo_video,
                              descricao_completa: saved.descricao_completa,
                          }
                        : result,
                ),
            );
            return saved;
        },
        [changeLibrary, changeResults, settle],
    );

    const remove = useCallback(
        async (id: string) => {
            await settle(deleteVideo(id));

            changeLibrary((videos) => videos.filter((video) => video.id !== id));
            changeResults((results) => results.filter((result) => result.id !== id));
        },
        [changeLibrary, changeResults, settle],
    );

    return { update, remove };
};
