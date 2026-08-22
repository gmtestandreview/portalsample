# ESLint Linting Solution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working ESLint gate for the NMI portal React/TypeScript source without linting generated, vendor, or build artifacts.

**Architecture:** Use the existing ESLint 8 dependency family with a root `.eslintrc.cjs` configuration, because the project already has ESLint 8.57.1, `@typescript-eslint` v7, `eslint-plugin-react`, and `eslint-plugin-react-hooks` installed. Keep the first gate focused on handwritten app, test, Storybook, Webpack, and Vitest TypeScript/JavaScript files, while excluding generated NSwag API output and source-map/vendor mirrors.

**Tech Stack:** React 18, TypeScript 5.9, ESLint 8, `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, npm scripts.

---

## Current State

- `npm run lint` currently fails with `ESLint couldn't find a configuration file`.
- `package.json` already defines `"lint": "eslint \"ClientApp/src/**/*.{ts,tsx}\""`.
- `package.json` already includes `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react`, and `eslint-plugin-react-hooks`.
- `eslint-plugin-import` is not installed, but `ClientApp/src/env.ts` contains an existing `eslint-disable-next-line import/prefer-default-export` comment. The plan removes that obsolete disable rather than adding a dependency only to satisfy one legacy comment.
- `tsconfig.json` includes `ClientApp/src/**/*`, `.storybook/**/*`, and `tests/**/*`, and excludes `ClientApp/src/external`, `ClientApp/source-map-http-downloads`, `ClientApp/webpack`, `node_modules`, `dist`, and `storybook-static`.
- The editable source tree in this snapshot is `ClientApp/src`, not `static/js`.

## File Structure

- Create `.eslintrc.cjs`: root ESLint 8 configuration for JS, TS, TSX, React, hooks, tests, Storybook, and Node config files.
- Modify `package.json`: update `lint` to use all supported source/config/test files and add `lint:fix`.
- Modify `ClientApp/src/env.ts`: remove stale `eslint-disable-next-line import/prefer-default-export` because `eslint-plugin-import` will not be part of this first lint gate.
- Do not modify `ClientApp/src/api/web-api-client.ts`: generated NSwag/OpenAPI client; exclude from lint.
- Do not modify `ClientApp/src/external/**`, `ClientApp/source-map-http-downloads/**`, `ClientApp/webpack/**`, `dist/**`, `storybook-static/**`, `coverage/**`, `test-results/**`, or `playwright-report/**`: generated/vendor/tool-owned surfaces.

---

### Task 1: Capture The Current Failure

**Files:**
- Read: `package.json`
- Read: `tsconfig.json`
- Read: `ClientApp/src/env.ts`

- [ ] **Step 1: Run the existing lint script**

Run:

```bash
npm run lint
```

Expected: FAIL with:

```text
ESLint couldn't find a configuration file
```

- [ ] **Step 2: Confirm the configured source root**

Run:

```bash
npm run type-check
```

Expected: PASS or an existing unrelated TypeScript failure. If it fails, record the first TypeScript diagnostic before continuing; do not fix unrelated application code as part of ESLint setup.

- [ ] **Step 3: Confirm generated/vendor exclusions**

Run:

```bash
npx eslint --print-config ClientApp/src/index.tsx
```

Expected: FAIL with missing config. This command will pass after Task 2 and proves ESLint can resolve config for a normal source file.

- [ ] **Step 4: Commit nothing**

No files change in this task.

---

### Task 2: Add Root ESLint Configuration

**Files:**
- Create: `.eslintrc.cjs`

- [ ] **Step 1: Create `.eslintrc.cjs`**

Add this complete file:

```js
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
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
    ],
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
            files: ['ClientApp/src/declarations.d.ts'],
            rules: {
                '@typescript-eslint/triple-slash-reference': 'off',
            },
        },
    ],
};
```

- [ ] **Step 2: Verify config resolution for a React entrypoint**

Run:

```bash
npx eslint --print-config ClientApp/src/index.tsx
```

Expected: PASS and output JSON containing:

```json
"react/jsx-uses-react": [
  0
]
```

- [ ] **Step 3: Verify generated API client is ignored**

Run:

```bash
npx eslint ClientApp/src/api/web-api-client.ts
```

Expected: PASS with no lint findings, or a warning that the file is ignored. If ESLint reports actual rule violations from this file, the ignore pattern is wrong and must be fixed before continuing.

- [ ] **Step 4: Commit**

