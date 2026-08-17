import { useMemo } from 'react';
import { useI18n } from '../../i18n/languageContext';
import { pickTip, type AssistantContext, type TipId } from '../../constants/assistantTips';
import { Assistant } from '../Assistant';

const ALARMED: TipId[] = ['thresholdTooHigh', 'textTooRestrictive', 'nothingFound'];

export const SearchAssistant = (props: AssistantContext) => {
  const { t } = useI18n();
  const tipId = useMemo(() => pickTip(props), [props]);

  if (!tipId) return null;

  const tips = t.assistant.tips;

  const message =
    tipId === 'thresholdTooHigh'
      ? tips.thresholdTooHigh(Math.round(props.threshold * 100))
      : tips[tipId];

  return <Assistant tipKey={tipId} message={message} alarmed={ALARMED.includes(tipId)} />;
};
