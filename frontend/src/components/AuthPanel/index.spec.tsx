import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSignUp = vi.fn();

vi.mock('../../context/authContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    displayName: '',
    signIn: vi.fn(),
    signUp: (...args: unknown[]) => mockSignUp(...args),
    signOut: vi.fn(),
  }),
}));

vi.mock('../../context/StatusContext', () => ({
  useStatus: () => ({ setStatus: vi.fn() }),
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
  });

  it('should offer the tour once the account is created', async () => {
    const onTakeTour = vi.fn();
    render(<AuthPanel onTakeTour={onTakeTour} />);

    const user = await createAccount();

    expect(screen.getByText(/Account created/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Take the tour/i }));

    expect(onTakeTour).toHaveBeenCalledOnce();
  });

  it('should not offer the tour before the account exists', () => {
    render(<AuthPanel onTakeTour={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Take the tour/i })).not.toBeInTheDocument();
  });

  it('should not offer the tour when sign up fails', async () => {
    mockSignUp.mockResolvedValue({ error: 'E-mail already taken.' });
    render(<AuthPanel onTakeTour={vi.fn()} />);

    await createAccount();

    expect(screen.getByText('E-mail already taken.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Take the tour/i })).not.toBeInTheDocument();
  });

  it('should stay silent about the tour when no handler is given', async () => {
    render(<AuthPanel />);

    await createAccount();

    expect(screen.getByText(/Account created/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Take the tour/i })).not.toBeInTheDocument();
  });
});
