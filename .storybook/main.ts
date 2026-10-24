import { defineMain } from '@storybook/react-vite/node';
import remarkGfm from 'remark-gfm';
import { clientDirectives } from './clientDirectives.ts';
import { onLog } from './rollupOnLog.ts';

const sassDeprecationsToSilence = [
  'import',
  'global-builtin',
  'color-functions',
  'if-function',
];

const applicationVendorGroups = [
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
];

export default defineMain({
  framework: '@storybook/react-vite',

  stories: [
    '../.storybook/*.mdx',
    '../ClientApp/src/**/*.mdx',
    '../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  features: {
    changeDetection: true,
    componentsManifest: true,
    experimentalReview: true,
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },

  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@storybook/addon-vitest',
    '@chromatic-com/storybook',
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    {
      name: '@storybook/addon-mcp',
      options: {
        toolsets: {
          dev: true,
          docs: true,
          test: true,
        },
      },
    },
  ],

  docs: {
    defaultName: 'Documentation',
    docsMode: false,
  },

  // ClientApp/public owns the MSW worker and captured portal assets.
  staticDirs: ['../ClientApp/public'],

  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');

    // Bootstrap 5 still uses Sass APIs that emit deprecation warnings. Keep
    // this compatibility layer until Bootstrap 6 enables a complete @use
    // migration. The build settings below isolate the preview runtime and
    // preserve Storybook's client directive on each output chunk.
    return mergeConfig(viteConfig, {
      plugins: [clientDirectives()],
      css: {
        preprocessorOptions: {
          scss: {
            quietDeps: true,
            silenceDeprecations: sassDeprecationsToSilence,
          },
        },
      },
      build: {
        // Storybook's generated iframe includes the preview runtime and is
        // currently just over 1 MB minified. Keep warnings enabled for chunks
        // materially larger than that known baseline.
        chunkSizeWarningLimit: 1152,
        // `onLog` drops vendor `INVALID_ANNOTATION` / `PLUGIN_TIMINGS`
        // noise and forwards everything else untouched. Extracted to
        // ./rollupOnLog so the pass-through guarantee is unit-tested.
        rolldownOptions: {
          onLog,
          // Preserve the client boundary on every browser-only Storybook chunk.
          // Module markers are hoisted by clientDirectives, not log-filtered.
          output: {
            banner: '"use client";',
            // Keep initialization order when moving the prebuilt runtime into
            // its own chunk. All other modules retain automatic splitting.
            // https://rolldown.rs/reference/OutputOptions.codeSplitting
            strictExecutionOrder: true,
            codeSplitting: {
              groups: [
                ...applicationVendorGroups,
                {
                  name: 'storybook-runtime',
                  test: /[\\/]node_modules[\\/]storybook[\\/]dist[\\/]preview[\\/]runtime\.js$/,
                },
              ],
            },
          },
        },
      },
    });
  },
});
