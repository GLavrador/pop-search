import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/authContext';
import { useStatus } from '../../context/StatusContext';
import styles from './styles.module.css';

type Mode = 'signIn' | 'signUp';

export const AuthPanel = () => {
  const { isAuthenticated, displayName, signIn, signUp, signOut } = useAuth();
  const { setStatus } = useStatus();

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (isAuthenticated) {
    return (
      <div className={`win95-border ${styles.panel}`}>
        <div className={styles.session}>
          <span className={styles.who}>
            Signed in as <span className={styles.name}>{displayName}</span>
          </span>
          <button
            type="button"
            className="win95-btn"
            onClick={async () => {
              await signOut();
              setStatus('Signed out.', 3000);
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsBusy(true);

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
      setNotice('Account created. If confirmation is required, check your inbox before signing in.');
      setMode('signIn');
      setPassword('');
      return;
    }

    setStatus('Signed in.', 3000);
  };

  const isSignUp = mode === 'signUp';

  return (
    <form className={`win95-border ${styles.panel}`} onSubmit={handleSubmit}>
      <p className={styles.title}>{isSignUp ? 'Create Account' : 'Sign In'}</p>
      <p className={styles.subtitle}>
        Searching is open to everyone. An account is what lets you add videos to
        the archive.
      </p>

      {isSignUp && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-name">Display name</label>
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
        <label className={styles.label} htmlFor="auth-email">E-mail</label>
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
        <label className={styles.label} htmlFor="auth-password">Password</label>
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
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {notice && <div className={styles.notice}>{notice}</div>}

      <div className={styles.actions}>
        <button type="submit" className={`win95-btn ${styles.submit}`} disabled={isBusy}>
          {isBusy ? 'Working...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </div>

      <button
        type="button"
        className={styles.switch}
        disabled={isBusy}
        onClick={() => {
          setMode(isSignUp ? 'signIn' : 'signUp');
          setError(null);
          setNotice(null);
        }}
      >
        {isSignUp ? 'Already have an account? Sign in' : "No account yet? Create one"}
      </button>
    </form>
  );
};
