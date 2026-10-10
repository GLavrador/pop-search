import { useCallback, useEffect, useRef, useState } from 'react';
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
import { AdminDashboard } from './components/AdminDashboard';
import { useAdminStatsQuery } from './hooks/useAdminStatsQuery';
import { useIdentityReset } from './hooks/useIdentityReset';
import { useBackendWarmup } from './hooks/useBackendWarmup';
import { StatusBar } from './components/StatusBar';
import { LanguageProvider } from './i18n/LanguageProvider';
import { useI18n } from './i18n/languageContext';
import { TAB_LABELS, type Tab } from './constants/tabs';
import { Taskbar } from './components/Taskbar';
import { TaskButton } from './components/Taskbar/TaskButton';
import { Desktop } from './components/Desktop';
import { TabStrip } from './components/TabStrip';
import { CatReveal } from './components/CatReveal';
import { randomCat } from './constants/cats';
import { Assistant } from './components/Assistant';
import { GuidePaused } from './components/Assistant/Paused';
import { GuideInvite } from './components/Assistant/Invite';
import { GuideChip } from './components/Assistant/Chip';
import { RobotPilot } from './components/Assistant/RobotPilot';
import { Speech } from './components/Assistant/Speech';
import { HelpOverlay } from './components/Assistant/HelpOverlay';
import type { Cue } from './components/Assistant/pilot';
import { DemoIngest } from './components/Demo/DemoIngest';
import { DemoSearch } from './components/Demo/DemoSearch';
import { AIMS } from './components/Demo/spotlight';
import { useGuide } from './hooks/useGuide';
import { useRobotDirector } from './hooks/useRobotDirector';
import { RobotContext, helpAt, type HelpKey } from './context/robotContext';
import type { WindowState } from './components/RetroWindow';

const WINDOW_ICON = '💻';
const APP_NAME = 'Pop Search';
const CLICKS_TO_CLOSE = 5;
const CLOSING_MS = 320;
const INVITE_KEY = 'pop-search:guide-invite';

// A visitor is always offered the guide: loudly at first, as a chip in the title
// bar once they tuck the invitation away.
type Invite = 'fresh' | 'seen' | 'tucked';

