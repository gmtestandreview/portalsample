import { readFileSync } from "node:fs";
import { gte, prerelease, valid } from "semver";
import { describe, expect, it } from "vitest";

type LockPackage = {
  version?: string;
};

type PackageLock = {
  lockfileVersion: number;
  packages: Record<string, LockPackage & { deprecated?: string }>;
};

type RootPackage = {
  devDependencies?: Record<string, string>;
};

const lock = JSON.parse(
  readFileSync("package-lock.json", "utf8"),
) as PackageLock;
const rootPackage = JSON.parse(
  readFileSync("package.json", "utf8"),
) as RootPackage;

const installedVersions = (packageName: string): string[] =>
  Object.entries(lock.packages)
    .filter(
      ([packagePath, metadata]) =>
        packagePath.split("node_modules/").at(-1) === packageName &&
        metadata.version !== undefined,
    )
    .map(([, metadata]) => metadata.version!);

const exactDevDependency = (packageName: string): string => {
  const declaredVersion = rootPackage.devDependencies?.[packageName];

  if (
    declaredVersion === undefined ||
    valid(declaredVersion) !== declaredVersion ||
    prerelease(declaredVersion) !== null
  ) {
    throw new Error(
      `${packageName} must be an exact stable devDependency version`,
    );
  }

  return declaredVersion;
};

const expectStableAtLeast = (
  packageName: string,
  version: string,
  minimumVersion: string,
): void => {
  expect(valid(version), `${packageName}@${version} must be valid semver`).toBe(
    version,
  );
  expect(
    prerelease(version),
    `${packageName}@${version} must not be a prerelease`,
  ).toBeNull();
  expect(
    gte(version, minimumVersion),
    `${packageName}@${version} must be at least ${minimumVersion}`,
  ).toBe(true);
};

describe("direct security dependency floors", () => {
  const minimumVersions = new Map([
    ["@vitest/browser", "4.1.10"],
    ["@vitest/browser-playwright", "4.1.10"],
    ["@vitest/coverage-v8", "4.1.10"],
    ["vitest", "4.1.10"],
    ["react-router", "7.18.2"],
    ["dompurify", "3.4.13"],
  ]);

  it.each([...minimumVersions])(
    "%s resolves only patched versions",
    (packageName, minimumVersion) => {
      const versions = installedVersions(packageName);

      expect(versions).not.toHaveLength(0);
      for (const version of versions) {
        expectStableAtLeast(packageName, version, minimumVersion);
      }
    },
  );

  it("keeps the exact-peer Vitest packages on one version", () => {
    const vitestPackages = [
      "@vitest/browser",
      "@vitest/browser-playwright",
      "@vitest/coverage-v8",
      "vitest",
    ];
    const expectedVersion = exactDevDependency("vitest");

    for (const packageName of vitestPackages) {
      expect(exactDevDependency(packageName)).toBe(expectedVersion);
      expect(new Set(installedVersions(packageName))).toEqual(
        new Set([expectedVersion]),
      );
    }
  });
});

describe("transitive security dependency floors", () => {
  const minimumVersions = new Map([
    ["nanoid", "3.3.18"],
    ["postcss", "8.5.23"],
    ["fast-uri", "3.1.5"],
    ["js-yaml", "4.3.1"],
    ["valibot", "1.4.2"],
    ["undici", "7.29.0"],
    ["body-parser", "1.20.6"],
  ]);

  it.each([...minimumVersions])(
    "%s resolves only patched versions",
    (packageName, minimumVersion) => {
      const versions = installedVersions(packageName);

      expect(versions).not.toHaveLength(0);
      for (const version of versions) {
        expectStableAtLeast(packageName, version, minimumVersion);
      }
    },
  );

  it("keeps every glob major on a maintained release", () => {
    // Glob 7 arrives only through the deprecated ESLint 8 / rimraf 3 chain.
    for (const version of installedVersions("glob")) {
      expect(
        gte(version, "10.0.0"),
        `glob@${version} is a deprecated pre-10 release`,
      ).toBe(true);
    }
  });

  it("keeps every brace-expansion major on its maintained patched release", () => {
    const isPatched = (version: string): boolean => {
      const major = Number(version.split(".")[0]);

      if (valid(version) !== version || prerelease(version) !== null)
        return false;
      if (major === 1) return gte(version, "1.1.18");
      if (major === 2) return gte(version, "2.1.4");
      if (major === 3) return gte(version, "3.0.6");
      if (major === 4) return false;
      return major > 5 || gte(version, "5.0.9");
    };

    const versions = installedVersions("brace-expansion");

    expect(versions).not.toHaveLength(0);
    for (const version of versions) {
      expect(
        isPatched(version),
        `brace-expansion@${version} is vulnerable`,
      ).toBe(true);
    }
  });
});

describe("lint cohort", () => {
  const cohort = new Map([
    ["eslint", "10.9.0"],
    ["@eslint/js", "10.0.1"],
    ["typescript-eslint", "8.67.0"],
    ["@eslint-react/eslint-plugin", "5.18.6"],
    ["eslint-plugin-react-hooks", "7.1.1"],
    ["@stylistic/eslint-plugin", "5.10.0"],
    ["globals", "17.11.0"],
  ]);

  it.each([...cohort])(
    "declares %s as an exact supported version",
    (packageName, expectedVersion) => {
      expect(exactDevDependency(packageName)).toBe(expectedVersion);
      expect(installedVersions(packageName)).toContain(expectedVersion);
    },
  );

  it("resolves ESLint only on the maintained 10 line", () => {
    const versions = installedVersions("eslint");

    expect(versions).not.toHaveLength(0);
    for (const version of versions) {
      expect(
        gte(version, "10.0.0"),
        `eslint@${version} is an unsupported pre-10 release`,
      ).toBe(true);
    }
  });

  it.each([
    "eslint-plugin-react",
    "@humanwhocodes/config-array",
    "@humanwhocodes/object-schema",
    "inflight",
    "rimraf",
  ])("no longer installs the deprecated package %s", (packageName) => {
    expect(installedVersions(packageName)).toHaveLength(0);
  });

  it("retains the Storybook lint plugin alongside the new cohort", () => {
    expect(installedVersions("eslint-plugin-storybook")).not.toHaveLength(0);
  });
});

describe("publisher deprecations", () => {
  const deprecatedEntries = Object.entries(lock.packages)
    .filter(([, metadata]) => Boolean(metadata.deprecated))
    .map(([packagePath]) => packagePath);

  /**
   * Task D1 removes the ESLint 8 chain. Three glob@10 copies owned by
   * remark-cli/unified-engine survive until Task D2 adds the scoped overrides,
   * so they are the only tolerated remainder and are named exactly.
   */
  const allowedRemainingDeprecations = [
    "node_modules/@npmcli/map-workspaces/node_modules/glob",
    "node_modules/@npmcli/package-json/node_modules/glob",
    "node_modules/unified-engine/node_modules/glob",
  ];

  it("leaves no deprecated package outside the recorded transitional set", () => {
    expect([...deprecatedEntries].sort()).toEqual(
      [...allowedRemainingDeprecations].sort(),
    );
  });
});
