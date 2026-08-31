import { describe, expect, it } from "vitest";

import termsConfig from "../../../ClientApp/src/terms-config.json";
import { storybookCoverageConfig } from "../../../vitest.storybook.coverage";
import unitConfig from "../../../vitest.unit.config";

/**
 * Coverage denominator and remap policy for the unit leaf (Task A2).
 *
 * The reviewed `terms-config.json?import` parse/exclusion diagnostic is owned by
 * the Vitest 3 `coverage.all` option: it pulled every *executed* module into the
 * report, so a Vite-transformed JSON import reached the V8-to-istanbul remapper
 * and failed to parse as JavaScript. Vitest 4 removed the option, which is why
 * the diagnostic no longer reproduces — but the config still carries a type
 * escape asserting it, which misrepresents what the config actually does.
 *
 * These assertions protect the denominator in both directions: JSON and other
 * non-source assets must stay out, and handwritten runtime TS/TSX must stay in.
 */

const coverage = unitConfig.test?.coverage;
const storybookCoverage = storybookCoverageConfig;

if (coverage?.provider !== "v8") {
  throw new Error("vitest.unit.config.ts must declare V8 unit coverage");
}

/** Categories the reviewed policy allows to leave the denominator. */
const allowedExclusionCategories = [
  /\.d\.ts$/,
  /types\.ts$/,
  /Props\.ts$/,
  /\/api\/web-api-client\.ts$/,
  /\/external\/\*\*$/,
  /\/parent\/\*\*$/,
  /\/storybook\/\*\*$/,
  /\/components\/App\/\*\*$/,
  /\/components\/AriaComponents\/main\.tsx$/,
  /\/components\/reactaria_components\/\*\*$/,
  /source-map-http-downloads\/\*\*$/,
  /\*\.test\.\{ts,tsx\}$/,
  /\*\.spec\.\{ts,tsx\}$/,
  /\*\.stories\.\{ts,tsx\}$/,
  /\*\.docs\.mdx$/,
];

describe("unit coverage denominator", () => {
  it("measures handwritten runtime source and the webpack config", () => {
    expect(coverage.include).toEqual([
      "ClientApp/src/**/*.{ts,tsx}",
      "webpack.config.js",
    ]);
  });

  it("retains the 100% policy on all four metrics", () => {
    expect(coverage.thresholds).toMatchObject({
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    });
  });

  it("excludes only reviewed generated, vendor, story, declaration and type-only files", () => {
    for (const pattern of coverage.exclude ?? []) {
      expect(
        allowedExclusionCategories.some((category) => category.test(pattern)),
        `coverage exclude "${pattern}" is outside the reviewed policy — narrowing the denominator is not an acceptable way to reach 100%`,
      ).toBe(true);
    }
  });
});

describe("remap inputs", () => {
  it("loads the terms configuration as data", () => {
    expect(termsConfig).toEqual({ TermsVersion: "1" });
  });

  it("carries no removed Vitest 3 coverage.all option", () => {
    // `all` was removed in Vitest 4; asserting it through a type escape claims
    // behaviour the runtime does not provide and reintroduces the JSON remap
    // path if it is ever honoured again.
    expect(JSON.stringify(coverage)).not.toContain('"all":true');
    expect(coverage).not.toHaveProperty("all");
  });

  it("never admits JSON or other non-source assets to the denominator", () => {
    // terms-config.json is imported by AccountProvider.tsx and
    // TermsAndCondition/index.tsx, so it is an executed module. It must still
    // never be measured or remapped.
    for (const pattern of coverage.include ?? []) {
      expect(
        pattern.endsWith(".json") || pattern.includes(".json"),
        `coverage include "${pattern}" must not admit JSON assets`,
      ).toBe(false);
    }
  });

  it("reports through providers that do not require an all-files sweep", () => {
    expect(coverage.provider).toBe("v8");
    expect(coverage.reportsDirectory).toBe("./reports/coverage/unit");
  });

  it("limits Storybook coverage remapping to executable application source", () => {
    expect(storybookCoverage.provider).toBe("v8");
    expect(storybookCoverage.include).toEqual(["ClientApp/src/**/*.{ts,tsx}"]);
    expect(storybookCoverage.exclude).toEqual(expect.arrayContaining([
      "ClientApp/src/api/web-api-client.ts",
      "ClientApp/src/external/**",
      "ClientApp/src/storybook/**",
      "ClientApp/src/components/App/**",
      "ClientApp/src/components/AriaComponents/main.tsx",
      "ClientApp/src/components/reactaria_components/**",
      "ClientApp/src/**/*.stories.{ts,tsx}",
    ]));
  });

  // The Storybook/Vitest runtime bridge is proven in
  // tests/unit/config/storybookVitestContract.test.ts, which asserts both sides
  // of the dependency contract against the installed sources. The block that
  // stood here built a hand-rolled `{ config, init, standalone }` object, called
  // the plugin on it, and asserted the plugin did what the plugin does — it
  // could not fail if Storybook renamed the call site, moved to `standalone()`,
  // or stopped calling `configureVitest` at all.
});
