import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AnalysisJob, AnalysisStage } from './types';

const mockGetSession = vi.fn();
const startAnalysis = vi.fn();
const discardAnalysis = vi.fn();
const saveVideo = vi.fn();
const lookUpPost = vi.fn();

// What the server would answer when asked for the user's analysis.
let onServer: AnalysisJob | null = null;
let serverDown = false;

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./constants/analysis', () => ({
  ANALYSIS_POLL_MS: 20,
  ANALYSIS_LOST_AFTER_MS: 150,
  ANALYSIS_STEPS: ['downloading', 'uploading', 'watching', 'writing'],
}));

vi.mock('./services/api', () => ({
  pingServer: vi.fn().mockResolvedValue(undefined),
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
  saveVideo: (...args: unknown[]) => saveVideo(...args),
  lookUpPost: (...args: unknown[]) => lookUpPost(...args),
  startAnalysis: (...args: unknown[]) => startAnalysis(...args),
  getAnalysis: () => (serverDown ? Promise.reject(new Error('down')) : Promise.resolve(onServer)),
  discardAnalysis: (...args: unknown[]) => discardAnalysis(...args),
  searchVideos: vi.fn().mockResolvedValue([]),
  getAllUsage: vi.fn(),
}));

import App from './App';
import { getMyQuota, getMyVideos } from './services/api';
import type { QuotaStatus } from './types';

const LINK = 'https://x.com/a/status/1';
const TITLE = 'A whale jumps right beside the boat';

const RESULT = {
  titulo_sugerido: TITLE,
  descricao_completa:
    'A whale jumps out of the sea and lands with a huge splash right beside a small boat full of people.',
  url_original: LINK,
  metadados_estruturados: {
    pessoas: [],
    elementos_cenario: [],
    audio: { transcricao: '', musica: null, artista: null },
  },
};

const job = (stage: AnalysisStage, changes: Partial<AnalysisJob> = {}): AnalysisJob => ({
  id: 'job-1',
  url: LINK,
  stage,
  analyze_scenes: true,
  analyze_audio: true,
  result: stage === 'done' ? RESULT : null,
  error: null,
  created_at: '2026-10-11T12:00:00+00:00',
  ...changes,
});

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

const runAnalysis = async () => {
  await user.type(await screen.findByPlaceholderText('https://...'), LINK);
  await press('Next');
  await press('Run Analysis');
};

const currentStep = () => screen.findByText((_, node) => node?.getAttribute('aria-current') === 'step');

const stepNamed = (name: string) => screen.getByText(name).closest('li') as HTMLElement;

// The quota meter is a progress bar too, so this one is asked for by name.
const progress = () => screen.queryByRole('progressbar', { name: 'Analysis progress' });

// The status bar repeats the headline, so the notice is found by what it is.
const copyNotice = async () =>
  within(
    await waitFor(() => {
      const notice = document.querySelector<HTMLElement>('[data-help="ingest.duplicate"]');
      if (!notice) throw new Error('no notice yet');
      return notice;
    }),
  );

