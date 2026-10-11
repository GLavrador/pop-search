import { useEffect } from 'react';
import { findPresetByThreshold } from '../constants/searchPresets';
import { findSearchMode, type SearchMode } from '../constants/searchModes';
import { useStatusFacts, type StatusScope } from '../context/statusFacts';
import { useI18n } from '../i18n/languageContext';

export const useSearchFacts = (scope: StatusScope, mode: SearchMode, threshold: number) => {
  const { post } = useStatusFacts();
  const { t } = useI18n();

  useEffect(() => {
    const about = t.searchModes[mode];
    const preset = findPresetByThreshold(threshold);

    post(scope, [
      { text: about.label, hint: about.hint },
      ...(findSearchMode(mode).usesThreshold
        ? [
            {
              text: t.search.precision(Math.round(threshold * 100)),
              hint: preset ? t.presets[preset.id].hint : undefined,
            },
          ]
        : []),
    ]);

    return () => post(scope, null);
  }, [post, scope, mode, threshold, t]);
};