Run:

```bash
git add .eslintrc.cjs
git commit -m "chore: add eslint configuration"
```

---

### Task 3: Update Lint Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace the `lint` script and add `lint:fix`**

In `package.json`, change only the script block entries shown here:

```json
"lint": "eslint \"ClientApp/src/**/*.{ts,tsx}\" \".storybook/**/*.{ts,tsx,js,jsx}\" \"tests/**/*.{ts,tsx}\" \"*.config.{ts,js}\" \"vitest*.{ts,js}\"",
"lint:fix": "npm run lint -- --fix",
```

Keep every other script unchanged.

- [ ] **Step 2: Confirm JSON validity**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('package.json ok')"
```

Expected:

```text
package.json ok
```

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: ESLint runs and reports source findings if any remain. It must not fail with "couldn't find a configuration file" and must not lint `ClientApp/src/api/web-api-client.ts`.

- [ ] **Step 4: Commit**

Run:

```bash
git add package.json package-lock.json
git commit -m "chore: wire eslint scripts"
```

If `package-lock.json` is unchanged, omit it from `git add`.

---

### Task 4: Remove Obsolete ESLint Disable Comment

**Files:**
- Modify: `ClientApp/src/env.ts`

- [ ] **Step 1: Remove the unused import-rule suppression**

Find this line near the bottom of `ClientApp/src/env.ts`:

```ts
// eslint-disable-next-line import/prefer-default-export
```

Delete only that line. Leave the next export intact:

```ts
export const env = loadEnv();
```

- [ ] **Step 2: Verify the import plugin rule is no longer referenced**

Run:

```bash
rg "import/prefer-default-export" ClientApp/src
```

Expected: no output and exit code 1.

- [ ] **Step 3: Run lint on the edited file**

Run:

```bash
npx eslint ClientApp/src/env.ts
```

Expected: PASS or only warnings from rules intentionally configured as warnings.

- [ ] **Step 4: Commit**

Run:

```bash
git add ClientApp/src/env.ts
git commit -m "chore: remove stale eslint suppression"
```

---

### Task 5: Baseline And Fix First-Run Findings

**Files:**
- Modify: only handwritten files reported by ESLint under `ClientApp/src/**`, `.storybook/**`, `tests/**`, `*.config.ts`, `*.config.js`, or `vitest*.ts`
- Do not modify: `ClientApp/src/api/web-api-client.ts`
- Do not modify: generated/vendor/tool-owned directories listed in the File Structure section

- [ ] **Step 1: Run the full lint gate**

Run:

```bash
npm run lint
```

Expected: PASS or actionable findings. Treat errors as required fixes. Treat warnings as a migration backlog unless they are one-line safe fixes.

- [ ] **Step 2: Apply automatic fixes**

Run:

```bash
npm run lint:fix
```

Expected: ESLint rewrites only files in the lint scope. Review every changed file before committing.

- [ ] **Step 3: Review automatic changes**

Run:

```bash
git diff -- ClientApp/src .storybook tests package.json package-lock.json .eslintrc.cjs webpack.config.js vitest.config.ts vitest.unit.config.ts vitest.storybook.config.ts playwright.config.ts
```

Expected: changes are limited to formatting/import cleanup produced by ESLint. If a generated/vendor file appears in the diff, revert only that generated/vendor file and tighten `ignorePatterns`.

- [ ] **Step 4: Manually fix remaining errors**

Use these patterns for common first-run findings:

For unused callback parameters, rename the parameter with a leading underscore:

```ts
const handleError = (_error: unknown) => {
    setHasError(true);
};
```

For values used only as types, convert to type-only imports:

```ts
import type { ReactNode } from 'react';
```

For console statements that are not deliberate runtime error reporting, replace with the existing app logger where available:

```ts
import { appLogger } from './instrumentation/AppLogger';

appLogger.warn('Message visible in diagnostics');
```

For deliberate runtime error reporting in `ClientApp/src/env.ts`, keep:

```ts
console.error(`[env] Missing required runtime variable: ${key}`);
```

This is allowed by the configured `no-console` rule.

- [ ] **Step 5: Re-run lint**

Run:

```bash
npm run lint
```

Expected: PASS, or only warnings accepted for the initial rollout. If warnings remain, save the output to `docs/eslint-baseline.md` in Task 6.

- [ ] **Step 6: Run type-check**

Run:

```bash
npm run type-check
```

Expected: PASS. If it fails because of a lint-driven code change, fix that change. If it fails from a pre-existing issue, record the first diagnostic in the final handoff and do not hide it.

- [ ] **Step 7: Commit**

Run:

```bash
git add ClientApp/src .storybook tests webpack.config.js vitest.config.ts vitest.unit.config.ts vitest.storybook.config.ts playwright.config.ts
git commit -m "chore: fix eslint baseline findings"
```

If only a subset changed, add only the changed files.

---

### Task 6: Document The Lint Gate

**Files:**
- Create if warnings remain: `docs/eslint-baseline.md`
- Modify if present and appropriate: `README.md`
- Otherwise modify: `AGENTS.md`

- [ ] **Step 1: Create a warning baseline only if warnings remain**

If `npm run lint` passes with no warnings, skip this step.

If warnings remain, create `docs/eslint-baseline.md`:

```markdown
# ESLint Baseline

ESLint was introduced on 2026-06-05 for the NMI portal source snapshot.

## Current Accepted Warnings

Run:

```bash
npm run lint
```

Warnings accepted at rollout:

```text
PASTE THE EXACT WARNING OUTPUT FROM THE FINAL LINT RUN HERE
```

## Cleanup Rule

Do not add new warnings. When editing a file listed in this baseline, reduce or remove warnings in that file as part of the same change.
```

Replace `PASTE THE EXACT WARNING OUTPUT FROM THE FINAL LINT RUN HERE` with the actual warning lines from the final lint run before committing. If this file is created, it must contain concrete output.

- [ ] **Step 2: Document commands in the main repo instructions**

If `README.md` exists, add this section to it. If `README.md` does not exist, add it under the validation guidance in `AGENTS.md`:

```markdown
### ESLint

Run ESLint from the repository root:

```bash
npm run lint
```

Apply safe automatic fixes:

```bash
npm run lint:fix
```

The lint gate covers handwritten React/TypeScript app source, Storybook/test files, and root config files. Generated NSwag API output, vendor mirrors, build output, and source-map capture directories are excluded.
```

- [ ] **Step 3: Run markdown-safe validation**

Run:

```bash
npm run lint
npm run type-check
```

Expected: `npm run lint` PASS or accepted warnings documented in `docs/eslint-baseline.md`; `npm run type-check` PASS or a clearly recorded pre-existing failure.

- [ ] **Step 4: Commit**

Run:

```bash
git add README.md AGENTS.md docs/eslint-baseline.md
git commit -m "docs: document eslint workflow"
```

Only add files that exist and changed.

---

### Task 7: Final Verification

**Files:**
- Read: `.eslintrc.cjs`
- Read: `package.json`
- Read: `ClientApp/src/env.ts`
- Read if created: `docs/eslint-baseline.md`

- [ ] **Step 1: Run the required quality gates**

Run:

```bash
npm run lint
npm run type-check
npm run test:unit
```

Expected:

```text
npm run lint: PASS, or PASS with documented accepted warnings
npm run type-check: PASS
npm run test:unit: PASS
```

- [ ] **Step 2: Confirm generated/vendor files were not edited**

Run:

```bash
git diff --name-only HEAD~5..HEAD
```

Expected: no paths under:

```text
ClientApp/src/api/web-api-client.ts
ClientApp/src/external/
ClientApp/source-map-http-downloads/
ClientApp/webpack/
dist/
storybook-static/
```

If any generated/vendor path appears, inspect why. Revert generated/vendor edits unless they were explicitly required and documented.

- [ ] **Step 3: Confirm final lint failure mode is gone**

Run:

```bash
npm run lint
```

Expected: output does not contain:

```text
ESLint couldn't find a configuration file
```

- [ ] **Step 4: Final commit if verification changed files**

Run:

```bash
git status --short
```

Expected: clean working tree. If verification updated snapshots or docs intentionally, commit them with:

```bash
git add <changed-files>
git commit -m "chore: verify eslint rollout"
```

## Self-Review

- Spec coverage: The plan installs no unnecessary lint framework because ESLint packages already exist; it creates the missing config, updates scripts, handles the existing stale disable comment, excludes generated/vendor code, and defines verification.
- Placeholder scan: No implementation task contains `TBD`, generic "handle edge cases", or undefined code references. The only copy/paste instruction is guarded so the created file must contain exact lint output before commit.
- Type consistency: All commands use this repository's actual paths: `ClientApp/src`, `.storybook`, `tests`, root config files, and `tsconfig.json`.
