import axios from 'axios';
import type {
  AnalysisJob,
  PostInfo,
  VideoMetadata,
  SearchParams,
  SearchResult,
  MyVideo,
  QuotaStatus,
  ProjectUsageReport,
  AdminStatsReport,
  SystemReport,
  BinRecords,
} from '../types';
import { lastSearch, timed } from './searchTrace';
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD } from '../constants/searchPresets';
import { DEFAULT_SEARCH_MODE } from '../constants/searchModes';
import { SERVER_ATTEMPT_TIMEOUT_MS } from '../constants/startup';
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

/** Resolves once the server answers, and fails when it does not. */
export const pingServer = async (signal?: AbortSignal): Promise<void> => {
  await api.get('/', { signal, timeout: SERVER_ATTEMPT_TIMEOUT_MS });
};

export const startAnalysis = async (
  url: string,
  options: { analyzeScenes: boolean; analyzeAudio: boolean },
): Promise<AnalysisJob> => {
  const response = await api.post<AnalysisJob | VideoMetadata>('/videos/analyze', {
    url,
    analyze_scenes: options.analyzeScenes,
    analyze_audio: options.analyzeAudio
  });
  const answer = response.data;

  // A backend from before analyses became jobs answers with the finished
  // analysis itself. Read as a job, it would be waited on for ever.
  if (!('stage' in answer)) {
    return {
      id: 'direct',
      url,
      stage: 'done',
      analyze_scenes: options.analyzeScenes,
      analyze_audio: options.analyzeAudio,
      result: answer,
      error: null,
      created_at: new Date().toISOString(),
    };
  }

  return answer;
};

export const getAnalysis = async (signal?: AbortSignal): Promise<AnalysisJob | null> => {
  const response = await api.get<AnalysisJob | null>('/videos/analyze', { signal });
  return response.data ?? null;
};

export const discardAnalysis = async (): Promise<void> => {
  await api.delete('/videos/analyze');
};

export const saveVideo = async (data: VideoMetadata): Promise<void> => {
  await api.post('/videos', data);
};

/** The text and the picture of the post behind a link, or null when X shows none. */
export const lookUpPost = async (url: string): Promise<PostInfo | null> => {
  const response = await api.post<PostInfo | null>('/videos/post', { url });
  return response.data ?? null;
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

export const getAdminStats = async (
  days: number,
  signal?: AbortSignal,
): Promise<AdminStatsReport> => {
  const response = await api.get<AdminStatsReport>('/me/admin/stats', { params: { days }, signal });
  return response.data;
};

export const getBinRecords = async (signal?: AbortSignal): Promise<BinRecords> => {
  const response = await api.get<BinRecords>('/me/bin-records', { signal });
  return response.data;
};

/** Offers these records to the account, which keeps the best of each game and answers with them. */
export const keepBinRecords = async (records: BinRecords): Promise<BinRecords> => {
  const response = await api.put<BinRecords>('/me/bin-records', records);
  return response.data;
};

export const getMyVideos = async (signal?: AbortSignal): Promise<MyVideo[]> => {
  const response = await api.get<MyVideo[]>('/me/videos', { signal });
  return response.data;
};

export const updateVideo = async (id: string, data: VideoMetadata): Promise<MyVideo> => {
  const response = await api.put<MyVideo>(`/me/videos/${id}`, data);
  return response.data;
};

export const deleteVideo = async (id: string): Promise<void> => {
  await api.delete(`/me/videos/${id}`);
};

export const searchVideos = async (
  { query, limit = DEFAULT_LIMIT, threshold = DEFAULT_THRESHOLD, mode = DEFAULT_SEARCH_MODE }: SearchParams,
  signal?: AbortSignal
): Promise<SearchResult[]> => {
  const asked = performance.now();
  const response = await api.post<SearchResult[]>('/search', {
    query,
    limit,
    threshold,
    mode
  }, { signal });

  const timing = response.headers?.['server-timing'];
  lastSearch.set({
    query,
    mode,
    found: response.data.length,
    roundTripMs: performance.now() - asked,
    embedMs: timed(timing, 'embed'),
    dbMs: timed(timing, 'db'),
    serverMs: timed(timing, 'total'),
  });

  return response.data;
};

export const getSystem = async (signal?: AbortSignal): Promise<SystemReport> => {
  const response = await api.get<SystemReport>('/system', {
    signal,
    timeout: SERVER_ATTEMPT_TIMEOUT_MS,
  });
  return response.data;
};