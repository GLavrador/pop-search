import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { Robot } from '../Assistant/Robot';
import computerIcon from '../../assets/win98/computer_explorer-2.png';
import emptyBinIcon from '../../assets/win98/recycle_bin_empty-2.png';
import fullBinIcon from '../../assets/win98/recycle_bin_full-3.png';
import styles from './styles.module.css';

export type IconZone = 'bin' | 'computer' | 'app' | 'tricks';

/** The icons that may go in the bin and be fetched back. The program is not one of them. */
export type Trashable = 'computer' | 'tricks';

export const isTrashable = (zone: IconZone): zone is Trashable =>
  zone === 'computer' || zone === 'tricks';

export interface IconSpec {
  zone: IconZone;
  art: ReactNode;
  label: string;
}

/** The icons of the desktop, in the order they stand in. */
export const useDesktopIcons = (appIcon: string, appLabel: string, binFull = false): IconSpec[] => {
  const { t } = useI18n();

  return [
    {
      zone: 'bin',
      art: binFull ? (
        <img src={fullBinIcon} alt="" className={styles.image} draggable={false} data-full />
      ) : (
        <img src={emptyBinIcon} alt="" className={styles.image} draggable={false} />
      ),
      label: t.desktop.recycleBin,
    },
    {
      zone: 'computer',
      art: <img src={computerIcon} alt="" className={styles.image} draggable={false} />,
      label: t.desktop.myComputer,
    },
    { zone: 'app', art: <span className={styles.emoji}>{appIcon}</span>, label: appLabel },
    { zone: 'tricks', art: <Robot className={styles.mascot} />, label: t.desktop.tricks },
  ];
};
