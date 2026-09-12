# Dependency Overrides Rationalisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `package.json` overrides to the smallest evidence-backed set while preserving the security floor tests, npm reproducibility, and current CI policy.

**Architecture:** Treat overrides as security-policy exceptions, not general dependency pins. First update tests to encode the current advisory floors, then remove stale overrides in one lockfile regeneration, and keep only overrides that demonstrably prevent vulnerable or deprecated transitive versions from returning.

**Tech Stack:** npm 11.19.1, Node >=24.0.0, package-lock v3, Vitest, npm `overrides`, `npm audit`, `npm explain`.

**Spec:** Conversation request on 2026-09-10: inspect all `package.json` overrides, create a rubric, perform a Devil's Advocate review, and uplift the dependency remediation plan.

## Global Constraints

- Do not edit generated or vendored app sources.
- Do not change `packageManager`, `engines`, `devEngines`, `allowScripts`, or root `postinstall`.
- Do not hand-edit `package-lock.json`; regenerate it with npm.
- Preserve `npm ci` compatibility and the existing patch-package postinstall path.
- Keep existing user changes in `package.json` and `package-lock.json`; do not revert unrelated dependency work.
- Before implementation begins, commit or otherwise close the current dirty worktree so this dependency-rationalisation work starts from an isolated baseline.
- Any retained override must have one of these owners: active security advisory, publisher deprecation policy, compatibility workaround, or explicit documented exception.
- Any removed override must be validated by lockfile resolution and the dependency security regression test.
- Design principle: prefer minimal overrides. If a patched version resolves naturally within the parent dependency range, remove the override instead of pinning that package at the root.

---

## Rubric

Score each override from 0 to 2 on each criterion. An override should remain only if it scores at least 6, or if one criterion exposes a current audit finding.

| Criterion | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Security need | No advisory or deprecated package prevented | Historical advisory only | Current audit/deprecation returns if removed |
| Resolver necessity | Natural resolution is identical without override | Same version, but different placement/count | Vulnerable, deprecated, or unsupported version returns without override |
| Compatibility risk | Override pins behind natural safe version | Unknown behavioral impact | Known compatible, covered by tests |
| Maintenance cost | Broad/global override with stale pin | Narrow but still artificial | Owner-scoped or exact transitive floor with clear removal rule |
| Test coverage | No regression guard | Covered indirectly | Covered by `dependencySecurity.test.ts` or focused command |

## Design Decisions

### Decision 1: Stale Security Overrides

Remove stale overrides, keep `qs`, `uuid`, and `valibot`, and remove the `js-yaml` override after raising the security floor to `4.3.2`.

Consequence: npm regains normal patch-level resolver freedom for packages that now resolve safely without intervention. This is intentional under the minimal-overrides principle.

Mitigation: retain explicit security-floor tests, run audit after regeneration, and keep documented removal criteria for every retained override so it does not become hidden architecture.

### Decision 2: `@mizchi/lsmcp` and `glob@10.5.0`

Force `@mizchi/lsmcp` to `glob@13.0.6` with an owner-scoped override.

Rationale: the repository already has a hard policy test that rejects every `glob@10.x` copy as deprecated, and `glob@10.5.0` is publisher-deprecated with a warning to update. Leaving `@mizchi/lsmcp` on `glob@10.5.0` would require weakening or exception-carving that policy. The cleaner design is to keep the policy coherent and validate `lsmcp` directly under `glob@13.0.6`.

Mitigation: validate `./node_modules/.bin/lsmcp --help`, `./node_modules/.bin/lsmcp --list`, and `./node_modules/.bin/lsmcp doctor` after lockfile regeneration. If any command fails because of `glob@13.0.6`, revert only the `@mizchi/lsmcp.glob` override and record a time-boxed exception in `dependencySecurity.test.ts` with a removal condition tied to the next `@mizchi/lsmcp` release.

## Retained Override Removal Criteria

