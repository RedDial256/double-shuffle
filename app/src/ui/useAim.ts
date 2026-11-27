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
    const toWorld = (event: GestureResponderEvent) => {
      const viewTransform = viewRef.current;
      const { locationX, locationY } = event.nativeEvent;
      return {
        x: (locationX - viewTransform.ox) / viewTransform.scale,
        y: (locationY - viewTransform.oy) / viewTransform.scale,
      };
    };

    /** Direction and power implied by the current drag (world units). */
    const currentShot = () => {
      const drag = state.current;
      const px = drag.sx - drag.nx;
      const py = drag.sy - drag.ny;
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
      onResponderGrant: (event: GestureResponderEvent) => {
        const worldPoint = toWorld(event);
        // Defending: any tap while the ice is live spends a wind charge.
        if (engine.phase === 'sliding') {
          engine.fireWindChargeNear(worldPoint.x, worldPoint.y);
          return;
        }
        if (!engine.canAim()) return;
        const drag = state.current;
        drag.sx = drag.nx = worldPoint.x;
        drag.sy = drag.ny = worldPoint.y;
        // Below the starting line is the shooter's own platform: that is for
        // lining the cube up, not for aiming.
        drag.mode = worldPoint.y > yIceNear() ? 'placing' : 'aiming';
        if (drag.mode === 'placing') engine.placeCubeAtX(worldPoint.x);
      },
      onResponderMove: (event: GestureResponderEvent) => {
        const drag = state.current;
        if (drag.mode === 'none') return;
        const worldPoint = toWorld(event);
        drag.nx = worldPoint.x;
        drag.ny = worldPoint.y;
        if (drag.mode === 'placing') engine.placeCubeAtX(worldPoint.x);
        else drawAim();
      },
      onResponderRelease: (event: GestureResponderEvent) => {
        const drag = state.current;
        if (drag.mode === 'aiming') {
          const worldPoint = toWorld(event);
          drag.nx = worldPoint.x;
          drag.ny = worldPoint.y;
          const shot = currentShot();
          if (shot.power > 0.02) engine.launch(shot.dx, shot.dy, shot.power);
        }
        drag.mode = 'none';
        hide();
      },
      onResponderTerminate: () => {
        state.current.mode = 'none';
        hide();
      },
    };
  }, [engine, aim]);
}
