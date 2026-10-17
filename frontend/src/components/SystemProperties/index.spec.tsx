import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RobotContext, type RobotEvent } from '../../context/robotContext';
import { lastSearch, type SearchTrace } from '../../services/searchTrace';
import type { ServerStatus } from '../../hooks/useServerWake';
import type { SystemReport } from '../../types';
import { APP_VERSION } from '../../constants/version';

const getSystem = vi.fn<() => Promise<SystemReport>>();

vi.mock('../../services/api', () => ({
  getSystem: () => getSystem(),
}));

import { SystemProperties } from './index';

const REPORT: SystemReport = {
  version: '0.9.9',
  uptime_seconds: 780,
  python: '3.12.4',
  framework: 'FastAPI 0.123.0',
  downloader: 'yt-dlp 2025.11.12',
  database: { ok: true, ms: 41.3, videos: 1280 },
  ai: {
    analysis_model: 'gemini-2.5-flash',
    embedding_model: 'gemini-embedding-001',
    dimensions: 768,
    questions_kept: 3,
    questions_room: 256,
  },
};

const TRACE: SearchTrace = {
  query: 'whale',
  mode: 'hybrid',
  found: 3,
  roundTripMs: 700,
  embedMs: 412.6,
  dbMs: 95.2,
  serverMs: 520,
};

const AWAKE: ServerStatus = { state: 'awake', tookMs: 34000 };
const notify = vi.fn<(event: RobotEvent) => void>();
const onClose = vi.fn();

const open = (props: { server?: ServerStatus; owner?: string | null } = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RobotContext.Provider value={{ explain: vi.fn(), notify }}>
        <SystemProperties
          server={props.server ?? AWAKE}
          owner={props.owner ?? null}
          onClose={onClose}
        />
      </RobotContext.Provider>
    </QueryClientProvider>,
  );
};

const sheet = (name: string) => fireEvent.click(screen.getByRole('tab', { name }));
const device = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const status = () => screen.getByRole('group', { name: 'Device status' });

const openOnDevices = async () => {
  open();
  await screen.findByText('768 numbers of memory per video');
  sheet('Device Manager');
};

