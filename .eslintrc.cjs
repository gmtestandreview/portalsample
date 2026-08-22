module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
    },
    plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
    ],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended', 'plugin:storybook/recommended'],
    settings: {
        react: {
            version: 'detect',
        },
    },
    ignorePatterns: [
        'node_modules/',
        'dist/',
        'storybook-static/',
        'coverage/',
        'test-results/',
        'playwright-report/',
        'ClientApp/src/api/web-api-client.ts',
        'ClientApp/src/external/',
        'ClientApp/src/parent/node_modules/',
        'ClientApp/src/parent/packages/',
        'ClientApp/source-map-http-downloads/',
        'ClientApp/webpack/',
    ],
    rules: {
        '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
        '@typescript-eslint/no-empty-object-type': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
        }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'react/prop-types': 'off',
    },
    overrides: [
        {
            files: [
                '*.cjs',
                '*.js',
                'webpack.config.js',
            ],
            env: {
                browser: false,
                node: true,
            },
            parserOptions: {
                project: null,
                sourceType: 'script',
            },
            rules: {
                '@typescript-eslint/no-require-imports': 'off',
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
        {
            files: [
                '.storybook/**/*.{ts,tsx,js,jsx}',
                'tests/**/*.{ts,tsx}',
                'ClientApp/src/**/*.test.{ts,tsx}',
                'ClientApp/src/**/*.stories.{ts,tsx}',
                'vitest*.{ts,js}',
                'playwright.config.ts',
            ],
            env: {
                browser: true,
                node: true,
            },
        },
        {
            files: [
                'ClientApp/src/**/*.stories.{ts,tsx}',
            ],
            rules: {
                // Story files in this repo already use `satisfies Meta`; keep it enforced.
                'storybook/meta-satisfies-type': 'error',
            },
        },
        {
            files: [
                'quality/_phase5_seed/**/*.ts',
                'quality/_phase5_seed/**/*.tsx',
            ],
            env: {
                browser: true,
                node: true,
            },
            parserOptions: {
                project: ['./quality/_phase5_seed/tsconfig.json'],
            },
        },
        {
            files: ['ClientApp/src/components/Footer/**/*.{ts,tsx}'],
            rules: {
                'react/jsx-child-element-spacing': 'error',
            },
        },
        {
            files: [
                '*.config.ts',
                'vitest*.ts',
                'playwright.config.ts',
            ],
            env: {
                browser: false,
                node: true,
            },
            parserOptions: {
                project: null,
            },
        },
        {
            files: ['ClientApp/src/declarations.d.ts'],
            rules: {
                '@typescript-eslint/triple-slash-reference': 'off',
            },
        },
        {
            files: ['vitest.setup.ts', 'vitest.storybook.setup.ts'],
            rules: {
                'no-restricted-globals': ['error', {
                    name: 'window',
                    message: "Prefer 'globalThis' in test setup files (SonarLint S7764). Use globalThis instead.",
                }],
            },
        },
    ],
};
