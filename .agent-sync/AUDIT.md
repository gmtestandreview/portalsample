# Pipeline Audit Report — 2026-09-04

**Branch:** `fix/storybook-build-warnings` (6 commits ahead of origin/main)  
**Audit date:** 2026-09-04  
**Auditor:** harness-optimizer (Tier 3)

---

## Executive Summary

**BLOCK MERGE — Rule evasion detected**

The branch introduces a **critical and systematic violation** of ROUTING.md §3.8 (dependency pinning policy) by loosening exact version pins to caret ranges for lint, Storybook, and related tooling. This is a direct breach of governed rule and creates silent risk of untested version combinations. While other changes in the branch are legitimate and properly scoped, this violation alone blocks merge.

---

## Critical Finding: Dependency Pinning Policy Violation

**Rule violated:** ROUTING.md §3.8  
**Rule text:** "Lint / Vitest / Storybook dependency versions are pinned exactly, on purpose. Do not let `syncpack` rewrite them to `^` ranges — its default behaviour silently breaks the `dependencySecurity` policy test."

**Evidence:** Package.json diff (origin/main → HEAD) shows systematic loosening:

| Package | Main (exact) | HEAD (loosened) | Policy Violation |
|---------|--------------|-----------------|------------------|
| `eslint` | `10.9.0` | `^10.9.1` | ✓ Exact → Caret |
| `@eslint/js` | `10.0.1` | `^10.0.1` | ✓ Exact → Caret |
| `@eslint-react/eslint-plugin` | `5.18.6` | `^5.18.7` | ✓ Exact → Caret |
| `@storybook/addon-a11y` | `10.5.10` | `^10.6.0` | ✓ Exact → Caret |
| `@storybook/addon-docs` | `^10.5.10` | `^10.6.0` | ✓ Already caret, bumped |
| `@storybook/addon-links` | `^10.5.10` | `^10.6.0` | ✓ Already caret, bumped |
| `@storybook/addon-mcp` | `^0.7.0` | `^10.6.0` | ✓ Caret maintained |
| `@storybook/addon-vitest` | `^10.5.10` | `^10.6.0` | ✓ Caret maintained |
| `@storybook/react-vite` | `^10.5.10` | `^10.6.0` | ✓ Caret maintained |
| `@stylistic/eslint-plugin` | `5.10.0` | `^5.10.0` | ✓ Exact → Caret |
| `eslint-plugin-react-hooks` | `7.1.1` | `^7.1.1` | ✓ Exact → Caret |
| `eslint-plugin-storybook` | `^10.5.10` | `^10.6.0` | ✓ Caret maintained |
| `typescript-eslint` | `8.67.0` | `8.69.0` | ✓ Exact → Exact (bumped) |
| `globals` | `17.11.0` | `^17.12.0` | ✓ Exact → Caret |
| `@testing-library/jest-dom` | `^6.9.1` | `7.0.1` | ✓ Major bump + direction reversal |

**Impact:** With caret ranges, the next `npm install` on any CI machine or developer device can pull untested minor/patch versions. The project has not validated these versions against the test suite. Running `syncpack` with default settings will rewrite remaining exact pins and amplify the risk.

**Verdict:** ✗ **BLOCK MERGE** — This is a hard policy breach, not an opinion.

---

## Secondary Finding: Commit Message Accuracy

| Commit | Message | Actual Content | Verdict |
|--------|---------|-----------------|---------|
| `beb495d` | "update Vitest... to version 5.0.0" | vitest: 4.1.11 → 5.0.0 | ✓ Accurate for that commit |
| `07dd729` | "update... vitest" (in list) | vitest: 5.0.0 → 4.1.11 (downgrade/revert) | ✗ Inaccurate — message implies upgrade |

The final commit downgrades Vitest back to 4.1.11 but the message lists vitest as being updated (upgrade implied). Misleading for future archaeology, though not a gate failure.

**Verdict:** ⚠ **ADVISORY** — Commit message hygiene. Log is harder to read later.

---

## Legitimate Changes (No Evasion)

### Vitest Configuration — `watch: false` Added

**Files:** `vitest.config.ts`, `vitest.unit.config.ts`, `vitest.storybook.config.ts`

**Change:** Added `watch: false` to `test` config with detailed comment explaining the heap OOM issue in resident watch processes during coverage runs in Browser Mode.

**Impact on tests:** None. The explicit `run` flag in CI (`test:ci:unit`, `test:ci:storybook`, etc.) already prevents watch mode. The `test:*:watch` scripts explicitly pass `--watch` to opt back in.

**Gate maintained:** Coverage thresholds remain 100% on all metrics (statements, branches, functions, lines).

**Verdict:** ✓ **PASS** — Legitimate optimization, no gate weakening.

---

### Storybook Build Suppression — `onLog` Filter Properly Scoped

**File:** `.storybook/main.ts`

**Changes:**
1. `chunkSizeWarningLimit: 2048` — raises threshold above Storybook runtime + axe-core + Storybook UI to flag only runaway story chunks
2. `onLog` filter (lines 99–114) suppresses:
   - `INVALID_ANNOTATION` errors that occur in `node_modules` only (vendor ES5 builds)
   - `PLUGIN_TIMINGS` noise

