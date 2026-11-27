import { useCallback, useRef, useSyncExternalStore } from 'react';

import type { GameEngine } from '../game/engine';

/**
 * Re-renders the calling component whenever the engine emits a `state`
 * event. The engine is an external store, so this subscribes through
 * `useSyncExternalStore` instead of mirroring it into state from an effect.
 */
export function useEngineState(engine: GameEngine): void {
  const stateRevision = useRef(0);
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      engine.subscribe((event) => {
        if (event.type !== 'state') return;
        stateRevision.current += 1;
        onStoreChange();
      }),
    [engine]
  );
  useSyncExternalStore(subscribe, () => stateRevision.current);
}
