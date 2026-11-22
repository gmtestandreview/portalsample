# Refactor Plan: Resolve 48 `react-refresh/only-export-components` errors

- Branch: `fix/type-approval-eslint` (worktree
  `.worktrees/fix-type-approval-eslint`)
- Baseline: HEAD `37945ab9`; `reports/eslint/diagnostics.json` shows 48 errors,
  0 warnings, 975 files, all one rule.
- Origin of the rule: commit `bf4d124a` (a foreign commit) added
  `eslint-plugin-react-refresh` and the `nmi/react-refresh` block in
  [eslint.config.mjs](../../eslint.config.mjs) (`reactRefresh.configs.vite()` on
  `jsxFiles`). That commit changed no source to satisfy the rule, which is why
  the errors landed all at once.
- Status: **plan only. No code has been changed.**

## Current State

`react-refresh/only-export-components` reports any `.tsx`/`.jsx` file that
exports a React component **and** anything else (constant, function, hook,
enum). Fast Refresh then cannot hot-swap the module and falls back to a full
reload. The config applies it to `ClientApp/src/**`, `.storybook/**` and
`tests/unit/**`. The project sets `noInlineConfig`, so `eslint-disable` comments
are not an option; fixes are structural or config-level.

Two message variants are in the report:

- 45× "Use a new file to share constants or functions between components."
- 3× "Move your component(s) to a separate file." These are files whose only
  exports are non-components while a local component is defined in them
  (`withReactAriaEvaluation.tsx:11`, `renderWithProviders.tsx:9`,
  `renderWithRouter.tsx:54`).

### Errors by area (17 files)

| Area                                             | Files | Errors |
| ------------------------------------------------ | ----- | ------ |
| Production source (`ClientApp/src/**`)           | 8     | 18     |
| Storybook helpers (`ClientApp/src/storybook/**`) | 3     | 20     |
| Unit-test helpers (`tests/unit/**`)              | 6     | 10     |
| **Total**                                        | 17    | **48** |

Fast Refresh only matters for modules that a Vite dev server (the app or
Storybook) loads in a browser. Vitest never runs Fast Refresh, so the 10
`tests/unit/**` errors have no runtime meaning.

### Per-file inventory

