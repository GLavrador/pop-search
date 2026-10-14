import { useCallback, useEffect, useRef, useState } from 'react';
import { diskAt, leftOver, type Block } from './disk';
import styles from './styles.module.css';

interface GridProps {
  /** How far the defragmenting has got, from 0 to 1. */
  progress: number;
}

// Each block and the white line round it, as the Defragmenter draws them.
const PITCH = 10;
const SIDE = 8;

const INK: Record<Exclude<Block, 'free'>, { edge: string; fill: string }> = {
  done: { edge: '#000080', fill: '#0000c0' },
  data: { edge: '#000000', fill: '#00ffff' },
  moving: { edge: '#000000', fill: '#ffffff' },
  lost: { edge: '#808080', fill: '#c0c0c0' },
  bad: { edge: '#000000', fill: '#2a2a2a' },
};

const paint = (ctx: CanvasRenderingContext2D, blocks: readonly Block[], cols: number) => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  blocks.forEach((block, index) => {
    if (block === 'free') return;
    const x = (index % cols) * PITCH + 1;
    const y = Math.floor(index / cols) * PITCH + 1;
    const { edge, fill } = INK[block];
    ctx.fillStyle = edge;
    ctx.fillRect(x, y, SIDE, SIDE);
    ctx.fillStyle = fill;
    ctx.fillRect(x + 1, y + 1, SIDE - 2, SIDE - 2);

    if (block === 'done') {
      // Done blocks are dithered, a lighter blue on every other dot.
      ctx.fillStyle = '#5a5aff';
      for (let dy = 1; dy < SIDE - 1; dy += 1) {
        for (let dx = 1 + (dy % 2); dx < SIDE - 1; dx += 2) ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    } else if (block === 'moving') {
      // Caught half way: the red corner of a block on its way somewhere else.
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + SIDE - 4, y + 1, 3, 1);
      ctx.fillRect(x + SIDE - 3, y + 2, 2, 1);
      ctx.fillRect(x + SIDE - 2, y + 3, 1, 1);
    } else if (block === 'bad') {
      ctx.fillStyle = '#c00000';
      for (let d = 1; d < SIDE - 1; d += 1) {
        ctx.fillRect(x + d, y + d, 1, 1);
        ctx.fillRect(x + SIDE - 1 - d, y + d, 1, 1);
      }
    }
  });
};

/** The whole disk drawn once, off the screen, as it is made of these blocks. */
const sheetOf = (blocks: readonly Block[], cols: number, rows: number) => {
  const sheet = document.createElement('canvas');
  sheet.width = cols * PITCH + 1;
  sheet.height = rows * PITCH + 1;
  const ctx = sheet.getContext('2d');
  if (!ctx) return null;
  paint(ctx, blocks, cols);
  return sheet;
};

interface Sheets {
  cols: number;
  rows: number;
  before: HTMLCanvasElement;
  after: HTMLCanvasElement;
}

/**
 * The map of the disk, block by block, done from the top as far as the progress goes.
 * The disk as it was left and the disk all done are each drawn once for its size, and
 * every change of the progress only copies the done rows of one over the other: drawing
 * every block again each time a point is scored would hold up the game being played.
 */
export const Grid = ({ progress }: GridProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sheets = useRef<Sheets | null>(null);
  const [size, setSize] = useState({ cols: 0, rows: 0 });

  const holder = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const measure = () => {
      const cols = Math.floor((node.clientWidth - 2) / PITCH);
      const rows = Math.floor((node.clientHeight - 2) / PITCH);
      setSize((now) => (now.cols === cols && now.rows === rows ? now : { cols, rows }));
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      watch.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    const { cols, rows } = size;
    if (!ctx || !cols || !rows) return;

    if (sheets.current?.cols !== cols || sheets.current.rows !== rows) {
      const left = leftOver(cols * rows, cols);
      const before = sheetOf(left, cols, rows);
      const after = sheetOf(diskAt(left, 1), cols, rows);
      sheets.current = before && after ? { cols, rows, before, after } : null;
    }
    if (!sheets.current) return;

    const { before, after } = sheets.current;
    const done = Math.round(cols * rows * Math.min(Math.max(progress, 0), 1));
    const full = Math.floor(done / cols);
    const part = done % cols;
    const width = before.width;
    ctx.drawImage(before, 0, 0);
    if (full) ctx.drawImage(after, 0, 0, width, full * PITCH + 1, 0, 0, width, full * PITCH + 1);
    if (part) {
      const y = full * PITCH;
      const x = part * PITCH + 1;
      ctx.drawImage(after, 0, y, x, PITCH + 1, 0, y, x, PITCH + 1);
    }
  }, [progress, size]);

  return (
    <div ref={holder} className={styles.grid} aria-hidden="true">
      <canvas
        ref={canvas}
        width={size.cols * PITCH + 1}
        height={size.rows * PITCH + 1}
        className={styles.map}
      />
    </div>
  );
};
