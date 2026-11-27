import type { ConfigContext, ExpoConfig } from 'expo/config';

import { version } from './package.json';

// app/package.json is the only source of the app version; release-please
// bumps it. The App Store only accepts numeric versions, so iOS gets the
// MAJOR.MINOR.PATCH part (1.0.0-beta.2 ships as 1.0.0). The full version
// stays in the root `version`, read at runtime from Constants.expoConfig.
export const numericVersion = (full: string): string => full.split(/[-+]/)[0];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ios: { ...config.ios, version: numericVersion(version) },
  name: config.name ?? 'Double Shuffle',
  slug: config.slug ?? 'double-shuffle',
  version,
});
