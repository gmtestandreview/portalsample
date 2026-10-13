# Formik to React Hook Form: design v3 (companion to the migration plan)

Companion to `2026-09-22-formik-migration-to-react-hooks.md`. Branch:
`feat/formik-to-react-hooks-migration`. Evidence gathered 2026-10-14 from the
working tree (Formik 2.4.9 and RHF 7.89.0 as installed; see P0 drift note).
Nothing here starts S0 to Z implementation.

## Purpose, goals and non-goals (change A)

**Purpose.** Remove a low-activity dependency (`formik`) and leave the form
layer ready for a future React 19 migration.

**Goals.** One RHF-owned wizard shell; every flow cut over reversibly; no
user-visible behaviour change unless separately approved.

**Non-goals.** No React upgrade (stay on 18.3.1). No behaviour fixes bundled
with the migration. No new form features. No push, merge or rebase without
authorisation.

**React 19 readiness checklist for new RHF code** (enforce by grep in P0):

- No `defaultProps` on function components.
- No `findDOMNode`, no legacy context, no string refs.
- No `react-dom/test-utils` `act`; use `act` from `react`.
- `ref` handled as a prop-compatible pattern; no reliance on `forwardRef` quirks
  that React 19 changes.
- No `propTypes`; no `ReactDOM.render`/`hydrate`.

## Behavioural parity contract (activity B)

Status key: **Confirmed** = read in source this session. **Hypothesis** =
proposed RHF setting, not yet pinned by a test. **Unverified** = current Formik
behaviour itself is not established.

