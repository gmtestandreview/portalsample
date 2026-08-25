import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Policy characterization for the PR workflow's test partitioning (Task A1).
 *
 * Each test environment must run as its own job so that one failing partition
 * never hides another's result. The workflow is asserted as text because the
 * contract being protected is the literal workflow shape GitHub reads, not a
 * derived object: an immutable action SHA, an unconditional upload, and a
 * strict missing-file policy all lose their meaning once normalised away.
 */

const workflow = readFileSync(".github/workflows/pr.yml", "utf8");
const releaseWorkflow = readFileSync(".github/workflows/release.yml", "utf8");

const occurrences = (needle: string): number =>
  workflow.split(needle).length - 1;

/** Immutable pin for actions/upload-artifact v6.0.0 (Node 24 action runtime). */
const UPLOAD_ARTIFACT_PIN =
  "actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f";

const partitions = [
  { name: "unit", command: "npm run test:ci:unit" },
  { name: "storybook", command: "npm run test:ci:storybook" },
  { name: "quality", command: "npm run test:ci:quality" },
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

  it("no longer runs the monolithic aggregate in CI", () => {
    expect(workflow).not.toContain("npm run test:ci\n");
    expect(workflow).not.toMatch(/run: npm run test:ci\s*$/m);
  });

  it("does not route CI coverage through the aggregate root config", () => {
    expect(workflow).not.toContain("reports/vitest/junit.xml");
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
});

describe("no partition may mask a failure", () => {
  it("never uses continue-on-error", () => {
    expect(workflow).not.toContain("continue-on-error");
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
    expect(contents).toContain("npm run test:e2e:storybook");
  });
});
