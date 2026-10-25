import type { DeprecationOrId } from 'sass';

export const SASS_DEPRECATIONS_TO_SILENCE = [
  'import',
  'global-builtin',
  'color-functions',
  'if-function',
] as const satisfies readonly DeprecationOrId[];

export const SASS_PREPROCESSOR_OPTIONS = {
  quietDeps: true,
  silenceDeprecations: [...SASS_DEPRECATIONS_TO_SILENCE],
};

type VendorChunkGroup = {
  name: string;
  test: RegExp;
};

export const APPLICATION_VENDOR_CHUNK_GROUPS = [
  {
    name: 'react-runtime',
    test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
  },
  {
    name: 'auth',
    test: /[\\/]node_modules[\\/]@azure[\\/]/,
  },
  {
    name: 'forms',
    test: /[\\/]node_modules[\\/](formik|yup)[\\/]/,
  },
  {
    name: 'ui',
    test: /[\\/]node_modules[\\/]react-bootstrap[\\/]/,
  },
  {
    name: 'utilities',
    // Lodash remains a transitive runtime dependency of Formik and Slate.
    test: /[\\/]node_modules[\\/](lodash|date-fns)[\\/]/,
  },
] as const satisfies readonly VendorChunkGroup[];
