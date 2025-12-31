import { useState, useEffect } from 'react';
import styles from './App.module.css';
import './App.css';
import { RetroWindow } from './components/RetroWindow';
import { SearchSection } from './components/SearchSection';
import { IngestSection } from './components/IngestSection';
import { StatusProvider, useStatus } from './context/StatusContext';
import { StatusBar } from './components/StatusBar';

type Tab = 'ingest' | 'search';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const { setStatus } = useStatus();

  useEffect(() => {
    setStatus('Ready');
  }, [activeTab, setStatus]);

  return (
    <div className={styles.appContainer}>      
      <RetroWindow title="Pop Search System" icon="💻">
        <div className={styles.mainPanel}>
          <div className={styles.navBar}>
            <button 
              onClick={() => setActiveTab('ingest')}
              className={`win95-border ${styles.navButton} ${activeTab === 'ingest' ? `win95-inset ${styles.active}` : ''}`}
            >
              💿 Add-Video.exe
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={`win95-border ${styles.navButton} ${activeTab === 'search' ? `win95-inset ${styles.active}` : ''}`}
            >
              🔍 Search.exe
            </button>
          </div>

          <hr className={styles.separator} />

          <div className={styles.contentArea}>
            {activeTab === 'ingest' ? (
              <IngestSection />
            ) : (
              <SearchSection />
            )}
          </div>
          <StatusBar />
        </div>
      </RetroWindow>

      <footer className={styles.footer}>
        <p>© 1998 Pop Search Corp. - All rights reserved.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <StatusProvider>
      <AppContent />
    </StatusProvider>
  );
}

export default App;