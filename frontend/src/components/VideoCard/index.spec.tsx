import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
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
  });
});