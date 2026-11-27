import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RoundSummary as Summary } from '../game/roundSummary';
import { describeCubes, formatSigned } from '../game/roundSummary';
import { colors, radii, spacing, textVariants } from '../theme';

interface Props {
  summary: Summary;
  /** Shown as a button when the next round can be started early. */
  onNext?: () => void;
}

/** End-of-round card: who holds the front, points per team, penalties. */
export function RoundSummary({ summary, onNext }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.round}>Round {summary.round}</Text>
      <Text
        style={[
          styles.headline,
          summary.leader !== -1 && teamTextStyles[summary.leader],
        ]}>
        {summary.headline}
      </Text>

      {summary.teams.map((teamSummary) => (
        <View key={teamSummary.team} style={styles.row}>
          <Text style={[styles.team, teamTextStyles[teamSummary.team]]}>
            {teamSummary.name}
          </Text>
          <View style={styles.detail}>
            <Text style={styles.cubes}>{describeCubes(teamSummary)}</Text>
            {teamSummary.penalties > 0 && (
              <Text style={styles.penalty}>
                −{teamSummary.penalties} windburst{' '}
                {teamSummary.penalties === 1 ? 'penalty' : 'penalties'}
              </Text>
            )}
          </View>
          <View style={styles.numbers}>
            <Text style={styles.net}>{formatSigned(teamSummary.net)}</Text>
            <Text style={styles.total}>{teamSummary.total} total</Text>
          </View>
        </View>
      ))}

      {onNext && (
        <Pressable
          accessibilityRole="button"
          style={styles.button}
          onPress={onNext}>
          <Text style={styles.buttonText}>Next round</Text>
        </Pressable>
      )}
    </View>
  );
}

/** The card's share of the screen width, and its cap on wide screens. */
const CARD_WIDTH = '88%';
const CARD_MAX_WIDTH = 380;
/** Width of the team name column, so the rows line up. */
const TEAM_NAME_WIDTH = 48;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: CARD_WIDTH,
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: colors.surface,
    borderColor: colors.border.highlight,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  round: { ...textVariants.caption, color: colors.text.secondary },
  headline: { ...textVariants.title, color: colors.text.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  team: { ...textVariants.label, width: TEAM_NAME_WIDTH },
  detail: { flex: 1 },
  cubes: { ...textVariants.body, color: colors.text.primary },
  penalty: { ...textVariants.caption, color: colors.text.penalty },
  numbers: { alignItems: 'flex-end' },
  net: { ...textVariants.score, color: colors.text.primary },
  total: { ...textVariants.caption, color: colors.text.secondary },
  button: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing['2xs'],
  },
  buttonText: { ...textVariants.button, color: colors.text.onAccent },
});

/** Text in each team's colour, indexed by team. */
const teamTextStyles = colors.team.map((teamColor) => ({ color: teamColor }));
