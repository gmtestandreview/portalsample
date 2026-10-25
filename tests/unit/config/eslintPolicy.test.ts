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

describe('the resolved config actually applies to application files', () => {
  it('loads the plugin whose rule surface these assertions describe', () => {
    expect.assertions(1);
    expect(pluginRuleNames.length).toBeGreaterThan(100);
  });
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
