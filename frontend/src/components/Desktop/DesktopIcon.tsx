import type { ReactNode } from 'react';
import styles from './styles.module.css';

interface DesktopIconProps {
  art: ReactNode;
  label: string;
  onOpen?: () => void;
}

// Touch has no double click, so a single tap opens there and double click opens
// on a mouse, which is what Windows itself does on each input.
const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

export const DesktopIcon = ({ art, label, onOpen }: DesktopIconProps) => (
  <button
    type="button"
    className={styles.icon}
    onClick={() => {
      if (isTouch()) onOpen?.();
    }}
    onDoubleClick={onOpen}
  >
    <span className={styles.art}>{art}</span>
    <span className={styles.label}>{label}</span>
  </button>
);
