import { useEffect, useRef, useState } from 'react';
import { ProgressBar } from '../ProgressBar';
import { ReviewForm } from '../ReviewForm';
import { DEMO_VIDEO } from '../../constants/demoVideo';
import { useI18n } from '../../i18n/languageContext';
import styles from './styles.module.css';

type Stage = 'url' | 'analyzing' | 'review' | 'saved';

const FAKE_ANALYSIS_MS = 2200;

export const DemoUpload = () => {
  const [stage, setStage] = useState<Stage>('url');
  const { t } = useI18n();

  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const startAnalysis = () => {
    setStage('analyzing');
    timer.current = window.setTimeout(() => setStage('review'), FAKE_ANALYSIS_MS);
  };

  const cancelAnalysis = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setStage('url');
  };

  if (stage === 'url') {
    return (
      <div className={styles.demoBox}>
        <p className={styles.demoLabel}>{t.tour.demoUpload.step1}</p>
        <input
          type="text"
          readOnly
          value={DEMO_VIDEO.url_original}
          className="win95-inset win95-input"
          aria-label={t.tour.demoUpload.urlLabel}
        />
        <p className={styles.hint}>{t.tour.demoUpload.step1Hint}</p>
        <button type="button" className="win95-btn" onClick={startAnalysis}>
          {t.tour.demoUpload.runAnalysis}
        </button>
      </div>
    );
  }

  if (stage === 'analyzing') {
    return (
      <div className={styles.demoBox}>
        <p className={styles.demoLabel}>{t.tour.demoUpload.step2}</p>
        <div className={styles.progressRow}>
          <ProgressBar loading />
          <button type="button" className={`win95-btn ${styles.cancelButton}`} onClick={cancelAnalysis}>
            {t.common.cancel}
          </button>
        </div>
        <p className={styles.hint}>{t.tour.demoUpload.step2Hint}</p>
      </div>
    );
  }

  if (stage === 'saved') {
    return (
      <div className={styles.demoBox}>
        <p className={styles.demoLabel}>{t.tour.demoUpload.step4}</p>
        <div className={styles.savedNotice}>{t.tour.demoUpload.savedNotice}</div>
        <button type="button" className="win95-btn" onClick={() => setStage('url')}>
          {t.tour.demoUpload.again}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.demoBox}>
      <p className={styles.demoLabel}>{t.tour.demoUpload.step3}</p>
      <p className={styles.hint}>{t.tour.demoUpload.step3Hint}</p>
      <ReviewForm
        initialData={DEMO_VIDEO}
        onSave={async () => setStage('saved')}
        onCancel={() => setStage('url')}
      />
    </div>
  );
};
