import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {
  config,
  dispensers,
  farBandBoundaries,
  halfWidth,
  nearBandBoundaries,
  yBoardEnd,
  yIceFar,
  yIceNear,
} from '../game/config';
import { GameEngine } from '../game/engine';
import { useAim } from './useAim';

const CUBE_SLOTS = config.cubesPerRound * 2;
const CHARGE_SLOTS = 4;
/** Per cube: x, y, angle, visible. Per charge: x, y, radius, alpha. */
const CUBE_STRIDE = 4;
const CHARGE_STRIDE = 4;

const BLAST_RADIUS = config.windBlastRadius;
const SCORED_RING = '#f5d76e';

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (amount >= 0 ? (255 - v) * amount : v * amount))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

interface Props {
  engine: GameEngine;
}

export function Board({ engine }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const frame = useSharedValue<number[]>([]);
  const aim = useSharedValue<number[]>([0, 0, 0, 0, 0, 0]);

  // Fit the whole board on screen (docs/decisions.md D-11).
  const worldW = config.rinkWidth + 2;
  const worldH = yBoardEnd();
  const scale = size.w ? Math.min(size.w / worldW, size.h / worldH) : 1;
  // World x = 0 is the centre line of the rink, so it maps to mid-screen.
  const ox = size.w / 2;
  const oy = (size.h - worldH * scale) / 2;

  useEffect(() => engine.subscribe((e) => e.type === 'state' && bump()), [engine]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      engine.update((now - last) / 1000);
      last = now;
      const out: number[] = [];
      for (let i = 0; i < CUBE_SLOTS; i++) {
        const c = engine.cubes[i];
        if (c && engine.isOnBoard(c)) out.push(c.x, c.y, c.angle, 1);
        else out.push(0, 0, 0, 0);
      }
      for (let i = 0; i < CHARGE_SLOTS; i++) {
        const w = engine.charges[i];
        if (!w) out.push(0, 0, 0, 0);
        else if (w.exploded) {
          const t = Math.max(0, w.flash / 0.22);
          out.push(w.blastX, w.blastY, BLAST_RADIUS * (1 - t * 0.55), t);
        } else out.push(w.x, w.y, 0.3, 1);
      }
      frame.value = out;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [engine, frame]);

  const handlers = useAim(engine, aim, { scale, ox, oy });

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const dispenserList = useMemo(() => dispensers(), []);
  // During the round summary, ring the cubes that scored and dim the rest.
  const showResult =
    (engine.phase === 'round_break' || engine.phase === 'game_over') && engine.lastResult;
  const scoring = new Set(showResult ? engine.lastResult?.scoring : []);
  const hw = halfWidth();
  const yFar = yIceFar();
  const yNear = yIceNear();

  return (
    <View style={styles.fill} onLayout={onLayout}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Group transform={[{ translateX: ox }, { translateY: oy }, { scale }]}>
          {/* Platforms */}
          <Rect x={-hw} y={0} width={hw * 2} height={yFar} color={config.colors.platform} />
          <Rect x={-hw} y={yNear} width={hw * 2} height={yBoardEnd() - yNear} color={config.colors.platform} />
          {/* Ice */}
          <Rect x={-hw} y={yFar} width={hw * 2} height={yNear - yFar} color={config.colors.ice} />
          {/* Far (live) bands, deepest first, then the decorative near bands */}
          {[0, 1, 2].map((i) => (
            <Rect
              key={`fb${i}`}
              x={-hw}
              y={yFar + config.band * i}
              width={hw * 2}
              height={config.band}
              color={config.colors.iceBand[i]}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <Rect
              key={`nb${i}`}
              x={-hw}
              y={yNear - config.band * (i + 1)}
              width={hw * 2}
              height={config.band}
              color={config.colors.iceBand[i]}
            />
          ))}
          {[...farBandBoundaries(), ...nearBandBoundaries()].map((y, i) => (
            <Rect
              key={`d${i}`}
              x={-hw}
              y={y - config.divider / 2}
              width={hw * 2}
              height={config.divider}
              color={config.colors.divider}
            />
          ))}
          {/* Starting line */}
          <Rect x={-hw} y={yNear - 0.1} width={hw * 2} height={0.2} color={config.colors.startLine} />
          {/* Walls + dispensers */}
          <Rect x={-hw - 1} y={0} width={1} height={yBoardEnd()} color={config.colors.wall} />
          <Rect x={hw} y={0} width={1} height={yBoardEnd()} color={config.colors.wall} />
          {dispenserList.map((d, i) => (
            <Rect
              key={`disp${i}`}
              x={d.x < 0 ? d.x - 0.9 : d.x}
              y={d.y - 0.4}
              width={0.9}
              height={0.8}
              color={config.colors.dispenser}
            />
          ))}

          {/* Cubes */}
          {Array.from({ length: CUBE_SLOTS }, (_, i) => (
            <CubeSprite
              key={`c${i}`}
              frame={frame}
              index={i}
              team={engine.cubes[i]?.team ?? 0}
              knocked={engine.cubes[i]?.knockedBack ?? false}
              highlight={
                !showResult ? 'none' : scoring.has(engine.cubes[i]!) ? 'scored' : 'dimmed'
              }
            />
          ))}

          {/* Wind charges / blasts */}
          {Array.from({ length: CHARGE_SLOTS }, (_, i) => (
            <ChargeSprite key={`w${i}`} frame={frame} index={i} />
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
  const base = config.teamColors[team];
  const transform = useDerivedValue(() => {
    const f = frame.value;
    const o = index * CUBE_STRIDE;
    return [
      { translateX: f[o] ?? 0 },
      { translateY: f[o + 1] ?? 0 },
      { rotate: f[o + 2] ?? 0 },
    ];
  });
  const opacity = useDerivedValue(() => frame.value[index * CUBE_STRIDE + 3] ?? 0);
  return (
    <Group transform={transform} opacity={opacity}>
      {highlight === 'scored' && (
        <Rect
          x={-0.72}
          y={-0.72}
          width={1.44}
          height={1.44}
          color={SCORED_RING}
          style="stroke"
          strokeWidth={0.14}
        />
      )}
      <Group opacity={highlight === 'dimmed' ? 0.4 : 1}>
        <Rect x={-0.5} y={-0.5} width={1} height={1} color={shade(base, -0.25)} />
        <Rect x={-0.38} y={-0.38} width={0.76} height={0.76} color={base} />
        <Rect x={-0.18} y={-0.18} width={0.36} height={0.36} color={shade(base, 0.35)} />
        {knocked && <Rect x={-0.1} y={-0.1} width={0.2} height={0.2} color="#2b2b2b" />}
      </Group>
    </Group>
  );
}

function ChargeSprite({ frame, index }: { frame: SharedValue<number[]>; index: number }) {
  const o = index * CHARGE_STRIDE;
  const cx = useDerivedValue(() => frame.value[o] ?? 0);
  const cy = useDerivedValue(() => frame.value[o + 1] ?? 0);
  const r = useDerivedValue(() => frame.value[o + 2] ?? 0);
  const opacity = useDerivedValue(() => {
    const a = frame.value[o + 3] ?? 0;
    return (frame.value[o + 2] ?? 0) > 0.5 ? a * 0.35 : a * 0.85; // blast vs bolt
  });
  return <Circle cx={cx} cy={cy} r={r} color={config.colors.windCharge} opacity={opacity} />;
}

function AimOverlay({ aim, team }: { aim: SharedValue<number[]>; team: number }) {
  const color = shade(config.teamColors[team], 0.2);
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
