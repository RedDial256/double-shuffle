import { describe, expect, it } from '@jest/globals';

import { config } from '../../game/config';
import { rulebook } from '../rulebook';

const text = () =>
  rulebook()
    .flatMap((s) => [s.title, ...s.paragraphs])
    .join('\n');

describe('rulebook', () => {
  it('covers every topic the Rules screen must explain', () => {
    const ids = rulebook().map((s) => s.id);
    for (const topic of [
      'lining-up',
      'throwing',
      'defending',
      'scoring',
      'round-killer',
      'winning',
    ]) {
      expect(ids).toContain(topic);
    }
  });

  it('has unique section ids and no empty sections', () => {
    const sections = rulebook();
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
    for (const s of sections) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it('quotes the numbers from config', () => {
    const t = text();
    expect(t).toContain(`${config.targetScore} points`);
    expect(t).toContain(`${config.cubesPerRound} cubes per round`);
    expect(t).toContain(`up to ${config.windChargesPerThrow} wind charge`);
    expect(t).toContain('-1 point');
    expect(t).toContain('worth 4');
  });

  it('follows config changes', () => {
    const saved = config.targetScore;
    config.targetScore = 21;
    try {
      expect(text()).toContain('21 points');
    } finally {
      config.targetScore = saved;
    }
  });
});
