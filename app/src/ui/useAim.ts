import { useLayoutEffect, useMemo, useRef } from 'react';
import type { GestureResponderEvent } from 'react-native';

import type { SharedValue } from 'react-native-reanimated';

import { iceLength, yIceNear } from '../game/config';
import type { GameEngine } from '../game/engine';

import { type AimDrag, shotFromDrag } from './aimShot';

interface View {
  scale: number;
  ox: number;
  oy: number;
  /** Height of the touch area in screen pixels. */
  height: number;
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
  const state = useRef({
    mode: 'none' as Mode,
    drag: { startX: 0, startY: 0, currentX: 0, currentY: 0 } as AimDrag,
    roomBelowStartPx: 0,
  });

  return useMemo(() => {
    const toWorld = (event: GestureResponderEvent) => {
      const viewTransform = viewRef.current;
      const { locationX, locationY } = event.nativeEvent;
      return {
        x: (locationX - viewTransform.ox) / viewTransform.scale,
        y: (locationY - viewTransform.oy) / viewTransform.scale,
      };
    };

    const currentShot = () =>
      shotFromDrag(
        state.current.drag,
        viewRef.current.scale,
        state.current.roomBelowStartPx
      );

    const hide = () => {
      aim.set([0, 0, 0, 0, 0, 0]);
    };

    const drawAim = () => {
      const cube = engine.liveCube;
      if (!cube) return;
      const { directionX, directionY, power } = currentShot();
      // A forward drag cancels the throw, so it shows no aim line.
      if (power === 0) {
        hide();
        return;
      }
      const reach = 3 + power * iceLength() * 0.9;
      aim.set([
        1,
        cube.x,
        cube.y,
        cube.x + directionX * reach,
        cube.y + directionY * reach,
        power,
      ]);
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
        const input = state.current;
        input.drag = {
          startX: worldPoint.x,
          startY: worldPoint.y,
          currentX: worldPoint.x,
          currentY: worldPoint.y,
        };
        input.roomBelowStartPx =
          viewRef.current.height - event.nativeEvent.locationY;
        // Below the starting line is the shooter's own platform: that is for
        // lining the cube up, not for aiming.
        input.mode = worldPoint.y > yIceNear() ? 'placing' : 'aiming';
        if (input.mode === 'placing') engine.placeCubeAtX(worldPoint.x);
      },
      onResponderMove: (event: GestureResponderEvent) => {
        const input = state.current;
        if (input.mode === 'none') return;
        const worldPoint = toWorld(event);
        input.drag.currentX = worldPoint.x;
        input.drag.currentY = worldPoint.y;
        if (input.mode === 'placing') engine.placeCubeAtX(worldPoint.x);
        else drawAim();
      },
      onResponderRelease: (event: GestureResponderEvent) => {
        const input = state.current;
        if (input.mode === 'aiming') {
          const worldPoint = toWorld(event);
          input.drag.currentX = worldPoint.x;
          input.drag.currentY = worldPoint.y;
          const shot = currentShot();
          if (shot.power > 0.02) {
            engine.launch(shot.directionX, shot.directionY, shot.power);
          }
        }
        input.mode = 'none';
        hide();
      },
      onResponderTerminate: () => {
        state.current.mode = 'none';
        hide();
      },
    };
  }, [engine, aim]);
}
