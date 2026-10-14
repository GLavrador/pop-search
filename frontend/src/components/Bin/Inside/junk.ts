/** A box on the disk, from its top left corner. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Size {
  w: number;
  h: number;
}

/** Something to put down: its size, and where it would rather lie, from 0 to 1 across the room there is for it. */
export interface Wanted extends Size {
  x: number;
  y: number;
  /** It may lie partly over other loose things, as windows left open over the years do. */
  loose?: boolean;
}

// Nothing lies closer than this to anything else, or to the edge of the disk.
const GAP = 8;
// How far from where it would rather be something is moved to find room, at most.
const REACH = 260;
const STRIDE = 12;
// How much of a loose thing may lie under another loose thing.
const PILED = 0.3;

const touches = (a: Box, b: Box, gap: number) =>
  a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;

const shared = (a: Box, b: Box) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

// Every way of moving away from a spot, nearest first.
const AROUND = (() => {
  const steps: { dx: number; dy: number }[] = [];
  const most = Math.floor(REACH / STRIDE);
  for (let i = -most; i <= most; i += 1) {
    for (let j = -most; j <= most; j += 1) {
      if (Math.hypot(i, j) * STRIDE <= REACH) steps.push({ dx: i * STRIDE, dy: j * STRIDE });
    }
  }
  return steps.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
})();

interface Taken extends Box {
  loose: boolean;
}

const onDisk = (box: Box, area: Size) =>
  box.x >= GAP && box.y >= GAP && box.x + box.w <= area.w - GAP && box.y + box.h <= area.h - GAP;

const fits = (box: Box, loose: boolean, area: Size, taken: readonly Taken[]) =>
  onDisk(box, area) &&
  taken.every((other) =>
    loose && other.loose
      ? shared(box, other) <= PILED * Math.min(box.w * box.h, other.w * other.h)
      : !touches(box, other, GAP),
  );

/**
 * Where each thing lies: as near as there is room to where it would rather be,
 * clear of what must not be covered and of everything put down before it. Loose
 * things may lie a little over one another. What finds no room near enough is
 * left out, rather than put anywhere.
 */
export const scatter = (area: Size, wanted: readonly Wanted[], avoid: readonly Box[]): (Box | null)[] => {
  const taken: Taken[] = avoid.map((box) => ({ ...box, loose: false }));
  return wanted.map(({ w, h, x, y, loose = false }) => {
    const from = { x: GAP + x * (area.w - w - 2 * GAP), y: GAP + y * (area.h - h - 2 * GAP) };
    for (const { dx, dy } of AROUND) {
      const box = { x: Math.round(from.x + dx), y: Math.round(from.y + dy), w, h };
      if (fits(box, loose, area, taken)) {
        taken.push({ ...box, loose });
        return box;
      }
    }
    return null;
  });
};

/**
 * The same things in order, as icons are on a desktop: on one even grid, in
 * columns from the left, each filled from the top down, one column after the
 * other until the bin's window or the robot is in the way at the top. A column
 * cut into lower down is used down to where it is cut, and only what does not
 * fit that way goes into the cells left over, still on the grid.
 */
export const lineUp = (area: Size, sizes: readonly Size[], avoid: readonly Box[], cell: Size): (Box | null)[] => {
  const free = (box: Box) => avoid.every((other) => !touches(box, other, GAP));

  // The grid from a given corner: the cells of the columns from the left, then the rest.
  const gridFrom = (dx: number, dy: number) => {
    const columns: Box[][] = [];
    for (let x = GAP + dx; x + cell.w <= area.w - GAP; x += cell.w) {
      const column: Box[] = [];
      for (let y = GAP + dy; y + cell.h <= area.h - GAP; y += cell.h) {
        column.push({ x, y, w: cell.w, h: cell.h });
      }
      columns.push(column);
    }
    const first: Box[] = [];
    let open = true;
    columns.forEach((column) => {
      const cut = column.findIndex((box) => !free(box));
      const top = cut === -1 ? column : column.slice(0, cut);
      open = open && top.length > 0;
      if (open) first.push(...top);
    });
    const rest = columns.flat().filter((box) => free(box) && !first.includes(box));
    return { first, cells: [...first, ...rest] };
  };

  // The grid starts in the top left corner, unless starting it a little further in leaves room for more.
  let best = gridFrom(0, 0);
  const worth = (grid: typeof best) => [
    Math.min(grid.cells.length, sizes.length),
    Math.min(grid.first.length, sizes.length),
  ];
  for (let dy = 0; dy < cell.h; dy += STRIDE) {
    for (let dx = 0; dx < cell.w; dx += STRIDE) {
      const grid = gridFrom(dx, dy);
      const [cells, first] = worth(grid);
      const [bestCells, bestFirst] = worth(best);
      if (cells > bestCells || (cells === bestCells && first > bestFirst)) best = grid;
    }
  }

  return sizes.map(({ w, h }, index) => {
    const spot = best.cells[index];
    return spot ? { x: spot.x + Math.round((cell.w - w) / 2), y: spot.y, w, h } : null;
  });
};
