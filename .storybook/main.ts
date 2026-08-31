import type { StorybookConfig } from '@storybook/react-vite';
import remarkGfm from 'remark-gfm';

const getNodeModulesPackageName = (moduleId: string) => {
    const normalizedId = moduleId.replace(/\\/g, '/');
    const nodeModulesIndex = normalizedId.lastIndexOf('/node_modules/');

    if (nodeModulesIndex === -1) {
        return null;
    }

    const packagePath = normalizedId.slice(
        nodeModulesIndex + '/node_modules/'.length,
    );
    const segments = packagePath.split('/');
    const [firstSegment, secondSegment] = segments;

    if (!firstSegment) {
        return null;
    }

    return firstSegment.startsWith('@') && secondSegment
        ? `${firstSegment}/${secondSegment}`
        : firstSegment;
};

const getPackageSubArea = (moduleId: string, packageName: string) => {
    const normalizedId = moduleId.replace(/\\/g, '/');
    const packagePath = `/node_modules/${packageName}/`;
    const packageIndex = normalizedId.lastIndexOf(packagePath);

    if (packageIndex === -1) {
        return 'root';
    }

    const remainder = normalizedId.slice(packageIndex + packagePath.length);
    const segments = remainder.split('/').filter(Boolean);

    if (segments[0] === 'dist' && segments[1]) {
        return segments[1].replace(/^_/, '').replace(/[^a-z0-9-]/gi, '-');
    }

    if (segments[0]) {
        return segments[0].replace(/^_/, '').replace(/[^a-z0-9-]/gi, '-');
    }

    return 'root';
};

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
        check: true,
        checkOptions: {
        eslint: true,     },     
        reactDocgen: 'react-docgen-typescript',
        reactDocgenTypescriptOptions: {
        shouldExtractLiteralValuesFromEnum: true,
        // 👇 Default prop filter, which excludes props from node_modules
        propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },

    addons: [
        '@storybook/addon-a11y',
        '@storybook/addon-links',
        'msw-storybook-addon',
        '@storybook/addon-vitest',
        '@chromatic-com/storybook',
        {
            name: '@storybook/addon-docs',
            options: {
                autodocs: 'tag', 
                defaultName: 'Documentation', 
                docsMode: true,
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

    // Expose ClientApp/public so the MSW service worker (mockServiceWorker.js)
    // is served at the root. Run `npx msw init ClientApp/public/` once after
    // install - NOT `public/`. A root public/ copy is served by nothing here
    // (webpack devServer and staticDirs both point at ClientApp/public) and
    // silently drifts from the tracked worker on the next msw upgrade.
    staticDirs: ['../ClientApp/public'],

    async viteFinal(config, { configType }) {
        const { mergeConfig } = await import('vite');

        // Suppress Dart Sass deprecations from Bootstrap (quietDeps) and from our
        // own @import-based partials (silenceDeprecations) in both dev and build.
        // Remove quietDeps and the import/global-builtin/color-functions entries
        // when upgrading to Bootstrap 6 with @use support.
        const sassConfig = {
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
        };

        if (configType !== 'PRODUCTION') {
            return mergeConfig(config, sassConfig);
        }

        return mergeConfig(config, {
            ...sassConfig,
            build: {
                // After isolating app and vendor code, the remaining largest
                // chunks are Storybook-owned docs/preview runtimes rather than
                // regressions in the portal UI bundle itself. MSW, testing-library,
                // vitest, and chromatic are now in named groups; remaining infra
                // chunks (Storybook renderer, addon manager) are irreducible.
                chunkSizeWarningLimit: 1500,
                rolldownOptions: {
                    checks: {
                        // Application Insights 3.4.3 ships ineffective PURE
                        // annotations in its dist-es5 modules. Rolldown already
                        // ignores them; avoid repeating the upstream warning in
                        // every Storybook build until the package fix is released.
                        invalidAnnotation: false,
                        // Storybook's own transform plugins dominate this docs-
                        // heavy build, so the generic timing notice is not an
                        // actionable portal performance regression.
                        pluginTimings: false,
                    },
                    output: {
                        codeSplitting: {
                            minSize: 0,
                            groups: [
                                {
                                    name: (moduleId: string) => {
                                        const packageName =
                                            getNodeModulesPackageName(moduleId);

                                        if (!packageName) {
                                            return null;
                                        }

                                        if (
                                            packageName.startsWith(
                                                '@storybook/',
                                            ) ||
                                            packageName === 'storybook' ||
                                            packageName.startsWith(
                                                '@mdx-js/',
                                            ) ||
                                            packageName === 'markdown-to-jsx'
                                        ) {
                                            if (
                                                packageName === 'storybook' ||
                                                packageName ===
                                                    '@storybook/addon-docs'
                                            ) {
                                                const subArea =
                                                    getPackageSubArea(
                                                        moduleId,
                                                        packageName,
                                                    );
                                                return `storybook-${packageName.replace(/[@/]/g, '-')}-${subArea}`;
                                            }

                                            return `storybook-${packageName.replace(/[@/]/g, '-')}`;
                                        }

                                        return null;
                                    },
                                    priority: 100,
                                },
                                {
                                    name: 'react-vendor',
                                    test: /node_modules[\\/](?:react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
                                    priority: 90,
                                },
                                {
                                    name: 'bootstrap-vendor',
                                    test: /node_modules[\\/](?:react-bootstrap|bootstrap|@popperjs)[\\/]/,
                                    priority: 80,
                                },
                                {
                                    name: 'forms-vendor',
                                    test: /node_modules[\\/](?:formik|yup|react-number-format)[\\/]/,
                                    priority: 70,
                                },
                                {
                                    name: 'date-vendor',
                                    test: /node_modules[\\/](?:react-datepicker|date-fns)[\\/]/,
                                    priority: 60,
                                },
                                {
                                    name: 'auth-vendor',
                                    test: /node_modules[\\/](?:@azure[\\/]msal-browser|@azure[\\/]msal-react)[\\/]/,
                                    priority: 50,
                                },
                                {
                                    name: 'analytics-vendor',
                                    test: /node_modules[\\/](?:@microsoft[\\/]applicationinsights-common|@microsoft[\\/]applicationinsights-react-js|@microsoft[\\/]applicationinsights-web|react-ga4)[\\/]/,
                                    priority: 40,
                                },
                                {
                                    name: 'utility-vendor',
                                    test: /node_modules[\\/](?:lodash|dompurify)[\\/]/,
                                    priority: 30,
                                },
                                {
                                    name: 'a11y-vendor',
                                    test: /node_modules[\\/](?:axe-core|@storybook[\\/]addon-a11y)[\\/]/,
                                    priority: 20,
                                },
                                {
                                    name: 'msw-vendor',
                                    test: /node_modules[\\/]msw[\\/]/,
                                    priority: 15,
                                },
                                {
                                    name: 'testing-vendor',
                                    test: /node_modules[\\/](?:@testing-library|vitest|@vitest)[\\/]/,
                                    priority: 10,
                                },
                                {
                                    name: 'chromatic-vendor',
                                    test: /node_modules[\\/]@chromatic-com[\\/]/,
                                    priority: 5,
                                },
                            ],
                        },
                    },
                },
            },
        });
    },
};

export default config;
