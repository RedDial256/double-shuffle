import rnConfig from '@red_dial/rn-tooling-config/eslint';
import expo from '@red_dial/rn-tooling-config/eslint/expo';
import typescript from '@red_dial/rn-tooling-config/eslint/typescript';
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';

export default [
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'web-build/',
      'ios/',
      'android/',
      'expo-env.d.ts',
    ],
  },
  ...rnConfig,
  ...typescript,
  ...expo,
  // Flags effects that only derive state, chain state updates or reset state
  // on prop change: https://react.dev/learn/you-might-not-need-an-effect
  reactYouMightNotNeedAnEffect.configs.recommended,
  {
    rules: {
      // Variables and functions get names that say what they are for. Object
      // properties are left alone so data like `x`/`y` and library APIs pass.
      'id-length': ['warn', { min: 2, properties: 'never', exceptions: ['_'] }],
    },
  },
];