| File                                                                    | Err | Component(s) kept                           | Non-component exports causing errors                                                                                          | Importers / hidden coupling                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | --- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ClientApp/src/analytics/GoogleAnalytics.tsx`                           | 3   | default `GoogleAnalytics`                   | `trackGAEvent`, `trackGAPii`, `trackGAPageView` (l.59)                                                                        | Component: `Layout`, `WizardStep` (2 prod). Helpers: 14 prod files plus about 25 tests that `vi.mock('@/analytics/GoogleAnalytics')`, `tests/unit/helpers/typedPartialMockTypes.d.ts:32`, `quality/test_regression.ts:111`, `analysis/topology.json` |
| `ClientApp/src/components/SlateEditor/SlateEditor.tsx`                  | 3   | `SlateEditor`                               | `serializeToHtml` (l.25), `isBreakTag` (l.89), `isEmptyParagraphContent` (l.99)                                               | `appMessages.tsx:110` does `await import(SlateEditor)` only to get `serializeToHtml`. `tests/unit/components/SlateEditor/SlateEditor.test.tsx`. Per-file coverage reached 100% in `15e36b6f` and must be kept                                        |
| `ClientApp/src/components/forms/RhfForm/index.tsx`                      | 2   | `RhfForm`                                   | `useRhfFormApi` (l.41), `useIsRhfShell` (l.50)                                                                                | `SaveAndExitButton`, `SubmitFormButton`, `tests/unit/helpers/rhfShell.tsx`, `wizardYupResolver.test.tsx`                                                                                                                                             |
| `ClientApp/src/components/forms/RhfHidableField/hiddenRulesContext.tsx` | 1   | `RhfHiddenRulesProvider`                    | `useHiddenRules` (l.30)                                                                                                       | `RhfForm/index.tsx`, `RhfHidableField/index.tsx`                                                                                                                                                                                                     |
| `ClientApp/src/components/forms/RhfHidableField/index.tsx`              | 1   | `RhfHidableField`                           | re-export of `useHiddenRules` (l.22 col 34)                                                                                   | No external importer of the re-export found                                                                                                                                                                                                          |
| `ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx`         | 2   | default step component                      | `useInstrumentAndRequestLookups` (l.66), `useStableToday` (l.189), both "exported for unit testing"                           | `tests/unit/routes/requestForQuote/instrumentAndRequestLookups.test.tsx` only                                                                                                                                                                        |
| `ClientApp/src/routes/ta/applicationAndInstrument.tsx`                  | 4   | default step component                      | re-export block of `applicationTypes`, `newCertificateSubOptions`, `variationSubOptions`, `otherApprovalSubOptions` (l.33-38) | Real definitions live in `./applicationOptions.ts`; `ApplicationSummary.tsx:10` imports `applicationTypes` from somewhere (confirm the path)                                                                                                         |
| `ClientApp/src/routes/ta/instrumentInfoPanel.tsx`                       | 2   | default `InstrumentInfoPanel`               | `enum InstrumentCategory` (l.11), `enum InstrumentType` (l.18)                                                                | `RouteInventory.docs.mdx` records **0 references** to `InstrumentCategory`. Literal search finds no use of either enum outside the definition, so they look dead                                                                                     |
| `ClientApp/src/storybook/modalsStoryHelpers.tsx`                        | 11  | `DeleteConfirmationDemo`, `SaveAndExitDemo` | 11 constants and functions (l.53-348)                                                                                         | One importer: `components/modals/Modals.stories.tsx`                                                                                                                                                                                                 |
| `ClientApp/src/storybook/storybookHarness.tsx`                          | 8   | `PortalStoryRouter`                         | `default*` fixtures (l.54-120), `withPortalProviders` (l.667)                                                                 | **92 importers** of `withPortalProviders` and friends. `PortalStoryRouter` has 2: `.storybook/preview.tsx`, `tests/unit/storybook/routeHarness.test.tsx`                                                                                             |
| `ClientApp/src/storybook/withReactAriaEvaluation.tsx`                   | 1   | local `ReactAriaEvaluationFrame`            | decorator `withReactAriaEvaluation` is the only export                                                                        | Module-level counter `mountedEvaluationStories` lives with the component                                                                                                                                                                             |
| `tests/unit/components/inputs/rhfTestHarness.tsx`                       | 1   | `FieldHarness`                              | `createFormHandle` (l.23)                                                                                                     | test-only                                                                                                                                                                                                                                            |
| `tests/unit/helpers/formik.tsx`                                         | 1   | `FormikWrapper`                             | `createSubmitSpy` (l.79)                                                                                                      | test-only                                                                                                                                                                                                                                            |
| `tests/unit/helpers/renderWithProviders.tsx`                            | 1   | local component                             | `renderWithProviders`                                                                                                         | test-only                                                                                                                                                                                                                                            |
| `tests/unit/helpers/renderWithRouter.tsx`                               | 1   | local component(s)                          | `renderWithRouter`, `*_TEST_ID` constants                                                                                     | test-only                                                                                                                                                                                                                                            |
| `tests/unit/helpers/requestListFixtures.tsx`                            | 5   | `LocationDisplay`                           | `modalDispatch`, `resetRequestListMocks`, `renderInDashboardList`, `baseRequest`, `instrumentRequest`                         | test-only                                                                                                                                                                                                                                            |
| `tests/unit/helpers/rhfShell.tsx`                                       | 1   | `ShellControls`                             | `renderRhfShell` (l.36)                                                                                                       | test-only                                                                                                                                                                                                                                            |

### Hidden coupling to respect

1. **Storybook coverage manifest and inventories.**
   `ClientApp/src/storybook/coverageManifest.json`,
   `ClientApp/src/components/ComponentInventory.docs.mdx`,
   `ClientApp/src/routes/RouteInventory.docs.mdx` and
   `docs/review-packages/*.md` key entries by `file#export` with stored digests.
   Moving an export invalidates entries; `scripts/storybook-coverage.mjs` and
   `tests/unit/storybook/evidenceFreshness.test.ts` check them.
2. **Partial-mock tests.** About 25 tests `vi.mock` the GoogleAnalytics module
   by path. A moved export is not intercepted by a mock of the old path.
3. **Per-file coverage.** `15e36b6f` closed a 99% line gap in `SlateEditor.tsx`.
   New files created by a split inherit the same coverage expectation.
4. **Lazy chunk.** `appMessages.tsx` imports `SlateEditor` dynamically. Moving
   `serializeToHtml` changes what that chunk contains; the Storybook bundle-size
   plan (`2026-10-19-storybook-bundle-size-remediation.md`) is a related gate.
5. **`noInlineConfig`.** No `eslint-disable` escape hatch.
6. **Repository edit boundaries.** `CLAUDE.md` allows free edits only under
   `ClientApp/src/**/*.{ts,tsx}` and styles. `eslint.config.mjs` and `tests/**`
   are "other targets": confirm before editing. Also read
   `.github/instructions/config-policy.instructions.md` and
   `code-change-discipline.instructions.md` before Phase 1.

## Target State

- `npm run lint:diagnostics` reports **0** diagnostics; `npm run lint` is green.
- Every browser-loaded module under `ClientApp/src/**` and `.storybook/**`
  exports either only components or only non-components. No `eslint-disable`
  comments, no rule downgrade for production code.
- `react-refresh` is scoped to modules that a Vite dev server actually loads;
  `tests/unit/**` is no longer in its scope (it was never useful there).
- All moves are behaviour-preserving: no change in rendered output, analytics
  calls, form behaviour or exported names, only in the module that owns them.
- Test, coverage, manifest and inventory gates stay green.

### Strategy: "move the minority export"

For each file, move whichever side has the **fewest importers** into a new
module, so the number of edited import sites stays small:

| File                                                                       | Move out                             | Why this direction                                                     |
| -------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| `GoogleAnalytics.tsx`                                                      | the **component** (2 prod importers) | 14 prod files and about 25 mocks import the helpers and stay untouched |
| `storybookHarness.tsx`                                                     | `PortalStoryRouter` (2 importers)    | 92 importers of the fixtures and decorator stay untouched              |
| `modalsStoryHelpers.tsx`                                                   | the two Demo components              | 1 importer                                                             |
| `SlateEditor.tsx`, `RhfForm`, `instrumentAndRequest`, `hiddenRulesContext` | the helpers and hooks                | few importers, all known                                               |
| `applicationAndInstrument.tsx`, `RhfHidableField/index.tsx`                | delete re-exports                    | no real consumers                                                      |
| `instrumentInfoPanel.tsx`                                                  | delete dead enums (if confirmed)     | 0 references                                                           |

## Decisions needing your confirmation

- **D-1 (recommended):** drop `tests/unit/**` from the `nmi/react-refresh` scope
  instead of restructuring 6 test helper files. Removes 10 errors with a
  one-line config change and zero test-code churn. Alternative: split the 6
  helpers (about 6 new files, about 40 test importers touched), giving no
  runtime benefit.
- **D-2:** Storybook helpers get a structural fix (Phase 4). If the
  `PortalStoryRouter` split proves entangled with `withPortalProviders`, fall
  back to scoping `ClientApp/src/storybook/**` out of the rule (same one-line
  config style as D-1). Decide at the Phase 4 gate, not now.
- **D-3:** delete `InstrumentCategory`/`InstrumentType` if Phase 0 confirms they
  are unused (otherwise move to `instrumentInfoPanel.types.ts`).
- Per `CLAUDE.md`, confirmation is needed before editing `eslint.config.mjs`
  (D-1) and the `tests/**` import sites (Phases 2-3).

## Affected Files

| File                                                                                                | Change                                                                                                                                        | Dependencies                                                                                                           |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs`                                                                                 | modify (scope `nmi/react-refresh`; D-1)                                                                                                       | blocks nothing; verify `tests/unit/config/eslintPolicy.test.ts`                                                        |
| `ClientApp/src/components/SlateEditor/slateHtml.ts`                                                 | create (`escapeHtml`, `serializeToHtml`, `isBreakTag`, `isEmptyParagraphContent`; `CustomElement` type moves with them or to `slateTypes.ts`) | blocked by Phase 0; blocks `SlateEditor.tsx`, `appMessages.tsx`, SlateEditor tests                                     |
| `ClientApp/src/components/SlateEditor/SlateEditor.tsx`                                              | modify                                                                                                                                        | blocked by `slateHtml.ts`                                                                                              |
| `ClientApp/src/routes/ta/manage/appMessages.tsx`                                                    | modify (import from `slateHtml`; static import is fine, drops the dynamic import)                                                             | blocked by `slateHtml.ts`                                                                                              |
| `ClientApp/src/routes/requestForQuote/useInstrumentAndRequestLookups.ts`, `useStableToday.ts`       | create                                                                                                                                        | blocks `instrumentAndRequest.tsx`, its lookup test                                                                     |
| `ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx`                                     | modify                                                                                                                                        | blocked by the two hook files                                                                                          |
| `ClientApp/src/routes/ta/applicationAndInstrument.tsx`                                              | modify (delete re-export block)                                                                                                               | importers of the names repointed to `./applicationOptions` first                                                       |
| `ClientApp/src/routes/ta/instrumentInfoPanel.tsx`                                                   | modify (remove enums; D-3)                                                                                                                    | none                                                                                                                   |
| `ClientApp/src/components/forms/RhfHidableField/hiddenRulesContext.ts`                              | create (context + `useHiddenRules`)                                                                                                           | blocks `hiddenRulesContext.tsx`, `RhfForm`, `RhfHidableField`                                                          |
| `ClientApp/src/components/forms/RhfHidableField/RhfHiddenRulesProvider.tsx`                         | create (provider component)                                                                                                                   | blocked by `hiddenRulesContext.ts`                                                                                     |
| `ClientApp/src/components/forms/RhfHidableField/hiddenRulesContext.tsx`                             | delete                                                                                                                                        | after importers repointed                                                                                              |
| `ClientApp/src/components/forms/RhfHidableField/index.tsx`                                          | modify (drop `useHiddenRules` re-export)                                                                                                      | after context split                                                                                                    |
| `ClientApp/src/components/forms/RhfForm/rhfFormApiContext.ts`                                       | create (`RhfFormApi`, context, `useRhfFormApi`, `useIsRhfShell`)                                                                              | blocks `RhfForm/index.tsx`, `SaveAndExitButton`, `SubmitFormButton`, `rhfShell.tsx`, `wizardYupResolver.test.tsx`      |
| `ClientApp/src/components/forms/RhfForm/index.tsx`                                                  | modify                                                                                                                                        | blocked by context file                                                                                                |
| `ClientApp/src/analytics/GoogleAnalyticsTracker.tsx`                                                | create (component; final name set after reading its body)                                                                                     | blocks `Layout`, `WizardStep`, about 10 component-mock tests, `googleAnalytics.test.tsx`, `quality/test_regression.ts` |
| `ClientApp/src/analytics/GoogleAnalytics.tsx`                                                       | modify (helpers only), optionally `git mv` to `.ts` (specifiers are extensionless, so importers are unaffected)                               | blocked by tracker file                                                                                                |
| `ClientApp/src/storybook/modalsStoryDemos.tsx`                                                      | create (2 Demo components)                                                                                                                    | blocks `modalsStoryHelpers.tsx`, `Modals.stories.tsx`                                                                  |
| `ClientApp/src/storybook/PortalStoryRouter.tsx` (+ private helpers it needs)                        | create                                                                                                                                        | blocks `storybookHarness.tsx`, `.storybook/preview.tsx`, `routeHarness.test.tsx`                                       |
| `ClientApp/src/storybook/ReactAriaEvaluationFrame.tsx`                                              | create                                                                                                                                        | blocks `withReactAriaEvaluation.tsx`                                                                                   |
| `ClientApp/src/storybook/coverageManifest.json`, `*Inventory.docs.mdx`, `docs/review-packages/*.md` | regenerate via the repo script (do not hand-edit)                                                                                             | after all moves                                                                                                        |
| `tests/unit/**` import sites and `vi.mock` targets                                                  | modify (about 30 files; list generated in Phase 0)                                                                                            | after the matching source move                                                                                         |

## Execution Plan

One commit per numbered step, message format `refactor: <description>`, ending
with the Co-Authored-By trailer. After every step run the targeted lint plus the
affected tests. Nothing is pushed and no PR is opened without your approval.

### Phase 0: Baseline and discovery (read-only)

- [ ] 0.1 Record baseline: `npm run lint:diagnostics` → 48; note HEAD
      `37945ab9`.
- [ ] 0.2 Read `node_modules/eslint-plugin-react-refresh` to confirm which
      filenames it skips (`.stories.`, `.test.`) and how `allowConstantExport`
      and re-exports are treated.
- [ ] 0.3 Read `.github/instructions/config-policy.instructions.md` and
      `code-change-discipline.instructions.md`.
- [ ] 0.4 Confirm `InstrumentCategory`/`InstrumentType` are unused (also check
      `.storybook/`, `tests/`, MDX); confirm where `ApplicationSummary.tsx`
      imports `applicationTypes` from.
- [ ] 0.5 Read the `GoogleAnalytics` component body and decide the tracker file
      name; list every test that mocks or imports it (from the search results
      above) as the Phase 3 checklist. Check whether
      `tests/unit/helpers/typedPartialMockTypes.d.ts` is generated or manual.
- [ ] 0.6 Find how `coverageManifest.json` and the inventories are regenerated
      (`scripts/storybook-coverage.mjs` options) and capture a pre-change
      `npm run test:storybook:coverage` result for the touched files.
- [ ] Verify: written checklist of every import site per step; no edits made.

### Phase 1: Scope the rule to browser-loaded modules (D-1)

- [ ] 1.1 In `eslint.config.mjs`, give `nmi/react-refresh` its own
      `reactRefreshFiles = ['ClientApp/src/**/*.{jsx,tsx}', '.storybook/**/*.{jsx,tsx}']`
      (leave `jsxFiles` untouched for its other consumers). Add a short comment
      stating why tests are out of scope.
