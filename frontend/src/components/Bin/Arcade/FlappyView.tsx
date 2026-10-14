import { Fragment } from 'react';
import { useI18n } from '../../../i18n/languageContext';
import { Puppet } from '../../Assistant/Puppet';
import logo from '../../../assets/windows-98-logo.png';
import { FLAPPY, boxesOf, type FlappyState } from './flappy';
import { DropMenu, StartMenu } from './Menus';
import { clamp } from './play';
import type { ViewProps } from './index';
import styles from './styles.module.css';

const { bot } = FLAPPY;

const at = (x: number, y: number) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;

/** A sky of clouds under a menu bar and over a taskbar, with menus opening from both. */
export const FlappyView = ({ state, calm, glad }: ViewProps<FlappyState>) => {
  const { t } = useI18n();
  const drift = calm ? 0 : state.dist;
  // Between flaps the jets only tick over, so that each flap is seen to light them.
  const pose = state.over ? 'dangle' : state.flare > 0 ? 'blast' : 'hover';
  const tilt = state.over ? 96 : state.started ? clamp(state.vy / 11, -20, 42) : 0;

  return (
    <div className={styles.sky} style={{ backgroundPositionX: `${(-drift * 0.18).toFixed(1)}px` }}>
      <div
        className={styles.clouds}
        style={{ backgroundPositionX: `${(-drift * 0.42).toFixed(1)}px` }}
      />

      {state.menus.map((pair) => {
        const [down, up] = boxesOf(pair);
        return (
          <Fragment key={pair.id}>
            <DropMenu box={down} look={pair.id % 3} items={t.bin.games.flappy.file} />
            <StartMenu box={up} look={pair.id % 2} />
          </Fragment>
        );
      })}

      <div className={styles.menuBar} style={{ height: FLAPPY.ceiling }}>
        {t.bin.games.flappy.menus.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div
        className={styles.flyer}
        style={{ transform: `${at(bot.x, state.y)} rotate(${tilt.toFixed(1)}deg)` }}
        data-waiting={state.started ? undefined : ''}
      >
        <Puppet pose={pose} face={state.over ? 'dizzy' : glad ? 'happy' : 'brave'} />
      </div>

      <div
        className={styles.taskbar}
        style={{
          top: FLAPPY.floor,
          backgroundPositionX: `${(-drift).toFixed(1)}px`,
        }}
      >
        <span className={styles.startButton}>
          <img src={logo} alt="" />
          {t.taskbar.start}
        </span>
      </div>
    </div>
  );
};