| Override | Why it remains | Removal criteria |
| --- | --- | --- |
| `@mizchi/lsmcp.glob: 13.0.6` | Prevents deprecated `glob@10.5.0`. | Remove when `@mizchi/lsmcp` naturally resolves `glob >=13` or when it no longer depends on `glob`. Validate with `npm ls glob` and the `lsmcp` focused commands. |
| `@npmcli/map-workspaces.glob: 13.0.6` | Prevents deprecated `glob@10.5.0` in the remark/unified toolchain. | Remove when this owner naturally resolves `glob >=13`. Validate with `npm ls glob` and `npm run lint:mdx`. |
| `@npmcli/package-json.glob: 13.0.6` | Prevents deprecated `glob@10.5.0` in the remark/unified toolchain. | Remove when this owner naturally resolves `glob >=13`. Validate with `npm ls glob` and `npm run lint:mdx`. |
| `unified-engine.glob: 13.0.6` | Prevents deprecated `glob@10.5.0` in `remark-cli`/`unified-engine`. | Remove when `unified-engine` naturally resolves `glob >=13`. Validate with `npm run lint:mdx`. |
| `qs: 6.16.0` | Prevents vulnerable `qs@6.15.3` through `express@4.22.2`. | Remove when `express` or its owner naturally resolves `qs >=6.16.0`. Validate with `npm audit`, `npm ls qs`, `npm run build`, and `npm run test:e2e:app`. |
| `uuid: ^11.1.1` | Prevents vulnerable `uuid@8.3.2` through `sockjs@0.3.24`. | Remove when `sockjs`/`webpack-dev-server` naturally resolves `uuid >=11.1.1` or no longer depends on `uuid`. Validate with `npm audit`, `npm ls uuid`, and dev-server-backed E2E. |
| `valibot: 1.4.2` | Prevents vulnerable `valibot@1.2.0` through Storybook MCP. | Remove when Storybook MCP naturally resolves `valibot >1.4.1`. Validate with `npm audit`, `npm ls valibot`, Storybook MCP endpoint checks, and Storybook tests. |

## Override Decisions

| Override | Decision | Evidence | Action |
| --- | --- | --- | --- |
| `@mizchi/lsmcp.glob: 13.0.6` | Add | Current tree contains deprecated `glob@10.5.0` through `@mizchi/lsmcp`, and the existing dependency security test rejects every `glob@10.x` copy. | Add owner-scoped override and validate `lsmcp` commands. |
| `@npmcli/map-workspaces.glob: 13.0.6` | Keep | Prevents deprecated `glob@10.5.0` in the remark/unified toolchain. | Keep and document owner. |
| `@npmcli/package-json.glob: 13.0.6` | Keep | Same deprecated glob toolchain risk. | Keep and document owner. |
| `unified-engine.glob: 13.0.6` | Keep | Same deprecated glob toolchain risk. | Keep and document owner. |
| `body-parser: 1.20.6` | Remove | Fresh exact-root no-overrides resolution selects `1.20.8`. | Remove. |
| `brace-expansion@1: 1.1.18` | Remove | Fresh exact-root no-overrides resolution still selects patched `1.1.18`. | Remove. |
| `brace-expansion@2: 2.1.4` | Remove | Fresh exact-root no-overrides resolution still selects patched `2.1.4`. | Remove. |
| `brace-expansion@5: 5.0.9` | Remove | Fresh exact-root no-overrides resolution still selects patched `5.0.9`. | Remove. |
| `browserslist: 4.28.8` | Remove | Fresh exact-root no-overrides resolution selects newer `4.28.9`. | Remove. |
| `fast-uri: 3.1.7` | Remove | Fresh exact-root no-overrides resolution is identical. | Remove. |
| `js-yaml: 4.3.1` | Remove | Current audit says `<4.3.2` is vulnerable; no-overrides selects `4.3.2` within `cosmiconfig`'s `^4.1.0` range. | Remove override under the minimal-overrides principle. |
| `nanoid: 3.3.18` | Remove | Fresh exact-root no-overrides resolution is identical. | Remove. |
| `postcss: 8.5.26` | Remove | Fresh exact-root no-overrides resolution selects newer `8.5.28`. | Remove. |
| `qs: 6.16.0` | Keep | Without override, `express@4.22.2` returns vulnerable `qs@6.15.3`. | Keep until express naturally resolves patched `qs`. |
| `undici: 7.29.0` | Remove | Fresh exact-root no-overrides resolution is identical. | Remove. |
| `uuid: ^11.1.1` | Keep | Without override, `sockjs@0.3.24` returns vulnerable `uuid@8.3.2`. | Keep until `sockjs`/`webpack-dev-server` no longer require it. |
| `valibot: 1.4.2` | Keep | Without override, Storybook MCP returns vulnerable `valibot@1.2.0`. | Keep until Storybook MCP naturally resolves `>1.4.1`. |

## Devil's Advocate Review

### Challenge 1: Removing broad overrides may reduce dedupe and increase lockfile churn

The exact-root no-overrides experiment showed more copies for `brace-expansion` and different package placement for `glob`. That is not automatically a regression; npm is allowed to place transitive packages differently. The plan therefore must judge removal by security, deprecation, runtime compatibility, and tests rather than copy count alone.

