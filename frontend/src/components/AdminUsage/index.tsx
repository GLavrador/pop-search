import { useAdminUsageQuery } from '../../hooks/useAdminUsageQuery';
import styles from './styles.module.css';

export const AdminUsage = () => {
  const { isAdmin, rows, isLoading } = useAdminUsageQuery();

  if (!isAdmin) {
    return null;
  }

  const totalAnalyses = rows.reduce((sum, row) => sum + row.analyses, 0);
  const totalTokens = rows.reduce((sum, row) => sum + row.tokens, 0);

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Everyone's usage this month</legend>

      {isLoading && rows.length === 0 ? (
        <p className={styles.note}>Loading...</p>
      ) : (
        <>
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Analyses</th>
                  <th>Tokens</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.user_id}>
                    <td>{row.display_name}</td>
                    <td className={styles.number}>
                      {row.analyses} / {row.limit}
                    </td>
                    <td className={styles.number}>{row.tokens.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td className={styles.number}>{totalAnalyses}</td>
                  <td className={styles.number}>{totalTokens.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className={styles.note}>
            Tokens are what count against the Google AI quota. Analyses are what
            each account is limited by.
          </p>
        </>
      )}
    </fieldset>
  );
};
