import { useState } from 'react';
import { useRobot } from '../../context/robotContext';
import { DesktopIcon, type Spot } from './DesktopIcon';
import { useDesktopIcons, type IconZone } from './icons';
import styles from './styles.module.css';

interface DesktopProps {
  appIcon: string;
  appLabel: string;
  onOpenApp?: () => void;
  onOpenComputer?: () => void;
  /** How much of each icon is there, while they are being built. All of it when left out. */
  built?: Partial<Record<IconZone, number>>;
  /** The program's icon is on its way down the bin. */
  swallowed?: boolean;
  /** The icon drawn as selected, if any. */
  pressed?: IconZone | null;
  /** The icon being polished, if any. */
  shining?: IconZone | null;
  /** Nothing on it answers: something else has the screen. */
  frozen?: boolean;
  /** The program's icon was dropped on the bin. */
  onTrashApp?: () => void;
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
  built,
  swallowed = false,
  pressed = null,
  shining = null,
  frozen = false,
  onTrashApp,
}: DesktopProps) => {
  const icons = useDesktopIcons(appIcon, appLabel);
  const robot = useRobot();
  const [threatened, setThreatened] = useState(false);
  const opens: Partial<Record<IconZone, () => void>> = { app: onOpenApp, computer: onOpenComputer };

  // Only the program can go in the bin, and the robot sees it coming.
  const carry = (zone: IconZone, at: Spot) => {
    const over = zone === 'app' && isOver(at, 'bin');
    if (over && !threatened) robot.notify({ kind: 'binThreat' });
    setThreatened(over);
  };

  const drop = (zone: IconZone, at: Spot) => {
    setThreatened(false);
    if (zone === 'app' && isOver(at, 'bin')) {
      robot.notify({ kind: 'appTrashed' });
      onTrashApp?.();
    } else {
      robot.notify({ kind: 'iconDropped' });
    }
  };

  return (
    <div className={styles.desktop} inert={frozen}>
      {icons.map(({ zone, art, label }) => (
        <DesktopIcon
          key={zone}
          art={art}
          label={label}
          zone={zone}
          built={built?.[zone]}
          swallowed={zone === 'app' && swallowed}
          aimedAt={zone === 'bin' && threatened}
          pressed={pressed === zone}
          shining={shining === zone}
          onOpen={opens[zone]}
          onCarry={(at) => carry(zone, at)}
          onDrop={(at) => drop(zone, at)}
        />
      ))}
    </div>
  );
};
