import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { PrecisionPresets } from './index';

describe('PrecisionPresets Component', () => {
  it('should render every preset button', () => {
    render(<PrecisionPresets threshold={0.6} onThresholdChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Broad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Balanced' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Precise' })).toBeInTheDocument();
  });

  it('should mark only the matching preset as pressed', () => {
    render(<PrecisionPresets threshold={0.75} onThresholdChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Precise' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Broad' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Balanced' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('should report the preset threshold when clicked', () => {
    const onThresholdChange = vi.fn();
    render(<PrecisionPresets threshold={0.6} onThresholdChange={onThresholdChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Precise' }));

    expect(onThresholdChange).toHaveBeenCalledWith(0.75);
  });

  it('should fall back to the Custom label for an off-preset threshold', () => {
    render(<PrecisionPresets threshold={0.52} onThresholdChange={vi.fn()} />);

    expect(screen.getByText('Custom (52%)')).toBeInTheDocument();
    for (const label of ['Broad', 'Balanced', 'Precise']) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('should not show the Custom label while a preset is active', () => {
    render(<PrecisionPresets threshold={0.45} onThresholdChange={vi.fn()} />);

    expect(screen.queryByText(/^Custom/)).not.toBeInTheDocument();
  });

  it('should disable the buttons while a search is running', () => {
    const onThresholdChange = vi.fn();
    render(
      <PrecisionPresets threshold={0.6} onThresholdChange={onThresholdChange} disabled />,
    );

    const broad = screen.getByRole('button', { name: 'Broad' });
    expect(broad).toBeDisabled();

    fireEvent.click(broad);
    expect(onThresholdChange).not.toHaveBeenCalled();
  });
});
