import { describe, expect, it } from '@jest/globals';

import { config } from '../../game/config';
import { rulebook } from '../rulebook';

const text = () =>
  rulebook()
    .flatMap((section) => [section.title, ...section.paragraphs])
    .join('\n');

describe('rulebook', () => {
  it('covers every topic the Rules screen must explain', () => {
    const ids = rulebook().map((section) => section.id);
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
    expect(new Set(sections.map((section) => section.id)).size).toBe(
      sections.length
    );
    for (const section of sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it('quotes the numbers from config', () => {
    const rules = text();
    expect(rules).toContain(`${config.targetScore} points`);
    expect(rules).toContain(`${config.cubesPerRound} cubes per round`);
    expect(rules).toContain(`up to ${config.windChargesPerThrow} wind charge`);
    expect(rules).toContain('-1 point');
    expect(rules).toContain('worth 4');
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
