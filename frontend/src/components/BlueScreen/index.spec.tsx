import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BlueScreen } from './index';

let broken: Error | null = null;

const Program = () => {
  if (broken) throw broken;
  return <p>the program</p>;
};

const renderProgram = () => {
  const reload = vi.fn();
  render(
    <BlueScreen reload={reload}>
      <Program />
    </BlueScreen>,
  );
  return { reload };
};

const anyKey = () => fireEvent.keyDown(window, { key: 'a' });

describe('BlueScreen', () => {
  beforeEach(() => {
    broken = null;
    // React reports every error a boundary catches.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should stay out of the way while the program works', () => {
    renderProgram();

    expect(screen.getByText('the program')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should take the place of a program that crashed, and say what the error was', () => {
    broken = new TypeError('the list is not a list');

    renderProgram();

    expect(screen.queryByText('the program')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'A fatal error has occurred and Pop Search had to stop:',
    );
    expect(screen.getByText('TypeError: the list is not a list')).toBeInTheDocument();
    expect(screen.getByText('Press any key to restart Pop Search.')).toBeInTheDocument();
    expect(screen.getByText(/I will switch it all back on/)).toBeInTheDocument();
  });

  it('should leave the name out of an error that has none of its own', () => {
    broken = new Error('nothing to show');

    renderProgram();

    expect(screen.getByText('nothing to show')).toBeInTheDocument();
  });

  it('should open the program again on any key', () => {
    broken = new Error('once');
    renderProgram();
    broken = null;

    anyKey();

    expect(screen.getByText('the program')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should tell the program how many times it has been restarted', () => {
    broken = new Error('once');
    render(
      <BlueScreen>
        {(restarts) => (
          <>
            <Program />
            <p>restarted {restarts} times</p>
          </>
        )}
      </BlueScreen>,
    );
    broken = null;

    anyKey();

    expect(screen.getByText('restarted 1 times')).toBeInTheDocument();
  });

  it('should open the program again on a click', () => {
    broken = new Error('once');
    renderProgram();
    broken = null;

    fireEvent.click(screen.getByRole('button', { name: /Press any key to continue/ }));

    expect(screen.getByText('the program')).toBeInTheDocument();
  });

  it.each([
    ['a key still held down from before', { key: 'Enter', repeat: true }],
    ['a browser shortcut', { key: 'r', ctrlKey: true }],
    ['a function key', { key: 'F12' }],
  ])('should not take %s for an answer', (_what, key) => {
    broken = new Error('once');
    renderProgram();
    broken = null;

    fireEvent.keyDown(window, key);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should offer to reload the page when the crash comes straight back', () => {
    broken = new Error('every time');
    const { reload } = renderProgram();

    anyKey();

    expect(screen.getByText('The error came back right after restarting.')).toBeInTheDocument();
    expect(screen.getByText('Press any key to reload the whole page.')).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();

    anyKey();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
