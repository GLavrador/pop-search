import axios from 'axios';
import type { VideoMetadata } from '../types';

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