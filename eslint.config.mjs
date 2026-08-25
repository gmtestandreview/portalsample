import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintReact from '@eslint-react/eslint-plugin';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Native ESLint 10 flat configuration.
 *
 * Ported from the retired `.eslintrc.cjs` / `.eslintignore` pair without
 * FlatCompat or a broad replacement preset. `eslint-plugin-react` is replaced by
 * `@eslint-react`, and the two stylistic JSX rules the repository relied on move
 * to `@stylistic`. Compatibility deltas are recorded in `docs/CONVENTIONS.md`.
 */
export default defineConfig(
    {
        name: 'nmi/ignores',
        ignores: [
            'node_modules/**',
            'dist/**',
            'storybook-static/**',
            'coverage/**',
            'reports/**',
            'test-results/**',
            'playwright-report/**',
            'ClientApp/src/api/web-api-client.ts',
            'ClientApp/src/external/**',
            'ClientApp/src/parent/node_modules/**',
            'ClientApp/src/parent/packages/**',
            'ClientApp/source-map-http-downloads/**',
            'ClientApp/webpack/**',
        ],
    },

    js.configs.recommended,
    tseslint.configs.recommended,

    {
        name: 'nmi/react',
        files: ['**/*.{ts,tsx}'],
        ...eslintReact.configs['recommended-typescript'],
    },

    {
        // Both plugins ship hook rules. eslint-plugin-react-hooks is the single
        // owner of the two rules the outgoing policy enforced, so @eslint-react's
        // overlapping copies are turned off to stop double reporting.
        //
        // @eslint-react/set-state-in-effect is also disabled here: it reports 56
        // sites, and clearing them means moving setState out of effects — a
        // behavioural refactor, not a lint migration. Those 56 sites are handed
        // to Child Plan C, which owns the act(...) warnings they cause.
        name: 'nmi/react-hooks',
        files: ['**/*.{ts,tsx}'],
        plugins: { 'react-hooks': reactHooks },
        rules: {
            '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
            '@eslint-react/set-state-in-effect': 'off',
            '@eslint-react/exhaustive-deps': 'off',
            '@eslint-react/rules-of-hooks': 'off',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
        },
    },

    ...storybook.configs['flat/recommended'],

    {
        name: 'nmi/base',
        files: ['**/*.{ts,tsx,js,jsx,cjs,mjs}'],
        plugins: { '@stylistic': stylistic },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser },
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        // Every rule is an error: this configuration is a clean baseline, and a
        // warning tier would let findings accumulate unnoticed.
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports' },
            ],
            '@typescript-eslint/no-empty-object-type': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': ['error', { allow: ['warn', 'error'] }],

            // Promoted into js.configs.recommended by ESLint 10 and absent from
            // the outgoing ESLint 8 policy.
            'preserve-caught-error': 'error',
            'no-useless-assignment': 'error',
            'no-constant-binary-expression': 'error',
        },
    },

    {
        name: 'nmi/commonjs-and-scripts',
        files: ['**/*.cjs', '**/*.js', 'webpack.config.js'],
        languageOptions: {
            sourceType: 'script',
            globals: { ...globals.node },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-var-requires': 'off',
        },
    },

    {
        name: 'nmi/browser-and-node-surfaces',
        files: [
            '.storybook/**/*.{ts,tsx,js,jsx}',
            'tests/**/*.{ts,tsx}',
            'ClientApp/src/**/*.test.{ts,tsx}',
            'ClientApp/src/**/*.stories.{ts,tsx}',
            'vitest*.{ts,js}',
            'playwright.config.ts',
            'quality/_phase5_seed/**/*.{ts,tsx}',
        ],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },

    {
        // Deliberate deviations from @eslint-react's stylistic conventions.
        // Each is a naming/API preference with no defect behind it, and each
        // would make this codebase worse or riskier to satisfy. Correctness
        // rules from the same plugin stay on.
        name: 'nmi/react-convention-deviations',
        files: ['**/*.{ts,tsx}'],
        rules: {
            // Would rename `itemRefs` (an array of refs) to `itemRef`, and
            // churn 18 declarations across 13 files for no behavioural gain.
            '@eslint-react/naming-convention-ref-name': 'off',

            // Wants `AccountStateCtx` -> `AccountStateContext`, but that
            // identifier is already the exported *type* in the same module.
            // The Ctx suffix is deliberate disambiguation.
            '@eslint-react/naming-convention-context-name': 'off',

            // "Uncommon API" advisories, not defects. Children.only in
            // FormikForm is load-bearing single-child validation, and replacing
            // Children.forEach / cloneElement is a behavioural refactor of
            // stable form infrastructure — out of scope for a lint migration.
            '@eslint-react/no-children-only': 'off',
            '@eslint-react/no-children-for-each': 'off',
            '@eslint-react/no-clone-element': 'off',
        },
    },

    {
        // Static documentation tables rendered from props: rows never reorder,
        // and content-derived keys would collide on duplicate cell values.
        name: 'nmi/storybook-doc-helpers',
        files: ['ClientApp/src/storybook/**/*.{ts,tsx}'],
        rules: { '@eslint-react/no-array-index-key': 'off' },
    },

    {
        name: 'nmi/stories',
        files: ['ClientApp/src/**/*.stories.{ts,tsx}'],
        rules: {
            // Story files in this repo already use `satisfies Meta`; keep it enforced.
            'storybook/meta-satisfies-type': 'error',
        },
    },

    {
        name: 'nmi/footer-jsx-spacing',
        files: ['ClientApp/src/components/Footer/**/*.{ts,tsx}'],
        rules: {
            // Replaces react/jsx-child-element-spacing.
            '@stylistic/jsx-child-element-spacing': 'error',
        },
    },

    {
        name: 'nmi/node-config-files',
        files: ['*.config.{ts,js}', 'vitest*.ts', 'playwright.config.ts'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },

    {
        name: 'nmi/ambient-declarations',
        files: ['ClientApp/src/declarations.d.ts'],
        rules: {
            '@typescript-eslint/triple-slash-reference': 'off',
        },
    },

    {
        name: 'nmi/test-setup-globals',
        files: ['vitest.setup.ts', 'vitest.storybook.setup.ts'],
        rules: {
            'no-restricted-globals': [
                'error',
                {
                    name: 'window',
                    message:
                        "Prefer 'globalThis' in test setup files (SonarLint S7764). Use globalThis instead.",
                },
            ],
        },
    },
);
