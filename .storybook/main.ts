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
        });
    },
};

export default config;
