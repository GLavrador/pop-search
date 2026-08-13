export type PresetId = 'broad' | 'balanced' | 'precise';

export interface PrecisionPreset {
  id: PresetId;
  threshold: number;
}

/**
 * Thresholds calibrated for gemini-embedding-001 with asymmetric embeddings
 * (retrieval_query when searching, retrieval_document when indexing). Under
 * that setup relevant documents typically land in the 0.55-0.75 range, which
 * is why the previous 0.70 default returned "0 found" so often.
 *
 * The threshold only affects the vector branch of the search. Exact text
 * matches show up regardless of the selected preset.
 */
export const PRECISION_PRESETS: readonly PrecisionPreset[] = [
  { id: 'broad', threshold: 0.45 },
  { id: 'balanced', threshold: 0.6 },
  { id: 'precise', threshold: 0.75 },
] as const;

export const DEFAULT_THRESHOLD = 0.6;

export const DEFAULT_LIMIT = 5;

/** Returns the preset matching the given threshold, or null for a custom value. */
export const findPresetByThreshold = (threshold: number): PrecisionPreset | null =>
  PRECISION_PRESETS.find((preset) => Math.abs(preset.threshold - threshold) < 0.001) ?? null;
