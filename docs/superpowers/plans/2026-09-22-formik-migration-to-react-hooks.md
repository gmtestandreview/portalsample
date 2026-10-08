# Status: acceptQuote/paymentDetails migration (completed 2026-09-29)

**Merged to `main`:** `f654f9c0`
(`Merge branch 'feat/payment-details-rhf-migration'`)

The selected `acceptQuote/paymentDetails` migration is complete and shipped to
`origin/main`. The repository-wide Formik removal is not complete. This plan now
records the delivered outcome and the remaining dependency-ordered work required
before the `formik` package can be removed.

The generic template below names `src/features/checkout/CheckoutForm.tsx` as
the migration target. That file does not exist in this repository — this is
the NMI (portal.measurement.gov.au) customer portal, a government
metrology/accreditation service with no checkout/e-commerce feature. This
section is the repo-grounded status for the migration actually undertaken.

## Progress since 2026-09-29 (updated 2026-10-04)

Branch `refactor/formik-removal-steps-1-2`. Not yet merged to `main`.

<!-- markdownlint-disable MD013 -->

| Item                                                          | Status               | Commit     |
| ------------------------------------------------------------- | -------------------- | ---------- |
| Outstanding action 1: `reportRecipient` behavior suite        | Done                 | `3004131b` |
| Outstanding action 2: contracts, path helpers, resolver moved | Done                 | `3004131b` |
| Outstanding action 2: `FormikHelpers` removed from callbacks  | Done                 | `b14e037f` |
| Wave 1: standalone search filters (`filterMenu`, `paFilter`)  | Done                 | `5ac231da` |
| Wave 1: Storybook/test harnesses                              | Deferred (see below) | —          |
| Wave 2: `appDocuments`                                        | Done                 | `c5714509` |
| Wave 2: `appDetails` (form-free summary)                      | Done                 | `c5714509` |
| Wave 2: `summaryAndSubmit` org/application summaries          | Done                 | `c5714509` |
| Wave 2: wizard documents summary (still Formik)               | Deferred to Wave 5   | —          |
| Waves 3-5, shells (action 4), Formik removal (action 6)       | Not started          | —          |

<!-- markdownlint-enable MD013 -->

What landed:

- Library-neutral form types live in `components/forms/types.ts`, path helpers
  in `components/forms/formPath.ts`, and `saveAwareYupResolver.ts` sits in
  `components/forms/`. `getIn`/`setIn`/`FormikErrors` imports are gone from the
  shared utilities.
- `FormikHelpers` was an unused `_` placeholder in all 16 route props files. It
  was removed from `WizardStepProps` and `WizardRoutedStep`, so `abortSignal` is
  now the third callback argument. The only remaining `FormikHelpers` references
  are the `FormikForm` shell and `tests/unit/helpers/formik.tsx`, both replaced
  in action 4.
- `components/Inputs/RhfRadioButtonGroup` is the first RHF-native shared input,
  built beside the legacy `RadioButtonGroup`. The legacy one stays until its
  last Formik consumer moves.
- `filterMenu.tsx` and `paFilterMenu.tsx` use `useForm` + `FormProvider`. The
  `values` option replaces `enableReinitialize`;
  `reset(initialFilters ?? defaultFilter)` replaces `resetForm`.
- `storybookHarness.tsx` gained an additive `portal.rhf` parameter; the Formik
  path is unchanged.
- Wave 2 inputs, each beside its Formik twin with behavior tests (and `portal.rhf`
  stories for the inputs): `RhfSelectInput`, `RhfAttachment` with
  `RhfAttachmentItem`, and the route fork `routes/ta/rhfSupportingDocuments.tsx`.
  Shared pure helpers moved to `supportingDocumentsHelpers.ts`.
- `appDocuments` uses `useForm({ values })` with `createSaveAwareYupResolver`. It
  no longer mutates form state when it strips `documentBytes` from the commit
  payload.
- Form-free TA summaries in `routes/ta/summary/` (`OrganisationSummary`,
  `ApplicationSummary`, `ContactSummary`), built from `SummaryDisplay` and the
  page's hiding rules. `appDetails` uses them with a `FormProvider` for the
  documents list, and `summaryAndSubmit` uses them for the organisation and
  application sections (rules read from Formik `status.hidden`).
  `applicationOptions.ts` holds the application-type option constants.
- `summaryParity.test.tsx` renders the Formik and form-free summaries from five
  fixtures and requires the same markup. One deliberate difference: the Formik
  summary printed an empty "Applying for" value (a `ul` that `SummaryDisplay`
  never draws); the new view shows the chosen sub-options. The contact block no
  longer has a "No details added" branch (only reachable with `''`).
- `RhfTextInput` was not needed and was not built.

Gates at the last full run (Wave 2 complete): `tsc --noEmit`, ESLint and
Prettier clean; `test:unit:coverage` 198 files, 2,260 tests, 100% statements,
branches, functions and lines. Storybook interaction tests passed for
`RhfSelectInput`, `RhfAttachment`, `appDocuments`, `appDetails`,
`summaryAndSubmit`, and the `OrganisationAndContact` and
`ApplicationAndInstrument` step stories. E2E was not run on this branch. The
Storybook MCP server was unreachable (`ECONNREFUSED`), so only documented props
of in-repo components were used.

### Next

