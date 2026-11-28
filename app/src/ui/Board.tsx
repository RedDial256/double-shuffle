import { useEffect, useMemo, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';

import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import {
  config,
  dispensers,
  farBandBoundaries,
  halfWidth,
  nearBandBoundaries,
  yBoardEnd,
  yIceFar,
  yIceNear,
  yViewBottom,
  yViewTop,
} from '../game/config';
import type { GameEngine } from '../game/engine';
import { defaultMode } from '../game/mode';
import { colors, opacity as opacityLevels } from '../theme';

import { useAim } from './useAim';
import { useEngineState } from './useEngineState';

// Fixed to the default mode until the slots are sized from the match (#14).
const CUBE_SLOTS = defaultMode.cubesPerRound * 2;
const CHARGE_SLOTS = 4;
/**
 * Per cube: x, y, angle, visible, blast flash (1 just hit, fading to 0).
 * Per charge: x, y, radius, alpha, and whether it has exploded (1) or is
 * still flying (0).
 */
const CUBE_STRIDE = 5;
const CHARGE_STRIDE = 5;
/** Radius of a wind charge in flight, in blocks. */
const BOLT_RADIUS = 0.5;

function shade(hex: string, amount: number): string {
  const packedColor = parseInt(hex.slice(1), 16);
  const ch = (channel: number) =>
    Math.max(
      0,
      Math.min(
        255,
        Math.round(
          channel + (amount >= 0 ? (255 - channel) * amount : channel * amount)
        )
      )
    );
  const red = ch((packedColor >> 16) & 255);
  const green = ch((packedColor >> 8) & 255);
  const blue = ch(packedColor & 255);
  return `#${((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1)}`;
}

interface Props {
  engine: GameEngine;
}

export function Board({ engine }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEngineState(engine);
  const frame = useSharedValue<number[]>([]);
  const aim = useSharedValue<number[]>([0, 0, 0, 0, 0, 0]);

  // Fit the ice, the walls and a slice of each platform on screen (D-11,
  // D-27). The rest of the platforms falls outside the canvas.
  const worldW = config.rinkWidth + 2;
  const viewTop = yViewTop();
  const worldH = yViewBottom() - viewTop;
  const scale = size.w ? Math.min(size.w / worldW, size.h / worldH) : 1;
  // World x = 0 is the centre line of the rink, so it maps to mid-screen.
  const ox = size.w / 2;
  const oy = (size.h - worldH * scale) / 2 - viewTop * scale;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      engine.update((now - last) / 1000);
      last = now;
      const out: number[] = [];
      for (let slotIndex = 0; slotIndex < CUBE_SLOTS; slotIndex++) {
        const cube = engine.cubes[slotIndex];
        if (cube && engine.isOnBoard(cube)) {
          out.push(
            cube.x,
            cube.y,
            cube.angle,
            1,
            cube.blastedFor / config.windBlastFlashSeconds
          );
        } else out.push(0, 0, 0, 0, 0);
      }
      for (let slotIndex = 0; slotIndex < CHARGE_SLOTS; slotIndex++) {
        const charge = engine.charges[slotIndex];
        if (!charge) out.push(0, 0, 0, 0, 0);
        else if (charge.exploded) {
          // The ring grows out to the blast radius as the flash fades.
          const flashLeft = Math.max(
            0,
            charge.flash / config.windBlastFlashSeconds
          );
          out.push(
            charge.blastX,
            charge.blastY,
            engine.mode.windBlastRadius * (1 - flashLeft * flashLeft * 0.7),
            flashLeft,
            1
          );
        } else out.push(charge.x, charge.y, BOLT_RADIUS, 1, 0);
      }
      frame.value = out;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, frame]);

  const handlers = useAim(engine, aim, { scale, ox, oy });

  const onLayout = (event: LayoutChangeEvent) =>
    setSize({
      w: event.nativeEvent.layout.width,
      h: event.nativeEvent.layout.height,
    });

  const dispenserList = useMemo(() => dispensers(), []);
  // During the round summary, ring the cubes that scored and dim the rest.
  const showResult =
    (engine.phase === 'round_break' || engine.phase === 'game_over') &&
    engine.lastResult;
  const scoring = new Set(showResult ? engine.lastResult?.scoring : []);
  const hw = halfWidth();
  const yFar = yIceFar();
  const yNear = yIceNear();

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={[{ translateX: ox }, { translateY: oy }, { scale }]}>
          {/* Platforms */}
          <Rect
            x={-hw}
            y={0}
            width={hw * 2}
            height={yFar}
            color={colors.board.platform}
          />
          <Rect
            x={-hw}
            y={yNear}
            width={hw * 2}
            height={yBoardEnd() - yNear}
            color={colors.board.platform}
          />
          {/* Ice */}
          <Rect
            x={-hw}
            y={yFar}
            width={hw * 2}
            height={yNear - yFar}
            color={colors.board.ice}
          />
          {/* Far (live) bands, deepest first, then the decorative near bands */}
          {[0, 1, 2].map((bandIndex) => (
            <Rect
              key={`fb${bandIndex}`}
              x={-hw}
              y={yFar + config.band * bandIndex}
              width={hw * 2}
              height={config.band}
              color={colors.board.iceBands[bandIndex]}
            />
          ))}
          {[0, 1, 2].map((bandIndex) => (
            <Rect
              key={`nb${bandIndex}`}
              x={-hw}
              y={yNear - config.band * (bandIndex + 1)}
              width={hw * 2}
              height={config.band}
              color={colors.board.iceBands[bandIndex]}
            />
          ))}
          {[...farBandBoundaries(), ...nearBandBoundaries()].map(
            (boundaryY, boundaryIndex) => (
              <Rect
                key={`d${boundaryIndex}`}
                x={-hw}
                y={boundaryY - config.divider / 2}
                width={hw * 2}
                height={config.divider}
                color={colors.board.divider}
              />
            )
          )}
          {/* Starting line */}
          <Rect
            x={-hw}
            y={yNear - 0.1}
            width={hw * 2}
            height={0.2}
            color={colors.board.startLine}
          />
          {/* Walls + dispensers */}
          <Rect
            x={-hw - 1}
            y={0}
            width={1}
            height={yBoardEnd()}
            color={colors.board.wall}
          />
          <Rect
            x={hw}
            y={0}
            width={1}
            height={yBoardEnd()}
            color={colors.board.wall}
          />
          {dispenserList.map((dispenser, dispenserIndex) => (
            <Rect
              key={`disp${dispenserIndex}`}
              x={dispenser.x < 0 ? dispenser.x - 0.9 : dispenser.x}
              y={dispenser.y - 0.4}
              width={0.9}
              height={0.8}
              color={colors.board.dispenser}
            />
          ))}

          {/* Cubes */}
          {Array.from({ length: CUBE_SLOTS }, (_, slotIndex) => (
            <CubeSprite
              key={`c${slotIndex}`}
              frame={frame}
              index={slotIndex}
              team={engine.cubes[slotIndex]?.team ?? 0}
              knocked={engine.cubes[slotIndex]?.knockedBack ?? false}
              highlight={
                !showResult
                  ? 'none'
                  : scoring.has(engine.cubes[slotIndex]!)
                    ? 'scored'
                    : 'dimmed'
              }
            />
          ))}

          {/* Wind charges / blasts */}
          {Array.from({ length: CHARGE_SLOTS }, (_, slotIndex) => (
            <ChargeSprite
              key={`w${slotIndex}`}
              frame={frame}
              offset={CUBE_SLOTS * CUBE_STRIDE + slotIndex * CHARGE_STRIDE}
            />
          ))}

          <AimOverlay aim={aim} team={engine.currentTeam} />
        </Group>
      </Canvas>
      <View style={StyleSheet.absoluteFill} {...handlers} />
    </View>
  );
}

