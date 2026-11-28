import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { colors, radii, spacing, textVariants } from '../theme';
import { useGameEngine } from '../ui/GameEngineContext';
import { MenuButton } from '../ui/MenuButton';

/**
 * The Pause menu, a modal over the match. The engine stands still while it
 * is open (D-21): sliding cubes, wind charges and round timers all wait.
 */
export default function PauseScreen() {
  const engine = useGameEngine();

  useEffect(() => {
    engine.setPaused(true);
    // Closing the menu by any route (Resume, Android back) resumes the match.
    return () => engine.setPaused(false);
  }, [engine]);

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title} accessibilityRole="header">
          Paused
        </Text>
        <MenuButton
          label="Resume"
          variant="primary"
          onPress={() => router.back()}
        />
        <MenuButton
          label="Restart match"
          onPress={() => {
            engine.restart();
            router.back();
          }}
        />
        <MenuButton label="Rules" onPress={() => router.push('/rules')} />
        <MenuButton
          label="Quit to Home"
          accessibilityHint="Ends the current match"
          onPress={() => router.dismissTo('/')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
  },
  title: { ...textVariants.title, color: colors.text.primary },
});
