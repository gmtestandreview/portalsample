# react-refresh/only-export-components: executable tasks

Spec and authority:
`docs/plans/2026-11-22-react-refresh-only-export-components.md` (the "move the
minority export" strategy). Base: commit `6fee6890`; 35 errors remain
(`npm run lint:diagnostics`, report `reports/eslint/diagnostics.json`).

## Global Constraints

- Behaviour-preserving moves only: no change to component bodies, rendering,
  analytics calls or exported names beyond the module that owns them.
- No `eslint-disable` comments; do not edit `eslint.config.mjs`.
- Do **not** re-export a component from a file that also exports non-components
  (it re-creates the error). Type-only re-exports are fine.
- Edit only the files each task names plus the import sites it lists. Other
  uncommitted files in the working tree (`.github/skills/**`,
  `.claude/skills/**`, `tests/unit/config/eslintPolicy.test.ts`) are not yours:
  never stage or revert them. Stage files by explicit path.
- Per-file coverage must stay at 100% for touched source files; use the existing
  tests, adding a test only where a moved branch loses coverage.
- Hooks may demand "facts" before the first edit/creation of a file: state
  callers, affected API and the task text, then retry.
- Each task: one commit `refactor: <description>` ending with the trailer
  `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Do not push.
- Verify per task: `npx tsc --noEmit`, `npx eslint <touched files>`, the named
  vitest files via
  `node --max-old-space-size=8192 ./node_modules/vitest/vitest.mjs run --configLoader runner --config vitest.unit.config.ts <files>`
  (storybook tests use `vitest.storybook.config.ts`).

## Task 1: instrumentAndRequest hooks

Move `useInstrumentAndRequestLookups` (l.66) and `useStableToday` (l.189) from
`ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx` into new `.ts`
files `useInstrumentAndRequestLookups.ts` and `useStableToday.ts` in the same
folder (helpers they depend on, such as `getLocalToday`, move or are imported as
needed without cycles). Import them back in `instrumentAndRequest.tsx` (used at
l.364 and l.488). Update
`tests/unit/routes/requestForQuote/instrumentAndRequestLookups.test.tsx` imports
(and any other importer found by search). Expected: the 2 errors in that file
clear. Verify with the lookup test plus other
`tests/unit/routes/requestForQuote` tests.

## Task 2: applicationAndInstrument re-exports

Delete the re-export block at l.33-38 of
`ClientApp/src/routes/ta/applicationAndInstrument.tsx` (`applicationTypes`,
`newCertificateSubOptions`, `variationSubOptions`, `otherApprovalSubOptions`).
First search the whole repo (including tests, stories and `.storybook`) for any
importer that takes those names from `applicationAndInstrument` and repoint it
to `./applicationOptions` (or the relative equivalent). The local `import` at
l.17-22 stays. Expected: 4 errors clear. Verify with tests under
`tests/unit/routes/ta` and `npx tsc --noEmit`.

## Task 3: delete unused instrument enums

Delete `export enum InstrumentCategory` and `export enum InstrumentType` from
`ClientApp/src/routes/ta/instrumentInfoPanel.tsx` (approved: unused). Prove
first by repo-wide literal search that nothing imports either enum (the
`selectedInstrumentCategoryId` props are unrelated). Leave generated artefacts
(`RouteInventory.docs.mdx`, `docs/review-packages/routes-ta.md`,
`coverageManifest.json`) to Task 10 and say so in the report. Expected: 2 errors
clear. Verify with `tests/unit/routes/ta/instrumentInfoPanel.test.tsx`.

## Task 4: RhfHidableField context split

Split `ClientApp/src/components/forms/RhfHidableField/hiddenRulesContext.tsx`:
new `hiddenRulesContext.ts` holds `HiddenRulesContext` (single `createContext`)
and `useHiddenRules`; new `RhfHiddenRulesProvider.tsx` holds the provider
component; delete the old `.tsx`. Repoint `RhfForm/index.tsx` (imports the
provider) and `RhfHidableField/index.tsx` (imports both). In
`RhfHidableField/index.tsx` drop the `useHiddenRules` re-export (l.22) but keep
re-exporting `RhfHiddenRulesProvider` only if some importer needs it (search; a
component re-export is allowed there because the file exports only components
after the change). Expected: 2 errors clear. Verify with tests under
`tests/unit/components/forms` that touch RHF hide rules.

## Task 5: RhfForm API context

In `ClientApp/src/components/forms/RhfForm/index.tsx` move `RhfFormApi`,
`RhfFormApiContext` (single `createContext`), `useRhfFormApi` and
`useIsRhfShell` into new `rhfFormApiContext.ts` (no import from `index.tsx`, so
no cycle). `index.tsx` imports the context; it must not re-export the hooks.
Repoint importers: `SaveAndExitButton/index.tsx`, `SubmitFormButton/index.tsx`,
`tests/unit/helpers/rhfShell.tsx`,
`tests/unit/components/forms/wizardYupResolver.test.tsx` (and any others found
by search, including stories). Expected: 2 errors clear. Verify with
`wizardYupResolver.test.tsx`, wizard control tests and form story tests that use
the submit buttons.

## Task 6: GoogleAnalytics component split

Move the default-exported `GoogleAnalytics` component out of
`ClientApp/src/analytics/GoogleAnalytics.tsx` into a new component file in the
same folder (name it `GoogleAnalyticsTracker.tsx` unless reading the component
suggests better). `GoogleAnalytics.tsx` keeps `trackGAEvent`, `trackGAPii`,
`trackGAPageView` (14 production importers and many mocks stay untouched);
optionally `git mv` it to `.ts` once no JSX remains (extensionless specifiers
keep importers valid). Update the 2 production importers
(`components/Layout/index.tsx`, `components/forms/WizardForm/WizardStep.tsx`).
Retarget only tests that mock or import the **default** export:
`tests/unit/components/layout.test.tsx`,
`tests/unit/components/forms/wizardControls.behavior.test.tsx`,
`WizardForm.characterization/navigation`,
`WizardRoutedStep.characterization/integration`, `headerFooterChrome.test.tsx`,
`tests/unit/analytics/googleAnalytics.test.tsx` (exercises both halves) and
`quality/test_regression.ts:111`; check whether
`tests/unit/helpers/typedPartialMockTypes.d.ts` is generated or manual and
update it if manual. Expected: 3 errors clear. Verify: full `npm run test:unit`
and `npm run test:ci:quality`.

## Task 7: modalsStoryHelpers demos

Move `DeleteConfirmationDemo` and `SaveAndExitDemo` from
`ClientApp/src/storybook/modalsStoryHelpers.tsx` into new
`ClientApp/src/storybook/modalsStoryDemos.tsx`; update
`ClientApp/src/components/modals/Modals.stories.tsx` (the only importer). If the
demos use private helpers or constants from the helpers file, import them from
it (no cycle: the helpers file must not import the demos). Expected: 11 errors
clear. Verify with `npm run test:storybook` for the Modals stories.

## Task 8: ReactAriaEvaluationFrame

Move `ReactAriaEvaluationFrame` and its module-level `mountedEvaluationStories`
counter and class-name constant from
`ClientApp/src/storybook/withReactAriaEvaluation.tsx` into new
`ReactAriaEvaluationFrame.tsx`; the decorator file imports it. Expected: 1 error
clears. Verify with stories/tests that use `withReactAriaEvaluation` (search).

## Task 9: PortalStoryRouter split (gate D-2)

Move `PortalStoryRouter` (and `PortalStoryRouterProps`, and private helpers only
it uses, such as `StoryRoute`) from
`ClientApp/src/storybook/storybookHarness.tsx` into new `PortalStoryRouter.tsx`.
Use call-graph tools to see what it shares with `withPortalProviders` (l.667).
Update `.storybook/preview.tsx` and `tests/unit/storybook/routeHarness.test.tsx`
(the only importers). Do not re-export it from the harness. **Gate:** if the
split needs more than one shared module or touches the 92 stories importers,
stop, do not commit, and report BLOCKED with the entanglement so the controller
can take the fallback (scope `ClientApp/src/storybook/**` out of the rule).
Expected: 8 errors clear. Verify: `tests/unit/storybook/*` and
`npm run test:storybook`.

## Task 10: generated artefacts and final lint

Find how `ClientApp/src/storybook/coverageManifest.json`,
`ClientApp/src/components/ComponentInventory.docs.mdx`,
`ClientApp/src/routes/RouteInventory.docs.mdx` and `docs/review-packages/*.md`
are regenerated (`scripts/storybook-coverage.mjs` options, package scripts) and
regenerate them with that script; never hand-edit digests. Then run
`npm run lint:diagnostics` (expect 0), `npm run validate:json`,
`npm run test:storybook:coverage` and `tests/unit/storybook` tests, and report
any stale-evidence failure rather than suppressing it. Commit regenerated files
only.
