import { useI18n } from '../../i18n/languageContext';
import type { SystemView } from '../../hooks/useSystemQuery';
import computerIcon from '../../assets/computer_explorer.png';
import { APP_VERSION } from '../../constants/version';
import styles from './styles.module.css';

interface GeneralProps {
  system: SystemView;
  /** Who is signed in, if anybody is. */
  owner: string | null;
}

export const General = ({ system, owner }: GeneralProps) => {
  const { t, locale } = useI18n();
  const copy = t.system.general;
  const { report } = system;
  const pending = (
    <dd className={styles.pending}>{system.silent ? t.system.silent : t.system.asking}</dd>
  );

  return (
    <div className={styles.general}>
      <img src={computerIcon} alt="" className={styles.portrait} draggable={false} />

      <dl className={styles.facts}>
        <dt>{copy.system}</dt>
        <dd>{copy.name(APP_VERSION)}</dd>

        <dt>{copy.registered}</dt>
        <dd>{owner ?? copy.visitor}</dd>

        <dt>{copy.computer}</dt>
        {report ? (
          <>
            <dd>{t.system.devices.analysis.name(report.ai.analysis_model)}</dd>
            <dd>{copy.memory(report.ai.dimensions)}</dd>
            {report.database.videos !== null && (
              <dd>
                {copy.videos(report.database.videos, report.database.videos.toLocaleString(locale))}
              </dd>
            )}
          </>
        ) : (
          pending
        )}
      </dl>
    </div>
  );
};
