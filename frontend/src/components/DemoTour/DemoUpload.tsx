import { useState } from 'react';
import { ProgressBar } from '../ProgressBar';
import { ReviewForm } from '../ReviewForm';
import { DEMO_VIDEO } from '../../constants/demoVideo';
import styles from './styles.module.css';

type Stage = 'url' | 'analyzing' | 'review' | 'saved';

const FAKE_ANALYSIS_MS = 2200;

export const DemoUpload = () => {
  const [stage, setStage] = useState<Stage>('url');

  const startAnalysis = () => {
    setStage('analyzing');
    window.setTimeout(() => setStage('review'), FAKE_ANALYSIS_MS);
  };

  if (stage === 'url') {
    return (
      <div className={styles.demoBox}>
        <p className={styles.demoLabel}>Step 1 — paste a link</p>
        <input
          type="text"
          readOnly
          value={DEMO_VIDEO.url_original}
          className="win95-inset win95-input"
          aria-label="Example video URL"
        />
        <p className={styles.hint}>
          Only twitter.com and x.com links are accepted. Scene and audio
          analysis are on by default, which is what fills the searchable
          metadata below.
        </p>
        <button type="button" className="win95-btn" onClick={startAnalysis}>
          Run Analysis
        </button>
      </div>
    );
  }

  if (stage === 'analyzing') {
    return (
      <div className={styles.demoBox}>
        <p className={styles.demoLabel}>Step 2 — the AI watches the video</p>
        <ProgressBar loading />
        <p className={styles.hint}>
          The real thing downloads the video, sends it to Gemini and waits for a
          description. This tour skips that and uses a result captured earlier.
        </p>
      </div>
    );
  }

  if (stage === 'saved') {
    return (
      <div className={styles.demoBox}>
        <p className={styles.demoLabel}>Step 4 — indexed</p>
        <div className={styles.savedNotice}>
          <strong>Nothing was saved.</strong> In the real app this video would
          now be in the archive and findable by anyone, and it would count as one
          of your monthly analyses.
        </div>
        <button type="button" className="win95-btn" onClick={() => setStage('url')}>
          Run it again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.demoBox}>
      <p className={styles.demoLabel}>Step 3 — you review what the AI wrote</p>
      <p className={styles.hint}>
        Every field is editable. This is the human check before anything is
        indexed, and it is the same form the real flow uses.
      </p>
      <ReviewForm
        initialData={DEMO_VIDEO}
        onSave={async () => setStage('saved')}
        onCancel={() => setStage('url')}
      />
    </div>
  );
};
