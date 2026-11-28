import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  customLimits,
  presetModes,
  type WindStrength,
  windStrengths,
} from '../game/mode';
import { colors, radii, spacing, textVariants } from '../theme';
import { type ModeChoice, useMatchSetup } from '../ui/matchSetup';
import { MenuButton } from '../ui/MenuButton';
import { modeSummary, modeTaglines } from '../ui/modeSummary';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Stepper } from '../ui/Stepper';

/** Pick the rules before a match: a preset, or Custom with a few options. */
export default function NewMatchScreen() {
  const {
    modeChoice,
    customSettings,
    selectedMode,
    chooseMode,
    updateCustomSettings,
  } = useMatchSetup();

  return (
    <SafeAreaView style={styles.root}>
      <ScreenHeader title="New match" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.body}>
        {presetModes.map((mode) => (
          <ModeCard
            key={mode.id}
            choice={mode.id}
            name={mode.name}
            summary={modeSummary(mode)}
            selected={modeChoice === mode.id}
            onSelect={chooseMode}
          />
        ))}
        <ModeCard
          choice="custom"
          name="Custom"
          summary={
            modeChoice === 'custom'
              ? modeSummary(selectedMode)
              : modeTaglines.custom
          }
          selected={modeChoice === 'custom'}
          onSelect={chooseMode}>
          <View style={styles.customOptions}>
            <Stepper
              label="Points to win"
              value={customSettings.targetScore}
              {...customLimits.targetScore}
              onChange={(targetScore) => updateCustomSettings({ targetScore })}
            />
            <Stepper
              label="Cubes per round"
              value={customSettings.cubesPerRound}
              {...customLimits.cubesPerRound}
              onChange={(cubesPerRound) =>
                updateCustomSettings({ cubesPerRound })
              }
            />
            <Stepper
              label="Wind charges per throw"
              value={customSettings.windChargesPerThrow}
              {...customLimits.windChargesPerThrow}
              onChange={(windChargesPerThrow) =>
                updateCustomSettings({ windChargesPerThrow })
              }
            />
            <WindStrengthPicker
              value={customSettings.windStrength}
              onChange={(windStrength) =>
                updateCustomSettings({ windStrength })
              }
            />
          </View>
        </ModeCard>
      </ScrollView>
      <View style={styles.footer}>
        <MenuButton
          label={`Start ${selectedMode.name}`}
          variant="primary"
          onPress={() => router.replace('/game')}
        />
      </View>
    </SafeAreaView>
  );
}

/** A selectable mode. The Custom card shows its options when selected. */
function ModeCard({
  choice,
  name,
  summary,
  selected,
  onSelect,
  children,
}: {
  choice: ModeChoice;
  name: string;
  summary: string;
  selected: boolean;
  onSelect: (choice: ModeChoice) => void;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <Pressable
        onPress={() => onSelect(choice)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={styles.cardHeader}>
        <Text style={styles.cardName}>{name}</Text>
        {modeTaglines[choice] && choice !== 'custom' && (
          <Text style={styles.cardTagline}>{modeTaglines[choice]}</Text>
        )}
        <Text style={styles.cardSummary}>{summary}</Text>
      </Pressable>
      {selected && children}
    </View>
  );
}

function WindStrengthPicker({
  value,
  onChange,
}: {
  value: WindStrength;
  onChange: (windStrength: WindStrength) => void;
}) {
  const strengths = Object.keys(windStrengths) as WindStrength[];
  return (
    <View style={styles.windRow}>
      <Text style={styles.windLabel}>Wind strength</Text>
      <View style={styles.segments} accessibilityRole="radiogroup">
        {strengths.map((strength) => {
          const isSelected = strength === value;
          return (
            <Pressable
              key={strength}
              onPress={() => onChange(strength)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={[styles.segment, isSelected && styles.segmentSelected]}>
              <Text
                style={[
                  styles.segmentLabel,
                  isSelected && styles.segmentLabelSelected,
                ]}>
                {windStrengths[strength].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.md, gap: spacing.sm },
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardSelected: { borderColor: colors.accent },
  cardHeader: { gap: spacing['3xs'] },
  cardName: { ...textVariants.heading, color: colors.text.primary },
  cardTagline: { ...textVariants.body, color: colors.text.primary },
  cardSummary: { ...textVariants.caption, color: colors.text.secondary },
  customOptions: { gap: spacing.sm },
  windRow: { gap: spacing.xs },
  windLabel: { ...textVariants.body, color: colors.text.primary },
  segments: { flexDirection: 'row', gap: spacing.xs },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  segmentSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  segmentLabel: { ...textVariants.label, color: colors.text.primary },
  segmentLabelSelected: { color: colors.text.onAccent },
});