Decision: Accept placement churn for stale overrides, but require `dependencySecurity.test.ts`, `npm audit`, and `npm run lint` before claiming success.

### Challenge 2: Keeping `glob` overrides is incomplete because `@mizchi/lsmcp` still installs `glob@10.5.0`

The current focused test fails on `glob@10.5.0` from `@mizchi/lsmcp@0.10.0`. Keeping the three existing owner-scoped overrides is necessary but insufficient.

Decision: Add an owner-scoped override for `@mizchi/lsmcp.glob: 13.0.6`. This is justified because the repository already rejects `glob@10.x`; accepting the `@mizchi/lsmcp` copy would make the policy inconsistent. The mitigation is direct `lsmcp` command validation and a rollback path to a documented temporary exception if `glob@13.0.6` breaks `lsmcp`.

### Challenge 3: Removing `body-parser` may change Express middleware behavior from `1.20.6` to `1.20.8`

The natural resolver chooses `body-parser@1.20.8`, which is within Express' range. The repo uses `webpack-dev-server`, not app server code, so the risk is dev-server behavior, not production portal behavior.

Decision: Remove the override, then validate `npm run build` and at least one dev-server-backed path if execution scope allows. If the app E2E web server fails, restore only this override with a comment in the plan result.

### Challenge 4: Removing `js-yaml` instead of pinning `4.3.2` may allow a future major if parents widen

The current parent `cosmiconfig@8.3.6` depends on `js-yaml ^4.1.0`, so natural resolution is `4.3.2`, not `5.x`. Removing the override is cleaner today.

Decision: Remove `js-yaml` override and raise the test floor to `4.3.2`. This explicitly follows the minimal-overrides design principle. Re-add an override only if npm resolves outside the compatible 4.x line.

### Challenge 5: `valibot` is pinned below latest

Latest registry metadata showed `valibot@1.5.0`, while the override is `1.4.2`. The override exists to lift Storybook MCP above the vulnerable `1.2.0` without taking broader Storybook MCP changes.

Decision: Keep `1.4.2` in this plan because it is the smallest known working security floor. Treat a later move to `1.5.0` as a separate Storybook MCP compatibility task.

## Optimized Plan

### Task 1: Capture Baseline Evidence

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Read: `tests/unit/config/dependencySecurity.test.ts`
- Create: `reports/security/overrides-audit.before.json` (ignored report output)
- Create: `reports/security/overrides-tree.before.txt` (ignored report output)

**Interfaces:**
- Consumes: current repository dependency graph.
- Produces: baseline audit and tree evidence for later comparison.

- [ ] **Step 1: Record current audit output**

Run:

```powershell
npm audit --json > reports/security/overrides-audit.before.json
```

Expected: command exits non-zero and JSON records the current `@sonar/scan`/`adm-zip` and `js-yaml`/`cosmiconfig` findings.

- [ ] **Step 2: Record current override-owned dependency tree**

Run:

```powershell
npm ls glob body-parser brace-expansion browserslist fast-uri js-yaml nanoid postcss qs undici uuid valibot --all > reports/security/overrides-tree.before.txt
```

Expected: command exits 0 and shows the current override-owned versions.

### Task 2: Update Security Floors Before Removing Overrides

**Files:**
- Modify: `tests/unit/config/dependencySecurity.test.ts`

**Interfaces:**
- Consumes: npm audit finding that `js-yaml <4.3.2` is vulnerable.
- Produces: regression guard that rejects `js-yaml@4.3.1`.

- [ ] **Step 1: Change the `js-yaml` floor**

In `tests/unit/config/dependencySecurity.test.ts`, replace:

```ts
["js-yaml", "4.3.1"],
```

with:

```ts
["js-yaml", "4.3.2"],
```

- [ ] **Step 2: Verify the test fails before the dependency change**

Run:

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts -t "js-yaml resolves only patched versions"
```

Expected: FAIL, reporting `js-yaml@4.3.1 must be at least 4.3.2`.

### Task 3: Rationalise Overrides

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Task 2 floor update.
- Produces: minimal override object and npm-generated lockfile.

- [ ] **Step 1: Replace the overrides object**

Set `package.json` `overrides` to exactly:

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
  "qs": "6.16.0",
  "unified-engine": {
    "glob": "13.0.6"
  },
  "uuid": "^11.1.1",
  "valibot": "1.4.2"
}
```

- [ ] **Step 2: Regenerate the lockfile**

Run:

```powershell
npm install --package-lock-only
```