| Formik behaviour                                                                                                                                                           | RHF equivalent                                                                                                                                                                                                                                                                      | Evidence                                                                                                                                                                                                                                                               | Regression test                                                                                                 | Risk                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Validates on change and blur over the whole form (`validateOnChange/Blur` default true); error shown only when `touched && error` (`TextInput`)                            | `mode: 'all'` (validate on every change and blur, as Formik does); show on `isTouched \|\| isSubmitted` (`useRhfFieldA11y`). **Corrected in S2.0:** `onTouched` plus `reValidateMode: 'onChange'` skips blur validation once the form has been submitted, which differs from Formik | Confirmed: Formik dist L352-354; RHF `skipValidation` L2037; plan lesson "isTouched is false after submit"                                                                                                                                                             | Input tests exist; shell-level timing test missing (S0)                                                         | Med: Formik holds errors for untouched fields, which drives `isValid`                                                                   |
| Submit touches every key present in `values` (`SUBMIT_ATTEMPT`)                                                                                                            | `isSubmitted` shows errors for all fields, including keys absent from values                                                                                                                                                                                                        | Confirmed: Formik L325-330                                                                                                                                                                                                                                             | None                                                                                                            | Low-Med: a conditional key absent from values would now show an error                                                                   |
| Focus on invalid submit                                                                                                                                                    | Formik never focuses a field; `ErrorSummary` focuses `#form-error-summary` after 100 ms. RHF focuses the first invalid field by default, then again via `setTimeout`                                                                                                                | Confirmed: RHF `_focusError` L3248, L3321-3322. **Resolved (Q2)**: the summary focus effect needs `isSubmitting && !isValidating && hasErrors`, and its cleanup clears the timer when `isSubmitting` flips; the existing test forces `setSubmitting(true)` to reach it | `errorSummary.test` L211 asserts scroll only, with forced state. No focus assertion anywhere in the shell tests | **High**: target unknown. S0 must record real Formik behaviour first. Hypothesis: `shouldFocusError: false` plus explicit summary focus |
| `ErrorSummary` reads `errors` (strings), snapshots them once `submitCount > 0`, flattens nested keys                                                                       | RHF `errors` hold `{type, message, ref}` objects. Needs an adapter that flattens to `message`; `ref` is a DOM node and must never reach `sanitizeErrorData`                                                                                                                         | Confirmed: `ErrorSummary` L126-143, `saveAwareYupResolver` shape                                                                                                                                                                                                       | `formShell.behavior` L261, L321; `errorSummary.test`                                                            | High if unadapted                                                                                                                       |
| Server errors (400 validation, 403, 409, 422, WAF) render via `ErrorSummary` props from `errorState`                                                                       | Unchanged: wizard controller owns `errorState`, not the form library                                                                                                                                                                                                                | Confirmed: `errorState.ts`, `WizardRoutedStep` L372-381                                                                                                                                                                                                                | `WizardRoutedStep.integration` L477, L502; `errorSummary.test` L62-L116                                         | Low (move with S1)                                                                                                                      |
| 409: `loadData()` reruns, `initialValues` change, `enableReinitialize` calls `resetForm()` even when dirty, so edits are discarded and `submitCount` returns to 0          | `reset(loaded)` on each load. RHF reset clears `submitCount` unless `keepSubmitCount`; `touchedFields`/`errors` cleared by default                                                                                                                                                  | Confirmed: Formik L570-581; RHF `_reset` L42-43 (submitCount). touched/errors default: **Hypothesis**                                                                                                                                                                  | `WizardRoutedStep.integration` L207 (retry only). Dirty-discard not pinned                                      | Med: silent data-loss semantics must match, or be changed by explicit decision                                                          |
| Step change reuses the same `WizardRoutedStep` element type; reinit resets touched/submitCount per step                                                                    | `reset(loaded)` keyed to step load                                                                                                                                                                                                                                                  | **Hypothesis**: React Router instance reuse not verified                                                                                                                                                                                                               | `WizardForm.navigation` L212, L233 (navigation only)                                                            | Med                                                                                                                                     |
| Hidden fields: errors dropped (`toFormErrors`), values stripped on submit (`removeHidden`), rules in `status.hidden`                                                       | Resolver must filter hidden errors; submit strips with the same `removeHidden`; rules via `RhfHiddenRulesProvider`                                                                                                                                                                  | Confirmed: `utils.ts`. **Gap**: `createSaveAwareYupResolver` does not filter hidden errors                                                                                                                                                                             | `formHelpersAndBanner` L351-L365 (utility); `formShell.behavior` L51 (payload)                                  | **High**: hidden required field would block submit                                                                                      |
| Payload: `removeHidden`, then `removeEmptyKeys` (drops null, '', whitespace), then removes `saveAndExit`, `saveAndExitClick`, `submitClick`                                | Same pipeline minus the flag removal, since submit mode lives outside values                                                                                                                                                                                                        | Confirmed: `FormikForm` L63-73                                                                                                                                                                                                                                         | `formShell.behavior` L51, L107                                                                                  | Low if the pipeline is shared, not reimplemented                                                                                        |
| Loaded values: `nullOrUndefinedToEmpty` before init                                                                                                                        | Apply before `reset(loaded)`                                                                                                                                                                                                                                                        | Confirmed: `WizardRoutedStep` L106                                                                                                                                                                                                                                     | `WizardRoutedStep.integration`                                                                                  | Low                                                                                                                                     |
| `isDirty` param passed to save callbacks                                                                                                                                   | Not consumed: all 16 handler signatures name it `_isDirty`                                                                                                                                                                                                                          | Confirmed: grep                                                                                                                                                                                                                                                        | n/a                                                                                                             | None: may be kept as pass-through                                                                                                       |
| Save-and-exit: button sets `saveAndExit` and `saveAndExitClick` in values, an effect calls `submitForm`, soft schema applies, `onSaveAndExit` runs                         | Submit mode in a ref or context outside values; `handleSubmit` reads it; resolver receives mode via context                                                                                                                                                                         | Confirmed: `SaveAndExitButton`, `FormikForm` L36-53, L75. Existing resolver reads `values.saveAndExit`                                                                                                                                                                 | `buttonControls` L14; `WizardRoutedStep.integration` L428, L502                                                 | Med: see quirk Q1                                                                                                                       |
| Next/submit: `SubmitFormButton` sets flags, `onClick` calls `preventDefault`, effect calls `submitForm`; final step may open a confirmation modal after `validateForm()`   | `handleSubmit` from the shell; modal gate uses `trigger()`                                                                                                                                                                                                                          | Confirmed: `NextStepButton`, `SubmitFormButton`                                                                                                                                                                                                                        | `wizardControls.behavior` L67-L160                                                                              | Med                                                                                                                                     |
| Enter key submits                                                                                                                                                          | Native `<form onSubmit>` with `handleSubmit`                                                                                                                                                                                                                                        | Confirmed: `Form onSubmit={formik.handleSubmit}`                                                                                                                                                                                                                       | **None**                                                                                                        | Med: untested                                                                                                                           |
| Unsaved prompt: block when `dirty && (submitCount===0 \|\| !isValid)`, or clean, invalid and `submitCount>0`; logout wording for `/create-account/` and `/create-contact/` | `isDirty`, `isValid`, `submitCount` from `formState`. RHF `isValid` is computed by the resolver over the whole form whenever tracked, regardless of mode                                                                                                                            | Confirmed: `UnsavedFormPrompt`; Formik `isValid` L1037; RHF `_setValid` L2163-2171                                                                                                                                                                                     | `formHelpersAndBanner` L204, L226, L245                                                                         | Med: `isValid` source differs (errors state vs resolver)                                                                                |
| Route guard: `useBlocker`, blocks only if pathname changes; Confirm calls `setErrors({})` then `proceed()`                                                                 | `clearErrors()`. `isValid` is resolver-derived, so `clearErrors` does not unblock the "server rejected" case                                                                                                                                                                        | Confirmed: `RouteLeavingGuard` L17-31                                                                                                                                                                                                                                  | `routeLeavingGuard.test` L59, L132                                                                              | Med: make guard take neutral props (`when`, `onProceed`)                                                                                |
| Back link (`replace`) triggers the guard when dirty                                                                                                                        | Same guard; unchanged                                                                                                                                                                                                                                                               | Confirmed: `PreviousStepButton`, guard pathname rule                                                                                                                                                                                                                   | e2e `create-rfq` "navigates back"; `workflow-errors` "Unsaved RFQ navigation can be cancelled"                  | Low                                                                                                                                     |
| Banner: `FormBanner` embeds `SaveAndExitButton` and a discard button                                                                                                       | Banner receives the save-and-exit control as a slot or via shell context                                                                                                                                                                                                            | Confirmed: `FormBanner` L77-79                                                                                                                                                                                                                                         | `formHelpersAndBanner` L97-L127                                                                                 | Low                                                                                                                                     |
| `Saving...` / `Loading...` `BlockUISpinner` from `isSubmitting` and `isLoading`                                                                                            | `formState.isSubmitting`                                                                                                                                                                                                                                                            | Confirmed: `FormikForm` L128-137                                                                                                                                                                                                                                       | `formShell.behavior` L237                                                                                       | Low                                                                                                                                     |
| `resetForm({errors:{}, touched:{}})` in TA application type change (reverts values to initial, since no `values` given)                                                    | `reset(initialValues)`; "untouch" has no direct RHF call, needs `resetField`                                                                                                                                                                                                        | Confirmed: Formik L534; `ta/applicationAndInstrument` L331                                                                                                                                                                                                             | None                                                                                                            | Med (W5b)                                                                                                                               |
| `setFieldTouched(name, false)` in RFQ and TA                                                                                                                               | `resetField(name, {keepDirty, keepError})`                                                                                                                                                                                                                                          | Confirmed: `instrumentAndRequest` L151, `applicationAndInstrument` L200                                                                                                                                                                                                | None                                                                                                            | Med (W5a, W5b)                                                                                                                          |