function CubeSprite({
  frame,
  index,
  team,
  knocked,
  highlight,
}: {
  frame: SharedValue<number[]>;
  index: number;
  team: number;
  knocked: boolean;
  highlight: 'none' | 'scored' | 'dimmed';
}) {
  const base = colors.team[team];
  const transform = useDerivedValue(() => {
    const frameValues = frame.value;
    const offset = index * CUBE_STRIDE;
    return [
      { translateX: frameValues[offset] ?? 0 },
      { translateY: frameValues[offset + 1] ?? 0 },
      { rotate: frameValues[offset + 2] ?? 0 },
    ];
  });
  const opacity = useDerivedValue(
    () => frame.value[index * CUBE_STRIDE + 3] ?? 0
  );
  const blastOpacity = useDerivedValue(
    () => (frame.value[index * CUBE_STRIDE + 4] ?? 0) * 0.85
  );
  return (
    <Group transform={transform} opacity={opacity}>
      {highlight === 'scored' && (
        <Rect
          x={-0.72}
          y={-0.72}
          width={1.44}
          height={1.44}
          color={colors.board.scoredRing}
          style="stroke"
          strokeWidth={0.14}
        />
      )}
      <Group
        opacity={
          highlight === 'dimmed' ? opacityLevels.dimmed : opacityLevels.full
        }>
        <Rect
          x={-0.5}
          y={-0.5}
          width={1}
          height={1}
          color={shade(base, -0.25)}
        />
        <Rect x={-0.38} y={-0.38} width={0.76} height={0.76} color={base} />
        <Rect
          x={-0.18}
          y={-0.18}
          width={0.36}
          height={0.36}
          color={shade(base, 0.35)}
        />
        {knocked && (
          <Rect
            x={-0.1}
            y={-0.1}
            width={0.2}
            height={0.2}
            color={colors.board.knockedMarker}
          />
        )}
      </Group>
      {/* A wind blast just hit this cube. */}
      <Rect
        x={-0.5}
        y={-0.5}
        width={1}
        height={1}
        color={colors.board.blastFlash}
        opacity={blastOpacity}
      />
    </Group>
  );
}

