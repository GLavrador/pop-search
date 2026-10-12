import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetSession = vi.fn();
const startAnalysis = vi.fn();
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
  startAnalysis: (...args: unknown[]) => startAnalysis(...args),
  getAnalysis: vi.fn().mockResolvedValue(null),
  discardAnalysis: vi.fn().mockResolvedValue(undefined),
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

// Everything it says comes in a few wordings, so the tests accept any of them.
const literal = (line: string) => line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const anyOf = (lines: string[]) => new RegExp(`^(${lines.map(literal).join('|')})$`);

const FOUND_ONE = anyOf(['found 1!', 'got 1 here!', 'look, 1 video!']);
const COPIED = anyOf(['copied!', 'it is yours!', 'link copied!']);
const SEARCH_TAB = anyOf(['shall we look?', 'what are we after?', 'I will find it for you!']);
const ADVANCED_OPEN = ['the fine settings!', 'time to tinker', 'the control panel'];
const ECHO = (word: string) => [`${word}?`, `hm, ${word}?`, `${word}, eh?`];
const CAUGHT = ['oops, I read nothing!', 'I was not looking!', 'I saw nothing, promise!'];
const LONE = (word: string) => [
  `just "${word}"? try Broad!`,
  'one word only? Broad finds more',
  `${word}... Broad brings more`,
];

