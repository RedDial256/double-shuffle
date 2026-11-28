import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, textVariants } from '../theme';

/** Title bar of a menu screen, with a button that goes back. */
export function ScreenHeader({
  title,
  backLabel = 'Back',
  onBack,
}: {
  title: string;
  backLabel?: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Pressable
        onPress={onBack}
        style={styles.back}
        hitSlop={8}
        accessibilityRole="button">
        <Text style={styles.backText}>{backLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  title: { ...textVariants.title, color: colors.text.primary },
  back: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  backText: { ...textVariants.label, color: colors.text.onAccent },
});
