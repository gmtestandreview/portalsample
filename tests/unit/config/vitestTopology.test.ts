import type { ViteUserConfig } from "vitest/config";
import { describe, expect, it } from "vitest";

import rootConfig from "../../../vitest.config";
import storybookConfig from "../../../vitest.storybook.config";
import unitConfig from "../../../vitest.unit.config";

/**
 * Characterization of the committed Vitest topology (fix `0d16927`).
 *
 * Vitest 4 ignores a nested `test.projects` container when that config is itself
 * referenced as a root project, which previously caused unit files to be
 * discovered a second time without jsdom. The root config is composition only;
 * each leaf owns its own environment, coverage, browser and worker settings.
 *
 * A failure here means the committed topology drifted — investigate before
 * editing any Vitest configuration.
 */

type TestOptions = NonNullable<ViteUserConfig["test"]>;

const testOptions = (config: ViteUserConfig, label: string): TestOptions => {
  const options = config.test;

  if (options === undefined) {
    throw new Error(`${label} must declare a test block`);
  }

  return options;
};

const root = testOptions(rootConfig, "vitest.config.ts");
const storybook = testOptions(storybookConfig, "vitest.storybook.config.ts");
const unit = testOptions(unitConfig, "vitest.unit.config.ts");

/** Paths that belong to Playwright, never to a Vitest leaf. */
const foreignTestPaths = [
  ".github/migration-verifier/tests/runtime/checklist.runtime.spec.ts",
  "tests/e2e/example.feature",
  "tests/e2e/steps/example.steps.ts",
];

describe("root Vitest config is composition only", () => {
  it("declares exactly the two leaf projects in order", () => {
    expect(root.projects).toEqual([
      "./vitest.unit.config.ts",
      "./vitest.storybook.config.ts",
    ]);
  });

  it("does not own a worker cap that would starve the browser pool", () => {
    expect(root.maxWorkers).toBeUndefined();
  });

  it("does not own leaf-specific environment, coverage or browser settings", () => {
    expect(root.environment).toBeUndefined();
    expect(root.coverage).toBeUndefined();
    expect(root.browser).toBeUndefined();
    expect(root.setupFiles).toBeUndefined();
  });
});

describe("Storybook leaf is a directly runnable Browser Mode project", () => {
  it("is a leaf rather than another nested project container", () => {
    expect(storybook.projects).toBeUndefined();
  });

  it("owns Chromium Browser Mode", () => {
    expect(storybook.browser?.enabled).toBe(true);
    expect(storybook.browser?.headless).toBe(true);
    expect(storybook.browser?.instances).toEqual([{ browser: "chromium" }]);
  });

  it("limits the persistent MCP runner to one browser orchestrator", () => {
    expect(storybook.maxWorkers).toBe(1);
  });

  it("owns its own name and setup file", () => {
    expect(storybook.name).toBe("storybook");
    expect(storybook.setupFiles).toEqual(["./vitest.storybook.setup.ts"]);
  });

  it("does not own unit coverage", () => {
    expect(storybook.coverage).toBeUndefined();
  });
});

describe("unit leaf owns jsdom, unit discovery and unit coverage", () => {
  it("runs in jsdom", () => {
    expect(unit.environment).toBe("jsdom");
  });

  it("discovers only unit test files", () => {
    expect(unit.include).toEqual(["tests/unit/**/*.test.{ts,tsx}"]);
  });

  it("owns the worker cap rather than inheriting one from the root", () => {
    expect(unit.maxWorkers).toBe(1);
  });

  it("owns unit coverage reporting", () => {
    expect(unit.coverage?.reportsDirectory).toBe("./reports/coverage/unit");
  });

  it("does not enable Browser Mode", () => {
    expect(unit.browser?.enabled).toBeUndefined();
  });
});

describe("Playwright files stay out of both Vitest leaves", () => {
  it.each(foreignTestPaths)("does not discover %s", (foreignPath) => {
    for (const pattern of unit.include ?? []) {
      expect(
        foreignPath.startsWith(pattern.split("*")[0]),
        `unit include "${pattern}" must not reach ${foreignPath}`,
      ).toBe(false);
    }
  });

  it("leaves Storybook discovery to the storybookTest plugin", () => {
    expect(unit.include).not.toContain("**/*.stories.tsx");
    expect(storybook.include).toBeUndefined();
  });
});