function ChargeSprite({
  frame,
  offset,
}: {
  frame: SharedValue<number[]>;
  /** Where this charge's values start in `frame`, after all the cubes. */
  offset: number;
}) {
  const cx = useDerivedValue(() => frame.value[offset] ?? 0);
  const cy = useDerivedValue(() => frame.value[offset + 1] ?? 0);
  const center = useDerivedValue(() => vec(cx.value, cy.value));
  const radius = useDerivedValue(() => frame.value[offset + 2] ?? 0);
  const alpha = useDerivedValue(() => frame.value[offset + 3] ?? 0);
  const exploded = useDerivedValue(() => frame.value[offset + 4] ?? 0);

  // In flight: a dark bolt with a bright core.
  const boltOpacity = useDerivedValue(() => (exploded.value ? 0 : alpha.value));
  const coreRadius = useDerivedValue(() => radius.value * 0.45);
  // Exploded: a filled burst and a thick ring that grows and fades.
  const burstOpacity = useDerivedValue(() =>
    exploded.value ? alpha.value * 0.35 : 0
  );
  const ringOpacity = useDerivedValue(() => (exploded.value ? alpha.value : 0));
  return (
    <Group>
      <Circle
        c={center}
        r={radius}
        color={colors.board.windCharge}
        opacity={burstOpacity}
      />
      <Circle
        c={center}
        r={radius}
        color={colors.board.windCharge}
        opacity={ringOpacity}
        style="stroke"
        strokeWidth={0.35}
      />
      <Group opacity={boltOpacity}>
        <Circle c={center} r={radius} color={colors.board.windCharge} />
        <Circle c={center} r={coreRadius} color={colors.board.blastFlash} />
      </Group>
    </Group>
  );
}

function AimOverlay({
  aim,
  team,
}: {
  aim: SharedValue<number[]>;
  team: number;
}) {
  const color = shade(colors.team[team], 0.2);
  const p1 = useDerivedValue(() => vec(aim.value[1], aim.value[2]));
  const p2 = useDerivedValue(() => vec(aim.value[3], aim.value[4]));
  const opacity = useDerivedValue(() => aim.value[0]);
  return (
    <Group opacity={opacity}>
      <Line p1={p1} p2={p2} color={color} style="stroke" strokeWidth={0.12}>
        <DashPathEffect intervals={[0.4, 0.3]} />
      </Line>
    </Group>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
