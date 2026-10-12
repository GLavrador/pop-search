import { useSyncExternalStore, type CSSProperties } from 'react';
import { useI18n } from '../../i18n/languageContext';
import crashStyles from '../BlueScreen/styles.module.css';
import type { Blue, Kind } from './stage';
import styles from './styles.module.css';

interface BlueTilesProps {
  blue: Blue;
  kind: Kind;
}

const onResize = (notify: () => void) => {
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};
const screenSize = () => `${window.innerWidth}x${window.innerHeight}`;

/**
 * The blue screen, cut into pieces that can be sent off one at a time. Each
 * piece is a window onto the same full screen, so the text goes with it.
 */
export const BlueTiles = ({ blue, kind }: BlueTilesProps) => {
  const { t } = useI18n();
  const [w, h] = useSyncExternalStore(onResize, screenSize).split('x').map(Number);
  const tiles = useSyncExternalStore(blue.subscribe, blue.get);
  const { crash, setup } = t.rebuild;

  if (!tiles) return null;
  const { cols, rows, fled } = tiles;

  // As the page opens there is nothing yet to say anything about: only the name.
  const text = (
    <div className={crashStyles.text}>
      <div className={crashStyles.badge}>Pop Search</div>
      {kind === 'crash' && (
        <>
          <p>{crash.lead}</p>
          <p className={crashStyles.error}>{crash.code}</p>
          <ul className={crashStyles.steps}>
            {crash.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p className={styles.hold}>
            {crash.hold}
            <span className={crashStyles.cursor}>_</span>
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className={styles.blue}>
      <p className={styles.spoken} role={kind === 'crash' ? 'alert' : 'status'}>
        {kind === 'crash' ? `${crash.lead} ${crash.steps.join(' ')}` : setup.spoken}
      </p>
      {fled.map((push, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const left = Math.round((col * w) / cols);
        const top = Math.round((row * h) / rows);
        // One pixel under the next piece: on a scaled display a bare edge shows as a seam.
        const lap = { x: col < cols - 1 ? 1 : 0, y: row < rows - 1 ? 1 : 0 };

        return (
          <div
            key={index}
            className={styles.tile}
            data-fled={push ? '' : undefined}
            aria-hidden="true"
            style={
              {
                left,
                top,
                width: Math.round(((col + 1) * w) / cols) - left + lap.x,
                height: Math.round(((row + 1) * h) / rows) - top + lap.y,
                '--fx': push?.x ?? 0,
                '--fy': push?.y ?? 0,
                '--spin': (index % 2 ? 1 : -1) * (70 + ((index * 53) % 90)),
              } as CSSProperties
            }
          >
            <div className={styles.pane} style={{ left: -left, top: -top, width: w, height: h }}>
              {text}
            </div>
          </div>
        );
      })}
    </div>
  );
};
