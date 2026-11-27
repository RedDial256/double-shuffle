import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '../game/config';
import type { GameEngine } from '../game/engine';
import {
  colors,
  fontSize,
  fontWeight,
  opacity,
  radii,
  spacing,
} from '../theme';

function Lights({ team, score }: { team: number; score: number }) {
  return (
    <View style={styles.lights}>
      {Array.from({ length: config.targetScore }, (_, i) => (
        <View
          key={i}
          style={[
            styles.light,
            i < score ? teamFillStyles[team] : styles.lightOff,
          ]}
        />
      ))}
    </View>
  );
}

/** Cubes the team still has to throw this round, like the rack beside the rink. */
function Rack({
  team,
  left,
  killed,
}: {
  team: number;
  left: number;
  killed: boolean;
}) {
  return (
    <View style={[styles.rack, killed && styles.rackKilled]}>
      {Array.from({ length: config.cubesPerRound }, (_, i) => (
        <View
          key={i}
          style={[styles.rackCube, i < left && teamFillStyles[team]]}
        />
      ))}
    </View>
  );
}

export function Hud({ engine }: { engine: GameEngine }) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    const unsubscribe = engine.subscribe((e) => {
      if (e.type === 'state' || e.type === 'round_ended') bump();
      if (e.type === 'message') {
        setToast(e.text);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), e.seconds * 1000);
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(toastTimer.current);
    };
  }, [engine]);

  const team = engine.currentTeam;
  const defender = engine.defendingTeam;
  let banner = '';
  if (engine.phase === 'aiming') banner = `${config.teamNames[team]} to throw`;
  else if (engine.phase === 'sliding') {
    banner = `${config.teamNames[defender]}: tap to fire (${engine.windChargesLeft} left)`;
  } else if (engine.phase === 'round_break' || engine.phase === 'game_over') {
    banner = `Round ${engine.roundIndex + (engine.phase === 'game_over' ? 1 : 0)}: ${
      engine.lastResult?.summary ?? ''
    }`;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.top} pointerEvents="none">
        {[0, 1].map((t) => (
          <View key={t} style={styles.scoreRow}>
            <Text style={[styles.teamName, teamTextStyles[t]]}>
              {config.teamNames[t]} {engine.scores[t]}
            </Text>
            <Lights team={t} score={engine.scores[t]} />
            <Rack
              team={t}
              left={engine.shotsLeft[t]}
              killed={engine.roundKilled[t]}
            />
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
          <Text style={[styles.win, teamTextStyles[engine.winner]]}>
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

/** Score light size in density independent pixels. */
const LIGHT_SIZE = 10;
/** Rack cube size in density independent pixels. */
const RACK_CUBE_SIZE = 9;
/** Width of the team name column, so the score lights line up. */
const TEAM_NAME_WIDTH = 60;

const styles = StyleSheet.create({
  top: {
    paddingTop: spacing[8],
    paddingHorizontal: spacing[12],
    gap: spacing[4],
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  teamName: {
    fontWeight: fontWeight.extraBold,
    fontSize: fontSize.sm,
    width: TEAM_NAME_WIDTH,
  },
  lights: { flexDirection: 'row', gap: spacing[4] },
  light: { width: LIGHT_SIZE, height: LIGHT_SIZE, borderRadius: radii.sm },
  lightOff: { backgroundColor: colors.indicatorOff },
  rack: { flexDirection: 'row', gap: spacing[2], marginLeft: 'auto' },
  rackKilled: { opacity: opacity.disabled },
  rackCube: {
    width: RACK_CUBE_SIZE,
    height: RACK_CUBE_SIZE,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  banner: {
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
    marginTop: spacing[2],
  },
  toast: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: colors.scrimStrong,
    padding: spacing[16],
    borderRadius: radii.md,
  },
  toastText: {
    color: colors.text.primary,
    fontWeight: fontWeight.extraBold,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
  },
  win: { fontSize: fontSize.display, fontWeight: fontWeight.black },
  sub: { color: colors.text.primary, fontSize: fontSize.xl },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
    borderRadius: radii.md,
  },
  buttonText: {
    color: colors.text.onAccent,
    fontWeight: fontWeight.extraBold,
    fontSize: fontSize.md,
  },
});

/** Background fill in each team's colour, indexed by team. */
const teamFillStyles = colors.team.map((teamColor) => ({
  backgroundColor: teamColor,
}));

/** Text in each team's colour, indexed by team. */
const teamTextStyles = colors.team.map((teamColor) => ({ color: teamColor }));
