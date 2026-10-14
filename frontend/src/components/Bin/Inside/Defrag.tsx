import { useI18n } from '../../../i18n/languageContext';
import icon from '../../../assets/win98/defragment-1.png';
import { Grid } from './Grid';
import styles from './styles.module.css';

interface DefragProps {
  /** How far the defragmenting has got, from 0 to 1. */
  progress: number;
  /** The goal was reached: what was thrown away can be taken back up. */
  ready: boolean;
  onRescue: () => void;
  onLegend: () => void;
}

/**
 * The Disk Defragmenter, left running on the inside of the bin and stuck there
 * for decades. Playing is what gets it going again: its bar is the goal.
 */
export const Defrag = ({ progress, ready, onRescue, onLegend }: DefragProps) => {
  const { t } = useI18n();
  const copy = t.bin.inside.defrag;
  const percent = Math.round(progress * 100);

  return (
    <section className={styles.defrag} aria-label={copy.title}>
      <div className={styles.defragBar}>
        <span className={styles.defragName}>
          <img src={icon} alt="" />
          {copy.title}
        </span>
        <span className={styles.stuck} aria-hidden="true">
          <i>_</i>
          <i>□</i>
          <i>×</i>
        </span>
      </div>

      <div className={styles.disk} data-disk>
        <Grid progress={progress} />
        <div className={styles.scroller} aria-hidden="true">
          <i>▲</i>
          <b />
          <i>▼</i>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.progress}>
          <p aria-live="polite">{ready ? copy.ready : copy.working}</p>
          <div
            className={styles.meter}
            role="progressbar"
            aria-label={copy.title}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <p>{copy.done(percent)}</p>
        </div>
        <div className={styles.controls}>
          {ready ? (
            <button type="button" className={`win95-btn ${styles.rescue}`} onClick={onRescue}>
              {copy.rescue}
            </button>
          ) : (
            <button type="button" className="win95-btn" disabled>
              {copy.stop}
            </button>
          )}
          <button type="button" className="win95-btn" disabled>
            {copy.pause}
          </button>
          <button type="button" className="win95-btn" onClick={onLegend}>
            {copy.legend}
          </button>
          <button type="button" className="win95-btn" disabled>
            {copy.details}
          </button>
        </div>
      </div>
    </section>
  );
};
