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

// A tab that has already started up. The boot screen is for the tests that ask for it.
beforeEach(() => {
  sessionStorage.setItem('pop-search:booted', '1');
});
