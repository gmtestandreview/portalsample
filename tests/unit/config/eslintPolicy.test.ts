import { ESLint } from 'eslint';

import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Policy characterization for the ESLint 10 flat config (Task D1).
 *
 * D1's rule-ownership decisions were recorded only as prose in the umbrella
 * plan, with no executable guard - the 2026-08-27 audit recorded that as
 * finding B1. This file is that guard. It asserts the *effective* config that
 * ESLint resolves for an application file, not the source of `eslint.config.mjs`,
 * so a preset upgrade that silently changes a severity fails here.
 *
 * Assertions are grounded in what `@eslint-react/eslint-plugin@5.18.6` actually
 * exports, measured rather than taken from the plan's prose. See the
 * "unsupported compatibility deltas" block for two rules the plan asserted exist
 * and which do not.
 */

const PROBE_FILE = 'ClientApp/src/App.tsx';

const LOAD_TIMEOUT_MS = 60_000;

let appRules: Record<string, unknown> = {};

let appPluginNames: string[] = [];

let pluginRuleNames: string[] = [];

/** ESLint severities: 0 off, 1 warn, 2 error. `absent` means no owner at all. */
type Severity = 0 | 1 | 2 | 'absent';

const severityOf = (ruleId: string): Severity => {
  const entry = Object.entries(appRules)
    .find(([name]) => name === ruleId)
    ?.at(1);

  if (entry === undefined) return 'absent';

  const raw = Array.isArray(entry) ? entry[0] : entry;

  return Number(raw) as 0 | 1 | 2;
};

const severityIn = (
  rules: Record<string, unknown> | undefined,
  ruleId: string,
): Severity => {
  const configured = rules?.[ruleId];

  if (configured === undefined) return 'absent';

  const raw = Array.isArray(configured) ? configured[0] : configured;

  return Number(raw) as 0 | 1 | 2;
};

const lintTextMessages = async (filePath: string, code: string) => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath });

  if (!result) {
    throw new Error(`ESLint returned no result for ${filePath}`);
  }

  return result.messages;
};

beforeAll(async () => {
  const eslint = new ESLint();
  const config = await eslint.calculateConfigForFile(PROBE_FILE);

  appRules = (config.rules ?? {}) as Record<string, unknown>;
  appPluginNames = Object.keys(config.plugins ?? {});

  const imported = (await import('@eslint-react/eslint-plugin')) as {
    default?: { rules?: Record<string, unknown> };
    rules?: Record<string, unknown>;
  };
  const plugin = imported.default ?? imported;

  pluginRuleNames = Object.keys(plugin.rules ?? {});
}, LOAD_TIMEOUT_MS);

describe('the resolved config actually applies to application files', () => {
  it('resolves a non-empty rule set for the probe file', () => {
    expect.assertions(1);
    expect(Object.keys(appRules).length).toBeGreaterThan(100);
  });
});

describe('runner-specific lint boundaries', () => {
  it('keeps Vitest rules out of Playwright E2E files and rejects Vitest imports', async () => {
    expect.assertions(3);

    const eslint = new ESLint();
    const config = await eslint.calculateConfigForFile(
      'tests/e2e/steps/account.steps.ts',
    );

    expect(
      severityIn(config.rules, 'vitest/prefer-importing-vitest-globals'),
    ).toBe(0);
    expect(severityIn(config.rules, 'vitest/require-hook')).toBe(0);
    expect(severityIn(config.rules, 'no-restricted-imports')).toBe(2);
  });

  it('rejects Vitest assertion imports from Storybook stories', async () => {
    expect.assertions(2);

    const eslint = new ESLint();
    const config = await eslint.calculateConfigForFile(
      'ClientApp/src/components/Accordion/Accordion.stories.tsx',
    );

    expect(severityIn(config.rules, 'no-restricted-imports')).toBe(2);
    expect(
      severityIn(config.rules, 'vitest/prefer-importing-vitest-globals'),
    ).toBe(0);
  });

  it(
    'reports a Vitest import in a Playwright E2E file',
    async () => {
      expect.assertions(1);

      const messages = await lintTextMessages(
        'tests/e2e/steps/account.steps.ts',
        "import { expect } from 'vitest';",
      );

      expect(
        messages.some(
          ({ ruleId, severity }) =>
            ruleId === 'no-restricted-imports' && severity === 2,
        ),
      ).toBe(true);
    },
    LOAD_TIMEOUT_MS,
  );

  it(
    'reports a Vitest assertion import in a Storybook story',
    async () => {
      expect.assertions(1);

      const messages = await lintTextMessages(
        'ClientApp/src/components/Accordion/Accordion.stories.tsx',
        "import { expect } from 'vitest';",
      );

      expect(
        messages.some(
          ({ ruleId, severity }) =>
            ruleId === 'no-restricted-imports' && severity === 2,
        ),
      ).toBe(true);
    },
    LOAD_TIMEOUT_MS,
  );
});

describe('the resolved config actually applies to application files', () => {
  it('loads the plugin whose rule surface these assertions describe', () => {
    expect.assertions(1);
    expect(pluginRuleNames.length).toBeGreaterThan(100);
  });
});

describe('the resolved config actually applies to application files', () => {
  it(
    'does not auto-fix partial Vitest mock module specifiers',
    async () => {
      expect.assertions(2);

      const eslint = new ESLint({ fix: true });
      const source =
        "import { vi } from 'vitest';\nvi.mock('partial-module', () => ({}));\n";
      const [result] = await eslint.lintText(source, {
        filePath: 'tests/unit/config/eslintPolicy.test.ts',
      });

      if (result === undefined) {
        throw new Error('ESLint returned no result for the policy probe');
      }

      expect(result.output).toBeUndefined();
      expect(result.messages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            ruleId: 'vitest/prefer-import-in-mock',
            severity: 1,
          }),
        ]),
      );
    },
    LOAD_TIMEOUT_MS,
  );
});

describe('the resolved config actually applies to application files', () => {
  it('loads jsx-a11y-x and enables its recommended rules', () => {
    expect.assertions(2);
    expect(appPluginNames).toContain('jsx-a11y-x');
    expect(severityOf('jsx-a11y-x/alt-text')).toBe(2);
  });
});

describe('the resolved config actually applies to application files', () => {
  it('resolves a non-empty rule set for the Vite TypeScript config', async () => {
    expect.assertions(1);

    const eslint = new ESLint();
    const config = await eslint.calculateConfigForFile('vite.config.mts');

    expect(Object.keys(config.rules ?? {}).length).toBeGreaterThan(100);
  });
});