describe('following an analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    onServer = null;
    serverDown = false;
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-abc',
          user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
        },
      },
    });
    startAnalysis.mockImplementation(() => {
      onServer = job('queued');
      return Promise.resolve(onServer);
    });
    discardAnalysis.mockImplementation(() => {
      onServer = null;
      return Promise.resolve();
    });
    saveVideo.mockResolvedValue({ approved: true });
    lookUpPost.mockResolvedValue(null);
  });

  it('should show the step the analysis is at, and the ones behind it', async () => {
    renderApp();
    await runAnalysis();

    onServer = job('watching');

    await waitFor(async () =>
      expect(await currentStep()).toHaveTextContent('The AI is watching the video'),
    );
    expect(stepNamed('Downloading the video from X')).toHaveAttribute('data-state', 'done');
    expect(stepNamed('Sending the video to the AI')).toHaveAttribute('data-state', 'done');
    expect(stepNamed('The AI is writing the description')).toHaveAttribute('data-state', 'ahead');
  });

  it('should ask for the analysis with the options that were ticked', async () => {
    renderApp();
    await user.type(await screen.findByPlaceholderText('https://...'), LINK);
    await press('Next');
    await user.click(screen.getByLabelText('Audio transcription'));
    await press('Run Analysis');

    expect(startAnalysis).toHaveBeenCalledWith(LINK, { analyzeScenes: true, analyzeAudio: false });
  });

  it('should open the review by itself when the analysis it was following ends', async () => {
    renderApp();
    await runAnalysis();

    onServer = job('done');

    expect(await screen.findByDisplayValue(TITLE)).toBeInTheDocument();
    expect(progress()).not.toBeInTheDocument();
  });

  it('should go back to following an analysis that was running when the page loaded', async () => {
    onServer = job('uploading');

    renderApp();

    expect(await currentStep()).toHaveTextContent('Sending the video to the AI');
    expect(screen.getByPlaceholderText('https://...')).toHaveValue(LINK);
    expect(screen.getByPlaceholderText('https://...')).toBeDisabled();
  });

  it('should offer an analysis that was left unsaved instead of opening it unasked', async () => {
    onServer = job('done');

    renderApp();

    expect(await screen.findByText('You left an analysis unsaved')).toBeInTheDocument();
    expect(screen.getByText(TITLE)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(TITLE)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('https://...')).not.toBeInTheDocument();
  });

  it('should open the review of an unsaved analysis on request', async () => {
    onServer = job('done', { analyze_audio: false });
    renderApp();

    await user.click(
      await screen.findByRole('button', { name: 'Continue the review' }, { timeout: 3000 }),
    );

    expect(await screen.findByDisplayValue(TITLE)).toBeInTheDocument();
    expect(screen.queryByText('Audio Analysis')).not.toBeInTheDocument();
  });

  it('should throw an unsaved analysis away on request', async () => {
    onServer = job('done');
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Discard' }, { timeout: 3000 }));

    expect(discardAnalysis).toHaveBeenCalledOnce();
    expect(await screen.findByPlaceholderText('https://...')).toBeInTheDocument();
    expect(screen.queryByText('You left an analysis unsaved')).not.toBeInTheDocument();
  });

  it('should stop a running analysis when it is cancelled', async () => {
    renderApp();
    await runAnalysis();
    await currentStep().catch(() => null);

    await press('Cancel');

    expect(discardAnalysis).toHaveBeenCalledOnce();
    await waitFor(() => expect(progress()).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Run Analysis' })).toBeEnabled();
  });

  it('should say why an analysis failed, and tell the server it was read', async () => {
    renderApp();
    await runAnalysis();

    onServer = job('failed', {
      error: { status: 504, detail: 'The AI service took too long to respond.' },
    });

    expect(await screen.findByText('The AI service took too long to respond.')).toBeInTheDocument();
    expect(discardAnalysis).toHaveBeenCalled();
    expect(progress()).not.toBeInTheDocument();
  });

  it('should stop waiting, and say so, when news of the analysis stops coming', async () => {
    renderApp();
    await runAnalysis();
    await currentStep().catch(() => null);

    serverDown = true;

    expect(await screen.findByText(/I lost contact with the server/)).toBeInTheDocument();
    expect(progress()).not.toBeInTheDocument();
  });

  it('should go back to following the analysis when the news comes back', async () => {
    renderApp();
    await runAnalysis();
    serverDown = true;
    await screen.findByText(/I lost contact with the server/);

    onServer = job('writing');
    serverDown = false;

    await waitFor(async () =>
      expect(await currentStep()).toHaveTextContent('The AI is writing the description'),
    );
    expect(screen.queryByText(/I lost contact with the server/)).not.toBeInTheDocument();
  });

  it('should have the robot say each step once as it begins', async () => {
    renderApp();
    await runAnalysis();
    const balloon = () => within(screen.getByRole('status'));

    expect(
      balloon().getByText(
        /normally takes a minute|It is quick|keep an eye on it all/,
      ),
    ).toBeInTheDocument();

    onServer = job('watching');

    await waitFor(() =>
      expect(
        balloon().getByText(/sees the whole video|Movie time|scene by scene/),
      ).toBeInTheDocument(),
    );
  });

  it('should show the video already kept when the link is a copy', async () => {
    startAnalysis.mockRejectedValue({
      response: {
        status: 409,
        data: {
          detail: 'This video is already in the archive. Nothing was taken from your quota.',
          existing: {
            id: 'video-1',
            titulo_video: 'Whale beside the boat',
            url_original: ' https://twitter.com/b/status/1/video/1 ',
            created_at: '2026-08-01T12:00:00+00:00',
          },
        },
      },
    });
    renderApp();

    await runAnalysis();

    const notice = await copyNotice();
    expect(notice.getByText('This video is already in the archive.')).toBeInTheDocument();
    expect(notice.getByText('Nothing was taken from your quota.')).toBeInTheDocument();
    expect(notice.getByText('Whale beside the boat')).toBeInTheDocument();
    expect(notice.getByRole('link', { name: 'Open the post' })).toHaveAttribute(
      'href',
      'https://twitter.com/b/status/1/video/1',
    );
  });

  it('should put the notice of a copy away with its own button', async () => {
    startAnalysis.mockRejectedValue({
      response: {
        status: 409,
        data: {
          detail: 'This video is already in the archive.',
          existing: { id: 'video-1', url_original: LINK, created_at: '2026-08-01T12:00:00+00:00' },
        },
      },
    });
    renderApp();
    await runAnalysis();
    await copyNotice();

    await press('Dismiss the notice');

    expect(document.querySelector('[data-help="ingest.duplicate"]')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Analysis' })).toBeEnabled();
  });

  it('should not treat a copy as a failure', async () => {
    startAnalysis.mockRejectedValue({
      response: {
        status: 409,
        data: {
          detail: 'This video is already in the archive.',
          existing: { id: 'video-1', url_original: LINK, created_at: '2026-08-01T12:00:00+00:00' },
        },
      },
    });
    renderApp();

    await runAnalysis();
    await copyNotice();

    expect(screen.queryByRole('button', { name: 'Fill it in myself' })).not.toBeInTheDocument();
    expect(
      screen.getByText(/^(I already have that one!|that one is kept already|seen it, kept it!)$/),
    ).toBeInTheDocument();
  });

  it('should show a refusal that is not a copy as an error', async () => {
    startAnalysis.mockRejectedValue({
      response: { status: 429, data: { detail: 'You have used all 20 analyses for this month.' } },
    });
    renderApp();

    await runAnalysis();

    expect(
      await screen.findByText('You have used all 20 analyses for this month.'),
    ).toBeInTheDocument();
  });

  it('shows the backend validation reason and keeps the draft after a rejected save', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    saveVideo.mockRejectedValueOnce({ response: { status: 422, data: { detail: [
      { loc: ['body', 'titulo_sugerido'], msg: 'Invalid title' },
    ] } } });
    renderApp();
    await runAnalysis();
    onServer = job('done');
    await screen.findByDisplayValue(TITLE);
    await press('Save');
    expect(await screen.findByText('titulo_sugerido: Invalid title')).toBeInTheDocument();
    expect(screen.getByDisplayValue(TITLE)).toBeInTheDocument();
  });

  it('should let go of the analysis once its video is saved', async () => {
    renderApp();
    await runAnalysis();
    onServer = job('done');
    await screen.findByDisplayValue(TITLE);

    saveVideo.mockImplementation(() => {
      onServer = null;
      return Promise.resolve({ approved: true });
    });
    await press('Save');

    expect(await screen.findByPlaceholderText('https://...')).toHaveValue('');
    expect(saveVideo).toHaveBeenCalledWith(expect.objectContaining({ titulo_sugerido: TITLE }));
    expect(discardAnalysis).not.toHaveBeenCalled();
  });

  /** The library stays mounted behind its tab, so nothing else makes it ask again. */
  it('should ask for the library again once a video is saved', async () => {
    renderApp();
    await runAnalysis();
    onServer = job('done');
    await screen.findByDisplayValue(TITLE);
    const asked = vi.mocked(getMyVideos).mock.calls.length;

    saveVideo.mockImplementation(() => {
      onServer = null;
      return Promise.resolve({ approved: true });
    });
    await press('Save');

    await waitFor(() => expect(vi.mocked(getMyVideos).mock.calls.length).toBe(asked + 1));
  });

  it('should discard the analysis when its review is cancelled', async () => {
    renderApp();
    await runAnalysis();
    onServer = job('done');
    await screen.findByDisplayValue(TITLE);

    await press('Cancel');

    expect(discardAnalysis).toHaveBeenCalledOnce();
    expect(await screen.findByPlaceholderText('https://...')).toBeInTheDocument();
  });
});

