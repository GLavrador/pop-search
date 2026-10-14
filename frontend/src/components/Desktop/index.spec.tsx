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

  it('should open My Computer and the bin on a double click, each its own way', () => {
    const onOpenComputer = vi.fn();
    const onOpenBin = vi.fn();
    const { onOpenApp } = renderDesktop({ onOpenComputer, onOpenBin });

    fireEvent.doubleClick(icon('My Computer'));
    expect(onOpenComputer).toHaveBeenCalledTimes(1);
    expect(onOpenBin).not.toHaveBeenCalled();

    fireEvent.doubleClick(icon('Recycle Bin'));
    expect(onOpenBin).toHaveBeenCalledTimes(1);
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

  it.each([
    ['My Computer', 'computer'],
    ['Tricks', 'tricks'],
  ] as const)('should take %s into the bin, and tell the robot which one went', (name, zone) => {
    const onTrash = vi.fn();
    const { onTrashApp } = renderDesktop({ onTrash });
    putBinAt(8, 8);

    pick(name);
    carry(name, 40, 30);
    expect(icon('Recycle Bin')).toHaveAttribute('data-aimed');
    expect(notify).not.toHaveBeenCalled();

    letGo(name, 40, 30);

    expect(onTrash).toHaveBeenCalledWith(zone);
    expect(onTrashApp).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith({ kind: 'iconTrashed', what: zone });
    expect(notify).not.toHaveBeenCalledWith({ kind: 'iconDropped' });
    expect(icon('Recycle Bin')).not.toHaveAttribute('data-aimed');
  });

  it('should not take the bin into itself', () => {
    const onTrash = vi.fn();
    const { onTrashApp } = renderDesktop({ onTrash });
    putBinAt(8, 8);

    pick('Recycle Bin');
    carry('Recycle Bin', 46, 36);
    letGo('Recycle Bin', 46, 36);

    expect(onTrash).not.toHaveBeenCalled();
    expect(onTrashApp).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith({ kind: 'iconDropped' });
  });

  it('should keep the place of an icon that is in the bin, with nothing there to find', () => {
    renderDesktop({ trashed: ['computer'] });

    const gone = screen.getByText('My Computer').closest('button');
    expect(screen.queryByRole('button', { name: 'My Computer' })).not.toBeInTheDocument();
    expect(gone).toHaveAttribute('data-trashed');
    expect(gone).not.toHaveAttribute('data-robot-zone');
    expect(gone).not.toHaveAttribute('data-robot');
    expect(icon('Tricks')).toHaveAttribute('data-robot-zone', 'tricks');
  });

  it('should show the bin full for as long as something is in it', () => {
    const view = render(<Desktop appIcon="💻" appLabel="Pop Search" />);
    const picture = () => view.getByRole('button', { name: 'Recycle Bin' }).querySelector('img');
    const empty = picture()?.getAttribute('src');

    view.rerender(<Desktop appIcon="💻" appLabel="Pop Search" trashed={['tricks']} />);
    expect(picture()).toHaveAttribute('data-full');
    expect(picture()?.getAttribute('src')).not.toBe(empty);

    view.rerender(<Desktop appIcon="💻" appLabel="Pop Search" trashed={[]} />);
    expect(picture()).not.toHaveAttribute('data-full');
    expect(picture()?.getAttribute('src')).toBe(empty);
  });

  it('should put the bin wherever the robot has carried it', () => {
    renderDesktop({ binBorne: { x: 64, y: 104, ms: 640 } });

    expect(icon('Recycle Bin')).toHaveStyle({ transform: 'translate(64px, 104px)' });
    expect(icon('My Computer').style.transform).toBe('');
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
