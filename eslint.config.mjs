// ***
// ESLint policy for the portal.measurement.gov.au application.
// This config defines lint rules and file scopes;
// it does not define application classes.
// Global ignores are rooted at eslint.config.mjs.
// Only directories genuinely excluded by this repository's tsconfig and
// generated-artifact policies are excluded here;
// authored source files remain lintable.
//
// The TypeScript React preset applies only to React-facing code, not every
// TypeScript file (in particular, not Playwright and Vite configuration files).
// The security plugin intentionally treats many findings as reviewable
// hotspots. Keep its documented warning severities. CI should enforce
// --max-warnings 0 after triage, rather than silently suppress findings.
// Storybook's official flat recommended preset is intentionally retained.
// Use environment-specific declarations; do not give Node scripts every
// browser/Service Worker global via a broad base or accessibility config.
// Register serviceworker globals ONLY in actual workers. Keep this list
// narrow; amend to match real worker filenames if the project adds any.
// Oxfmt owns formatting; the conflict-disabling config must be last.
// ***

import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import pluginSecurity from 'eslint-plugin-security';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import jsxA11yX from 'eslint-plugin-jsx-a11y-x';
import vitest from '@vitest/eslint-plugin';
import vitestGlobals from 'eslint-plugin-vitest-globals';

const packageJsonPath = fileURLToPath(
  new URL('./package.json', import.meta.url),
);

const javascriptAndTypeScriptFiles = ['**/*.{js,jsx,mjs,ts,tsx,mts}'];
const typescriptFiles = ['**/*.{ts,tsx,mts}'];

// The TypeScript React preset applies only to React-facing code, not every
// TypeScript file (in particular, not Playwright and Vite configuration files).
const reactTypeScriptFiles = [
  'ClientApp/src/**/*.{ts,tsx}',
  '.storybook/**/*.{tsx}',
  'tests/unit/**/*.{tsx}',
];
const reactJavaScriptFiles = [
  'ClientApp/src/**/*.{js,jsx}',
  '.storybook/**/*.{jsx}',
  'tests/unit/**/*.{jsx}',
];
const reactFiles = [...reactTypeScriptFiles, ...reactJavaScriptFiles];

const jsxFiles = [
  'ClientApp/src/**/*.{jsx,tsx}',
  '.storybook/**/*.{jsx,tsx}',
  'tests/unit/**/*.{jsx,tsx}',
];

// Do not include *.stories.* here. Storybook stories use the Storybook test
// APIs and must not receive the ordinary Vitest all-preset autofix policy.
const vitestFiles = [
  'tests/unit/**/*.{js,jsx,ts,tsx}',
  'ClientApp/src/**/*.test.{js,jsx,ts,tsx}',
  'ClientApp/src/**/*.spec.{js,jsx,ts,tsx}',
  'ClientApp/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
  'vitest.setup.ts',
  'vitest.storybook.setup.ts',
];

const storyFiles = ['ClientApp/src/**/*.stories.{js,jsx,ts,tsx}'];
const storybookFiles = ['.storybook/**/*.{js,jsx,mjs,ts,tsx,mts}'];
const playwrightFiles = [
  'playwright.config.ts',
  'tests/e2e/**/*.{ts,tsx}',
  'tests/api-contract/**/*.{ts,tsx}',
];

const nodeFiles = [
  'scripts/**/*.{js,mjs,ts,mts}',
  'quality/**/*.{js,mjs,ts,mts}',
  '*.config.{js,mjs,ts,mts}',
  'vitest*.{js,mjs,ts,mts}',
  'playwright.config.ts',
  'remark.config.mjs',
  'storybook-vite-policies.ts',
  'test-import.mjs',
  '.storybook/main.{js,mjs,ts,mts}',
  '.storybook/*.config.{js,mjs,ts,mts}',
  '.storybook/storybook-test-target.mjs',
  'tests/**/*.{js,jsx,mjs,ts,tsx,mts}',
];

const serviceWorkerFiles = [
  'ClientApp/src/**/service-worker.{js,mjs,ts}',
  'ClientApp/src/**/serviceWorker.{js,mjs,ts}',
  'ClientApp/src/**/*.sw.{js,mjs,ts}',
];