- [ ] 1.2 Check `tests/unit/config/eslintPolicy.test.ts` for assertions on the
      block; update only if it pins `files`.
- [ ] Verify: `npm run lint:diagnostics` → **38**;
      `npx vitest run --configLoader runner --config vitest.unit.config.ts tests/unit/config`.

### Phase 2: Helper and hook extraction (production source, low blast radius)

Do these in order; each is independent and revertible.

- [ ] 2.1 `SlateEditor`: create `slateHtml.ts` with `escapeHtml`,
      `serializeToHtml`, `isBreakTag`, `isEmptyParagraphContent` and the
      `CustomElement` type (keep `declare module 'slate'` in the component or a
      types file so the augmentation stays in the program). Import in
      `SlateEditor.tsx`; point `appMessages.tsx` and
      `tests/unit/components/SlateEditor/SlateEditor.test.tsx` at it. Verify:
      SlateEditor tests, appMessages tests, per-file coverage for both files
      stays 100%; the `build-storybook` chunk check is deferred to Phase 6.
- [ ] 2.2 `instrumentAndRequest`: move the two hooks to their own `.ts` files;
      update `instrumentAndRequestLookups.test.tsx` imports. Verify: that test
      file plus the RFQ route tests.
- [ ] 2.3 `applicationAndInstrument`: repoint any importer of the four option
      names to `./applicationOptions`, then delete the re-export block. Verify:
      `ApplicationSummary` and TA route tests, type-check.
