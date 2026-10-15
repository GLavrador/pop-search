import { ANALYSIS_STEPS, type AnalysisStep } from '../../constants/analysis';
import { useI18n } from '../../i18n/languageContext';
import type { AnalysisStage } from '../../types';
import styles from './styles.module.css';

// How far the bar may creep while a step lasts. It only gets there slowly, so
// the next step always has somewhere to jump from.
const REACH: Record<AnalysisStage, number> = {
  queued: 5,
  downloading: 24,
  uploading: 42,
  watching: 64,
  writing: 95,
  done: 100,
  failed: 100,
};

interface StageProgressProps {
  stage: AnalysisStage;
}

export const StageProgress = ({ stage }: StageProgressProps) => {
  const { t } = useI18n();
  const at = ANALYSIS_STEPS.indexOf(stage as AnalysisStep);
  const reached = stage === 'done' ? ANALYSIS_STEPS.length : at;

  return (
    <div className={styles.container}>
      <ol className={styles.steps}>
        {ANALYSIS_STEPS.map((step, index) => {
          const state = index < reached ? 'done' : index === reached ? 'current' : 'ahead';

          return (
            <li
              key={step}
              className={styles.step}
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className={styles.mark} aria-hidden="true">
                {state === 'done' ? '✓' : state === 'current' ? '►' : ''}
              </span>
              {t.ingest.stages[step]}
            </li>
          );
        })}
      </ol>

      <div
        className={styles.track}
        role="progressbar"
        aria-label={t.ingest.progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={REACH[stage]}
        aria-valuetext={t.ingest.stages[stage === 'done' || stage === 'failed' ? 'writing' : stage]}
      >
        <div className={styles.filler} style={{ width: `${REACH[stage]}%` }} />
        <div className={styles.blocks} />
      </div>
    </div>
  );
};
