import '@testing-library/jest-dom';
import.meta.env.VITE_SUPABASE_URL ??= 'http://localhost:54321';
import.meta.env.VITE_SUPABASE_ANON_KEY ??= 'test-anon-key';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

Element.prototype.scrollIntoView ??= () => {};

window.matchMedia ??= ((media: string) => ({
  matches: false,
  media,
  addEventListener() {},
  removeEventListener() {},
})) as unknown as typeof window.matchMedia;

Element.prototype.animate ??= (() => ({
  cancel() {},
})) as unknown as typeof Element.prototype.animate;
