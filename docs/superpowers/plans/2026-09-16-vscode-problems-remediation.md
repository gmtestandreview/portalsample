# VS Code Problems Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make VS Code's Problems panel show the repository's relevant
TypeScript, ESLint, clean-code SonarQube, and rule-citation diagnostics
predictably, while capturing every Sonar-discovered issue in a durable
prioritized backlog.

**Architecture:** Keep editor behavior in repo-owned `.vscode` configuration
where possible, so user-level settings cannot silently disable diagnostics.
Preserve SonarQube's Clean as You Code focus on new code for editor Problems,
but add a repository-owned Sonar backlog capture so historical and accepted debt
is not forgotten. Use VS Code's existing TypeScript, ESLint, and
task/problem-matcher integrations, and add small adapters for custom
business-rule citation diagnostics and Sonar backlog generation instead of
teaching VS Code to parse human reports.

**Tech Stack:** VS Code workspace settings, VS Code tasks/problem matchers,
TypeScript, ESLint flat config, SonarQube Web API, Node.js ESM scripts, Vitest.

**Spec:** Findings from the 2026-09-16 VS Code Problems review in this
conversation.

## Global Constraints

- Do not edit generated/vendor/snapshot files listed in `AGENTS.md`.
- Keep edits limited to `.vscode/**`, `scripts/**`, `tests/unit/config/**`, and
  `package.json` only if a script alias is necessary.
- Keep VS Code settings JSON parseable and avoid comments in JSON files.
- Do not enable Stylelint unless a repo-owned Stylelint config is also added;
  current workspace explicitly disables it.
- Preserve SonarQube connected-mode project settings already present in
  `.vscode/settings.json`.
- Keep SonarQube focused on Clean as You Code by setting
  `sonarlint.focusOnNewCode` to `true`; do not switch it to overall-code legacy
  issue mode.
- Do not let Clean as You Code become amnesia: all Sonar issues returned by the
  project API must be written to a prioritized backlog artifact.
- Do not write `SONAR_TOKEN` or other secrets into repository files, test
  fixtures, task definitions, or generated backlog output.
- Use `globalThis` in handwritten TypeScript tests if browser globals are
  needed.
- Run validation from the repository root.

---

## File Structure

- Modify `.vscode/settings.json`: repo-owned diagnostics defaults for Clean as
  You Code SonarQube focus, ESLint task integration, ESLint working directory,
  explicit validated languages, and workspace TypeScript SDK.
- Modify `.vscode/extensions.json`: recommend the diagnostic extensions the
  workspace depends on.
- Create `.vscode/tasks.json`: expose repeatable Problems-producing tasks for
  TypeScript, ESLint, custom rule citations, and a combined diagnostics task.
- Create `scripts/vscode-rule-citation-problems.mjs`: convert
  `verify-rule-citations.mjs --json` into stable VS Code-compatible diagnostic
  lines.
- Create `scripts/sonar-issues-backlog.mjs`: fetch SonarQube project issues
  through the Web API and write a prioritized backlog artifact.
- Create `analysis/sonar-issues-backlog.md`: generated, durable Sonar backlog
  output that can be reviewed and committed without secrets.
- Create `tests/unit/config/vscodeProblemsConfig.test.ts`: guard the workspace
  settings, recommendations, tasks, and adapter output contract.
- Create `tests/unit/config/sonarBacklog.test.ts`: red/green/amber pressure
  tests for all-issue Sonar backlog capture.
- Create `tests/fixtures/sonar/issues-page-1.json` and
  `tests/fixtures/sonar/issues-page-2.json`: deterministic Sonar issue API
  fixture pages.

---

### Task 1: Pin Workspace Diagnostics Settings

**Files:**

- Modify: `.vscode/settings.json`
- Test: `tests/unit/config/vscodeProblemsConfig.test.ts`

**Interfaces:**

- Consumes: existing `.vscode/settings.json`.
- Produces: workspace overrides for clean-code `sonarlint.focusOnNewCode`,
  `eslint.lintTask.enable`, `eslint.workingDirectories`, `eslint.validate`, and
  `js/ts.tsdk.path`.

- [ ] **Step 1: Add failing config assertions**

Create `tests/unit/config/vscodeProblemsConfig.test.ts` with:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(path.join(repoRoot, relativePath), 'utf8')
  ) as T;
}

