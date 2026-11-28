import { StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, textVariants } from '../theme';
import { ScreenHeader } from '../ui/ScreenHeader';
import { useSettingsStore } from '../ui/settingsStore';

/**
 * Settings: the sound and haptics toggles, saved on the device, and the app
 * version. Sound and haptics themselves arrive with M4; the toggles are saved
 * now so the player's choice is already there when they do.
 */
export default function SettingsScreen() {
  // The full version, including any pre-release label (app.config.ts).
  const version = Constants.expoConfig?.version ?? 'unknown';
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const setSoundEnabled = useSettingsStore((state) => state.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore(
    (state) => state.setHapticsEnabled
  );
  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />
      <View style={styles.body}>
        <ToggleRow
          label="Sound"
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
        <ToggleRow
          label="Haptics"
          value={hapticsEnabled}
          onValueChange={setHapticsEnabled}
        />
        <View style={styles.version}>
          <Text style={styles.label}>Version</Text>
          <Text style={styles.value}>{version}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.value}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.indicatorOff, true: colors.accent }}
        thumbColor={colors.text.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.md, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  version: { gap: spacing['2xs'] },
  label: { ...textVariants.caption, color: colors.text.secondary },
  value: { ...textVariants.body, color: colors.text.primary },
});
