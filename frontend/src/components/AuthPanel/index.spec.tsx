import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSignUp = vi.fn();

const mockAuth = {
  isAuthenticated: false,
  displayName: '',
  signIn: vi.fn(),
  signUp: (...args: unknown[]) => mockSignUp(...args),
  signOut: vi.fn(),
};

vi.mock('../../context/authContext', () => ({
  useAuth: () => mockAuth,
}));

vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({ setStatus: vi.fn() }),
}));

vi.mock('../QuotaMeter', () => ({
  QuotaMeter: () => null,
}));

import { AuthPanel } from './index';

const createAccount = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: /No account yet/i }));
  await user.type(screen.getByLabelText('Display name'), 'Maria');
  await user.type(screen.getByLabelText('E-mail'), 'maria@exemplo.com');
  await user.type(screen.getByLabelText('Password'), 'segredo123');
  await user.click(screen.getByRole('button', { name: 'Create Account' }));

  return user;
};

describe('AuthPanel', () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockSignUp.mockResolvedValue({ error: null });
    mockAuth.isAuthenticated = false;
    mockAuth.displayName = '';
  });

  it('should offer the guide from the signed in profile', async () => {
    const user = userEvent.setup();
    mockAuth.isAuthenticated = true;
    mockAuth.displayName = 'Maria';
    const onStartGuide = vi.fn();

    render(<AuthPanel onStartGuide={onStartGuide} />);
    await user.click(screen.getByRole('button', { name: /Open the guide/i }));

    expect(onStartGuide).toHaveBeenCalledOnce();
  });

  it('should offer the guide once the account is created', async () => {
    const onStartGuide = vi.fn();
    render(<AuthPanel onStartGuide={onStartGuide} />);

    const user = await createAccount();

    expect(screen.getByText(/Account created/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show me how it works/i }));

    expect(onStartGuide).toHaveBeenCalledOnce();
  });

  it('should not offer the guide before the account exists', () => {
    render(<AuthPanel onStartGuide={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Show me how it works/i })).not.toBeInTheDocument();
  });

  it('should not offer the guide when sign up fails', async () => {
    mockSignUp.mockResolvedValue({ error: 'E-mail already taken.' });
    render(<AuthPanel onStartGuide={vi.fn()} />);

    await createAccount();

    expect(screen.getByText('E-mail already taken.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show me how it works/i })).not.toBeInTheDocument();
  });

  it('should stay silent about the guide when no handler is given', async () => {
    render(<AuthPanel />);

    await createAccount();

    expect(screen.getByText(/Account created/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show me how it works/i })).not.toBeInTheDocument();
  });
});
