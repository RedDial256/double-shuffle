import { useLayoutEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';

import { config } from '../game/config';
import type { GameEngine } from '../game/engine';
import { type HitZone, hitZones } from '../game/hitZone';
import { colors, opacity, radii, spacing, textVariants } from '../theme';

import { useThrowStore } from './throwStore';
import { hitZoneAt, swipePower } from './throwSwipe';
import { useEngineState } from './useEngineState';

/** Share of the panel's height the cube's face takes. */
const FACE_HEIGHT_SHARE = 0.46;
/** Share of the panel's width the cube's face may take. */
const FACE_WIDTH_SHARE = 0.4;
/** Stick sizes as shares of the face. */
const STICK_HEAD_WIDTH = 0.62;
const STICK_HEAD_HEIGHT = 0.16;
const STICK_SHAFT_WIDTH = 0.14;
/** Gap between the face and the stick at rest, as a share of the face. */
const STICK_REST_GAP = 0.45;
/** A touch that moves less than this is a tap on the face, in pixels. */
const TAP_SLOP_PX = 10;
/** Width of the power meter in pixels. */
const POWER_METER_WIDTH = 10;

/** Words for what a hit does, for the label under the cube. */
export function describeHit(zone: HitZone): string {
  const turn =
    zone.column < 0 ? 'curves right' : zone.column > 0 ? 'curves left' : '';
  const grip = zone.row < 0 ? 'grips' : zone.row > 0 ? 'skims' : '';
  const parts = [turn, grip].filter(Boolean);
  return parts.length ? parts.join(', ') : 'straight';
}

/**
 * The bottom of the game screen: the cube up close from the shooter's side,
 * with an original shuffle stick (docs/decisions.md D-30). Tap the face to
 * pick where the stick hits, then swipe up to throw; the swipe's length sets
 * the power.
 */
export function ThrowPanel({ engine }: { engine: GameEngine }) {
  useEngineState(engine);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const hitZone = useThrowStore((state) => state.hitZone);
  const power = useThrowStore((state) => state.swipePower);
  const chooseHitZone = useThrowStore((state) => state.chooseHitZone);
  const setSwipePower = useThrowStore((state) => state.setSwipePower);
  const resetThrow = useThrowStore((state) => state.reset);

  const faceSize = Math.max(
    0,
    Math.min(size.height * FACE_HEIGHT_SHARE, size.width * FACE_WIDTH_SHARE)
  );
  const faceLeft = (size.width - faceSize) / 2;
  const faceTop = spacing.sm;

  const touch = useRef({ startX: 0, startY: 0, moved: false, power: 0 });
  const layout = useRef({ faceLeft, faceTop, faceSize, height: size.height });
  // Keep the latest layout for the handlers without rebuilding the gesture.
  useLayoutEffect(() => {
    layout.current = { faceLeft, faceTop, faceSize, height: size.height };
  });

  const gesture = usePanGesture({
    // Run on the JS thread: the handlers call into the engine and the store.
    runOnJS: true,
    minDistance: 0,
    onBegin: (event) => {
      touch.current = {
        startX: event.x,
        startY: event.y,
        moved: false,
        power: 0,
      };
    },
    onUpdate: (event) => {
      if (!engine.canAim()) return;
      const current = touch.current;
      if (Math.hypot(event.translationX, event.translationY) > TAP_SLOP_PX) {
        current.moved = true;
      }
      current.power = swipePower(-event.translationY, layout.current.height);
      setSwipePower(current.power);
    },
    onFinalize: (event) => {
      const current = touch.current;
      setSwipePower(0);
      if (event.canceled || !engine.canAim()) return;
      if (!current.moved) {
        // A tap on the face picks the hit zone.
        const { faceLeft: left, faceTop: top, faceSize: side } = layout.current;
        const zone = hitZoneAt(
          current.startX - left,
          current.startY - top,
          side
        );
        if (zone) chooseHitZone(zone);
        return;
      }
      if (current.power > 0) {
        engine.launch(0, -1, current.power, useThrowStore.getState().hitZone);
        resetThrow();
      }
    },
  });

  const onLayout = (event: LayoutChangeEvent) =>
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });

  const team = engine.currentTeam;
  const ready = engine.canAim();
  const cellSize = faceSize / 3;
  const restTop = faceTop + faceSize * (1 + STICK_REST_GAP);
  // The stick moves up into the face as the swipe builds power.
  const stickTop = restTop - power * faceSize * STICK_REST_GAP;
  const headWidth = faceSize * STICK_HEAD_WIDTH;
  const shaftWidth = faceSize * STICK_SHAFT_WIDTH;

  let prompt = '';
  if (ready) {
    prompt = `${config.teamNames[team]}: tap the cube to aim your hit, then swipe up`;
  } else if (engine.phase === 'sliding') {
    prompt = `${config.teamNames[engine.defendingTeam]}: tap the ice to fire (${engine.windChargesLeft} left)`;
  }

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.panel, !ready && styles.waiting]}
        onLayout={onLayout}
        accessibilityLabel="Throw panel"
        accessibilityHint="Tap the cube to choose where to hit it, then swipe up to throw">
        {faceSize > 0 && (
          <>
            <View
              style={[
                styles.face,
                teamFaceStyles[team],
                {
                  left: faceLeft,
                  top: faceTop,
                  width: faceSize,
                  height: faceSize,
                },
              ]}>
              {hitZones.map((zone) => {
                const selected =
                  zone.column === hitZone.column && zone.row === hitZone.row;
                return (
                  <View
                    key={`${zone.column},${zone.row}`}
                    style={[
                      styles.cell,
                      {
                        left: (zone.column + 1) * cellSize,
                        top: (zone.row + 1) * cellSize,
                        width: cellSize,
                        height: cellSize,
                      },
                    ]}>
                    {selected && (
                      <View
                        style={[
                          styles.target,
                          {
                            width: cellSize * 0.5,
                            height: cellSize * 0.5,
                            borderRadius: cellSize * 0.25,
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            <View
              style={[
                styles.stickShaft,
                {
                  left: (size.width - shaftWidth) / 2,
                  top: stickTop,
                  width: shaftWidth,
                },
              ]}
            />
            <View
              style={[
                styles.stickHead,
                {
                  left: (size.width - headWidth) / 2,
                  top: stickTop,
                  width: headWidth,
                  height: faceSize * STICK_HEAD_HEIGHT,
                },
              ]}
            />
            <View
              style={[
                styles.powerTrack,
                {
                  top: faceTop,
                  height: faceSize,
                  left: faceLeft + faceSize + spacing.md,
                },
              ]}>
              <View
                style={[
                  styles.powerFill,
                  { height: `${Math.round(power * 100)}%` },
                ]}
              />
            </View>
            <Text
              style={[
                styles.hitLabel,
                {
                  top: faceTop,
                  right: faceLeft + faceSize + spacing.md,
                  maxWidth: faceLeft - spacing.lg,
                },
              ]}>
              {describeHit(hitZone)}
            </Text>
          </>
        )}
        <Text style={styles.prompt} accessibilityLiveRegion="polite">
          {prompt}
        </Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  waiting: { opacity: opacity.disabled },
  face: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.stick.head,
  },
  cell: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.stick.grid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  target: {
    backgroundColor: colors.text.primary,
    borderWidth: 2,
    borderColor: colors.stick.head,
  },
  stickShaft: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.stick.shaft,
  },
  stickHead: {
    position: 'absolute',
    backgroundColor: colors.stick.head,
    borderRadius: radii.sm,
  },
  powerTrack: {
    position: 'absolute',
    width: POWER_METER_WIDTH,
    backgroundColor: colors.indicatorOff,
    borderRadius: radii.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  powerFill: { backgroundColor: colors.accent },
  hitLabel: {
    position: 'absolute',
    ...textVariants.label,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  prompt: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.xs,
    ...textVariants.label,
    color: colors.text.primary,
    textAlign: 'center',
  },
});

/** The cube's face in each team's colour, indexed by team. */
const teamFaceStyles = colors.team.map((teamColor) => ({
  backgroundColor: teamColor,
}));