### Quirks found (decisions needed, not fixes)

- **Q1: sticky `saveAndExit`.** Only the Next button resets it. After a failed
  save-and-exit, later live validation uses the soft schema. Moving the flag out
  of values removes this. Needs a recorded decision (intended deviation).
- **Q2: resolved by characterisation (jsdom, 2026-10-14).** After an invalid
  Next click focus stays on the Next button and the summary is never scrolled or
  focused. The summary's focus effect does not fire on a normal failed submit.
  RHF's default would move focus to the first invalid field, which is a
  behaviour change, so parity needs `shouldFocusError: false`. Focus never
  reaching the summary is an accessibility gap to raise as a separate fix.
  Pinned in `WizardRoutedStep.characterization.test.tsx`.
- **Q5: the 409 banner never stays visible.** The retry clears the concurrency
  state at once, the form reinitialises to server values, and the user's edits
  are replaced with no message. Pinned. RHF must match, or a change is approved
  explicitly.
- **Q3: `resetForm` reverts values** where the code comment suggests they stay.
- **Q4: install drift.** `package.json`/lockfile say RHF 7.90.0, installed copy
  is 7.89.0. P0 must run `npm ci` before any measurement.

## Dependency graph (activity G)

### Consumers of legacy inputs (grep, 2026-10-14)

