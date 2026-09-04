import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

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
        // migration; Vite owns all other build and code-splitting behaviour.
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
                // framework code we don't control. Raise the ceiling above the
                // framework bundles while still flagging a runaway story chunk.
                chunkSizeWarningLimit: 2048,
                rollupOptions: {
                    // The Application Insights ES5 builds place `/*#__PURE__*/`
                    // inside parentheses before a string literal — a malformed
                    // annotation Rolldown (Vite 8's bundler) reports but cannot
                    // act on and that has no functional effect. Silence it for
                    // vendor code only; annotation problems in our own source
                    // still surface. Mirrors the Sass `quietDeps` layer above.
                    onLog(
                        level: string,
                        log: { code?: string; message?: string },
                        handler: (
                            level: string,
                            log: { code?: string; message?: string },
                        ) => void,
                    ) {
                        const isVendorPureNoise =
                            log.code === 'INVALID_ANNOTATION' &&
                            (log.message ?? '').includes('node_modules');
                        if (isVendorPureNoise || log.code === 'PLUGIN_TIMINGS') {
                            return;
                        }
                        handler(level, log);
                    },
                },
            },
        });
    },
};

export default config;
