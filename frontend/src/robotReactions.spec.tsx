import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetSession = vi.fn();
const analyzeVideo = vi.fn();
const searchVideos = vi.fn();

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./services/api', () => ({
  warmUpBackend: vi.fn(),
  getIsAdmin: vi.fn().mockResolvedValue(false),
  getMyVideos: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn(),
  getMyQuota: vi.fn().mockResolvedValue({
    used: 0,
    limit: 20,
    remaining: 20,
    resets_at: '2026-09-01',
    tokens_this_month: 0,
  }),
  saveVideo: vi.fn(),
  analyzeVideo: (...args: unknown[]) => analyzeVideo(...args),
  searchVideos: (...args: unknown[]) => searchVideos(...args),
  getAllUsage: vi.fn(),
}));

import App from './App';

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const user = userEvent.setup();

const press = (name: string | RegExp) => user.click(screen.getByRole('button', { name }));

const tab = (name: string) => screen.getByRole('tab', { name });

const balloon = async () => within(await screen.findByRole('status'));

const signIn = () =>
  mockGetSession.mockResolvedValue({
    data: {
      session: {
        access_token: 'token-abc',
        user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
      },
    },
  });

const searchFor = async (words: string) => {
  await user.click(tab('🔍 Search.exe'));
  await user.type(screen.getByPlaceholderText('Type to search...'), words);
  await press('Find Now');
};

const runAnalysis = async () => {
  await user.type(await screen.findByPlaceholderText('https://...'), 'https://x.com/a/status/1');
  await press('Next');
  await press('Run Analysis');
};

const whale = {
  id: 'v1',
  titulo_video: 'A whale breaching',
  descricao_completa: 'A whale jumps out of the sea.',
  url_original: 'https://x.com/a/status/1',
  similarity: 0.8,
  text_rank: 0.2,
};

describe('the robot reacting to the app', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    searchVideos.mockResolvedValue([]);
  });

  it('should say a word the first time a tab is opened', async () => {
    renderApp();

    await user.click(tab('🔍 Search.exe'));

    expect(screen.getByText(/shall we look\?|what are we after\?/)).toBeInTheDocument();
  });

  it('should object when the window is being closed', async () => {
    renderApp();

    await press('Close');

    expect(screen.getByText('hey!')).toBeInTheDocument();
  });

  it('should count what a search found', async () => {
    searchVideos.mockResolvedValue([whale]);
    renderApp();

    await searchFor('whale');

    expect(await screen.findByText('found 1!')).toBeInTheDocument();
  });

  it('should confirm that a link was copied', async () => {
    searchVideos.mockResolvedValue([whale]);
    renderApp();
    await searchFor('whale');
    await screen.findByText('found 1!');

    await press('Copy');

    expect(screen.getByText('copied!')).toBeInTheDocument();
  });

  it('should offer a broader search when nothing comes up, and run it', async () => {
    renderApp();

    await searchFor('whale');

    expect((await balloon()).getByText(/nothing at this precision/)).toBeInTheDocument();

    await press('Try Broad');

    expect(searchVideos).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'whale', threshold: 0.45 }),
      expect.anything(),
    );
  });

  it('should stop offering once the broadest search found nothing either', async () => {
    renderApp();
    await searchFor('whale');
    await balloon();

    await press('Try Broad');

    expect((await balloon()).getByText(/Still nothing/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try Broad' })).not.toBeInTheDocument();
  });

  it('should offer to search by meaning when the exact words matched nothing', async () => {
    renderApp();
    await user.click(tab('🔍 Search.exe'));
    await press('▼ Advanced');
    await press('Exact');

    await user.type(screen.getByPlaceholderText('Type to search...'), 'whale');
    await press('Find Now');

    expect((await balloon()).getByText(/exactly those words/)).toBeInTheDocument();

    await press('Search by meaning too');

    expect(searchVideos).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'whale', mode: 'hybrid' }),
      expect.anything(),
    );
  });

  it('should drop its advice about a search as soon as another one starts', async () => {
    renderApp();
    await searchFor('whale');
    await balloon();
    searchVideos.mockReturnValue(new Promise(() => {}));

    await user.type(screen.getByPlaceholderText('Type to search...'), ' shark');
    await press('Find Now');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should keep watch while the AI works', async () => {
    signIn();
    analyzeVideo.mockReturnValue(new Promise(() => {}));
    renderApp();

    await runAnalysis();

    expect((await balloon()).getByText(/keep an eye on it/)).toBeInTheDocument();
  });

  it('should speak up when the AI fails, and open the manual form on request', async () => {
    signIn();
    analyzeVideo.mockRejectedValue({ response: { status: 500 } });
    renderApp();

    await runAnalysis();

    expect((await balloon()).getByText(/could not manage this time/)).toBeInTheDocument();

    await press('Fill it in myself');

    expect(await screen.findByText('Suggested Title')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('should keep quiet about the app while the guide is running', async () => {
    renderApp();
    await user.click(await screen.findByRole('button', { name: /Start the guide/i }));

    await press('Close');

    expect(screen.queryByText('hey!')).not.toBeInTheDocument();
  });
});
