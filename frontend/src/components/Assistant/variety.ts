/**
 * Picks from a list so that nothing is said twice in a row, and everything on
 * the list gets its turn before any of it comes round again.
 */
export const createVariety = (random: () => number = Math.random) => {
  const bags = new Map<string, number[]>();
  const last = new Map<string, number>();

  return <T>(key: string, options: readonly T[]): T => {
    let bag = bags.get(key) ?? [];

    if (!bag.length) {
      bag = options.map((_, index) => index);
      for (let i = bag.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // The one said last is not the one that opens the next round.
      const next = bag.length - 1;
      if (next > 0 && bag[next] === last.get(key)) [bag[0], bag[next]] = [bag[next], bag[0]];
    }

    const index = bag.pop() ?? 0;
    bags.set(key, bag);
    last.set(key, index);
    return options[index % options.length];
  };
};

export type Variety = ReturnType<typeof createVariety>;
