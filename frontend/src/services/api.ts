import axios from 'axios';
import type {
  VideoMetadata,
  SearchParams,
  SearchResult,
  MyVideo,
  QuotaStatus,
  ProjectUsageReport,
} from '../types';
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD } from '../constants/searchPresets';
import { DEFAULT_SEARCH_MODE } from '../constants/searchModes';
import { supabase } from '../lib/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
const ANALYZE_TIMEOUT_MS = 240_000;

export const analyzeVideo = async (
  url: string,
  options: { analyzeScenes: boolean; analyzeAudio: boolean },
  signal: AbortSignal
): Promise<VideoMetadata> => {
  const response = await api.post<VideoMetadata>('/videos/analyze', {
    url,
    analyze_scenes: options.analyzeScenes,
    analyze_audio: options.analyzeAudio
  }, { signal, timeout: ANALYZE_TIMEOUT_MS });
  return response.data;
};

export const saveVideo = async (data: VideoMetadata): Promise<void> => {
  await api.post('/videos', data);
};

export const getMyQuota = async (signal?: AbortSignal): Promise<QuotaStatus> => {
  const response = await api.get<QuotaStatus>('/me/quota', { signal });
  return response.data;
};

export const getIsAdmin = async (signal?: AbortSignal): Promise<boolean> => {
  const response = await api.get<{ is_admin: boolean }>('/me/is-admin', { signal });
  return response.data.is_admin;
};

export const getAllUsage = async (signal?: AbortSignal): Promise<ProjectUsageReport> => {
  const response = await api.get<ProjectUsageReport>('/me/all-usage', { signal });
  return response.data;
};

export const getMyVideos = async (signal?: AbortSignal): Promise<MyVideo[]> => {
  const response = await api.get<MyVideo[]>('/me/videos', { signal });
  return response.data;
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