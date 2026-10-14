import type { Ref } from 'react';
import { useI18n } from '../../../i18n/languageContext';
import binLarge from '../../../assets/win98/recycle_bin_full-2.png';
import binSmall from '../../../assets/win98/recycle_bin_full-5.png';
import flag from '../../../assets/win98/windows-4.png';
import styles from './styles.module.css';

export interface Way {
  key: string;
  icon: string;
  name: string;
  about: string;
  /** What a game asks for, and the best it was ever played to. Nothing for a way that is not a game. */
  goal?: number;
  best?: number;
}

interface ExplorerProps {
  ways: readonly Way[];
  /** The way the robot has just pressed, drawn pushed in. */
  pressed: string | null;
  /** The goal was reached: the window says where the rescue is. */
  ready: boolean;
  onPick: (key: string, button: HTMLButtonElement) => void;
  ref?: Ref<HTMLElement>;
}

/**
 * The bin as Windows 98 opens it in a window of its own: menus, the address,
 * the panel down the side with its name in big letters, and in place of the
 * files, the ways to get them out, listed with what each game asks for.
 */
export const Explorer = ({ ways, pressed, ready, onPick, ref }: ExplorerProps) => {
  const { t } = useI18n();
  const copy = t.bin.inside;
  const words = copy.explorer;

  return (
    <section ref={ref} className={`win95-border ${styles.menu}`} aria-label={copy.title}>
      <div className={styles.bar}>
        <span className={styles.barName}>
          <img src={binSmall} alt="" />
          {copy.title}
        </span>
        <span className={styles.stuck} aria-hidden="true">
          <i>_</i>
          <i>□</i>
          <i>×</i>
        </span>
      </div>

      <div className={styles.menuStrip} aria-hidden="true">
        <span className={styles.menuWords}>
          {words.menus.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </span>
        <span className={styles.flag}>
          <img src={flag} alt="" />
        </span>
      </div>

      <div className={styles.address} aria-hidden="true">
        <span>{words.address}</span>
        <span className={styles.addressField}>
          <img src={binSmall} alt="" />
          {copy.title}
          <i>▼</i>
        </span>
      </div>

      <div className={styles.folder}>
        <aside className={styles.webView}>
          <img src={binLarge} alt="" />
          <h2>{copy.title}</h2>
          <hr />
          <p>
            <b>{copy.choose}</b>
          </p>
          <p>{ready ? words.ready : words.hint}</p>
        </aside>

        <div className={styles.listing}>
          <div className={styles.columns} aria-hidden="true">
            <span>{words.name}</span>
            <span>{words.goal}</span>
            <span>{words.best}</span>
          </div>
          <ul className={styles.ways}>
            {ways.map((way) => {
              const spoken = [
                `${way.name}.`,
                way.about,
                way.goal !== undefined && `${copy.goal(way.goal)}.`,
                way.best ? `${copy.best(way.best)}.` : false,
              ].filter(Boolean);
              return (
                <li key={way.key}>
                  <button
                    type="button"
                    className={styles.way}
                    aria-label={spoken.join(' ')}
                    data-pressed={pressed === way.key ? '' : undefined}
                    onClick={(event) => onPick(way.key, event.currentTarget)}
                  >
                    <span className={styles.wayName}>
                      <img src={way.icon} alt="" />
                      <span className={styles.wayText}>
                        <span>{way.name}</span>
                        <small>{way.about}</small>
                      </span>
                    </span>
                    <span className={styles.wayGoal}>{way.goal ?? ''}</span>
                    <span className={styles.wayBest}>
                      {way.goal === undefined ? '' : way.best || '-'}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className={styles.statusStrip} aria-hidden="true">
        <span>{words.objects(ways.length)}</span>
        <span />
      </div>
    </section>
  );
};
