import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Hoisted so they exist before vi.mock runs, which is lifted above this file.
const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      post,
      get,
      interceptors: { request: { use: vi.fn() } },
    }),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));

import { getIsAdmin, saveVideo, searchVideos } from './api';
import { setDemoActive } from './demoMode';
import { DEMO_VIDEO } from '../constants/demoVideo';

describe('the api under the demo flag', () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    post.mockResolvedValue({ data: {} });
    get.mockResolvedValue({ data: {} });
  });

  afterEach(() => setDemoActive(false));

  it('should never write into the real archive while the tutorial runs', async () => {
    setDemoActive(true);

    await saveVideo(DEMO_VIDEO);

    expect(post).not.toHaveBeenCalled();
  });

  it('should write normally once the tutorial is over', async () => {
    setDemoActive(true);
    setDemoActive(false);

    await saveVideo(DEMO_VIDEO);

    expect(post).toHaveBeenCalledWith('/videos', DEMO_VIDEO);
  });

  it('should answer a search from the examples without touching the network', async () => {
    setDemoActive(true);

    const results = await searchVideos({ query: 'gato' });

    expect(post).not.toHaveBeenCalled();
    expect(results.length).toBeGreaterThan(0);
  });

  it('should keep the admin screen out of the tutorial', async () => {
    setDemoActive(true);

    expect(await getIsAdmin()).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('should reach the network for a search when the flag is off', async () => {
    post.mockResolvedValue({ data: [] });

    await searchVideos({ query: 'gato' });

    expect(post).toHaveBeenCalledWith('/search', expect.objectContaining({ query: 'gato' }), expect.anything());
  });
});