| Legacy module                                             | Route consumers                                                                        | Needs RHF twin before | Note                                                            |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------- |
| `DatePicker`                                              | `requestForQuote/instrumentAndRequest`                                                 | W5a                   | No `RhfDatePicker` exists                                       |
| `OrganisationNameLookup`                                  | `account/accountDetails`, `account/organisationDetails`                                | W4                    | No Rhf twin exists                                              |
| `CheckboxGroup`, `CertificateNumberLookup`, `RadioButton` | `ta/applicationAndInstrument` only                                                     | W5b                   | Build inside W5b                                                |
| `AuthorisedAgent`                                         | `ta/organisationAndContact` only                                                       | W5b                   | Build inside W5b                                                |
| `TextReadOnly`                                            | none in routes; imported only by legacy `SelectInput`                                  | none                  | Dies with `SelectInput` in Z (resolves the earlier uncertainty) |
| `AddressLookup` (legacy)                                  | `acceptQuote/reportRecipient` (summary mode), `account/*`, `ta/organisationAndContact` | S4 (summary), W4, W5b | `RhfAddressLookup` exists                                       |
| `TextInput` etc. in `isSummary` mode                      | accept-quote summary sections                                                          | S4                    | Same problem RFQ had: needs form-free summaries                 |

### Edges

```text
P0 ──► S0 ──► S1 ─────────────┐
        │                      ├──► S3 ──► S4 ──► CHECKPOINT ──► W4 ──┐
        └──► S2.0 ──► S2.x ───┘                         ├──► W5a ───┼──► Z
                                                         └──► W5b ───┘
S4 also needs: form-free accept-quote summaries (4 sections)
W4  also needs: RhfOrganisationNameLookup, contact-create e2e (from S0)
W5a also needs: RhfDatePicker
W5b also needs: 4 TA inputs, TA e2e (from S0), resetField/untouch design
```

### Ordering decisions

1. **S2 is split.** S2.0 = shell context (submit mode, hidden rules,
   `isSubmitting`) plus the RHF test harness. S2.x = `ErrorSummary` adapter,
   buttons, neutral `RouteLeavingGuard`, prompt, banner slot. S2.0 must come
   first because every S2.x component and test depends on it.
2. **Missing RHF inputs are built inside their wave**, not in S2. None of
   accept-quote's steps needs one (all required twins already exist), so S2 to
   S4 are not blocked.
3. **Harness changes.** `tests/unit/helpers/formik.tsx` stays until Z. Add an
   RHF twin at S2.0. S0 contract tests are written once as a shared suite and
   run against both shells (`describe.each`), so parity is mechanical.
4. **S1 and S2.0 are independent** and may be done in either order; both gate
   S3. S1 must keep `WizardRoutedStep.integration` (651 lines, 22 tests) passing
   unchanged.
5. **W4 before W5.** W4 has fewer new inputs (one) and no hidden-field or
   `resetForm` hazards. W5a and W5b are independent after the checkpoint; do W5a
   first (one input, strongest e2e net), W5b last (highest risk, thinnest net).
6. **Per-step engine switch is feasible.** Each step loads from and saves to the
   server (`loadStepValues`, `onSaveAndNext`), so no form state crosses steps.
   Keep the approved per-flow cut-over, but a flow can be cut over step by step
   if a step proves risky.

### Critical path and rollback boundaries

Critical path: P0, S0, S2.0, S2.x, S3, S4, checkpoint, W5b, Z.

| Boundary            | Tag            | Rollback                                                   |
| ------------------- | -------------- | ---------------------------------------------------------- |
| After S0            | `fm-s0`        | Tests only; nothing to revert                              |
| After S1            | `fm-s1`        | Revert the extraction commit(s); behaviour identical       |
| After S3            | `fm-s3`        | RHF shell exists but no flow uses it; revert freely        |
| S4 cut-over         | `fm-s4-cut`    | Revert one commit that flips accept-quote to the RHF shell |
| S4 bridge deletion  | `fm-s4-del`    | Separate commit; revert restores bridges                   |
| Each flow in W4, W5 | `fm-w4-<flow>` | One revertable cut-over commit per flow                    |
| Z                   | `fm-z`         | Dependency removal in its own final commit                 |

## Effort calibration (activity F)

