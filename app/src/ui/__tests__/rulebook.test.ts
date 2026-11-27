import { describe, expect, it } from '@jest/globals';

import { classicMode } from '../../game/mode';
import { rulebook } from '../rulebook';

const text = (mode = classicMode) =>
  rulebook(mode)
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

  it('quotes the numbers from the mode', () => {
    const rules = text();
    expect(rules).toContain(`${classicMode.targetScore} points`);
    expect(rules).toContain(`${classicMode.cubesPerRound} cubes per round`);
    expect(rules).toContain(
      `up to ${classicMode.windChargesPerThrow} wind charge`
    );
    expect(rules).toContain('-1 point');
    expect(rules).toContain('worth 4');
  });

  it('follows the mode it is given', () => {
    const rules = text({
      ...classicMode,
      targetScore: 21,
      cubesPerRound: 3,
      windChargesPerThrow: 1,
    });
    expect(rules).toContain('21 points');
    expect(rules).toContain('3 cubes per round');
    expect(rules).toContain('up to 1 wind charge');
  });
});
