import { vi, describe, it, expect, beforeEach } from 'vitest';

const { post, put, del } = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn(), del: vi.fn() }));

vi.mock('axios', () => ({
  default: {
    create: () => ({ post, put, get: vi.fn(), delete: del, interceptors: { request: { use: vi.fn() } } }),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } },
}));

import { deleteVideo, lookUpPost, startAnalysis, updateVideo } from './api';

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