- [ ] 2.4 `instrumentInfoPanel`: delete the two enums (D-3) and drop their
      manifest and inventory entries in Phase 5. Verify: type-check,
      `instrumentInfoPanel` tests and stories.
- [ ] 2.5 `RhfHidableField`: create `hiddenRulesContext.ts` (context,
      `useHiddenRules`) and `RhfHiddenRulesProvider.tsx`; repoint
      `RhfForm/index.tsx` and `RhfHidableField/index.tsx`; remove the
      `useHiddenRules` re-export; delete the old `.tsx`. Verify: RHF form tests
      and stories.
- [ ] 2.6 `RhfForm`: create `rhfFormApiContext.ts`; repoint `SaveAndExitButton`,
      `SubmitFormButton`, `rhfShell.tsx`, `wizardYupResolver.test.tsx`. Verify:
      `wizardYupResolver.test.tsx` (it asserts the "must be used inside RhfForm"
      error), wizard control tests.
- [ ] Verify (phase): the 15 errors in these six files are gone (3 + 2 + 4 + 2 +
      2 + 2 = 15, so diagnostics 38 → 23), `npm run type-check`,
      `npm run test:unit`.

### Phase 3: GoogleAnalytics component split (highest test blast radius)

- [ ] 3.1 Create the tracker component file; update `Layout/index.tsx` and
      `WizardStep.tsx` imports.
