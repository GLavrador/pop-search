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

vi.mock('../../context/status', () => ({
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

  it('should keep the nudge towards the guide for once the account is created', () => {
    render(<AuthPanel onStartGuide={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /Show me how it works/i })).not.toBeInTheDocument();
  });

  it('should offer the guide to a visitor from the sign in form', async () => {
    const user = userEvent.setup();
    const onStartGuide = vi.fn();
    render(<AuthPanel onStartGuide={onStartGuide} />);

    await user.click(screen.getByRole('button', { name: '► Open the guide' }));

    expect(onStartGuide).toHaveBeenCalledOnce();
  });

  it('should let a visitor switch the invitation to the guide off and back on', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const view = render(<AuthPanel onStartGuide={vi.fn()} invite={{ on: true, onChange }} />);
    const invited = () =>
      screen.getByRole('checkbox', { name: 'Invite me to the guide every time Pop Search opens' });

    expect(invited()).toBeChecked();
    await user.click(invited());
    expect(onChange).toHaveBeenLastCalledWith(false);

    view.rerender(<AuthPanel onStartGuide={vi.fn()} invite={{ on: false, onChange }} />);

    expect(invited()).not.toBeChecked();
    await user.click(invited());
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('should give a signed in account no switch for an invitation it never gets', () => {
    mockAuth.isAuthenticated = true;
    render(<AuthPanel onStartGuide={vi.fn()} invite={{ on: true, onChange: vi.fn() }} />);

    expect(screen.getByRole('button', { name: '► Open the guide' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
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