### Measured (git, non-merge commits touching ClientApp, tests or the plan, from 2026-09-22; filtered to migration subjects)

| Measure                                                      | Value                                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Migration-related commits                                    | 62 over 11 active days (18 calendar days)                                             |
| Peak                                                         | 25 commits on 2026-10-12, 17 on 2026-10-11                                            |
| Mix                                                          | feat 16, fix 14, test 11, refactor 10, docs 8                                         |
| Fix-to-feat ratio                                            | 0.88 (rework proxy)                                                                   |
| Accept-quote step pattern                                    | 1 characterisation test commit, 1 migration commit, then 4 to 7 hardening/doc commits |
| RFQ form-free summary                                        | 10 commits (baseline, 2 sections, 3 fixes/tests, swap, dead-code removal)             |
| Net branch diff vs origin/main merge-base (ClientApp, tests) | 29 files, +2094 / -511                                                                |

**Not measurable:** review rounds. The GitHub API returned 401 this session.
Fix-to-feat ratio is used as a proxy only.

### Estimated budgets (analogy to the precedents above; not measured)

| Phase     | Commit budget        | Basis                                                     | Scope threshold (stop and re-plan)           |
| --------- | -------------------- | --------------------------------------------------------- | -------------------------------------------- |
| P0        | 2 to 3               | Guard script, baseline file                               | More than 5                                  |
| S0        | 8 to 12              | Parity baseline was 1 large commit; 6 to 8 e2e scenarios  | New unknown found in Q2                      |
| S1        | 3 to 4               | `useFormikRhfBridge` split took 1 commit                  | Any change to `WizardRoutedStep.integration` |
| S2        | 12 to 15             | About 3 commits per component group (Rhf input precedent) | Any Formik-shaped compatibility API appears  |
| S3        | 5 to 8               | New shell beside the old                                  | Shell needs more than one new context        |
| S4        | 10 to 14             | RFQ summary precedent plus bridge removal                 | Fix-to-feat above 1.0                        |
| W4        | 15 to 20             | 5 flows plus `RhfOrganisationNameLookup`                  | Over 1.5x budget                             |
| W5a       | 12 to 16             | `RhfDatePicker` plus 3 RFQ steps                          | Over 1.5x budget                             |
| W5b       | 28 to 36             | 4 new inputs, 4 TA steps, `resetForm` hazards             | Over 1.5x budget                             |
| Z         | 8 to 12              | Deletions plus full gate                                  | Any non-empty executable Formik search       |
| **Total** | **about 105 to 140** | 1.7x to 2.3x the 62 delivered                             | Total over 170                               |

### Checkpoint triggers (proposed; user to confirm)

At the S4 checkpoint, go only if all hold; otherwise stop and re-plan:

1. S0 to S4 used at most 1.5x the summed budget (about 60 commits).
2. Fix-to-feat ratio for S2 to S4 is at most 1.0.
3. Zero unexplained diffs in the dual-run contract suite.
4. Bundle size change within +/- 5% of the P0 baseline (gzip, main chunks).
5. No new `act()` warnings, no axe violations, no coverage drop below 100%.

## Verification framework (activity H)

Run from the repository root with Node 24. Use `--reporter=default` for any
piped Vitest run, or warnings are hidden.

### Commands

