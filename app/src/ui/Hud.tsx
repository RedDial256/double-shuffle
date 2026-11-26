import React, { useEffect, useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { config } from '../game/config';
import { GameEngine } from '../game/engine';

function Lights({ team, score }: { team: number; score: number }) {
  return (
    <View style={styles.lights}>
      {Array.from({ length: config.targetScore }, (_, i) => (
        <View
          key={i}
          style={[
            styles.light,
            { backgroundColor: i < score ? config.teamColors[team] : '#2a2f3a' },
          ]}
        />
      ))}
    </View>
  );
}

export function Hud({ engine }: { engine: GameEngine }) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(
    () =>
      engine.subscribe((e) => {
        if (e.type === 'state' || e.type === 'round_ended') bump();
        if (e.type === 'message') {
          setToast(e.text);
          setTimeout(() => setToast(null), e.seconds * 1000);
        }
      }),
    [engine],
  );

  const team = engine.currentTeam;
  const defender = engine.defendingTeam;
  let banner = '';
  if (engine.phase === 'aiming') banner = `${config.teamNames[team]} to throw`;
  else if (engine.phase === 'sliding')
    banner = `${config.teamNames[defender]}: tap to fire (${engine.windChargesLeft} left)`;
  else if (engine.phase === 'round_break' || engine.phase === 'game_over')
    banner = engine.lastResult?.summary ?? '';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.top} pointerEvents="none">
        {[0, 1].map((t) => (
          <View key={t} style={styles.scoreRow}>
            <Text style={[styles.teamName, { color: config.teamColors[t] }]}>
              {config.teamNames[t]} {engine.scores[t]}
            </Text>
            <Lights team={t} score={engine.scores[t]} />
          </View>
        ))}
        <Text style={styles.banner}>{banner}</Text>
      </View>

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {engine.phase === 'game_over' && (
        <View style={styles.overlay}>
          <Text style={[styles.win, { color: config.teamColors[engine.winner] }]}>
            {config.teamNames[engine.winner]} wins!
          </Text>
          <Text style={styles.sub}>
            {engine.scores[0]} – {engine.scores[1]}
          </Text>
          <Pressable style={styles.button} onPress={() => engine.restart()}>
            <Text style={styles.buttonText}>Play again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: 8, paddingHorizontal: 12, gap: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamName: { fontWeight: '800', fontSize: 14, width: 60 },
  lights: { flexDirection: 'row', gap: 3 },
  light: { width: 10, height: 10, borderRadius: 2 },
  banner: { color: '#fff', fontWeight: '700', fontSize: 13, marginTop: 2 },
  toast: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: '#000c',
    padding: 14,
    borderRadius: 8,
  },
  toastText: { color: '#fff', fontWeight: '800', fontSize: 18, textAlign: 'center' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000b',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  win: { fontSize: 36, fontWeight: '900' },
  sub: { color: '#fff', fontSize: 20 },
  button: { backgroundColor: '#35c9c4', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { fontWeight: '800', fontSize: 16 },
});
