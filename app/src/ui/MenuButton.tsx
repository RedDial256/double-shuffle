import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, opacity, radii, spacing, textVariants } from '../theme';

/**
 * A full-width menu button. `primary` is the main action on a screen (filled
 * with the accent colour); `secondary` is outlined.
 */
export function MenuButton({
  label,
  onPress,
  variant = 'secondary',
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, isPrimary && styles.primaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: {
    backgroundColor: colors.transparent,
    borderColor: colors.border.subtle,
  },
  pressed: { opacity: opacity.pressed },
  label: { ...textVariants.button, color: colors.text.primary },
  primaryLabel: { color: colors.text.onAccent },
});
