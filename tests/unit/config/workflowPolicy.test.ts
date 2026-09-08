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

/** Extract top-level workflow steps without treating nested run-script lines as steps. */
const stepBlocks = (contents: string): string[] => {
  const lines = contents.split("\n");
  const stepIndent = lines
    .map((line) => /^(\s+)-\s+(?:name|uses|run):/.exec(line)?.[1].length)
    .find((indent) => indent !== undefined);

  if (stepIndent === undefined) return [];

  const starts = lines.flatMap((line, index) =>
    new RegExp(`^\\s{${stepIndent}}-\\s+`).test(line) ? [index] : [],
  );

  return starts.map((start, index) =>
    lines.slice(start, starts[index + 1]).join("\n"),
  );
};

const hasAlwaysGuard = (step: string): boolean =>
  /^\s*if:\s*always\(\)(?:\s*&&|\s*$)/m.test(step);

const withoutComments = (contents: string): string =>
  contents
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");

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

/**
 * Helper jobs that gate the narrowly-scoped checks (agent-tooling, date-timezone)
 * on what the PR actually changed. They carry no required status, but must still
 * be bounded, and a broken gate silently switches its downstream guard off.
 */
const pathGatedJobs = ["detect-changes", "agent-tooling"];

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
    expect(occurrences("timeout-minutes:")).toBe(
      declaredJobs.length + pathGatedJobs.length,
    );
  });

  it("pipes step output through a shell that fails on a broken pipe", () => {
    // GitHub's default runner shell is `bash -e`, which has no pipefail; an
    // explicit `shell: bash` restores it so `| tee` cannot mask a failure.
    expect(workflow).toContain("shell: bash");
  });
});

describe("a new push supersedes the in-flight PR run", () => {
  it("scopes a cancel-in-progress concurrency group to the ref", () => {
    expect(workflow).toContain("group: ${{ github.workflow }}-${{ github.ref }}");
    expect(workflow).toContain("cancel-in-progress: true");
  });
});

