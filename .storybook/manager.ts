import { addons } from 'storybook/manager-api';

addons.setConfig({
  'storybook-addon-oversight': {
    expectedExtractor: 'react-docgen-typescript',
    debuggerLink: false, // hide the manifest-debugger link
    rules: {
      'deprecated-tag': 'off', // disable a rule
      'prop-descriptions-missing': 'error', // or remap its severity
    },
  },
});