1. **Close out Wave 2.** Wave 2 is committed (`c5714509`) and reviewed
   (`typescript-reviewer` and `code-reviewer`: no critical findings). Fixed from
   the reviews: object URLs are created once per document and revoked, the
   missing-category message shows after a failed submit, and each delete button
   names its file. Still to do:
   - Run `npm run test:e2e:app` and `npm run test:e2e:storybook` on an idle
     machine; the first app run failed every test on dev-server cold start.
   - Check `appDetails` and the wizard's last step on a real application: the
     "Applying for" sub-options now show.
   - Open the PR for this branch.
   - Review follow-ups, not blocking: a failed upload replaces the whole list
     with `[]` (same as the Formik twin); `onCategoryUpdate` rejections are
     unhandled; each row's select is labelled only "Category"; the document
     link hardcodes `application/pdf`; the per-row error state is index-keyed,
     so after a delete the row that moves up inherits it (consider
     `useFieldArray`); the details tab renders empty summaries for one frame
     before the load.
2. **Wave 3: remaining accept-quote steps, then delete the payment-details
   bridge.** Build only the shared pieces those steps need, each beside its
   Formik twin: `RhfTextInput` (first real consumer), `RhfCheckbox`, an RHF
   `HidableField`, and RHF `ContactDetails`. Write a behavior suite for each
   step before moving it, as `reportRecipient` did.
3. **Apply the form-free summary approach to request-for-quote.**
   `requestForQuoteSummary.tsx` has its own `OrganisationAndContact` and
   `InstrumentAndRequest` summary branches. Capture a parity baseline first,
   then swap, as for the TA flow. This shrinks Wave 5 by removing more
   `isSummary` branches.
4. **Wave 4: account and contact create/update flows.** Needs `AddressLookup`,
   `AuthorisedAgent`, `NumberInput` and the remaining Formik-bound inputs in RHF
   form.
5. **Wave 5: request-for-quote and the TA wizard.** Move the TA wizard shell,
   then delete the Formik `OrganisationAndContact`, `ApplicationAndInstrument`
   and `SupportingDocuments`, and replace the wizard's documents summary with
   `RhfSupportingDocuments`. Their `isSummary` branches are already unused by
   the TA summary pages.
6. **Actions 4 and 6.** Replace `FormikForm`, `WizardForm`, `WizardRoutedStep`
   and the test/story harnesses with the RHF shell, then remove Formik after
   the final repository-wide search is empty.

Open decisions: whether `RhfSelectInput` should gain `readOnly`,
`displayHorizontally` and `inlineHelp` now or with their first consumer (it
currently omits them), and whether the form-free summary pattern should become
the default for every read-only page.

### Lessons learned

From the earlier accept-quote work:

- **Verify the "zero consumer changes" premise before building an adapter.**
  Three inventory rounds showed ~30 files import `formik` directly, so a shim at
  `FormikForm` is unreachable and the blast radius includes unrelated features
  (the dashboard filter menus). Forking locally was the correct pivot.
- **A wiring change and its consumer import swap are atomic.** They cannot be
  merged separately, so verify against the full test baseline before committing.
- **Tests that stub every Formik-bound child give no real assurance.** Write
  behavior tests (real interaction, payload, reinitialization) before moving a
  step. `reportRecipient` needed this first.
- **Do not leave a second Formik-shaped API behind.** The `rhfCompat.tsx`
  adapter was deleted; Formik and RHF components stay explicitly separate.

From Waves 1-2 prep (this branch):

- **Check whether a parameter is used before designing its replacement.**
  `FormikHelpers` was never invoked, so removal beat a project-owned contract.
- **Existing behavior tests are the safety net.** The filter-menu tests had no
  Formik references, so they passed unchanged across the migration. Run them
  green before editing and after.
- **Harnesses follow their hosts.** Story and test harnesses wrapping
  Formik-bound inputs or wizard shells can only move with those components. Add
  an RHF option beside the Formik one when a new RHF story needs it.
- **RHF differences to design for:**
  - `fieldState.isTouched` is false after a submit attempt, so show errors on
    `isTouched || formState.isSubmitted`.
  - `values` deep-compares like `enableReinitialize`, so unsaved selections are
    discarded if the saved value changes while open.
  - Store the option's typed value (`field.onChange(option.value)`), not the
    event string, so boolean and numeric options work.
  - Attach `field.ref` to the first radio only, so error focus lands there.
  - Type options explicitly rather than reusing the legacy index-signature type,
    which silently accepted unsupported props such as option-level `onChange`.
- **Test mechanics:** use `userEvent.tab()` to blur, not `element.focus()` /
  `.blur()` (causes `act()` warnings); put the control that moves focus before
  the field in the DOM. The repo holds 100% coverage, so add tests for
  `descriptor`, `subFormField`, horizontal layout, and nullish branches.
- **Challenge the plan's premise before building.** The plan said Wave 2 needed
  text, select and attachment inputs; `appDetails` actually shared its summary
  sections with the Formik wizard. Reading the consumers first changed the
  approach from forking ~880 lines to a form-free summary.
- **Baseline before swapping a read-only view.** A markup-parity test against the
  old output found a hidden defect (the empty "Applying for" value) and kept
  every other difference visible.
- **Summary views need no form.** Read-only pages should take plain values and
  rules, not a form context.
- **RHF test mechanics:** `defaultValues` do not update on rerender, so use
  `values` in harnesses that rerender; `handleSubmit` clears manual `setError`
  errors on fields without rules, so use a resolver to test error display.
- **Hooks can litter.** A Sonar hook created an empty `.sonar` folder in the
  shell's working directory and broke the coverage-drift test; keep the shell
  at the repository root.
- **Tooling:**
  - Keep line endings when scripting edits (`newline=''`), then run Prettier on
    changed files.
  - A Prettier pass over the docs reformatted an unrelated MDX file; revert
    unrelated formatting before committing.
  - This plan's filename once carried a hidden U+200E suffix, which broke path
    lookups; it is renamed in the commit that records this status.
  - Run the focused tests with `--reporter=default`, or piped output hides
    warnings.

## Resolved target

