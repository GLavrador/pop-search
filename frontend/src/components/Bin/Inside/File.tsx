import type { ReactNode } from 'react';
import arrow from '../../../assets/win98/overlay_shortcut-1.png';
import styles from './styles.module.css';

interface FileProps {
  art: ReactNode;
  name: string;
  /** A shortcut, with the little arrow in the corner of its picture. */
  shortcut?: boolean;
  /** Picked out from the rest, the way a selected file is. */
  chosen?: boolean;
}

/** A file as a Windows 98 folder shows it: its picture, and its name under it. */
export const File = ({ art, name, shortcut = false, chosen = false }: FileProps) => (
  <span className={styles.file} data-chosen={chosen ? '' : undefined}>
    <span className={styles.fileArt}>
      {art}
      {shortcut && <img src={arrow} alt="" className={styles.arrow} />}
    </span>
    <span className={styles.fileName}>{name}</span>
  </span>
);
