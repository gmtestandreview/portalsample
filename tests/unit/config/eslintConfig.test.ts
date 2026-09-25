import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * `storybook/no-uninstalled-addons` resolves `package.json` relative to the
 * working directory. Editors run ESLint from the directory of the file being
 * linted, so an editor linting `.storybook/main.ts` makes the rule look for
 * `.storybook/package.json`, which does not exist, and ESLint crashes with a
 * rule error rather than reporting a lint result.
 *
 * `eslint.config.mjs` pins `packageJsonLocation` to an absolute path derived
 * from `import.meta.url`. This test proves that from the failure direction:
 * without the pin, this exact invocation exits 2.
 *
 * It spawns a real ESLint process because the defect is a working-directory
 * behaviour that an in-process API call cannot reproduce. That makes it slow,
 * so both the child process and the test carry explicit timeouts — without
 * them it is killed by the default 5s test timeout when the unit partition
 * runs it alongside 120 other files.
 */

const CHILD_TIMEOUT_MS = 45_000;
const TEST_TIMEOUT_MS = 60_000;

describe('ESLint editor integration', () => {
    it(
        'lints the Storybook config when ESLint runs from the file directory',
        () => {
            const storybookDirectory = path.resolve('.storybook');
            const eslintEntryPoint = path.resolve(
                'node_modules/eslint/bin/eslint.js',
            );

            const result = spawnSync(
                process.execPath,
                [eslintEntryPoint, 'main.ts'],
                {
                    cwd: storybookDirectory,
                    encoding: 'utf8',
                    timeout: CHILD_TIMEOUT_MS,
                },
            );

            expect(
                result.error,
                `ESLint could not be spawned: ${result.error?.message}`,
            ).toBeUndefined();
            expect(
                result.status,
                `ESLint exited ${result.status}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
            ).toBe(0);
        },
        TEST_TIMEOUT_MS,
    );
});