`ClientApp/src/routes/acceptQuote/paymentDetails.tsx` — the simplest of a
4-step wizard flow (`reportRecipient` → `paymentDetails` → `deliveryAndReturn`
→ `summaryAndAccept`), chosen as the smallest safe migration target: 2 fields
plus one conditional `contact` sub-block, one `.when()` validation branch, no
address lookups, no array fields, no async validation, no file inputs.

## Phase 1 — Inventory (complete)

None of the 4 acceptQuote step files import Formik directly. All Formik
wiring lives in shared components: `FormikForm` (the `<Formik>` boundary,
`enableReinitialize`, a synthetic `values.saveAndExit` flag switching between
soft/hard Yup validation), `WizardForm`/`WizardRoutedStep` (routing, step
orchestration), `HidableField` (conditional visibility via
`useFormikContext`), `ContactDetailsInput`, `UnsavedFormPrompt`, and every
`Inputs/*` primitive (`TextInput`, `SelectInput`, `RadioButtonGroup`,
`Checkbox`, `AddressLookup`, etc. — all `useField`-based).

`FormikHelpers` is typed but never actually invoked in acceptQuote's
`*Props.ts` files, de-risking imperative-API concerns. Test coverage is
uneven: `paymentDetails.test.tsx` stubs out all Formik-bound children as dumb
divs (weak real assurance); `reportRecipient.tsx` has no dedicated test at
all.

## Phase 2 — Migration plan (complete, later superseded — see below)

Original plan: build a transitional RHF-compatibility **adapter** at the
shared `FormikForm`/`Inputs` boundary — swap `FormikForm`'s internal
`<Formik>` for `useForm()` + a custom save-aware Yup resolver, with a
`useField`/`useFormikContext`/`Field` compatibility shim so all 9 routes
consuming these shared components (`acceptQuote`, `ta`, `requestForQuote`,
`contact` create/update, `account` create/update/addBranch) would need zero
changes.

Pre-migration regression baseline captured: **182 test files / 2064 tests,
all passing** (`npm run test:unit`).

## Phase 3 — Implementation: three rounds of scope correction

The adapter premise ("consumers need zero changes") turned out to be false,
in three escalating discoveries:

1. **Shared consumers import `formik` directly, not through any
   indirection.** ~30 files (`Inputs/*`, `HidableField`, `ContactDetailsInput`,
   `UnsavedFormPrompt`, `SubmitFormButton`, `SaveAndExitButton`, and several
   route files) call `useField`/`useFormikContext`/`<Field>` imported straight
   from the `formik` package. A shim exposed only by `FormikForm` internals is
   unreachable — swapping `FormikForm`'s `<Formik>` for `useForm()` would make
   every one of these throw Formik's "context is undefined" invariant at
   runtime.
   - **Decision:** proceed with a **narrow, mechanical import-swap** — change
     the import source in each of those files, keep every destructuring/JSX
     usage byte-identical.

2. **`FormikForm` itself unconditionally renders `UnsavedFormPrompt`**, which
   also calls the real `formik` package's `useFormikContext()` directly (as
   does `RouteLeavingGuard`, which it renders). So `FormikForm`'s internals
   cannot be swapped in isolation, even temporarily — the wiring change and
   the consumer import-swap are atomic, not independently mergeable. The full,
   precise inventory (multiline-aware) came to **30 files** needing the
   runtime-context import swapped, including 4 route-level files inside the
   "untouched" routes (`ta/supportingDocuments.tsx`,
   `ta/applicationAndInstrument.tsx`,
   `requestForQuote/instrumentAndRequest.tsx`,
   `requestForQuote/organisationAndContact.tsx`).
   - **Decision:** proceed atomically — wire `FormikForm` and swap all
     affected imports together, verified against the 2064-test baseline
     before committing.

3. **The blast radius isn't bounded by "9 routes" at all.**
   `ClientApp/src/components/SearchFilter/filterMenu.tsx` — an unrelated
   dashboard filter-menu feature — renders `Inputs/RadioButtonGroup` inside
   its own standalone `<Formik>` instance, entirely outside
   `FormikForm`/`WizardForm`. The same likely applies to `paFilterMenu.tsx`
   and three Storybook story/harness files that also instantiate `<Formik>`
   directly. Once the shared `Inputs/*` primitives switch their
   `useField`/`useFormikContext` source, **every** consumer breaks, not just
   the wizard-form routes — there is no clean shared-component boundary in
   this codebase.
   - **Decision:** abandon the shared-boundary adapter. Switch to **forking
     the specific inputs `paymentDetails.tsx` needs** into local, RHF-native
     variants used only by this one step, touching zero shared files.

## A further wrinkle for the fork-locally approach

`WizardRoutedStep.tsx` unconditionally wraps every step in a real `<Formik>`
(via `<FormikForm>`), rendering the step component deep inside that tree via
a render-prop, with the surrounding `<Form onSubmit={formik.handleSubmit}>`
HTML element wired to Formik's own submit handler — not something
`paymentDetails.tsx` controls. This means a true zero-shared-file fork cannot
just stop importing Formik: `paymentDetails.tsx` must run its own `useForm()`
internally for its actual fields (using the already-built save-aware Yup
resolver — see below) and **sync its values into the outer Formik instance
via `setFieldValue`** before/on submit, so the existing
`WizardRoutedStep`/`FormikForm` submit pipeline (`removeHidden` →
`removeEmptyKeys` → `onSaveAndExit`/`onSubmit`) keeps working completely
unchanged. This keeps the change scoped to `paymentDetails.tsx` alone, at the
cost of a one-way value-sync bridge inside that file.

## Delivered outcome

The final implementation replaced the abandoned compatibility-shim approach with
a scoped React Hook Form implementation while preserving the existing
Formik-owned wizard shell.

