import { useState } from 'react';
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

const WINDOW_ICON = '💻';

type Tab = 'ingest' | 'search' | 'library' | 'account' | 'demo' | 'admin';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const [isMinimized, setIsMinimized] = useState(false);
  const { isAuthenticated, displayName } = useAuth();
  const { isAdmin } = useAdminStatsQuery(30);
  const { t } = useI18n();


  return (
    <div className={styles.appContainer}>
      <RetroWindow
        title={t.window.title}
        icon={WINDOW_ICON}
        minimized={isMinimized}
        onMinimize={() => setIsMinimized(true)}
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
        <TaskButton
          icon={WINDOW_ICON}
          label={t.window.title}
          active={!isMinimized}
          onClick={() => setIsMinimized((value) => !value)}
        />
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
