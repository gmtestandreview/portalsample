import { readFileSync } from 'node:fs';
import { gte, major, prerelease, valid } from 'semver';
import { describe, expect, it } from 'vitest';

interface LockPackage {
  version?: string;
}

interface PackageLock {
  lockfileVersion: number;
  packages: Record<string, LockPackage & { deprecated?: string }>;
}

interface RootPackage {
  devDependencies?: Record<string, string>;
  overrides?: Record<string, string | Record<string, string>>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseJson = (text: string): unknown => JSON.parse(text);

const parseStringRecord = (
  value: unknown,
  fieldName: string,
): Record<string, string> => {
  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be an object`);
  }

  const entries: [string, string][] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new Error(`${fieldName}.${key} must be a string`);
    }
    entries.push([key, entry]);
  }
  return Object.fromEntries(entries);
};

const parsePackageLock = (value: unknown): PackageLock => {
  if (
    !isRecord(value) ||
    typeof value['lockfileVersion'] !== 'number' ||
    !isRecord(value['packages'])
  ) {
    throw new Error('package-lock.json has an unexpected shape');
  }

  const packageEntries: [string, LockPackage & { deprecated?: string }][] = [];
  for (const [packagePath, metadata] of Object.entries(value['packages'])) {
    if (!isRecord(metadata)) {
      throw new Error(`package-lock.json entry ${packagePath} is invalid`);
    }

    const packageMetadata: LockPackage & { deprecated?: string } = {};
    if (metadata['version'] !== undefined) {
      if (typeof metadata['version'] !== 'string') {
        throw new Error(
          `package-lock.json entry ${packagePath} has an invalid version`,
        );
      }
      packageMetadata.version = metadata['version'];
    }
    if (metadata['deprecated'] !== undefined) {
      if (typeof metadata['deprecated'] !== 'string') {
        throw new Error(
          `package-lock.json entry ${packagePath} has an invalid deprecation`,
        );
      }
      packageMetadata.deprecated = metadata['deprecated'];
    }
    packageEntries.push([packagePath, packageMetadata]);
  }

  return {
    lockfileVersion: value['lockfileVersion'],
    packages: Object.fromEntries(packageEntries),
  };
};

const parseRootPackage = (value: unknown): RootPackage => {
  if (!isRecord(value)) {
    throw new Error('package.json has an unexpected shape');
  }

  const overrides = value['overrides'];
  const parsedOverrides: RootPackage['overrides'] =
    overrides === undefined
      ? undefined
      : (() => {
          if (!isRecord(overrides)) {
            throw new Error('package.json overrides must be an object');
          }
          const entries: [string, string | Record<string, string>][] = [];
          for (const [key, entry] of Object.entries(overrides)) {
            entries.push([
              key,
              typeof entry === 'string'
                ? entry
                : parseStringRecord(entry, `overrides.${key}`),
            ]);
          }
          return Object.fromEntries(entries);
        })();

  const result: RootPackage = {};
  const devDependencies = value['devDependencies'];
  if (devDependencies !== undefined) {
    result.devDependencies = parseStringRecord(
      devDependencies,
      'devDependencies',
    );
  }
  if (parsedOverrides !== undefined) {
    result.overrides = parsedOverrides;
  }
  return result;
};

const lock = parsePackageLock(
  parseJson(readFileSync('package-lock.json', 'utf8')),
);
const rootPackage = parseRootPackage(
  parseJson(readFileSync('package.json', 'utf8')),
);

const recordValue = <Value>(
  record: Record<string, Value> | undefined,
  key: string,
): Value | undefined => {
  const entry = Object.entries(record ?? {}).find(
    ([entryKey]) => entryKey === key,
  );
  return entry?.[1];
};

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
      expect.hasAssertions();

      const versions = installedVersions(packageName);

      expect(versions).not.toHaveLength(0);

      for (const version of versions) {
        expectStableAtLeast(packageName, version, minimumVersion);
      }
    },
  );

  it('keeps the exact-peer Vitest packages on one version', () => {
    expect.hasAssertions();

    const vitestPackages = [
      '@vitest/browser',
      '@vitest/browser-playwright',
      '@vitest/coverage-v8',
      'vitest',
    ];
    const expectedVersion = exactDevDependency('vitest');

    for (const packageName of vitestPackages) {
      expect(exactDevDependency(packageName)).toBe(expectedVersion);
      expect(new Set(installedVersions(packageName))).toStrictEqual(
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
      expect.hasAssertions();

      const versions = installedVersions(packageName);

      expect(versions).toBeInstanceOf(Array);

      // A dependency contraction may remove a transitive package entirely;
      // absence is safe, while any remaining copy must still meet its floor.
      for (const version of versions) {
        expectStableAtLeast(packageName, version, minimumVersion);
      }
    },
  );

  it('brace-expansion resolves only patched versions per major', () => {
    expect.hasAssertions();

    const floors = new Map([
      [1, '1.1.21'],
      [2, '2.1.7'],
      [5, '5.0.12'],
    ]);
    const versions = installedVersions('brace-expansion');

    expect(versions).not.toHaveLength(0);

    for (const version of versions) {
      const floor = floors.get(major(version));

      expect(
        floor,
        `unexpected brace-expansion major in ${version}`,
      ).toBeDefined();
      expect(
        gte(version, floor!),
        `brace-expansion@${version} must be at least ${floor ?? ''}`,
      ).toBe(true);
    }
  });

  it('keeps every glob major off deprecated releases and pins the three scoped owners to glob 13.0.6', () => {
    expect.hasAssertions();

    // Glob 7 arrives only through the deprecated ESLint 8 / rimraf 3 chain.
    // Glob 10 was a transitional allowance under Task D1; Task D2 replaces the
    // remaining remark-cli / unified-engine copies with the owner-scoped
    // glob@13.0.6 override below, so no glob 10 copy may remain installed.
    const versions = installedVersions('glob');

    expect(versions).not.toHaveLength(0);

    for (const version of versions) {
      expect(
        gte(version, '10.0.0'),
        `glob@${version} is a deprecated pre-10 release`,
      ).toBe(true);
      expect(
        version.startsWith('10.'),
        `glob@${version} is the deprecated glob 10 release`,
      ).toBe(false);
    }

    const globOverrideOwners = [
      'unified-engine',
      '@npmcli/map-workspaces',
      '@npmcli/package-json',
    ];

    for (const owner of globOverrideOwners) {
      expect(
        recordValue(rootPackage.overrides, owner),
        `package.json overrides must pin ${owner}'s glob dependency to 13.0.6`,
      ).toStrictEqual({
        glob: '13.0.6',
      });
    }
  });
});

