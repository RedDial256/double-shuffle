import { describe, expect, it } from '@jest/globals';

import { classicMode, customMode } from '../../game/mode';
import { modeSummary } from '../modeSummary';

describe('modeSummary', () => {
  it('describes the Classic rules', () => {
    expect(modeSummary(classicMode)).toBe(
      '4 cubes each, first to 15, 2 wind charges'
    );
  });

  it('uses the singular for one wind charge', () => {
    expect(modeSummary(customMode({ windChargesPerThrow: 1 }))).toBe(
      '4 cubes each, first to 15, 1 wind charge'
    );
  });
});