- [ ] 3.2 Retarget only the tests that mock or import the **default** export
      (`layout.test.tsx`, `wizardControls.behavior.test.tsx`, `WizardForm.*` ×2,
      `WizardRoutedStep.*` ×2, `headerFooterChrome.test.tsx`, and
      `googleAnalytics.test.tsx`, which exercises both halves and gets two
      imports). Tests that mock only `trackGAEvent` stay as they are.
- [ ] 3.3 Update `quality/test_regression.ts:111` and, if manual,
      `typedPartialMockTypes.d.ts`.
- [ ] 3.4 Optional: `git mv GoogleAnalytics.tsx GoogleAnalytics.ts` (no JSX
      left; extensionless specifiers keep every importer valid).
- [ ] Verify: GA-related tests, `npm run test:unit`, `npm run test:ci:quality`;
      diagnostics → **20**.

### Phase 4: Storybook helpers (gate D-2)

- [ ] 4.1 `modalsStoryHelpers`: move `DeleteConfirmationDemo` and
      `SaveAndExitDemo` to `modalsStoryDemos.tsx`; update `Modals.stories.tsx`.
      Clears 11 errors.
- [ ] 4.2 `withReactAriaEvaluation`: move `ReactAriaEvaluationFrame` and its
      counter to `ReactAriaEvaluationFrame.tsx`. Clears 1.
