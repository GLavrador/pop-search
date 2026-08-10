import { describe, it, expect } from 'vitest';
import {
  DEFAULT_THRESHOLD,
  PRECISION_PRESETS,
  findPresetByThreshold,
} from './searchPresets';

describe('findPresetByThreshold', () => {
  it('should match every preset by its own threshold', () => {
    for (const preset of PRECISION_PRESETS) {
      expect(findPresetByThreshold(preset.threshold)?.id).toBe(preset.id);
    }
  });

  it('should resolve the default threshold to Balanced', () => {
    expect(findPresetByThreshold(DEFAULT_THRESHOLD)?.label).toBe('Balanced');
  });

  it('should tolerate floating point drift', () => {
    // 0.2 + 0.4 === 0.6000000000000001, not 0.6. An exact comparison would miss
    // it and silently drop the user into the Custom state.
    expect(0.2 + 0.4).not.toBe(0.6);
    expect(findPresetByThreshold(0.2 + 0.4)?.id).toBe('balanced');
  });

  it('should return null for a value between presets', () => {
    expect(findPresetByThreshold(0.52)).toBeNull();
  });

  it('should return null once drift exceeds the tolerance', () => {
    expect(findPresetByThreshold(0.61)).toBeNull();
  });
});