describe('describing a video by hand', () => {
  const POST = { texto: 'look at this whale', miniatura: 'https://pbs.twimg.com/a.jpg' };

  const postField = () => screen.findByLabelText(/Text of the post/);

  const openForm = async () => {
    await user.type(await screen.findByPlaceholderText('https://...'), LINK);
    await user.click(screen.getByLabelText('Manual Input'));
    await press('Open Form');
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    onServer = null;
    serverDown = false;
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-abc',
          user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
        },
      },
    });
    saveVideo.mockResolvedValue({ approved: true });
  });

  /** Asking X takes seconds. It used to happen inside the save, which waited for it. */
  it('should open the form at once, and fill in the text of the post when it arrives', async () => {
    let arrive: (post: typeof POST) => void = () => {};
    lookUpPost.mockReturnValue(new Promise((resolve) => (arrive = resolve)));
    renderApp();

    await openForm();

    expect(lookUpPost).toHaveBeenCalledWith(LINK);
    expect(await postField()).toHaveValue('');

    arrive(POST);

    await waitFor(async () => expect(await postField()).toHaveValue('look at this whale'));
  });

  it('should not write over a text typed while the post was on its way', async () => {
    let arrive: (post: typeof POST) => void = () => {};
    lookUpPost.mockReturnValue(new Promise((resolve) => (arrive = resolve)));
    renderApp();
    await openForm();

    await user.type(await postField(), 'my own words');
    arrive(POST);

    await waitFor(() =>
      expect(document.querySelector('img[src="https://pbs.twimg.com/a.jpg"]')).toBeInTheDocument(),
    );
    expect(await postField()).toHaveValue('my own words');
  });

  it('should leave the field empty when X has nothing to show', async () => {
    lookUpPost.mockRejectedValue(new Error('refused'));
    renderApp();

    await openForm();

    expect(await postField()).toHaveValue('');
  });

  it('should save the text only as it was left in the field', async () => {
    lookUpPost.mockResolvedValue(POST);
    renderApp();
    await openForm();
    await waitFor(async () => expect(await postField()).toHaveValue('look at this whale'));

    await user.clear(await postField());
    await user.type(document.querySelector('input[name="titulo_sugerido"]')!, TITLE);
    await user.type(
      document.querySelector('textarea[name="descricao_completa"]')!,
      RESULT.descricao_completa,
    );
    await press('Save');

    await waitFor(() =>
      expect(saveVideo).toHaveBeenCalledWith(
        expect.objectContaining({ post: { texto: '', miniatura: POST.miniatura } }),
      ),
    );
  });
});

