import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App).
//
// On web, Skia draws through CanvasKit (WebAssembly), which has to finish
// loading before any Skia component is imported. `npm run web` copies
// canvaskit.wasm into public/ so the dev server can serve it.
if (Platform.OS === 'web') {
  const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
  LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() =>
    registerRootComponent(require('./App').default),
  );
} else {
  registerRootComponent(require('./App').default);
}
