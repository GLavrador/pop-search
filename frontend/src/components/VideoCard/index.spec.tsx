import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { VideoCard } from './index';
import type { SearchResult } from '../../types';

const mockSetStatus = vi.fn();
vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({
    setStatus: mockSetStatus
  })
}));

const mockData: SearchResult = {
  id: '123',
  titulo_video: 'Test Video Title',
  descricao_completa: 'This is a summary of the test video.',
  similarity: 0.856,
  url_original: 'http://example.com'
};

describe('VideoCard Component', () => {
  it('should render title and summary correctly', () => {
    render(<VideoCard data={mockData} />);

    expect(screen.getByText('Test Video Title')).toBeInTheDocument();
    
    expect(screen.getByText('This is a summary of the test video.')).toBeInTheDocument();
  });

  it('should show the picture of the video, and not what its post said', () => {
    const post = { texto: 'dia de meia maluca', miniatura: 'https://pbs.twimg.com/a.jpg' };

    const { container } = render(<VideoCard data={{ ...mockData, post }} />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://pbs.twimg.com/a.jpg');
    expect(screen.queryByText(/dia de meia maluca/)).not.toBeInTheDocument();
  });

  it('should display the similarity score as a percentage', () => {
    render(<VideoCard data={mockData} />);

    expect(screen.getByText(/MATCH:\s*86%/)).toBeInTheDocument();
  });

  describe('match origin badge', () => {
    it('should report a semantic-only result as meaning', () => {
      render(<VideoCard data={{ ...mockData, similarity: 0.8, text_rank: 0 }} />);

      expect(screen.getByText('meaning')).toBeInTheDocument();
    });

    it('should report a text-only result as words', () => {
      render(<VideoCard data={{ ...mockData, similarity: 0, text_rank: 0.6 }} />);

      expect(screen.getByText('words')).toBeInTheDocument();
    });

    it('should report a result found by both routes', () => {
      render(<VideoCard data={{ ...mockData, similarity: 0.8, text_rank: 0.6 }} />);

      expect(screen.getByText('meaning + words')).toBeInTheDocument();
    });

    it('should fall back to meaning when text_rank is absent', () => {
      // text_rank is optional in SearchResult, so the badge must not assume it
      render(<VideoCard data={{ ...mockData, similarity: 0.8 }} />);

      expect(screen.getByText('meaning')).toBeInTheDocument();
    });

    it('should show no likeness for a video found by its words alone', () => {
      render(<VideoCard data={{ ...mockData, similarity: 0, text_rank: 0.6 }} />);

      expect(screen.getByText('words')).toBeInTheDocument();
      expect(screen.queryByText(/MATCH/)).not.toBeInTheDocument();
    });
  });

  describe('a long description', () => {
    // jsdom lays nothing out: the box is told its heights, and when it is looked at.
    const layOut = (full: number, shown: number) => {
      vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(full);
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(shown);
      vi.stubGlobal(
        'ResizeObserver',
        class {
          private readonly seen: () => void;
          constructor(seen: () => void) {
            this.seen = seen;
          }
          observe() {
            this.seen();
          }
          disconnect() {}
        },
      );
    };
    const summary = () => screen.getByText('This is a summary of the test video.');

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('should be cut short, and unfolded and folded back on request', () => {
      layOut(120, 50);
      render(<VideoCard data={mockData} />);

      expect(summary()).toHaveAttribute('data-folded');

      fireEvent.click(screen.getByRole('button', { name: 'read more ▾' }));

      expect(summary()).not.toHaveAttribute('data-folded');

      fireEvent.click(screen.getByRole('button', { name: 'read less ▴' }));

      expect(summary()).toHaveAttribute('data-folded');
      expect(screen.getByRole('button', { name: 'read more ▾' })).toBeInTheDocument();
    });

    it('should offer nothing to unfold when all of it fits', () => {
      layOut(50, 50);
      render(<VideoCard data={mockData} />);

      expect(screen.queryByRole('button', { name: /read more/ })).not.toBeInTheDocument();
    });
  });
});
