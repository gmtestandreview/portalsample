import { readFileSync } from 'node:fs';

import { gte, prerelease, valid } from 'semver';

import { describe, expect, it } from 'vitest';

type LockPackage = {
  version?: string;
};

type PackageLock = {
  lockfileVersion: number;
  packages: Record<string, LockPackage & { deprecated?: string }>;
};

type RootPackage = {
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string | Record<string, string>>;
};

const lock = JSON.parse(
  readFileSync('package-lock.json', 'utf8'),
) as PackageLock;

const rootPackage = JSON.parse(
  readFileSync('package.json', 'utf8'),
) as RootPackage;

const recordValue = <Value>(
  record: Record<string, Value> | undefined,
  key: string,
): Value | undefined =>
  (
    Object.entries(record ?? {}).find(([entryKey]) => entryKey === key) as
      [string, Value] | undefined
  )?.[1];

const installedVersions = (packageName: string): string[] =>
  Object.entries(lock.packages)
    .filter(
      ([packagePath, metadata]) =>
        packagePath.split('node_modules/').at(-1) === packageName &&
        metadata.version !== undefined,
    )
    .map(([, metadata]) => metadata.version!);

const exactDevDependency = (packageName: string): string => {
  const declaredVersion = recordValue(rootPackage.devDependencies, packageName);

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
  if (valid(version) !== version) {
    throw new Error(`${packageName}@${version} must be valid semver`);
  }
  if (prerelease(version) !== null) {
    throw new Error(`${packageName}@${version} must not be a prerelease`);
  }
  if (!gte(version, minimumVersion)) {
    throw new Error(
      `${packageName}@${version} must be at least ${minimumVersion}`,
    );
  }
};

describe('direct security dependency floors', () => {
  const minimumVersions = new Map([
    ['@vitest/browser', '4.1.10'],
    ['@vitest/browser-playwright', '4.1.10'],
    ['@vitest/coverage-v8', '4.1.10'],
    ['vitest', '4.1.10'],
    ['react-router', '7.18.2'],
    ['dompurify', '3.4.13'],
  ]);
  it.each([...minimumVersions])(
    '%s resolves only patched versions',
    (packageName, minimumVersion) => {
      expect.assertions(1);
      const versions = installedVersions(packageName);

      expect(versions).not.toHaveLength(0);

      for (const version of versions) {
        expectStableAtLeast(packageName, version, minimumVersion);
      }
    },
  );
});

describe('direct security dependency floors', () => {
  it('keeps the exact-peer Vitest packages on one version', () => {
    expect.assertions(8);
    const vitestPackages = [
      '@vitest/browser',
      '@vitest/browser-playwright',
      '@vitest/coverage-v8',
      'vitest',
    ];
    const expectedVersion = exactDevDependency('vitest');

    for (const packageName of vitestPackages) {
      expect(exactDevDependency(packageName)).toBe(expectedVersion);
      expect(new Set(installedVersions(packageName))).toEqual(
        new Set([expectedVersion]),
      );
    }
  });
});

describe('transitive security dependency floors', () => {
  const minimumVersions = new Map([
    ['nanoid', '3.3.18'],
    ['postcss', '8.5.23'],
    ['fast-uri', '3.1.8'],
    ['js-yaml', '4.3.2'],
    ['valibot', '1.4.2'],
    ['undici', '7.29.1'],
    ['body-parser', '1.20.6'],
    ['proxy-addr', '2.0.8'],
    ['shell-quote', '1.12.0'],
    ['compression', '1.8.2'],
    ['source-map-js', '1.2.2'],
    ['postcss-selector-parser', '7.1.6'],
  ]);
  it.each([...minimumVersions])(
    '%s resolves only patched versions when installed',
    (packageName, minimumVersion) => {
      expect.assertions(0);
      const versions = installedVersions(packageName);

      // A dependency contraction may remove a transitive package entirely;
      // absence is safe, while any remaining copy must still meet its floor.
      for (const version of versions) {
        expectStableAtLeast(packageName, version, minimumVersion);
      }
    },
  );
});