- `paymentDetails.tsx` now owns an RHF `useForm()` instance and no longer
  renders the shared Formik-bound input primitives.
- `paymentDetailsFormFields.tsx` contains the RHF-native field controls for the
  payment method, purchase-order number, invoice-contact choice, and conditional
  contact fields.
- `paymentDetailsFormikBridge.tsx` synchronizes the RHF values and validation
  state with the outer Formik wizard. This is an intentional transition seam,
  not the final repository architecture.
- `saveAwareYupResolver.ts` preserves the existing soft validation for
  save-and-exit and hard validation for step submission.
- The abandoned `rhfCompat.tsx` adapter and its compatibility tests were removed
  rather than leaving a second Formik-shaped API in the codebase.
- Behavioral tests now exercise real field interaction, conditional contact
  rendering, validation, draft save behavior, payload synchronization, and
  reinitialization.
- `react-hook-form` is committed at `^7.89.0`. Formik remains at `^2.4.9`
  because the rest of the application still depends on it.

The migration also corrected integration-gate regressions exposed while merging
the latest `main`: supporting-document error-key typing, the message count test
expectation, and the signed-out E2E redirect wait.

## Verification outcome

The merged tree was validated before it was pushed to `origin/main`:

- `npm run type-check` passed.
- `npm run lint -- --no-cache` passed.
- The focused migration suite passed: 4 files and 55 tests.
- `npm run test:unit` passed: 184 files and 2,083 tests.
- `npm run test:e2e:app -- --workers=1` passed: 31 tests.
- The `PaymentDetailsStep` and `PaymentDetailsPostpaid` Storybook interaction
  tests passed with accessibility checks enabled.
- A final code review found no actionable issues.

## Current Formik inventory

The selected page is RHF-native internally, but the accept-quote flow is not
Formik-free end to end because `paymentDetailsFormikBridge.tsx` still calls
`useFormikContext()` and `WizardRoutedStep` still renders `FormikForm`.

The repository-wide scan after the merge found:

| Area                       | Direct `formik` import files |
| -------------------------- | ---------------------------: |
| `ClientApp/src/components` |                           38 |
| `ClientApp/src/routes`     |                           25 |
| `ClientApp/src/storybook`  |                            1 |
| `tests/unit`               |                           32 |

The 25 route imports are distributed across `acceptQuote` (5), `account` (3),
`contact` (1), `requestForQuote` (6), and `ta` (10). Seventeen shared
`components/Inputs` modules are still Formik-bound. The remaining imports
include runtime hooks/components, Formik helper types in route props, shared
form utilities, stories, and test harnesses.

## Outstanding actions for complete Formik removal

These actions are ordered by dependency. Replacing shared inputs in place before
their consumers move would break every remaining Formik form, so the new RHF
path must coexist with the legacy path until each consumer is migrated.

### 1. Lock down cross-cutting behavior

- Add or retain user-behavior tests for validation timing, save-and-exit,
  hidden-field stripping, reinitialization, dirty state, route blocking, server
  errors, and exact submitted payloads.
- Add coverage for `reportRecipient` before changing the remaining accept-quote
  steps; it still lacks a dedicated behavior suite.
- Record a fresh `rg` inventory at the start of each migration wave so direct
  imports, stories, mocks, and type-only references are not missed.

### 2. Remove Formik from shared contracts and utilities

- Move `Validation`, `DiscardProps`, `ModalProps`, and other library-neutral
  contracts out of `components/forms/FormikForm/types.ts`.
- Replace unused `FormikHelpers` parameters in route prop callbacks with a
  project-owned submission contract, or remove the parameter where call sites
  prove it is unused.
- Replace Formik utility imports such as `getIn`, `setIn`, `isObject`,
  `FormikErrors`, and `FormikValues` with project-owned typed helpers.
- Rename `saveAwareYupResolver.ts` out of the `FormikForm` directory once no
  Formik-owned type is required there.

### 3. Build the RHF-native shared form layer

- Provide RHF-native equivalents for the 17 Formik-bound `Inputs` modules, using
  `register()` for native inputs and `useController()` or `Controller` for
  controlled components.
- Migrate cross-cutting components: `ContactDetails`, `HidableField`,
  `ErrorSummary`, `SubmitFormButton`, `SaveAndExitButton`, and
  `UnsavedFormPrompt`.
- Make `RouteLeavingGuard` consume library-neutral dirty/error state instead of
  calling `useFormikContext()` itself.
- Preserve labels, descriptions, `aria-*` links, value coercion, blur/touched
  timing, focus behavior, conditional values, attachment arrays, and lookup
  behavior in component tests and Storybook stories.
- Keep Formik and RHF components explicitly separate during the transition; do
  not introduce another compatibility API that imitates Formik.

### 4. Replace the form and wizard shells

- Introduce an RHF form shell using `FormProvider`, `handleSubmit()`, the
  save-aware Yup resolver, and explicit `reset()` behavior for the current
  `enableReinitialize` contract.
- Port `WizardForm`, `WizardRoutedStep`, and next/previous controls while
  preserving cross-step state, draft saves, back/forward navigation, hidden
  value removal, loading/submitting state, and route-leaving prompts.
- Define project-owned submit/save callback types so route modules no longer
  expose `FormikHelpers`.
- Once the RHF wizard owns accept-quote state, delete
  `paymentDetailsFormikBridge.tsx` and test `paymentDetails` directly inside the
  RHF wizard.

### 5. Migrate consumers in reviewable waves

Suggested waves, with focused behavior tests and Storybook checks in each:

1. Standalone search filters and Storybook/test harnesses.
2. Single-page TA management forms such as `appDocuments` and `appDetails`.
3. The remaining accept-quote steps, then remove the payment-details bridge.
4. Account and contact create/update flows.
5. Request-for-quote and the remaining TA wizard flows, including lookup,
   conditional, attachment, and nested-object fields.