const analysed = (title: string) => ({
  id: 'job-1',
  url: 'https://x.com/a/status/1',
  stage: 'done',
  analyze_scenes: true,
  analyze_audio: true,
  error: null,
  created_at: '2026-10-11T12:00:00+00:00',
  result: {
    titulo_sugerido: title,
    descricao_completa:
      'A whale jumps out of the sea and lands with a huge splash right beside a small boat full of people.',
    url_original: 'https://x.com/a/status/1',
    metadados_estruturados: {
      pessoas: [],
      elementos_cenario: [],
      audio: { transcricao: '', musica: null, artista: null },
    },
  },
});
const BROAD = ['net wide open!', 'bring them all!', 'the more the merrier'];

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

    expect(screen.getByText(SEARCH_TAB)).toBeInTheDocument();
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

    expect(await screen.findByText(FOUND_ONE)).toBeInTheDocument();
  });

  it('should confirm that a link was copied', async () => {
    searchVideos.mockResolvedValue([whale]);
    renderApp();
    await searchFor('whale');
    await screen.findByText(FOUND_ONE);

    await press('Copy');

    expect(screen.getByText(COPIED)).toBeInTheDocument();
  });

  it.each([
    ['cat', ['meow?', 'a cat?! where?', 'the one behind the window?']],
    ['a robô', ['that is me!!', 'did you call?', 'robot? present!']],
  ])('should prick up its ears when "%s" is typed into the search', async (words, lines) => {
    renderApp();
    await user.click(tab('🔍 Search.exe'));

    await user.type(screen.getByPlaceholderText('Type to search...'), words);

    expect(screen.getByText(anyOf(lines))).toBeInTheDocument();
  });

  it('should say a searched word back now and then, and then pretend it never did', async () => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp();
    await user.click(tab('🔍 Search.exe'));

    await user.type(screen.getByPlaceholderText('Type to search...'), 'a whale');

    expect(screen.getByText('whale...')).toBeInTheDocument();
    expect(await screen.findByText(anyOf(ECHO('whale')), {}, { timeout: 3000 })).toBeInTheDocument();
    expect(await screen.findByText(anyOf(CAUGHT), {}, { timeout: 4000 })).toBeInTheDocument();
    chance.mockRestore();
  }, 12000);

  it('should pick the reading back up when the typing carries on', async () => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp();
    await user.click(tab('🔍 Search.exe'));
    const field = screen.getByPlaceholderText('Type to search...');

    await user.type(field, 'a wha');
    await screen.findByText(anyOf(ECHO('wha')), {}, { timeout: 3000 });
    await user.type(field, 'le');

    expect(screen.getByText('whale...')).toBeInTheDocument();
    expect(
      await screen.findByText(
        anyOf(['ah, whale!', 'whale, I see!', 'so it was whale!']),
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    chance.mockRestore();
  }, 12000);

  it('should suggest a broader precision for a search of a single word', async () => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp();
    await user.click(tab('🔍 Search.exe'));

    await user.type(screen.getByPlaceholderText('Type to search...'), 'whale');

    expect(
      await screen.findByText(anyOf(LONE('whale')), {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    chance.mockRestore();
  });

  it('should keep that suggestion to itself when the search is already at its broadest', async () => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp();
    await user.click(tab('🔍 Search.exe'));
    await press('Broad');

    await user.type(screen.getByPlaceholderText('Type to search...'), 'whale');

    expect(
      await screen.findByText(anyOf(ECHO('whale')), {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    chance.mockRestore();
  });

  it.each([
    [
      'mean an exact phrase',
      'Hybrid',
      ['in quotes means the exact phrase!', 'quotes? to the letter, then', 'exact phrase, noted!'],
    ],
    [
      'count for nothing',
      'Semantic',
      [
        'quotes do not count in Semantic mode',
        'here the quotes are just decoration',
        'quotes do nothing in this mode',
      ],
    ],
  ])('should say that quotes %s in %s mode', async (_, mode, lines) => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp();
    await user.click(tab('🔍 Search.exe'));
    await press('▼ Advanced');
    await press(mode);

    await user.type(screen.getByPlaceholderText('Type to search...'), '"big whale"');

    expect(await screen.findByText(anyOf(lines), {}, { timeout: 3000 })).toBeInTheDocument();
    chance.mockRestore();
  });

  it.each([
    [
      'a good size',
      'A whale jumps right beside the boat',
      ['I like that title!', 'the AI did well!', 'good title, easy to find'],
    ],
    [
      'too short to be saved',
      'Whale jumps',
      [
        'short title: it needs 5 words',
        'is that all? the search wants more',
        'hm, that title is thin',
      ],
    ],
  ])(
    'should read the title the AI wrote and say it is %s',
    async (_, title, lines) => {
      signIn();
      startAnalysis.mockResolvedValue(analysed(title));
      renderApp();

      await runAnalysis();

      const start = title.split(' ')[0];
      expect(await screen.findByText(`${start}...`, {}, { timeout: 6000 })).toBeInTheDocument();
      expect(await screen.findByText(anyOf(lines), {}, { timeout: 6000 })).toBeInTheDocument();
    },
    15000,
  );

  it('should own up at once when the search is wiped under its nose', async () => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0);
    renderApp();
    await user.click(tab('🔍 Search.exe'));
    const field = screen.getByPlaceholderText('Type to search...');
    await user.type(field, 'whale');

    await user.clear(field);

    expect(screen.getByText(anyOf(CAUGHT))).toBeInTheDocument();
    chance.mockRestore();
  });

  it.each([
    ['shouting', 'WHALE', ['no need to shout!', 'ow, my ears!', 'CALM DOWN!']],
    ['a stuck key', 'whaaaaa', ['is the key stuck?', 'keyboard jammed?', 'let go of the key!']],
  ])('should remark on %s in the search', async (_, words, lines) => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    renderApp();
    await user.click(tab('🔍 Search.exe'));

    await user.type(screen.getByPlaceholderText('Type to search...'), words);

    expect(screen.getByText(anyOf(lines))).toBeInTheDocument();
    chance.mockRestore();
  });

  it('should notice a search being given up on', async () => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    renderApp();
    await user.click(tab('🔍 Search.exe'));
    const field = screen.getByPlaceholderText('Type to search...');
    await user.type(field, 'whale');

    await user.clear(field);

    expect(
      screen.getByText(anyOf(['huh, gave up?', 'all gone!', 'starting over, eh?'])),
    ).toBeInTheDocument();
    chance.mockRestore();
  });

  it('should mind its own business most of the time', async () => {
    const chance = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    renderApp();
    await user.click(tab('🔍 Search.exe'));

    await user.type(screen.getByPlaceholderText('Type to search...'), 'a whale');
    await new Promise((done) => setTimeout(done, 1500));

    expect(screen.queryByText(anyOf(['whale...', ...ECHO('whale')]))).not.toBeInTheDocument();
    chance.mockRestore();
  });

  it('should have a word for the buttons inside a tab', async () => {
    renderApp();
    await user.click(tab('🔍 Search.exe'));

    await press('Broad');
    expect(
      screen.getByText(anyOf(BROAD)),
    ).toBeInTheDocument();

    await press('Precise');
    expect(
      screen.getByText(anyOf(['only the best', 'picky mode', 'fine comb!'])),
    ).toBeInTheDocument();
  });

  it('should not comment on a button that changes nothing', async () => {
    renderApp();
    await user.click(tab('🔍 Search.exe'));
    await press('Broad');
    const said = screen.getByText(anyOf(BROAD)).textContent;

    await press('Broad');

    expect(screen.getByText(anyOf(BROAD))).toHaveTextContent(said ?? '');
  });

  it('should put the same thing in different words the next time', async () => {
    renderApp();
    await user.click(tab('🔍 Search.exe'));

    await press('▼ Advanced');
    const first = screen.getByText(anyOf(ADVANCED_OPEN)).textContent;
    await press('▲ Hide Advanced');
    await press('▼ Advanced');

    expect(
      screen.getByText(anyOf(ADVANCED_OPEN.filter((line) => line !== first))),
    ).toBeInTheDocument();
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
    startAnalysis.mockReturnValue(new Promise(() => {}));
    renderApp();

    await runAnalysis();

    expect(
      (await balloon()).getByText(
        /usually takes about a minute|That is the quick part|keep an eye on it all/,
      ),
    ).toBeInTheDocument();
  });

  it('should speak up when the AI fails, and open the manual form on request', async () => {
    signIn();
    startAnalysis.mockRejectedValue({ response: { status: 500 } });
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