describe('lint cohort', () => {
  const cohort = new Map([
    ['eslint', '10.14.0'],
    ['@eslint/js', '10.0.1'],
    ['typescript-eslint', '8.72.1'],
    ['@eslint-react/eslint-plugin', '5.28.8'],
    ['eslint-plugin-react-hooks', '7.1.1'],
    ['@stylistic/eslint-plugin', '5.10.0'],
    ['globals', '17.14.0'],
  ]);

  it.each([...cohort])(
    'declares %s as an exact supported version',
    (packageName, expectedVersion) => {
      expect.hasAssertions();

      expect(exactDevDependency(packageName)).toBe(expectedVersion);
      expect(installedVersions(packageName)).toContain(expectedVersion);
    },
  );

  it('resolves ESLint only on the maintained 10 line', () => {
    expect.hasAssertions();

    const versions = installedVersions('eslint');

    expect(versions).not.toHaveLength(0);

    for (const version of versions) {
      expect(
        gte(version, '10.0.0'),
        `eslint@${version} is an unsupported pre-10 release`,
      ).toBe(true);
    }
  });

  it.each([
    'eslint-plugin-react',
    '@humanwhocodes/config-array',
    '@humanwhocodes/object-schema',
    'inflight',
    'rimraf',
  ])('no longer installs the deprecated package %s', (packageName) => {
    expect.hasAssertions();

    expect(installedVersions(packageName)).toHaveLength(0);
  });

  it('retains the Storybook lint plugin alongside the new cohort', () => {
    expect.hasAssertions();

    expect(installedVersions('eslint-plugin-storybook')).not.toHaveLength(0);
  });
});

