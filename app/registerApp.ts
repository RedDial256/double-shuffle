// Native (iOS and Android): Skia is built into the app, so Expo Router's
// entry can load straight away. It registers the routes in src/app.
export function registerApp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('expo-router/entry');
}
