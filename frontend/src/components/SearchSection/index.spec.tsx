import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SearchSection } from './index';
import { StatusProvider } from '../../context/StatusContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../hooks/useVideoSearchQuery', () => ({
  useVideoSearchQuery: vi.fn(() => ({
    search: vi.fn(),
    results: [],
    isLoading: false,
    hasSearched: false,
    error: null,
  })),
}));

import { useVideoSearchQuery } from '../../hooks/useVideoSearchQuery';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <StatusProvider>
        {ui}
      </StatusProvider>
    </QueryClientProvider>
  );
};

describe('SearchSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input and button', () => {
    renderWithProviders(<SearchSection />);
    
    expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument();
    expect(screen.getByText('Find Now')).toBeInTheDocument();
  });

  it('should call search when form is submitted with query', () => {
    const mockSearch = vi.fn();
    vi.mocked(useVideoSearchQuery).mockReturnValue({
      search: mockSearch,
      results: [],
      isLoading: false,
      hasSearched: false,
      error: null,
    });

    renderWithProviders(<SearchSection />);
    
    const input = screen.getByPlaceholderText('Type to search...');
    fireEvent.change(input, { target: { value: 'test query' } });
    
    const button = screen.getByText('Find Now');
    fireEvent.click(button);
    
    expect(mockSearch).toHaveBeenCalledWith('test query', 0.7);
  });

  it('should not call search when query is empty', () => {
    const mockSearch = vi.fn();
    vi.mocked(useVideoSearchQuery).mockReturnValue({
      search: mockSearch,
      results: [],
      isLoading: false,
      hasSearched: false,
      error: null,
    });

    renderWithProviders(<SearchSection />);
    
    const button = screen.getByText('Find Now');
    fireEvent.click(button);
    
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('should show "0 objects found" when search returns empty', () => {
    vi.mocked(useVideoSearchQuery).mockReturnValue({
      search: vi.fn(),
      results: [],
      isLoading: false,
      hasSearched: true,
      error: null,
    });

    renderWithProviders(<SearchSection />);
    
    expect(screen.getByText('0 found.')).toBeInTheDocument();
  });

  it('should show error message when error occurs', () => {
    vi.mocked(useVideoSearchQuery).mockReturnValue({
      search: vi.fn(),
      results: [],
      isLoading: false,
      hasSearched: true,
      error: 'Database connection failed',
    });

    renderWithProviders(<SearchSection />);
    
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useVideoSearchQuery).mockReturnValue({
      search: vi.fn(),
      results: [],
      isLoading: true,
      hasSearched: true,
      error: null,
    });

    renderWithProviders(<SearchSection />);
    
    expect(screen.getByText('Querying database...')).toBeInTheDocument();
    expect(screen.queryByText('Find Now')).not.toBeInTheDocument();
  });
});
