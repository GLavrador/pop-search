import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUseMyVideosQuery = vi.fn();
vi.mock('../../hooks/useMyVideosQuery', () => ({
  useMyVideosQuery: () => mockUseMyVideosQuery(),
}));

import { MyVideos } from './index';

const video = (overrides = {}) => ({
  id: 'video-1',
  titulo_video: 'Capivara nadando',
  descricao_completa: 'Uma capivara atravessa o rio',
  url_original: 'https://twitter.com/user/status/1',
  created_at: '2026-08-11T12:00:00+00:00',
  ...overrides,
});

describe('MyVideos', () => {
  beforeEach(() => {
    mockUseMyVideosQuery.mockReturnValue({ videos: [], isLoading: false, error: null });
  });

  it('should show a loading message while fetching', () => {
    mockUseMyVideosQuery.mockReturnValue({ videos: [], isLoading: true, error: null });

    render(<MyVideos />);

    expect(screen.getByText(/Loading your videos/)).toBeInTheDocument();
  });

  it('should surface an error instead of pretending the library is empty', () => {
    mockUseMyVideosQuery.mockReturnValue({
      videos: [],
      isLoading: false,
      error: 'Your session expired. Sign in again.',
    });

    render(<MyVideos />);

    expect(screen.getByRole('alert')).toHaveTextContent('Your session expired.');
    expect(screen.queryByText(/have not added any videos/)).not.toBeInTheDocument();
  });

  it('should point a new user at the ingest tab when empty', () => {
    render(<MyVideos />);

    expect(screen.getByText(/have not added any videos yet/)).toBeInTheDocument();
  });

  it('should list the videos with a link to the original', () => {
    mockUseMyVideosQuery.mockReturnValue({
      videos: [video()],
      isLoading: false,
      error: null,
    });

    render(<MyVideos />);

    const link = screen.getByRole('link', { name: 'Capivara nadando' });
    expect(link).toHaveAttribute('href', 'https://twitter.com/user/status/1');
    expect(screen.getByText('1 indexed')).toBeInTheDocument();
  });

  it('should fall back to the url when a video has no title', () => {
    mockUseMyVideosQuery.mockReturnValue({
      videos: [video({ titulo_video: undefined })],
      isLoading: false,
      error: null,
    });

    render(<MyVideos />);

    expect(
      screen.getByRole('link', { name: 'https://twitter.com/user/status/1' }),
    ).toBeInTheDocument();
  });
});