describe('VS Code Problems configuration', () => {
  it('keeps workspace diagnostics aligned with clean-code Problems visibility', () => {
    const settings = readJson<Record<string, unknown>>('.vscode/settings.json');

    expect(settings['sonarlint.focusOnNewCode']).toBe(true);
    expect(settings['eslint.enable']).toBe(true);
    expect(settings['eslint.lintTask.enable']).toBe(true);
    expect(settings['eslint.workingDirectories']).toEqual([
      { mode: 'location' },
    ]);
    expect(settings['eslint.validate']).toEqual([
      'javascript',
      'javascriptreact',
      'typescript',
      'typescriptreact',
    ]);
    expect(settings['js/ts.tsdk.path']).toBe('./node_modules/typescript/lib');
  });
});
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: FAIL because `.vscode/settings.json` does not yet contain these
workspace diagnostics settings.

- [ ] **Step 3: Update `.vscode/settings.json`**

Add these top-level settings while preserving existing Cucumber, SonarQube
connected-mode, Ruff, and Python settings:

```json
{
  "js/ts.tsdk.path": "./node_modules/typescript/lib",
  "eslint.enable": true,
  "eslint.lintTask.enable": true,
  "eslint.workingDirectories": [
    {
      "mode": "location"
    }
  ],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "sonarlint.focusOnNewCode": true
}
```

Keep
`"sonarlint.analysisExcludesStandalone": "**/ClientApp/src/api/web-api-client.ts"`
and `"sonarlint.connectedMode.project"` unchanged. `sonarlint.focusOnNewCode`
should be `true` so SonarQube Problems remain focused on clean-code/new-code
issues rather than historical debt.

- [ ] **Step 4: Re-run the targeted test**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Validate JSON manually**

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('.vscode/settings.json', 'utf8')); console.log('settings json ok')"
```

Expected: `settings json ok`.

---

### Task 2: Recommend Required Diagnostic Extensions

**Files:**

- Modify: `.vscode/extensions.json`
- Test: `tests/unit/config/vscodeProblemsConfig.test.ts`

**Interfaces:**

- Consumes: existing `.vscode/extensions.json`.
- Produces: workspace recommendations for `dbaeumer.vscode-eslint` and
  `sonarsource.sonarlint-vscode`.

- [ ] **Step 1: Extend the config test**

Append this test to `tests/unit/config/vscodeProblemsConfig.test.ts`:

```ts
it('recommends extensions that contribute repository diagnostics', () => {
  const extensions = readJson<{ recommendations: string[] }>(
    '.vscode/extensions.json'
  );

  expect(extensions.recommendations).toEqual(
    expect.arrayContaining([
      'ms-playwright.playwright',
      'alexkrechik.cucumberautocomplete',
      'charliermarsh.ruff',
      'dbaeumer.vscode-eslint',
      'sonarsource.sonarlint-vscode',
    ])
  );
});
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: FAIL because ESLint and SonarQube for VS Code are not yet recommended.

- [ ] **Step 3: Update `.vscode/extensions.json`**

Change the recommendations array to:

```json
{
  "recommendations": [
    "ms-playwright.playwright",
    "alexkrechik.cucumberautocomplete",
    "charliermarsh.ruff",
    "dbaeumer.vscode-eslint",
    "sonarsource.sonarlint-vscode"
  ]
}
```

Do not add `stylelint.vscode-stylelint` while `stylelint.enable` remains false
and no repo Stylelint config exists.

- [ ] **Step 4: Re-run the targeted test**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: PASS.

---

### Task 3: Add a VS Code Adapter for Rule-Citation Problems

**Files:**

- Create: `scripts/vscode-rule-citation-problems.mjs`
- Test: `tests/unit/config/vscodeProblemsConfig.test.ts`

**Interfaces:**

- Consumes: `node scripts/verify-rule-citations.mjs --json`.
- Produces: diagnostic lines in the shape
  `<file>(<line>,<column>): <severity> <rule>: [<status>] <message>`.

- [ ] **Step 1: Add adapter contract tests**

Append these tests to `tests/unit/config/vscodeProblemsConfig.test.ts`:

```ts
it('has a VS Code rule-citation adapter script', () => {
  const script = readFileSync(
    path.join(repoRoot, 'scripts/vscode-rule-citation-problems.mjs'),
    'utf8'
  );

  expect(script).toContain('verify-rule-citations.mjs');
  expect(script).toContain('formatProblem');
  expect(script).toContain('MISCITED');
  expect(script).toContain('UNRESOLVED');
});

it('the rule-citation adapter emits VS Code parseable diagnostics', () => {
  const { spawnSync } =
    require('node:child_process') as typeof import('node:child_process');
  const result = spawnSync(
    process.execPath,
    ['scripts/vscode-rule-citation-problems.mjs'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    }
  );

  expect(result.status).toBe(0);
  const diagnosticLines = result.stdout
    .split(/\r?\n/)
    .filter(
      (line) => line.includes('): warning ') || line.includes('): error ')
    );

  expect(diagnosticLines.length).toBeGreaterThan(0);
  expect(diagnosticLines[0]).toMatch(
    /^[^(]+\(\d+,\d+\): (warning|error) RULE-\d+: \[[A-Z_]+\] .+$/
  );
});
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: FAIL because `scripts/vscode-rule-citation-problems.mjs` does not yet
exist.

- [ ] **Step 3: Create the adapter script**

Create `scripts/vscode-rule-citation-problems.mjs`:

```js
#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const CHECKER = 'scripts/verify-rule-citations.mjs';
const ERROR_STATUSES = new Set(['MISCITED', 'PAST_EOF', 'MISSING_FILE']);