| Gate                           | Command                                                                                                                                  | Pass criterion                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Install integrity              | `npm ci` then `npm ls react-hook-form formik`                                                                                            | RHF resolves to the lockfile version (7.90.0); fixes drift Q4                                                                    |
| Type-check                     | `npm run type-check`                                                                                                                     | Exit 0                                                                                                                           |
| Lint                           | `npm run lint`                                                                                                                           | Exit 0, no new warnings                                                                                                          |
| Rule citations                 | `npm run lint:rules`                                                                                                                     | Exit 0                                                                                                                           |
| Formatting                     | `npx prettier --check <changed files>` (no repo script exists)                                                                           | Exit 0; revert unrelated reformatting                                                                                            |
| Unit, focused                  | `npx vitest run --configLoader runner --config vitest.unit.config.ts --reporter=default <file>`                                          | Pass, zero `act()` warnings                                                                                                      |
| Unit, full                     | `npm run test:unit:coverage`                                                                                                             | Pass, coverage stays at the repo's 100% policy                                                                                   |
| Storybook interaction plus axe | `npm run test:storybook`                                                                                                                 | Pass. axe runs inside it: `.storybook/preview.ts` sets `a11y.test: 'error'`, so every new RHF story is axe-checked automatically |
| Full CI gate                   | `npm run test:ci`                                                                                                                        | Pass (type-check, unit, storybook, quality)                                                                                      |
| E2E app                        | `npm run test:e2e:app`                                                                                                                   | Pass; new S0 scenarios included                                                                                                  |
| E2E Storybook                  | `npm run test:e2e:storybook`                                                                                                             | Pass                                                                                                                             |
| Pre-migration gate             | `npm run migration-check`                                                                                                                | Pass (Z only)                                                                                                                    |
| Residual search (Z)            | `rg -n "from 'formik'\|useFormikContext\|FormikHelpers" ClientApp tests .storybook`                                                      | Empty, comments classified separately                                                                                            |
| React 19 readiness             | `rg -n "defaultProps\|findDOMNode\|react-dom/test-utils\|propTypes" ClientApp/src/components/Inputs/Rhf* ClientApp/src/components/forms` | Empty for new RHF files                                                                                                          |

### Bundle-size baseline (does not exist yet; created in P0)

There is no analyzer or size budget: webpack `performance: false`, output is
`dist/js/[name].[contenthash:8].js`. P0 creates the baseline:

1. `npm run build` on a clean tree at the P0 commit.
2. `scripts/bundle-size.mjs` lists `dist/js/*.js` with raw and gzip bytes into
   `reports/bundle/baseline.json` (committed).
3. Re-run at the checkpoint and at Z. Expected at Z: a decrease (Formik
   removed). Trigger: any phase before Z growing the main chunks by more than 5%
   gzip.

### Per-flow manual checklist (run after each cut-over; record pass/fail in the commit body)

For every wizard (accept-quote, account create, account update, add-branch,
contact create/update, RFQ, TA):

- [ ] Invalid Next: errors listed in summary, each link jumps to its field, and
      focus lands where the S0 characterisation says it did before.
- [ ] Valid Next: moves forward; Back returns with values retained from server.
- [ ] Save and exit with partial data: soft validation only, lands on the exit
      location, reopening restores values.
- [ ] Save and exit then Next on the same step (covers quirk Q1).
- [ ] Dirty form then Back, a header link, or browser back: unsaved prompt
      appears; Cancel stays, Discard leaves; clean form never prompts.
- [ ] Browser forward after Back: no stale error summary, no duplicate prompt.
- [ ] Reload mid-step: values come from the server, not lost or duplicated;
      create-account expired-session case still redirects.
- [ ] Hidden field: toggle the controlling answer, confirm the hidden value is
      absent from the request payload (network tab) and does not block submit.
- [ ] Enter key in a text field submits exactly once.
- [ ] Server 409, 403, 422, WAF: correct banner text; 409 reloads and discards
      edits as before.
- [ ] Keyboard only and screen reader pass over the error summary and one
      invalid field (`aria-invalid`, `aria-describedby`).

### Acceptance criteria per phase

A phase is done only when: its gate commands pass on the exact tree, the
dual-run contract suite shows no unexplained difference, new RHF files pass the
readiness grep, and the commit body lists the evidence. Full CI and e2e are
required at S3, S4, each flow cut-over, and Z; focused tests suffice between.

## Single-branch protocol (change E)

- **One branch** (`feat/formik-to-react-hooks-migration`) for all phases.
  Current state: in sync with `origin/feat/formik-to-react-hooks-migration` (no
  ahead/behind), 30 commits ahead of and 4 behind `origin/main`. The earlier
  note "ahead 2, not pushed" is stale: `c196dd7d` and `7728c522` are already on
  the remote branch.
- **Reviewable commits.** One concern per commit, Conventional Commit subjects,
  tests with the code they cover, no mixed formatting. Characterisation test
  commit precedes each migration commit.
- **Tags.** Annotated local tag per boundary in the rollback table (`fm-s0` ...
  `fm-z`). Tags stay local unless pushed deliberately.
- **Rollback.** `git revert` of the cut-over commit (flows) or the extraction
  commit (S1). Never rewrite pushed history. Bridge deletion is its own commit.
