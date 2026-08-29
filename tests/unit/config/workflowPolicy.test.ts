import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Policy characterization for the PR workflow's test partitioning (Task A1) and
 * for the Node/Actions runtime contracts (Task D3).
 *
 * Each test environment must run as its own job so that one failing partition
 * never hides another's result. The workflow is asserted as text because the
 * contract being protected is the literal workflow shape GitHub reads, not a
 * derived object: an immutable action SHA, an unconditional upload, and a
 * strict missing-file policy all lose their meaning once normalised away.
 * `jobBlock` scopes a text assertion to one job so that a guarantee proved for
 * one job cannot be satisfied by a different job's text.
 */

const workflow = readFileSync(".github/workflows/pr.yml", "utf8");
const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");
const dependabot = readFileSync(".github/dependabot.yml", "utf8");
const chromaticWorkflowPath = ".github/workflows/chromatic.yml";
const chromaticWorkflow = existsSync(chromaticWorkflowPath)
  ? readFileSync(chromaticWorkflowPath, "utf8")
  : "";
const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  engines: { node: string };
  devEngines: { runtime: { version: string; onFail: string } };
  scripts: Record<string, string>;
};

const occurrences = (needle: string, haystack: string = workflow): number =>
  haystack.split(needle).length - 1;

const nodeVersions = (contents: string): string[] =>
  [...contents.matchAll(/node-version:\s*["']?([^"'\s]+)["']?/g)].map(
    (match) => match[1],
  );

/**
 * Slice one job's YAML out of a workflow. A job identifier is the only key at
 * two-space indent immediately followed by a newline; every key inside a job is
 * indented further.
 *
 * Returns an empty slice for a job that does not exist rather than throwing:
 * describe bodies run at collection time, so a throw here would abort the whole
 * file and hide every other job's result.
 */
const jobBlock = (contents: string, jobId: string): string => {
  const start = contents.indexOf(`\n  ${jobId}:\n`);

  if (start === -1) return "";

  const rest = contents.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z0-9-]+:\n/);

  return next === -1 ? rest : rest.slice(0, next + 1);
};

/** Immutable pins, each verified against the upstream tag object (Task D3). */
const CHECKOUT_PIN = "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1";
const SETUP_NODE_PIN =
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020";
const UPLOAD_ARTIFACT_PIN =
  "actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f";
const DOWNLOAD_ARTIFACT_PIN =
  "actions/download-artifact@018cc2cf5baa6db3ef3c5f8a56943fffe632ef53";
const CHROMATIC_ACTION_PIN =
  "chromaui/action@534eebfc19023579541d106f7b61d5ad70ed65c7";

const partitions = [
  { name: "unit", command: "npm run test:ci:unit" },
  { name: "storybook", command: "npm run test:ci:storybook" },
  { name: "quality", command: "npm run test:ci:quality" },
];

/**
 * The PR workflow's job identifiers. `vitest` fans out through A1's retained
 * matrix into the three `vitest-*` statuses, so six job keys expose the eight
 * required statuses.
 */
const declaredJobs = [
  "static-quality-node24",
  "vitest",
  "build-node24",
  "date-timezone",
  "e2e-node24",
  "lower-bound-node24",
  "sonarcloud",
];

const timezones = [
  { name: "UTC", slug: "utc" },
  { name: "Australia/Sydney", slug: "sydney" },
  { name: "America/Los_Angeles", slug: "los-angeles" },
];

describe("PR workflow runs each test environment as its own partition", () => {
  it("declares the partition matrix without fail-fast", () => {
    expect(occurrences("fail-fast: false")).toBeGreaterThanOrEqual(1);
  });

  it.each(partitions)(
    "invokes $command exactly once through the matrix",
    ({ command }) => {
      expect(occurrences(command)).toBe(1);
    },
  );

  it.each(partitions)(
    "writes the $name JUnit report to its own path exactly once",
    ({ name }) => {
      expect(occurrences(`reports/vitest/${name}-junit.xml`)).toBe(1);
    },
  );

  it.each([
    ["pull request", workflow],
    ["release", releaseWorkflow],
  ])(
    "no longer runs the monolithic aggregate in the %s workflow",
    (_name, contents) => {
      expect(contents).not.toMatch(/run: npm run test:ci\s*$/m);
      expect(contents).not.toContain("npm run test:ci\n");
    },
  );

  it("does not route CI coverage through the aggregate root config", () => {
    expect(workflow).not.toContain("reports/vitest/junit.xml");
  });
});

