import { create } from 'zustand';

import { centreHit, type HitZone } from '../game/hitZone';

interface ThrowState {
  /** Where the next throw will strike the cube's face. */
  hitZone: Readonly<HitZone>;
  /** Power of the swipe in progress, 0 to 1, or 0 when there is none. */
  swipePower: number;
  chooseHitZone: (hitZone: Readonly<HitZone>) => void;
  setSwipePower: (swipePower: number) => void;
  /** Back to a centre hit and no swipe, for a new throw. */
  reset: () => void;
}

/**
 * The throw being set up in the throw panel. The board reads it to draw the
 * guide line. Not saved: each throw starts from a centre hit.
 */
export const useThrowStore = create<ThrowState>()((set) => ({
  hitZone: centreHit,
  swipePower: 0,
  chooseHitZone: (hitZone) => set({ hitZone }),
  setSwipePower: (swipePower) => set({ swipePower }),
  reset: () => set({ hitZone: centreHit, swipePower: 0 }),
}));
