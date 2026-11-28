import { describe, expect, it } from '@jest/globals';

import { boardResetSteps } from '../boardReset';

describe('boardResetSteps', () => {
  it('turns the lights off one at a time until both are zero', () => {
    expect(boardResetSteps([3, 1])).toEqual([
      [2, 0],
      [1, 0],
      [0, 0],
    ]);
  });

  it('has nothing to do on an empty board', () => {
    expect(boardResetSteps([0, 0])).toEqual([]);
  });

  it('treats negative totals as already reset', () => {
    expect(boardResetSteps([2, -3])).toEqual([
      [1, 0],
      [0, 0],
    ]);
  });
});