Delete a legacy Formik component only after `rg` confirms that its final
consumer has moved.

### 6. Remove Formik and close the migration

- Remove Formik-only wrappers, helpers, stories, test utilities, mocks, and type
  aliases after their final consumers are gone.
- Run repository-wide searches for `formik`, `Formik`, `useField`,
  `useFormikContext`, `FormikHelpers`, and JSX Formik boundaries. Classify
  comments or historical documentation separately from executable imports.
- Run `npm uninstall formik` only when owned source, tests, stories, and
  configuration have zero executable Formik references; commit the resulting
  `package.json` and lockfile changes.
- Update component inventory and migration-readiness documentation to describe
  the RHF architecture and remove obsolete Formik guidance.
- Run the full release gate: `npm run migration-check`, `npm run lint`,
  `npm run test:ci`, `npm run test:e2e`, and the affected Storybook interaction
  tests.
- Manually exercise save-and-exit, browser back/forward, refresh/reload,
  conditional fields, attachments/lookups, invalid-submit focus, and persisted
  values across every migrated wizard.

Repository-wide completion means the executable Formik search is empty, the
dependency and lockfile entries are gone, all route and Storybook flows use the
RHF form layer, and the full validation gate passes on that exact tree.

---

## Execution discipline and phase gates (original generic template)

This is a master migration prompt. Do not attempt to complete the full migration
in one pass.

Work in phases and stop after each phase with a concise report.

Migration target: src/features/checkout/CheckoutForm.tsx Scope: migrate this
form only. Do not edit unrelated forms. Start with Phase 1 only. Do not change
files yet.

## Phase 1: Inventory and impact analysis only

Do not edit files in this phase.

Report:

- Formik APIs found
- Files involved
- Shared components involved
- Upstream dependencies
- Downstream consumers
- Validation approach
- Default/reset/reinitialize behavior
- Conditional, array, async, file, wizard, autosave, or imperative API risks
- Existing test coverage
- Recommended smallest safe migration target

Stop after this phase.

### Phase 2: Migration plan only

Do not edit files in this phase unless explicitly instructed.

Report:

- Proposed migration strategy
- Formik → React Hook Form mappings to use
- Shared component strategy
- Tests to add or update before implementation
- Validation and payload preservation risks
- Commands to run after implementation
- Any assumptions or unresolved questions

Stop after this phase.

### Phase 3: Implementation

Before editing, restate the 5 highest-risk contracts for this form:

1. Submitted payload shape
2. Validation timing
3. Default/reset behavior
4. Shared component impact
5. Downstream side effects

Edit only the selected migration target and directly required supporting files.

Do not:

- Migrate unrelated forms
- Replace shared Formik-aware components in place without checking consumers
- Remove Formik globally
- Redesign UI
- Refactor unrelated code
- Change formatting outside touched logic

Keep a focused diff.

### Phase 4: Verification

Run the most relevant available checks.

Report:

- Exact command
- Result
- Failure details, if any
- Checks not run and why

Do not claim a check passed unless it was actually run.

### Phase 5: Scoped cleanup and final report

Clean up only within the migrated area.

Report:

- Files changed
- Formik APIs removed
- React Hook Form APIs introduced
- Upstream/downstream contracts verified
- Remaining Formik references
- Remaining work
- Manual QA recommendations

Global Formik dependency removal is allowed only after repository-wide reference
checks confirm no remaining usage.

---

## Prompt

You are an expert React, TypeScript, testing, accessibility, and form-state
migration engineer helping migrate this codebase from Formik to React Hook Form.

## Goal

Migrate the selected Formik form, form page, or form component to React Hook
Form with no user-visible behavior regressions.

Preserve existing UI, validation behavior, validation timing, accessibility
attributes, submitted value shape, default/reset behavior, dirty/touched
behavior, loading/submitting behavior, imperative parent contracts, persisted
form state, and downstream integrations unless a change is explicitly required
and explained.

## Migration target

Use the user-provided target path, component, form name, route, or feature area.

If the user does not provide a specific target, inspect the repository and
identify Formik usage, then recommend the smallest safe first migration target.
Do not migrate the whole application by default.

## Inputs

Use the code currently available in the workspace, including:

- Existing Formik form files
- Existing reusable Formik-aware input components
- Existing validation schemas, such as Yup or Zod
- Existing package versions and lockfiles
- Existing API calls, submit handlers, analytics, routing, and state management
  integrations
- Existing unit, integration, end-to-end, and Storybook examples
- Existing test utilities, fixtures, mocks, providers, and decorators
- Existing project conventions for TypeScript, imports, testing, styling,
  accessibility, and component organization

If required information is missing, inspect the repository first. Ask only when
the missing detail would materially change the implementation.

## Non-negotiable constraints

- Do not migrate unrelated forms unless necessary for the selected target.
- Do not redesign the UI.
- Do not rename fields unless explicitly required.
- Do not change submitted data shape unless explicitly required and documented.
- Do not weaken validation.
- Do not remove accessibility behavior.
- Do not replace the validation library unless explicitly requested.
- Do not remove Formik globally until all remaining references are confirmed
  gone.
- Do not claim commands passed unless they were actually run.
- Do not mix Formik and React Hook Form inside the same form unless there is no
  practical alternative; explain the reason if unavoidable.
- Do not directly replace shared Formik-aware components in place unless all
  consumers are understood and the change is safe.
- Prefer incremental, reviewable changes over a large rewrite.
- Keep tests focused on user behavior rather than Formik or React Hook Form
  internals.
