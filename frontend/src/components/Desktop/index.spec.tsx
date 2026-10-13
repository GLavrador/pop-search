import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RobotContext, type RobotEvent } from '../../context/robotContext';
import { Desktop } from './index';

const notify = vi.fn<(event: RobotEvent) => void>();

const renderDesktop = (props: Partial<Parameters<typeof Desktop>[0]> = {}) => {
  const onOpenApp = vi.fn();
  const onTrashApp = vi.fn();
  render(
    <RobotContext.Provider value={{ explain: vi.fn(), notify }}>
      <Desktop
        appIcon="💻"
        appLabel="Pop Search"
        onOpenApp={onOpenApp}
        onTrashApp={onTrashApp}
        {...props}
      />
    </RobotContext.Provider>,
  );
  return { onOpenApp, onTrashApp };
};

const APP = /Pop Search/;

const icon = (name: string | RegExp) => screen.getByRole('button', { name });

// jsdom lays nothing out, so the bin is given a place on the screen.
const putBinAt = (left: number, top: number) =>
  vi.spyOn(icon('Recycle Bin'), 'getBoundingClientRect').mockReturnValue({
    left,
    top,
    right: left + 76,
    bottom: top + 60,
    width: 76,
    height: 60,
  } as DOMRect);

const pick = (name: string | RegExp) =>
  fireEvent.pointerDown(icon(name), { button: 0, clientX: 40, clientY: 200 });
const carry = (name: string | RegExp, x: number, y: number) =>
  fireEvent.pointerMove(icon(name), { clientX: x, clientY: y });
const letGo = (name: string | RegExp, x: number, y: number) =>
  fireEvent.pointerUp(icon(name), { clientX: x, clientY: y });

describe('the icons of the desktop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should follow the pointer while one is carried, and go back when it is let go', () => {
    renderDesktop();

    pick('My Computer');
    carry('My Computer', 240, 320);

    expect(icon('My Computer')).toHaveStyle({ transform: 'translate(200px, 120px)' });

    letGo('My Computer', 240, 320);

    expect(icon('My Computer').style.transform).toBe('');
    expect(notify).toHaveBeenCalledWith({ kind: 'iconDropped' });
  });

  it('should not take a small slip of the pointer for a drag', () => {
    renderDesktop();

    pick('My Computer');
    carry('My Computer', 42, 202);
    letGo('My Computer', 42, 202);

    expect(icon('My Computer').style.transform).toBe('');
    expect(notify).not.toHaveBeenCalled();
  });

  it('should still open the program on a double click, but not at the end of a drag', () => {
    const { onOpenApp } = renderDesktop();

    fireEvent.doubleClick(icon(APP));
    expect(onOpenApp).toHaveBeenCalledTimes(1);

    pick(APP);
    carry(APP, 300, 300);
    letGo(APP, 300, 300);
    fireEvent.click(icon(APP));

    expect(onOpenApp).toHaveBeenCalledTimes(1);
  });

  it('should open My Computer on a double click, and nothing for the bin', () => {
    const onOpenComputer = vi.fn();
    const { onOpenApp } = renderDesktop({ onOpenComputer });

    fireEvent.doubleClick(icon('My Computer'));
    fireEvent.doubleClick(icon('Recycle Bin'));

    expect(onOpenComputer).toHaveBeenCalledTimes(1);
    expect(onOpenApp).not.toHaveBeenCalled();
  });

  it('should warn the robot once when the program is held over the bin', () => {
    renderDesktop();
    putBinAt(8, 8);

    pick(APP);
    carry(APP, 40, 30);
    carry(APP, 44, 34);

    expect(icon('Recycle Bin')).toHaveAttribute('data-aimed');
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith({ kind: 'binThreat' });

    carry(APP, 400, 300);

    expect(icon('Recycle Bin')).not.toHaveAttribute('data-aimed');
  });

  it('should report the program dropped on the bin', () => {
    const { onTrashApp } = renderDesktop();
    putBinAt(8, 8);

    pick(APP);
    carry(APP, 40, 30);
    letGo(APP, 40, 30);

    expect(onTrashApp).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith({ kind: 'appTrashed' });
    expect(notify).not.toHaveBeenCalledWith({ kind: 'iconDropped' });
  });

  it('should let nothing but the program into the bin', () => {
    const { onTrashApp } = renderDesktop();
    putBinAt(8, 8);

    pick('My Computer');
    carry('My Computer', 40, 30);
    letGo('My Computer', 40, 30);

    expect(onTrashApp).not.toHaveBeenCalled();
    expect(icon('Recycle Bin')).not.toHaveAttribute('data-aimed');
  });

  it('should say how much of an icon is there while it is being built', () => {
    renderDesktop({ built: { bin: 6, computer: 2, app: 0 } });

    const computer = screen.getByText('My Computer').closest('button');
    expect(computer).toHaveAttribute('data-built', '2');
    expect(screen.getByText('Pop Search').closest('button')).toHaveAttribute('data-built', '0');
    expect(icon('Recycle Bin')).not.toHaveAttribute('data-built');
  });

  it('should shrink the program where it was let go while the bin swallows it', () => {
    const view = render(
      <Desktop appIcon="💻" appLabel="Pop Search" />,
    );
    const app = () => view.getByRole('button', { name: APP });

    fireEvent.pointerDown(app(), { button: 0, clientX: 40, clientY: 200 });
    fireEvent.pointerMove(app(), { clientX: 40, clientY: 30 });
    fireEvent.pointerUp(app(), { clientX: 40, clientY: 30 });
    view.rerender(<Desktop appIcon="💻" appLabel="Pop Search" swallowed />);

    expect(app()).toHaveAttribute('data-swallowed');
    expect(app()).toHaveStyle({ transform: 'translate(0px, -170px) scale(0.15)' });
  });
});