- **Merge-conflict monitoring.** At each phase boundary run `git fetch origin`
  then `git rev-list --left-right --count origin/main...HEAD` and
  `git diff --stat HEAD...origin/main -- ClientApp tests`. Merge `main` in (no
  rebase) only when behind more than 10 commits or when `main` touches
  `components/forms`, `components/Inputs`, `routes` or `tests/unit`. Today
  `main` has no commits touching those paths that this branch lacks.
- **Contributors.** Since 2026-08-01 every commit touching forms, inputs or
  routes is by one author identity plus one dependabot commit, so conflict risk
  is low.
- **Push policy.** Default is **no push**. Push only when the user asks, at a
  phase boundary, after the gate for that phase passes. Never force-push. Never
  merge or rebase without authorisation. Leave unrelated working-tree changes
  (`.agent-sync/*`, `.codacy/*`) untouched.

## Decisions log

- **Parity policy (2026-10-14).** Keep parity by default, but the original is
  not a gold standard. Where review, design logic and best practice support an
  improvement, take the improvement and record it here with its test.
- **D-1 (Q5, approved, applied in the Formik shell: `90bad447`).** After a 409
  the form still reloads server values, and the conflict banner ("Another person
  has already saved this page...") now stays visible. The RHF shell must match
  this improved behaviour.
- **D-2 (Q2, approved, applied in the Formik shell: `c214c17f`).** After an
  invalid submit the error summary receives focus and scrolls into view, once
  per failed attempt. The RHF shell therefore sets `shouldFocusError: false` and
  reuses the same summary behaviour. Previously focus stayed on the Next button.
- **D-4 (found by the new e2e save-failure scenario, applied: `f8b252e3`).**
  `reportRecipientProps` and `paymentDetailsProps` swallowed save errors, so a
  failed save let the wizard advance as if it had succeeded. They now rethrow
  and the shell shows the error. Unit tests that pinned the swallowing were
  updated. User-visible, treat as an improvement; tell the product owner.
- **D-3 (Q1, approved earlier).** Submit mode lives outside form values; the
  sticky `saveAndExit` flag disappears.
- **Applied before migration.** Both improvements land in the Formik shell
  first, with characterisation tests updated, so the dual-run suite compares the
  RHF shell against the improved behaviour rather than the old quirks.

## Characterisation and e2e coverage added in S0 so far

- Unit: `WizardRoutedStep.characterization.test.tsx` (focus, 409 reload,
  save-and-exit, sticky flag) and `WizardForm.characterization.test.tsx` (step
  reset, Back prompt, Enter key, unsaved prompt).
- E2E: accept-quote validation, save-and-exit and Back; type-approval
  validation, save-and-exit, Back and unsaved dialog; required contact details.
  Correction to the earlier audit: contact create was already exercised by the
  create-account scenario, so the new scenario covers its validation instead.
- Still open: identical-shape consecutive steps leak values (only reachable if
  two steps share the same initial values), Q1 characterisation is pinned but
  its fix lands with the RHF shell, and accept-quote and TA failure scenarios in
  `workflow-errors.feature`.

## S2.0 delivered: RHF shell core and harness

- `components/forms/RhfForm`: `useForm` with `mode: 'all'`,
  `shouldFocusError: false`, the hide rules provider, and a submit mode held in
  a ref outside the values that returns to `next` after every submit (D-3).
  `useRhfFormApi()` gives the controls `submit(mode)` and a native
  `onFormSubmit`. `submit` never rejects; handler errors are logged, as Formik's
  handleSubmit did.
- `wizardYupResolver.ts`: soft or hard schema by mode, first message per path,
  and errors on hidden fields dropped (the gap found in the parity table).
- `normalizeSubmitValues` in `forms/utils.ts`: the shared payload pipeline.
- `tests/unit/helpers/rhfShell.tsx`: harness twin of `helpers/formik.tsx`.
- Behaviour tests (9) and resolver tests (10) pin the S0 findings on the RHF
  side; new files are at 100% statements and branches.
- **D-5 (proposed).** The form resets whenever a new `initialValues` object
  arrives, even if deep-equal. Formik skipped the reset when equal, which let
  edits leak between consecutive steps with identical shapes. Treat as an
  improvement; no flow depends on the leak.
- Not yet covered by the contract suite: the S0 characterisation tests still run
  only against the Formik shell. S2.x adds the shared parameterised suite.