- Keep the diff focused. Avoid unrelated refactors, formatting churn, component
  redesigns, validation-library replacement, dependency churn, or opportunistic
  cleanup outside the selected migration area.

## Core Formik to React Hook Form mappings

Use these mappings unless repository-specific constraints require a justified
alternative:

<!-- markdownlint-disable MD013 -->

| Formik pattern         | React Hook Form replacement                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `<Formik />`           | `useForm()`                                                                                          |
| `useFormik()`          | `useForm()`                                                                                          |
| `withFormik()`         | Component using `useForm()`                                                                          |
| `<Form />` from Formik | Native `form` using `handleSubmit()` or existing design-system form wrapper                          |
| `<Field />`            | `register()` for native/uncontrolled inputs                                                          |
| `<Field as={...} />`   | `register()` when compatible, otherwise `Controller` or `useController()`                            |
| `<FastField />`        | `register()`, `Controller`, `useController()`, or memoized field component depending on behavior     |
| `<FieldArray />`       | `useFieldArray()`                                                                                    |
| `<ErrorMessage />`     | Existing error component wired to `formState.errors`                                                 |
| `useField()`           | `useController()` for controlled custom inputs                                                       |
| `useFormikContext()`   | `useFormContext()`, `useFormState()`, and/or `useWatch()`                                            |
| `initialValues`        | `defaultValues`                                                                                      |
| `enableReinitialize`   | `reset()` when source data changes                                                                   |
| `validationSchema`     | Resolver for existing schema library, such as Yup or Zod                                             |
| `validate`             | React Hook Form `validate`, custom resolver, or submit-time validation depending on current behavior |
| `validateOnBlur`       | `mode: "onBlur"` or related mode setting                                                             |
| `validateOnChange`     | `mode: "onChange"` or `reValidateMode` setting                                                       |
| `isSubmitting`         | `formState.isSubmitting`                                                                             |
| `isValid`              | `formState.isValid`, with appropriate validation mode                                                |
| `dirty`                | `formState.isDirty`                                                                                  |
| `touched`              | `formState.touchedFields`                                                                            |
| `errors`               | `formState.errors`                                                                                   |
| `setFieldValue`        | `setValue()`                                                                                         |
| `setFieldTouched`      | Touched handling, `trigger()`, `setFocus()`, or explicit blur handling depending on behavior         |
| `setErrors`            | `setError()`                                                                                         |
| `resetForm`            | `reset()`                                                                                            |
| `submitForm`           | `handleSubmit()` or preserved imperative wrapper                                                     |
| `validateForm`         | `trigger()` or preserved imperative wrapper                                                          |

<!-- markdownlint-enable MD013 -->

## Package and resolver rules

Before using a resolver, inspect installed dependencies.

- If the project already uses Yup, prefer `@hookform/resolvers/yup`.
- If the project already uses Zod, prefer `@hookform/resolvers/zod`.
- If the needed resolver package is not installed, do not silently assume it
  exists.
- Either add the correct package using the project’s package manager or state
  the exact package and command needed.
- Do not replace the validation library unless explicitly requested.
- Preserve schema transforms, nullable behavior, required behavior, default
  values, custom validation messages, and cross-field validation.

## Implementation workflow

### 1. Inventory current Formik usage

Search the migration target and nearby shared components for:

- `Formik`
- `useFormik`
- `withFormik`
- `Form`
- `Field`
- `FastField`
- `FieldArray`
- `ErrorMessage`
- `useField`
- `useFormikContext`
- `FormikProvider`
- `FormikErrors`
- `FormikTouched`
- `submitForm`
- `resetForm`
- `validateForm`
- `setFieldValue`
- `setFieldTouched`
- Formik-specific test helpers, mocks, wrappers, and providers
- Formik imports in stories, tests, fixtures, shared components, and utilities

Before editing, summarize:

- Files involved
- Formik APIs used
- Validation approach
- Submit behavior
- Default values source
- Parent/child component contracts
- Whether the form uses dynamic fields, arrays, async validation, file inputs,
  conditional rendering, custom controlled components, wizard state, or
  imperative refs
- Existing test coverage
- Known risks and safest migration strategy

### 2. Analyze upstream and downstream impact

Before making code changes, analyze the blast radius of the selected migration.

#### Upstream impact

Identify anything that provides data, props, configuration, wrappers, or
assumptions to the target form or component:

- Parent components and routes that render the form
- Props passed into the form or field components
- API response mappers that create initial values
- Validation schemas and schema factories
- Design-system components used by the form
- Form wrappers, layout components, providers, and context dependencies
- Test utilities, Storybook decorators, fixtures, and mocks
- Type definitions shared with other forms or API models
- Package dependencies and resolver availability
- Parent refs or imperative APIs used to submit, reset, validate, or update the
  form

For each upstream dependency, determine whether it can remain unchanged or must
be adapted.

Do not change shared upstream code unless the impact on other consumers is
understood.

#### Downstream impact

Identify anything that consumes form output, state, events, or side effects:

- Submit handlers
- API request payloads
- State management updates
- Analytics events
- Navigation behavior
- Autosave behavior
- Unsaved-change prompts
- Server-error handling
- Success/error notifications
- Parent callbacks
- Tests, stories, and documentation relying on the old behavior

For each downstream consumer, verify that the migrated form preserves the
expected contract.

### 3. Classify migration complexity

Classify the target as one or more of:

- Simple native inputs
- Custom controlled inputs
- Design-system inputs
- Nested object fields
- Array fields
- Conditional fields
- Multi-step, wizard, route-based, or tabbed form
- Async-loaded defaults
- Async validation
- File upload fields
- Schema-validated form
- Submit-side validation
- Form with server errors
- Form with reset/reinitialize behavior
- Form with autosave
- Form with unsaved-change protection
- Form with analytics or side effects
- Form with parent-controlled imperative APIs