describe('publisher deprecations', () => {
  /**
   * Task D1 removed the ESLint 8 chain but left a transitional allowance for
   * three glob@10 copies owned by remark-cli/unified-engine. Task D2 removes
   * that allowance: the lockfile must carry zero packages with a non-empty
   * `deprecated` field.
   */
  it('installs no package that npm publishers have marked deprecated', () => {
    expect.hasAssertions();

    const deprecatedEntries = Object.entries(lock.packages)
      .filter(([, metadata]) => Boolean(metadata.deprecated))
      .map(([packagePath]) => packagePath);

    expect(deprecatedEntries).toStrictEqual([]);
  });
});

describe('install-script approvals', () => {
  /**
   * npm 11.17 records reviewed install scripts in package.json's `allowScripts`
   * and warns on every install about packages not yet covered. The field is
   * advisory today - the scripts still run - but npm has announced that a
   * future release will block unreviewed ones, so an unreviewed script is a
   * build that breaks later, not just noise.
   *
   * Keys are npm-package-arg specs and values are booleans: `true` allows,
   * `false` denies, and a deny always wins over an allow.
   *
   * The keys are deliberately name-only rather than pinned `pkg@version`, and
   * that is forced by this repository's lockfile. arborist derives a package's
   * trusted identity from the `resolved` URL; where `resolved` is absent it
   * falls back to the name from the incoming edges and reports the version as
   * null, so a pinned key can never match. Only 126 of this lockfile's 1399
   * entries carry `resolved`, which is why `npm approve-scripts` reports
   * "Nothing to approve" while `--allow-scripts-pending` still lists the three
   * packages. Once the lockfile carries `resolved` for every entry, these
   * should become pinned so that a version bump re-triggers review.
   */
  const APPROVED_INSTALL_SCRIPTS = [
    '@parcel/watcher',
    'esbuild',
    'msw',
  ] as const;

  const allowScripts = (
    JSON.parse(readFileSync('package.json', 'utf8')) as {
      allowScripts?: Record<string, boolean>;
    }
  ).allowScripts;

  it('reviews every dependency that runs an install script', () => {
    expect.hasAssertions();

    expect(Object.keys(allowScripts ?? {}).sort()).toStrictEqual(
      [...APPROVED_INSTALL_SCRIPTS].sort(),
    );
  });

  it('records each review as an explicit allow', () => {
    expect.hasAssertions();

    for (const packageName of APPROVED_INSTALL_SCRIPTS) {
      expect(
        recordValue(allowScripts, packageName),
        `${packageName} must be an explicit boolean allow, not a version string`,
      ).toBe(true);
    }
  });

  it('keeps each approved package installed at exactly one version', () => {
    expect.hasAssertions();

    for (const packageName of APPROVED_INSTALL_SCRIPTS) {
      expect(
        installedVersions(packageName),
        `${packageName} must resolve to a single version, so one name-only approval covers one reviewed build`,
      ).toHaveLength(1);
    }
  });
});

describe('coverage remapping cohort', () => {
  // ast-v8-to-istanbul performs the V8-to-Istanbul remap that emitted the
  // `terms-config.json?import` parse failure. Keep the reviewed lockfile
  // version visible so the next incidental move is not silent.
  it('resolves the V8-to-Istanbul remapper at exactly one reviewed version', () => {
    expect.hasAssertions();

    expect(installedVersions('ast-v8-to-istanbul')).toStrictEqual(['1.0.7']);
  });

  it('keeps the coverage provider aligned with the Vitest cohort', () => {
    expect.hasAssertions();

    expect(installedVersions('@vitest/coverage-v8')).toStrictEqual(['5.0.5']);
  });

  it('holds the Storybook test cohort on the same Vitest 5 release', () => {
    expect.hasAssertions();

    const vitestVersion = exactDevDependency('vitest');

    expect(vitestVersion).toMatch(/^5\./);
    expect(exactDevDependency('@vitest/browser')).toBe(vitestVersion);
    expect(exactDevDependency('@vitest/browser-playwright')).toBe(
      vitestVersion,
    );
    expect(exactDevDependency('@vitest/coverage-v8')).toBe(vitestVersion);
  });
});
