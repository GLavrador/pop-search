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
import { useServerWake, type ServerState, type ServerStatus } from './hooks/useServerWake';
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
import { useRobotDirector, type Brief } from './hooks/useRobotDirector';
import { RobotContext, helpAt, type HelpKey } from './context/robotContext';
import type { WindowState } from './components/RetroWindow';
import { Boot } from './components/Boot';
import { BlueScreen } from './components/BlueScreen';
import { Rebuild } from './components/Rebuild';
import { BlueTiles } from './components/Rebuild/BlueTiles';
import { useRebuild } from './components/Rebuild/useRebuild';
import { SystemProperties } from './components/SystemProperties';
import { Tricks } from './components/Tricks';
import { Bin } from './components/Bin';
import { useBin } from './components/Bin/useBin';
import { BOOTED_KEY, SERVER_NOTICE_MS } from './constants/startup';

const WINDOW_ICON = '💻';
const APP_NAME = 'Pop Search';
const CLICKS_TO_CLOSE = 5;
const CLOSING_MS = 320;
// A visitor is invited to the guide every time the page opens. Asking for that to
// stop is the one thing kept about it. Put away either way, it leaves a chip in
// the title bar.
const INVITE_OFF_KEY = 'pop-search:guide-invite-off';

// While the invitation is up the robot makes it in person, from the seat beside it.
const CALLING: Brief = { utterance: 'invite', cue: 'greet', target: null, aim: null, roam: 'calm' };

interface AppContentProps {
  server: ServerStatus;
  /** The page has just opened: the robot builds the desktop before anything else. */
  intro: boolean;
  onIntroEnd: () => void;
}

