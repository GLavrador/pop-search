import { useState, version as reactVersion } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { useRobot } from '../../context/robotContext';
import type { SystemView } from '../../hooks/useSystemQuery';
import type { ServerStatus } from '../../hooks/useServerWake';
import { formatDuration } from '../../utils/duration';
import { GroupBox } from '../Dialog/GroupBox';
import styles from './styles.module.css';
import screenIcon from '../../assets/win98/computer_2-0.png';
import serverIcon from '../../assets/win98/server_window.png';
import diskIcon from '../../assets/win98/hard_disk_drive-0.png';
import processorIcon from '../../assets/win98/processor-0.png';
import calculatorIcon from '../../assets/win98/calculator-0.png';
import modemIcon from '../../assets/win98/modem-0.png';
import agentIcon from '../../assets/win98/msagent-0.png';
import computerIcon from '../../assets/win98/computer-0.png';

type DeviceId = 'screen' | 'server' | 'database' | 'analysis' | 'embedding' | 'downloader' | 'robot';
type Health = 'ok' | 'ready' | 'asking' | 'waking' | 'failing' | 'unsaid' | 'undriven';

interface Device {
  id: DeviceId;
  icon: string;
  kind: string;
  name: string;
  health: Health;
  /** What it does, then what is known of it right now. */
  lines: string[];
}

interface DevicesProps {
  system: SystemView;
  server: ServerStatus;
}

const BADGES: Partial<Record<Health, string>> = {
  asking: '…',
  waking: '!',
  failing: 'X',
  unsaid: '!',
  undriven: '?',
};

const SERVER_HEALTH = { awake: 'ok', waking: 'waking', down: 'failing' } as const;

export const Devices = ({ system, server }: DevicesProps) => {
  const { t, locale } = useI18n();
  const robot = useRobot();
  const [selected, setSelected] = useState<DeviceId>('server');
  const [refused, setRefused] = useState<DeviceId | null>(null);
  const copy = t.system.devices;
  const { report } = system;
  const time = (ms: number) => formatDuration(ms, locale);

  // Everything behind the server is known only through what the server says, and
  // of all of it only the database is put to the test.
  const unknown: Health | null = report ? null : system.silent ? 'unsaid' : 'asking';
  const installed: Health = unknown ?? 'ready';

  const devices: Device[] = [
    {
      id: 'screen',
      icon: screenIcon,
      kind: copy.screen.kind,
      name: copy.screen.name(reactVersion),
      health: 'ok',
      lines: [copy.screen.about, copy.screen.size(window.innerWidth, window.innerHeight)],
    },
    {
      id: 'server',
      icon: serverIcon,
      kind: copy.server.kind,
      name: copy.server.name,
      health: SERVER_HEALTH[server.state],
      lines: [
        copy.server.about,
        ...(server.tookMs !== null ? [copy.server.woke(time(server.tookMs))] : []),
        ...(report
          ? [
              copy.server.up(time(report.uptime_seconds * 1000)),
              copy.server.runtime(report.python, report.framework),
              copy.server.version(report.version),
            ]
          : []),
      ],
    },
    {
      id: 'database',
      icon: diskIcon,
      kind: copy.database.kind,
      name: copy.database.name,
      health: unknown ?? (report?.database.ok ? 'ok' : 'failing'),
      lines: [
        copy.database.about,
        ...(report?.database.videos != null
          ? [copy.database.videos(report.database.videos, report.database.videos.toLocaleString(locale))]
          : []),
        ...(report?.database.ms != null ? [copy.database.answered(time(report.database.ms))] : []),
      ],
    },
    {
      id: 'analysis',
      icon: processorIcon,
      kind: copy.analysis.kind,
      name: report ? copy.analysis.name(report.ai.analysis_model) : 'Gemini',
      health: installed,
      lines: [copy.analysis.about, copy.analysis.idle],
    },
    {
      id: 'embedding',
      icon: calculatorIcon,
      kind: copy.embedding.kind,
      name: report ? copy.embedding.name(report.ai.embedding_model) : 'Gemini',
      health: installed,
      lines: report
        ? [
            copy.embedding.about(report.ai.dimensions),
            copy.embedding.kept(report.ai.questions_kept, report.ai.questions_room),
          ]
        : [],
    },
    {
      id: 'downloader',
      icon: modemIcon,
      kind: copy.downloader.kind,
      name: report ? copy.downloader.name(report.downloader) : 'yt-dlp',
      health: installed,
      lines: [copy.downloader.about],
    },
    {
      id: 'robot',
      icon: agentIcon,
      kind: copy.robot.kind,
      name: copy.robot.name,
      health: 'undriven',
      lines: [copy.robot.about],
    },
  ];

  const current = devices.find((device) => device.id === selected) ?? devices[0];
  const statusLine: Record<Health, string> = {
    ok: copy.working,
    ready: copy.ready,
    asking: copy.asking,
    waking: copy.waking,
    failing: copy.failing,
    unsaid: copy.unsaid,
    undriven: copy.undriven,
  };

  const select = (id: DeviceId) => {
    setRefused(null);
    setSelected(id);
    if (id === 'robot' && id !== selected) robot.notify({ kind: 'pressed', what: 'deviceRobot' });
  };

  // Nothing here can be removed. Each part says why, and one of them takes it personally.
  const remove = () => {
    setRefused(selected);
    robot.notify({ kind: 'pressed', what: selected === 'robot' ? 'removeRobot' : 'removeDevice' });
  };

  return (
    <div className={styles.devices}>
      <div className={`win95-inset ${styles.tree}`}>
        <p className={styles.root}>
          <img src={computerIcon} alt="" className="win98-small" /> {copy.root}
        </p>
        <ul className={styles.branches} aria-label={copy.list}>
          {devices.map((device) => (
            <li key={device.id}>
              <button
                type="button"
                className={styles.device}
                aria-pressed={device.id === selected}
                data-health={device.health}
                onClick={() => select(device.id)}
              >
                <span className={styles.deviceIcon} aria-hidden="true">
                  <img src={device.icon} alt="" className="win98-small" />
                  {BADGES[device.health] && (
                    <span className={styles.badge}>{BADGES[device.health]}</span>
                  )}
                </span>
                <span>
                  {device.kind}: <strong>{device.name}</strong>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <GroupBox legend={copy.status} className={styles.status}>
        <p className={styles.health} data-health={current.health} role="status">
          {statusLine[current.health]}
        </p>
        {current.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {refused === current.id && <p className={styles.refusal}>{copy[current.id].refusal}</p>}
      </GroupBox>

      <div className={styles.actions}>
        <button
          type="button"
          className="win95-btn"
          disabled={system.asking}
          onClick={system.ask}
        >
          {copy.refresh}
        </button>
        <button type="button" className="win95-btn" onClick={remove}>
          {copy.remove}
        </button>
      </div>
    </div>
  );
};