Use the classification to choose the safest migration strategy.

### 4. Check and strengthen tests first

Before changing implementation code, identify existing coverage for:

- Rendering
- Successful input
- Required-field errors
- Schema validation errors
- Field-level validation
- Conditional fields
- Array add/remove/reorder behavior
- Async validation, if present
- Server-side errors, if present
- Submit payload shape
- Disabled/loading/submitting states
- Reset/cancel behavior
- Reinitialize behavior
- Autosave behavior
- Unsaved-change prompts
- Parent-triggered submit/reset/validation
- Multi-step navigation and persisted values
- Accessibility behavior
- Keyboard and focus behavior where relevant

Add or update tests first when practical, especially for behavior likely to
regress.

Tests should verify user-visible behavior and submitted values, not
implementation details of Formik or React Hook Form.

### 5. Handle shared component risk

If a shared Formik-aware component is used by both the migration target and
other unmigrated Formik forms, do not directly replace it in place unless all
consumers are migrated together.

Prefer one of these strategies:

1. Create a React Hook Form equivalent component.
2. Add a clearly named transitional adapter.
3. Migrate all consumers only when explicitly in scope.

Document which strategy was chosen and why.

### 6. Migrate reusable components before parent forms when needed

If the target uses reusable Formik-aware components:

1. Create React Hook Form equivalents following existing naming and file
   organization conventions.
2. Use `useController()` for custom controlled components.
3. Use `register()` only for native or uncontrolled inputs that support direct
   registration.
4. Keep the external JSX API as close as practical to the Formik version.
5. Preserve labels, descriptions, error display, required indicators, disabled
   state, read-only state, and `aria-*` behavior.
6. Preserve value coercion, such as string-to-number, checkbox boolean handling,
   date handling, empty string handling, nullable fields, and object-to-ID
   mapping.
7. Update or duplicate component tests with a React Hook Form test wrapper.
8. Avoid making one component support both Formik and React Hook Form unless the
   repository explicitly needs a transitional adapter.

### 7. Migrate the selected form

Replace the Formik implementation with React Hook Form:

1. Initialize `useForm()` with correct TypeScript types.
2. Provide `defaultValues` that match the existing `initialValues`.
3. Select `mode` and `reValidateMode` to match existing validation timing as
   closely as possible.
4. Set resolver configuration if the form uses a schema.
5. Use `FormProvider` only when nested components need form context.
6. Use `register()` for native inputs.
7. Use `Controller` or `useController()` for controlled custom inputs.
8. Use `useFieldArray()` for array fields.
9. Use `useWatch()` for conditional rendering, dependent values, autosave, or
   dynamic validation.
10. Use `useFormState()` when a child component only needs form metadata.
11. Convert submit handling to `handleSubmit(onValidSubmit, onInvalidSubmit?)`.
12. Preserve API calls, callback signatures, analytics events, navigation, and
    side effects.
13. Preserve submitted payload shape exactly unless an intentional change is
    documented.
14. Preserve server-error handling using `setError()` or form-level error state.
15. Preserve loading, disabled, and submitting states.
16. Update tests, stories, and wrappers as needed.

### 8. Preserve imperative form API contracts

Check whether parent components, tests, or refs call imperative Formik APIs such
as:

- `submitForm`
- `resetForm`
- `validateForm`
- `setFieldValue`
- `setFieldTouched`
- `setErrors`

If such APIs are part of the component contract, preserve the external contract
using `forwardRef`, `useImperativeHandle`, callback props, or a documented
replacement.

Add tests for parent-triggered submit, reset, validation, or field updates where
applicable.

Do not remove imperative behavior unless it is confirmed unused or explicitly
out of scope.

### 9. Handle `shouldUnregister` intentionally

Do not rely on default hidden-field behavior without checking the existing
Formik behavior.

For conditional fields:

- If hidden field values should remain in the submitted payload, keep values
  registered or avoid unregistering them.
- If hidden field values should be removed, use `shouldUnregister: true`,
  `unregister()`, `resetField()`, or `setValue()` intentionally.
- Add tests for show/hide behavior, validation state, and final submitted
  payload.

Document the chosen behavior.

### 10. Handle default values, reset, and reinitialization

Formik `initialValues` and `enableReinitialize` do not map automatically to
React Hook Form behavior.

Check whether the current form:

- Loads default values asynchronously
- Reinitializes when props change
- Resets after successful submit
- Resets on cancel
- Preserves dirty values during data refresh
- Clears server errors on edit
- Uses transformed defaults from a schema or API response

Use `reset()`, `resetField()`, `setValue()`, and React effects carefully to
preserve behavior.

Avoid infinite reset loops.

Add regression tests for reset and reinitialize behavior when present.

### 11. Handle multi-step and persisted form state

For wizard, tabbed, route-based, or multi-step forms, verify where state is
stored between steps.

Preserve:

- Cross-step values
- Draft persistence
- Dirty-state tracking
- Step-level validation
- Route transitions
- Back/forward behavior
- Unsaved-change prompts
- Partial submit or save-and-continue behavior
- Mounted/unmounted field behavior

Do not rely on mount/unmount defaults without testing submitted payload and
restored values.

### 12. Handle validation differences explicitly

Formik and React Hook Form differ in validation timing and state updates.

Confirm and preserve:

- When required errors appear
- Whether errors appear on blur, change, submit, or re-submit
- Whether validation blocks submit
- Whether hidden fields are validated
- Whether async validation is debounced or immediate
- Whether server errors clear on change
- Whether validation depends on sibling fields or external props
- Whether field-level validation and schema validation are both used
- Whether submit count affects displayed errors
- Whether invalid submit moves focus or triggers summary errors

