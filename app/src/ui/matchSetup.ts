import { useShallow } from 'zustand/react/shallow';

import {
  customMode,
  type CustomSettings,
  defaultMode,
  type GameMode,
  presetModes,
} from '../game/mode';

import { type ModeChoice, useSettingsStore } from './settingsStore';

export type { ModeChoice } from './settingsStore';

interface MatchSetup {
  /** The preset id or 'custom' picked for the next match. */
  modeChoice: ModeChoice;
  customSettings: CustomSettings;
  /** The rules the next match will use. */
  selectedMode: Readonly<GameMode>;
  chooseMode: (modeChoice: ModeChoice) => void;
  updateCustomSettings: (changes: Partial<CustomSettings>) => void;
}

/** The rules for a mode choice, falling back to the default preset. */
export function modeForChoice(
  modeChoice: ModeChoice,
  customSettings: CustomSettings
): Readonly<GameMode> {
  if (modeChoice === 'custom') return customMode(customSettings);
  return presetModes.find((mode) => mode.id === modeChoice) ?? defaultMode;
}

/** The mode picked for the next match and the Custom options, saved on the device. */
export function useMatchSetup(): MatchSetup {
  const setup = useSettingsStore(
    useShallow((state) => ({
      modeChoice: state.modeChoice,
      customSettings: state.customSettings,
      chooseMode: state.chooseMode,
      updateCustomSettings: state.updateCustomSettings,
    }))
  );
  return {
    ...setup,
    selectedMode: modeForChoice(setup.modeChoice, setup.customSettings),
  };
}