describe("path-gated jobs stay off the critical path until their tree changes", () => {
  const detect = jobBlock(workflow, "detect-changes");
  const agentTooling = jobBlock(workflow, "agent-tooling");

  it("classifies the PR's changed files against the merge base", () => {
    expect(detect).toContain("fetch-depth: 0");
    expect(detect).toContain(
      'git diff --name-only "${{ github.event.pull_request.base.sha }}" HEAD',
    );
  });

  it("exposes one boolean output per gated job", () => {
    expect(detect).toContain(
      "agent-tooling: ${{ steps.scope.outputs.agent-tooling }}",
    );
    expect(detect).toContain(
      "date-logic: ${{ steps.scope.outputs.date-logic }}",
    );
    expect(detect).toContain("deps: ${{ steps.scope.outputs.deps }}");
  });

  it("runs the agent-orchestration checks only when their trees change", () => {
    expect(agentTooling).toContain("needs: detect-changes");
    expect(agentTooling).toContain(
      "if: needs.detect-changes.outputs.agent-tooling == 'true'",
    );
    expect(agentTooling).toContain("python3 tests/hooks/test_pre_tool_use.py");
    expect(agentTooling).toContain("python3 tests/hooks/test_watcher_pid.py");
  });

  it("moves the Python tooling out of static-quality-node24", () => {
    expect(jobBlock(workflow, "static-quality-node24")).not.toContain("python3");
  });

  it("bounds both helper jobs with an explicit timeout", () => {
    expect(detect).toContain("timeout-minutes:");
    expect(agentTooling).toContain("timeout-minutes:");
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
  const artifactUploads = stepBlocks(workflow).filter((step) =>
    step.includes(`uses: ${UPLOAD_ARTIFACT_PIN}`),
  );
  // Report paths identify the artifacts covered by this evidence policy. An
  // unrelated diagnostic artifact can therefore choose its own metadata.
  const evidenceUploads = artifactUploads.filter((step) =>
    step.includes("reports/"),
  );

  it("pins upload-artifact to an immutable commit rather than a floating tag", () => {
    expect(artifactUploads.length).toBeGreaterThanOrEqual(2);
    expect(artifactUploads.every((step) =>
      step.includes(`uses: ${UPLOAD_ARTIFACT_PIN}`),
    )).toBe(true);
    expect(workflow).not.toMatch(/actions\/upload-artifact@v\d/);
  });

  it("uploads evidence even when the partition failed", () => {
    expect(evidenceUploads.length).toBeGreaterThan(0);
    expect(evidenceUploads.every(hasAlwaysGuard)).toBe(true);
  });

  it("fails the job when an expected artifact is missing", () => {
    expect(evidenceUploads.every((step) =>
      /if-no-files-found:\s*error\b/.test(step),
    )).toBe(true);
  });

  it("retains evidence for 14 days", () => {
    expect(evidenceUploads.every((step) =>
      /retention-days:\s*14\b/.test(step),
    )).toBe(true);
  });

  it("uploads the matrix report and unit coverage as separate evidence", () => {
    expect(workflow).toContain("${{ matrix.partition.report }}");
    expect(workflow).toContain("reports/coverage/unit");
  });

  it.each(declaredJobs)("uploads evidence from the %s job", (jobId) => {
    expect(jobBlock(workflow, jobId)).toContain(`uses: ${UPLOAD_ARTIFACT_PIN}`);
  });
});

describe("the date-timezone job re-runs the focused date suite off UTC", () => {
  const block = jobBlock(workflow, "date-timezone");

  it("runs under Australia/Sydney, set through job env", () => {
    // vitest-unit already exercises these files in the runner's default zone
    // (UTC). This leg adds the "east of UTC, date already rolled over" edge for
    // dateOnly.ts's deliberate local/UTC split - one zone, not a matrix, and set
    // through job env rather than a shell-specific script.
    expect(block).toContain("TZ: Australia/Sydney");
    expect(block).not.toContain("matrix");
    expect(packageJson.scripts).not.toHaveProperty("test:tz");
  });

  it("is path-gated, not run on every PR", () => {
    expect(block).toContain("needs: detect-changes");
    expect(block).toContain(
      "if: needs.detect-changes.outputs.date-logic == 'true'",
    );
  });

  it("writes a single JUnit report for the Sydney run", () => {
    expect(block).toContain(
      "--outputFile.junit=reports/vitest/date-sydney-junit.xml",
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
    expect(block).toContain("tests/unit/utils/dateOnly.test.ts");
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

  it("runs only when dependency or workflow files change", () => {
    // The floor-install result is a property of the dependency tree and the CI
    // install path, not the app source, so it is path-gated rather than run on
    // every PR.
    expect(block).toContain("needs: detect-changes");
    expect(block).toContain(
      "if: needs.detect-changes.outputs.deps == 'true'",
    );
  });

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

  it("uses the official scanner action at the intended immutable commit", () => {
    const scannerReferences = [...block.matchAll(
      /^\s*uses:\s*SonarSource\/sonarqube-scan-action@([^\s#]+)/gm,
    )].map((match) => match[1]);

    expect(scannerReferences.length).toBeGreaterThan(0);
    expect(scannerReferences).toEqual([
      "7006c4492b2e0ee0f816d36501671557c97f5995",
    ]);
    expect(scannerReferences.every((reference) => /^[0-9a-f]{40}$/.test(reference))).toBe(true);
  });

  it("does not execute the scanner through runtime npm resolution", () => {
    const scannerRunSteps = stepBlocks(block).filter((step) =>
      /^\s*run:/m.test(step) && /\bnpx\b[^\n]*@sonar\/scan(?:@[^\s]+)?\b/.test(withoutComments(step)),
    );

    expect(scannerRunSteps).toEqual([]);
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

  it("provisions npm through corepack, not an npx-installed copy", () => {
    // `npx --yes npm@X` fetches npm at CI time and runs its lifecycle scripts -
    // for the sonarcloud job, in a step that holds SONAR_TOKEN. corepack
    // resolves the version from package.json's packageManager field instead, and
    // must not stall on its download prompt in CI.
    for (const contents of [workflow, releaseWorkflow]) {
      expect(contents).not.toMatch(/npx\s+--yes\s+npm@/);
      expect(contents).toContain("run: corepack enable");
      expect(contents).toContain("COREPACK_ENABLE_DOWNLOAD_PROMPT: '0'");
    }
    // One corepack activation per job that installs dependencies.
    expect(occurrences("run: corepack enable")).toBe(7);
  });

  it("invokes the installed Playwright binary directly, not via npx", () => {
    for (const contents of [workflow, releaseWorkflow]) {
      expect(contents).not.toContain("npx playwright");
      expect(contents).toContain(
        "./node_modules/.bin/playwright install --with-deps chromium",
      );
    }
  });

  it("preserves the Rolldown optional-binding workaround", () => {
    // Deduplicated from seven inline copies into a local composite action. Every
    // job that installs dependencies calls it, and the action still
    // force-reinstalls the exact binding the lockfile pins.
    const action = readFileSync(
      ".github/actions/verify-rolldown-binding/action.yml",
      "utf8",
    );

    expect(workflow).toContain(
      "uses: ./.github/actions/verify-rolldown-binding",
    );
    expect(releaseWorkflow).toContain(
      "uses: ./.github/actions/verify-rolldown-binding",
    );
    expect(action).toContain("@rolldown/binding-linux-x64-gnu");
    expect(action).toContain("--no-save --force");
    expect(action).not.toContain("npx");
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
