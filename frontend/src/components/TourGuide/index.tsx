import { useI18n } from '../../i18n/languageContext';
import { useTour } from '../../context/tourContext';
import { Assistant } from '../Assistant';

export const TourGuide = () => {
  const { t } = useI18n();
  const { active, frame, cursor, isLast, next, back, stop } = useTour();

  if (!active || !frame) return null;

  return (
    <Assistant
      tipKey={`tour-${cursor}`}
      messages={[frame.text]}
      step={t.assistant.step(frame.step, frame.totalSteps)}
      nav={{
        onBack: back,
        onNext: isLast ? stop : next,
        canBack: cursor > 0,
        nextLabel: isLast ? t.tour.finish : t.tour.next,
      }}
    />
  );
};