function severityFor(status) {
  return ERROR_STATUSES.has(status) ? 'error' : 'warning';
}

function lineFor(result) {
  if (typeof result.cited === 'number' && result.cited > 0) return result.cited;
  if (result.derived && typeof result.derived.start === 'number')
    return result.derived.start;
  return 1;
}

function messageFor(result) {
  const detail = result.detail || 'rule citation needs attention';
  return `[${result.status}] ${detail}`;
}

export function formatProblem(result) {
  const file = result.path || 'analysis/BUSINESS_RULES.md';
  const line = lineFor(result);
  const severity = severityFor(result.status);
  const rule = result.rule || 'RULE-000';
  const message = messageFor(result);

  return `${file}(${line},1): ${severity} ${rule}: ${message}`;
}

const run = spawnSync(process.execPath, [CHECKER, '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (run.error) {
  console.error(
    `analysis/BUSINESS_RULES.md(1,1): error RULE-000: failed to run ${CHECKER}: ${run.error.message}`
  );
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(run.stdout);
} catch (error) {
  console.error(
    `analysis/BUSINESS_RULES.md(1,1): error RULE-000: failed to parse ${CHECKER} --json output: ${error.message}`
  );
  if (run.stdout.trim()) console.error(run.stdout.trim());
  if (run.stderr.trim()) console.error(run.stderr.trim());
  process.exit(1);
}

const problems = payload.results.filter((result) => result.status !== 'OK');
for (const problem of problems) {
  console.log(formatProblem(problem));
}

if (run.stderr.trim()) {
  console.error(run.stderr.trim());
}

process.exit(run.status ?? 0);
```

- [ ] **Step 4: Re-run the targeted test**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run the adapter directly**

Run:

```powershell
node scripts/vscode-rule-citation-problems.mjs
```

Expected: Lines like:

```text
ClientApp/src/routes/preConditions/PreConditions.tsx(64,1): warning RULE-001: [UNRESOLVED] cited 64 unsupported; best match line 77 scores 1 across 3 tied line(s) - too weak to rewrite
```

---

### Task 4: Add Problems-Producing VS Code Tasks

**Files:**

- Create: `.vscode/tasks.json`
- Test: `tests/unit/config/vscodeProblemsConfig.test.ts`

**Interfaces:**

- Consumes: `npm run type-check`, `npm run lint`, and
  `node scripts/vscode-rule-citation-problems.mjs`.
- Produces: VS Code tasks `diagnostics: type-check`, `diagnostics: eslint`,
  `diagnostics: rule citations`, and `diagnostics: all`.

- [ ] **Step 1: Add task configuration tests**

Append this test to `tests/unit/config/vscodeProblemsConfig.test.ts`:

```ts
it('defines VS Code tasks that feed diagnostics into Problems', () => {
  const tasks = readJson<{
    version: string;
    tasks: Array<{
      label: string;
      type?: string;
      script?: string;
      command?: string;
      args?: string[];
      dependsOn?: string[];
      dependsOrder?: string;
      problemMatcher?: unknown;
    }>;
  }>('.vscode/tasks.json');

  expect(tasks.version).toBe('2.0.0');

  const byLabel = new Map(tasks.tasks.map((task) => [task.label, task]));

  expect(byLabel.get('diagnostics: type-check')).toMatchObject({
    type: 'npm',
    script: 'type-check',
    problemMatcher: ['$tsc'],
  });
  expect(byLabel.get('diagnostics: eslint')).toMatchObject({
    type: 'npm',
    script: 'lint',
    problemMatcher: ['$eslint-stylish'],
  });
  expect(byLabel.get('diagnostics: rule citations')).toMatchObject({
    type: 'process',
    command: 'node',
    args: ['scripts/vscode-rule-citation-problems.mjs'],
  });
  expect(byLabel.get('diagnostics: all')?.dependsOn).toEqual([
    'diagnostics: type-check',
    'diagnostics: eslint',
    'diagnostics: rule citations',
  ]);
  expect(byLabel.get('diagnostics: all')?.dependsOrder).not.toBe('sequence');
});
```

- [ ] **Step 2: Run the targeted test and confirm it fails**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: FAIL because `.vscode/tasks.json` does not yet exist.

- [ ] **Step 3: Create `.vscode/tasks.json`**

Create:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "diagnostics: type-check",
      "type": "npm",
      "script": "type-check",
      "problemMatcher": ["$tsc"],
      "group": "build"
    },
    {
      "label": "diagnostics: eslint",
      "type": "npm",
      "script": "lint",
      "problemMatcher": ["$eslint-stylish"],
      "group": "build"
    },
    {
      "label": "diagnostics: rule citations",
      "type": "process",
      "command": "node",
      "args": ["scripts/vscode-rule-citation-problems.mjs"],
      "problemMatcher": {
        "owner": "business-rule-citations",
        "fileLocation": ["relative", "${workspaceFolder}"],
        "pattern": {
          "regexp": "^(.+)\\((\\d+),(\\d+)\\):\\s+(warning|error)\\s+(RULE-\\d+):\\s+(.*)$",
          "file": 1,
          "line": 2,
          "column": 3,
          "severity": 4,
          "code": 5,
          "message": 6
        }
      },
      "group": "build"
    },
    {
      "label": "diagnostics: all",
      "dependsOn": [
        "diagnostics: type-check",
        "diagnostics: eslint",
        "diagnostics: rule citations"
      ],
      "problemMatcher": [],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

- [ ] **Step 4: Re-run the targeted test**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: PASS.

- [ ] **Step 5: Validate task JSON**

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('.vscode/tasks.json', 'utf8')); console.log('tasks json ok')"
```

Expected: `tasks json ok`.

---

### Task 5: Capture All Sonar Issues in a Prioritized Backlog

**Files:**

- Create: `scripts/sonar-issues-backlog.mjs`
- Create: `analysis/sonar-issues-backlog.md`
- Create: `tests/unit/config/sonarBacklog.test.ts`
- Create: `tests/fixtures/sonar/issues-page-1.json`
- Create: `tests/fixtures/sonar/issues-page-2.json`
- Modify: `package.json`

**Interfaces:**

- Consumes: SonarQube Web API issue pages from `/api/issues/search`, using
  `SONAR_HOST_URL`, `SONAR_TOKEN`, and `SONAR_PROJECT_KEY` in live mode.
- Produces: `analysis/sonar-issues-backlog.md`, a prioritized backlog that
  includes every issue returned by the API fixture or live project query.

- [ ] **Step 1: Add Sonar fixture page 1**

Create `tests/fixtures/sonar/issues-page-1.json`:

```json
{
  "paging": {
    "pageIndex": 1,
    "pageSize": 3,
    "total": 5
  },
  "issues": [
    {
      "key": "SONAR-SECURITY-HIGH",
      "rule": "typescript:S2077",
      "component": "gmtestandreview_portalsample:ClientApp/src/routes/paymentDetails.tsx",
      "project": "gmtestandreview_portalsample",
      "line": 42,
      "message": "Make sure using a dynamically formatted SQL query is safe here.",
      "type": "VULNERABILITY",
      "severity": "CRITICAL",
      "impactSeverity": "HIGH",
      "impactSoftwareQuality": "SECURITY",
      "status": "OPEN",
      "effort": "30min",
      "creationDate": "2026-08-20T10:11:12+0000",
      "updateDate": "2026-09-10T05:00:00+0000"
    },
    {
      "key": "SONAR-BUG-MEDIUM",
      "rule": "typescript:S2259",
      "component": "gmtestandreview_portalsample:ClientApp/src/utils/index.ts",
      "project": "gmtestandreview_portalsample",
      "line": 77,
      "message": "Null pointers should not be dereferenced.",
      "type": "BUG",
      "severity": "MAJOR",
      "impactSeverity": "MEDIUM",
      "impactSoftwareQuality": "RELIABILITY",
      "status": "CONFIRMED",
      "effort": "15min",
      "creationDate": "2026-08-21T10:11:12+0000",
      "updateDate": "2026-09-11T05:00:00+0000"
    },
    {
      "key": "SONAR-ACCEPTED-LOW",
      "rule": "typescript:S3776",
      "component": "gmtestandreview_portalsample:ClientApp/src/routes/dashboard/index.tsx",
      "project": "gmtestandreview_portalsample",
      "line": 101,
      "message": "Refactor this function to reduce its cognitive complexity.",
      "type": "CODE_SMELL",
      "severity": "MINOR",
      "impactSeverity": "LOW",
      "impactSoftwareQuality": "MAINTAINABILITY",
      "status": "ACCEPTED",
      "effort": "45min",
      "creationDate": "2026-07-01T10:11:12+0000",
      "updateDate": "2026-09-01T05:00:00+0000"
    }
  ]
}
```

- [ ] **Step 2: Add Sonar fixture page 2**

Create `tests/fixtures/sonar/issues-page-2.json`:

```json
{
  "paging": {
    "pageIndex": 2,
    "pageSize": 3,
    "total": 5
  },
  "issues": [
    {
      "key": "SONAR-UNKNOWN-SEVERITY",
      "rule": "typescript:S9999",
      "component": "gmtestandreview_portalsample:ClientApp/src/components/RequestList/requestItem.tsx",
      "project": "gmtestandreview_portalsample",
      "line": 12,
      "message": "This fixture represents a future Sonar issue shape.",
      "type": "CODE_SMELL",
      "severity": "UNKNOWN",
      "status": "OPEN",
      "effort": "5min",
      "creationDate": "2026-09-01T10:11:12+0000",
      "updateDate": "2026-09-12T05:00:00+0000"
    },
    {
      "key": "SONAR-INFO-LOW",
      "rule": "typescript:S1481",
      "component": "gmtestandreview_portalsample:ClientApp/src/routes/quotation/index.tsx",
      "project": "gmtestandreview_portalsample",
      "line": 120,
      "message": "Remove this unused local variable.",
      "type": "CODE_SMELL",
      "severity": "INFO",
      "impactSeverity": "LOW",
      "impactSoftwareQuality": "MAINTAINABILITY",
      "status": "OPEN",
      "effort": "2min",
      "creationDate": "2026-09-02T10:11:12+0000",
      "updateDate": "2026-09-13T05:00:00+0000"
    }
  ]
}
```

- [ ] **Step 3: Add failing Red/Green/Amber backlog tests**

Create `tests/unit/config/sonarBacklog.test.ts`:

```ts
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const CHILD_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 45_000;

function runBacklog() {
  const outputDirectory = mkdtempSync(path.join(tmpdir(), 'sonar-backlog-'));
  const outputPath = path.join(outputDirectory, 'sonar-issues-backlog.md');
  const result = spawnSync(
    process.execPath,
    [
      'scripts/sonar-issues-backlog.mjs',
      '--fixture',
      'tests/fixtures/sonar',
      '--out',
      outputPath,
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: CHILD_TIMEOUT_MS,
    }
  );

  return {
    result,
    output: result.status === 0 ? readFileSync(outputPath, 'utf8') : '',
  };
}

describe('Sonar all-issue backlog pressure tests', () => {
  it(
    'RED: keeps every Sonar issue returned by every fixture page',
    () => {
      const { result, output } = runBacklog();

      expect(result.status, result.stderr).toBe(0);
      expect(output).toContain('SONAR-SECURITY-HIGH');
      expect(output).toContain('SONAR-BUG-MEDIUM');
      expect(output).toContain('SONAR-ACCEPTED-LOW');
      expect(output).toContain('SONAR-UNKNOWN-SEVERITY');
      expect(output).toContain('SONAR-INFO-LOW');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'GREEN: prioritises security and reliability ahead of low maintainability work',
    () => {
      const { output } = runBacklog();

      expect(output.indexOf('SONAR-SECURITY-HIGH')).toBeLessThan(
        output.indexOf('SONAR-BUG-MEDIUM')
      );
      expect(output.indexOf('SONAR-BUG-MEDIUM')).toBeLessThan(
        output.indexOf('SONAR-INFO-LOW')
      );
    },
    TEST_TIMEOUT_MS
  );

  it(
    'AMBER: preserves unknown future Sonar shapes as triage work instead of dropping them',
    () => {
      const { result, output } = runBacklog();

      expect(result.stdout).toContain('AMBER');
      expect(output).toContain('Needs triage');
      expect(output).toContain('SONAR-UNKNOWN-SEVERITY');
    },
    TEST_TIMEOUT_MS
  );

  it(
    'RED: never writes authentication material into the backlog artifact',
    () => {
      const { output } = runBacklog();

      expect(output).not.toContain('SONAR_TOKEN');
      expect(output).not.toContain('Bearer ');
    },
    TEST_TIMEOUT_MS
  );
});
```

- [ ] **Step 4: Run the Sonar backlog tests and confirm they fail**

Run:

```powershell
npm run test:unit -- tests/unit/config/sonarBacklog.test.ts
```

Expected: FAIL because `scripts/sonar-issues-backlog.mjs` does not yet exist.

- [ ] **Step 5: Create the Sonar backlog script**

Create `scripts/sonar-issues-backlog.mjs`:

```js
#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_OUT = 'analysis/sonar-issues-backlog.md';
const PAGE_SIZE = 500;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function rankIssue(issue) {
  const impactSeverity =
    issue.impactSeverity ?? issue.impactSeverities?.[0] ?? '';
  const legacySeverity = issue.severity ?? '';
  const quality =
    issue.impactSoftwareQuality ?? issue.impactSoftwareQualities?.[0] ?? '';
  const type = issue.type ?? '';

  if (quality === 'SECURITY' || type === 'VULNERABILITY') {
    return impactSeverity === 'HIGH' ||
      ['BLOCKER', 'CRITICAL'].includes(legacySeverity)
      ? 'P0'
      : 'P1';
  }
  if (quality === 'RELIABILITY' || type === 'BUG') {
    return impactSeverity === 'HIGH' ||
      ['BLOCKER', 'CRITICAL'].includes(legacySeverity)
      ? 'P1'
      : 'P2';
  }
  if (impactSeverity === 'HIGH' || legacySeverity === 'MAJOR') return 'P2';
  if (impactSeverity === 'MEDIUM' || legacySeverity === 'MINOR') return 'P3';
  if (impactSeverity === 'LOW' || legacySeverity === 'INFO') return 'P4';
  return 'Needs triage';
}

function issuePath(issue) {
  const component = issue.component ?? '';
  const colon = component.indexOf(':');
  return colon === -1 ? component : component.slice(colon + 1);
}

function normalizeIssue(issue) {
  return {
    key: issue.key,
    priority: rankIssue(issue),
    status: issue.issueStatus ?? issue.status ?? 'UNKNOWN',
    severity: issue.impactSeverity ?? issue.severity ?? 'UNKNOWN',
    quality: issue.impactSoftwareQuality ?? issue.type ?? 'UNKNOWN',
    rule: issue.rule ?? 'UNKNOWN_RULE',
    path: issuePath(issue),
    line: issue.line ?? 1,
    effort: issue.effort ?? '',
    message: issue.message ?? '',
    updated: issue.updateDate ?? '',
  };
}

function priorityWeight(priority) {
  return (
    {
      P0: 0,
      P1: 1,
      P2: 2,
      P3: 3,
      P4: 4,
      'Needs triage': 5,
    }[priority] ?? 6
  );
}

function formatMarkdown(issues) {
  const rows = issues
    .map(normalizeIssue)
    .sort(
      (a, b) =>
        priorityWeight(a.priority) - priorityWeight(b.priority) ||
        a.status.localeCompare(b.status) ||
        a.key.localeCompare(b.key)
    );

  const amberCount = rows.filter(
    (issue) => issue.priority === 'Needs triage'
  ).length;
  const lines = [
    '# Sonar Issues Backlog',
    '',
    '> Generated by `node scripts/sonar-issues-backlog.mjs`. Do not add secrets to this file.',
    '',
    `Total issues captured: ${rows.length}`,
    `Needs triage: ${amberCount}`,
    '',
    '| Priority | Key | Status | Severity | Quality | Rule | Location | Effort | Message |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const issue of rows) {
    lines.push(
      `| ${issue.priority} | ${issue.key} | ${issue.status} | ${issue.severity} | ${issue.quality} | ${issue.rule} | ${issue.path}:${issue.line} | ${issue.effort} | ${issue.message.replaceAll('|', '\\|')} |`
    );
  }

  return `${lines.join('\n')}\n`;
}

function readFixtureIssues(fixtureDirectory) {
  return readdirSync(fixtureDirectory)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .flatMap((file) => {
      const payload = JSON.parse(
        readFileSync(path.join(fixtureDirectory, file), 'utf8')
      );
      return payload.issues ?? [];
    });
}

async function fetchLiveIssues() {
  const host = process.env.SONAR_HOST_URL;
  const token = process.env.SONAR_TOKEN;
  const projectKey = process.env.SONAR_PROJECT_KEY;

  if (!host || !token || !projectKey) {
    throw new Error(
      'Set SONAR_HOST_URL, SONAR_TOKEN, and SONAR_PROJECT_KEY, or run with --fixture <dir>.'
    );
  }

  const issues = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (issues.length < total) {
    const url = new URL('/api/issues/search', host);
    url.searchParams.set('componentKeys', projectKey);
    url.searchParams.set('p', String(page));
    url.searchParams.set('ps', String(PAGE_SIZE));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(
        `Sonar API request failed ${response.status}: ${await response.text()}`
      );
    }

    const payload = await response.json();
    issues.push(...(payload.issues ?? []));
    total = payload.paging?.total ?? payload.total ?? issues.length;
    page += 1;
  }

  return issues;
}

const fixtureDirectory = argValue('--fixture');
const outputPath = argValue('--out') ?? DEFAULT_OUT;
const issues = fixtureDirectory
  ? readFixtureIssues(fixtureDirectory)
  : await fetchLiveIssues();
const markdown = formatMarkdown(issues);
const outputDirectory = path.dirname(outputPath);

if (!existsSync(outputDirectory))
  mkdirSync(outputDirectory, { recursive: true });
writeFileSync(outputPath, markdown, 'utf8');

if (issues.some((issue) => rankIssue(issue) === 'Needs triage')) {
  console.log(
    'analysis/sonar-issues-backlog.md(1,1): warning SONAR-BACKLOG: [AMBER] backlog contains Sonar issues with unknown severity/quality fields; triage them manually.'
  );
}
console.log(`Captured ${issues.length} Sonar issue(s) in ${outputPath}.`);
```

- [ ] **Step 6: Add package scripts**

Add these scripts to `package.json`:

```json
"sonar:backlog": "node scripts/sonar-issues-backlog.mjs",
"sonar:backlog:test-fixture": "node scripts/sonar-issues-backlog.mjs --fixture tests/fixtures/sonar --out analysis/sonar-issues-backlog.md"
```

- [ ] **Step 7: Generate the initial fixture-backed backlog**

Run:

```powershell
npm run sonar:backlog:test-fixture
```

Expected: `analysis/sonar-issues-backlog.md` exists and includes all five
fixture issues.

- [ ] **Step 8: Re-run the Sonar backlog tests**

Run:

```powershell
npm run test:unit -- tests/unit/config/sonarBacklog.test.ts
```

Expected: PASS.

- [ ] **Step 9: Run live backlog capture when credentials are available**

Run:

```powershell
$env:SONAR_HOST_URL = "https://sonarcloud.io"
$env:SONAR_PROJECT_KEY = "gmtestandreview_portalsample"
$env:SONAR_TOKEN = "<user token with Browse permission>"
npm run sonar:backlog
```

Expected: `analysis/sonar-issues-backlog.md` is regenerated from live Sonar
issues. Do not commit or paste the token.

---

### Task 6: Add Red/Green/Amber Pressure Tests for the Plan Itself

**Files:**

- Modify: `tests/unit/config/vscodeProblemsConfig.test.ts`
- Modify: `.vscode/tasks.json`
- Test: `tests/unit/config/vscodeProblemsConfig.test.ts`,
  `tests/unit/config/sonarBacklog.test.ts`

**Interfaces:**

- Consumes: completed Tasks 1-5.
- Produces: plan-level Red/Green/Amber tests that prevent diagnostic visibility
  regressions under pressure.

- [ ] **Step 1: Add RED pressure tests for hidden diagnostics**

Append this test to `tests/unit/config/vscodeProblemsConfig.test.ts`:

```ts
it('RED: the combined diagnostics task does not fail fast before later problem sources run', () => {
  const tasks = readJson<{
    tasks: Array<{
      label: string;
      dependsOn?: string[];
      dependsOrder?: string;
    }>;
  }>('.vscode/tasks.json');

  const allDiagnostics = tasks.tasks.find(
    (task) => task.label === 'diagnostics: all'
  );

  expect(allDiagnostics?.dependsOn).toEqual([
    'diagnostics: type-check',
    'diagnostics: eslint',
    'diagnostics: rule citations',
    'diagnostics: sonar backlog',
  ]);
  expect(allDiagnostics?.dependsOrder).not.toBe('sequence');
});
```

- [ ] **Step 2: Add GREEN pressure tests for expected task coverage**

Append this test to `tests/unit/config/vscodeProblemsConfig.test.ts`:

```ts
it('GREEN: exposes every repository diagnostic source as a runnable VS Code task', () => {
  const tasks = readJson<{ tasks: Array<{ label: string }> }>(
    '.vscode/tasks.json'
  );
  const labels = tasks.tasks.map((task) => task.label);

  expect(labels).toEqual(
    expect.arrayContaining([
      'diagnostics: type-check',
      'diagnostics: eslint',
      'diagnostics: rule citations',
      'diagnostics: sonar backlog',
      'diagnostics: all',
    ])
  );
});
```

- [ ] **Step 3: Add AMBER pressure tests for intentional clean-code filtering**

Append this test to `tests/unit/config/vscodeProblemsConfig.test.ts`:

```ts
it('AMBER: keeps Sonar editor Problems clean-code focused while requiring a full backlog task', () => {
  const settings = readJson<Record<string, unknown>>('.vscode/settings.json');
  const tasks = readJson<{ tasks: Array<{ label: string }> }>(
    '.vscode/tasks.json'
  );

  expect(settings['sonarlint.focusOnNewCode']).toBe(true);
  expect(
    tasks.tasks.some((task) => task.label === 'diagnostics: sonar backlog')
  ).toBe(true);
});
```

- [ ] **Step 4: Update `.vscode/tasks.json` to include the Sonar backlog task**

Add this task before `diagnostics: all`:

```json
{
  "label": "diagnostics: sonar backlog",
  "type": "npm",
  "script": "sonar:backlog",
  "problemMatcher": {
    "owner": "sonar-backlog",
    "fileLocation": ["relative", "${workspaceFolder}"],
    "pattern": {
      "regexp": "^(.+)\\((\\d+),(\\d+)\\):\\s+(warning|error)\\s+(SONAR-BACKLOG):\\s+(.*)$",
      "file": 1,
      "line": 2,
      "column": 3,
      "severity": 4,
      "code": 5,
      "message": 6
    }
  },
  "group": "build"
}
```

Then update `diagnostics: all.dependsOn` to:

```json
[
  "diagnostics: type-check",
  "diagnostics: eslint",
  "diagnostics: rule citations",
  "diagnostics: sonar backlog"
]
```

Keep `dependsOrder` absent so VS Code can run child tasks without intentional
sequence fail-fast.

- [ ] **Step 5: Re-run pressure tests**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts tests/unit/config/sonarBacklog.test.ts
```

Expected: PASS.

---

### Task 7: Final Verification and Manual VS Code Check

**Files:**

- No new files.
- Verify: `.vscode/settings.json`, `.vscode/extensions.json`,
  `.vscode/tasks.json`, `scripts/vscode-rule-citation-problems.mjs`,
  `scripts/sonar-issues-backlog.mjs`, `analysis/sonar-issues-backlog.md`,
  `tests/unit/config/vscodeProblemsConfig.test.ts`,
  `tests/unit/config/sonarBacklog.test.ts`

**Interfaces:**

- Consumes: completed Tasks 1-6.
- Produces: verified workspace diagnostics behavior and a durable prioritized
  Sonar issue backlog.

- [ ] **Step 1: Run focused unit tests**

Run:

```powershell
npm run test:unit -- tests/unit/config/vscodeProblemsConfig.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run baseline diagnostics commands**

Run:

```powershell
npm run type-check
npm run lint
npm run lint:mdx
npm run lint:rules
node scripts/vscode-rule-citation-problems.mjs
npm run sonar:backlog:test-fixture
```

Expected:

- `type-check`: exit 0.
- `lint`: exit 0.
- `lint:mdx`: exit 0.
- `lint:rules`: exit 0 with the current baseline counts unless the baseline
  changed.
- adapter script: exit 0 and emits VS Code parseable warning lines for current
  non-OK rule citations.
- `sonar:backlog:test-fixture`: exit 0 and regenerates
  `analysis/sonar-issues-backlog.md` with all fixture issues.

- [ ] **Step 3: Run full unit suite if time allows**

Run:

```powershell
npm run test:unit
```

Expected: PASS.

- [ ] **Step 4: Manual VS Code verification**

In VS Code:

1. Reload the workspace.
2. Install recommended extensions if prompted.
3. Run `Tasks: Run Build Task`.
4. Select or accept `diagnostics: all`.
5. Open the Problems panel.
6. Clear any active Problems filters, owner filters, and file filters before
   judging missing entries.

Expected:

- TypeScript problems appear when `npm run type-check` finds any.
- ESLint problems appear when `npm run lint` finds any.
- Business-rule citation warnings appear under owner `business-rule-citations`.
- SonarQube intentionally shows clean-code/new-code issues because workspace
  `sonarlint.focusOnNewCode` is true.
- Sonar backlog amber warnings appear under owner `sonar-backlog` when unknown
  issue shapes need manual triage.
- `analysis/sonar-issues-backlog.md` captures all live Sonar issues after
  `npm run sonar:backlog` is run with valid credentials.

- [ ] **Step 5: Commit**

Run:

```powershell
git add .vscode/settings.json .vscode/extensions.json .vscode/tasks.json package.json scripts/vscode-rule-citation-problems.mjs scripts/sonar-issues-backlog.mjs analysis/sonar-issues-backlog.md tests/unit/config/vscodeProblemsConfig.test.ts tests/unit/config/sonarBacklog.test.ts tests/fixtures/sonar/issues-page-1.json tests/fixtures/sonar/issues-page-2.json
git commit -m "chore: surface workspace diagnostics in VS Code"
```
