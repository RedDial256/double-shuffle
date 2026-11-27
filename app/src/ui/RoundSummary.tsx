import { Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '../game/config';
import type { RoundSummary as Summary } from '../game/roundSummary';
import { describeCubes, formatSigned } from '../game/roundSummary';

const palette = {
  card: '#14171fee',
  ring: '#f5d76e',
  muted: '#9aa3b5',
  text: '#ffffff',
  body: '#dfe4ee',
  penalty: '#ff9b7a',
  button: '#35c9c4',
};

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
          summary.leader !== -1 && { color: config.teamColors[summary.leader] },
        ]}>
        {summary.headline}
      </Text>

      {summary.teams.map((t) => (
        <View key={t.team} style={styles.row}>
          <Text style={[styles.team, { color: config.teamColors[t.team] }]}>
            {t.name}
          </Text>
          <View style={styles.detail}>
            <Text style={styles.cubes}>{describeCubes(t)}</Text>
            {t.penalties > 0 && (
              <Text style={styles.penalty}>
                −{t.penalties} windburst{' '}
                {t.penalties === 1 ? 'penalty' : 'penalties'}
              </Text>
            )}
          </View>
          <View style={styles.numbers}>
            <Text style={styles.net}>{formatSigned(t.net)}</Text>
            <Text style={styles.total}>{t.total} total</Text>
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

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: '88%',
    maxWidth: 380,
    backgroundColor: palette.card,
    borderColor: palette.ring,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  round: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headline: { color: palette.text, fontSize: 20, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  team: { fontWeight: '800', fontSize: 16, width: 48 },
  detail: { flex: 1 },
  cubes: { color: palette.body, fontSize: 14 },
  penalty: { color: palette.penalty, fontSize: 13, fontWeight: '700' },
  numbers: { alignItems: 'flex-end' },
  net: { color: palette.text, fontSize: 22, fontWeight: '900' },
  total: { color: palette.muted, fontSize: 12 },
  button: {
    alignSelf: 'center',
    backgroundColor: palette.button,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  buttonText: { fontWeight: '800', fontSize: 16 },
});
