import { useLayoutEffect, useMemo, useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';

import type { SharedValue } from 'react-native-reanimated';

import { config, iceLength, yIceNear } from '../game/config';
import type { GameEngine } from '../game/engine';

interface View {
  scale: number;
  ox: number;
  oy: number;
}

type Mode = 'none' | 'placing' | 'aiming';

/**
 * Touch input for the rink:
 *  - drag on the shooter's platform  -> slide the racked cube along the line
 *  - drag elsewhere while aiming     -> pull back and release to throw
 *  - tap while a cube is sliding     -> defender fires the nearest dispenser
 *
 * `aim` is [active, originX, originY, tipX, tipY, power], read by the Skia
 * overlay.
 */
export function useAim(
  engine: GameEngine,
  aim: SharedValue<number[]>,
  view: View
) {
  const viewRef = useRef(view);
  // Keep the latest layout for the touch handlers without rebuilding them.
  useLayoutEffect(() => {
    viewRef.current = view;
  });
  const state = useRef({ mode: 'none' as Mode, sx: 0, sy: 0, nx: 0, ny: 0 });

  return useMemo(() => {
    const toWorld = (e: GestureResponderEvent) => {
      const v = viewRef.current;
      const { locationX, locationY } = e.nativeEvent;
      return {
        x: (locationX - v.ox) / v.scale,
        y: (locationY - v.oy) / v.scale,
      };
    };

    /** Direction and power implied by the current drag (world units). */
    const currentShot = () => {
      const s = state.current;
      const px = s.sx - s.nx;
      const py = s.sy - s.ny;
      const length = Math.hypot(px, py);
      const screenLength = length * viewRef.current.scale;
      const power = Math.max(
        0,
        Math.min(1, screenLength / config.aimDragFullPowerPx)
      );

      let dx = 0;
      let dy = -1;
      if (length > 0.02) {
        // Forward is -Y. Fold a backwards pull onto straight ahead and clamp
        // the angle so a throw always ends up somewhere on the rink.
        const limit = (config.aimMaxAngleDeg * Math.PI) / 180;
        const angle = Math.max(-limit, Math.min(limit, Math.atan2(px, -py)));
        dx = Math.sin(angle);
        dy = -Math.cos(angle);
      }
      return { dx, dy, power };
    };

    const drawAim = () => {
      const cube = engine.liveCube;
      if (!cube) return;
      const { dx, dy, power } = currentShot();
      const reach = 3 + power * iceLength() * 0.9;
      aim.set([
        1,
        cube.x,
        cube.y,
        cube.x + dx * reach,
        cube.y + dy * reach,
        power,
      ]);
    };

    const hide = () => {
      aim.set([0, 0, 0, 0, 0, 0]);
    };

    return {
      onStartShouldSetResponder: () => true,
      onResponderGrant: (e: GestureResponderEvent) => {
        const w = toWorld(e);
        // Defending: any tap while the ice is live spends a wind charge.
        if (engine.phase === 'sliding') {
          engine.fireWindChargeNear(w.x, w.y);
          return;
        }
        if (!engine.canAim()) return;
        const s = state.current;
        s.sx = s.nx = w.x;
        s.sy = s.ny = w.y;
        // Below the starting line is the shooter's own platform: that is for
        // lining the cube up, not for aiming.
        s.mode = w.y > yIceNear() ? 'placing' : 'aiming';
        if (s.mode === 'placing') engine.placeCubeAtX(w.x);
      },
      onResponderMove: (e: GestureResponderEvent) => {
        const s = state.current;
        if (s.mode === 'none') return;
        const w = toWorld(e);
        s.nx = w.x;
        s.ny = w.y;
        if (s.mode === 'placing') engine.placeCubeAtX(w.x);
        else drawAim();
      },
      onResponderRelease: (e: GestureResponderEvent) => {
        const s = state.current;
        if (s.mode === 'aiming') {
          const w = toWorld(e);
          s.nx = w.x;
          s.ny = w.y;
          const shot = currentShot();
          if (shot.power > 0.02) engine.launch(shot.dx, shot.dy, shot.power);
        }
        s.mode = 'none';
        hide();
      },
      onResponderTerminate: () => {
        state.current.mode = 'none';
        hide();
      },
    };
  }, [engine, aim]);
}