- [ ] 4.3 `storybookHarness`: use `tokensave_callees`/`tokensave_impact` to see
      what `PortalStoryRouter` (l.257 to about l.660) shares with
      `withPortalProviders` (l.667). If it is self-contained or needs at most
      one shared helper module, move it to `PortalStoryRouter.tsx`; update
      `.storybook/preview.tsx` and `tests/unit/storybook/routeHarness.test.tsx`
      (do **not** re-export the component from the harness: that re-creates the
      error). **Gate:** if the split needs more than one shared module, stop and
      take D-2's fallback.
- [ ] Verify: `npm run test:storybook` (421 tests at last run), the
      `tests/unit/storybook/*` tests; diagnostics → **0**.

### Phase 5: Generated artefacts and docs

- [ ] 5.1 Regenerate `coverageManifest.json`, the component and route
      inventories and any review packages using the repo script found in 0.6.
- [ ] 5.2 Do not hand-edit digests. If `evidenceFreshness.test.ts` or the
      coverage CLI reports stale evidence, re-review and refresh rather than
      suppress.
- [ ] 5.3 `analysis/topology.json` is an analysis snapshot; leave it unless a
      test reads it.
- [ ] Verify: `npm run validate:json`, `npm run test:storybook:coverage`.

### Phase 6: Final validation and cleanup

