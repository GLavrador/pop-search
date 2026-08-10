import axios from 'axios';
import type { VideoMetadata, SearchParams, SearchResult } from '../types';
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD } from '../constants/searchPresets';
import { DEFAULT_SEARCH_MODE } from '../constants/searchModes';

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
  { query, limit = DEFAULT_LIMIT, threshold = DEFAULT_THRESHOLD, mode = DEFAULT_SEARCH_MODE }: SearchParams,
  signal?: AbortSignal
): Promise<SearchResult[]> => {
  const response = await api.post<SearchResult[]>('/search', {
    query,
    limit,
    threshold,
    mode
  }, { signal });
  return response.data;
};