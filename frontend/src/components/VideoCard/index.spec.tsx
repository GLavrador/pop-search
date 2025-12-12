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
  resumo: 'This is a summary of the test video.',
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
});