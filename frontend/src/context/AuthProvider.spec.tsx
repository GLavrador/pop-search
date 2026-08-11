import { useState } from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: (cb: unknown) => mockOnAuthStateChange(cb),
      signInWithPassword: (args: unknown) => mockSignInWithPassword(args),
      signUp: (args: unknown) => mockSignUp(args),
      signOut: () => mockSignOut(),
    },
  },
}));

import { AuthProvider } from './AuthProvider';
import { useAuth } from './authContext';

const session = (overrides = {}) =>
  ({
    access_token: 'token-abc',
    user: { email: 'ana@example.com', user_metadata: {} },
    ...overrides,
  }) as unknown as Session;

const Probe = () => {
  const { isLoading, isAuthenticated, displayName, signIn, signUp } = useAuth();
  const [lastError, setLastError] = useState<string>('-');

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="name">{displayName ?? '-'}</span>
      <span data-testid="error">{lastError}</span>
      <button
        onClick={async () => setLastError((await signIn('ana@example.com', 'pw')).error ?? 'none')}
      >
        do-sign-in
      </button>
      <button
        onClick={async () =>
          setLastError((await signUp('ana@example.com', 'secret123', 'Ana Lima')).error ?? 'none')
        }
      >
        do-sign-up
      </button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

const settled = () =>
  waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('should start loading and settle to signed out', async () => {
    renderProvider();

    await settled();
    expect(screen.getByTestId('authed')).toHaveTextContent('false');
  });

  it('should restore a stored session on startup', async () => {
    mockGetSession.mockResolvedValue({ data: { session: session() } });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));
  });

  it('should prefer the display name over the e-mail local part', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: session({
          user: { email: 'ana@example.com', user_metadata: { display_name: 'Ana Lima' } },
        }),
      },
    });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Ana Lima'));
  });

  it('should fall back to the e-mail local part when there is no display name', async () => {
    mockGetSession.mockResolvedValue({ data: { session: session() } });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('ana'));
  });

  it('should follow a background token refresh', async () => {
    renderProvider();
    await settled();

    const listener = mockOnAuthStateChange.mock.calls[0][0] as (
      event: string,
      next: Session | null,
    ) => void;
    act(() => listener('TOKEN_REFRESHED', session()));

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));
  });

  it('should unsubscribe from auth events on unmount', async () => {
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });

    const { unmount } = renderProvider();
    await settled();
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  describe('error messages', () => {
    it('should rewrite the credentials error into something a user can act on', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
      renderProvider();
      await settled();

      fireEvent.click(screen.getByText('do-sign-in'));

      await waitFor(() =>
        expect(screen.getByTestId('error')).toHaveTextContent('Wrong e-mail or password.'),
      );
    });

    it('should pass through an error it does not recognise', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: 'Service unavailable' } });
      renderProvider();
      await settled();

      fireEvent.click(screen.getByText('do-sign-in'));

      await waitFor(() =>
        expect(screen.getByTestId('error')).toHaveTextContent('Service unavailable'),
      );
    });

    it('should report success as no error', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      renderProvider();
      await settled();

      fireEvent.click(screen.getByText('do-sign-in'));

      await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('none'));
    });
  });

  it('should send the display name so the profile trigger can use it', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    renderProvider();
    await settled();

    fireEvent.click(screen.getByText('do-sign-up'));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'secret123',
        options: { data: { display_name: 'Ana Lima' } },
      }),
    );
  });
});
