import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Dialog } from './index';
import { GroupBox } from './GroupBox';
import { OwnerContext } from './owner';

const onClose = vi.fn();

const dialog = (shown = true) => (
  <OwnerContext.Provider value={shown}>
    <button type="button">opener</button>
    <Dialog title="Properties" onClose={onClose} footer={<button type="button">More</button>}>
      <GroupBox legend="Status">
        <p>All is well.</p>
      </GroupBox>
    </Dialog>
  </OwnerContext.Provider>
);

describe('a dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be named after its title, and frame what it is given', () => {
    render(dialog());

    const box = screen.getByRole('dialog', { name: 'Properties' });
    expect(box).toHaveTextContent('All is well.');
    expect(screen.getByRole('group', { name: 'Status' })).toHaveTextContent('All is well.');
    expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
  });

  it('should take the keyboard when it opens, and give it back when it goes', () => {
    const page = (open: boolean) => (
      <>
        <button type="button">opener</button>
        {open && (
          <Dialog title="Properties" onClose={onClose}>
            <p>All is well.</p>
          </Dialog>
        )}
      </>
    );
    const view = render(page(false));
    screen.getByRole('button', { name: 'opener' }).focus();

    view.rerender(page(true));

    expect(screen.getByRole('dialog')).toHaveFocus();

    view.rerender(page(false));

    expect(screen.getByRole('button', { name: 'opener' })).toHaveFocus();
  });

  it('should close on its X, on OK and on Escape', () => {
    render(dialog());

    fireEvent.click(screen.getByRole('button', { name: 'Close Properties' }));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('should follow the pointer when dragged by its title bar, and stop when let go', () => {
    render(dialog());
    const bar = screen.getByText('Properties');

    fireEvent.pointerDown(bar, { button: 0, clientX: 300, clientY: 100 });
    fireEvent.pointerMove(bar, { clientX: 400, clientY: 150 });
    fireEvent.pointerUp(bar);
    fireEvent.pointerMove(bar, { clientX: 900, clientY: 600 });

    expect(screen.getByRole('dialog')).toHaveStyle({
      transform: 'translate(calc(-50% + 100px), 50px)',
    });
  });

  it('should not take a press on its X for the start of a drag', () => {
    render(dialog());
    const close = screen.getByRole('button', { name: 'Close Properties' });

    fireEvent.pointerDown(close, { button: 0, clientX: 300, clientY: 100 });
    fireEvent.pointerMove(close, { clientX: 400, clientY: 150 });

    expect(screen.getByRole('dialog')).toHaveStyle({ transform: 'translate(calc(-50% + 0px), 0px)' });
  });

  it('should go when the window it belongs to leaves the screen', () => {
    const view = render(dialog());
    expect(onClose).not.toHaveBeenCalled();

    view.rerender(dialog(false));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
