import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockUseMyVideosQuery = vi.fn();
vi.mock('../../hooks/useMyVideosQuery', () => ({
  useMyVideosQuery: () => mockUseMyVideosQuery(),
}));

const update = vi.fn();
const remove = vi.fn();
vi.mock('../../hooks/useMyVideoActions', () => ({
  useMyVideoActions: () => ({ update, remove }),
}));

const setStatus = vi.fn();
vi.mock('../../context/status', () => ({
  useStatus: () => ({ setStatus }),
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
    vi.clearAllMocks();
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

  it('should show the picture of each video, and not what its post said', () => {
    const post = { texto: 'olha essa capivara', miniatura: 'https://pbs.twimg.com/a.jpg' };
    mockUseMyVideosQuery.mockReturnValue({
      videos: [video({ post })],
      isLoading: false,
      error: null,
    });

    const { container } = render(<MyVideos />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://pbs.twimg.com/a.jpg');
    expect(screen.queryByText(/olha essa capivara/)).not.toBeInTheDocument();
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

const TITLE = 'A capybara swims calmly across the river';
const DESCRIPTION =
  'A capybara crosses a wide brown river at an easy pace while birds stand on its back and people watch from the bank.';

const kept = (overrides = {}) =>
  video({
    titulo_video: TITLE,
    descricao_completa: DESCRIPTION,
    metadados_estruturados: {
      pessoas: [],
      elementos_cenario: ['river', 'birds'],
      audio: { transcricao: 'splash', musica: null, artista: null },
    },
    ...overrides,
  });

const list = (...videos: unknown[]) =>
  mockUseMyVideosQuery.mockReturnValue({ videos, isLoading: false, error: null });

const user = userEvent.setup();

const press = (name: string | RegExp) => user.click(screen.getByRole('button', { name }));

describe('editing one of my videos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list(kept());
  });

  it('should open the form with what is kept about the video', async () => {
    render(<MyVideos />);

    await press(`Edit "${TITLE}"`);

    expect(screen.getByText('Editing the video')).toBeInTheDocument();
    expect(screen.getByDisplayValue(TITLE)).toBeInTheDocument();
    expect(screen.getByDisplayValue('river, birds')).toBeInTheDocument();
    expect(screen.getByDisplayValue('splash')).toBeInTheDocument();
  });

  it('should save the changes and go back to the list', async () => {
    update.mockResolvedValue(kept());
    render(<MyVideos />);
    await press(`Edit "${TITLE}"`);

    fireEvent.change(screen.getByDisplayValue(TITLE), {
      target: { value: 'A capybara crosses the river with birds aboard' },
    });
    await press('Save');

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        'video-1',
        expect.objectContaining({ titulo_sugerido: 'A capybara crosses the river with birds aboard' }),
      ),
    );
    expect(await screen.findByText('1 indexed')).toBeInTheDocument();
    expect(setStatus).toHaveBeenLastCalledWith('Changes saved.', 5000);
  });

  it('should stay in the form, with what was typed, when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    update.mockRejectedValue(new Error('boom'));
    render(<MyVideos />);
    await press(`Edit "${TITLE}"`);

    fireEvent.change(screen.getByDisplayValue(TITLE), {
      target: { value: 'A capybara crosses the river with birds aboard' },
    });
    await press('Save');

    await waitFor(() => expect(setStatus).toHaveBeenLastCalledWith(expect.stringMatching(/Failed to save/), 5000));
    expect(screen.getByDisplayValue('A capybara crosses the river with birds aboard')).toBeInTheDocument();
  });

  it('should let the text of the post be taken out of a video already kept', async () => {
    const post = { texto: 'look at this capybara', miniatura: 'https://pbs.twimg.com/a.jpg' };
    list(kept({ post }));
    update.mockResolvedValue(kept());
    render(<MyVideos />);
    await press(`Edit "${TITLE}"`);

    const field = screen.getByLabelText(/Text of the post/);
    expect(field).toHaveValue('look at this capybara');
    fireEvent.change(field, { target: { value: '' } });
    await press('Save');

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        'video-1',
        expect.objectContaining({ post: { texto: '', miniatura: post.miniatura } }),
      ),
    );
  });

  it('should leave the video alone when the edit is cancelled', async () => {
    render(<MyVideos />);
    await press(`Edit "${TITLE}"`);

    await press('Cancel');

    expect(update).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: TITLE })).toBeInTheDocument();
  });

  it('should open a video kept before its details existed', async () => {
    list(kept({ metadados_estruturados: null }));
    render(<MyVideos />);

    await press(`Edit "${TITLE}"`);

    expect(screen.getByDisplayValue(TITLE)).toBeInTheDocument();
  });
});

describe('deleting one of my videos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    list(kept());
  });

  const question = () => screen.queryByRole('group', { name: `Delete "${TITLE}"` });

  it('should ask first, and delete nothing by itself', async () => {
    render(<MyVideos />);

    await press(`Delete "${TITLE}"`);

    expect(question()).toHaveTextContent('This cannot be undone.');
    expect(remove).not.toHaveBeenCalled();
  });

  it('should rest on the answer that keeps the video', async () => {
    render(<MyVideos />);

    await press(`Delete "${TITLE}"`);

    expect(within(question()!).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('should delete once the answer is yes', async () => {
    remove.mockResolvedValue(undefined);
    render(<MyVideos />);
    await press(`Delete "${TITLE}"`);

    await press('Yes, delete');

    await waitFor(() => expect(remove).toHaveBeenCalledWith('video-1'));
    await waitFor(() => expect(setStatus).toHaveBeenLastCalledWith('Video deleted from the archive.', 5000));
  });

  it('should keep the video when the answer is cancel', async () => {
    render(<MyVideos />);
    await press(`Delete "${TITLE}"`);

    await press('Cancel');

    expect(remove).not.toHaveBeenCalled();
    expect(question()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Delete "${TITLE}"` })).toBeInTheDocument();
  });

  it('should take Escape for a no', async () => {
    render(<MyVideos />);
    await press(`Delete "${TITLE}"`);

    await user.keyboard('{Escape}');

    expect(remove).not.toHaveBeenCalled();
    expect(question()).not.toBeInTheDocument();
  });

  it('should say so when the video could not be deleted', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    remove.mockRejectedValue(new Error('boom'));
    render(<MyVideos />);
    await press(`Delete "${TITLE}"`);

    await press('Yes, delete');

    await waitFor(() => expect(setStatus).toHaveBeenLastCalledWith(expect.stringMatching(/Failed to delete/), 5000));
    expect(screen.getByRole('link', { name: TITLE })).toBeInTheDocument();
  });
});
