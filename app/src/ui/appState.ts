import type { AppStateStatus } from 'react-native';

/**
 * Whether the app is in front of the player. Anything else (`background`,
 * or `inactive` while the iOS app switcher or a call is up) should pause a
 * match.
 */
export function isAppInForeground(appState: AppStateStatus): boolean {
  return appState === 'active';
}
