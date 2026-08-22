# Playwright BDD and Storybook Improvement Plan

## Purpose

This plan captures process improvements for the next Storybook plus Playwright-BDD cycle so coverage work is faster, less brittle, and easier to close with high confidence.

## Baseline and Target

- Baseline achieved in this snapshot: full Storybook-tagged run passing.
- Target for next cycle: keep full Storybook-tagged coverage green while reducing triage time and reducing story-ID and assertion drift.

## Primary Risks Seen in the Last Cycle

1. Story ID mismatches between feature files and actual Storybook manifest entries.
2. Assertion brittleness when text rendering differs from expectation.
3. Router/provider conflicts from nested or duplicated router wrappers.
4. Missed portal rendering behavior where content is outside `#storybook-root`.
5. Regeneration gaps when feature updates are made without immediate spec generation.

## Improvement Actions by Workflow Stage

### 1. Intake and Scope

1. Define exact scope before editing:
   - New stories added
   - Existing stories modified
   - Stories removed or renamed
2. Record an explicit run goal for the cycle:
   - Full suite goal
   - Targeted family goal (components, forms, routes)

### 2. Pre-Implementation Checks

1. Build a story inventory from the current Storybook index before writing new scenarios.
2. Confirm whether any changed stories require route context, auth context, or modal/portal behavior.
3. Confirm current shared wrapper behavior:
   - Global router decorator in `.storybook/preview.ts`
   - Router-agnostic Storybook harness in `static/js/storybook/storybookHarness.tsx`

### 3. Scenario Authoring Standards

1. Use manifest-verified story IDs only.
2. Prefer role and accessible-name assertions for interactive controls.
3. Use root-scoped assertions for in-canvas content.
4. Use page-scoped assertions for portal-rendered content.
5. Keep one intent per scenario when possible to isolate failures.

### 4. Execution Discipline

Run this sequence on every cycle:

1. `npx bddgen`
2. `npx playwright test --grep "@storybook" --reporter=list`

Never treat scenario edits as valid until both commands complete successfully.

### 5. Failure Triage Protocol

1. Categorize each failure as one of:
   - Story mapping error
   - Assertion mismatch
   - Harness/provider issue
   - Product behavior regression
2. Fix one category at a time to avoid mixed-cause debugging.
3. Re-run targeted scenarios first, then re-run full `@storybook` suite before closure.

### 6. Remediation Standards

1. For story mapping errors:
   - Correct ID from the current Storybook manifest.
2. For assertion mismatches:
   - Prefer semantic selectors over fragile text where practical.
3. For provider issues:
   - Remove local router wrappers that duplicate global Storybook context.
4. For portal content:
   - Assert at page scope when modal content is outside root canvas.

### 7. Closure and Evidence

Required closure evidence:

1. Regeneration command completed.
2. Full Storybook-tagged Playwright run completed with pass count.
3. Updated docs where behavior or process changed.
4. Brief summary of defects fixed and prevention steps recorded.

## Team Operating Model for the Next Cycle

1. One owner for story inventory and ID validation.
2. One owner for scenario authoring quality and assertion strategy.
3. One owner for execution logs and closure evidence.
4. Shared accountability to avoid merging feature updates without regenerated specs.

## Metrics to Track

Track these per cycle:

1. Total Storybook-tagged scenarios.
2. First-pass failure count.
3. Failures by category (mapping, assertion, provider, regression).
4. Time from first failing run to full green run.
5. Number of post-fix reruns needed before closure.

## Definition of Done for Future Cycles

A Storybook BDD cycle is complete when all conditions below are true:

1. Story IDs in feature files match current Storybook manifest.
2. Generated specs are current.
3. Full `@storybook` suite is green.
4. Router and provider usage follows shared conventions.
5. Portal scenarios use the correct assertion scope.
6. Documentation is updated for any process or behavior change.