describe('System Properties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSystem.mockResolvedValue(REPORT);
    lastSearch.set(null);
  });

  it('should open as a dialog named after what it shows', () => {
    open();

    expect(screen.getByRole('dialog', { name: 'System Properties' })).toHaveFocus();
  });

  it('should close on its X and on OK', () => {
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Close System Properties' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  describe('General', () => {
    it('should say what the program runs on and how many videos it keeps', async () => {
      open();

      expect(screen.getByText(`Pop Search ${APP_VERSION}`)).toBeInTheDocument();
      expect(await screen.findByText('768 numbers of memory per video')).toBeInTheDocument();
      expect(screen.getByText('Gemini (gemini-2.5-flash)')).toBeInTheDocument();
      expect(screen.getByText('1,280 videos in the archive')).toBeInTheDocument();
    });

    it('should be registered to whoever is signed in, or to a visitor', async () => {
      open({ owner: 'Ana' });

      expect(screen.getByText('Ana')).toBeInTheDocument();
      expect(screen.queryByText('Visitor')).not.toBeInTheDocument();
    });

    it('should say it is asking while the server has not answered', () => {
      getSystem.mockReturnValue(new Promise(() => {}));
      open();

      expect(screen.getByText('Visitor')).toBeInTheDocument();
      expect(screen.getByText(`Pop Search ${APP_VERSION}`)).toBeInTheDocument();
      expect(screen.getAllByText('asking the server...')).toHaveLength(1);
    });

    it('should say so when the server does not answer', async () => {
      getSystem.mockRejectedValue(new Error('down'));
      open();

      expect(await screen.findAllByText('the server did not answer')).toHaveLength(1);
    });
  });

  describe('Device Manager', () => {
    it('should list every part the program is made of', async () => {
      await openOnDevices();

      const listed = screen
        .getAllByRole('listitem')
        .map((item) => item.textContent?.replace(/[^\w :.,()-]/g, '').trim());
      expect(listed).toEqual([
        expect.stringMatching(/^Monitor: Your browser, running React \d+/),
        'Ports: FastAPI server, on Render',
        'Disk drives: Postgres with pgvector, on Supabase',
        'Processor: Gemini (gemini-2.5-flash)',
        'Coprocessor: Gemini (gemini-embedding-001)',
        'Modem: yt-dlp 2025.11.12',
        'Other devices: BIP-98',
      ]);
    });

    it('should start on the server, with how long it took to wake, how long it has been on and its version', async () => {
      await openOnDevices();

      expect(status()).toHaveTextContent('This device is working properly.');
      expect(status()).toHaveTextContent('Took 34 s to answer on this visit.');
      expect(status()).toHaveTextContent('On for 13 min.');
      expect(status()).toHaveTextContent('Python 3.12.4, FastAPI 0.123.0.');
      expect(status()).toHaveTextContent('Version 0.9.9.');
    });

    it('should say the server is still waking up while it is', () => {
      getSystem.mockReturnValue(new Promise(() => {}));
      open({ server: { state: 'waking', tookMs: null } });
      sheet('Device Manager');

      expect(status()).toHaveTextContent('This device is still waking up.');
    });

    it('should say the server is not answering once it is given up on', () => {
      getSystem.mockRejectedValue(new Error('down'));
      open({ server: { state: 'down', tookMs: null } });
      sheet('Device Manager');

      expect(status()).toHaveTextContent('This device is not answering.');
    });

    it('should say how many videos the database keeps and how fast it answered', async () => {
      await openOnDevices();

      device(/Disk drives/);

      expect(status()).toHaveTextContent('This device is working properly.');
      expect(status()).toHaveTextContent('1,280 videos kept.');
      expect(status()).toHaveTextContent('Answered in 41 ms.');
    });

    it('should say the database is not answering when the server could not reach it', async () => {
      getSystem.mockResolvedValue({ ...REPORT, database: { ok: false, ms: null, videos: null } });
      await openOnDevices();

      device(/Disk drives/);

      expect(status()).toHaveTextContent('This device is not answering.');
      expect(status()).not.toHaveTextContent('videos kept');
    });

    it('should not claim that a part nobody tested is working', async () => {
      await openOnDevices();

      device(/Processor/);

      expect(status()).toHaveTextContent('installed and waiting for work. It is not tested from here.');
      expect(status()).not.toHaveTextContent('working properly');
    });

    it('should say how many questions are answered from memory', async () => {
      await openOnDevices();

      device(/Coprocessor/);

      expect(status()).toHaveTextContent('Turns a text into 768 numbers.');
      expect(status()).toHaveTextContent('3 of the last 256 questions are in memory');
    });

    it('should say nothing of the parts behind a server that did not answer', async () => {
      getSystem.mockRejectedValue(new Error('down'));
      open();
      await screen.findAllByText('the server did not answer');
      sheet('Device Manager');

      device(/Disk drives/);

      expect(status()).toHaveTextContent('The server did not say how this device is doing.');
    });

    it('should drop what an earlier answer said once the server stops answering', async () => {
      await openOnDevices();
      device(/Disk drives/);
      getSystem.mockRejectedValue(new Error('down'));

      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

      await waitFor(() =>
        expect(status()).toHaveTextContent('The server did not say how this device is doing.'),
      );
      expect(status()).not.toHaveTextContent('videos kept');
    });

    it('should ask the server again on Refresh', async () => {
      await openOnDevices();
      getSystem.mockResolvedValue({ ...REPORT, database: { ok: true, ms: 12, videos: 1281 } });

      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
      device(/Disk drives/);

      await waitFor(() => expect(status()).toHaveTextContent('1,281 videos kept.'));
      expect(getSystem).toHaveBeenCalledTimes(2);
    });

    it('should refuse to remove a part, and say why', async () => {
      await openOnDevices();
      device(/Disk drives/);

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect(status()).toHaveTextContent('Every video lives in there. Not a chance.');
      expect(notify).toHaveBeenCalledWith({ kind: 'pressed', what: 'removeDevice' });

      device(/Modem/);

      expect(status()).not.toHaveTextContent('Not a chance');
    });

    it('should have the robot take it personally when it is the one to be removed', async () => {
      await openOnDevices();

      device(/Other devices/);

      expect(status()).toHaveTextContent('No driver is installed for this device. It works anyway.');
      expect(notify).toHaveBeenCalledWith({ kind: 'pressed', what: 'deviceRobot' });

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect(status()).toHaveTextContent('The device refused to be removed.');
      expect(notify).toHaveBeenLastCalledWith({ kind: 'pressed', what: 'removeRobot' });
    });
  });

  describe('Performance', () => {
    const steps = () =>
      screen.getAllByRole('listitem').map((item) => item.textContent?.replace(/\s+/g, ' '));

    it('should ask for a search when none was made yet', () => {
      open();
      sheet('Performance');

      expect(screen.getByText(/No search yet on this visit/)).toBeInTheDocument();
    });

    it('should break the last search down into its steps', () => {
      lastSearch.set(TRACE);
      open();
      sheet('Performance');

      expect(screen.getByText('Last search: "whale" (Hybrid)')).toBeInTheDocument();
      expect(screen.getByText('3 results')).toBeInTheDocument();
      expect(steps()).toEqual([
        'Understanding the question (AI)413 ms',
        'Looking through the archive (database)95 ms',
        'Rest of the server12 ms',
        'The way there and back180 ms',
      ]);
      expect(screen.getByText('From the click to the answer').parentElement).toHaveTextContent(
        '700 ms',
      );
    });

    it('should say the AI was skipped in a search that did not use it', () => {
      lastSearch.set({ ...TRACE, mode: 'text', embedMs: null, serverMs: 110 });
      open();
      sheet('Performance');

      expect(steps()[0]).toBe(
        'Understanding the question (AI)skipped: this mode does not use the AI',
      );
      expect(screen.queryByText(/not sent to the AI again/)).not.toBeInTheDocument();
    });

    it('should give the whole trip alone when the server reports no steps', () => {
      lastSearch.set({ ...TRACE, embedMs: null, dbMs: null, serverMs: null });
      open();
      sheet('Performance');

      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
      expect(screen.getByText('This server does not say how long each step took.')).toBeInTheDocument();
      expect(screen.getByText('From the click to the answer').parentElement).toHaveTextContent(
        '700 ms',
      );
    });

    it('should show a search that comes back while it is open', () => {
      open();
      sheet('Performance');

      act(() => lastSearch.set({ ...TRACE, query: 'giraffe', found: 1 }));

      expect(screen.getByText('Last search: "giraffe" (Hybrid)')).toBeInTheDocument();
      expect(screen.getByText('1 result')).toBeInTheDocument();
    });
  });
});
