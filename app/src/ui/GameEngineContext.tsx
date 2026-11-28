import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { GameEngine } from '../game/engine';

const GameEngineContext = createContext<GameEngine | null>(null);

/**
 * Holds the one game engine the app uses, so the Game screen and the Pause
 * modal over it work on the same match.
 */
export function GameEngineProvider({ children }: { children: ReactNode }) {
  const engine = useMemo(() => new GameEngine(), []);
  return (
    <GameEngineContext.Provider value={engine}>
      {children}
    </GameEngineContext.Provider>
  );
}

export function useGameEngine(): GameEngine {
  const engine = useContext(GameEngineContext);
  if (!engine) {
    throw new Error('useGameEngine must be used inside GameEngineProvider');
  }
  return engine;
}
