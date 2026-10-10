import { useI18n } from '../../i18n/languageContext';
import { DesktopIcon } from './DesktopIcon';
import computerIcon from '../../assets/computer_explorer.png';
import recycleBinIcon from '../../assets/recycle_bin_empty.png';
import styles from './styles.module.css';

interface DesktopProps {
  appIcon: string;
  appLabel: string;
  onOpenApp?: () => void;
}

export const Desktop = ({ appIcon, appLabel, onOpenApp }: DesktopProps) => {
  const { t } = useI18n();

  return (
    <div className={styles.desktop}>
      <DesktopIcon
        art={<img src={recycleBinIcon} alt="" className={styles.image} />}
        label={t.desktop.recycleBin}
        zone="bin"
      />
      <DesktopIcon
        art={<img src={computerIcon} alt="" className={styles.image} />}
        label={t.desktop.myComputer}
        zone="computer"
      />
      <DesktopIcon
        art={<span className={styles.emoji}>{appIcon}</span>}
        label={appLabel}
        zone="app"
        onOpen={onOpenApp}
      />
    </div>
  );
};
