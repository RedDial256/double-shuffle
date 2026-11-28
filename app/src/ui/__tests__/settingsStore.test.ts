import { describe, expect, it, jest } from '@jest/globals';

import { defaultCustomSettings, quickMode } from '../../game/mode';
import { modeForChoice } from '../matchSetup';
import {
  defaultSavedSettings,
  sanitizeSavedSettings,
  useSettingsStore,
} from '../settingsStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock'
  )
);

describe('sanitizeSavedSettings', () => {
  it('falls back to the defaults for missing or broken data', () => {
    expect(sanitizeSavedSettings(undefined)).toEqual(defaultSavedSettings);
    expect(sanitizeSavedSettings('oops')).toEqual(defaultSavedSettings);
    expect(sanitizeSavedSettings({})).toEqual(defaultSavedSettings);
  });

  it('keeps valid saved values', () => {
    const saved = {
      modeChoice: 'custom',
      customSettings: {
        targetScore: 12,
        cubesPerRound: 5,
        windChargesPerThrow: 1,
        windStrength: 'strong',
      },
      soundEnabled: false,
      hapticsEnabled: false,
    };
    expect(sanitizeSavedSettings(saved)).toEqual(saved);
  });

  it('drops an unknown mode and clamps Custom values', () => {
    const sanitized = sanitizeSavedSettings({
      modeChoice: 'removed-mode',
      customSettings: { targetScore: 999, windStrength: 'hurricane' },
      soundEnabled: 'yes',
    });
    expect(sanitized.modeChoice).toBe(defaultSavedSettings.modeChoice);
    expect(sanitized.customSettings.targetScore).toBe(20);
    expect(sanitized.customSettings.windStrength).toBe(
      defaultCustomSettings.windStrength
    );
    expect(sanitized.soundEnabled).toBe(true);
  });
});

describe('useSettingsStore', () => {
  it('updates the mode, Custom values and toggles', () => {
    const store = useSettingsStore.getState();
    store.chooseMode(quickMode.id);
    store.updateCustomSettings({ cubesPerRound: 99 });
    store.setSoundEnabled(false);
    store.setHapticsEnabled(false);
    const state = useSettingsStore.getState();
    expect(state.modeChoice).toBe(quickMode.id);
    expect(state.customSettings.cubesPerRound).toBe(6);
    expect(state.soundEnabled).toBe(false);
    expect(state.hapticsEnabled).toBe(false);
    expect(modeForChoice(state.modeChoice, state.customSettings)).toBe(
      quickMode
    );
  });

  it('ignores an unknown mode choice', () => {
    useSettingsStore.getState().chooseMode('nope');
    expect(useSettingsStore.getState().modeChoice).toBe(
      defaultSavedSettings.modeChoice
    );
  });
});
