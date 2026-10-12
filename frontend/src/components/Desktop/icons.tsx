import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/languageContext';
import computerIcon from '../../assets/computer_explorer.png';
import recycleBinIcon from '../../assets/recycle_bin_empty.png';
import styles from './styles.module.css';

export type IconZone = 'bin' | 'computer' | 'app';

export interface IconSpec {
  zone: IconZone;
  art: ReactNode;
  label: string;
}

/** The icons of the desktop, in the order they stand in. */
export const useDesktopIcons = (appIcon: string, appLabel: string): IconSpec[] => {
  const { t } = useI18n();

  return [
    {
      zone: 'bin',
      art: <img src={recycleBinIcon} alt="" className={styles.image} draggable={false} />,
      label: t.desktop.recycleBin,
    },
    {
      zone: 'computer',
      art: <img src={computerIcon} alt="" className={styles.image} draggable={false} />,
      label: t.desktop.myComputer,
    },
    { zone: 'app', art: <span className={styles.emoji}>{appIcon}</span>, label: appLabel },
  ];
};
