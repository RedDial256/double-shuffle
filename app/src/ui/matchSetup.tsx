import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  clampCustomSettings,
  customMode,
  type CustomSettings,
  defaultCustomSettings,
  defaultMode,
  type GameMode,
  presetModes,
} from '../game/mode';

/** A preset's id, or 'custom'. */
export type ModeChoice = string;

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

const MatchSetupContext = createContext<MatchSetup | null>(null);

/** The mode picked for the next match and the Custom options. */
export function MatchSetupProvider({ children }: { children: ReactNode }) {
  const [modeChoice, setModeChoice] = useState<ModeChoice>(defaultMode.id);
  const [customSettings, setCustomSettings] = useState<CustomSettings>({
    ...defaultCustomSettings,
  });

  const updateCustomSettings = useCallback(
    (changes: Partial<CustomSettings>) =>
      setCustomSettings((current) =>
        clampCustomSettings({ ...current, ...changes })
      ),
    []
  );

  const value = useMemo<MatchSetup>(
    () => ({
      modeChoice,
      customSettings,
      selectedMode: modeForChoice(modeChoice, customSettings),
      chooseMode: setModeChoice,
      updateCustomSettings,
    }),
    [modeChoice, customSettings, updateCustomSettings]
  );

  return (
    <MatchSetupContext.Provider value={value}>
      {children}
    </MatchSetupContext.Provider>
  );
}

export function useMatchSetup(): MatchSetup {
  const setup = useContext(MatchSetupContext);
  if (!setup) {
    throw new Error('useMatchSetup must be used inside MatchSetupProvider');
  }
  return setup;
}
