import { useId, useState } from 'react';
import { useAdminStatsQuery } from '../../hooks/useAdminStatsQuery';
import { usePendingAccountsQuery } from '../../hooks/useReviewQueries';
import { useI18n } from '../../i18n/languageContext';
import { helpAt } from '../../context/robotContext';
import { PendingAccounts } from './PendingAccounts';
import { ApprovedAccounts } from './ApprovedAccounts';
import { Usage } from './Usage';
import styles from './styles.module.css';

type Sheet = 'pending' | 'approved' | 'usage';

const SHEETS: readonly Sheet[] = ['pending', 'approved', 'usage'];

export const AdminDashboard = () => {
  const { isAdmin } = useAdminStatsQuery(30);
  const pending = usePendingAccountsQuery(isAdmin);
  const { t } = useI18n();
  const [sheet, setSheet] = useState<Sheet>('pending');
  const panelId = useId();

  if (!isAdmin) {
    return <p className={styles.empty}>{t.admin.notAdmin}</p>;
  }

  const labels: Record<Sheet, string> = {
    pending: t.admin.sheets.pending(pending.data?.length ?? 0),
    approved: t.admin.sheets.approved,
    usage: t.admin.sheets.usage,
  };

  return (
    <div {...helpAt('admin')}>
      <div className={styles.sheets} role="tablist">
        {SHEETS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sheet === id}
            aria-controls={panelId}
            className={styles.sheet}
            onClick={() => setSheet(id)}
          >
            {labels[id]}
          </button>
        ))}
      </div>

      <div id={panelId} className={styles.sheetPanel} role="tabpanel">
        {sheet === 'pending' && <PendingAccounts />}
        {sheet === 'approved' && <ApprovedAccounts />}
        {sheet === 'usage' && <Usage />}
      </div>
    </div>
  );
};
