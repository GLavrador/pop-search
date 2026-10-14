import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LanguageProvider } from '../../../i18n/LanguageProvider';
import { Defrag } from './Defrag';
import { Legend } from './Legend';

const renderDefrag = (props: Partial<Parameters<typeof Defrag>[0]> = {}) => {
  const handlers = { onRescue: vi.fn(), onLegend: vi.fn() };
  render(
    <LanguageProvider>
      <Defrag progress={0.1} ready={false} {...handlers} {...props} />
    </LanguageProvider>,
  );
  return handlers;
};

const bar = () => screen.getByRole('progressbar', { name: 'Defragmenting Drive C' });

describe('the Defragmenter inside the bin', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('pop-search:language', 'en');
  });

  it('should stand stuck at ten percent, with nothing to stop and nothing to pause', () => {
    renderDefrag();

    expect(bar()).toHaveAttribute('aria-valuenow', '10');
    expect(screen.getByText('Defragmenting file system...')).toBeInTheDocument();
    expect(screen.getByText('10% complete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hide Details' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Rescue' })).not.toBeInTheDocument();
  });

  it('should show how far it has got', () => {
    renderDefrag({ progress: 0.437 });

    expect(bar()).toHaveAttribute('aria-valuenow', '44');
    expect(screen.getByText('44% complete')).toBeInTheDocument();
  });

  it('should have the rescue in place of Stop once the goal is reached, and nowhere else', () => {
    const { onRescue } = renderDefrag({ progress: 1, ready: true });

    expect(screen.getByText('Rescue ready.')).toBeInTheDocument();
    expect(screen.getByText('100% complete')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Rescue' }));
    expect(onRescue).toHaveBeenCalledTimes(1);
  });

  it('should open its legend', () => {
    const { onLegend } = renderDefrag();

    fireEvent.click(screen.getByRole('button', { name: 'Legend' }));

    expect(onLegend).toHaveBeenCalledTimes(1);
  });
});

describe('the legend of the Defragmenter', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('pop-search:language', 'en');
  });

  it('should say what each colour on the disk is, and close on its button, its X or Escape', () => {
    const onClose = vi.fn();
    render(
      <LanguageProvider>
        <Legend onClose={onClose} />
      </LanguageProvider>,
    );
    const legend = screen.getByRole('dialog', { name: 'Defrag Legend' });

    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Defragmented data',
      'Data still to be defragmented',
      'Data that was being moved',
      'Forgotten data',
      'Bad (damaged) area of the disk',
      'Free space',
    ]);
    expect(within(legend).getByRole('button', { name: 'Close' })).toHaveFocus();

    fireEvent.click(within(legend).getByRole('button', { name: 'Close' }));
    fireEvent.click(within(legend).getByRole('button', { name: /Close Defrag Legend/ }));
    fireEvent.keyDown(legend, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
