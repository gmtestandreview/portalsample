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
  overrides?: Record<string, string | Record<string, string>>;
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

  it("keeps every glob major off deprecated releases and pins the three scoped owners to glob 13.0.6", () => {
    // Glob 7 arrives only through the deprecated ESLint 8 / rimraf 3 chain.
    // Glob 10 was a transitional allowance under Task D1; Task D2 replaces the
    // remaining remark-cli / unified-engine copies with the owner-scoped
    // glob@13.0.6 override below, so no glob 10 copy may remain installed.
    const versions = installedVersions("glob");

    expect(versions).not.toHaveLength(0);
    for (const version of versions) {
      expect(
        gte(version, "10.0.0"),
        `glob@${version} is a deprecated pre-10 release`,
      ).toBe(true);
      expect(
        version.startsWith("10."),
        `glob@${version} is the deprecated glob 10 release`,
      ).toBe(false);
    }

    const globOverrideOwners = [
      "unified-engine",
      "@npmcli/map-workspaces",
      "@npmcli/package-json",
    ];

    for (const owner of globOverrideOwners) {
      expect(
        rootPackage.overrides?.[owner],
        `package.json overrides must pin ${owner}'s glob dependency to 13.0.6`,
      ).toEqual({ glob: "13.0.6" });
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
  /**
   * Task D1 removed the ESLint 8 chain but left a transitional allowance for
   * three glob@10 copies owned by remark-cli/unified-engine. Task D2 removes
   * that allowance: the lockfile must carry zero packages with a non-empty
   * `deprecated` field.
   */
  it("installs no package that npm publishers have marked deprecated", () => {
    const deprecatedEntries = Object.entries(lock.packages)
      .filter(([, metadata]) => Boolean(metadata.deprecated))
      .map(([packagePath]) => packagePath);

    expect(deprecatedEntries).toEqual([]);
  });
});

describe("install-script approvals", () => {
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
    "@parcel/watcher",
    "esbuild",
    "msw",
  ] as const;

  const allowScripts = (
    JSON.parse(readFileSync("package.json", "utf8")) as {
      allowScripts?: Record<string, boolean>;
    }
  ).allowScripts;

  it("reviews every dependency that runs an install script", () => {
    expect(Object.keys(allowScripts ?? {}).sort()).toEqual(
      [...APPROVED_INSTALL_SCRIPTS].sort(),
    );
  });

  it("records each review as an explicit allow", () => {
    for (const packageName of APPROVED_INSTALL_SCRIPTS) {
      expect(
        allowScripts?.[packageName],
        `${packageName} must be an explicit boolean allow, not a version string`,
      ).toBe(true);
    }
  });

  it("keeps each approved package installed at exactly one version", () => {
    for (const packageName of APPROVED_INSTALL_SCRIPTS) {
      expect(
        installedVersions(packageName),
        `${packageName} must resolve to a single version, so one name-only approval covers one reviewed build`,
      ).toHaveLength(1);
    }
  });
});

describe("coverage remapping cohort", () => {
  // ast-v8-to-istanbul performs the V8-to-Istanbul remap that emitted the
  // `terms-config.json?import` parse failure. It moved 1.0.4 -> 1.0.5 as an
  // incidental lockfile re-resolution in 23f0a2f, confounding that commit's
  // remap fix with a dependency change. Pin it so the next incidental move is
  // visible rather than silent.
  it("resolves the V8-to-Istanbul remapper at exactly one reviewed version", () => {
    expect(installedVersions("ast-v8-to-istanbul")).toEqual(["1.0.5"]);
  });

  it("keeps the coverage provider aligned with the Vitest cohort", () => {
    expect(installedVersions("@vitest/coverage-v8")).toEqual(["5.0.0"]);
  });
});
