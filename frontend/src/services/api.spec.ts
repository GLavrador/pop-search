import { vi, describe, it, expect, beforeEach } from 'vitest';

const { post, put, del, get } = vi.hoisted(() => ({
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({ post, put, get, delete: del, interceptors: { request: { use: vi.fn() } } }),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));

import {
  deleteVideo,
  getSystem,
  lookUpPost,
  searchVideos,
  startAnalysis,
  updateVideo,
} from './api';
import { lastSearch, timed } from './searchTrace';

const LINK = 'https://x.com/a/status/1';
const OPTIONS = { analyzeScenes: true, analyzeAudio: false };

describe('starting an analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hand back the job the server created', async () => {
    const job = { id: 'job-1', url: LINK, stage: 'queued', result: null, error: null };
    post.mockResolvedValue({ data: job });

    expect(await startAnalysis(LINK, OPTIONS)).toBe(job);
    expect(post).toHaveBeenCalledWith('/videos/analyze', {
      url: LINK,
      analyze_scenes: true,
      analyze_audio: false,
    });
  });

  /**
   * While a deploy is under way the new screen can reach a backend that still
   * answers the old way, with the analysis itself. Taken for a job it had no
   * step, so the screen waited for ever and the analysis, already paid for,
   * was lost.
   */
  it('should read the answer of an older backend as a finished analysis', async () => {
    const analysis = {
      titulo_sugerido: 'A whale jumps right beside the boat',
      descricao_completa: 'A whale jumps out of the sea.',
      url_original: LINK,
      metadados_estruturados: {},
    };
    post.mockResolvedValue({ data: analysis });

    const job = await startAnalysis(LINK, OPTIONS);

    expect(job.stage).toBe('done');
    expect(job.result).toBe(analysis);
    expect(job.url).toBe(LINK);
    expect([job.analyze_scenes, job.analyze_audio]).toEqual([true, false]);
  });
});

describe('looking up the post of a link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ask for the post behind that link', async () => {
    const found = { texto: 'look at this whale', miniatura: 'https://pbs.twimg.com/a.jpg' };
    post.mockResolvedValue({ data: found });

    expect(await lookUpPost(LINK)).toBe(found);
    expect(post).toHaveBeenCalledWith('/videos/post', { url: LINK });
  });

  it('should answer with nothing when X shows none', async () => {
    post.mockResolvedValue({ data: null });

    expect(await lookUpPost(LINK)).toBeNull();
  });
});

describe('changing a video of mine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send the new text to the video and hand back how it is now listed', async () => {
    const changes = {
      titulo_sugerido: 'A whale jumps right beside the boat',
      descricao_completa: 'A whale jumps out of the sea.',
      metadados_estruturados: { pessoas: [], elementos_cenario: [], audio: { transcricao: '', musica: null, artista: null } },
    };
    const listed = { id: 'video-1', titulo_video: changes.titulo_sugerido, url_original: LINK, created_at: '' };
    put.mockResolvedValue({ data: listed });

    expect(await updateVideo('video-1', changes)).toBe(listed);
    expect(put).toHaveBeenCalledWith('/me/videos/video-1', changes);
  });

  it('should delete the video by its id', async () => {
    del.mockResolvedValue({});

    await deleteVideo('video-1');

    expect(del).toHaveBeenCalledWith('/me/videos/video-1');
  });
});

describe('searching', () => {
  const FOUND = [{ id: 'a' }, { id: 'b' }];

  beforeEach(() => {
    vi.clearAllMocks();
    lastSearch.set(null);
  });

  it('should keep how long each step took, as the server told it', async () => {
    post.mockResolvedValue({
      data: FOUND,
      headers: { 'server-timing': 'embed;dur=412.6, db;dur=95.2, total;dur=521.9' },
    });

    expect(await searchVideos({ query: 'whale', mode: 'hybrid' })).toBe(FOUND);

    expect(lastSearch.get()).toMatchObject({
      query: 'whale',
      mode: 'hybrid',
      found: 2,
      embedMs: 412.6,
      dbMs: 95.2,
      serverMs: 521.9,
    });
    expect(lastSearch.get()?.roundTripMs).toBeGreaterThanOrEqual(0);
  });

  it('should keep no time for a step the server skipped', async () => {
    post.mockResolvedValue({
      data: FOUND,
      headers: { 'server-timing': 'db;dur=95.2, total;dur=101' },
    });

    await searchVideos({ query: 'whale', mode: 'text' });

    expect(lastSearch.get()).toMatchObject({ embedMs: null, dbMs: 95.2, serverMs: 101 });
  });

  it('should still time the whole trip when the server reports nothing', async () => {
    post.mockResolvedValue({ data: FOUND });

    await searchVideos({ query: 'whale' });

    expect(lastSearch.get()).toMatchObject({ found: 2, embedMs: null, dbMs: null, serverMs: null });
    expect(lastSearch.get()?.roundTripMs).toBeGreaterThanOrEqual(0);
  });

  it('should find its own steps among the ones added on the way', () => {
    const header = 'cfExtPri, embed;dur=12.5;desc="ai", cache;desc="total;dur=9", total;dur=40';

    expect(timed(header, 'embed')).toBe(12.5);
    expect(timed(header, 'total')).toBe(40);
    expect(timed(header, 'db')).toBeNull();
    expect(timed(undefined, 'total')).toBeNull();
  });
});

describe('asking the server about itself', () => {
  it('should hand back what it says', async () => {
    const report = { version: '1.0.0', uptime_seconds: 12 };
    get.mockResolvedValue({ data: report });

    expect(await getSystem()).toBe(report);
    expect(get).toHaveBeenCalledWith('/system', expect.objectContaining({ timeout: 30000 }));
  });
});
