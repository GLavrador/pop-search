import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Taskbar } from './index';

const bar = () => document.querySelector('[data-robot="taskbar"]') as HTMLElement;
const clock = () => document.querySelector('[data-robot="clock"]');

describe('Taskbar', () => {
  it('should turn the sound off and on from the tray, and remember it', () => {
    localStorage.clear();
    render(<Taskbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Turn the sound off' }));

    expect(screen.getByRole('button', { name: 'Turn the sound on' })).toBeInTheDocument();
    expect(localStorage.getItem('pop-search:sound-off')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Turn the sound on' }));

    expect(screen.getByRole('button', { name: 'Turn the sound off' })).toBeInTheDocument();
    expect(localStorage.getItem('pop-search:sound-off')).toBeNull();
  });

  it('should show the time and stay where it belongs when nothing is being rebuilt', () => {
    render(<Taskbar />);

    expect(clock()).toHaveTextContent(/^\d{1,2}:\d{2}/);
    expect(bar().style.transform).toBe('');
    expect(bar()).not.toHaveAttribute('inert');
  });

  it('should sit as far under the edge of the screen as it is told', () => {
    render(<Taskbar sunk={{ by: 0.86, ms: 250 }} />);

    expect(bar()).toHaveStyle({ transform: 'translateY(86%)' });
  });

  it.each([
    ['frame', '--:--'],
    ['blank', '--:--'],
    ['unset', '12:00'],
  ] as const)('should show a clock that is still being built (%s)', (state, text) => {
    render(<Taskbar clock={state} />);

    expect(clock()).toHaveTextContent(text);
  });

  it('should keep the place of a Start button that has not been put on yet', () => {
    render(<Taskbar start={false} />);

    expect(bar()).toHaveAttribute('data-start', 'none');
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('should mark the Start button as new only while the bar is being put together', () => {
    const { rerender } = render(<Taskbar frozen />);
    expect(bar()).toHaveAttribute('data-start', 'new');

    rerender(<Taskbar />);
    expect(bar()).not.toHaveAttribute('data-start');
  });

  it('should have no clock at all before one is built', () => {
    render(<Taskbar clock="none" />);

    expect(clock()).not.toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
  });
});
