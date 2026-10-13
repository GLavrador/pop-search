import { useId, useState } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { useSystemQuery } from '../../hooks/useSystemQuery';
import type { ServerStatus } from '../../hooks/useServerWake';
import { Dialog } from '../Dialog';
import { General } from './General';
import { Devices } from './Devices';
import { Performance } from './Performance';
import styles from './styles.module.css';

interface SystemPropertiesProps {
  server: ServerStatus;
  /** Who is signed in, if anybody is. */
  owner: string | null;
  onClose: () => void;
}

type Sheet = 'general' | 'devices' | 'performance';

const SHEETS: readonly Sheet[] = ['general', 'devices', 'performance'];

/** What My Computer opens: what the program is made of, and how each part is doing. */
export const SystemProperties = ({ server, owner, onClose }: SystemPropertiesProps) => {
  const { t } = useI18n();
  const system = useSystemQuery();
  const [sheet, setSheet] = useState<Sheet>('general');
  const panelId = useId();

  return (
    <Dialog title={t.system.title} onClose={onClose} help="system">
      <div className={styles.tabs} role="tablist">
        {SHEETS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sheet === id}
            aria-controls={panelId}
            className={styles.tab}
            onClick={() => setSheet(id)}
          >
            {t.system.tabs[id]}
          </button>
        ))}
      </div>

      <div id={panelId} className={styles.panel} role="tabpanel">
        {sheet === 'general' && <General system={system} owner={owner} />}
        {sheet === 'devices' && <Devices system={system} server={server} />}
        {sheet === 'performance' && <Performance />}
      </div>
    </Dialog>
  );
};
