import { type ReactNode, useEffect, useReducer, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { config } from '../game/config';
import type { GameEngine } from '../game/engine';
import { summariseRound } from '../game/roundSummary';
import { colors, opacity, radii, spacing, textVariants } from '../theme';

import { boardResetSteps } from './boardReset';
import { PauseButton } from './PauseButton';
import { RoundSummary } from './RoundSummary';

function Lights({
  team,
  score,
  target,
}: {
  team: number;
  score: number;
  target: number;
}) {
  return (
    <View style={styles.lights}>
      {Array.from({ length: target }, (_, pointIndex) => (
        <View
          key={pointIndex}
          style={[
            styles.light,
            pointIndex < score ? teamFillStyles[team] : styles.lightOff,
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
  total,
  killed,
}: {
  team: number;
  left: number;
  total: number;
  killed: boolean;
}) {
  return (
    <View style={[styles.rack, killed && styles.rackKilled]}>
      {Array.from({ length: total }, (_, cubeIndex) => (
        <View
          key={cubeIndex}
          style={[styles.rackCube, cubeIndex < left && teamFillStyles[team]]}
        />
      ))}
    </View>
  );
}

/** Time each score light takes to go out during the board reset. */
const RESET_STEP_MS = 90;

/**
 * The game screen around the board: a score band on top (scores, score
 * lights, cubes left, whose turn it is and Pause), the board filling the rest,
 * and the toast, round summary and game-over overlays above both.
 */
export function Hud({
  engine,
  board,
  onPause,
  onQuitToHome,
}: {
  engine: GameEngine;
  /** The board, drawn below the score band. */
  board: ReactNode;
  onPause: () => void;
  /** Leaves the match from the game-over screen. */
  onQuitToHome: () => void;
}) {
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // While the loser resets the board, the lights show these instead of the
  // final scores.
  const [resetScores, setResetScores] = useState<[number, number] | null>(null);
  const resetTimer = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );
  useEffect(() => () => clearInterval(resetTimer.current), []);

  const startRematch = () => {
    if (resetScores) return;
    const steps = boardResetSteps([engine.scores[0], engine.scores[1]]);
    let stepIndex = 0;
    setResetScores([engine.scores[0], engine.scores[1]]);
    resetTimer.current = setInterval(() => {
      if (stepIndex < steps.length) {
        setResetScores(steps[stepIndex]);
        stepIndex += 1;
        return;
      }
      clearInterval(resetTimer.current);
      setResetScores(null);
      engine.restart();
    }, RESET_STEP_MS);
  };

  useEffect(() => {
    const unsubscribe = engine.subscribe((event) => {
      if (event.type === 'state' || event.type === 'round_ended') bump();
      if (event.type === 'message') {
        setToast(event.text);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(
          () => setToast(null),
          event.seconds * 1000
        );
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
  } else if (engine.phase === 'round_break') {
    banner = 'Round over';
  }

  const showSummary =
    engine.phase === 'round_break' || engine.phase === 'game_over';
  const summary =
    showSummary && engine.lastResult
      ? summariseRound(engine.lastResult, engine.lastResultRound, engine.scores)
      : null;

  return (
    <View style={styles.fill}>
      <View style={styles.band}>
        {[0, 1].map((teamIndex) => (
          <View key={teamIndex} style={styles.scoreRow}>
            <Text style={[styles.teamName, teamTextStyles[teamIndex]]}>
              {config.teamNames[teamIndex]} {engine.scores[teamIndex]}
            </Text>
            <Lights
              team={teamIndex}
              score={resetScores?.[teamIndex] ?? engine.scores[teamIndex]}
              target={engine.mode.targetScore}
            />
            <Rack
              team={teamIndex}
              left={engine.shotsLeft[teamIndex]}
              total={engine.mode.cubesPerRound}
              killed={engine.roundKilled[teamIndex]}
            />
          </View>
        ))}
        <View style={styles.bannerRow}>
          <Text style={styles.banner} accessibilityLiveRegion="polite">
            {banner}
          </Text>
          <PauseButton onPress={onPause} />
        </View>
      </View>

      <View style={styles.fill}>{board}</View>

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {summary && engine.phase === 'round_break' && (
        <View style={styles.summary} pointerEvents="box-none">
          <RoundSummary summary={summary} onNext={() => engine.nextRound()} />
        </View>
      )}

      {engine.phase === 'game_over' && (
        <View style={styles.overlay}>
          {summary && !resetScores && <RoundSummary summary={summary} />}
          <Text style={[styles.win, teamTextStyles[engine.winner]]}>
            {config.teamNames[engine.winner]} wins!
          </Text>
          <Text style={styles.sub}>
            {engine.scores[0]} – {engine.scores[1]}
          </Text>
          {resetScores ? (
            <Text
              style={[styles.resetting, teamTextStyles[1 - engine.winner]]}
              accessibilityLiveRegion="polite">
              {config.teamNames[1 - engine.winner]} resets the board…
            </Text>
          ) : (
            <View style={styles.gameOverButtons}>
              <Pressable
                style={styles.button}
                onPress={startRematch}
                accessibilityRole="button"
                accessibilityHint="Starts a new match with the same rules">
                <Text style={styles.buttonText}>Rematch</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={onQuitToHome}
                accessibilityRole="button">
                <Text style={styles.secondaryButtonText}>Home</Text>
              </Pressable>
            </View>
          )}
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
  fill: { flex: 1 },
  band: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing['2xs'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  teamName: {
    ...textVariants.label,
    width: TEAM_NAME_WIDTH,
  },
  lights: { flexDirection: 'row', gap: spacing['2xs'] },
  light: { width: LIGHT_SIZE, height: LIGHT_SIZE, borderRadius: radii.sm },
  lightOff: { backgroundColor: colors.indicatorOff },
  rack: { flexDirection: 'row', gap: spacing['3xs'], marginLeft: 'auto' },
  rackKilled: { opacity: opacity.disabled },
  rackCube: {
    width: RACK_CUBE_SIZE,
    height: RACK_CUBE_SIZE,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  banner: {
    color: colors.text.primary,
    ...textVariants.label,
    flexShrink: 1,
  },
  toast: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: colors.scrimStrong,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  toastText: {
    color: colors.text.primary,
    ...textVariants.heading,
    textAlign: 'center',
  },
  summary: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.xl,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  win: textVariants.display,
  sub: { ...textVariants.score, color: colors.text.primary },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  buttonText: {
    color: colors.text.onAccent,
    ...textVariants.button,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  secondaryButtonText: { color: colors.text.primary, ...textVariants.button },
  gameOverButtons: { flexDirection: 'row', gap: spacing.sm },
  resetting: textVariants.heading,
});

/** Background fill in each team's colour, indexed by team. */
const teamFillStyles = colors.team.map((teamColor) => ({
  backgroundColor: teamColor,
}));

/** Text in each team's colour, indexed by team. */
const teamTextStyles = colors.team.map((teamColor) => ({ color: teamColor }));
