# Dependency Overrides Rationalisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `package.json` overrides to the smallest evidence-backed set,
fix every override that now pins a _vulnerable_ version, and keep the
security-floor tests, npm reproducibility, and CI policy intact.

**Architecture:** Treat overrides as security-policy exceptions, not general
pins. Update tests to encode current advisory floors first, then remove
overrides whose natural resolution is patched in one lockfile regeneration, and
keep only overrides that demonstrably stop a vulnerable or deprecated transitive
from returning.

**Tech Stack:** npm 11.19.1 (`packageManager`), Node >=24.0.0, package-lock v3,
Vitest 4.1.11, npm `overrides`, `npm audit`, `npm explain`.

**Spec:** Conversation request on 2026-09-10 (inspect overrides, rubric, Devil's
Advocate review). **Revised 2026-10-07** against the current `package.json`,
installed tree, `npm audit`, and `npm outdated`.

## What Changed Since the 2026-09-10 Draft

The first draft's "remove" evidence is stale. As of 2026-10-07 several overrides
pin versions now **inside advisory ranges**:

| Override            | Pinned | Now-vulnerable range | Patched version on registry |
| ------------------- | ------ | -------------------- | --------------------------- |
| `brace-expansion@1` | 1.1.18 | `<=1.1.20`           | 1.1.21                      |
| `brace-expansion@2` | 2.1.4  | `2.0.0 - 2.1.6`      | 2.1.7                       |
| `brace-expansion@5` | 5.0.9  | `4.0.0 - 5.0.11`     | 5.0.12                      |
| `fast-uri`          | 3.1.7  | `3.0.0 - 3.1.7`      | 3.1.8                       |
| `undici`            | 7.29.0 | `7.0.0 - 7.29.0`     | 7.29.1, 7.30.0              |

Other drift: `@mizchi/lsmcp.glob` is already in `package.json` (no longer
"Add"); `js-yaml` is already `4.3.2` (draft said `4.3.1`); `postcss` is `8.5.28`
(draft `8.5.26`); `express` resolves `4.22.3`; `@sonar/scan` is `5.0.1` and
audit now reports `node-forge`, not `adm-zip`. The draft's Task 3 override
replacement has **not** been applied.

## Current Configuration Snapshot (2026-10-07)

- Branch `refactor/formik-removal-steps-1-2`, worktree clean at session start.
- Local Node v24.20.0; local npm **11.17.0** vs `packageManager` **11.19.1**
  (see Constraints).
- `package.json` overrides today (17): `@mizchi/lsmcp.glob`,
  `@npmcli/map-workspaces.glob`, `@npmcli/package-json.glob`,
  `unified-engine.glob` (all `13.0.6`), `body-parser 1.20.6`,
  `brace-expansion@1 1.1.18`, `@2 2.1.4`, `@5 5.0.9`, `browserslist 4.28.8`,
  `fast-uri 3.1.7`, `js-yaml 4.3.2`, `nanoid 3.3.18`, `postcss 8.5.28`,
  `qs 6.16.0`, `undici 7.29.0`, `uuid ^11.1.1`, `valibot 1.4.2`.
- `tests/unit/config/dependencySecurity.test.ts` floors (line ~110):
  `nanoid 3.3.18`, `postcss 8.5.23`, `fast-uri 3.1.5`, `js-yaml 4.3.1`,
  `valibot 1.4.2`, `undici 7.29.0`, `body-parser 1.20.6`.
