import { readFileSync } from "node:fs";
import { gte, prerelease, valid } from "semver";
import { describe, expect, it } from "vitest";

type LockPackage = {
  version?: string;
};

type PackageLock = {
  lockfileVersion: number;
  packages: Record<string, LockPackage>;
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
