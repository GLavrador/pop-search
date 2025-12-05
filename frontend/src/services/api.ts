import axios from 'axios';
import type { VideoMetadata } from '../types';

const api = axios.create({
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeVideo = async (url: string): Promise<VideoMetadata> => {
  try {
    const response = await api.post<VideoMetadata>('/analyze', { url });
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};