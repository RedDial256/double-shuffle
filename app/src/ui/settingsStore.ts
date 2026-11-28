import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  clampCustomSettings,
  type CustomSettings,
  defaultCustomSettings,
  defaultMode,
  presetModes,
} from '../game/mode';

/** A preset's id, or 'custom'. */
export type ModeChoice = string;

/** What is saved on the device and survives an app restart. */
export interface SavedSettings {
  /** The preset id or 'custom' picked for the next match. */
  modeChoice: ModeChoice;
  customSettings: CustomSettings;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

interface SettingsActions {
  chooseMode: (modeChoice: ModeChoice) => void;
  updateCustomSettings: (changes: Partial<CustomSettings>) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export type SettingsState = SavedSettings & SettingsActions;

export const defaultSavedSettings: Readonly<SavedSettings> = Object.freeze({
  modeChoice: defaultMode.id,
  customSettings: { ...defaultCustomSettings },
  soundEnabled: true,
  hapticsEnabled: true,
});

/** Bump when the saved shape changes, and teach `sanitizeSavedSettings` the old one. */
export const SAVED_SETTINGS_VERSION = 1;

const isModeChoice = (value: unknown): value is ModeChoice =>
  value === 'custom' || presetModes.some((mode) => mode.id === value);

/**
 * Turns whatever was read back from the device into valid settings. The data
 * may be from an older version, missing fields or hand-edited, so anything
 * unknown falls back to the default.
 */
export function sanitizeSavedSettings(saved: unknown): SavedSettings {
  const fields =
    typeof saved === 'object' && saved !== null
      ? (saved as Partial<Record<keyof SavedSettings, unknown>>)
      : {};
  const customSettings =
    typeof fields.customSettings === 'object' && fields.customSettings !== null
      ? (fields.customSettings as Partial<CustomSettings>)
      : {};
  return {
    modeChoice: isModeChoice(fields.modeChoice)
      ? fields.modeChoice
      : defaultSavedSettings.modeChoice,
    customSettings: clampCustomSettings(customSettings),
    soundEnabled:
      typeof fields.soundEnabled === 'boolean'
        ? fields.soundEnabled
        : defaultSavedSettings.soundEnabled,
    hapticsEnabled:
      typeof fields.hapticsEnabled === 'boolean'
        ? fields.hapticsEnabled
        : defaultSavedSettings.hapticsEnabled,
  };
}

/**
 * The player's choices: the mode for the next match, the Custom options and
 * the sound and haptics toggles. Saved on the device with AsyncStorage
 * (docs/decisions.md D-26). Reading it back is asynchronous, so the first
 * frame after launch shows the defaults.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSavedSettings,
      chooseMode: (modeChoice) =>
        set({
          modeChoice: isModeChoice(modeChoice)
            ? modeChoice
            : defaultSavedSettings.modeChoice,
        }),
      updateCustomSettings: (changes) =>
        set((state) => ({
          customSettings: clampCustomSettings({
            ...state.customSettings,
            ...changes,
          }),
        })),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
    }),
    {
      name: 'double-shuffle-settings',
      version: SAVED_SETTINGS_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      // Save the data only, never the actions.
      partialize: (state): SavedSettings => ({
        modeChoice: state.modeChoice,
        customSettings: state.customSettings,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
      }),
      merge: (saved, current) => ({
        ...current,
        ...sanitizeSavedSettings(saved),
      }),
    }
  )
);
