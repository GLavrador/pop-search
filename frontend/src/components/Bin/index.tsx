import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Inside } from './Inside';
import { Trip } from './TripScene';
import type { Bin as BinState } from './useBin';
import styles from './styles.module.css';

interface BinProps {
  bin: BinState;
}

/** The trip to the bin: the robot going in over the desktop, what is in there, and the way back out. */
export const Bin = ({ bin }: BinProps) => {
  const { view, cast, trashed } = bin;
  if (view.phase === 'idle') return null;

  const inside = view.phase === 'inside';

  return createPortal(
    <>
      {!inside && <Trip cast={cast} front={view.front} hole={view.hole} onSkip={bin.skip} />}
      {view.iris && (
        <div
          className={styles.way}
          data-iris={view.iris.state}
          inert={!inside}
          style={
            {
              '--iris-x': `${view.iris.x}px`,
              '--iris-y': `${view.iris.y}px`,
              '--iris-ms': `${view.iris.ms}ms`,
            } as CSSProperties
          }
        >
          <Inside
            trashed={trashed}
            active={inside}
            greeting={bin.greeting}
            onRescue={() => bin.leave(true)}
            onLeave={() => bin.leave(false)}
          />
        </div>
      )}
    </>,
    document.body,
  );
};
