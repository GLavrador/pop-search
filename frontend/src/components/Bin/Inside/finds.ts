import type { ReactNode } from 'react';
import type { Dictionary } from '../../../i18n/en';

/**
 * Something left in the bin that can be picked out of the rest and looked at:
 * an old file, an old picture, whatever cannot be had back but can still be
 * found. It lies on the disk like any other file, and says what opens when it
 * is picked up.
 */
export interface Find {
  id: string;
  /** Its picture, a 32 by 32 icon like the others on the disk. */
  art: ReactNode;
  name: (t: Dictionary) => string;
  /** Where it lies, in hundredths of the width and of the height of the disk. */
  x: number;
  y: number;
  /** What it shows once picked up, with a way of putting it back down. */
  open: (close: () => void) => ReactNode;
}

/** There are none yet. This is the list they go on. */
export const FINDS: readonly Find[] = [];
