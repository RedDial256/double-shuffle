import { useLayoutEffect, useRef } from 'react';

import { usePanGesture } from 'react-native-gesture-handler';

import type { GameEngine } from '../game/engine';

/** How screen pixels map onto the board's world coordinates. */
export interface BoardTransform {
  scale: number;
  ox: number;
  oy: number;
}

/**
 * Touch input on the board half of the game screen:
 *  - while the shooter lines up, a drag anywhere slides the cube along the
 *    starting line under the finger;
 *  - while a cube slides, a touch fires the wind-charge dispenser nearest it.
 *
 * Throwing happens in the throw panel below the board.
 */
export function useBoardGesture(engine: GameEngine, transform: BoardTransform) {
  const transformRef = useRef(transform);
  // Keep the latest layout for the handlers without rebuilding the gesture.
  useLayoutEffect(() => {
    transformRef.current = transform;
  });

  const toWorld = (screenX: number, screenY: number) => {
    const current = transformRef.current;
    return {
      x: (screenX - current.ox) / current.scale,
      y: (screenY - current.oy) / current.scale,
    };
  };

  return usePanGesture({
    // Run on the JS thread: the handlers call into the engine.
    runOnJS: true,
    minDistance: 0,
    onBegin: (event) => {
      const worldPoint = toWorld(event.x, event.y);
      if (engine.phase === 'sliding') {
        engine.fireWindChargeNear(worldPoint.x, worldPoint.y);
        return;
      }
      if (engine.canAim()) engine.placeCubeAtX(worldPoint.x);
    },
    onUpdate: (event) => {
      if (!engine.canAim()) return;
      engine.placeCubeAtX(toWorld(event.x, event.y).x);
    },
  });
}
