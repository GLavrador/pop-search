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
import { useIdentityReset } from './hooks/useIdentityReset';
import { StatusBar } from './components/StatusBar';
import { LanguageProvider } from './i18n/LanguageProvider';
import { useI18n } from './i18n/languageContext';
import { TAB_LABELS } from './constants/tabs';
import { Taskbar } from './components/Taskbar';
import { TaskButton } from './components/Taskbar/TaskButton';
import { Desktop } from './components/Desktop';
import { TabStrip } from './components/TabStrip';
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
  const [isMaximized, setIsMaximized] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const closeClicks = useRef(0);
  const pendingCat = useRef<string | null>(null);
  const [cat, setCat] = useState<{ image: string; phrase: string } | null>(null);
  const { isAuthenticated, displayName } = useAuth();
  const { isAdmin } = useAdminStatsQuery(30);
  useIdentityReset();
  const { t } = useI18n();

  useEffect(() => {
    if (windowState !== 'closing') return;
    const id = setTimeout(() => setWindowState('closed'), CLOSING_MS);
    return () => clearTimeout(id);
  }, [windowState]);

  const handleClose = () => {
    if (windowState !== 'open') return;

    closeClicks.current += 1;

    if (closeClicks.current === 1) {
      pendingCat.current = randomCat();
      new Image().src = pendingCat.current;
    }

    if (closeClicks.current < CLICKS_TO_CLOSE) {
      setShakeKey((key) => key + 1);
      return;
    }

    setCat({
      image: pendingCat.current ?? randomCat(),
      phrase: t.closed.phrases[Math.floor(Math.random() * t.closed.phrases.length)],
    });
    setWindowState('closing');
  };

  const handleOpen = () => {
    closeClicks.current = 0;
    pendingCat.current = null;
    setCat(null);
    setWindowState('open');
  };

  const isClosed = windowState === 'closed';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'ingest', label: TAB_LABELS.ingest },
    { id: 'search', label: TAB_LABELS.search },
    { id: 'demo', label: TAB_LABELS.tour },
    ...(isAuthenticated ? [{ id: 'library' as Tab, label: TAB_LABELS.myVideos }] : []),
    ...(isAdmin ? [{ id: 'admin' as Tab, label: TAB_LABELS.stats }] : []),
    { id: 'account', label: isAuthenticated ? `👤 ${displayName}` : TAB_LABELS.signIn },
  ];


  return (
    <div className={styles.appContainer}>
      <Desktop appIcon={WINDOW_ICON} appLabel={APP_NAME} onOpenApp={handleOpen} />

      {isClosed && cat && <CatReveal image={cat.image} phrase={cat.phrase} />}

      <RetroWindow
        title={t.window.title}
        icon={WINDOW_ICON}
        state={windowState}
        maximized={isMaximized}
        shakeKey={shakeKey}
        onMinimize={() => setWindowState('minimized')}
        onMaximize={() => setIsMaximized((value) => !value)}
        onClose={handleClose}
      >
        <div className={`${styles.mainPanel} ${isMaximized ? styles.mainPanelMax : ''}`}>
          <TabStrip tabs={tabs} activeId={activeTab} onSelect={setActiveTab} />

          <div className={`${styles.contentArea} ${isMaximized ? styles.contentAreaMax : ''}`}>
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
