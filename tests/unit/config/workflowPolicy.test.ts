import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

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

const workflow = readFileSync('.github/workflows/pr.yml', 'utf8');

const releaseWorkflow = readFileSync('.github/workflows/release.yml', 'utf8');

const claudeWorkflow = readFileSync('.github/workflows/claude.yml', 'utf8');

const codeqlWorkflow = readFileSync('.github/workflows/codeql.yml', 'utf8');

const dependabot = readFileSync('.github/dependabot.yml', 'utf8');

const chromaticWorkflowPath = '.github/workflows/chromatic.yml';

const chromaticWorkflow = existsSync(chromaticWorkflowPath)
  ? readFileSync(chromaticWorkflowPath, 'utf8')
  : '';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  engines: { node: string };
  devEngines: { runtime: { version: string; onFail: string } };
  scripts: Record<string, string>;
};

const occurrences = (needle: string, haystack: string = workflow): number =>
  haystack.split(needle).length - 1;

const nodeVersions = (contents: string): string[] =>
  [...contents.matchAll(/node-version:\s*["']?([^"'\s]+)["']?/g)].flatMap(
    (match) => (match[1] === undefined ? [] : [match[1]]),
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

  if (start === -1) return '';

  const rest = contents.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z0-9-]+:\n/);

  return next === -1 ? rest : rest.slice(0, next + 1);
};

/** Extract top-level workflow steps without treating nested run-script lines as steps. */
const stepBlocks = (contents: string): string[] => {
  const lines = contents.split('\n');
  const stepIndent = lines
    .map((line) => /^(\s+)-\s+(?:name|uses|run):/.exec(line)?.[1]?.length)
    .find((indent) => indent !== undefined);

  if (stepIndent === undefined) return [];

  const starts = lines.flatMap((line, index) => {
    const step = line.slice(stepIndent);
    const characterAfterDash = step[1];

    return line.slice(0, stepIndent).trim() === '' &&
      step.startsWith('-') &&
      characterAfterDash !== undefined &&
      characterAfterDash.trim() === ''
      ? [index]
      : [];
  });

  return starts.map((start, index) =>
    lines.slice(start, starts[index + 1]).join('\n'),
  );
};

const hasAlwaysGuard = (step: string): boolean =>
  /^\s*if:\s*always\(\)(?:\s*&&|\s*$)/m.test(step);

const withoutComments = (contents: string): string =>
  contents
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n');

const isWordCharacter = (character: string | undefined): boolean =>
  character !== undefined && /[A-Za-z0-9_]/.test(character);

const hasNpxScannerInvocation = (line: string): boolean => {
  const npx = 'npx';
  const scannerReference = '@sonar/scan';
  let searchStart = 0;

  while (searchStart < line.length) {
    const npxIndex = line.indexOf(npx, searchStart);

    if (npxIndex === -1) return false;

    if (
      !isWordCharacter(line[npxIndex - 1]) &&
      !isWordCharacter(line[npxIndex + npx.length])
    ) {
      let scannerSearchStart = npxIndex + npx.length;

      while (scannerSearchStart < line.length) {
        const scannerIndex = line.indexOf(scannerReference, scannerSearchStart);

        if (scannerIndex === -1) break;

        if (!isWordCharacter(line[scannerIndex + scannerReference.length])) {
          return true;
        }

        scannerSearchStart = scannerIndex + scannerReference.length;
      }
    }

    searchStart = npxIndex + npx.length;
  }

  return false;
};

/** Immutable pins, each verified against the upstream tag object (Task D3). */
const CHECKOUT_PIN =
  'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1';

const SETUP_NODE_PIN =
  'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1';

const UPLOAD_ARTIFACT_PIN =
  'actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9';

const DOWNLOAD_ARTIFACT_PIN =
  'actions/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333';

const CHROMATIC_ACTION_PIN =
  'chromaui/action@38afd264ef2241136f12d039093c2724748bec08';

const CODEQL_ACTION_SHA = '2892aa5e19bbd11bc0cff5427e3b750a04d9e3c2';

const testCommands = [
  { name: 'unit', command: 'npm run test:ci:unit' },
  { name: 'storybook', command: 'npm run test:ci:storybook' },
  { name: 'quality', command: 'npm run test:ci:quality' },
];

/**
 * The PR workflow's job identifiers. `vitest` fans out through the retained
 * matrix into the long-running `vitest-*` statuses, while quality-node24 owns
 * the static, fast regression, build, docs, and scoped helper evidence.
 */
const declaredJobs = [
  'detect-changes',
  'quality-node24',
  'vitest',
  'e2e-node24',
  'lower-bound-node24',
];

const evidenceJobs = [
  'quality-node24',
  'vitest',
  'e2e-node24',
  'lower-bound-node24',
];

describe('pR workflow runs each test environment as its own partition', () => {
  it('declares the partition matrix without fail-fast', () => {
    expect.assertions(1);
    expect(occurrences('fail-fast: false')).toBeGreaterThanOrEqual(1);
  });
});

describe('pR workflow runs each test environment as its own partition', () => {
  it.each(testCommands)(
    'invokes $command exactly once through the PR gate',
    ({ command }) => {
      expect.assertions(1);
      expect(occurrences(command)).toBe(1);
    },
  );
});

describe('pR workflow runs each test environment as its own partition', () => {
  it.each(testCommands)(
    'writes the $name JUnit report to its own path exactly once',
    ({ name }) => {
      expect.assertions(1);
      expect(occurrences(`reports/vitest/${name}-junit.xml`)).toBe(1);
    },
  );
});

describe('pR workflow runs each test environment as its own partition', () => {
  it.each([
    ['pull request', workflow],
    ['release', releaseWorkflow],
  ])(
    'no longer runs the monolithic aggregate in the %s workflow',
    (_name, contents) => {
      expect.assertions(2);
      expect(contents).not.toMatch(/run: npm run test:ci\s*$/m);
      expect(contents).not.toContain('npm run test:ci\n');
    },
  );
});
