import { useState, type ReactNode } from 'react';
import { ProgressBar } from '../ProgressBar';
import { ReviewForm } from '../ReviewForm';
import { DEMO_VIDEO } from '../../constants/demoVideo';
import { useI18n } from '../../i18n/languageContext';
import { useSpotlight } from './spotlight';
import type { IngestStage, Spot } from '../../constants/guide';
import ingest from '../IngestSection/styles.module.css';
import styles from './styles.module.css';

interface DemoIngestProps {
  stage: IngestStage;
  spot: Spot;
  onAdvance: () => void;
  onBack: () => void;
}

export const DemoIngest = ({ stage, spot, onAdvance, onBack }: DemoIngestProps) => {
  const [manual, setManual] = useState(false);
  const [scenes, setScenes] = useState(true);
  const [audio, setAudio] = useState(true);
  const { t } = useI18n();

  const spotlight = useSpotlight(spot);

  const body = (): ReactNode => {
    if (stage === 'options') {
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
            <button type="button" className="win95-btn" onClick={onBack}>
              {t.common.back}
            </button>
            <button type="button" className={`win95-btn ${ingest.runButton}`} onClick={onAdvance}>
              {t.ingest.runAnalysis}
            </button>
          </div>
        </div>
      );
    }

    if (stage === 'analyzing') {
      return (
        <div {...spotlight('progress', ingest.progressRow)}>
          <div className={ingest.progressContainer}>
            <ProgressBar loading />
            <button
              type="button"
              className={`win95-btn ${ingest.cancelButton}`}
              onClick={onBack}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      );
    }

    if (stage === 'review') {
      return (
        <div {...spotlight('review')}>
          <ReviewForm
            initialData={DEMO_VIDEO}
            onSave={async () => onAdvance()}
            onCancel={onBack}
          />
        </div>
      );
    }

    if (stage === 'saved') {
      return <div {...spotlight('saved', styles.saved)}>{t.guide.demo.saved}</div>;
    }

    return (
      <>
        <label className={ingest.label}>{t.ingest.urlLabel}</label>
        <div {...spotlight('url', ingest.inputRow)}>
          <input
            type="text"
            readOnly
            value={DEMO_VIDEO.url_original ?? ''}
            className="win95-inset win95-input"
            aria-label={t.ingest.urlLabel}
          />
          <button type="button" className={`win95-btn ${ingest.runButton}`} onClick={onAdvance}>
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
