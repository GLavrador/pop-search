import { useState } from 'react';
import { useRobot } from '../../context/robotContext';
import { DesktopIcon, type Borne, type Spot } from './DesktopIcon';
import { isTrashable, useDesktopIcons, type IconZone, type Trashable } from './icons';
import styles from './styles.module.css';

interface DesktopProps {
  appIcon: string;
  appLabel: string;
  onOpenApp?: () => void;
  onOpenComputer?: () => void;
  onOpenTricks?: () => void;
  onOpenBin?: () => void;
  /** How much of each icon is there, while they are being built. All of it when left out. */
  built?: Partial<Record<IconZone, number>>;
  /** The program's icon is on its way down the bin. */
  swallowed?: boolean;
  /** The icons that are in the bin, and so not on the desktop. */
  trashed?: readonly Trashable[];
  /** The icon drawn as selected, if any. */
  pressed?: IconZone | null;
  /** The icon being polished, if any. */
  shining?: IconZone | null;
  /** Nothing on it answers: something else has the screen. */
  frozen?: boolean;
  /** Where the robot has carried the bin to, when it has. */
  binBorne?: Borne | null;
  /** Over the window: something on it is on the move across the screen. */
  lifted?: boolean;
  /** The program's icon was dropped on the bin. */
  onTrashApp?: () => void;
  /** One of the other icons was. */
  onTrash?: (zone: Trashable) => void;
}

const isOver = (at: Spot, zone: IconZone) => {
  const box = document
    .querySelector(`[data-robot="icon"][data-robot-zone="${zone}"]`)
    ?.getBoundingClientRect();
  return (
    box !== undefined &&
    at.x >= box.left &&
    at.x <= box.right &&
    at.y >= box.top &&
    at.y <= box.bottom
  );
};

export const Desktop = ({
  appIcon,
  appLabel,
  onOpenApp,
  onOpenComputer,
  onOpenTricks,
  onOpenBin,
  built,
  swallowed = false,
  trashed = [],
  pressed = null,
  shining = null,
  frozen = false,
  binBorne = null,
  lifted = false,
  onTrashApp,
  onTrash,
}: DesktopProps) => {
  const icons = useDesktopIcons(appIcon, appLabel, trashed.length > 0);
  const robot = useRobot();
  const [aimed, setAimed] = useState(false);
  const opens: Record<IconZone, (() => void) | undefined> = {
    bin: onOpenBin,
    app: onOpenApp,
    computer: onOpenComputer,
    tricks: onOpenTricks,
  };

  // The bin takes any icon but itself. The program in it is another matter, and the robot sees it coming.
  const carry = (zone: IconZone, at: Spot) => {
    const over = zone !== 'bin' && isOver(at, 'bin');
    if (over && !aimed && zone === 'app') robot.notify({ kind: 'binThreat' });
    setAimed(over);
  };

  const drop = (zone: IconZone, at: Spot) => {
    setAimed(false);
    const binned = zone !== 'bin' && isOver(at, 'bin');
    if (binned && zone === 'app') {
      robot.notify({ kind: 'appTrashed' });
      onTrashApp?.();
    } else if (binned && isTrashable(zone)) {
      robot.notify({ kind: 'iconTrashed', what: zone });
      onTrash?.(zone);
    } else {
      robot.notify({ kind: 'iconDropped' });
    }
  };

  return (
    <div className={styles.desktop} inert={frozen} data-lifted={lifted ? '' : undefined}>
      {icons.map(({ zone, art, label }) => (
        <DesktopIcon
          key={zone}
          art={art}
          label={label}
          zone={zone}
          built={built?.[zone]}
          swallowed={zone === 'app' && swallowed}
          trashed={isTrashable(zone) && trashed.includes(zone)}
          aimedAt={zone === 'bin' && aimed}
          pressed={pressed === zone}
          shining={shining === zone}
          borne={zone === 'bin' ? binBorne : null}
          onOpen={opens[zone]}
          onCarry={(at) => carry(zone, at)}
          onDrop={(at) => drop(zone, at)}
        />
      ))}
    </div>
  );
};
