// ESLint flat configuration for the NMI Service Portal.
// File scopes, preset order and project-specific exceptions are intentional.
// Security warnings are reviewed; CI may enforce --max-warnings 0.
import { defineConfig, globalIgnores } from 'eslint/config';
import { URL, fileURLToPath } from 'node:url';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintReact from '@eslint-react/eslint-plugin';
import globals from 'globals';
import js from '@eslint/js';
import jsxA11yX from 'eslint-plugin-jsx-a11y-x';
import pluginSecurity from 'eslint-plugin-security';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import sonarjs from 'eslint-plugin-sonarjs';
import storybook from 'eslint-plugin-storybook';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';
import vitestGlobals from 'eslint-plugin-vitest-globals';
const packageJsonPath = fileURLToPath(
    new URL('./package.json', import.meta.url),
  ),
  javascriptAndTypeScriptFiles = ['**/*.{js,jsx,mjs,mts,ts,tsx}'],
  typescriptFiles = ['**/*.{mts,ts,tsx}'],
  reactTypeScriptFiles = [
    '.storybook/**/*.{tsx}',
    'ClientApp/src/**/*.{ts,tsx}',
    'tests/unit/**/*.{tsx}',
  ],
  reviewedFilesystemBoundaryFiles = [
    'scripts/safe-file-io.mjs',
    'tests/helpers/safeTestFilesystem.ts',
    'scripts/safe-file-io.test.mjs',
    'tests/unit/helpers/safeTestFilesystem.test.ts',
    'tests/unit/storybook/worklist.test.ts',
  ],
  appJsxFiles = ['ClientApp/src/**/*.{jsx,tsx}', '.storybook/**/*.{jsx,tsx}'],
  jsxFiles = [...appJsxFiles, 'tests/unit/**/*.{jsx,tsx}'],
  vitestFiles = [
    'tests/unit/**/*.{js,jsx,ts,tsx}',
    'ClientApp/src/**/*.test.{js,jsx,ts,tsx}',
    'ClientApp/src/**/*.spec.{js,jsx,ts,tsx}',
    'ClientApp/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    'vitest.setup.ts',
    'vitest.storybook.setup.ts',
  ],
  storyFiles = ['ClientApp/src/**/*.stories.{js,jsx,ts,tsx}'],
  storybookFiles = ['.storybook/**/*.{js,jsx,mjs,ts,tsx,mts}'],
  devOnlyStorybookFiles = [...storyFiles, 'ClientApp/src/storybook/**'],
  playwrightFiles = [
    'playwright.config.ts',
    'tests/e2e/**/*.{ts,tsx}',
    'tests/api-contract/**/*.{ts,tsx}',
  ],
  nodeToolFiles = [
    '.claude/skills/**/*.{js,mjs}',
    '.github/skills/**/*.{js,mjs}',
    'skills/**/*.{js,mjs}',
    'scripts/**/*.{js,mjs,ts,mts}',
    'quality/**/*.{js,mjs,ts,mts}',
    '*.config.{js,mjs,ts,mts}',
    'vitest*.{js,mjs,ts,mts}',
    'storybook-vite-policies.ts',
    'test-import.mjs',
    '.storybook/main.{js,mjs,ts,mts}',
    '.storybook/*.config.{js,mjs,ts,mts}',
    '.storybook/storybook-test-target.mjs',
  ],
  nodeFiles = [...nodeToolFiles, 'tests/**/*.{js,jsx,mjs,ts,tsx,mts}'],
  serviceWorkerFiles = [
    'ClientApp/src/**/service-worker.{js,mjs,ts}',
    'ClientApp/src/**/serviceWorker.{js,mjs,ts}',
    'ClientApp/src/**/*.sw.{js,mjs,ts}',
  ],
  browserFiles = [
    'ClientApp/env.js',
    'ClientApp/src/**/*.{js,jsx,ts,tsx}',
    '.storybook/preview.{js,jsx,mjs,ts,tsx}',
    '.storybook/manager.{js,jsx,mjs,ts,tsx}',
  ],
  mixedTestFiles = [...vitestFiles, 'quality/_phase5_seed/**/*.{ts,tsx}'],
  playWrightImportRestriction = [
    'error',
    {
      paths: [
        {
          message:
            'Use the Playwright test API, not Vitest, in Playwright tooling.',
          name: 'vitest',
        },
      ],
    },
  ],
  storybookTestImportRestriction = [
    'error',
    {
      paths: [
        {
          importNames: ['expect', 'test'],
          message:
            'Use the Storybook test API for Storybook assertions and interactions.',
          name: 'vitest',
        },
      ],
    },
  ],
  // Strip deprecated core and SonarJS identifiers from inherited presets.
  // Oxfmt owns formatting; no replacement formatting rules are enabled here.
  deprecatedRuleIds = new Set(
    [
      'array-bracket-newline array-bracket-spacing array-element-newline',
      'arrow-parens arrow-spacing block-spacing brace-style comma-dangle',
      'comma-spacing comma-style computed-property-spacing dot-location',
      'eol-last func-call-spacing function-call-argument-newline',
      'function-paren-newline generator-star-spacing',
      'implicit-arrow-linebreak indent indent-legacy jsx-quotes',
      'key-spacing keyword-spacing linebreak-style lines-around-comment',
      'max-len max-statements-per-line multiline-ternary new-parens',
      'newline-per-chained-call no-confusing-arrow no-extra-parens',
      'no-extra-semi no-floating-decimal no-mixed-operators',
      'no-mixed-spaces-and-tabs no-multi-spaces no-multiple-empty-lines',
      'no-new-symbol no-return-await no-spaced-func no-tabs',
      'no-trailing-spaces no-whitespace-before-property',
      'nonblock-statement-body-position object-curly-newline',
      'object-curly-spacing object-property-newline',
      'one-var-declaration-per-line operator-linebreak padded-blocks',
      'quote-props quotes rest-spread-spacing semi semi-spacing semi-style',
      'space-before-blocks space-before-function-paren space-in-parens',
      'space-infix-ops space-unary-ops switch-colon-spacing',
      'template-curly-spacing template-tag-spacing wrap-iife wrap-regex',
      'yield-star-spacing',
      'sonarjs/no-tab sonarjs/no-redundant-parentheses',
      'sonarjs/useless-string-operation sonarjs/web-sql-database',
      'sonarjs/conditional-indentation sonarjs/os-command',
      'sonarjs/no-unsafe-unzip sonarjs/no-intrusive-permissions',
      'sonarjs/hidden-files sonarjs/no-mixed-content',
      'sonarjs/frame-ancestors sonarjs/confidential-information-logging',
      'sonarjs/no-ip-forward',
    ]
      .join(' ')
      .split(' '),
  ),
  stripDeprecatedRules = (config) => {
    if (Array.isArray(config)) {
      return config.map(stripDeprecatedRules);
    }
    const result = { ...config };
    if (config.extends) {
      result.extends = config.extends.map((entry) =>
        typeof entry === 'string' ? entry : stripDeprecatedRules(entry),
      );
    }
    if (config.rules) {
      result.rules = Object.fromEntries(
        Object.entries(config.rules).filter(
          ([ruleName]) => !deprecatedRuleIds.has(ruleName),
        ),
      );
    }
    return result;
  };
