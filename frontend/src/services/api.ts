import axios from 'axios';
import type { VideoMetadata, SearchParams, SearchResult } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeVideo = async (
  url: string,
  options: { analyzeScenes: boolean; analyzeAudio: boolean },
  signal: AbortSignal
): Promise<VideoMetadata> => {
  const response = await api.post<VideoMetadata>('/videos/analyze', {
    url,
    analyze_scenes: options.analyzeScenes,
    analyze_audio: options.analyzeAudio
  }, { signal });
  return response.data;
};

export const saveVideo = async (data: VideoMetadata): Promise<void> => {
  await api.post('/videos', data);
};

export const searchVideos = async (
  { query, limit = 5, threshold = 0.25 }: SearchParams,
  signal?: AbortSignal
): Promise<SearchResult[]> => {
  const response = await api.post<SearchResult[]>('/search', {
    query,
    limit,
    threshold
  }, { signal });
  return response.data;
};