function AppContent({ server, intro, onIntroEnd }: AppContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>('ingest');
  const [windowState, setWindowState] = useState<WindowState>(intro ? 'closed' : 'open');
  const [isMaximized, setIsMaximized] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const closeClicks = useRef(0);
  const pendingCat = useRef<string | null>(null);
  const [cat, setCat] = useState<{ image: string; phrase: string } | null>(null);
  const [computerOpen, setComputerOpen] = useState(false);
  const [tricksOpen, setTricksOpen] = useState(false);
  const { isAuthenticated, isLoading: isAuthLoading, displayName } = useAuth();
  const { isAdmin } = useAdminStatsQuery(30);
  const guide = useGuide({ onEnterTab: setActiveTab });
  const robot = useRobotDirector({
    guiding: guide.isVisible,
    onTricks: () => openTricks(),
    onFetch: () => openBin(),
  });
  const { notify } = robot;
  const wasSignedIn = useRef<boolean | null>(null);
  const [inviteOff, setInviteOff] = useState(() => localStorage.getItem(INVITE_OFF_KEY) !== null);
  const [inviteShut, setInviteShut] = useState(false);
  const [spotNode, setSpotNode] = useState<HTMLElement | null>(null);
  const reportSpot = useCallback((node: HTMLElement | null) => setSpotNode(node), []);
  const robotSeat = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useIdentityReset();
  const { t, language } = useI18n();
  const spokenIn = useRef(language);
  const toldServer = useRef<ServerState | null>(null);

  const { hide: hideGuide } = guide;
  const { stopHelp, dismiss } = robot;
  // The robot goes into the bin alone: the guide, what it was saying and what was open all wait.
  const bin = useBin({
    onEnter: () => {
      hideGuide();
      stopHelp();
      dismiss();
      setComputerOpen(false);
      setTricksOpen(false);
    },
  });
  const { empty: emptyBin } = bin;
  const rebuild = useRebuild({
    intro,
    onWreck: () => {
      hideGuide();
      stopHelp();
      dismiss();
      // Built again from nothing, the desktop has every icon on it and the bin has none.
      emptyBin();
      closeClicks.current = 0;
      pendingCat.current = null;
      setCat(null);
      setComputerOpen(false);
      setTricksOpen(false);
      setWindowState('closed');
    },
    onOpenWindow: () => setWindowState('open'),
    onEnd: (kind) => {
      if (kind === 'setup') onIntroEnd();
    },
  });
  const wrecked = rebuild.view.phase === 'show';

  useEffect(() => {
    if (isAuthLoading) return;
    if (wasSignedIn.current !== null && wasSignedIn.current !== isAuthenticated) {
      notify(isAuthenticated ? { kind: 'signedIn', name: displayName } : { kind: 'signedOut' });
    }
    wasSignedIn.current = isAuthenticated;
  }, [isAuthLoading, isAuthenticated, displayName, notify]);

  useEffect(() => {
    if (spokenIn.current === language) return;
    spokenIn.current = language;
    notify({ kind: 'language' });
  }, [language, notify]);

  // A quick answer needs no word. A slow one is explained, and so is its end.
  // Not while the desktop is being built: the robot is busy and nobody would hear.
  useEffect(() => {
    if (wrecked || toldServer.current === server.state) return;

    if (server.state === 'waking') {
      const id = setTimeout(() => {
        toldServer.current = 'waking';
        notify({ kind: 'serverWaking' });
      }, SERVER_NOTICE_MS);
      return () => clearTimeout(id);
    }

    const waited = toldServer.current === 'waking';
    toldServer.current = server.state;
    if (server.state === 'down') notify({ kind: 'serverDown' });
    else if (waited) notify({ kind: 'serverAwake' });
  }, [server.state, notify, wrecked]);

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
      notify({ kind: 'closeAttempt', attempt: closeClicks.current });
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
    notify({ kind: 'reopened' });
  };

  const openComputer = () => {
    if (!computerOpen) notify({ kind: 'pressed', what: 'computer' });
    setComputerOpen(true);
  };

  const openTricks = () => {
    if (!tricksOpen) notify({ kind: 'pressed', what: 'tricks' });
    setTricksOpen(true);
  };

  // With something in it the robot goes in after it. Empty, it only says so.
  const openBin = () => {
    if (!bin.visit()) notify({ kind: 'binEmpty' });
  };

  // The one trick the list can start by itself, with the list out of the way.
  const tryHelp = () => {
    setTricksOpen(false);
    if (!robot.helping) robot.toggleHelp();
  };

  const selectTab = (tab: Tab) => {
    if (tab !== activeTab) notify({ kind: 'tab', tab });
    setActiveTab(tab);
  };

  const toggleMaximized = () => {
    notify({ kind: 'maximized', on: !isMaximized });
    setIsMaximized(!isMaximized);
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

  const keepInviting = (on: boolean) => {
    setInviteOff(!on);
    if (on) {
      setInviteShut(false);
      localStorage.removeItem(INVITE_OFF_KEY);
    } else {
      localStorage.setItem(INVITE_OFF_KEY, '1');
    }
  };

  const shutInvite = () => {
    setInviteShut(true);
    notify({ kind: 'pressed', what: 'inviteClose' });
  };

  // It says where the guide went, and offers to take the choice back.
  const stopInviting = () => {
    keepInviting(false);
    notify({ kind: 'inviteHidden', undo: () => keepInviting(true) });
  };

  const startGuide = guide.start;

  // Taken to the end, the guide has answered the invitation: what it offers next is the rest.
  const finishGuide = () => {
    guide.quit();
    setInviteShut(true);
    robot.guideDone();
  };

  const offersGuide = !isAuthLoading && !isAuthenticated && guide.step === null;
  const calling = offersGuide && !inviteOff && !inviteShut;

  const brief = robot.briefOver(
    step && {
      utterance: guide.index,
      cue,
      target: spotNode,
      aim: step.spot ? AIMS[step.spot] : null,
      roam: 'eager',
    },
    calling ? CALLING : undefined,
  );

  const desktop = (
    <div className={styles.appContainer} inert={bin.away}>
      <BlueTiles blue={rebuild.blue} kind={rebuild.view.kind} />

      <Desktop
        appIcon={WINDOW_ICON}
        appLabel={APP_NAME}
        onOpenApp={handleOpen}
        onOpenComputer={openComputer}
        onOpenTricks={openTricks}
        onOpenBin={openBin}
        built={rebuild.view.built}
        swallowed={rebuild.view.phase === 'swallowing'}
        trashed={bin.trashed}
        pressed={rebuild.view.pressed}
        shining={rebuild.view.shining}
        frozen={wrecked}
        binBorne={bin.view.borne}
        lifted={bin.away}
        onTrashApp={rebuild.trash}
        onTrash={bin.trash}
      />

      {isClosed && cat && <CatReveal image={cat.image} phrase={cat.phrase} />}

      <RetroWindow
        title={t.window.title}
        icon={WINDOW_ICON}
        state={windowState}
        maximized={isMaximized}
        shakeKey={shakeKey}
        onMinimize={() => setWindowState('minimized')}
        onMaximize={toggleMaximized}
        onClose={handleClose}
        aside={offersGuide && !calling ? <GuideChip onOpen={startGuide} /> : undefined}
        onHelp={robot.toggleHelp}
        helping={robot.helping}
        shut={rebuild.view.shut}
      >
        <div className={`${styles.mainPanel} ${isMaximized ? styles.mainPanelMax : ''}`}>
          {calling && (
            <GuideInvite
              robotSeat={robotSeat}
              onStart={startGuide}
              onClose={shutInvite}
              onHide={stopInviting}
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
              onNext={guide.isLast ? finishGuide : guide.next}
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
            onSelect={selectTab}
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
                    <button
                      type="button"
                      className="win95-btn"
                      onClick={() => {
                        notify({ kind: 'pressed', what: 'gateSignIn' });
                        setActiveTab('account');
                      }}
                    >
                      {t.gate.signIn}
                    </button>
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
              <AuthPanel
                onStartGuide={startGuide}
                invite={{ on: !inviteOff, onChange: keepInviting }}
              />
            </div>
          </div>
          <StatusBar
            scope={activeTab === 'search' ? (searchStep ? 'searchDemo' : 'search') : null}
          />
        </div>
      </RetroWindow>

      {computerOpen && !wrecked && (
        <SystemProperties
          server={server}
          owner={isAuthenticated ? displayName : null}
          onClose={() => setComputerOpen(false)}
        />
      )}

      {tricksOpen && !wrecked && (
        <Tricks onClose={() => setTricksOpen(false)} onTryHelp={tryHelp} />
      )}

      {/* While the desktop is being rebuilt the robot is in the show, not at home. Nor is it while it is off to the bin. */}
      {wrecked ? (
        <Rebuild cast={rebuild.cast} kind={rebuild.view.kind} onSkip={rebuild.skip} />
      ) : bin.away ? (
        <Bin bin={bin} />
      ) : (
        <RobotPilot
          {...brief}
          home={robotSeat}
          entry={bin.exit}
          parked={windowState === 'minimized'}
          stage={stage}
          label={t.guide.poke}
          handle={robot.handle}
          onPoke={() => !tricksOpen && windowState !== 'minimized' && robot.poked()}
          onGrab={robot.dismiss}
          onDrop={(zone) => (zone === 'bin' ? openBin() : robot.dropped(zone))}
        >
          {robot.line && <Speech line={robot.line} onDismiss={robot.dismiss} />}
        </RobotPilot>
      )}

      {!wrecked && robot.helping && (
        <HelpOverlay onPick={robot.pick} onCancel={robot.stopHelp} />
      )}

      <footer className={styles.footer}>
        <p>{t.footer}</p>
      </footer>

      <Taskbar
        sunk={rebuild.view.taskbar}
        start={rebuild.view.start}
        clock={rebuild.view.clock}
        frozen={wrecked}
      >
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

/** The way in: through the boot screen, with the robot building the desktop, or straight. */
type Starting = 'boot' | 'setup' | null;

const firstStart = (rebooted: boolean): Starting => {
  // After a crash the machine restarts, and a restart goes through the boot screen.
  if (rebooted) return 'boot';
  if (sessionStorage.getItem(BOOTED_KEY) !== null) return null;
  // The first time in a tab the robot builds the desktop. The boot screen is the still way in.
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'boot' : 'setup';
};

function Startup({ rebooted }: { rebooted: boolean }) {
  const server = useServerWake();
  const [starting, setStarting] = useState(() => firstStart(rebooted));

  // The colour the page was first painted in has done its job once this draws over
  // it. Left on, it would be what shows behind the blue as the robot clears it.
  useEffect(() => {
    delete document.documentElement.dataset.boot;
  }, []);

  const enter = useCallback(() => {
    sessionStorage.setItem(BOOTED_KEY, '1');
    setStarting(null);
  }, []);

  if (starting === 'boot') return <Boot server={server} onDone={enter} />;
  return <AppContent server={server} intro={starting === 'setup'} onIntroEnd={enter} />;
}

function App() {
  return (
    <LanguageProvider>
      <BlueScreen>
        {(restarts) => (
          <AuthProvider>
            <StatusProvider>
              <Startup rebooted={restarts > 0} />
            </StatusProvider>
          </AuthProvider>
        )}
      </BlueScreen>
    </LanguageProvider>
  );
}

export default App;
