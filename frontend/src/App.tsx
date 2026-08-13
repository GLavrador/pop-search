import { useEffect, useRef, useState } from 'react';
import styles from './App.module.css';
import './App.css';
import { RetroWindow } from './components/RetroWindow';
import { SearchSection } from './components/SearchSection';
import { IngestSection } from './components/IngestSection';
import { StatusProvider } from './context/StatusContext';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/authContext';
import { AuthPanel } from './components/AuthPanel';
import { MyVideos } from './components/MyVideos';
import { DemoTour } from './components/DemoTour';
import { AdminDashboard } from './components/AdminDashboard';
import { useAdminStatsQuery } from './hooks/useAdminStatsQuery';
import { StatusBar } from './components/StatusBar';
import { LanguageProvider } from './i18n/LanguageProvider';
import { useI18n } from './i18n/languageContext';
import { TAB_LABELS } from './constants/tabs';
import { Taskbar } from './components/Taskbar';
import { TaskButton } from './components/Taskbar/TaskButton';
import { Desktop } from './components/Desktop';
import { CatReveal } from './components/CatReveal';
import { randomCat } from './constants/cats';
import type { WindowState } from './components/RetroWindow';

const WINDOW_ICON = '💻';
const APP_NAME = 'Pop Search';
const CLICKS_TO_CLOSE = 5;
const CLOSING_MS = 320;

type Tab = 'ingest' | 'search' | 'library' | 'account' | 'demo' | 'admin';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const [windowState, setWindowState] = useState<WindowState>('open');
  const [shakeKey, setShakeKey] = useState(0);
  const closeClicks = useRef(0);
  const [cat, setCat] = useState<{ image: string; phrase: string } | null>(null);
  const { isAuthenticated, displayName } = useAuth();
  const { isAdmin } = useAdminStatsQuery(30);
  const { t } = useI18n();

  useEffect(() => {
    if (windowState !== 'closing') return;
    const id = setTimeout(() => setWindowState('closed'), CLOSING_MS);
    return () => clearTimeout(id);
  }, [windowState]);

  const handleClose = () => {
    if (windowState !== 'open') return;

    closeClicks.current += 1;

    if (closeClicks.current < CLICKS_TO_CLOSE) {
      setShakeKey((key) => key + 1);
      return;
    }

    setCat({
      image: randomCat(),
      phrase: t.closed.phrases[Math.floor(Math.random() * t.closed.phrases.length)],
    });
    setWindowState('closing');
  };

  const handleOpen = () => {
    closeClicks.current = 0;
    setCat(null);
    setWindowState('open');
  };

  const isClosed = windowState === 'closed';


  return (
    <div className={styles.appContainer}>
      <Desktop appIcon={WINDOW_ICON} appLabel={APP_NAME} onOpenApp={handleOpen} />

      {isClosed && cat && <CatReveal image={cat.image} phrase={cat.phrase} />}

      <RetroWindow
        title={t.window.title}
        icon={WINDOW_ICON}
        state={windowState}
        shakeKey={shakeKey}
        onMinimize={() => setWindowState('minimized')}
        onClose={handleClose}
      >
        <div className={styles.mainPanel}>
          <div className={styles.navBar}>
            <button
              onClick={() => setActiveTab('ingest')}
              className={`win95-border ${styles.navButton} ${activeTab === 'ingest' ? `win95-inset ${styles.active}` : ''}`}
            >
              {TAB_LABELS.ingest}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`win95-border ${styles.navButton} ${activeTab === 'search' ? `win95-inset ${styles.active}` : ''}`}
            >
              {TAB_LABELS.search}
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`win95-border ${styles.navButton} ${activeTab === 'demo' ? `win95-inset ${styles.active}` : ''}`}
            >
              {TAB_LABELS.tour}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('library')}
                className={`win95-border ${styles.navButton} ${activeTab === 'library' ? `win95-inset ${styles.active}` : ''}`}
              >
                {TAB_LABELS.myVideos}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`win95-border ${styles.navButton} ${activeTab === 'admin' ? `win95-inset ${styles.active}` : ''}`}
              >
                {TAB_LABELS.stats}
              </button>
            )}
            <button
              onClick={() => setActiveTab('account')}
              className={`win95-border ${styles.navButton} ${activeTab === 'account' ? `win95-inset ${styles.active}` : ''}`}
            >
              {isAuthenticated ? `👤 ${displayName}` : TAB_LABELS.signIn}
            </button>
          </div>

          <hr className={styles.separator} />

          <div className={styles.contentArea}>
            <div style={{ display: activeTab === 'ingest' ? 'block' : 'none' }}>
              {isAuthenticated ? (
                <IngestSection />
              ) : (
                <div className={styles.gate}>
                  <p><strong>{t.gate.title}</strong></p>
                  <p>{t.gate.body}</p>
                  <div className={styles.gateActions}>
                    <button
                      type="button"
                      className="win95-btn"
                      onClick={() => setActiveTab('account')}
                    >
                      {t.gate.signIn}
                    </button>
                    <button
                      type="button"
                      className="win95-btn"
                      onClick={() => setActiveTab('demo')}
                    >
                      {t.gate.takeTour}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: activeTab === 'search' ? 'block' : 'none' }}>
              <SearchSection />
            </div>
            {isAuthenticated && (
              <div style={{ display: activeTab === 'library' ? 'block' : 'none' }}>
                <MyVideos />
              </div>
            )}
            <div style={{ display: activeTab === 'demo' ? 'block' : 'none' }}>
              <DemoTour />
            </div>
            {isAdmin && activeTab === 'admin' && (
              <div>
                <AdminDashboard />
              </div>
            )}
            <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
              <AuthPanel />
            </div>
          </div>
          <StatusBar />
        </div>
      </RetroWindow>

      <footer className={styles.footer}>
        <p>{t.footer}</p>
      </footer>

      <Taskbar>
        {windowState !== 'closing' && !isClosed && (
          <TaskButton
            icon={WINDOW_ICON}
            label={t.window.title}
            active={windowState === 'open'}
            onClick={() =>
              setWindowState((state) => (state === 'minimized' ? 'open' : 'minimized'))
            }
          />
        )}
      </Taskbar>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusProvider>
          <AppContent />
        </StatusProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
