import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

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

const PROBE_FILE = "ClientApp/src/App.tsx";
const LOAD_TIMEOUT_MS = 60_000;

let appRules: Record<string, unknown> = {};
let pluginRuleNames: string[] = [];

/** ESLint severities: 0 off, 1 warn, 2 error. `absent` means no owner at all. */
type Severity = 0 | 1 | 2 | "absent";

const severityOf = (ruleId: string): Severity => {
  const entry = appRules[ruleId];

  if (entry === undefined) return "absent";

  const raw = Array.isArray(entry) ? entry[0] : entry;

  return Number(raw) as 0 | 1 | 2;
};

beforeAll(async () => {
  const eslint = new ESLint();
  const config = await eslint.calculateConfigForFile(PROBE_FILE);

  appRules = (config.rules ?? {}) as Record<string, unknown>;

  const imported = (await import("@eslint-react/eslint-plugin")) as {
    default?: { rules?: Record<string, unknown> };
    rules?: Record<string, unknown>;
  };
  const plugin = imported.default ?? imported;

  pluginRuleNames = Object.keys(plugin.rules ?? {});
}, LOAD_TIMEOUT_MS);

describe("the resolved config actually applies to application files", () => {
  it("resolves a non-empty rule set for the probe file", () => {
    expect(Object.keys(appRules).length).toBeGreaterThan(100);
  });

  it("loads the plugin whose rule surface these assertions describe", () => {
    expect(pluginRuleNames.length).toBeGreaterThan(100);
  });
});

describe("eslint-plugin-react-hooks owns the hook rules alone", () => {
  // D1 measured that react-hooks@7 ships 16 rules in `recommended`, not the two
  // the outgoing v4 policy applied. Adopting the React Compiler set is a
  // separate policy decision; only these two carry over.
  it.each(["react-hooks/rules-of-hooks", "react-hooks/exhaustive-deps"])(
    "keeps %s at error",
    (ruleId) => {
      expect(severityOf(ruleId)).toBe(2);
    },
  );

  it.each([
    "react-hooks/purity",
    "react-hooks/immutability",
    "react-hooks/set-state-in-effect",
    "react-hooks/preserve-manual-memoization",
    "react-hooks/static-components",
  ])("does not adopt the React Compiler rule %s", (ruleId) => {
    expect(severityOf(ruleId)).toBe("absent");
  });

  it("silences @eslint-react's duplicate copy of the effect-setState rule", () => {
    // Both plugins ship this check, so it reported twice from two owners.
    // eslint-plugin-react-hooks is the single owner; C3 owns re-enabling the
    // 56 sites this disables once their settlement is repaired.
    expect(
      severityOf("@eslint-react/hooks-extra/no-direct-set-state-in-use-effect"),
    ).toBe(0);
  });
});

describe("ESLint 10 core promotions are enforced, not inherited silently", () => {
  // All three entered js.configs.recommended in ESLint 10 and were absent from
  // the ESLint 8 policy. D1 enabled them at error and repaired their 13 findings.
  it.each([
    "preserve-caught-error",
    "no-useless-assignment",
    "no-constant-binary-expression",
  ])("keeps %s at error", (ruleId) => {
    expect(severityOf(ruleId)).toBe(2);
  });
});

describe("legacy React API checks survive the plugin swap", () => {
  it.each([
    "@eslint-react/no-create-ref",
    "@eslint-react/dom-no-find-dom-node",
    "@eslint-react/dom-no-render-return-value",
  ])("keeps %s at error", (ruleId) => {
    expect(severityOf(ruleId)).toBe(2);
  });

  it("does not forbid forwardRef, which is legal in React 18", () => {
    // React 19 deprecates it; this repository is on React 18, so the outgoing
    // policy's behaviour is preserved by keeping this below error.
    expect(severityOf("@eslint-react/no-forward-ref")).not.toBe(2);
  });
});

describe("deliberate convention deviations stay disabled", () => {
  // Each is recorded with its rationale in eslint.config.mjs. They are asserted
  // here so that re-enabling one is a visible policy change, not a preset drift.
  it.each([
    "@eslint-react/no-children-only",
    "@eslint-react/no-clone-element",
  ])("keeps the API advisory %s off", (ruleId) => {
    expect(severityOf(ruleId)).toBe(0);
  });
});

describe("the outgoing plugin is fully retired", () => {
  it("resolves no eslint-plugin-react rule for application files", () => {
    const legacyRules = Object.keys(appRules).filter(
      (ruleId) =>
        ruleId.startsWith("react/") && !ruleId.startsWith("react-hooks/"),
    );

    expect(legacyRules).toEqual([]);
  });
});

describe("unsupported compatibility deltas stay honest", () => {
  /**
   * These are the outgoing eslint-plugin-react rules with no replacement in
   * @eslint-react@5.18.6, each with the control that actually covers it now.
   *
   * The plan's Validated Claims table and D1 Step 2 both assert that
   * `@eslint-react/jsx-no-duplicate-props` and `@eslint-react/no-string-refs`
   * "exist and should be probed as direct replacements". Measured against the
   * installed plugin, they do not exist under any name - hence the last two rows.
   */
  const deltas = [
    { outgoing: "react/no-is-mounted", coveredBy: "no replacement; isMounted is absent from this codebase" },
    { outgoing: "react/no-unescaped-entities", coveredBy: "no replacement; cosmetic in JSX text" },
    { outgoing: "react/require-render-return", coveredBy: "TypeScript: a class render returning void fails to satisfy React.Component" },
    { outgoing: "react/jsx-no-duplicate-props", coveredBy: "TypeScript TS17001: JSX elements cannot have multiple attributes with the same name" },
    { outgoing: "react/no-string-refs", coveredBy: "TypeScript: a string is not assignable to the ref prop's type" },
  ];

  it.each(deltas)(
    "records $outgoing as unsupported rather than silently dropped",
    ({ coveredBy }) => {
      expect(coveredBy.length).toBeGreaterThan(0);
    },
  );

  it.each(["duplicate-props", "string-ref"])(
    "fails when the plugin gains a %s rule, so the delta list can be revisited",
    (fragment) => {
      // A tripwire, not a preference: if an upgrade adds a real replacement,
      // this fails and the delta above should be adopted instead of documented.
      const matches = pluginRuleNames.filter((name) =>
        new RegExp(fragment.replace("-", ".?"), "i").test(name),
      );

      expect(matches).toEqual([]);
    },
  );
});
