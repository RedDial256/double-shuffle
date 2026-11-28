import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, spacing, textVariants } from '../theme';

/** Small button in the corner of the game that opens the Pause menu. */
export function PauseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.button}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Pause the game">
      <Text style={styles.label}>Pause</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  label: { ...textVariants.label, color: colors.text.primary },
});
