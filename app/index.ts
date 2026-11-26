import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App).
//
// On web, Skia draws through CanvasKit (WebAssembly), which has to finish
// loading before any Skia component is imported, so App is required lazily
// here instead of imported at the top. `npm run web` copies canvaskit.wasm
// into public/ so the dev server can serve it.
/* eslint-disable @typescript-eslint/no-require-imports */
if (Platform.OS === 'web') {
  const { LoadSkiaWeb } = require('@shopify/react-native-skia/lib/module/web');
  LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() =>
    registerRootComponent(require('./App').default)
  );
} else {
  registerRootComponent(require('./App').default);
}
/* eslint-enable @typescript-eslint/no-require-imports */
