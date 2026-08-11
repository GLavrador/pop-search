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
    
    expect(mockSearch).toHaveBeenCalledWith('test query', 0.6, 5, 'hybrid');
  });

  it('should use the threshold of the selected precision preset', () => {
    const mockSearch = vi.fn();
    vi.mocked(useVideoSearchQuery).mockReturnValue({
      search: mockSearch,
      results: [],
      isLoading: false,
      hasSearched: false,
      error: null,
    });

    renderWithProviders(<SearchSection />);

    fireEvent.change(screen.getByPlaceholderText('Type to search...'), {
      target: { value: 'test query' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Broad' }));
    fireEvent.click(screen.getByText('Find Now'));

    expect(mockSearch).toHaveBeenCalledWith('test query', 0.45, 5, 'hybrid');
  });

  it('should search in the selected mode and disable presets when it is Exact', () => {
    const mockSearch = vi.fn();
    vi.mocked(useVideoSearchQuery).mockReturnValue({
      search: mockSearch,
      results: [],
      isLoading: false,
      hasSearched: false,
      error: null,
    });

    renderWithProviders(<SearchSection />);

    fireEvent.change(screen.getByPlaceholderText('Type to search...'), {
      target: { value: 'test query' },
    });
    fireEvent.click(screen.getByRole('button', { name: '▼ Advanced' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exact' }));
    fireEvent.click(screen.getByText('Find Now'));

    expect(mockSearch).toHaveBeenCalledWith('test query', 0.6, 5, 'text');

    // The threshold does nothing in Exact mode, so the controls that set it
    // must not stay live and pretend otherwise.
    expect(screen.getByRole('button', { name: 'Balanced' })).toBeDisabled();
    expect(screen.getByRole('slider', { name: 'Match threshold' })).toBeDisabled();
  });

  it('should scope the syntax help to the active mode', () => {
    renderWithProviders(<SearchSection />);
    fireEvent.click(screen.getByRole('button', { name: '▼ Advanced' }));

    expect(screen.getByText(/steer the exact-terms half/)).toBeInTheDocument();
    expect(screen.getByText('baleia -orca')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Exact' }));
    expect(screen.getByText('These control the entire search.')).toBeInTheDocument();
    expect(screen.getByText('baleia -orca')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Semantic' }));
    expect(screen.getByText(/read as ordinary characters/)).toBeInTheDocument();
    expect(screen.queryByText('baleia -orca')).not.toBeInTheDocument();
  });

  it('should keep the threshold controls live in Semantic mode', () => {
    renderWithProviders(<SearchSection />);

    fireEvent.click(screen.getByRole('button', { name: '▼ Advanced' }));
    fireEvent.click(screen.getByRole('button', { name: 'Semantic' }));

    expect(screen.getByRole('button', { name: 'Balanced' })).not.toBeDisabled();
    expect(screen.getByRole('slider', { name: 'Match threshold' })).not.toBeDisabled();
  });

  it('should mark the default preset as active on first render', () => {
    renderWithProviders(<SearchSection />);

    expect(screen.getByRole('button', { name: 'Balanced' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Broad' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
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