Expected: lockfile updates through npm and `patch-package` is not required for this package-lock-only step.

- [ ] **Step 3: Verify install path**

Run:

```powershell
npm install
```

Expected: install succeeds. The existing `html-react-parser` patch warning may remain unless handled by a separate patch refresh task.

- [ ] **Step 4: Confirm minimal override shape**

Run:

```powershell
node -e "const p=require('./package.json'); console.log(Object.keys(p.overrides).sort().join('\n'))"
```

Expected:

```text
@mizchi/lsmcp
@npmcli/map-workspaces
@npmcli/package-json
qs
unified-engine
uuid
valibot
```

### Task 4: Validate Override Outcomes

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Read: `tests/unit/config/dependencySecurity.test.ts`
- Create: `reports/security/overrides-audit.after.json` (ignored report output)
- Create: `reports/security/overrides-tree.after.txt` (ignored report output)

**Interfaces:**
- Consumes: Task 3 lockfile.
- Produces: evidence that removed overrides stayed safe and retained overrides still enforce policy.

- [ ] **Step 1: Run focused dependency security regression**

Run:

```powershell
npm run test:unit -- tests/unit/config/dependencySecurity.test.ts
```

Expected: PASS, including `js-yaml >=4.3.2`, no deprecated `glob@10`, and retained override owner checks.

- [ ] **Step 2: Check audit output**

Run:

```powershell
npm audit --json > reports/security/overrides-audit.after.json
```

Expected: no `js-yaml`, `qs`, `uuid`, or `valibot` findings. Remaining findings, if any, should be limited to the separately owned `@sonar/scan`/`adm-zip` chain unless that is addressed in the same branch.

- [ ] **Step 3: Check resolved versions**

Run:

```powershell
npm ls glob body-parser brace-expansion browserslist fast-uri js-yaml nanoid postcss qs undici uuid valibot --all > reports/security/overrides-tree.after.txt
```

Expected:

```text
glob: no 10.x copies
body-parser: 1.20.8 or later compatible 1.20.x
brace-expansion: 1.1.18, 2.1.4, 5.0.9 or later patched compatible copies only
browserslist: 4.28.9 or later
fast-uri: 3.1.7 or later
js-yaml: 4.3.2
nanoid: 3.3.18 or later
postcss: 8.5.28 or later
qs: 6.16.0
undici: 7.29.0 or later compatible installed version
uuid: 11.1.1 or later
valibot: 1.4.2
```

- [ ] **Step 4: Validate `@mizchi/lsmcp` under `glob@13.0.6`**

Run:

```powershell
./node_modules/.bin/lsmcp --help
./node_modules/.bin/lsmcp --list
./node_modules/.bin/lsmcp doctor
```

Expected: each command exits 0 and prints command help, supported presets, or environment diagnostics. Failure caused by glob resolution means the `@mizchi/lsmcp.glob` override is not compatible and must be replaced by a documented temporary `glob@10.5.0` exception instead of silently weakening the dependency policy.

### Task 5: Run Tooling Gates Affected by Override Changes

**Files:**
- Read: `webpack.config.js`
- Read: `.storybook/main.ts`
- Read: `package.json`
- Read: `package-lock.json`

**Interfaces:**
- Consumes: Task 4 passing dependency checks.
- Produces: confidence that Webpack, Storybook, lint, and TypeScript tooling still load.

- [ ] **Step 1: Run type checking**

Run:

