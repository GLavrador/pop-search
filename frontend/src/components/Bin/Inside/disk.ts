import { roll } from '../Arcade/play';

/** What a block of the disk holds, by the colours of the Defragmenter's own legend. */
export type Block = 'done' | 'data' | 'moving' | 'lost' | 'bad' | 'free';

/** Where the defragmenting was left, decades ago. */
export const STUCK_AT = 0.1;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** How far along it is: where it was left, and the rest of the way as far as the goal has been reached. */
export const progressFor = (reached: number) => STUCK_AT + (1 - STUCK_AT) * clamp(reached, 0, 1);

/**
 * What was left on a disk of this many blocks, in the order they are read: data,
 * with runs of free space through it, patches gone grey with neglect, a few bad
 * blocks and a few caught in the middle of being moved. It depends only on the
 * size and the seed, so the same disk always looks the same.
 */
export const leftOver = (count: number, cols: number, seed = 98): Block[] => {
  const blocks: Block[] = [];
  let next = seed;
  const chance = () => {
    const [value, after] = roll(next);
    next = after;
    return value;
  };

  while (blocks.length < count) {
    const atRowStart = blocks.length % cols === 0;
    const odds = chance();
    let kind: Block = 'data';
    let run = 1;
    if (odds < 0.035 && !atRowStart) {
      kind = 'free';
      run = 2 + Math.floor(chance() * 9);
    } else if (odds < 0.095) {
      kind = 'lost';
      run = 1 + Math.floor(chance() * 5);
    } else if (odds < 0.101) {
      kind = 'bad';
    } else if (odds < 0.106) {
      kind = 'moving';
    }
    for (let i = 0; i < run && blocks.length < count; i += 1) blocks.push(kind);
  }
  return blocks;
};

/** The disk as it stands: done as far as it has got, from the top, and left as it was after that. */
export const diskAt = (left: readonly Block[], progress: number): Block[] => {
  const done = Math.round(left.length * clamp(progress, 0, 1));
  return left.map((block, index) => (index < done ? 'done' : block));
};