export default defineConfig(
  globalIgnores(
    [
      '**/dist/**',
      '**/storybook-static/**',
      '**/reports/**',
      '**/.features-gen/**',
      '**/.remember/**',
      '**/vendor/**',
      'ClientApp/public/mockServiceWorker.js',
      'tests/e2e/playwright.config.ts',
      'tests/api-contract/playwright.config.ts',
      'ClientApp/src/api/web-api-client.ts',
      'ClientApp/src/parent/node_modules/**',
    ],
    'nmi/ignores',
  ),
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
    name: 'nmi/lint-governance',
  },
  {
    files: javascriptAndTypeScriptFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: { ecmaFeatures: { jsx: true } },
      sourceType: 'module',
    },
    name: 'nmi/base',
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-new-native-nonconstructor': 'error',
      'no-useless-assignment': 'error',
      'preserve-caught-error': 'error',
    },
  },
  {
    extends: [reactRefresh.configs.vite()],
    files: appJsxFiles,
    ignores: devOnlyStorybookFiles,
    name: 'nmi/react-refresh',
  },
  {
    extends: [js.configs.recommended],
    files: javascriptAndTypeScriptFiles,
    name: 'nmi/javascript-recommended',
  },
  {
    extends: [sonarjs.configs.recommended],
    files: javascriptAndTypeScriptFiles,
    name: 'nmi/sonarjs-recommended',
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: typescriptFiles,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '.claude/skills/typescript-expert/scripts/tests/utility-types.test.ts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    name: 'nmi/typescript',
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      // Upstream rule currently overflows on FormikForm/index.tsx.
      '@typescript-eslint/no-unsafe-class-instance-assignment': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowAny: false,
          allowBoolean: false,
          allowNever: false,
          allowNullish: false,
          allowNumber: true,
          allowRegExp: false,
        },
      ],
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['tests/unit/helpers/typedPartialMockTypes.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { disallowTypeAnnotations: false, prefer: 'type-imports' },
      ],
    },
  },
  pluginSecurity.configs.recommended,
  {
    files: reviewedFilesystemBoundaryFiles,
    name: 'nmi/reviewed-filesystem-boundaries',
    rules: { 'security/detect-non-literal-fs-filename': 'off' },
  },
  {
    files: browserFiles,
    ignores: serviceWorkerFiles,
    languageOptions: { globals: { ...globals.browser } },
    name: 'nmi/browser-globals',
  },
  {
    files: nodeFiles,
    languageOptions: { globals: { ...globals.nodeBuiltin } },
    name: 'nmi/node-esm-globals',
  },
  {
    files: nodeToolFiles,
    name: 'nmi/node-tool-console',
    rules: { 'no-console': ['error', { allow: ['log', 'warn', 'error'] }] },
  },
  {
    files: mixedTestFiles,
    languageOptions: {
      globals: { ...globals.browser, ...globals.nodeBuiltin },
    },
    name: 'nmi/mixed-test-globals',
  },
  {
    files: serviceWorkerFiles,
    languageOptions: { globals: { ...globals.serviceworker } },
    name: 'nmi/service-worker-globals',
  },
  {
    extends: [eslintReact.configs['strict-type-checked']],
    files: reactTypeScriptFiles,
    settings: {
      'react-x': {
        version: '18.3.1',
      },
    },
    name: 'nmi/react-typescript',
    rules: { '@eslint-react/dom-no-unknown-property': ['error'] },
  },
  {
    files: ['ClientApp/src/storybook/**/*.{ts,tsx}'],
    name: 'nmi/storybook-doc-helpers',
    rules: { '@eslint-react/no-array-index-key': 'off' },
  },
  {
    extends: [jsxA11yX.configs.recommended],
    files: jsxFiles,
    name: 'nmi/jsx-accessibility',
  },
  {
    extends: [storybook.configs['flat/recommended']],
    files: storyFiles,
    name: 'nmi/stories',
    rules: {
      'storybook/meta-satisfies-type': 'error',
      'storybook/csf-component': 'error',
      'storybook/no-uninstalled-addons': [
        'error',
        { packageJsonLocation: packageJsonPath },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              allowTypeImports: true,
              message: 'Use the Storybook test API for Storybook interactions.',
              name: 'vitest',
            },
          ],
        },
      ],
    },
  },
  {
    extends: [storybook.configs['flat/recommended']],
    files: storybookFiles,
    name: 'nmi/storybook-runner-boundaries',
    rules: {
      'no-restricted-imports': storybookTestImportRestriction,
      'storybook/no-uninstalled-addons': [
        'error',
        { packageJsonLocation: packageJsonPath },
      ],
    },
  },
  {
    files: vitestFiles,
    name: 'nmi/vitest-all',
    ...vitest.configs.all,
    settings: { vitest: { typecheck: true } },
  },
  {
    files: vitestFiles,
    name: 'nmi/vitest-globals',
    ...vitestGlobals.configs['flat/recommended'],
  },
  // The string vi.mock overload preserves partial-mock typing (TS2769).
  {
    files: vitestFiles,
    name: 'nmi/vitest-partial-mock-fix-safety',
    rules: { 'vitest/prefer-import-in-mock': 'off' },
  },
  {
    files: [
      'tests/unit/components/inputs/complexInputs.behavior.test.tsx',
      'tests/unit/config/authRedirectBridgePolicy.test.ts',
      'tests/unit/storybook/mswHandlers.test.ts',
    ],
    name: 'nmi/vitest-lifecycle-hook-exceptions',
    rules: {
      'vitest/no-duplicate-hooks': 'off',
      'vitest/no-hooks': 'off',
      'vitest/prefer-hooks-in-order': 'off',
    },
  },
  {
    files: [
      'tests/unit/components/inputs/combobox.accessibility.test.tsx',
      'tests/unit/components/inputs/complexInputs.behavior.test.tsx',
      'tests/unit/components/inputs/residualBranches.test.tsx',
    ],
    name: 'nmi/vitest-console-guard-registration',
    rules: { 'vitest/require-hook': 'off' },
  },
  {
    files: ['vitest.setup.ts', 'vitest.storybook.setup.ts'],
    name: 'nmi/vitest-setup-files',
    rules: {
      'no-restricted-globals': [
        'error',
        {
          message: "Prefer 'globalThis' in test setup files (SonarLint S7764).",
          name: 'window',
        },
      ],
      'vitest/require-hook': 'off',
    },
  },
  {
    files: ['vitest.storybook.setup.ts'],
    name: 'nmi/storybook-vitest-setup-hooks',
    rules: {
      'vitest/no-hooks': 'off',
      'vitest/require-top-level-describe': 'off',
    },
  },
  {
    files: playwrightFiles,
    name: 'nmi/playwright-runner-boundaries',
    rules: {
      'no-restricted-imports': playWrightImportRestriction,
      'vitest/prefer-importing-vitest-globals': 'off',
      'vitest/require-hook': 'off',
    },
  },
  {
    files: ['ClientApp/src/declarations.d.ts'],
    name: 'nmi/ambient-declarations',
    rules: { '@typescript-eslint/triple-slash-reference': 'off' },
  },
  // Oxfmt owns formatting; compatibility preset stays last.
  eslintConfigPrettier,
).map(stripDeprecatedRules);
