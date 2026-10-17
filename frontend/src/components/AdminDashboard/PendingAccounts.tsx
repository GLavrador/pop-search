import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { approveAccount, getPendingAccounts, removePendingVideo } from '../../services/api';
import { useAuth } from '../../context/authContext';
import { useStatus } from '../../context/status';
import { useI18n } from '../../i18n/languageContext';
import { helpAt, useRobot } from '../../context/robotContext';
import type { PendingAccount } from '../../types';
import { Thumbnail } from '../Post/Thumbnail';
import styles from './styles.module.css';
import warningIcon from '../../assets/win98/msg_warning-0.png';

const formatDate = (value: string, locale: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
};

export const PendingAccounts = () => {
  const { session } = useAuth();
  const { setStatus } = useStatus();
  const { t, locale } = useI18n();
  const robot = useRobot();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);
  const copy = t.admin.pending;

  const query = useQuery({
    queryKey: ['pendingAccounts', session?.user.id],
    queryFn: ({ signal }) => getPendingAccounts(signal),
    staleTime: 0,
    retry: false,
  });
  const accounts = query.data ?? [];

  const act = async (account: PendingAccount, approving: boolean) => {
    setBusy(account.user_id);
    robot.notify({ kind: 'pressed', what: approving ? 'approveAccount' : 'removePending' });

    try {
      if (approving) {
        await approveAccount(account.user_id);
        const name = account.display_name;
        setStatus(account.video ? copy.approved(name) : copy.approvedNoVideo(name), 5000);
      } else {
        await removePendingVideo(account.user_id);
        setStatus(copy.removed, 5000);
      }
      await queryClient.invalidateQueries({ queryKey: ['pendingAccounts'] });
    } catch (err: unknown) {
      console.error('Failed to act on an account waiting for approval:', err);
      setStatus(copy.failed, 5000);
    } finally {
      setBusy(null);
      setAsking((current) => (current === account.user_id ? null : current));
    }
  };

  return (
    <fieldset className={styles.group} {...helpAt('admin.pending')}>
      <legend className={styles.legend}>
        {copy.legend}
        {accounts.length > 0 && ` (${accounts.length})`}
      </legend>

      {query.isPending ? (
        <p className={styles.empty}>{copy.loading}</p>
      ) : query.isError ? (
        <p className={styles.empty}>{copy.loadFailed}</p>
      ) : accounts.length === 0 ? (
        <p className={styles.empty}>{copy.empty}</p>
      ) : (
        <ul className={styles.pending}>
          {accounts.map((account) => {
            const { video } = account;
            const working = busy === account.user_id;

            return (
              <li key={account.user_id} className={styles.pendingRow}>
                <div className={styles.pendingVideo}>
                  <Thumbnail src={video?.post?.miniatura} />
                  <div className={styles.pendingBody}>
                    <span>
                      <strong>{account.display_name}</strong>{' '}
                      <span className={styles.cardHint}>
                        {copy.joined(formatDate(account.created_at, locale))}
                      </span>
                    </span>
                    {video ? (
                      <>
                        <a
                          href={video.url_original}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.pendingLink}
                        >
                          {video.titulo_video || video.url_original}
                        </a>
                        {video.descricao_completa && (
                          <p className={styles.pendingText}>{video.descricao_completa}</p>
                        )}
                        {video.post?.texto && (
                          <p className={styles.pendingText}>{`"${video.post.texto}"`}</p>
                        )}
                      </>
                    ) : (
                      <span className={styles.cardHint}>{copy.noVideo}</span>
                    )}
                  </div>
                </div>

                {asking === account.user_id ? (
                  <div className={styles.pendingConfirm} role="group" aria-label={copy.removeVideoOf(account.display_name)}>
                    <span>
                      <img src={warningIcon} alt="" className="win98-warning" /> {copy.confirmRemove}
                    </span>
                    <div className={styles.pendingActions}>
                      <button
                        type="button"
                        className="win95-btn"
                        onClick={() => act(account, false)}
                        disabled={working}
                      >
                        {copy.yes}
                      </button>
                      <button
                        type="button"
                        className="win95-btn"
                        onClick={() => setAsking(null)}
                        disabled={working}
                        autoFocus
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.pendingActions}>
                    <button
                      type="button"
                      className="win95-btn"
                      aria-label={copy.approveOf(account.display_name)}
                      onClick={() => act(account, true)}
                      disabled={busy !== null}
                    >
                      {working ? copy.approving : copy.approve}
                    </button>
                    {video && (
                      <button
                        type="button"
                        className="win95-btn"
                        aria-label={copy.removeVideoOf(account.display_name)}
                        onClick={() => setAsking(account.user_id)}
                        disabled={busy !== null}
                      >
                        {copy.removeVideo}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className={styles.note}>{copy.note}</p>
    </fieldset>
  );
};