const nodeToolFiles = [
  'scripts/**/*.{js,mjs,ts,mts}',
  'quality/**/*.{js,mjs,ts,mts}',
  '*.config.{js,mjs,ts,mts}',
  'vitest*.{js,mjs,ts,mts}',
  'playwright.config.ts',
  'remark.config.mjs',
  'storybook-vite-policies.ts',
  'test-import.mjs',
  '.storybook/main.{js,mjs,ts,mts}',
  '.storybook/*.config.{js,mjs,ts,mts}',
  '.storybook/storybook-test-target.mjs',
];

const browserFiles = [
  'ClientApp/src/**/*.{js,jsx,ts,tsx}',
  '.storybook/preview.{js,jsx,mjs,ts,tsx}',
  '.storybook/manager.{js,jsx,mjs,ts,tsx}',
];

const mixedTestFiles = [
  'tests/unit/**/*.{js,jsx,ts,tsx}',
  'ClientApp/src/**/*.test.{js,jsx,ts,tsx}',
  'ClientApp/src/**/*.spec.{js,jsx,ts,tsx}',
  'ClientApp/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
  'vitest.setup.ts',
  'vitest.storybook.setup.ts',
  'quality/_phase5_seed/**/*.{ts,tsx}',
];

const playWrightImportRestriction = [
  'error',
  {
    paths: [
      {
        name: 'vitest',
        message:
          'Use the Playwright test API, not Vitest, in Playwright tooling.',
      },
    ],
  },
];

const storybookTestImportRestriction = [
  'error',
  {
    paths: [
      {
        name: 'vitest',
        importNames: ['expect', 'test'],
        message:
          'Use the Storybook test API for Storybook assertions and interactions.',
      },
    ],
  },
];