describe("the PR workflow exposes eight independently named statuses", () => {
  it.each(declaredJobs)("declares the %s job", (jobId) => {
    expect(workflow).toContain(`\n  ${jobId}:\n`);
  });

  it("renders the three vitest statuses from the retained A1 matrix", () => {
    expect(jobBlock(workflow, "vitest")).toContain(
      "name: vitest-${{ matrix.partition.name }}",
    );
  });

  it.each([
    "static-quality",
    "test-partition",
    "build",
    "dependency-security-node24",
    "dependency-security-node20",
    "lower-bound-node22",
  ])("retains no superseded %s identifier", (jobId) => {
    expect(workflow).not.toContain(`\n  ${jobId}:\n`);
  });

  it("gives every job an explicit timeout", () => {
    expect(occurrences("timeout-minutes:")).toBe(declaredJobs.length);
  });

  it("pipes step output through a shell that fails on a broken pipe", () => {
    // GitHub's default runner shell is `bash -e`, which has no pipefail; an
    // explicit `shell: bash` restores it so `| tee` cannot mask a failure.
    expect(workflow).toContain("shell: bash");
  });
});

describe("workflows pin every action to an immutable commit", () => {
  const pinnedWorkflows = [
    ["pull request", workflow],
    ["release", releaseWorkflow],
  ] as const;

  it.each(pinnedWorkflows)(
    "pins checkout in the %s workflow",
    (_name, contents) => {
      expect(contents).toContain(`uses: ${CHECKOUT_PIN} # v7`);
    },
  );

  it.each(pinnedWorkflows)(
    "pins setup-node in the %s workflow",
    (_name, contents) => {
      expect(contents).toContain(`uses: ${SETUP_NODE_PIN} # v7`);
    },
  );

  it.each(pinnedWorkflows)(
    "leaves no floating actions/* tag in the %s workflow",
    (_name, contents) => {
      expect(contents).not.toMatch(/uses:\s*actions\/[\w-]+@v\d/);
    },
  );

  it("keeps explicit npm cache ownership on every setup-node", () => {
    // setup-node v7 auto-detects a package manager; the explicit input keeps
    // cache ownership where A1 put it rather than letting the major change it.
    expect(occurrences(`uses: ${SETUP_NODE_PIN}`)).toBe(
      occurrences("cache: 'npm'"),
    );
  });
});

describe("every partition reports its evidence unconditionally", () => {
  // A matrix step appears once in the workflow text but executes per partition,
  // so the contract is "every upload carries every guarantee", not a raw count.
  const uploadCount = occurrences(`uses: ${UPLOAD_ARTIFACT_PIN}`);

  it("pins upload-artifact to an immutable commit rather than a floating tag", () => {
    expect(uploadCount).toBeGreaterThanOrEqual(2);
    expect(workflow).not.toMatch(/actions\/upload-artifact@v\d/);
  });

  it("uploads evidence even when the partition failed", () => {
    expect(occurrences("if: always()")).toBe(uploadCount);
  });

  it("fails the job when an expected artifact is missing", () => {
    expect(occurrences("if-no-files-found: error")).toBe(uploadCount);
    expect(workflow).not.toContain("if-no-files-found: warn");
    expect(workflow).not.toContain("if-no-files-found: ignore");
  });

  it("retains evidence for 14 days", () => {
    expect(occurrences("retention-days: 14")).toBe(uploadCount);
  });

  it("uploads the matrix report and unit coverage as separate evidence", () => {
    expect(workflow).toContain("${{ matrix.partition.report }}");
    expect(workflow).toContain("reports/coverage/unit");
  });

  it.each(declaredJobs)("uploads evidence from the %s job", (jobId) => {
    expect(jobBlock(workflow, jobId)).toContain(`uses: ${UPLOAD_ARTIFACT_PIN}`);
  });
});

