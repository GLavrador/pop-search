const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/** A length of time in the largest unit that reads well: 412 ms, 1.2 s, 12 min, 3 h. */
export const formatDuration = (ms: number, locale: string): string => {
  if (ms < 1) return '<1 ms';
  if (ms < SECOND) return `${Math.round(ms)} ms`;
  if (ms < MINUTE) {
    return `${(ms / SECOND).toLocaleString(locale, { maximumFractionDigits: 1 })} s`;
  }
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} min`;
  return `${Math.round(ms / HOUR).toLocaleString(locale)} h`;
};
