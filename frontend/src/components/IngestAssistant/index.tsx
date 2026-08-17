import { useI18n } from '../../i18n/languageContext';
import {
  pickIngestTip,
  STEP_NUMBER,
  TOTAL_STEPS,
  type IngestContext,
  type IngestTipId,
} from '../../constants/ingestTips';
import { Assistant } from '../Assistant';

const ALARMED: IngestTipId[] = ['badLink', 'failed'];

export const IngestAssistant = (props: IngestContext) => {
  const { t } = useI18n();
  const tipId = pickIngestTip(props);
  const step = STEP_NUMBER[tipId];

  return (
    <Assistant
      tipKey={tipId}
      message={t.ingestAssistant.tips[tipId]}
      alarmed={ALARMED.includes(tipId)}
      step={step ? t.assistant.step(step, TOTAL_STEPS) : undefined}
    />
  );
};