```powershell
npm run type-check
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run MDX/remark lint for the `unified-engine`/`glob` path**

Run:

```powershell
npm run lint:mdx
```

Expected: PASS. This validates `remark-cli` and `unified-engine` after the `glob@13.0.6` owner-scoped overrides.

- [ ] **Step 4: Run Storybook MCP validation for `valibot`**

Run:

```powershell
npm run test:e2e:storybook
```

Expected: PASS. This exercises the Storybook MCP path that depends on the retained `valibot` override.

- [ ] **Step 5: Run the CI unit composite**

Run:

```powershell
npm run test:ci
```

Expected: PASS.

- [ ] **Step 6: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 7: Run app E2E for `body-parser`/`qs` dev-server coverage**

Run:

```powershell
npm run test:e2e:app
```

Expected: PASS. This validates the Webpack dev-server path after removing the `body-parser` override and retaining the `qs` override.

### Task 6: Update Docs and Onboarding

**Files:**
- Modify if Step 1 reports matching references: `INIT.md`
- Modify if Step 1 reports matching references: `docs/STACK.md`
- Modify if Step 1 reports matching references: `docs/TESTING.md`
- Modify if Step 1 reports matching references: `docs/change-record/OPEN-ITEMS-BACKLOG.md`
- Modify if Step 1 reports matching references: `docs/change-record/MASTER-CHANGE-RECORD.md`

**Interfaces:**
- Consumes: completed override decisions and final retained override set.
- Produces: docs that explain why retained overrides exist and when they can be removed.

- [ ] **Step 1: Find stale override and scanner references**

Run:

```powershell
rg "overrides|@sonar/scan|adm-zip|glob@10|glob 10|js-yaml|valibot|uuid|qs|body-parser" INIT.md docs
```

Expected: all docs/onboarding references needing update are visible.

- [ ] **Step 2: Update onboarding text**

Update any relevant docs so they state:

```text
Dependency overrides are intentionally minimal. Retained overrides are policy exceptions with removal criteria:
- glob owner-scoped overrides prevent deprecated glob 10 in MCP/remark tooling.
- qs prevents vulnerable Express transitives until Express naturally resolves qs >=6.16.0.
- uuid prevents vulnerable sockjs transitives until sockjs/webpack-dev-server naturally resolves uuid >=11.1.1.
- valibot prevents vulnerable Storybook MCP transitives until Storybook MCP naturally resolves valibot >1.4.1.
- js-yaml is not overridden; it resolves naturally to the patched 4.3.2 line.
```

Expected: docs no longer imply removed overrides are active policy, and local Sonar scanner docs are aligned with the chosen `@sonar/scan` outcome from Task 7.

- [ ] **Step 3: Validate docs**

Run:

```powershell
npm run lint:mdx
```

Expected: PASS.

### Task 7: Separate Follow-Up for Non-Override Findings

**Files:**
- Inspect: `package.json`
- Inspect: `.github/workflows/pr.yml`
- Inspect: `tests/unit/config/workflowPolicy.test.ts`
- Optional modify: `package.json`
- Optional modify: `package-lock.json`
- Optional modify: docs that still describe local npm `@sonar/scan`

**Interfaces:**
- Consumes: current audit showing `@sonar/scan -> adm-zip@0.6.0`.
- Produces: separate decision on scanner removal or accepted dev-tooling risk.

- [ ] **Step 1: Confirm scanner usage**

Run:

```powershell
rg "@sonar/scan|sonar-scanner-npm|npx.*sonar" package.json package-lock.json .github tests docs INIT.md
```

Expected: code and workflow tests show CI uses pinned `SonarSource/sonarqube-scan-action`, not runtime npm `@sonar/scan`.

- [ ] **Step 2: Decide removal or accepted risk**

If local npm scanner is not required, remove `@sonar/scan` from `devDependencies` and regenerate the lockfile with:

```powershell
npm uninstall @sonar/scan
```

Expected: `adm-zip` leaves the installed tree and audit findings drop.

If local npm scanner is required, keep it and document the accepted dev-only risk with upstream blocker: `@sonar/scan@5.0.0` pins `adm-zip@0.6.0`, and no newer `adm-zip` release exists.

## Success Criteria

- [ ] `package.json` contains only evidence-backed overrides.
- [ ] `js-yaml` resolves to `4.3.2`.
- [ ] `js-yaml` is not retained as an override, matching the minimal-overrides design principle.
- [ ] No vulnerable `qs`, `uuid`, or `valibot` transitive copies return.
- [ ] No deprecated `glob@10.x` copy remains.
- [ ] `./node_modules/.bin/lsmcp --help`, `./node_modules/.bin/lsmcp --list`, and `./node_modules/.bin/lsmcp doctor` pass under `glob@13.0.6`.
- [ ] `npm run test:unit -- tests/unit/config/dependencySecurity.test.ts` passes.
- [ ] `npm audit` has no override-regression findings.
- [ ] `npm run lint:mdx` passes, proving the remark/unified path still works.
- [ ] `npm run test:e2e:storybook` passes, proving the Storybook MCP/`valibot` path still works.
- [ ] `npm run test:e2e:app` passes, proving the Webpack dev-server `body-parser`/`qs` path still works.
- [ ] Type-check, lint, `test:ci`, and build pass after lockfile regeneration.

## Rollback

If a tooling gate fails after override removal:

1. Identify the package that changed with `npm explain <package>`.
2. Restore only the smallest override responsible for the failing package.
3. Regenerate `package-lock.json` with npm.
4. Add a removal condition to this plan's follow-up notes so the override does not become permanent without an owner.

Do not restore the entire previous override object unless multiple independent gates fail and the dependency tree must be returned to baseline quickly.
