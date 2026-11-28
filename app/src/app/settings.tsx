import { StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, textVariants } from '../theme';
import { ScreenHeader } from '../ui/ScreenHeader';

/**
 * Settings. Game modes and the Custom options (#24) and saved preferences
 * (#25) land here; for now it shows the app version.
 */
export default function SettingsScreen() {
  // The full version, including any pre-release label (app.config.ts).
  const version = Constants.expoConfig?.version ?? 'unknown';
  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader title="Settings" onBack={() => router.back()} />
      <View style={styles.body}>
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>{version}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.md, gap: spacing['2xs'] },
  label: { ...textVariants.caption, color: colors.text.secondary },
  value: { ...textVariants.body, color: colors.text.primary },
});
