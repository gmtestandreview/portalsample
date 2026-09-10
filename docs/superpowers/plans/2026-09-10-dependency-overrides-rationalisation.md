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
- Any retained override must have one of these owners: active security advisory, publisher deprecation policy, compatibility workaround, or explicit documented exception.
- Any removed override must be validated by lockfile resolution and the dependency security regression test.

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

## Override Decisions

| Override | Decision | Evidence | Action |
| --- | --- | --- | --- |
| `@npmcli/map-workspaces.glob: 13.0.6` | Keep | Prevents deprecated `glob@10.5.0` in the remark/unified toolchain. | Keep and document owner. |
| `@npmcli/package-json.glob: 13.0.6` | Keep | Same deprecated glob toolchain risk. | Keep and document owner. |
| `unified-engine.glob: 13.0.6` | Keep | Same deprecated glob toolchain risk. | Keep and document owner. |
| `body-parser: 1.20.6` | Remove | Fresh exact-root no-overrides resolution selects `1.20.8`. | Remove. |
| `brace-expansion@1: 1.1.18` | Remove | Fresh exact-root no-overrides resolution still selects patched `1.1.18`. | Remove. |
| `brace-expansion@2: 2.1.4` | Remove | Fresh exact-root no-overrides resolution still selects patched `2.1.4`. | Remove. |
| `brace-expansion@5: 5.0.9` | Remove | Fresh exact-root no-overrides resolution still selects patched `5.0.9`. | Remove. |
| `browserslist: 4.28.8` | Remove | Fresh exact-root no-overrides resolution selects newer `4.28.9`. | Remove. |
| `fast-uri: 3.1.7` | Remove | Fresh exact-root no-overrides resolution is identical. | Remove. |
| `js-yaml: 4.3.1` | Replace | Current audit says `<4.3.2` is vulnerable; no-overrides selects `4.3.2`. | Remove override or set `4.3.2`; prefer remove after validation. |
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

Decision: Add a separate task to either scope an additional override for `@mizchi/lsmcp.glob: 13.0.6` or deliberately revise the policy test with a documented exception. The optimized plan prefers adding the scoped override and validating `@mizchi/lsmcp`.

### Challenge 3: Removing `body-parser` may change Express middleware behavior from `1.20.6` to `1.20.8`

The natural resolver chooses `body-parser@1.20.8`, which is within Express' range. The repo uses `webpack-dev-server`, not app server code, so the risk is dev-server behavior, not production portal behavior.

Decision: Remove the override, then validate `npm run build` and at least one dev-server-backed path if execution scope allows. If the app E2E web server fails, restore only this override with a comment in the plan result.

### Challenge 4: Removing `js-yaml` instead of pinning `4.3.2` may allow a future major if parents widen

The current parent `cosmiconfig@8.3.6` depends on `js-yaml ^4.1.0`, so natural resolution is `4.3.2`, not `5.x`. Removing the override is cleaner today.

Decision: Remove `js-yaml` override and raise the test floor to `4.3.2`. Re-add an override only if npm resolves outside the compatible 4.x line.

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

- [ ] **Step 3: Run the CI unit composite**

Run:

```powershell
npm run test:ci
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS.

### Task 6: Separate Follow-Up for Non-Override Findings

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
- [ ] No vulnerable `qs`, `uuid`, or `valibot` transitive copies return.
- [ ] No deprecated `glob@10.x` copy remains, or a deliberate documented exception is added.
- [ ] `npm run test:unit -- tests/unit/config/dependencySecurity.test.ts` passes.
- [ ] `npm audit` has no override-regression findings.
- [ ] Type-check, lint, `test:ci`, and build pass after lockfile regeneration.

## Rollback

If a tooling gate fails after override removal:

1. Identify the package that changed with `npm explain <package>`.
2. Restore only the smallest override responsible for the failing package.
3. Regenerate `package-lock.json` with npm.
4. Add a removal condition to this plan's follow-up notes so the override does not become permanent without an owner.

Do not restore the entire previous override object unless multiple independent gates fail and the dependency tree must be returned to baseline quickly.
