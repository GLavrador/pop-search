import { useState, type ReactNode } from 'react';
import { ProgressBar } from '../ProgressBar';
import { ReviewForm } from '../ReviewForm';
import { DEMO_VIDEO } from '../../constants/demoVideo';
import { useI18n } from '../../i18n/languageContext';
import { useSpotlight } from './spotlight';
import type { GuideStep, GuideStepId } from '../../constants/guide';
import ingest from '../IngestSection/styles.module.css';
import styles from './styles.module.css';

interface DemoIngestProps {
  step: GuideStep;
  /** Every control does what it really does: the guide follows to the matching step. */
  onGo: (id: GuideStepId) => void;
  onSpot: (node: HTMLElement | null) => void;
}

export const DemoIngest = ({ step, onGo, onSpot }: DemoIngestProps) => {
  const [manual, setManual] = useState(false);
  const [scenes, setScenes] = useState(true);
  const [audio, setAudio] = useState(true);
  const { t } = useI18n();

  const spotlight = useSpotlight(step, onSpot);

  const body = (): ReactNode => {
    if (step.ingest === 'options') {
      return (
        <div {...spotlight('options', 'win95-border', ingest.optionsContainer)}>
          <div className={ingest.optionsTitle}>{t.ingest.optionsTitle}</div>
          <div className={ingest.optionsDescription}>{t.ingest.optionsDescription}</div>

          <div className={ingest.checkboxGroup}>
            {[
              { id: 'demo-scenes', label: t.ingest.scenes, on: scenes, set: setScenes },
              { id: 'demo-audio', label: t.ingest.audio, on: audio, set: setAudio },
            ].map(({ id, label, on, set }) => (
              <div key={id} className={`${ingest.manualToggle} ${ingest.checkboxOption}`}>
                <input
                  type="checkbox"
                  id={id}
                  className={ingest.manualCheckbox}
                  checked={on}
                  onChange={(e) => set(e.target.checked)}
                />
                <label htmlFor={id} className={`${ingest.manualLabel} ${ingest.checkboxOptionLabel}`}>
                  {label}
                </label>
              </div>
            ))}
          </div>

          <div className={ingest.runAnalysisActions}>
            <button type="button" className="win95-btn" onClick={() => onGo('paste')}>
              {t.common.back}
            </button>
            <button
              type="button"
              className={`win95-btn ${ingest.runButton}`}
              onClick={() => onGo('analyzing')}
              data-aim
            >
              {t.ingest.runAnalysis}
            </button>
          </div>
        </div>
      );
    }

    if (step.ingest === 'analyzing') {
      return (
        <div {...spotlight('progress', ingest.progressRow)}>
          <div className={ingest.progressContainer}>
            <ProgressBar loading />
            <button
              type="button"
              className={`win95-btn ${ingest.cancelButton}`}
              onClick={() => onGo('paste')}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      );
    }

    if (step.ingest === 'review') {
      return (
        <div {...spotlight(['review', 'save'])}>
          <ReviewForm
            initialData={DEMO_VIDEO}
            onSave={async () => onGo('saved')}
            onCancel={() => onGo('paste')}
          />
        </div>
      );
    }

    if (step.ingest === 'saved') {
      return <div {...spotlight('saved', styles.saved)}>{t.guide.demo.saved}</div>;
    }

    return (
      <>
        <label {...spotlight([], ingest.label)}>{t.ingest.urlLabel}</label>
        <div {...spotlight('url', ingest.inputRow)}>
          <input
            type="text"
            readOnly
            value={DEMO_VIDEO.url_original ?? ''}
            className="win95-inset win95-input"
            aria-label={t.ingest.urlLabel}
          />
          <button
            type="button"
            className={`win95-btn ${ingest.runButton}`}
            onClick={() => onGo('options')}
            data-aim
          >
            {manual ? t.ingest.openForm : t.ingest.next}
          </button>
        </div>

        <div {...spotlight('manual', ingest.manualToggle, styles.tight)}>
          <input
            type="checkbox"
            id="demo-manual"
            className={ingest.manualCheckbox}
            checked={manual}
            onChange={(e) => setManual(e.target.checked)}
          />
          <label htmlFor="demo-manual" className={ingest.manualLabel}>
            {t.ingest.manualInput}
          </label>
        </div>
      </>
    );
  };

  return (
    <div className={styles.panel}>
      <span className={styles.badge} title={t.guide.demo.badgeTitle}>
        {t.guide.demo.badge}
      </span>
      {body()}
    </div>
  );
};
