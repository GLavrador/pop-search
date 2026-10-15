import { useI18n } from '../../i18n/languageContext';
import { Dialog } from '../Dialog';
import { GroupBox } from '../Dialog/GroupBox';
import { Robot } from '../Assistant/Robot';
import fullBin from '../../assets/win98/recycle_bin_full-3.png';
import styles from './styles.module.css';

interface TricksProps {
  onClose: () => void;
  /** Arms "what's this?", the one trick that can be started from the list. */
  onTryHelp: () => void;
  /** Throws the list itself in the bin, for the robot to go after. */
  onThrowAway: () => void;
}

/** What there is to try outside the guide, as the robot tells it: what to do, never what happens. */
export const Tricks = ({ onClose, onTryHelp, onThrowAway }: TricksProps) => {
  const { t } = useI18n();
  const copy = t.tricks;

  return (
    <Dialog title={copy.title} onClose={onClose} help="tricks">
      <div className={styles.tricks}>
        <div className={styles.intro}>
          <span className={styles.portrait} data-face="happy" data-pose="wave">
            <Robot />
          </span>
          <div className={styles.says}>
            <p className={styles.lead}>{copy.lead}</p>
            <p>{copy.intro}</p>
          </div>
        </div>

        <GroupBox legend={copy.first.legend} className={styles.first}>
          <p>
            <strong>{copy.first.what}</strong> {copy.first.text}
          </p>
          <button type="button" className="win95-btn" onClick={onTryHelp}>
            {copy.first.action}
          </button>
        </GroupBox>

        {/* A corner of the desktop, with the bin on it as it is out there, full. */}
        <GroupBox legend={copy.bin.legend} className={styles.bin}>
          <div className={styles.binRow}>
            <span className={styles.corner} aria-hidden="true">
              <b className={styles.fresh}>{copy.bin.fresh}</b>
              <img src={fullBin} alt="" draggable={false} />
              <span>{t.desktop.recycleBin}</span>
            </span>
            <div className={styles.binText}>
              <p>
                <strong>{copy.bin.what}</strong> {copy.bin.text}
              </p>
              <button type="button" className="win95-btn" onClick={onThrowAway}>
                {copy.bin.action}
              </button>
            </div>
          </div>
        </GroupBox>

        {copy.groups.map((group) => (
          <GroupBox key={group.legend} legend={group.legend}>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.what}>
                  <strong>{item.what}</strong> {item.text}
                </li>
              ))}
            </ul>
          </GroupBox>
        ))}
      </div>
    </Dialog>
  );
};
