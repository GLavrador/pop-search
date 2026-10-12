import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MyVideo, SearchResult } from '../types';

const updateVideo = vi.fn();
const deleteVideo = vi.fn();
vi.mock('../services/api', () => ({
  updateVideo: (...args: unknown[]) => updateVideo(...args),
  deleteVideo: (...args: unknown[]) => deleteVideo(...args),
}));

vi.mock('../context/authContext', () => ({
  useAuth: () => ({ session: { user: { id: 'user-1' } } }),
}));

import { useMyVideoActions } from './useMyVideoActions';

const LIBRARY = ['myVideos', 'user-1'];
const SEARCH = ['videoSearch', { query: 'capybara', threshold: 0.6, limit: 5, mode: 'hybrid' }];
const SEARCHED_AT = 1_700_000_000_000;

const mine = (id: string, title: string): MyVideo => ({
  id,
  titulo_video: title,
  descricao_completa: `About ${title}`,
  url_original: `https://x.com/a/status/${id}`,
  created_at: '2026-08-11T12:00:00+00:00',
});

const found = (id: string, title: string): SearchResult => ({
  id,
  titulo_video: title,
  descricao_completa: `About ${title}`,
  url_original: `https://x.com/a/status/${id}`,
  similarity: 0.8,
});

const CHANGES = {
  titulo_sugerido: 'Capybara, corrected',
  descricao_completa: 'About the capybara, corrected',
  metadados_estruturados: {
    pessoas: [],
    elementos_cenario: [],
    audio: { transcricao: '', musica: null, artista: null },
  },
};

const setUp = () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(LIBRARY, [mine('1', 'Capybara'), mine('2', 'Giraffe')]);
  queryClient.setQueryData(SEARCH, [found('1', 'Capybara'), found('2', 'Giraffe')], {
    updatedAt: SEARCHED_AT,
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMyVideoActions(), { wrapper });

  return {
    actions: result.current,
    library: () => queryClient.getQueryData<MyVideo[]>(LIBRARY)!.map((video) => video.titulo_video),
    results: () => queryClient.getQueryData<SearchResult[]>(SEARCH)!.map((video) => video.titulo_video),
    libraryIsStale: () => queryClient.getQueryState(LIBRARY)!.isInvalidated,
    searchedAt: () => queryClient.getQueryState(SEARCH)!.dataUpdatedAt,
  };
};

describe('useMyVideoActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show an edited video with its new text, in the library and in the results on screen', async () => {
    updateVideo.mockResolvedValue({
      ...mine('1', 'Capybara, corrected'),
      descricao_completa: 'About the capybara, corrected',
    });
    const { actions, library, results } = setUp();

    await actions.update('1', CHANGES);

    expect(updateVideo).toHaveBeenCalledWith('1', CHANGES);
    expect(library()).toEqual(['Capybara, corrected', 'Giraffe']);
    expect(results()).toEqual(['Capybara, corrected', 'Giraffe']);
  });

  it('should take a deleted video off the library and off the results on screen', async () => {
    deleteVideo.mockResolvedValue(undefined);
    const { actions, library, results } = setUp();

    await actions.remove('1');

    expect(library()).toEqual(['Giraffe']);
    expect(results()).toEqual(['Giraffe']);
  });

  /** The results are not news of a search: the robot and the status bar react to those. */
  it('should not make the results look like a search that just came back', async () => {
    deleteVideo.mockResolvedValue(undefined);
    updateVideo.mockResolvedValue(mine('2', 'Giraffe, corrected'));
    const { actions, searchedAt } = setUp();

    await actions.remove('1');
    await actions.update('2', CHANGES);

    expect(searchedAt()).toBe(SEARCHED_AT);
  });

  it('should leave everything in place when the server refuses', async () => {
    deleteVideo.mockRejectedValue({ response: { status: 500 } });
    updateVideo.mockRejectedValue({ response: { status: 500 } });
    const { actions, library, results, libraryIsStale } = setUp();

    await expect(actions.remove('1')).rejects.toBeTruthy();
    await expect(actions.update('1', CHANGES)).rejects.toBeTruthy();

    expect(library()).toEqual(['Capybara', 'Giraffe']);
    expect(results()).toEqual(['Capybara', 'Giraffe']);
    expect(libraryIsStale()).toBe(false);
  });

  /**
   * It was deleted somewhere else, or the server is older than this screen and
   * has no such route. Taking the first for granted would report a delete that
   * never happened in the second, so the library is asked instead.
   */
  it('should not assume a video the server does not know is gone, and ask for the library again', async () => {
    deleteVideo.mockRejectedValue({ response: { status: 404 } });
    const { actions, library, libraryIsStale } = setUp();

    await expect(actions.remove('1')).rejects.toBeTruthy();

    expect(library()).toEqual(['Capybara', 'Giraffe']);
    expect(libraryIsStale()).toBe(true);
  });
});
