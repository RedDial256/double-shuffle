import { describe, expect, it } from '@jest/globals';

import { isAppInForeground } from '../appState';

describe('isAppInForeground', () => {
  it('is true only while the app is active', () => {
    expect(isAppInForeground('active')).toBe(true);
    expect(isAppInForeground('background')).toBe(false);
    expect(isAppInForeground('inactive')).toBe(false);
  });
});
