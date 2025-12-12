import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useVideoAnalysis } from './useVideoAnalysis';
import * as apiService from '../services/api';

vi.mock('../services/api');

describe('useVideoAnalysis Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useVideoAnalysis());

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle successful analysis', async () => {
    const mockData = { titulo_sugerido: 'Success Video' };
    (apiService.analyzeVideo as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useVideoAnalysis());

    await act(async () => {
      await result.current.analyze('http://test.com');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors', async () => {
    const mockError = { 
      isAxiosError: true,
      response: { data: { detail: 'Backend error' } } 
    };
    (apiService.analyzeVideo as any).mockRejectedValue(mockError);

    const { result } = renderHook(() => useVideoAnalysis());

    await act(async () => {
      await result.current.analyze('http://test.com');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toContain('Backend error');
  });

  it('should reset state correctly', async () => {
    const { result } = renderHook(() => useVideoAnalysis());

    await act(async () => {
        result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});