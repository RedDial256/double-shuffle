import { registerApp } from './registerApp';

// The entry point is split by platform: Metro picks registerApp.web.ts for
// web and registerApp.ts for iOS and Android. Keeping the web-only Skia
// loader in its own .web.ts file stops canvaskit-wasm (which imports Node's
// `fs`) from being pulled into native bundles.
registerApp();