export default defineConfig(
  // Global ignores are rooted at eslint.config.mjs. Only directories genuinely
  // excluded by this repository's tsconfig and generated-artifact policies are
  // excluded here; authored source files remain lintable.
  globalIgnores(
    [
      '**/dist/**',
      '**/storybook-static/**',
      '**/reports/**',
      '**/vendor/**',
      // Generated by `msw init`; its header says not to modify it, and its
      // checksum is verified by MSW. Regenerate rather than edit.
      'ClientApp/public/mockServiceWorker.js',
      // Generated by `npx playwright install`. Regenerate rather than edit.
      'tests/e2e/playwright.config.ts',
      'tests/api-contract/playwright.config.ts',
      'ClientApp/src/api/web-api-client.ts',
      'ClientApp/src/parent/node_modules/**',
    ],

    'nmi/ignores',
  ),

  {
    name: 'nmi/lint-governance',
    linterOptions: {
      // Inline eslint-disable comments may not change the checked rule policy.
      // Any remaining ones must be removed from the source files themselves.
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  },

  {
    name: 'nmi/base',
    files: javascriptAndTypeScriptFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Explicitly retain two correctness checks introduced into the ESLint 10
      // recommended preset; the other recommended rules come from @eslint/js.
      'preserve-caught-error': 'error',
      'no-useless-assignment': 'error',
    },
  },

  {
    name: 'nmi/javascript-recommended',
    files: javascriptAndTypeScriptFiles,
    extends: [js.configs.recommended],
  },

  {
    name: 'nmi/typescript',
    files: typescriptFiles,
    extends: [
      // Keep type-aware checks active on ALL TypeScript files after React
      // rules move to their own restricted scopes.
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: {
          // One deliberate, narrow exception outside the root tsconfig.
          allowDefaultProject: [
            '.claude/skills/typescript-expert/scripts/tests/utility-types.test.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowAny: false,
          allowBoolean: false,
          allowNever: false,
          allowNullish: false,
          allowNumber: true, // only change from strict-type-checked
          allowRegExp: false,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-empty-object-type': 'error',
      // Migration compatibility: do not introduce a ban on existing any types.
      '@typescript-eslint/no-explicit-any': 'off',
      // Function-valued callback properties do not satisfy this rule's model.
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      // The TypeScript-aware rule is the sole owner of unused variable checks.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    // Ambient global-script registry: `import type` would make it a module.
    files: ['tests/unit/helpers/typedPartialMockTypes.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
    },
  },

  // The security plugin intentionally treats many findings as reviewable
  // hotspots. Keep its documented warning severities. CI should enforce
  // --max-warnings 0 after triage, rather than silently suppress findings.
  pluginSecurity.configs.recommended,

  // Storybook's official flat recommended preset is intentionally retained.
  ...storybook.configs['flat/recommended'],

  {
    name: 'nmi/storybook-main',
    files: ['.storybook/main.{js,mjs,ts,mts}'],
    rules: {
      'storybook/no-uninstalled-addons': [
        'error',
        { packageJsonLocation: packageJsonPath },
      ],
    },
  },

  // Use environment-specific declarations; do not give Node scripts every
  // browser/Service Worker global via a broad base or accessibility config.
  {
    name: 'nmi/browser-globals',
    files: browserFiles,
    ignores: serviceWorkerFiles,
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    name: 'nmi/node-esm-globals',
    files: nodeFiles,
    languageOptions: {
      // Unlike globals.node, nodeBuiltin omits CommonJS wrapper variables.
      globals: { ...globals.nodeBuiltin },
    },
  },
  {
    name: 'nmi/node-tool-console',
    files: nodeToolFiles,
    rules: {
      'no-console': ['error', { allow: ['log', 'warn', 'error'] }],
    },
  },
  {
    name: 'nmi/mixed-test-globals',
    files: mixedTestFiles,
    languageOptions: {
      globals: { ...globals.browser, ...globals.nodeBuiltin },
    },
  },
  // Register serviceworker globals ONLY in actual workers. Keep this list
  // narrow; amend to match real worker filenames if the project adds any.
  {
    name: 'nmi/service-worker-globals',
    files: serviceWorkerFiles,
    languageOptions: {
      globals: { ...globals.serviceworker },
    },
  },

  {
    name: 'nmi/react-typescript',
    files: reactTypeScriptFiles,
    extends: [eslintReact.configs['strict-type-checked']],
  },
  {
    name: 'nmi/react-javascript',
    files: reactJavaScriptFiles,
    extends: [eslintReact.configs.recommended],
  },
  {
    name: 'nmi/react-18-compatibility-and-conventions',
    files: reactFiles,
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // React 19-specific APIs are unavailable in React 18.3.1.
      '@eslint-react/no-context-provider': 'off',
      '@eslint-react/no-forward-ref': 'off',
      '@eslint-react/no-use-context': 'off',
      '@eslint-react/dom-no-use-form-state': 'off',
      // This is experimental React Server Component linting; not SPA policy.
      '@eslint-react/rsc-function-definition': 'off',

      // React Hooks rules have a single reporting owner.
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/rules-of-hooks': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/immutability': 'error',
      'react-hooks/globals': 'error',
      'react-hooks/refs': 'error',
      'react-hooks/incompatible-library': 'error',
      'react-hooks/preserve-manual-memoization': 'error',
      'react-hooks/set-state-in-render': 'error',
      'react-hooks/use-memo': 'error',

      // Preserve a separately owned behavioural refactor: removing setState
      // calls from effects is not safe as an automatic lint migration.
      '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'off',
      '@eslint-react/set-state-in-effect': 'off',

      // Repository-specific API/naming choices, intentionally not auto-fixed.
      '@eslint-react/naming-convention-ref-name': 'off',
      '@eslint-react/naming-convention-context-name': 'off',
      '@eslint-react/no-children-only': 'off',
      '@eslint-react/no-children-for-each': 'off',
      '@eslint-react/no-clone-element': 'off',
    },
  },
  {
    name: 'nmi/storybook-doc-helpers',
    files: ['ClientApp/src/storybook/**/*.{ts,tsx}'],
    rules: {
      // These static documentation rows never reorder.
      '@eslint-react/no-array-index-key': 'off',
    },
  },

  {
    name: 'nmi/jsx-accessibility',
    files: jsxFiles,
    extends: [jsxA11yX.configs.recommended],
    // No global browser or Service Worker globals here: the accessibility
    // rules and runtime environment have independent configuration scopes.
  },

  {
    name: 'nmi/stories',
    files: storyFiles,
    rules: {
      'storybook/meta-satisfies-type': 'error',
      // Storybook play functions use Storybook's test API, not direct runtime
      // imports from Vitest. Type-only imports remain permitted.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vitest',
              allowTypeImports: true,
              message: 'Use the Storybook test API for Storybook interactions.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'nmi/storybook-runner-boundaries',
    files: storybookFiles,
    rules: {
      // Keep this narrower than the story-file prohibition: Storybook's
      // Vitest integration/configuration may legitimately import other APIs.
      'no-restricted-imports': storybookTestImportRestriction,
    },
  },

  {
    name: 'nmi/vitest-all',
    files: vitestFiles,
    ...vitest.configs.all,
    settings: { vitest: { typecheck: true } },
  },
  {
    name: 'nmi/vitest-globals',
    files: vitestFiles,
    // Compatibility for existing global APIs. Convert tests to explicit
    // imports before removing this plugin or root vitest/globals types.
    ...vitestGlobals.configs['flat/recommended'],
  },
  {
    name: 'nmi/vitest-partial-mock-fix-safety',
    files: vitestFiles,
    rules: {
      // Disabled for the test scope (the only place vi.mock() appears) by
      // deliberate design, not to reduce a diagnostic count. These suites
      // mock modules through the STRING overload of vi.mock() on purpose:
      // the typed-partial-mock pattern (__ExactMockModule<__TestMockModuleN>
      // in tests/unit/helpers/typedPartialMockTypes.d.ts) relies on that
      // overload leaving the factory return type unconstrained, so a partial
      // mock keyed to the real module's members still type-checks under
      // strict TS. Rewriting to vi.mock(import('...'), ...) selects the
      // typed (Promise) overload, which constrains the factory to
      // Awaitable<Partial<typeof import('...')>> and therefore rejects
      // (TS2769) every mock that stands in for a class, namespace, or
      // multi-member object export (e.g. @/api/web-api-client, react-router,
      // react-ga4); importOriginal + spread does not rescue the overridden
      // member, and only pure-function-export mocks would survive. Enforcing
      // the rule would require unsafe `as typeof import()` casts, which this
      // repository forbids. Verified: converting a representative suite
      // passed its unit tests but failed `npm run type-check` with TS2769.
      'vitest/prefer-import-in-mock': 'off',
    },
  },
  {
    name: 'nmi/vitest-lifecycle-hook-exceptions',
    files: [
      'tests/unit/components/inputs/complexInputs.behavior.test.tsx',
      'tests/unit/config/authRedirectBridgePolicy.test.ts',
      'tests/unit/storybook/mswHandlers.test.ts',
    ],
    rules: {
      'vitest/no-hooks': 'off',
      'vitest/no-duplicate-hooks': 'off',
      'vitest/prefer-hooks-in-order': 'off',
    },
  },
  {
    name: 'nmi/vitest-console-guard-registration',
    files: [
      'tests/unit/components/inputs/combobox.accessibility.test.tsx',
      'tests/unit/components/inputs/complexInputs.behavior.test.tsx',
      'tests/unit/components/inputs/residualBranches.test.tsx',
    ],
    rules: { 'vitest/require-hook': 'off' },
  },

  {
    name: 'nmi/vitest-setup-files',
    files: ['vitest.setup.ts', 'vitest.storybook.setup.ts'],
    rules: {
      // Setup hooks and browser shims intentionally execute at module scope.
      'vitest/require-hook': 'off',
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: "Prefer 'globalThis' in test setup files (SonarLint S7764).",
        },
      ],
    },
  },
  {
    name: 'nmi/storybook-vitest-setup-hooks',
    files: ['vitest.storybook.setup.ts'],
    rules: {
      'vitest/no-hooks': 'off',
      'vitest/require-top-level-describe': 'off',
    },
  },

  {
    name: 'nmi/playwright-runner-boundaries',
    files: playwrightFiles,
    rules: {
      // Do not let test APIs silently mix across Playwright and Vitest.
      'vitest/prefer-importing-vitest-globals': 'off',
      'vitest/require-hook': 'off',
      'no-restricted-imports': playWrightImportRestriction,
    },
  },
  {
    name: 'nmi/ambient-declarations',
    files: ['ClientApp/src/declarations.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  // Oxfmt owns formatting; disable conflicting ESLint stylistic rules last.
  eslintConfigPrettier,
);
