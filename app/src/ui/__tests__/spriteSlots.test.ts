import { describe, expect, it } from '@jest/globals';

import { classicMode } from '../../game/mode';
import { spriteSlots } from '../spriteSlots';

describe('spriteSlots', () => {
  it('matches the classic rules', () => {
    expect(spriteSlots(classicMode)).toEqual({ cubes: 8, charges: 4 });
  });

  it('follows the cubes per round and wind charges of the match', () => {
    const bigMatch = {
      ...classicMode,
      cubesPerRound: 6,
      windChargesPerThrow: 3,
    };
    expect(spriteSlots(bigMatch)).toEqual({ cubes: 12, charges: 6 });
    const smallMatch = {
      ...classicMode,
      cubesPerRound: 2,
      windChargesPerThrow: 1,
    };
    expect(spriteSlots(smallMatch)).toEqual({ cubes: 4, charges: 2 });
  });
});
