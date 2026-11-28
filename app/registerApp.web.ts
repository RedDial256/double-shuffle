import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// On web, Skia draws through CanvasKit (WebAssembly), which has to finish
// loading before any Skia component is imported, so Expo Router's entry (and
// with it every route) is required lazily instead of imported at the top.
// `npm run web` copies canvaskit.wasm into public/ so the dev server can
// serve it.
//
// This file must stay web-only: canvaskit-wasm imports Node's `fs`, which
// breaks native bundles.
export function registerApp() {
  LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-router/entry')
  );
}
