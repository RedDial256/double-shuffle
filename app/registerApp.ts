import { registerRootComponent } from 'expo';

import App from './App';

// Native (iOS and Android): Skia is built into the app, so App can be
// registered straight away. registerRootComponent calls
// AppRegistry.registerComponent('main', () => App).
export function registerApp() {
  registerRootComponent(App);
}
