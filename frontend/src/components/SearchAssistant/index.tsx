import { useMemo } from 'react';
import { useI18n } from '../../i18n/languageContext';
import {
  countOrigins,
  pickTip,
  type AssistantContext,
  type TipId,
} from '../../constants/assistantTips';
import { Assistant } from '../Assistant';
import { useTour } from '../../context/tourContext';

const ALARMED: TipId[] = ['thresholdTooHigh', 'textTooRestrictive', 'nothingFound'];

export const SearchAssistant = (props: AssistantContext) => {
  const { t } = useI18n();
  const tour = useTour();
  const tipId = useMemo(() => pickTip(props), [props]);

  // One voice at a time: while the tutorial drives, the reactive tips step out.
  const silenced = tour.active;

  const tips = t.assistant.tips;

  if (silenced) return null;

  const messages = (() => {
    if (tipId === 'thresholdTooHigh') {
      return tips.thresholdTooHigh(Math.round(props.threshold * 100));
    }
    if (tipId === 'goodResults') {
      return tips.goodResults(countOrigins(props.results));
    }
    return tips[tipId];
  })();

  return <Assistant tipKey={tipId} messages={messages} alarmed={ALARMED.includes(tipId)} />;
};
