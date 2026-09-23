# Execution discipline and phase gates

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
