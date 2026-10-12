import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthContext, type AuthContextType } from '../../context/authContext';
import type { ServerStatus } from '../../hooks/useServerWake';
import { Boot } from './index';

const WAKING: ServerStatus = { state: 'waking', tookMs: null };
const AWAKE: ServerStatus = { state: 'awake', tookMs: 320 };

const SKIP = /Press any key, or tap the screen, to go in now\./;

const auth = (over: Partial<AuthContextType> = {}): AuthContextType => ({
  session: null,
  displayName: null,
  isLoading: false,
  isAuthenticated: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  ...over,
});

const renderBoot = (server: ServerStatus, who = auth()) => {
  const onDone = vi.fn();
  const view = render(
    <AuthContext.Provider value={who}>
      <Boot server={server} onDone={onDone} />
    </AuthContext.Provider>,
  );
  const face = () => view.container.querySelector('[data-face]')?.getAttribute('data-face');
  return { onDone, face, ...view };
};

const pass = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe('Boot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should print its checks one after another', () => {
    renderBoot(AWAKE);

    expect(screen.getByText('Program')).toBeInTheDocument();
    expect(screen.queryByText('Server')).not.toBeInTheDocument();

    pass(450);

    expect(screen.getByText('Language').parentElement).toHaveTextContent('English');
    expect(screen.getByText('Session').parentElement).toHaveTextContent('visitor');
    expect(screen.getByText('Server').parentElement).toHaveTextContent('OK, in 320 ms');
  });

  it('should count in seconds an answer that took that long', () => {
    renderBoot({ state: 'awake', tookMs: 14230 });

    pass(450);

    expect(screen.getByText('Server').parentElement).toHaveTextContent('OK, in 14.2 s');
  });

  it('should go in shortly after everything has answered', () => {
    const { onDone } = renderBoot(AWAKE);

    pass(450);
    expect(screen.getByText('Starting Pop Search...')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    pass(450);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('should name whoever is signed in', () => {
    renderBoot(AWAKE, auth({ displayName: 'Ana', isAuthenticated: true }));

    pass(450);

    expect(screen.getByText('Session').parentElement).toHaveTextContent('Ana');
  });

  it('should wait for the session to be read before going in', () => {
    const { onDone } = renderBoot(AWAKE, auth({ isLoading: true }));

    pass(2000);

    expect(screen.getByText('Session').parentElement).toHaveTextContent('checking...');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('should say why it is waiting when the server is asleep', () => {
    const { onDone, face } = renderBoot(WAKING);

    pass(450);
    expect(screen.getByText('Server').parentElement).toHaveTextContent('calling...');
    expect(face()).toBe('sleepy');

    pass(2000);

    expect(screen.getByText('Server').parentElement).toHaveTextContent('waking up, 2 s');
    expect(screen.getByText(/The server sleeps when nobody is using it/)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('should wake the robot up along with the server', () => {
    const { face, rerender } = renderBoot(WAKING);
    expect(face()).toBe('sleepy');

    rerender(
      <AuthContext.Provider value={auth()}>
        <Boot server={AWAKE} onDone={vi.fn()} />
      </AuthContext.Provider>,
    );

    expect(face()).toBe('happy');
  });

  it('should go in without a server that takes too long', () => {
    const { onDone } = renderBoot(WAKING);

    pass(5000);
    expect(screen.getByText(/Going in without it/)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    pass(1400);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('should hold its checks until the tab is looked at', () => {
    const state = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const { onDone } = renderBoot(AWAKE);

    pass(8000);
    expect(screen.queryByText('Server')).not.toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    state.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    pass(450);

    expect(screen.getByText('Server')).toBeInTheDocument();
    state.mockRestore();
  });

  it('should go in at once on any key', () => {
    const { onDone } = renderBoot(WAKING);

    fireEvent.keyDown(window, { key: 'a' });

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a modifier on its own', { key: 'Control' }],
    ['a browser shortcut', { key: 'r', ctrlKey: true }],
    ['a function key', { key: 'F12' }],
  ])('should not take %s for a key press', (_what, key) => {
    const { onDone } = renderBoot(WAKING);

    fireEvent.keyDown(window, key);

    expect(onDone).not.toHaveBeenCalled();
  });

  it('should go in at once on a tap', () => {
    const { onDone } = renderBoot(WAKING);

    fireEvent.click(screen.getByRole('button', { name: SKIP }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
