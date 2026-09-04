import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';
import { onLog } from './rollupOnLog';

const config: StorybookConfig = {
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
                prop.parent
                    ? !/node_modules/.test(prop.parent.fileName)
                    : true,
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
        // migration. Vite still owns code-splitting; the `build` block below only
        // raises the chunk-size *warning* threshold and silences vendor bundler
        // log noise — it does not change chunking or output.
        return mergeConfig(viteConfig, {
            css: {
                preprocessorOptions: {
                    scss: {
                        quietDeps: true,
                        silenceDeprecations: [
                            'import',
                            'global-builtin',
                            'color-functions',
                            'if-function',
                        ] as string[],
                    },
                },
            },
            build: {
                // Storybook's own runtime dominates this bundle — iframe.js is
                // ~1.9 MB, plus axe-core and the Storybook UI. Our largest story
                // chunk is ~224 kB, so the 500 kB default only ever fires on
                // framework code we don't control. Lift the ceiling clear of the
                // framework bundles but keep it close enough to flag a runaway
                // story chunk. This governs only the (non-deployed) Storybook
                // build; the production portal bundles via webpack.config.js and
                // is unaffected.
                chunkSizeWarningLimit: 1024,
                // `onLog` drops vendor `INVALID_ANNOTATION` / `PLUGIN_TIMINGS`
                // noise and forwards everything else untouched. Extracted to
                // ./rollupOnLog so the pass-through guarantee is unit-tested.
                rollupOptions: { onLog },
            },
        });
    },
};

export default config;
