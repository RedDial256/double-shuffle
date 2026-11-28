import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, opacity, radii, spacing, textVariants } from '../theme';

/** A number setting with − and + buttons, kept within `min` and `max`. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const canDecrease = value > min;
  const canIncrease = value < max;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <StepButton
          symbol="−"
          enabled={canDecrease}
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(value - 1)}
        />
        <Text
          style={styles.value}
          accessibilityLabel={`${label}: ${value}`}
          accessibilityLiveRegion="polite">
          {value}
        </Text>
        <StepButton
          symbol="+"
          enabled={canIncrease}
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(value + 1)}
        />
      </View>
    </View>
  );
}

function StepButton({
  symbol,
  enabled,
  accessibilityLabel,
  onPress,
}: {
  symbol: string;
  enabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !enabled }}
      style={[styles.stepButton, !enabled && styles.disabled]}>
      <Text style={styles.stepSymbol}>{symbol}</Text>
    </Pressable>
  );
}

/** Width and height of a − or + button. */
const STEP_BUTTON_SIZE = 36;
/** Width of the number, so the buttons don't move as it changes. */
const VALUE_WIDTH = 32;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: { ...textVariants.body, color: colors.text.primary, flexShrink: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepButton: {
    width: STEP_BUTTON_SIZE,
    height: STEP_BUTTON_SIZE,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: opacity.disabled },
  stepSymbol: { ...textVariants.button, color: colors.text.primary },
  value: {
    ...textVariants.score,
    color: colors.text.primary,
    width: VALUE_WIDTH,
    textAlign: 'center',
  },
});
