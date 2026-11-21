import { ESLint } from 'eslint';

import { describe, expect, it } from 'vitest';

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

/** ESLint severities: 0 off, 1 warn, 2 error. `absent` means no owner at all. */
type Severity = 0 | 1 | 2 | 'absent';

interface ResolvedLintConfig {
  rules?: Record<string, unknown>;
  plugins?: Record<string, unknown>;
}

const calculateConfig = async (
  filePath: string,
): Promise<ResolvedLintConfig> => {
  const eslint = new ESLint();
  const rawConfig = (await eslint.calculateConfigForFile(filePath)) as unknown;
  return rawConfig as ResolvedLintConfig;
};

const isRuleOptions = (
  value: unknown,
): value is readonly [unknown, ...unknown[]] => Array.isArray(value);

const severityOf = (
  rules: Record<string, unknown>,
  ruleId: string,
): Severity => {
  const entry = Object.entries(rules)
    .find(([name]) => name === ruleId)
    ?.at(1);

  if (entry === undefined) return 'absent';

  const raw = isRuleOptions(entry) ? entry[0] : entry;

  return Number(raw) as 0 | 1 | 2;
};

const severityIn = (
  rules: Record<string, unknown> | undefined,
  ruleId: string,
): Severity => {
  const configured =
    rules === undefined ? undefined : Reflect.get(rules, ruleId);

  if (configured === undefined) return 'absent';

  const raw = isRuleOptions(configured) ? configured[0] : configured;

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

const policyReady = (async () => {
  const config = await calculateConfig(PROBE_FILE);

  const imported = (await import('@eslint-react/eslint-plugin')) as {
    default?: { rules?: Record<string, unknown> };
    rules?: Record<string, unknown>;
  };
  const plugin = imported.default ?? imported;

  return {
    appRules: config.rules ?? {},
    appPluginNames: Object.keys(config.plugins ?? {}),
    pluginRuleNames: Object.keys(plugin.rules ?? {}),
  };
})();

const requireLintResult = <T>(value: T | undefined): T => {
  if (value === undefined) {
    throw new Error('ESLint returned no result for the policy probe');
  }
  return value;
};

describe('resolved application lint policy', () => {
  it('resolves a non-empty rule set for the probe file', async () => {
    expect.assertions(1);

    await policyReady;
    const policy = await policyReady;

    expect(Object.keys(policy.appRules).length).toBeGreaterThan(100);
  });
});

describe('runner-specific lint boundaries', () => {
  it('keeps Vitest rules out of Playwright E2E files and rejects Vitest imports', async () => {
    expect.assertions(3);

    const config = await calculateConfig('tests/e2e/steps/account.steps.ts');

    expect(
      severityIn(config.rules, 'vitest/prefer-importing-vitest-globals'),
    ).toBe(0);
    expect(severityIn(config.rules, 'vitest/require-hook')).toBe(0);
    expect(severityIn(config.rules, 'no-restricted-imports')).toBe(2);
  });

  it('rejects Vitest assertion imports from Storybook stories', async () => {
    expect.assertions(2);

    const config = await calculateConfig(
      'ClientApp/src/components/Accordion/Accordion.stories.tsx',
    );

    expect(severityIn(config.rules, 'no-restricted-imports')).toBe(2);
    expect(
      severityIn(config.rules, 'vitest/prefer-importing-vitest-globals'),
    ).toBe('absent');
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

describe('resolved plugin rule surface', () => {
  it('loads the plugin whose rule surface these assertions describe', async () => {
    expect.assertions(1);

    await policyReady;
    const policy = await policyReady;

    expect(policy.pluginRuleNames.length).toBeGreaterThan(100);
  });
});

describe('vitest policy autofix boundary', () => {
  it(
    'leaves partial Vitest mock module specifiers untouched and unflagged',
    async () => {
      expect.assertions(2);

      // `vitest/prefer-import-in-mock` is disabled for the test scope by
      // deliberate design (see the `nmi/vitest-partial-mock-fix-safety` block
      // in eslint.config.mjs): the string overload of vi.mock() is required so
      // the typed-partial-mock pattern type-checks under strict TS, and the
      // rule's autofix to vi.mock(import('...')) would select the typed
      // overload and break `npm run type-check` (TS2769). This guard asserts
      // the effective policy: the specifier is neither rewritten nor flagged.
      const eslint = new ESLint({ fix: true });
      const source =
        "import { vi } from 'vitest';\nvi.mock('partial-module', () => ({}));\n";
      const [result] = await eslint.lintText(source, {
        filePath: 'tests/unit/config/eslintPolicy.test.ts',
      });

      const policyResult = requireLintResult(result);

      expect(policyResult.output).toBeUndefined();
      expect(
        policyResult.messages.some(
          ({ ruleId }) => ruleId === 'vitest/prefer-import-in-mock',
        ),
      ).toBe(false);
    },
    LOAD_TIMEOUT_MS,
  );
});

describe('jsx accessibility policy', () => {
  it('loads jsx-a11y-x and enables its recommended rules', async () => {
    expect.assertions(2);

    await policyReady;
    const policy = await policyReady;

    expect(policy.appPluginNames).toContain('jsx-a11y-x');
    expect(severityOf(policy.appRules, 'jsx-a11y-x/alt-text')).toBe(2);
  });
});

describe('vite configuration lint policy', () => {
  it('resolves a non-empty rule set for the Vite TypeScript config', async () => {
    expect.assertions(1);

    const config = await calculateConfig('vite.config.mts');

    expect(Object.keys(config.rules ?? {}).length).toBeGreaterThan(100);
  });
});