describe('an account waiting for approval', () => {
  const standing = (changes: Partial<QuotaStatus>): QuotaStatus => ({
    used: 0,
    limit: 2,
    remaining: 2,
    resets_at: '2026-11-01',
    tokens_this_month: 0,
    approved: false,
    can_add: true,
    ...changes,
  });

  const lock = () => screen.findByText('Your account is waiting for approval');

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // How the review works was already read: these are about what comes after.
    localStorage.setItem('pop-search:review-read:user-1', '1');
    onServer = null;
    serverDown = false;
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-abc',
          user: { id: 'user-1', email: 'ana@example.com', user_metadata: {} },
        },
      },
    });
    lookUpPost.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.mocked(getMyQuota).mockResolvedValue(standing({ limit: 20, remaining: 20, approved: true }));
  });

  it('should explain the review on the first visit, and let nothing past until it is read', async () => {
    localStorage.clear();
    vi.mocked(getMyQuota).mockResolvedValue(standing({}));
    renderApp();

    const notice = await screen.findByRole('dialog', { name: 'Your account is under review' });

    expect(notice).toHaveAttribute('aria-modal', 'true');
    expect(within(notice).getByText(/you have 2 AI analyses/)).toBeInTheDocument();
    expect(within(notice).getByRole('link', { name: 'linkedin.com/in/guilherme-lviana' })).toBeInTheDocument();
    expect(within(notice).queryByRole('button', { name: /Close/ })).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Your account is under review' })).toBeInTheDocument();

    await user.click(within(notice).getByRole('button', { name: 'Got it' }));

    expect(screen.queryByRole('dialog', { name: 'Your account is under review' })).not.toBeInTheDocument();
    expect(localStorage.getItem('pop-search:review-read:user-1')).not.toBeNull();
  });

  it('should not explain the review again once it was read', async () => {
    vi.mocked(getMyQuota).mockResolvedValue(standing({}));
    renderApp();

    await screen.findAllByText('Analyses before approval');

    expect(screen.queryByRole('dialog', { name: 'Your account is under review' })).not.toBeInTheDocument();
  });

  it('should explain the review again on request, from the meter', async () => {
    vi.mocked(getMyQuota).mockResolvedValue(standing({ used: 1, remaining: 1 }));
    renderApp();

    // The meter is on Add-Video.exe and on the account tab alike.
    expect(await screen.findAllByText(/1 left for your video/)).not.toHaveLength(0);
    await user.click(screen.getAllByRole('button', { name: 'How does the review work?' })[0]);

    const notice = screen.getByRole('dialog', { name: 'Your account is under review' });
    await user.click(within(notice).getByRole('button', { name: /Close/ }));

    expect(screen.queryByRole('dialog', { name: 'Your account is under review' })).not.toBeInTheDocument();
  });

  it('should find the way to add locked once its video is in, and where to ask for approval', async () => {
    vi.mocked(getMyQuota).mockResolvedValue(standing({ can_add: false }));
    renderApp();

    expect(await lock()).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'linkedin.com/in/guilherme-lviana' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/guilherme-lviana',
    );
    expect(screen.getByLabelText(/Adding videos is locked/)).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('should answer an attempt to add another one', async () => {
    vi.mocked(getMyQuota).mockResolvedValue(standing({ can_add: false }));
    renderApp();
    await lock();

    await user.click(screen.getByLabelText(/Adding videos is locked/).parentElement!);

    expect(await screen.findByText('Adding videos waits for your account to be approved.')).toBeInTheDocument();
  });

  it('should say the first video is kept out of sight, and then lock', async () => {
    vi.mocked(getMyQuota).mockResolvedValue(standing({}));
    saveVideo.mockImplementation(() => {
      vi.mocked(getMyQuota).mockResolvedValue(standing({ can_add: false }));
      return Promise.resolve({ approved: false });
    });
    renderApp();

    await user.type(await screen.findByPlaceholderText('https://...'), LINK);
    await user.click(screen.getByLabelText('Manual Input'));
    await press('Open Form');
    await user.type(document.querySelector('input[name="titulo_sugerido"]')!, TITLE);
    await user.type(
      document.querySelector('textarea[name="descricao_completa"]')!,
      RESULT.descricao_completa,
    );
    await press('Save');

    expect(await screen.findByText(/Only you see it until your account is approved/)).toBeInTheDocument();
    expect(await lock()).toBeInTheDocument();
  });

  it('should lock when the server refuses a second video the screen did not know about', async () => {
    vi.mocked(getMyQuota).mockResolvedValue(standing({}));
    startAnalysis.mockImplementation(() => {
      vi.mocked(getMyQuota).mockResolvedValue(standing({ can_add: false }));
      return Promise.reject({ response: { status: 403, data: { detail: 'waiting for approval' } } });
    });
    renderApp();

    await runAnalysis();

    expect(await lock()).toBeInTheDocument();
    expect(screen.queryByText('waiting for approval')).not.toBeInTheDocument();
  });
});
