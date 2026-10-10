import type { ReactNode } from 'react';
import { helpAt } from '../../context/robotContext';
import type { Zone } from '../Assistant/pilot';
import styles from './styles.module.css';

interface DesktopIconProps {
  art: ReactNode;
  label: string;
  /** Lets the robot tell this icon apart when it is dropped on it. */
  zone: Zone;
  onOpen?: () => void;
}

// Touch has no double click, so a single tap opens there and double click opens
// on a mouse, which is what Windows itself does on each input.
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

export const DesktopIcon = ({ art, label, zone, onOpen }: DesktopIconProps) => (
  <button
    type="button"
    className={styles.icon}
    data-robot="icon"
    data-robot-zone={zone}
    {...helpAt('desktop.icon')}
    onClick={() => {
      if (isTouch()) onOpen?.();
    }}
    onDoubleClick={onOpen}
  >
    <span className={styles.art}>{art}</span>
    <span className={styles.label}>{label}</span>
  </button>
);