- `npm audit`: **25 findings (2 critical, 16 high, 7 moderate)**; see
  [Audit Triage](#audit-triage).
- Registry: `body-parser` 1.x line `1.20.8`; `browserslist 4.29.3`; `nanoid`
  legacy `3.3.20`; `postcss 8.5.29`; `qs 6.16.0`; `uuid` 11.x line `11.1.1`;
  `valibot 1.5.0`; `js-yaml` v4 line `4.3.2`.
- `npm outdated`: in-range updates exist for the Storybook 10.6.1 family,
  `vite 8.3.3`, `sass 1.105.1`, `@chromatic-com/storybook 5.4.0`,
  `typescript-language-server 6.0.1`. Majors (React 19, Vitest 5, TypeScript 7,
  react-router 8, msw 3, etc.) are **out of scope**.

## Global Constraints

- Do not edit generated or vendored app sources.
- Do not change `packageManager`, `engines`, `devEngines`, `allowScripts`, or
  root `postinstall`.
- Do not hand-edit `package-lock.json`; regenerate with npm **11.19.1** (match
  `packageManager` via `corepack`; local 11.17.0 can cause lockfile churn).
- Preserve `npm ci` compatibility and the patch-package postinstall path.
- Work on an isolated branch:
  `git switch -c chore/deps-overrides-rationalisation` from a clean tree (or use
  `using-git-worktrees`). Do not mix with the Formik-removal branch.
- Exact-pinned dev dependencies (`storybook`, `@storybook/addon-a11y`, `vitest`,
  etc.) stay exact; do not let `syncpack` rewrite them to `^`.
- A retained override needs an owner: active advisory, publisher deprecation,
  compatibility workaround, or documented exception.
- A removed override must be validated by lockfile resolution **and** the
  dependency security regression test.
- Minimal-overrides principle: if the patched version resolves naturally within
  the parent range, remove the override.
- An override pinned to a vulnerable version is a defect: remove it or raise it.

---

## Rubric

Score each override 0-2 per criterion. Keep only if total >= 6, or if one
criterion exposes a current audit finding.

| Criterion          | 0                                                              | 1                                 | 2                                                          |
| ------------------ | -------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| Security need      | No advisory or deprecation prevented                           | Historical advisory only          | Current audit/deprecation returns if removed               |
| Resolver necessity | Natural resolution identical without override                  | Same version, different placement | Vulnerable/deprecated version returns without override     |
| Compatibility risk | Pins behind natural safe version, or pins a vulnerable version | Unknown behavioural impact        | Known compatible, covered by tests                         |
| Maintenance cost   | Broad/global stale pin                                         | Narrow but artificial             | Owner-scoped or exact floor with removal rule              |
| Test coverage      | No regression guard                                            | Covered indirectly                | Covered by `dependencySecurity.test.ts` or focused command |

## Override Decisions (revised)

Decisions marked "re-verify" or "Remove" are hypotheses confirmed by the Task 3
resolution; the fallback column is the action if natural resolution is not
patched.

| Override                             | Decision         | Evidence (2026-10-07)                                                                                                         | Fallback                                                            |
| ------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `@mizchi/lsmcp.glob 13.0.6`          | Keep             | Already present; policy test rejects `glob@10`; `glob@13.0.6` is latest.                                                      | n/a                                                                 |
| `@npmcli/map-workspaces.glob 13.0.6` | Keep             | Same deprecated-glob risk.                                                                                                    | n/a                                                                 |
| `@npmcli/package-json.glob 13.0.6`   | Keep             | Same.                                                                                                                         | n/a                                                                 |
| `unified-engine.glob 13.0.6`         | Keep             | Same.                                                                                                                         | n/a                                                                 |
| `body-parser 1.20.6`                 | Remove           | Behind 1.x latest `1.20.8`; owner `express@4.22.3`.                                                                           | Raise to `1.20.8`.                                                  |
| `brace-expansion@1/@2/@5`            | Remove all three | Pins are in advisory ranges; parent ranges (`^1.1.7`, `^2.0.2`, `^5.0.8`) admit 1.1.21 / 2.1.7 / 5.0.12.                      | Re-add `@1 1.1.21`, `@2 2.1.7`, `@5 5.0.12`.                        |
| `browserslist 4.28.8`                | Remove           | Behind `4.29.3`; no advisory.                                                                                                 | none                                                                |
| `fast-uri 3.1.7`                     | Remove           | In advisory range; `ajv@8.20.0` requires `^3.0.1`, admits 3.1.8.                                                              | Re-add `fast-uri 3.1.8`.                                            |
| `js-yaml 4.3.2`                      | Remove           | `cosmiconfig` range `^4.1.0` resolves 4.3.2 (v4 latest).                                                                      | Re-add `js-yaml 4.3.2`.                                             |
| `nanoid 3.3.18`                      | Remove           | Legacy line has `3.3.20`; no advisory.                                                                                        | none                                                                |
| `postcss 8.5.28`                     | Remove           | Latest `8.5.29`; no advisory.                                                                                                 | none                                                                |
| `undici 7.29.0`                      | Remove           | In advisory range; `jsdom@29.1.1` requires `^7.25.0`; inspect `@qdrant/js-client-rest@1.19.0` edge with `npm explain undici`. | Re-add `undici 7.30.0`, scoped to the owner pinning exactly 7.29.0. |
| `qs 6.16.0`                          | Keep, re-verify  | `6.16.0` is latest; `express@4.22.3` may now resolve it.                                                                      | Remove if natural resolution is `>=6.16.0`.                         |
| `uuid ^11.1.1`                       | Keep, re-verify  | `sockjs@0.3.24` (latest) still needs it.                                                                                      | Remove only if no `uuid <11.1.1` appears.                           |
| `valibot 1.4.2`                      | Keep, re-verify  | Storybook MCP chain; `1.5.0` exists.                                                                                          | Moving to `1.5.0` is a separate Storybook MCP task.                 |

## Retained Override Removal Criteria

| Override                                  | Why it remains                                          | Removal criteria                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Four owner-scoped `glob 13.0.6` overrides | Prevent deprecated `glob@10.5.0` in MCP/remark tooling. | Remove per owner when it naturally resolves `glob >=13`. Validate `npm ls glob`, `npm run lint:mdx`, `lsmcp` focused commands. |
| `qs 6.16.0` (if retained)                 | Prevents vulnerable `qs@6.15.x` via Express 4.          | Remove when Express resolves `qs >=6.16.0`. Validate `npm audit`, `npm ls qs`, `npm run test:e2e:app`.                         |
| `uuid ^11.1.1` (if retained)              | Prevents `uuid@8.3.2` via `sockjs@0.3.24`.              | Remove when `sockjs`/`webpack-dev-server` resolves `uuid >=11.1.1` or drops it.                                                |
| `valibot 1.4.2`                           | Prevents `valibot@1.2.0` via Storybook MCP.             | Remove when Storybook MCP resolves `valibot >1.4.1`.                                                                           |

## Audit Triage

| Finding                                                                                                                                                      | Severity     | Class                                                                                             | Action                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `brace-expansion` (+ `minimatch`)                                                                                                                            | high         | Override-caused                                                                                   | Task 3                                                    |
| `fast-uri` (+ `ajv`, `schema-utils`, `webpack`)                                                                                                              | moderate     | Override-caused                                                                                   | Task 3. Ignore audit's "downgrade webpack" remedy.        |
| `undici` (+ `jsdom`, `@qdrant/js-client-rest`)                                                                                                               | high         | Override-caused                                                                                   | Task 3. Ignore audit's "downgrade qdrant" remedy.         |
| `proxy-addr` 2.0.7                                                                                                                                           | **critical** | Lock-only fix (2.0.8)                                                                             | Task 4                                                    |
| `shell-quote` 1.9.0 (via `launch-editor`)                                                                                                                    | **critical** | Lock-only fix (1.12.0)                                                                            | Task 4                                                    |
| `compression` 1.8.1                                                                                                                                          | high         | Lock-only fix (1.8.2)                                                                             | Task 4                                                    |
| `source-map-js`                                                                                                                                              | high         | Lock-only fix (1.2.2)                                                                             | Task 4                                                    |
| `postcss-selector-parser`                                                                                                                                    | moderate     | Lock-only fix (7.1.6)                                                                             | Task 4                                                    |
| `braces`, `micromatch`, `chokidar`, `http-proxy-middleware`, `unified-args`, `remark-cli`, `webpack-dev-server`, `find-yarn-workspace-root`, `patch-package` | high         | No in-range fix (`braces@3.0.3` is latest); needs `webpack-dev-server@6` or `patch-package` major | Out of scope; accepted dev-only risk, recorded in Task 7. |
| `node-forge` (+ `@sonar/scan`)                                                                                                                               | high         | No fix; `@sonar/scan@5.0.1` pins `node-forge@1.4.0`                                               | Task 7                                                    |

---

## Tasks

### Task 1: Preflight and Baseline Evidence

**Files:**

- Read: `package.json`, `package-lock.json`,
  `tests/unit/config/dependencySecurity.test.ts`
- Create: `reports/security/overrides-audit.before.json`,
  `reports/security/overrides-tree.before.txt` (ignored report output)

- [x] **Step 1: Isolate the work**

```powershell
git status --short
git switch -c chore/deps-overrides-rationalisation
```

Expected: `git status --short` prints nothing; branch created.

- [x] **Step 2: Match the pinned npm version**

```powershell
corepack enable
corepack prepare npm@11.19.1 --activate
npm -v
```

Expected: `11.19.1`. If corepack is unavailable, record the version mismatch in
the PR description and expect lockfile churn.

Executed: `corepack enable` failed (EPERM writing the `C:\Program Files\nodejs`
shims) and PATH npm stayed 11.17.0, so every lockfile-affecting command ran via
`npx --yes npm@11.19.1` (also `corepack npm`).

- [x] **Step 3: Record audit and tree**

```powershell
New-Item -ItemType Directory -Force reports/security | Out-Null
npm audit --json > reports/security/overrides-audit.before.json
npm ls glob body-parser brace-expansion browserslist fast-uri js-yaml nanoid postcss qs undici uuid valibot proxy-addr shell-quote compression source-map-js postcss-selector-parser --all > reports/security/overrides-tree.before.txt
```

Expected: audit exits non-zero with 25 findings (2 critical, 16 high, 7
moderate); `npm ls` exits 0.

Executed: the baseline was actually 26 findings (2 critical, 16 high, 8
moderate).

### Task 2: Update Security Floors First (RED)

**Files:**

- Modify: `tests/unit/config/dependencySecurity.test.ts` (the `minimumVersions`
  map near line 110)

**Interfaces:** Consumes the Audit Triage table; produces tests that fail on
today's tree.

- [x] **Step 1: Read the surrounding test pattern**

Read `tests/unit/config/dependencySecurity.test.ts` lines 1-130 to reuse the
existing `installedVersions()` helper, imports, and the
`it.each([...minimumVersions])` pattern. Do not invent helpers.

- [x] **Step 2: Raise and add single-line floors**

Replace the map body with (keeping the file's quote style):

```ts
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
```

- [x] **Step 3: Add a per-major `brace-expansion` floor test**

`brace-expansion` has three majors installed, so one minimum cannot express it.
Add after the `it.each` block, inside the same `describe`, using the existing
`installedVersions` helper. The repo has `semver 7.8.5` as a devDependency; add
`import semver from 'semver'` only if the file does not already import it:

```ts
it('brace-expansion resolves only patched versions per major', () => {
  const floors = new Map([
    [1, '1.1.21'],
    [2, '2.1.7'],
    [5, '5.0.12'],
  ]);
  const versions = installedVersions('brace-expansion');

  expect(versions).not.toHaveLength(0);
  for (const version of versions) {
    const floor = floors.get(semver.major(version));
    expect(
      floor,
      `unexpected brace-expansion major in ${version}`
    ).toBeDefined();
    expect(
      semver.gte(version, floor as string),
      `brace-expansion@${version} must be at least ${floor}`
    ).toBe(true);
  }
});
```

- [x] **Step 4: Confirm RED**

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
```

Expected: FAIL for `fast-uri` (3.1.7), `undici` (7.29.0), `brace-expansion`
(1.1.18/2.1.4/5.0.9), `proxy-addr` (2.0.7), `shell-quote` (1.9.0), `compression`
(1.8.1), and likely `source-map-js` / `postcss-selector-parser`. `js-yaml`
passes (already 4.3.2).

- [x] **Step 5: Commit**

```powershell
git add tests/unit/config/dependencySecurity.test.ts
git commit -m "test: raise transitive security floors to current advisories"
```

### Task 3: Rationalise Overrides (GREEN)

**Files:**

- Modify: `package.json` (`overrides` only)
- Modify: `package-lock.json` (npm-generated)

- [x] **Step 1: Replace the overrides object**

Set `overrides` to exactly:

> Executed overrides differ from this block: two fallbacks were added
> (`brace-expansion@5 5.0.12`, `undici 7.30.0`) and `qs` was removed. See
> Execution Notes.

```json
"overrides": {
  "@mizchi/lsmcp": {
    "glob": "13.0.6"
  },
  "@npmcli/map-workspaces": {
    "glob": "13.0.6"
  },
  "@npmcli/package-json": {
    "glob": "13.0.6"
  },
  "qs": "6.16.0", // NOT applied: qs override removed during execution (see Execution Notes)
  "unified-engine": {
    "glob": "13.0.6"
  },
  "uuid": "^11.1.1",
  "valibot": "1.4.2"
}
```

- [x] **Step 2: Regenerate the lockfile so removed pins re-resolve**

```powershell
npm install --package-lock-only
```

Expected: succeeds. Lock-only installs keep resolutions that still satisfy
ranges, so if a removed pin's old version stays in `package-lock.json`, update
just those packages:

```powershell
npm update brace-expansion fast-uri undici body-parser browserslist nanoid postcss js-yaml --package-lock-only
```

- [x] **Step 3: Check natural resolution and apply fallbacks**

```powershell
npm ls brace-expansion fast-uri undici body-parser js-yaml --all
npm explain undici
```

Expected: `brace-expansion` only 1.1.21+/2.1.7+/5.0.12+; `fast-uri` 3.1.8+;
`undici` 7.29.1+; `js-yaml` 4.3.2. For any package still below its floor, apply
that row's **Fallback** from the Override Decisions table (add only that single
override), then rerun Step 2. Record each fallback used under "Execution Notes"
at the end of this plan.

- [x] **Step 4: Test whether `qs` and `uuid` overrides are still needed**

Temporarily remove `qs`, run `npm install --package-lock-only` and
`npm ls qs --all`; then do the same for `uuid`. If `qs` resolves `>=6.16.0` (or
`uuid` `>=11.1.1`) everywhere without the override, leave it removed and delete
its row from Retained Override Removal Criteria; otherwise restore it.

- [x] **Step 5: Install and run the floor test (GREEN)**

```powershell
npm install
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
```

Expected: install succeeds (the existing `html-react-parser` patch-package
warning may remain); floor test passes except floors addressed in Task 4.

- [x] **Step 6: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore(deps): remove stale overrides and re-resolve patched transitives"
```

### Task 4: Lock-Only Fixes for Non-Override Findings

**Files:**

- Modify: `package-lock.json` only

- [x] **Step 1: Update the fixable transitives**

```powershell
npm update proxy-addr shell-quote compression source-map-js postcss-selector-parser minimatch --package-lock-only
npm install
```

Expected: `proxy-addr` 2.0.8, `shell-quote` 1.12.0, `compression` 1.8.2,
`source-map-js` 1.2.2, `postcss-selector-parser` 7.1.6. If a package does not
move because a parent range excludes it, run `npm explain <pkg>` and add that
single owner-scoped override with a removal criterion. Do not use
`npm audit fix --force`.

- [x] **Step 2: Confirm the full floor suite passes**

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
```

Expected: PASS.

- [x] **Step 3: Re-audit**

```powershell
npm audit --json > reports/security/overrides-audit.after.json
npm audit
```

Expected: 0 critical; no `brace-expansion`, `fast-uri`, `undici`, `compression`,
`proxy-addr`, `shell-quote`, `source-map-js`, or `postcss-selector-parser`
findings. Remaining findings are limited to the accepted set in Audit Triage
(`braces` chain, `node-forge`). Anything else is a regression: stop and
diagnose.

- [x] **Step 4: Commit**

```powershell
git add package-lock.json
git commit -m "chore(deps): refresh lockfile for critical and high transitive advisories"
```

### Task 5: Validate Override Outcomes and Tooling Gates

**Files:**

- Read: `package.json`, `package-lock.json`, `webpack.config.js`,
  `.storybook/main.ts`
- Create: `reports/security/overrides-tree.after.txt` (ignored report output)

- [x] **Step 1: Confirm final override shape**

```powershell
node -e "const p=require('./package.json'); console.log(Object.keys(p.overrides).sort().join('\n'))"
```

Expected: the four glob owners (`@mizchi/lsmcp`, `@npmcli/map-workspaces`,
`@npmcli/package-json`, `unified-engine`), `uuid`, `valibot`, plus `qs` and any
fallback overrides recorded in Execution Notes.

- [x] **Step 2: Record resolved versions**

```powershell
npm ls glob body-parser brace-expansion browserslist fast-uri js-yaml nanoid postcss qs undici uuid valibot --all > reports/security/overrides-tree.after.txt
```

Expected: no `glob@10.x`; `brace-expansion` 1.1.21+/2.1.7+/5.0.12+; `fast-uri`
3.1.8+; `undici` 7.29.1+; `js-yaml` 4.3.2; `qs` 6.16.0+; `uuid` 11.1.1+;
`valibot` 1.4.2+.

- [x] **Step 3: Validate `@mizchi/lsmcp` under `glob@13.0.6`**

```powershell
./node_modules/.bin/lsmcp --help
./node_modules/.bin/lsmcp --list
./node_modules/.bin/lsmcp doctor
```

Expected: each exits 0. A failure caused by glob resolution means the
`@mizchi/lsmcp.glob` override is incompatible: replace it with a documented,
time-boxed `glob@10.5.0` exception in `dependencySecurity.test.ts` instead of
silently weakening the policy.

- [x] **Step 4: Static gates**

```powershell
npm run type-check
npm run lint
npm run lint:mdx
```

Expected: PASS each. `lint:mdx` exercises `remark-cli`/`unified-engine` under
`glob@13.0.6` and the refreshed `minimatch`/`brace-expansion`.

- [ ] **Step 5: Runtime gates**

```powershell
npm run test:ci
npm run build
npm run test:e2e:storybook
npm run test:e2e:app
```

Expected: PASS each. `test:e2e:storybook` covers the Storybook MCP/`valibot`
path; `test:e2e:app` covers the Webpack dev-server
`body-parser`/`qs`/`compression`/`proxy-addr` path. Use
`npm run test:unit -- <file>` for focused reruns; Vitest runs through the repo's
`--configLoader runner` scripts.

### Task 6: Update Docs and Onboarding

**Files:**

- Modify if Step 1 finds stale references: `INIT.md`, `docs/STACK.md`,
  `docs/TESTING.md`, `docs/change-record/OPEN-ITEMS-BACKLOG.md`,
  `docs/change-record/MASTER-CHANGE-RECORD.md`

- [x] **Step 1: Find stale references**

```powershell
Select-String -Path INIT.md,docs\*.md,docs\change-record\*.md -Pattern "overrides|@sonar/scan|adm-zip|glob@10|js-yaml|valibot|uuid|body-parser|brace-expansion|undici|fast-uri"
```

Expected: every doc line needing an update is listed.

- [x] **Step 2: Update onboarding text**

State, using the final override set from Task 5:

```text
Dependency overrides are intentionally minimal. Retained overrides are policy exceptions with removal criteria:
- glob owner-scoped overrides prevent deprecated glob 10 in MCP/remark tooling.
- valibot prevents vulnerable Storybook MCP transitives until they resolve valibot >1.4.1.
- (qs / uuid only if retained in Task 3 Step 4) with their stated removal criteria.
Overrides must never pin a version inside an advisory range; dependencySecurity.test.ts enforces patched floors.
```

- [x] **Step 3: Validate docs**

```powershell
npm run lint:mdx
```

Expected: PASS.

### Task 7: Decide Non-Override Findings (separate decision, may be its own PR)

**Files:**

- Inspect: `package.json`, `.github/workflows/pr.yml`,
  `tests/unit/config/workflowPolicy.test.ts`
- Optional modify: `package.json`, `package-lock.json`, docs describing the
  local npm `@sonar/scan`

- [x] **Step 1: Confirm scanner usage**

```powershell
Select-String -Path package.json,.github\workflows\*.yml,tests\unit\config\*.ts,INIT.md,docs\*.md -Pattern "@sonar/scan|sonar-scanner-npm|sonarqube-scan-action"
```

Expected: CI uses the pinned `SonarSource/sonarqube-scan-action`, not npm
`@sonar/scan`.

- [x] **Step 2: Decide removal or accepted risk**

If the local npm scanner is not required, run `npm uninstall @sonar/scan`
(removes the `node-forge` high finding). If it is required, document the
accepted dev-only risk: `@sonar/scan@5.0.1` pins `node-forge@1.4.0`, and no
patched `node-forge` exists (latest is 1.4.0).

- [x] **Step 3: Record accepted risks**

Record in `docs/change-record/OPEN-ITEMS-BACKLOG.md`: the
`braces`/`micromatch`/`chokidar`/`http-proxy-middleware` chain (needs
`webpack-dev-server@6` major), `unified-args`/`remark-cli` (chokidar), and
`patch-package` (needs `patch-package@6.0.7`, a downgrade; rejected). All are
dev-tooling only.

## Success Criteria

- [ ] `package.json` overrides contain only evidence-backed entries; none pins a
      version inside an advisory range.
- [ ] `brace-expansion`, `fast-uri`, `undici`, `js-yaml` resolve to patched
      versions with their overrides removed (or a single documented fallback
      each).
- [ ] `npm audit` shows 0 critical and no override-regression findings;
      remaining findings match the accepted set.
- [ ] No `glob@10.x` copy remains; `lsmcp --help`, `--list`, `doctor` pass.
- [ ] `npm run test:unit -- tests/unit/config/dependencySecurity.test.ts` passes
      with the new floors.
- [ ] `type-check`, `lint`, `lint:mdx`, `test:ci`, `build`,
      `test:e2e:storybook`, `test:e2e:app` pass after lockfile regeneration.
- [ ] Lockfile was regenerated with npm 11.19.1 and `npm ci` succeeds.

## Rollback

If a gate fails after override removal:

1. Identify the package with `npm explain <package>`.
2. Restore only the smallest override responsible, using the Fallback column
   (never a vulnerable pin).
3. Regenerate `package-lock.json` with npm.
4. Add a removal criterion to Retained Override Removal Criteria.

If multiple independent gates fail, `git revert` the Task 3/4 commits (the Task
2 test commit may stay once its floors are satisfiable) and re-plan; do not
restore the previous override object, since three of its pins are now
vulnerable.

## Execution Notes

Executed 2026-10-07 on branch `chore/deps-overrides-rationalisation`, created
from `main` (not the Formik branch). `node_modules` was initially installed from
the Formik branch.

### npm version

PATH npm was 11.17.0. `corepack enable` failed (EPERM writing the
`C:\Program Files\nodejs` shims), so all lockfile-affecting commands used
`npx --yes npm@11.19.1` (also `corepack npm`). A real `npm ci` run has not yet
been done.

### Audit counts

- Baseline: 26 findings (2 critical, 16 high, 8 moderate), not 25.
- After Task 4: 0 critical, 11 high, 0 moderate.
- After the Task 7 `@sonar/scan` uninstall: 10 high.

### Task 2

Commit `c6556393`: floors raised and a per-major `brace-expansion` test added.
The older superseded `brace-expansion` test was removed in `665fd004`.

### Task 3

Commit `6ad052eb`. Fallbacks used:

- `brace-expansion@5 5.0.12`: the lockfile kept 5.0.9 even after `npm update`;
  owner is `minimatch@10.2.6` (`^5.0.8`).
- `undici 7.30.0`: the lockfile kept 7.29.0; sole owner is `jsdom@29.1.1`
  (`^7.25.0`), so the override is unscoped.

`brace-expansion` 1.x/2.x, `fast-uri` 3.1.8, and `js-yaml` 4.3.2 resolved
naturally. The `qs` override was removed (all parents resolve 6.16.0). The
`uuid` override was kept (`sockjs@0.3.24` otherwise brings `uuid@8.3.2`).

Final overrides: the four glob owners, `uuid`, `valibot`, `brace-expansion@5`,
`undici`.

### Task 4

Commit `eccb8d0f`: `proxy-addr` 2.0.8, `shell-quote` 1.12.0, `compression`
1.8.2, `source-map-js` 1.2.2, `postcss-selector-parser` 7.1.6, and `ip-address`
10.7.3 (an extra moderate advisory outside the plan, fixed lock-only). No
overrides were needed.

### Task 5

- PASS: override shape, `npm ls`, `lsmcp` (`--help`, `--list`, `doctor`),
  `type-check`, `lint`, `lint:mdx`, `build`.
- PASS: `test:ci` unit (2121 tests) and `test:e2e:storybook` (135/135).
- `test:storybook` was first blocked by Windows reserved port 61005 (EACCES);
  fixed in commit `7f05b157` (port 47005). It then passed (135 files, 301
  tests).
- `test:e2e:app`: 31 scenarios timed out at `page.goto` in the first run
  (suspected environmental). Rerun result: pending rerun.

### Tasks 6 and 7

- Docs commit `72c3b40a`: `docs/CONVENTIONS.md` section 10, `docs/STACK.md`, and
  backlog rows `DEP-ADVISORY-DEVTOOLS-001`, `DEP-ADVISORY-NODE-FORGE-001`,
  `DEP-OVERRIDE-REMOVAL-001`.
- `@sonar/scan` uninstalled in `81a1f1aa` (removes `node-forge`).
- Prettier fix in `13675eb1`.
