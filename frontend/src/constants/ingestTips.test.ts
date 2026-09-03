import { describe, it, expect } from 'vitest';
import { pickIngestTip, isSupportedLink, type IngestContext } from './ingestTips';

const context = (overrides: Partial<IngestContext> = {}): IngestContext => ({
  url: '',
  manualMode: false,
  isAnalyzing: false,
  hasError: false,
  reviewing: false,
  ...overrides,
});

const POST = 'https://x.com/user/status/123/video/1';

describe('isSupportedLink', () => {
  it.each([
    ['https://x.com/user/status/123', true],
    ['https://twitter.com/user/status/123', true],
    ['https://mobile.twitter.com/user/status/123', true],
    ['https://www.x.com/user/status/123', true],
    ['https://youtube.com/watch?v=abc', false],
    ['https://notx.com/status/1', false],
    ['https://x.com.evil.net/status/1', false],
    ['not a url at all', false],
    ['', false],
  ])('should read %s as supported: %s', (url, expected) => {
    expect(isSupportedLink(url)).toBe(expected);
  });
});

describe('pickIngestTip', () => {
  it('should open on the first step when nothing is pasted', () => {
    expect(pickIngestTip(context())).toBe('start');
  });

  it('should refuse a link from the wrong site before it costs a request', () => {
    expect(pickIngestTip(context({ url: 'https://youtube.com/watch?v=abc' }))).toBe('badLink');
  });

  it('should move to the options step once the link is usable', () => {
    expect(pickIngestTip(context({ url: POST }))).toBe('ready');
  });

  it('should explain the manual path when it is chosen', () => {
    expect(pickIngestTip(context({ url: POST, manualMode: true }))).toBe('manual');
  });

  it('should narrate the wait while the AI works', () => {
    expect(pickIngestTip(context({ url: POST, isAnalyzing: true }))).toBe('analysing');
  });

  it('should prefer the running analysis over a stale error', () => {
    const tip = pickIngestTip(context({ url: POST, isAnalyzing: true, hasError: true }));

    expect(tip).toBe('analysing');
  });

  it('should hand over to the review step, whatever produced the data', () => {
    expect(pickIngestTip(context({ url: POST, reviewing: true }))).toBe('review');
    expect(pickIngestTip(context({ manualMode: true, reviewing: true }))).toBe('review');
  });

  it('should always have something to say', () => {
    const shapes: Partial<IngestContext>[] = [
      {},
      { url: 'lixo' },
      { url: POST },
      { url: POST, manualMode: true },
      { url: POST, isAnalyzing: true },
      { url: POST, hasError: true },
      { url: POST, reviewing: true },
    ];

    shapes.forEach((shape) => expect(pickIngestTip(context(shape))).toBeTruthy());
  });
});