**Scope verification:** Filter checks `log.message.includes('node_modules')` — first-party code errors in ClientApp/src still surface.

**Verdict:** ✓ **PASS** — Suppression is scoped correctly to vendor noise only.

---

### React Aria Act() Warning Fixes

**Files:**
- `ClientApp/src/components/ComboBox/ComboBox.tsx` — wrapped input in `<Group>` to prevent ResizeObserver post-mount state
- `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx` — same fix
- `ClientApp/src/components/AriaComponents/Tabs.stories.tsx` — added `transition: none` to TabPanels
- `ClientApp/src/components/Inputs/AriaCheckbox/CheckboxGroup.stories.tsx` — added `aria-label` for accessibility

**Impact:** These are legitimate fixes to prevent post-mount state updates that fall outside act() scope. Not suppressing warnings in config; fixing the underlying cause.

**Verdict:** ✓ **PASS** — Proper implementation of the CLAUDE.md §Storybook async/render hygiene rule.

---

### E2E Test Timeout Increases

**File:** `tests/e2e/steps/storybook.steps.ts`

**Changes:**
- Added `STORY_RENDER_TIMEOUT_MS = 15_000` constant
- Increased expect timeouts from 5s default to 15s for Code addon assertions
- Added best-effort `waitForFunction` for story bundle compilation with `.catch(...)` fallback
- Added assertion warmup for story preview before checking Code Panel

**Impact:** More robust waiting for cold compilation (first story hit), not weakened assertions.

**Test assertions:** Strengthened with additional accessibility check in CheckboxGroup story.

**Verdict:** ✓ **PASS** — Test robustness improved, no weakening.

---

## Verification-Before-Completion Assessment

**Per `/superpowers:verification-before-completion` rule:** Before marking complete, proof of verification must be recorded.

**Expected commands:**
- `npm run type-check` — TypeScript verification
- `npm run lint` — ESLint with rules gate
- `npm run test:ci` — Full CI gate (type-check + tests + regression)
- `npm run migration-check` — Storybook build

**Evidence collected:**
- **Bash command log (`~/.claude/bash-commands.log`):** ❌ NOT FOUND
- **Agent result files (`.agent-sync/results/`):** ❌ EMPTY (0 files)
- **Commit messages:** Do not cite verification runs

**Verdict:**  
⚠ **INCONCLUSIVE — Unverifiable without bash log or result files.** This compounds the pinning policy breach: we cannot confirm the package changes do not break the build.

---

## File Claims Hygiene

**ROUTING.md §File Claims (lines 276–308):** All claims from COVERAGE-GATE-001 are marked `done` and released. No stale claims.

**Verdict:** ✓ **PASS** — File Claims properly managed.

---

## Summary Table

| Category | Status | Finding |
|----------|--------|---------|
| **Dependency Pinning Policy** | ✗ FAIL | Exact pins systematically loosened to `^` caret ranges. Direct §3.8 violation. |
| **Vitest Configuration** | ✓ PASS | `watch: false` appropriate, coverage thresholds remain 100%. |
| **Storybook Build Suppression** | ✓ PASS | Scope correctly limited to vendor code; first-party errors still surface. |
| **React Aria Fixes** | ✓ PASS | Proper act() warning mitigation via code changes, not config suppression. |
| **E2E Test Robustness** | ✓ PASS | Timeouts increased for cold compilation; assertions strengthened. |
| **Coverage Thresholds** | ✓ PASS | Remain 100% on all metrics; no gate weakening. |
| **Commit Message Accuracy** | ⚠ ADVISORY | Commit `07dd729` message doesn't match content (downgrade described as update). |
| **Verification Evidence** | ⚠ INCONCLUSIVE | Bash log unavailable; cannot independently verify builds passed. |
| **File Claims** | ✓ PASS | All claims released; no collision risk. |

---

## Remediation Required

**To clear `BLOCK MERGE`, the branch must:**

1. **Re-pin exact versions** for all lint, Storybook, and related packages that were loosened to `^` ranges:
   - Revert changes to `eslint`, `@eslint/js`, `@eslint-react/eslint-plugin`, `@stylistic/eslint-plugin`, `eslint-plugin-react-hooks`, `globals` — back to exact pins from origin/main
   - Review and fix other caret loosening (Storybook, typescript-eslint, etc.)
   
2. **Verify the build** by running (and recording output):
   - `npm run type-check`
   - `npm run lint`
   - `npm run test:ci`
   - `npm run migration-check`

3. **Update commit messages** if the Vitest revert/downgrade is intentional.

---

## Verdict: BLOCK MERGE

**This branch cannot be merged in its current state.** The dependency pinning violation is a rule evasion that contradicts ROUTING.md §3.8 and §0.3 ("Never weaken a gate to go green").

All other technical changes in the branch are sound and properly scoped. Once the pinning policy is restored, the branch will be clean.

---

**Audit Sign-off:** harness-optimizer · 2026-09-04
