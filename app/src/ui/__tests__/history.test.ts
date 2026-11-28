import { describe, expect, it } from '@jest/globals';

import { history } from '../history';

describe('history', () => {
  it('credits the original builders and says it is not affiliated', () => {
    const text = history.flatMap((section) => section.paragraphs).join(' ');
    expect(text).toContain('Skizzleman');
    expect(text).toContain('ImpulseSV');
    expect(text).toContain('not affiliated');
  });

  it('has unique section ids and no empty sections', () => {
    const ids = history.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of history) {
      expect(section.paragraphs.length).toBeGreaterThan(0);
    }
  });
});
