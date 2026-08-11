import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { DemoTour } from './index';
import { DEMO_VIDEO } from '../../constants/demoVideo';

const next = () => fireEvent.click(screen.getByText('Next ▶'));

describe('DemoTour', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start at the first step with Back unavailable', () => {
    render(<DemoTour />);

    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('◀ Back')).toBeDisabled();
  });

  it('should walk through every tab of the app', () => {
    render(<DemoTour />);

    const seen = [screen.getByText(/Welcome/).textContent];
    for (let i = 0; i < 4; i += 1) {
      next();
      seen.push(document.querySelector('h2')?.textContent ?? '');
    }

    expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();
    expect(seen).toHaveLength(5);
  });

  it('should offer to start over on the last step', () => {
    render(<DemoTour />);
    for (let i = 0; i < 4; i += 1) next();

    expect(screen.getByText('↺ Start over')).toBeInTheDocument();

    fireEvent.click(screen.getByText('↺ Start over'));
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('should tell visitors up front that nothing is changed', () => {
    render(<DemoTour />);

    expect(screen.getByText(/changes nothing and calls no AI/)).toBeInTheDocument();
  });
});

describe('DemoTour upload walkthrough', () => {
  const goToUploadStep = () => {
    render(<DemoTour />);
    next();
    next();
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show the example link before anything runs', () => {
    goToUploadStep();

    expect(screen.getByLabelText('Example video URL')).toHaveValue(DEMO_VIDEO.url_original);
  });

  it('should move through analysing and into the review form', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    goToUploadStep();

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
    goToUploadStep();
    fireEvent.click(screen.getByText('Run Analysis'));
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

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
    goToUploadStep();
    fireEvent.click(screen.getByText('Run Analysis'));
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await waitFor(() => expect(screen.getByText('Save')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText(/Nothing was saved/)).toBeInTheDocument());
  });
});
