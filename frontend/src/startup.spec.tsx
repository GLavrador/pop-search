import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockGetSession = vi.fn();
const pingServer = vi.fn();
const pace = vi.hoisted(() => ({ value: 0.002 }));

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('./constants/startup', async (original) => ({
  ...(await original<typeof import('./constants/startup')>()),
  BOOT_LINE_EVERY_MS: 5,
  BOOT_PATIENCE_MS: 150,
  BOOT_LEAVE_MS: 10,
  BOOT_LEAVE_UNANSWERED_MS: 20,
}));

vi.mock('./constants/rebuild', () => ({
  get REBUILD_PACE() {
    return pace.value;
  },
  SWALLOW_MS: 20,
}));

vi.mock('./services/api', () => ({
  pingServer: (...args: unknown[]) => pingServer(...args),
  getIsAdmin: vi.fn().mockResolvedValue(false),
  getMyVideos: vi.fn().mockResolvedValue([]),
  getAdminStats: vi.fn(),
  getMyQuota: vi.fn(),
  saveVideo: vi.fn(),
  lookUpPost: vi.fn().mockResolvedValue(null),
  startAnalysis: vi.fn(),
  getAnalysis: vi.fn().mockResolvedValue(null),
  discardAnalysis: vi.fn().mockResolvedValue(undefined),
  searchVideos: vi.fn(),
  getAllUsage: vi.fn(),
}));

import App from './App';

const BOOTED = 'pop-search:booted';
const BIOS = 'Pop Search BIOS 1.0';
const BUILDING = 'A robot is building the desktop from nothing.';
const SEARCH_TAB = 'Search.exe';

const renderApp = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
};

const frame = () => document.querySelector('[data-robot="window"]') as HTMLElement;
const building = () => document.querySelector('[data-rebuild]');
const theRobot = () => screen.queryByRole('button', { name: 'Poke BIP-98' });
const unbuilt = () => document.querySelectorAll('[data-robot="icon"][data-built]');

const expectDesktopReady = () => {
  expect(building()).toBeNull();
  expect(screen.queryByText(BUILDING, { exact: false })).not.toBeInTheDocument();
  expect(unbuilt()).toHaveLength(0);
  expect(document.querySelector('[data-robot="taskbar"]')).not.toHaveAttribute('data-start');
  expect(frame()).toHaveAttribute('aria-hidden', 'false');
  expect(theRobot()).toBeInTheDocument();
  expect(sessionStorage.getItem(BOOTED)).not.toBeNull();
};

const askForLessMovement = () =>
  vi
    .spyOn(window, 'matchMedia')
    .mockImplementation(
      (media) => ({ matches: media.includes('reduce'), media }) as unknown as MediaQueryList,
    );

describe('starting up', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    pingServer.mockResolvedValue(undefined);
    pace.value = 0.002;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('in a tab that has not started yet', () => {
    beforeEach(() => {
      sessionStorage.removeItem(BOOTED);
    });

    it('should open on a blue screen with nothing but the name of the program on it', async () => {
      pace.value = 1;
      renderApp();

      const blue = document.querySelector('[aria-hidden="true"][class*="tile"]') as HTMLElement;
      expect(blue).toHaveTextContent(/^Pop Search$/);
      expect(screen.getByRole('status')).toHaveTextContent(BUILDING);
      expect(screen.queryByText(BIOS)).not.toBeInTheDocument();
      expect(unbuilt()).toHaveLength(4);
      expect(document.querySelector('[data-robot="taskbar"]')).toHaveAttribute('data-start', 'none');
      expect(document.querySelector('[data-robot="clock"]')).toBeNull();
      expect(frame()).toHaveAttribute('aria-hidden', 'true');
      expect(theRobot()).not.toBeInTheDocument();
      expect(sessionStorage.getItem(BOOTED)).toBeNull();
    });

    it('should leave the desktop, not the colour of the first paint, behind the blue', () => {
      pace.value = 1;
      document.documentElement.dataset.boot = 'setup';

      renderApp();

      expect(building()).not.toBeNull();
      expect(document.documentElement).not.toHaveAttribute('data-boot');
    });

    it('should have the robot caught unready by the visit, and ask for a moment to tidy up', async () => {
      pace.value = 0.2;
      renderApp();

      expect(
        await screen.findByText('Goodness, a visitor! Nothing is ready!', {}, { timeout: 3000 }),
      ).toBeInTheDocument();
      expect(
        await screen.findByText(/Come on in, I will just tidy up/, {}, { timeout: 3000 }),
      ).toBeInTheDocument();
    });

    it('should have the robot build the desktop and leave the program open', async () => {
      renderApp();

      await waitFor(() => expect(building()).toBeNull(), {
        timeout: 12000,
        mutationObserverOptions: { childList: true },
      });

      expectDesktopReady();
    }, 15000);

    it('should go straight to the desktop on any key', () => {
      pace.value = 1;
      renderApp();

      fireEvent.keyDown(window, { key: 'a' });

      expectDesktopReady();
    });

    it('should go straight to the desktop on a click anywhere', () => {
      pace.value = 1;
      renderApp();

      fireEvent.click(building() as Element);

      expectDesktopReady();
    });

    it('should start on the boot screen instead for whoever asked for less movement', async () => {
      askForLessMovement();
      renderApp();

      expect(screen.getByText(BIOS)).toBeInTheDocument();
      expect(building()).toBeNull();
      expect(screen.queryByText(SEARCH_TAB)).not.toBeInTheDocument();

      expect(await screen.findByText(SEARCH_TAB)).toBeInTheDocument();
      expect(screen.queryByText(BIOS)).not.toBeInTheDocument();
      expect(building()).toBeNull();
      expect(sessionStorage.getItem(BOOTED)).not.toBeNull();
    });

    it('should let a key skip the boot screen while the server sleeps', () => {
      askForLessMovement();
      pingServer.mockReturnValue(new Promise<void>(() => {}));
      renderApp();
      expect(screen.getByText(BIOS)).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Enter' });

      expect(screen.getByText(SEARCH_TAB)).toBeInTheDocument();
      expect(screen.queryByText(BIOS)).not.toBeInTheDocument();
    });
  });

  it('should go straight to the desktop in a tab that has already started', () => {
    renderApp();

    expect(screen.getByText(SEARCH_TAB)).toBeInTheDocument();
    expect(screen.queryByText(BIOS)).not.toBeInTheDocument();
    expect(building()).toBeNull();
    expect(frame()).toHaveAttribute('aria-hidden', 'false');
  });
});
