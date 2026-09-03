import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { TourProvider } from './TourProvider';
import { useTour } from './tourContext';
import { TourGuide } from '../components/TourGuide';
import { SearchAssistant } from '../components/SearchAssistant';
import { isDemoActive, setDemoActive } from '../services/demoMode';
import { buildTourFrames } from '../constants/tourScript';
import { en } from '../i18n/en';

const FRAMES = buildTourFrames(en.tour.script);

const Probe = () => {
  const { active, frame, start } = useTour();

  return (
    <div>
      <button type="button" onClick={start}>
        start
      </button>
      <span data-testid="tab">{frame?.tab ?? 'none'}</span>
      <span data-testid="active">{String(active)}</span>
    </div>
  );
};

const renderTour = () =>
  render(
    <TourProvider>
      <Probe />
      <TourGuide />
    </TourProvider>
  );

const advance = async (user: ReturnType<typeof userEvent.setup>, times: number) => {
  for (let step = 0; step < times; step += 1) {
    await user.click(screen.getByRole('button', { name: 'Next' }));
  }
};

describe('TourProvider', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setDemoActive(false);
  });

  afterEach(() => setDemoActive(false));

  it('should show nothing until the tutorial starts', () => {
    renderTour();

    expect(screen.getByTestId('active')).toHaveTextContent('false');
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('should turn the examples on with the tutorial and off again at the end', async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole('button', { name: 'start' }));
    expect(isDemoActive()).toBe(true);

    await advance(user, FRAMES.length - 1);
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(isDemoActive()).toBe(false);
    expect(screen.getByTestId('active')).toHaveTextContent('false');
  });

  it('should open on the first card of the script', async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole('button', { name: 'start' }));

    expect(screen.getByText(FRAMES[0].text)).toBeInTheDocument();
    expect(screen.getByTestId('tab')).toHaveTextContent(FRAMES[0].tab);
  });

  it('should move the tab along when the step changes', async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole('button', { name: 'start' }));
    const firstIngest = FRAMES.findIndex((frame) => frame.tab === 'ingest');

    await advance(user, firstIngest);

    expect(screen.getByTestId('tab')).toHaveTextContent('ingest');
  });

  it('should refuse to go back from the very first card', async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole('button', { name: 'start' }));

    expect(screen.getByRole('button', { name: 'Previous tip' })).toBeDisabled();
  });

  it('should walk back to where it came from', async () => {
    const user = userEvent.setup();
    renderTour();

    await user.click(screen.getByRole('button', { name: 'start' }));
    await advance(user, 3);
    await user.click(screen.getByRole('button', { name: 'Previous tip' }));

    expect(screen.getByText(FRAMES[2].text)).toBeInTheDocument();
  });

  it('should leave only one voice on screen while it runs', async () => {
    const user = userEvent.setup();
    render(
      <TourProvider>
        <Probe />
        <TourGuide />
        <SearchAssistant
          query=""
          mode="hybrid"
          threshold={0.6}
          hasSearched={false}
          isLoading={false}
          results={[]}
        />
      </TourProvider>
    );

    expect(screen.getByText(/I am the Pop Search assistant/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'start' }));

    expect(screen.queryByText(/I am the Pop Search assistant/)).not.toBeInTheDocument();
    expect(screen.getByText(FRAMES[0].text)).toBeInTheDocument();
  });
});