- [ ] 6.1 `npm run lint:diagnostics` (0 diagnostics) and
      `npm run lint:diagnostics:check`.
- [ ] 6.2 Full gates: `npm run lint`, `npm run lint:rules`,
      `npm run validate:json`, `npm run test:ci`, `npm run migration-check`
      (includes `build-storybook`; compare the Storybook chunk/bundle output
      with pre-change for the SlateEditor split).
- [ ] 6.3 Run `code-reviewer` and `verification-before-completion` before
      claiming done; no push or PR without your approval.
- [ ] Final command:
      `npm run lint && npm run type-check && npm run test:ci && npm run migration-check`

### Expected diagnostics count after each phase

| After                          | Errors left | Cleared    |
| ------------------------------ | ----------- | ---------- |
| Baseline                       | 48          |            |
| Phase 1 (config)               | 38          | 10 (tests) |
| Phase 2 (six production files) | 23          | 15         |
| Phase 3 (GoogleAnalytics)      | 20          | 3          |
| Phase 4 (Storybook)            | 0           | 20         |

## Rollback Plan

If something fails:

1. Every step is its own commit. Revert only the failing one with
   `git revert <sha>` (never `reset --hard` shared history; recent history on
   this branch already lost a commit once).
2. Phase 1 (config) is independent of Phases 2-4: revert it alone and the 10
   test-helper errors return without affecting the source moves.
3. Phase 3 is the riskiest. If more than a handful of mock-retarget failures
   appear that are not a simple path change, revert Phase 3 and keep the
   GoogleAnalytics errors (3) as the last open item for a separate decision.
4. If Phase 4.3 is entangled, take the D-2 fallback (scope
   `ClientApp/src/storybook/**` out of the rule) instead of forcing the split.
5. Safety net: the pre-plan baseline is HEAD `37945ab9`; compare with
   `git diff 37945ab9..HEAD --stat`.

## Risks

- **Mock path drift (Phase 3):** about 25 partial mocks depend on the module
  path. Mitigation: move only the minority export (the component), run the full
  unit suite after each batch, retarget by checking which tests reference the
  default export.
- **Coverage gates:** new modules must be 100%-covered by the existing tests.
  Mitigation: run per-file coverage after 2.1-2.6 and 3; add a test only where a
  moved branch loses coverage.
- **Stale manifest or inventory evidence:** moves change `file#export` keys.
  Mitigation: Phase 5 regenerates via the repo script and runs
  `evidenceFreshness`/coverage checks.
- **Bundle and chunk change (SlateEditor):** the dynamic import in
  `appMessages.tsx` goes away or shrinks. Mitigation: compare `build-storybook`
  output; keep the dynamic import if the bundle-size gate objects.
- **Circular imports:** extracting context and hook modules must not create a
  cycle (for example `RhfForm` ↔ `rhfFormApiContext`). Mitigation: the new
  modules import nothing from their component files; check with
  `npm run type-check` and the existing dependency-cycle tooling.
- **Behaviour regressions in forms:** RHF hooks and context identity must remain
  singletons. Mitigation: one `createContext` call, in the new module only.
- **Scope creep:** the plan changes ownership of exports, not behaviour. No
  refactoring of component bodies, no renames beyond the new modules.
- **Edit-boundary rules:** `eslint.config.mjs` and `tests/**` edits need your
  confirmation (see Decisions).
- **Rule intent:** if a reviewer wants Fast Refresh protection in tests too,
  D-1's alternative (split the 6 helpers) is available but costs about 40 test
  import edits for no runtime gain.
