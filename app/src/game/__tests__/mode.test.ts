import { describe, expect, it } from '@jest/globals';

import { GameEngine } from '../engine';
import {
  chaoticMode,
  clampCustomSettings,
  classicMode,
  customLimits,
  customMode,
  defaultCustomSettings,
  presetModes,
  quickMode,
} from '../mode';

describe('presets', () => {
  it('offers Quick, Classic and Chaotic, with unique ids', () => {
    expect(presetModes.map((mode) => mode.id)).toEqual([
      'quick',
      'classic',
      'chaotic',
    ]);
  });

  it('makes Quick shorter than Classic', () => {
    expect(quickMode.cubesPerRound).toBeLessThan(classicMode.cubesPerRound);
    expect(quickMode.targetScore).toBeLessThan(classicMode.targetScore);
  });

  it('makes Chaotic windier than Classic', () => {
    expect(chaoticMode.windChargesPerThrow).toBeGreaterThan(
      classicMode.windChargesPerThrow
    );
    expect(chaoticMode.windBlastImpulse).toBeGreaterThan(
      classicMode.windBlastImpulse
    );
  });

  it('keeps Classic as the rulebook rules', () => {
    expect(classicMode.cubesPerRound).toBe(4);
    expect(classicMode.targetScore).toBe(15);
  });

  it('starts an engine match with each preset', () => {
    for (const mode of presetModes) {
      const engine = new GameEngine();
      engine.startMatch(mode);
      expect(engine.shotsLeft).toEqual([
        mode.cubesPerRound,
        mode.cubesPerRound,
      ]);
      expect(engine.windChargesLeft).toBe(mode.windChargesPerThrow);
    }
  });
});

describe('custom mode', () => {
  it('defaults to the Classic rules', () => {
    const mode = customMode(defaultCustomSettings);
    expect(mode.id).toBe('custom');
    expect(mode.targetScore).toBe(classicMode.targetScore);
    expect(mode.cubesPerRound).toBe(classicMode.cubesPerRound);
    expect(mode.windBlastImpulse).toBe(classicMode.windBlastImpulse);
  });

  it('applies each option', () => {
    const mode = customMode({
      targetScore: 7,
      cubesPerRound: 5,
      windChargesPerThrow: 0,
      windStrength: 'strong',
    });
    expect(mode.targetScore).toBe(7);
    expect(mode.cubesPerRound).toBe(5);
    expect(mode.windChargesPerThrow).toBe(0);
    expect(mode.windBlastImpulse).toBeGreaterThan(classicMode.windBlastImpulse);
  });

  it('clamps options to the safe limits', () => {
    const safe = clampCustomSettings({
      targetScore: 99,
      cubesPerRound: 0,
      windChargesPerThrow: -3,
    });
    expect(safe.targetScore).toBe(customLimits.targetScore.max);
    expect(safe.cubesPerRound).toBe(customLimits.cubesPerRound.min);
    expect(safe.windChargesPerThrow).toBe(customLimits.windChargesPerThrow.min);
  });

  it('falls back to defaults for unreadable values', () => {
    const safe = clampCustomSettings({
      targetScore: Number.NaN,
      cubesPerRound: 3.6,
      windStrength: 'hurricane' as never,
    });
    expect(safe.targetScore).toBe(defaultCustomSettings.targetScore);
    expect(safe.cubesPerRound).toBe(4);
    expect(safe.windStrength).toBe('normal');
  });
});