const readInvite = (): Invite => {
  const saved = localStorage.getItem(INVITE_KEY);
  return saved === 'tucked' ? 'tucked' : saved ? 'seen' : 'fresh';
};

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const [windowState, setWindowState] = useState<WindowState>('open');
  const [isMaximized, setIsMaximized] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const closeClicks = useRef(0);
  const pendingCat = useRef<string | null>(null);
  const [cat, setCat] = useState<{ image: string; phrase: string } | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading, displayName } = useAuth();
  const { isAdmin } = useAdminStatsQuery(30);
  const guide = useGuide({ onEnterTab: setActiveTab });
  const robot = useRobotDirector();
  const [invite, setInvite] = useState(readInvite);
  const [spotNode, setSpotNode] = useState<HTMLElement | null>(null);
  const reportSpot = useCallback((node: HTMLElement | null) => setSpotNode(node), []);
  const robotSeat = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useIdentityReset();
  useBackendWarmup();
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

  const tabs: { id: Tab; label: string; help: HelpKey }[] = [
    { id: 'ingest', label: TAB_LABELS.ingest, help: 'tab.ingest' },
    { id: 'search', label: TAB_LABELS.search, help: 'tab.search' },
    ...(isAuthenticated
      ? [{ id: 'library' as Tab, label: TAB_LABELS.myVideos, help: 'tab.library' as HelpKey }]
      : []),
    ...(isAdmin
      ? [{ id: 'admin' as Tab, label: TAB_LABELS.stats, help: 'tab.admin' as HelpKey }]
      : []),
    {
      id: 'account',
      label: isAuthenticated ? `👤 ${displayName}` : TAB_LABELS.signIn,
      help: 'tab.account',
    },
  ];

  const step = guide.isVisible ? guide.step : null;
  const onStepTab = step !== null && step.tab === activeTab;
  const strayedFrom =
    step !== null && !onStepTab ? (tabs.find((tab) => tab.id === step.tab)?.label ?? '') : null;
  const ingestStep = onStepTab && step?.tab === 'ingest' ? step : null;
  const searchStep = onStepTab && step?.tab === 'search' ? step : null;
  const cue: Cue = step?.id === 'welcome' ? 'greet' : step?.id === 'saved' ? 'cheer' : 'teach';

  const keepInvite = (next: Invite) => {
    setInvite(next);
    localStorage.setItem(INVITE_KEY, next);
  };

  const startGuide = () => {
    if (invite === 'fresh') keepInvite('seen');
    guide.start();
  };

  const offersGuide = !isAuthLoading && !isAuthenticated && guide.step === null;

  const brief = robot.briefOver(
    step && {
      utterance: guide.index,
      cue,
      target: spotNode,
      aim: step.spot ? AIMS[step.spot] : null,
      roam: 'eager',
    },
  );

  const desktop = (
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
        aside={offersGuide && invite === 'tucked' ? <GuideChip onOpen={startGuide} /> : undefined}
        onHelp={robot.toggleHelp}
        helping={robot.helping}
      >
        <div className={`${styles.mainPanel} ${isMaximized ? styles.mainPanelMax : ''}`}>
          {offersGuide && invite !== 'tucked' && (
            <GuideInvite
              returning={invite === 'seen'}
              onStart={startGuide}
              onDismiss={() => keepInvite('tucked')}
            />
          )}

          {step && (
            <Assistant
              index={guide.index}
              total={guide.total}
              copy={t.guide.steps[step.id]}
              act={step.act}
              isFirst={guide.isFirst}
              strayedFrom={strayedFrom}
              robotSeat={robotSeat}
              robotAway={spotNode !== null}
              onBack={guide.back}
              onNext={guide.isLast ? guide.quit : guide.next}
              onJump={guide.goTo}
              onReturn={() => guide.goTo(guide.index)}
              onClose={guide.hide}
            />
          )}

          {guide.isPaused && (
            <GuidePaused
              index={guide.index}
              total={guide.total}
              onResume={() => guide.goTo(guide.index)}
              onQuit={guide.quit}
            />
          )}

          <TabStrip
            tabs={tabs}
            activeId={activeTab}
            onSelect={setActiveTab}
            quiet={step !== null}
          />

          <div
            ref={stage}
            className={`${styles.contentArea} ${
              isMaximized ? styles.contentAreaMax : guide.isVisible ? styles.contentAreaGuided : ''
            }`}
          >
            <div style={{ display: activeTab === 'ingest' ? 'block' : 'none' }}>
              {ingestStep && (
                <DemoIngest step={ingestStep} onGo={guide.jump} onSpot={reportSpot} />
              )}
              <div style={{ display: ingestStep ? 'none' : 'block' }}>
                {isAuthenticated ? (
                  <IngestSection />
                ) : (
                  <div className={styles.gate} {...helpAt('ingest.gate')}>
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
                      <button type="button" className="win95-btn" onClick={startGuide}>
                        {t.gate.openGuide}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: activeTab === 'search' ? 'block' : 'none' }}>
              {searchStep && (
                <DemoSearch step={searchStep} onGo={guide.jump} onSpot={reportSpot} />
              )}
              <div style={{ display: searchStep ? 'none' : 'block' }}>
                <SearchSection />
              </div>
            </div>
            {isAuthenticated && (
              <div style={{ display: activeTab === 'library' ? 'block' : 'none' }}>
                <MyVideos />
              </div>
            )}
            {isAdmin && activeTab === 'admin' && (
              <div>
                <AdminDashboard />
              </div>
            )}
            <div style={{ display: activeTab === 'account' ? 'block' : 'none' }}>
              <AuthPanel onStartGuide={startGuide} />
            </div>
          </div>
          <StatusBar />
        </div>
      </RetroWindow>

      <RobotPilot
        {...brief}
        home={robotSeat}
        parked={windowState === 'minimized'}
        stage={stage}
        label={t.guide.poke}
        handle={robot.handle}
      >
        {robot.line && <Speech line={robot.line} onDismiss={robot.dismiss} />}
      </RobotPilot>

      {robot.helping && <HelpOverlay onPick={robot.pick} onCancel={robot.stopHelp} />}

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

  return <RobotContext.Provider value={robot.voice}>{desktop}</RobotContext.Provider>;
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
