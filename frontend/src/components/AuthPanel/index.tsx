import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/authContext';
import { useStatus } from '../../context/StatusContext';
import { useI18n } from '../../i18n/languageContext';
import { helpAt, useRobot } from '../../context/robotContext';
import { QuotaMeter } from '../QuotaMeter';
import { LanguageSwitcher } from '../LanguageSwitcher';
import ingest from '../IngestSection/styles.module.css';
import styles from './styles.module.css';
import warningIcon from '../../assets/win98/msg_warning-0.png';

type Mode = 'signIn' | 'signUp';

interface AuthPanelProps {
  onStartGuide?: () => void;
  /** Whether a visitor is invited to the guide each time the page opens, and the switch for it. */
  invite?: { on: boolean; onChange: (on: boolean) => void };
}

export const AuthPanel = ({ onStartGuide, invite }: AuthPanelProps) => {
  const { isAuthenticated, displayName, signIn, signUp, signOut } = useAuth();
  const { setStatus } = useStatus();
  const { t } = useI18n();
  const robot = useRobot();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // The invitation is only ever made to a visitor, so only a visitor gets its switch.
  const guide = onStartGuide && (
    <>
      <hr className={styles.divider} />
      <div className={styles.guide} {...helpAt('account.guide')}>
        <p className={styles.guideLegend}>{t.guide.profile.legend}</p>
        <p className={styles.guideNote}>{t.guide.profile.note}</p>
        <button type="button" className="win95-btn" onClick={onStartGuide}>
          {t.guide.profile.start}
        </button>
        {invite && !isAuthenticated && (
          <label className={styles.inviteSwitch}>
            <input
              type="checkbox"
              className={ingest.manualCheckbox}
              checked={invite.on}
              onChange={(event) => invite.onChange(event.target.checked)}
            />
            {t.guide.invite.keep}
          </label>
        )}
      </div>
    </>
  );

  if (isAuthenticated) {
    return (
      <div className={`win95-border ${styles.panel}`}>
        <div className={styles.session} {...helpAt('account.session')}>
          <span className={styles.who}>
            {t.auth.signedInAs} <span className={styles.name}>{displayName}</span>
          </span>
          <button
            type="button"
            className="win95-btn"
            onClick={async () => {
              await signOut();
              setStatus(t.auth.signedOut, 3000);
            }}
          >
            {t.auth.signOut}
          </button>
        </div>
        <QuotaMeter />
        {guide}
        <hr className={styles.divider} />
        <LanguageSwitcher />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsBusy(true);
    robot.notify({ kind: 'pressed', what: 'authSubmit' });

    const result =
      mode === 'signIn'
        ? await signIn(email, password)
        : await signUp(email, password, name.trim());

    setIsBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === 'signUp') {
      setNotice(t.auth.created);
      setMode('signIn');
      setPassword('');
      return;
    }

    setStatus(t.auth.signedIn, 3000);
  };

  const isSignUp = mode === 'signUp';

  return (
    <form
      className={`win95-border ${styles.panel}`}
      onSubmit={handleSubmit}
      {...helpAt('account.form')}
    >
      <p className={styles.title}>{isSignUp ? t.auth.createAccount : t.auth.signIn}</p>
      <p className={styles.subtitle}>{t.auth.subtitle}</p>

      {isSignUp && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-name">{t.auth.displayName}</label>
          <input
            id="auth-name"
            type="text"
            className="win95-inset win95-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isBusy}
            required
          />
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="auth-email">{t.auth.email}</label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          className="win95-inset win95-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isBusy}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="auth-password">{t.auth.password}</label>
        <input
          id="auth-password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          className="win95-inset win95-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isBusy}
          required
          minLength={6}
        />
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <img src={warningIcon} alt="" className="win98-warning" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className={styles.notice}>
          <p>{notice}</p>
          {onStartGuide && (
            <div className={styles.noticeActions}>
              <p>{t.auth.guideInvite}</p>
              <button type="button" className="win95-btn" onClick={onStartGuide}>
                {t.gate.openGuide}
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button type="submit" className={`win95-btn ${styles.submit}`} disabled={isBusy}>
          {isBusy ? t.auth.working : isSignUp ? t.auth.createAccount : t.auth.signIn}
        </button>
      </div>

      <button
        type="button"
        className={styles.switch}
        disabled={isBusy}
        onClick={() => {
          robot.notify({ kind: 'pressed', what: 'authSwitch' });
          setMode(isSignUp ? 'signIn' : 'signUp');
          setError(null);
          setNotice(null);
        }}
      >
        {isSignUp ? t.auth.toSignIn : t.auth.toSignUp}
      </button>
      {guide}
      <hr className={styles.divider} />
      <LanguageSwitcher />
    </form>
  );
};