If exact behavior cannot be preserved, document the difference and explain why.

### 13. Handle special field types carefully

For checkboxes and radio groups:

- Preserve boolean, string, and array value behavior.
- Test checked state and submitted payload.

For selects:

- Preserve placeholder, empty value, multiple selection, displayed label, and
  value type.

For number inputs:

- Preserve string-vs-number behavior.
- Use `valueAsNumber`, `setValueAs`, or explicit transform only when it matches
  existing behavior.

For date inputs:

- Preserve string, `Date`, timezone, locale, and formatting behavior.

For file inputs:

- Do not attempt to control the file input value.
- Preserve accepted file types, multiple-file behavior, validation, previews,
  clearing, and submitted payload.
- Use `Controller`, `register()`, or explicit change handling according to the
  existing component behavior.

For masked, rich text, autocomplete, async select, or third-party controlled
inputs:

- Prefer `Controller` or `useController()`.
- Preserve displayed value, internal value, blur behavior, search behavior,
  async loading, and validation trigger behavior.

### 14. TypeScript requirements

Use strong types for form values.

- Infer form value types from the existing schema where the project already does
  this.
- Otherwise define a clear `FormValues` type based on existing submitted values.
- Preserve nested path types where practical.
- Avoid broad `any`.
- Do not suppress type errors unless there is a documented reason.
- Remove unused Formik types after migration.

### 15. Accessibility requirements

Preserve or improve existing accessibility without changing visual design.

Check:

- Label association
- Error message association
- Help text association
- Required indicators
- `aria-invalid`
- `aria-describedby`
- Focus on first invalid field if existing behavior does this
- Keyboard interaction
- Screen-reader-visible error behavior
- Error summary behavior
- Disabled and read-only semantics

Add or update tests where the project already uses accessibility testing
patterns.

### 16. Contract verification

Before finalizing the migration, verify:

- Incoming props have the same meaning as before.
- Initial values are produced from the same source and shape.
- Submitted payload matches the previous contract.
- Parent callbacks are called with the same arguments and timing.
- Analytics and side effects still fire as expected.
- Autosave, draft, and unsaved-change behavior still work if present.
- Parent-triggered imperative APIs still work if part of the contract.
- Shared components are not broken for other consumers.
- Stories and tests that depend on the form contract are updated.

### 17. Validation and verification

Run the most relevant available checks, such as:

- Type checking
- Unit tests for migrated components
- Unit tests for migrated forms
- Integration tests for affected flows
- End-to-end tests for affected routes
- Linting
- Storybook checks or story smoke tests, if available
- Accessibility checks, if available

Report exact commands and results.

If a command cannot be run, say so clearly and provide the exact command the
user should run.

### 18. Cleanup

After the selected migration is complete:

- Remove Formik imports from migrated files.
- Remove unused Formik-specific helpers, types, wrappers, mocks, and tests in
  the migrated area.
- Update stories and test utilities that directly depend on Formik.
- Search again for remaining Formik references.
- Do not remove the global Formik dependency unless no Formik references remain
  anywhere in the repository.
- If no references remain, remove Formik from dependencies and update the
  lockfile using the project’s package manager.

### 19. Final self-review before responding

Before final response, verify:

- The selected target no longer uses Formik.
- No unrelated form was migrated accidentally.
- The diff is focused and does not include unrelated refactors.
- Submitted payload shape is preserved.
- Validation behavior is preserved or documented.
- Default/reset/reinitialize behavior is preserved or documented.
- Conditional and array field behavior is tested where relevant.
- Multi-step or persisted state behavior is preserved where present.
- Imperative parent contracts are preserved where present.
- Type errors are resolved or clearly reported.
- Tests/checks are reported honestly.
- Remaining Formik references are listed if any exist.

## Output format

Return the final answer in this structure:

### Summary of changes

- What was migrated
- What behavior was preserved
- Any intentional behavior differences

### Files changed

For each changed file:

- File path
- Brief explanation

### Upstream and downstream impact

Include:

- Upstream dependencies reviewed
- Downstream consumers reviewed
- Shared component risks found
- Contract changes, if any

### Formik to React Hook Form mapping used

List the specific APIs replaced, for example:

- `useField()` → `useController()`
- `FieldArray` → `useFieldArray()`
- `initialValues` → `defaultValues`
- `validationSchema` → resolver
- `submitForm` → preserved imperative wrapper or `handleSubmit()`

### Validation performed

For each command:

- Command
- Result
- Notes

Also list checks not run and why.

### Remaining work

Include:

- Remaining Formik references, if any
- Forms/components not yet migrated
- Manual QA recommendations
- Dependency cleanup still needed, if any

## Acceptance criteria

The migration is complete for the selected target only when:

- The selected target no longer imports or depends on Formik.
- Existing user-visible behavior is preserved.
- Submitted data shape is preserved.
- Validation messages and validation timing are preserved as closely as
  practical.
- Conditional fields preserve existing hidden-value behavior.
- Array fields preserve add/remove/reorder behavior.
- Async validation and server errors are preserved where present.
- Default values, reset behavior, and reinitialize behavior are preserved where
  present.
- Multi-step, persisted, autosave, or unsaved-change behavior is preserved where
  present.
- Imperative parent contracts are preserved where present.
- Accessibility behavior is preserved or improved.
- Relevant tests pass or failures are clearly reported.
- Type checking passes or remaining type issues are clearly explained.
- No unrelated forms are migrated accidentally.
- The diff avoids unrelated refactors and formatting churn.
- Unused Formik code is removed from the migrated area.
- Global Formik dependency removal happens only after repository-wide
  confirmation that no Formik references remain.

Begin by inspecting the selected target files and summarizing the current Formik
usage, upstream/downstream impact, and migration risks before making code
changes.
