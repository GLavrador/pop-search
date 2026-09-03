import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const auth = vi.hoisted(() => ({ state: { isAuthenticated: false, isLoading: false } }));

vi.mock('../../context/authContext', () => ({
  useAuth: () => auth.state,
}));

import { WelcomeDialog } from './index';
import { TourProvider } from '../../context/TourProvider';
import { isDemoActive, setDemoActive } from '../../services/demoMode';

const renderDialog = (onSignIn = vi.fn()) => {
  render(
    <TourProvider>
      <WelcomeDialog onSignIn={onSignIn} />
    </TourProvider>
  );
  return onSignIn;
};

describe('WelcomeDialog', () => {
  beforeEach(() => {
    auth.state = { isAuthenticated: false, isLoading: false };
    setDemoActive(false);
  });

  afterEach(() => setDemoActive(false));

  it('should greet a visitor who is not signed in', () => {
    renderDialog();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('What would you like to do first?')).toBeInTheDocument();
  });

  it('should wait for the session to settle before deciding', () => {
    auth.state = { isAuthenticated: false, isLoading: true };

    renderDialog();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should stay out of the way of someone already signed in', () => {
    auth.state = { isAuthenticated: true, isLoading: false };

    renderDialog();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should start the tutorial and step aside', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: /Take the tutorial/ }));

    expect(isDemoActive()).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should hand someone who wants an account to the profile screen', async () => {
    const user = userEvent.setup();
    const onSignIn = renderDialog();

    await user.click(screen.getByRole('button', { name: /Sign in or create an account/ }));

    expect(onSignIn).toHaveBeenCalledOnce();
    expect(isDemoActive()).toBe(false);
  });

  it('should let someone leave without choosing anything', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Look around on my own' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(isDemoActive()).toBe(false);
  });
});
