import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetSession = vi.fn();

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./hooks/useMyVideosQuery', () => ({
  useMyVideosQuery: () => ({ videos: [], isLoading: false, error: null }),
}));

vi.mock('./hooks/useServerWake', () => ({
  useServerWake: () => ({ state: 'awake', tookMs: 0 }),
}));

vi.mock('./constants/rebuild', () => ({ REBUILD_PACE: 1, SWALLOW_MS: 20 }));

vi.mock('./services/api', async (original) => ({
  ...(await original<typeof import('./services/api')>()),
  getIsAdmin: vi.fn().mockResolvedValue(false),
  getSystem: vi.fn().mockResolvedValue({
    version: '1.0.0',
    uptime_seconds: 60,
    python: '3.12.4',
    framework: 'FastAPI 0.123.0',
    downloader: 'yt-dlp 2025.11.12',
    database: { ok: true, ms: 41, videos: 128 },
    ai: {
      analysis_model: 'gemini-2.5-flash',
      embedding_model: 'gemini-embedding-001',
      dimensions: 768,
      questions_kept: 0,
      questions_room: 256,
    },
  }),
}));

import App from './App';

const OPENED = /^(that is me inside!|mind the mess|my insides!)$/;

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const icon = (name: string | RegExp) => screen.getByRole('button', { name });
const properties = () => screen.queryByRole('dialog', { name: 'System Properties' });
const frame = () => document.querySelector('[data-robot="window"]') as HTMLElement;

describe('My Computer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should open System Properties on a double click, to a remark from the robot', async () => {
    renderApp();
    expect(properties()).not.toBeInTheDocument();

    fireEvent.doubleClick(icon('My Computer'));

    expect(properties()).toBeInTheDocument();
    expect(screen.getByText(OPENED)).toBeInTheDocument();
    expect(await screen.findByText('128 videos in the archive')).toBeInTheDocument();
    expect(screen.getByText('Visitor')).toBeInTheDocument();
  });

  it('should leave the program open behind it, and close without taking it along', () => {
    renderApp();
    fireEvent.doubleClick(icon('My Computer'));

    expect(frame()).toHaveAttribute('aria-hidden', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(properties()).not.toBeInTheDocument();
    expect(frame()).toHaveAttribute('aria-hidden', 'false');
  });

  it('should go with everything else when the program is thrown in the bin', async () => {
    renderApp();
    fireEvent.doubleClick(icon('My Computer'));
    vi.spyOn(icon('Recycle Bin'), 'getBoundingClientRect').mockReturnValue({
      left: 8,
      top: 8,
      right: 84,
      bottom: 68,
      width: 76,
      height: 60,
    } as DOMRect);

    const app = icon(/Pop Search$/);
    fireEvent.pointerDown(app, { button: 0, clientX: 40, clientY: 200 });
    fireEvent.pointerMove(app, { clientX: 40, clientY: 30 });
    fireEvent.pointerUp(app, { clientX: 40, clientY: 30 });

    await screen.findByRole('alert');
    expect(properties()).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'skip ▸▸' }));
    expect(properties()).not.toBeInTheDocument();
  });
});