describe("the date-timezone job characterizes every required zone", () => {
  const block = jobBlock(workflow, "date-timezone");

  it.each(timezones)("runs the focused suite in $name", ({ name }) => {
    expect(block).toContain(`name: ${name}`);
  });

  it("never lets one zone cancel the others", () => {
    expect(block).toContain("fail-fast: false");
  });

  it("sets the zone through job env rather than a shell-specific script", () => {
    expect(block).toContain("TZ: ${{ matrix.zone.name }}");
    expect(packageJson.scripts).not.toHaveProperty("test:tz");
  });

  it("writes one JUnit report per zone", () => {
    expect(block).toContain(
      "--outputFile.junit=reports/vitest/date-${{ matrix.zone.slug }}-junit.xml",
    );
  });

  it("runs the focused date files rather than the whole unit partition", () => {
    expect(block).toContain(
      "tests/unit/components/inputs/datePickerWrapper.test.tsx",
    );
    expect(block).toContain("tests/unit/routes/requestForQuote/props.test.ts");
    expect(block).toContain(
      "tests/unit/routes/requestForQuote/validation.test.ts",
    );
    expect(block).not.toContain("npm run test:ci:unit");
  });
});

describe("the e2e job runs the full Playwright contract", () => {
  const block = jobBlock(workflow, "e2e-node24");

  it("runs the aggregate e2e script", () => {
    expect(block).toContain("npm run test:e2e");
  });

  it("covers both the app and Storybook projects through that script", () => {
    expect(packageJson.scripts["test:e2e"]).toContain("test:e2e:app");
    expect(packageJson.scripts["test:e2e"]).toContain("test:e2e:storybook");
  });

  it("installs Chromium, which a fresh runner does not provide", () => {
    expect(block).toContain("playwright install --with-deps chromium");
  });

  it("uploads the HTML report, traces, and screenshots", () => {
    expect(block).toContain("reports/playwright");
    expect(block).toContain("reports/test-results");
  });
});

describe("the lower-bound job proves the declared Node floor", () => {
  const block = jobBlock(workflow, "lower-bound-node24");

  it("installs on the exact floor rather than the latest 24", () => {
    expect(block).toContain("node-version: '24.0.0'");
  });

  it("refuses to silently resolve a conflicting peer", () => {
    expect(block).toContain("ci --strict-peer-deps");
  });

  it("runs the policy, lint, type-check, and build gates", () => {
    expect(block).toContain("tests/unit/config/dependencySecurity.test.ts");
    expect(block).toContain("npm run lint");
    expect(block).toContain("npm run type-check");
    expect(block).toContain("npm run build");
  });

  it("keeps browser suites out of the floor job", () => {
    expect(block).not.toContain("playwright install");
  });
});

describe("the sonarcloud job analyses what SonarCloud actually needs", () => {
  const block = jobBlock(workflow, "sonarcloud");

  it("checks out full history so blame can attribute new code", () => {
    // SonarCloud decides what counts as new code from SCM blame dates. A
    // shallow clone leaves it no history to read, so the new-code period -
    // and every quality gate condition built on it - becomes meaningless.
    expect(block).toContain("fetch-depth: 0");
  });

  it("reuses the unit partition's coverage instead of re-running the suite", () => {
    // Each test environment runs exactly once, through the matrix. Re-running
    // the unit suite here would duplicate several minutes per PR and could
    // report a different result than the partition that owns that status.
    expect(block).toContain(`uses: ${DOWNLOAD_ARTIFACT_PIN}`);
    expect(block).toContain("vitest-unit-coverage-");
    expect(block).not.toContain("npm run test:ci:unit");
  });

  it("restores coverage before the scan rather than scanning bare", () => {
    const download = block.indexOf(DOWNLOAD_ARTIFACT_PIN);
    const scan = block.indexOf("@sonar/scan");

    expect(download).toBeGreaterThan(-1);
    expect(scan).toBeGreaterThan(download);
  });

  it("waits for the partition that produces the coverage it consumes", () => {
    expect(block).toContain("needs: vitest");
  });

  it("pins the scanner version rather than floating on latest", () => {
    // The repo pins npm itself for the same reason; an unpinned scanner can
    // change analysis results between runs with no commit to explain it.
    expect(block).toContain("@sonar/scan@4.3.6");
  });

  it("authenticates from a secret, never an inline token", () => {
    expect(block).toContain("SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}");
    expect(block).not.toMatch(/sonar\.token=/);
  });

  it("waits for the quality gate so a red gate fails the build", () => {
    // Without this the scanner uploads and exits 0 whatever the verdict, and
    // the gate can never block a merge.
    expect(block).toContain("sonar.qualitygate.wait=true");
  });
});

