import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        process: true,
      },
    },
  },
  pluginJs.configs.recommended,
];
