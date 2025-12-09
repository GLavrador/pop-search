import axios from 'axios';
import type { VideoMetadata, SearchParams, SearchResult } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeVideo = async (url: string): Promise<VideoMetadata> => {
  const response = await api.post<VideoMetadata>('/analyze', { url });
  return response.data;
};

export const saveVideo = async (data: VideoMetadata): Promise<void> => {
  try {
    await api.post('/videos', data);
  } catch (error) {
    console.error("Error saving video:", error);
    throw error;
  }
};

export const searchVideos = async ({ query, limit = 5, threshold = 0.25 }: SearchParams): Promise<SearchResult[]> => {
  try {
    const response = await api.post<SearchResult[]>('/search', { 
      query, 
      limit, 
      threshold 
    });
    return response.data;
  } catch (error) {
    console.error("Error searching videos:", error);
    throw error;
  }
};