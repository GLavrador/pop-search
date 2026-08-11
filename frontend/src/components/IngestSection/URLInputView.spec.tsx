import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { URLInputView } from './URLInputView';

const renderView = (overrides = {}) => {
  const props = {
    url: 'https://x.com/user/status/123',
    onUrlChange: vi.fn(),
    onAnalyze: vi.fn(),
    onOpenManualForm: vi.fn(),
    onCancel: vi.fn(),
    loading: false,
    error: null,
    manualMode: false,
    onManualModeChange: vi.fn(),
    ...overrides,
  };

  render(<URLInputView {...props} />);
  return props;
};

describe('URLInputView analysis options', () => {
  /**
   * With both flags off the AI is never asked for people, scene elements or the
   * transcript, so weight C of the search index is empty on every video. The
   * backend default cannot protect against this, because the form always sends
   * explicit values.
   */
  it('should request a full analysis by default', () => {
    const props = renderView();

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Run Analysis'));

    expect(props.onAnalyze).toHaveBeenCalledWith({
      analyzeScenes: true,
      analyzeAudio: true,
    });
  });

  it('should let the user opt out of either analysis', () => {
    const props = renderView();

    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByLabelText('Audio transcription'));
    fireEvent.click(screen.getByText('Run Analysis'));

    expect(props.onAnalyze).toHaveBeenCalledWith({
      analyzeScenes: true,
      analyzeAudio: false,
    });
  });
});
