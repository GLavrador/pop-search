import { useState } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { helpAt, useRobot } from '../../context/robotContext';
import type { AnalysisStage, ExistingVideo } from '../../types';
import styles from './styles.module.css';
import { StageProgress } from '../StageProgress';

interface URLInputViewProps {
  url: string;
  onUrlChange: (url: string) => void;
  onAnalyze: (options: { analyzeScenes: boolean; analyzeAudio: boolean }) => void;
  onOpenManualForm: () => void;
  onCancel: () => void;
  loading: boolean;
  /** The step a running analysis is at. */
  stage?: AnalysisStage | null;
  error: string | null;
  /** The archived video the link turned out to be a copy of. */
  duplicate?: ExistingVideo | null;
  manualMode: boolean;
  onManualModeChange: (value: boolean) => void;
}

const formatDate = (value: string, locale: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
};

export const URLInputView = ({
  url,
  onUrlChange,
  onAnalyze,
  onOpenManualForm,
  onCancel,
  loading,
  stage = null,
  error,
  duplicate = null,
  manualMode,
  onManualModeChange
}: URLInputViewProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [analyzeScenes, setAnalyzeScenes] = useState(true);
  const [analyzeAudio, setAnalyzeAudio] = useState(true);
  const { t, locale } = useI18n();
  const robot = useRobot();

  const handleNext = () => {
    if (url.trim()) {
      robot.notify({ kind: 'pressed', what: 'next' });
      setStep(2);
    }
  };

  const handleRunAnalysis = () => {
    onAnalyze({ analyzeScenes, analyzeAudio });
  };

  return (
    <div className={styles.container}>
      {step === 1 ? (
        <>
          <label className={styles.label}>{t.ingest.urlLabel}</label>
          <div className={styles.inputRow} {...helpAt('ingest.url')}>
            <input
              type="text"
              className="win95-inset win95-input"
              placeholder={t.ingest.urlPlaceholder}
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              disabled={loading}
            />

            {!loading && !manualMode && (
              <button
                className={`win95-btn ${styles.runButton}`}
                onClick={handleNext}
                disabled={!url.trim()}
              >
                {t.ingest.next}
              </button>
            )}

            {!loading && manualMode && (
              <button
                className={`win95-btn ${styles.runButton}`}
                onClick={onOpenManualForm}
              >
                {t.ingest.openForm}
              </button>
            )}
          </div>

          <div className={styles.manualToggle} {...helpAt('ingest.manual')}>
            <input
              type="checkbox"
              id="manualModeCheckbox"
              className={styles.manualCheckbox}
              checked={manualMode}
              onChange={(e) => {
                robot.notify({ kind: 'pressed', what: e.target.checked ? 'manualOn' : 'manualOff' });
                onManualModeChange(e.target.checked);
              }}
              disabled={loading}
            />
            <label htmlFor="manualModeCheckbox" className={styles.manualLabel}>
              {t.ingest.manualInput}
            </label>
          </div>
        </>
      ) : (
        <div className={`win95-border ${styles.optionsContainer}`} {...helpAt('ingest.options')}>
          <div className={styles.optionsTitle}>{t.ingest.optionsTitle}</div>
          <div className={styles.optionsDescription}>
            {t.ingest.optionsDescription}
          </div>

          <div className={styles.checkboxGroup}>
            {[
              { id: 'scenesCheckbox', label: t.ingest.scenes, state: analyzeScenes, setter: setAnalyzeScenes },
              { id: 'audioCheckbox', label: t.ingest.audio, state: analyzeAudio, setter: setAnalyzeAudio }
            ].map(({ id, label, state, setter }) => (
              <div key={id} className={`${styles.manualToggle} ${styles.checkboxOption}`}>
                <input
                  type="checkbox"
                  id={id}
                  className={styles.manualCheckbox}
                  checked={state}
                  onChange={(e) => {
                    robot.notify({
                      kind: 'pressed',
                      what: e.target.checked ? 'optionOn' : 'optionOff',
                    });
                    setter(e.target.checked);
                  }}
                  disabled={loading}
                />
                <label htmlFor={id} className={`${styles.manualLabel} ${styles.checkboxOptionLabel}`}>
                  {label}
                </label>
              </div>
            ))}
          </div>

          <div className={styles.runAnalysisActions}>
            <button
              className="win95-btn"
              onClick={() => {
                robot.notify({ kind: 'pressed', what: 'back' });
                setStep(1);
              }}
              disabled={loading}
            >
              {t.common.back}
            </button>
            <button
              className={`win95-btn ${styles.runButton}`}
              onClick={handleRunAnalysis}
              disabled={loading}
            >
              {t.ingest.runAnalysis}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.progressRow} {...helpAt('ingest.progress')}>
          <div className={styles.progressContainer}>
            <StageProgress stage={stage ?? 'queued'} />

            <button
              type="button"
              onClick={onCancel}
              className={`win95-btn ${styles.cancelButton}`}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {duplicate && (
        <div className={`win95-border ${styles.notice}`} aria-live="polite" {...helpAt('ingest.duplicate')}>
          <strong>{t.ingest.duplicate.title}</strong>
          <span>{t.ingest.duplicate.body}</span>
          <span className={styles.noticeSubject}>
            {duplicate.titulo_video || duplicate.url_original}
          </span>
          <span className={styles.noticeFoot}>
            {t.ingest.duplicate.added(formatDate(duplicate.created_at, locale))}{' '}
            <a href={duplicate.url_original.trim()} target="_blank" rel="noopener noreferrer">
              {t.ingest.duplicate.open}
            </a>
          </span>
        </div>
      )}

      {error && (
        <div className="win95-border win95-error" {...helpAt('ingest.error')}>
          <span>⚠️</span>
          <strong>{error}</strong>
        </div>
      )}
    </div>
  );
};