describe("no partition may mask a failure", () => {
  it("never uses continue-on-error", () => {
    expect(workflow).not.toContain("continue-on-error");
    expect(releaseWorkflow).not.toContain("continue-on-error");
  });

  it("keeps the Chromium install that a fresh runner requires", () => {
    expect(workflow).toContain("playwright install");
  });

  it("preserves the Rolldown optional-binding workaround", () => {
    expect(workflow).toContain("@rolldown/binding-linux-x64-gnu");
  });
});

describe("Storybook documentation is a CI quality gate", () => {
  it.each([
    ["pull request", workflow],
    ["release", releaseWorkflow],
  ])("verifies docs structure in the %s workflow", (_name, contents) => {
    expect(contents).toContain("npm run storybook:verify:docs");
  });

  it.each([
    ["pull request", workflow],
    ["release", releaseWorkflow],
  ])("runs Storybook BDD in the %s workflow", (_name, contents) => {
    expect(contents).toContain("npm run test:e2e");
  });
});

describe("CI uses the repository's enforced Node runtime", () => {
  it("keeps engines and devEngines on the same Node 24 floor", () => {
    expect(packageJson.engines.node).toBe(">=24.0.0");
    expect(packageJson.devEngines.runtime.version).toBe(">=24.0.0");
    expect(packageJson.devEngines.runtime.onFail).toBe("error");
  });

  it.each([
    ["pull request", workflow],
    ["release", releaseWorkflow],
  ])("runs every %s job on Node 24", (_name, contents) => {
    const configuredVersions = nodeVersions(contents);

    expect(configuredVersions.length).toBeGreaterThan(0);
    expect(
      configuredVersions.every((version) => /^24(?:\.|$)/.test(version)),
    ).toBe(true);
  });

  it.each([
    ["pull request", workflow],
    ["release", releaseWorkflow],
  ])(
    "retains no retired Node 20 runtime in the %s workflow",
    (_name, contents) => {
      expect(contents).not.toMatch(/node-version:\s*["']?20/);
      expect(contents).not.toContain("node20");
      expect(contents).not.toContain("20.19");
    },
  );
});

describe("Dependabot owns the lint cohort as one reviewable group", () => {
  it("keeps the weekly GitHub Actions ecosystem entry", () => {
    expect(dependabot).toContain("package-ecosystem: github-actions");
  });

  it("groups the whole ESLint family into a single pull request", () => {
    expect(dependabot).toContain("eslint-family:");
    for (const pattern of [
      "'eslint'",
      "'@eslint/js'",
      "'typescript-eslint'",
      "'@eslint-react/*'",
      "'eslint-plugin-react-hooks'",
      "'@stylistic/*'",
      "'globals'",
    ]) {
      expect(dependabot).toContain(pattern);
    }
  });

  it("keeps npm major upgrades review-only", () => {
    expect(dependabot).toContain("'version-update:semver-major'");
  });
});

describe("Chromatic publishing reports asynchronously through GitHub", () => {
  it("publishes every pushed branch with complete Git history", () => {
    expect(chromaticWorkflow).toContain("push:");
    expect(chromaticWorkflow).toContain("fetch-depth: 0");
  });

  it("uses the repository's enforced Node 24 runtime", () => {
    expect(nodeVersions(chromaticWorkflow)).toEqual(["24.20.0"]);
  });

  it("pins the Chromatic action and reads its protected repository secret", () => {
    expect(chromaticWorkflow).toContain(`uses: ${CHROMATIC_ACTION_PIN}`);
    expect(chromaticWorkflow).toContain(
      "projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}",
    );
    expect(chromaticWorkflow).not.toMatch(/chpt_[a-zA-Z0-9]+/);
  });

  it("exits after upload instead of waiting for cloud test results", () => {
    expect(chromaticWorkflow).toContain("exitOnceUploaded: true");
  });
});
