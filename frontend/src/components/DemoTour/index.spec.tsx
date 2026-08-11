import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { DemoTour } from './index';
import { StatusProvider } from '../../context/StatusContext';
import { DEMO_VIDEO, DEMO_SEARCH_RESULTS } from '../../constants/demoVideo';

const TOTAL_STEPS = 6;

// VideoCard, reused by the search example, reads the status bar context.
const renderTour = () =>
  render(
    <StatusProvider>
      <DemoTour />
    </StatusProvider>,
  );

const next = () => fireEvent.click(screen.getByText('Next ▶'));

const goToStep = (index: number) => {
  renderTour();
  for (let i = 0; i < index; i += 1) next();
};

describe('DemoTour', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start at the first step with Back unavailable', () => {
    renderTour();

    expect(screen.getByText(`Step 1 of ${TOTAL_STEPS}`)).toBeInTheDocument();
    expect(screen.getByText('◀ Back')).toBeDisabled();
  });

  it('should walk through every tab of the app', () => {
    renderTour();

    for (let i = 0; i < TOTAL_STEPS - 1; i += 1) next();

    expect(screen.getByText(`Step ${TOTAL_STEPS} of ${TOTAL_STEPS}`)).toBeInTheDocument();
  });

  it('should offer to start over on the last step', () => {
    goToStep(TOTAL_STEPS - 1);

    fireEvent.click(screen.getByText('↺ Start over'));

    expect(screen.getByText(`Step 1 of ${TOTAL_STEPS}`)).toBeInTheDocument();
  });

  it('should promise up front that nothing is stored and nothing is billed', () => {
    renderTour();

    expect(screen.getByText(/Nothing here is saved, and no AI is called/)).toBeInTheDocument();
  });

  it('should cover manual entry as the way around the limit', () => {
    goToStep(3);

    expect(screen.getByText('Adding without the AI')).toBeInTheDocument();
    expect(screen.getByText(/do not count against the monthly limit/)).toBeInTheDocument();
  });
});

describe('DemoTour search example', () => {
  it('should only show results once the search is run', () => {
    goToStep(1);

    expect(screen.queryByText(DEMO_SEARCH_RESULTS[0].titulo_video)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Find Now'));

    expect(screen.getByText(DEMO_SEARCH_RESULTS[0].titulo_video)).toBeInTheDocument();
  });

  it('should demonstrate all three match origins in one search', () => {
    goToStep(1);
    fireEvent.click(screen.getByText('Find Now'));

    expect(screen.getByText('meaning + words')).toBeInTheDocument();
    expect(screen.getByText('meaning')).toBeInTheDocument();
    expect(screen.getByText('words')).toBeInTheDocument();
  });
});

describe('DemoTour upload walkthrough', () => {
  const goToUpload = () => goToStep(2);

  afterEach(() => {
    vi.useRealTimers();
  });

  const runAnalysis = async () => {
    fireEvent.click(screen.getByText('Run Analysis'));
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
  };

  it('should show the example link before anything runs', () => {
    goToUpload();

    expect(screen.getByLabelText('Example video URL')).toHaveValue(DEMO_VIDEO.url_original);
  });

  it('should move through analysing and into the review form', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    goToUpload();

    fireEvent.click(screen.getByText('Run Analysis'));
    expect(screen.getByText(/the AI watches the video/)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() =>
      expect(screen.getByText(/you review what the AI wrote/)).toBeInTheDocument(),
    );
  });

  it('should prefill the review form with the captured analysis', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    goToUpload();
    await runAnalysis();

    await waitFor(() =>
      expect(screen.getByDisplayValue(DEMO_VIDEO.titulo_sugerido)).toBeInTheDocument(),
    );

    // The form takes the scene list as text, so the array has to be joined.
    expect(screen.getByDisplayValue('Terra, Gato, Língua, Espaço')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(DEMO_VIDEO.metadados_estruturados.audio.artista!),
    ).toBeInTheDocument();
  });

  it('should make clear that saving did nothing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    goToUpload();
    await runAnalysis();
    await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText(/Nothing was saved/)).toBeInTheDocument());
  });
});
