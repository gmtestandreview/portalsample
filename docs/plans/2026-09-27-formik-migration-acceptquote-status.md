# Formik → React Hook Form migration: acceptQuote/paymentDetails — status

**Branch:** `feat/formik-to-rhf-checkout` (off `main` at `db0eb1a4`)

**Note on provenance:** this migration was originally kicked off from a
generic phased Formik-to-RHF migration prompt naming
`src/features/checkout/CheckoutForm.tsx` as the target. That file does not
exist in this repository — this is the NMI (portal.measurement.gov.au)
customer portal, a government metrology/accreditation service with no
checkout/e-commerce feature. The original prompt document is not part of this
working tree (it exists only under
`.worktrees/readonly-props-tool/docs/plans/2026-09-22-formik-migration-to-react-hooks.md`,
an unrelated worktree for a different task). This document replaces it as the
authoritative, repo-grounded record for this migration.

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

## What's already built on this branch (commits `8ecd9b75`, `e0da3d0c`

`56bce9d3`)

A `ClientApp/src/components/forms/FormikForm/rhfCompat.tsx` module exists with
`useField`, `useFormikContext`, `RhfCompatStatusContext`, `Field`, and
`createSaveAwareYupResolver` — all built and tested (13/13 tests passing,
clean `type-check`) for the now-abandoned adapter approach.

- `useField`/`useFormikContext`/`Field`/`RhfCompatStatusContext` are
  **no longer needed** under the fork-locally approach (they existed to
  preserve Formik-shaped call sites for zero-touch shared consumers, which is
  no longer the plan) and should be removed as dead code, or the file
  repurposed/renamed to hold only what's still useful.
- `createSaveAwareYupResolver` **is still directly useful** — it reproduces
  the `values.saveAndExit` soft/hard Yup validation switch against real
  schemas (tested against `acceptQuote/validation.ts`'s
  `deliveryAndReturnSubmitValidation`/`SaveValidation` pair) and can be reused
  as-is inside `paymentDetails.tsx`'s own `useForm()` configuration.

There is also an uncommitted `react-hook-form: "^7.89.0"` dependency addition
in `package.json`/`package-lock.json` from this work (the `^` pin matches this
repo's existing convention for `dependencies`, e.g. `formik: "^2.4.9"` — no
fix needed there).

## Next steps (not yet started)

1. Clean up `rhfCompat.tsx`: keep only the resolver (rename file/exports to
   drop the "compat" framing, since it's no longer a Formik-compatibility
   shim), remove the now-unused `useField`/`useFormikContext`/`Field`/context
   exports and their tests.
2. Identify the exact shared components `paymentDetails.tsx` (and its
   conditional `contact` sub-block) currently renders, and build local,
   RHF-native replacements (`register()`/`Controller`/`useController()`) used
   only by this file.
3. Rebuild `paymentDetails.tsx` on its own internal `useForm()` (with the
   reused resolver), local input replacements, and the value-sync bridge into
   the outer Formik instance described above.
4. Reuse `isHidden`/`removeHidden` from `components/forms/utils.ts` unchanged
   (confirmed Formik-agnostic in Phase 1) for hidden-field payload stripping.
5. Add/strengthen tests: a real (non-stubbed) `paymentDetails.test.tsx`
   companion (today's version stubs out all Formik-bound children), and a new
   test for `reportRecipient.tsx` (currently has none) if it's touched.
6. Full regression run (`npm run test:unit`, `npm run test:e2e:app`) against
   the 182-file/2064-test baseline before considering this done.
7. Phase 4 (verification) and Phase 5 (scoped cleanup, final report) per the
   original migration prompt's discipline.
