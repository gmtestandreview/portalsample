# Lodash and Underscore removal plan

## Objective

Remove first-party Lodash usage from the application and remove any direct
Lodash, Underscore, or related type dependencies that are no longer needed.
Prefer native ECMAScript APIs where they preserve the current behavior. Keep
behavior-sensitive helpers behind an explicit, tested project-local
implementation when no native equivalent exists.

The recommended scope is first-party removal. A zero-Lodash installation is not
currently achievable within this task because Formik, `slate-dom`, and
`slate-react` declare Lodash as a runtime dependency, and Playwright-BDD pulls
`lodash.sortby` through `@cucumber/query`. Replacing those transitive packages
is a separate dependency/platform migration and is not assumed here.

## Evidence, assumptions, and constraints

- The repository contains 23 first-party source files with 39 modular Lodash
  import declarations under `ClientApp/src/**`.
- No explicit Underscore package, import, or `underscore.js` reference was found
  outside excluded vendor/dependency content. `npm ls underscore --all` also
  reports no installed dependency.
- The direct package entries are `lodash` in `dependencies` and `@types/lodash`
  in `devDependencies` in `package.json`.
- Remove `@types/lodash` only after type-checking the installed Slate
  declarations without it. If a published Slate declaration genuinely imports
  Lodash types despite the optional peer declaration, retain that type package
  as a documented compatibility exception rather than breaking the type gate.
- `npm explain lodash` shows runtime consumers in Formik, `slate-dom`, and
  `slate-react`; `npm explain lodash.sortby` shows Playwright-BDD tooling as the
  consumer. These lockfile entries must not be deleted merely because first-
  party imports disappear.
- `vitest.storybook.config.ts` prebundles the current Lodash entry points, and
  the config test explicitly characterizes that list. Those entries should be
  removed after first-party imports are gone.
- `vite.config.mts` and `.storybook/main.ts` classify Lodash in a utilities
  vendor group. Because transitive runtime consumers remain, retain that
  classification unless post-change bundle inspection proves that no emitted
  runtime module needs it.
- `ClientApp/src/components/forms/formPath.ts` already centralizes nested form
  path behavior and has characterization tests for dotted and bracketed paths,
  missing values, falsy values, immutability, array creation, and deletion.
- Re-baseline `git status` immediately before implementation and preserve any
  unrelated changes that are present at that time.
- Generated API output, source mirrors, vendor copies, webpack bootstrap files,
  and policy/instruction files remain outside the edit scope unless a later
  verification step identifies a genuine first-party reference.

## Acceptance criteria

| Criterion                          | Pass condition                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First-party imports removed        | No `from 'lodash/...` or equivalent Lodash/Underscore runtime import remains under `ClientApp/src/**`.                                                                        |
| Direct dependencies removed        | `package.json` has no direct `lodash`, `underscore`, or `@types/lodash` entry; the lockfile root package mirrors that state.                                                  |
| Native behavior preserved          | Focused characterization tests pass for every replaced helper, including nullish inputs and nested form paths.                                                                |
| Transitive dependencies understood | `npm ls lodash --all` reports only approved transitive consumers; `lodash.sortby` remains only where Playwright-BDD requires it; no unexpected Underscore dependency appears. |
| Tooling configuration is accurate  | Storybook no longer prebundles first-party Lodash entry points; vendor grouping remains justified by the measured transitive graph.                                           |
| Quality gates pass                 | Type-check, lint, focused tests, unit tests, Storybook tests, app build, Storybook build, and relevant runtime/build verification pass.                                       |
| Documentation is current           | Current dependency inventories explain that Lodash is transitive only; historical examples and archived plans are not rewritten.                                              |

## Requirement traceability

| Requirement                                         | Planned change                                                                                                                                                                           | Verification                                                                     |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Prefer native methods                               | Replace `trim`, `replace`, `Array.isArray`, nullish checks, `Object.keys`, `Object.entries`, `Object.fromEntries`, array iteration, and object-value mapping in the listed source files. | Focused unit tests, type-check, lint, scoped import search.                      |
| Do not make blind replacements                      | Preserve null/undefined guards and test object-vs-array receiver assumptions before each conversion.                                                                                     | Edge-case characterization tests and review of the helper mapping below.         |
| Remove Lodash and Underscore from the repo/codebase | Remove first-party imports, direct manifest entries, and Storybook optimizer entries; document unavoidable transitive packages.                                                          | `rg`, `npm ls`, lockfile root inspection, build output inspection.               |
| Preserve form semantics                             | Delegate nested `get`/`set` behavior to Formik's existing `getIn`/`setIn` through the project path module, and add parity coverage for the current path contract.                        | `tests/unit/components/forms/formPath.test.ts`, resolver tests, full unit suite. |
| Reduce dependency surface without new substitutes   | Do not add another general-purpose utility dependency. Use a small domain-specific comparator only for the current form-value equality contract.                                         | New comparator tests and dependency diff inspection.                             |

## Planned file changes

### Manifest, lockfile, and tooling

- Modify `package.json` to remove direct `lodash` and `@types/lodash` entries.
  Do not add `underscore` or a replacement utility package.
- Regenerate `package-lock.json` with the repository's declared npm version.
  Confirm that the root package no longer lists the removed direct entries while
  transitive Lodash entries remain where `npm explain` proves they are needed.
- Modify `vitest.storybook.config.ts` to remove the explicit modular Lodash
  `optimizeDeps.include` list.
- Modify `tests/unit/config/vitestTopology.test.ts` to remove the old modular
  entry-point fixture and replace it with a contract that the Storybook leaf
  does not explicitly prebundle `lodash/*` entries.
- Keep the Lodash matcher in the `utilities` group in `vite.config.mts` and
  `.storybook/main.ts` initially, because Formik and Slate still depend on
  Lodash. Update comments or test wording only if needed to explain that this is
  transitive vendor classification.
- Modify the relevant assertion in `tests/unit/config/viteConfig.test.ts` only
  if the final build proves the group no longer receives a Lodash module. If a
  Lodash module is emitted transitively, retain the assertion and document why.

### First-party source conversion

Modify the following 23 source files. The implementation order should follow the
helper categories so shared behavior is established before its consumers change:

- `ClientApp/src/utils/index.ts`
- `ClientApp/src/validationSchemas/stringPredicates.ts`
- `ClientApp/src/components/forms/formPath.ts`
- `ClientApp/src/components/forms/utils.ts`
- `ClientApp/src/components/forms/saveAwareYupResolver.ts`
- `ClientApp/src/components/forms/RhfForm/wizardYupResolver.ts`
- `ClientApp/src/components/forms/useFormikRhfBridge.ts`
- `ClientApp/src/components/forms/WizardForm/useWizardStepController.ts`
- `ClientApp/src/components/forms/ErrorSummary/index.tsx`
- `ClientApp/src/components/forms/IntentButton/index.tsx`
- `ClientApp/src/components/forms/CommonForms/ContactDetails/index.tsx`
- `ClientApp/src/components/forms/CommonForms/RhfContactDetails/index.tsx`
- `ClientApp/src/components/Inputs/AddressLookup/index.tsx`
- `ClientApp/src/components/Inputs/Attachment/index-new.tsx`
- `ClientApp/src/components/Inputs/RhfAttachment/index.tsx`
- `ClientApp/src/components/Inputs/RhfTextAreaInput/index.tsx`
- `ClientApp/src/components/Inputs/RhfTextInput/index.tsx`
- `ClientApp/src/components/Inputs/TextAreaInput/index.tsx`
- `ClientApp/src/components/Inputs/TextInput/index.tsx`
- `ClientApp/src/routes/acceptQuote/paymentDetailsFormFields.tsx`
- `ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx`
- `ClientApp/src/routes/ta/applicationAndInstrument.tsx`
- `ClientApp/src/routes/ta/rhfSupportingDocuments.tsx`

Apply these conversions deliberately:

| Current helper                     | Planned replacement and behavior guard                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `trim`                             | Use `.trim()` only after preserving the existing string/nullish guard. In the legacy textarea path, retain the current nullish-to-empty-string result instead of calling `.trim()` on `null` or `undefined`.                                                                                                                                                                                                                     |
| `replace`                          | Use `String.prototype.replace` for the already-string `removeAllWhitespaces` input. Preserve the two existing regex passes.                                                                                                                                                                                                                                                                                                      |
| `isEmpty(trim(value))`             | Use `(value?.trim() ?? '').length === 0` in `stringPredicates.ts`; retain `null` and `undefined` classification.                                                                                                                                                                                                                                                                                                                 |
| `isArray`                          | Use `Array.isArray`. Remove only stale commented examples if they are touched by the import cleanup.                                                                                                                                                                                                                                                                                                                             |
| `isNil`                            | Use explicit null and undefined checks so the existing date validation contract stays clear.                                                                                                                                                                                                                                                                                                                                     |
| `isString`                         | Use `typeof value === 'string'` at the current call sites; add a test only if String wrapper objects are actually part of the input contract.                                                                                                                                                                                                                                                                                    |
| `isBoolean` / `isFunction`         | Use `typeof value === 'boolean'` and `typeof value === 'function'`. Preserve the existing hidden-field and render-prop branches.                                                                                                                                                                                                                                                                                                 |
| `keys`                             | Use `Object.keys` for the string enum objects.                                                                                                                                                                                                                                                                                                                                                                                   |
| `forEach`                          | Use `for...of` or array `.forEach` after establishing the receiver is an array. Where the current value is optional, use an explicit `?? []` guard.                                                                                                                                                                                                                                                                              |
| Lodash object `map`                | Replace attachment error mapping with `Object.values(problemDetails.errors ?? {}).map(...)`; preserve Lodash's empty-array result when the error collection is absent.                                                                                                                                                                                                                                                           |
| `entriesIn` / `fromPairs`          | Use `Object.entries` / `Object.fromEntries` for the JSON-like form objects. Add a test or retain a helper if inherited enumerable properties are shown to be part of the input contract; do not silently change that behavior.                                                                                                                                                                                                   |
| `omit(value, 'isManuallyEntered')` | Use null-safe destructuring or an equivalent native object reconstruction so `undefined`/`null` still produce the same object spread result.                                                                                                                                                                                                                                                                                     |
| `get` / `set` / `toPath` / `clone` | Do not reimplement a partial path parser. Change `formPath.ts` to delegate its existing tested `getIn`/`setIn` contract to Formik's exported helpers, then replace the other Lodash imports with the project `getIn`/`setIn` functions. Verify the existing identity, bracket-path, array-creation, and deletion assertions.                                                                                                     |
| `capitalize` / `startCase`         | Add a small local key formatter in `ErrorSummary` for the actual validation-key grammar (`FirstName`, `Contact[0].FirstName`, separators): split camel-case boundaries with a regex, replace underscore/hyphen separators with spaces, trim, then uppercase the first character and lowercase the remainder. Preserve current rendered text through tests; do not claim there is a one-to-one native method.                     |
| `isEqual`                          | Do not use `JSON.stringify` as a blind replacement. Add a focused `areFormValuesEqual` helper and tests for primitives, `null`/`undefined`, nested plain objects, arrays, key-order differences, and any Date-like values found in the form inventory. If unsupported non-JSON form values are found, stop this sub-change and retain/replace the behavior through a separate decision rather than weakening equality semantics. |

The equality helper should be added as:

- `ClientApp/src/utils/areFormValuesEqual.ts`
- `tests/unit/utils/areFormValuesEqual.test.ts`

The helper must be limited to the form-value domain demonstrated by the tests;
it must not become a general Lodash replacement library.

### Tests and documentation

- Extend `tests/unit/components/forms/formPath.test.ts` only where needed to
  prove parity after delegating to Formik.
- Extend `tests/unit/components/forms/wizardYupResolver.test.tsx` and
  `tests/unit/components/forms/saveAwareYupResolver.test.ts` to preserve the
  first-error-per-path and nested-error behavior after `getIn`/`setIn` change.
- Extend `tests/unit/components/forms/errorSummary.test.tsx` for the key-format
  cases that previously exercised `capitalize` and `startCase`.
- Preserve and rerun the existing utility, validation, input, attachment,
  contact-details, payment-details, and Type Approval tests. Add cases only for
  behavior that the native conversion changes or newly guards.
- Update current dependency inventory prose in `docs/STACK.md` and `INIT.md`:
  remove Lodash from the direct application-library list and note its approved
  transitive consumers if the inventory format requires it.
- Amend the current migration note in
  `docs/specs/2026-10-20-webpack-to-vite-design.md` so its dependency-discovery
  baseline distinguishes direct application imports from transitive packages.
- Leave historical plans, skill examples, lint rule catalogs, generated files,
  and vendored source untouched; their Lodash mentions are examples, history, or
  upstream content rather than first-party runtime usage.

## Execution order

### 1. Capture baseline and confirm scope

Run from the repository root before implementation:

```text
git status --short --branch
rg -n --hidden --glob 'ClientApp/src/**' "from 'lodash/|from \\"lodash/|from 'underscore'|from \\"underscore\\"" .
npm ls lodash underscore lodash-es @types/lodash --all
npm explain lodash
npm explain lodash.sortby
```

Expected evidence is the inventory recorded above: 23 source files, no
Underscore package, direct Lodash plus transitive Formik/Slate consumers, and
`lodash.sortby` through Playwright-BDD. If the graph differs, update this plan
before coding.

Capture the pre-change quality baseline with:

```text
npm run type-check
npm run test:unit
npm run test:storybook
npm run build
npm run build-storybook
```

Record command results and emitted bundle sizes. These commands are planned
verification; they were not run as part of this planning task.

### 2. Add or strengthen behavior contracts first

Write the failing tests for `areFormValuesEqual`, path delegation, object-map
null safety, and ErrorSummary formatting before changing the imports. Run the
focused suites and confirm that each new contract fails for the old
implementation or otherwise demonstrates the behavior being pinned.

### 3. Replace behavior-sensitive helpers

First update `formPath.ts` and the equality helper, then the two Yup resolvers,
Formik/RHF bridge, wizard controller, and form utilities. This ordering keeps
nested form behavior centralized and makes failures local to the helper tests.

### 4. Replace straightforward helpers and update consumers

Convert the utility, validation, input, contact, route, and attachment files
listed above. Preserve imports from the project API and do not change unrelated
formatting or component behavior.

### 5. Remove direct dependency/config entries

After `rg` confirms no first-party runtime import remains, edit `package.json`,
regenerate `package-lock.json`, remove Storybook's explicit Lodash optimizer
list, and update the associated config tests and current dependency docs.

### 6. Run verification and inspect the result

Run the focused suites first:

```text
npm run test:unit -- tests/unit/utils/index.test.ts tests/unit/utils/areFormValuesEqual.test.ts tests/unit/validationSchemas/common.test.ts tests/unit/components/forms/formPath.test.ts tests/unit/components/forms/wizardYupResolver.test.tsx tests/unit/components/forms/saveAwareYupResolver.test.ts tests/unit/components/forms/errorSummary.test.tsx tests/unit/components/inputs/TextInput.test.tsx tests/unit/components/inputs/TextAreaInput.test.tsx tests/unit/components/inputs/RhfTextInput.test.tsx tests/unit/components/inputs/RhfTextAreaInput.test.tsx tests/unit/components/inputs/Attachment/index-new.test.tsx tests/unit/components/inputs/Attachment/RhfAttachment.test.tsx tests/unit/components/forms/contactDetails.branches.test.tsx tests/unit/routes/ta/applicationAndInstrument.test.tsx tests/unit/routes/ta/rhfSupportingDocuments.test.tsx tests/unit/routes/acceptQuote/paymentDetails.test.tsx
npm run test:unit -- tests/unit/config/vitestTopology.test.ts tests/unit/config/viteConfig.test.ts
npm run type-check
npm run lint
```

Then run the broader gates:

```text
npm run test:unit
npm run test:storybook
npm run build
npm run verify:vite-build
npm run verify:vite-runtime
npm run build-storybook
npm run test:e2e:app
npm run test:e2e:storybook
```

Expected results are zero first-party Lodash/Underscore imports, no direct
manifest entries, passing focused and broad suites, successful builds, and no
new runtime or Storybook failures. Inspect `dist/**` and `storybook-static/**`
only as generated verification output; do not commit those directories.

Finish with an independent, read-only review of:

```text
rg -n -i --hidden --glob '!node_modules/**' --glob '!vendor/**' --glob '!ClientApp/source-map-http-downloads/**' 'lodash|underscore' ClientApp/src package.json package-lock.json vitest.storybook.config.ts tests/unit/config
npm ls lodash underscore --all
git diff --check
git diff --stat
git status --short
```

The final review must distinguish approved transitive/diagnostic references from
forbidden first-party runtime imports and must confirm that unrelated worktree
changes were not overwritten.

## Rollback and correction limit

All planned edits are source, test, documentation, manifest, or lockfile changes
and are reversible per file. If a focused test exposes a regression:

1. Identify the specific helper conversion and its behavior mismatch.
2. Correct only that conversion or its focused helper test.
3. Rerun the affected focused suite and then the type-check.
4. Record the result before moving to the next category.

Allow at most three unsuccessful correction attempts for the same unresolved
behavior. After the third failure, stop repeating the same replacement, retain
the original helper or direct dependency for that category, and escalate it as a
separate compatibility decision. Never remove the transitive Lodash package from
the lockfile by hand and never use a worktree reset to roll back.

## Fresh critical review of this plan

- The main risk is treating Lodash helpers as interchangeable with native
  methods. The plan explicitly isolates deep equality, nested paths, object
  mapping, inherited entries, and text casing for dedicated tests or retention.
- The direct-removal goal is compatible with the current dependency graph, but a
  literal “no Lodash anywhere in `node_modules`” interpretation is blocked by
  approved transitive dependencies. That is a confirmed limitation, not an
  implementation result.
- Removing the Storybook optimizer list is safe only after first-party imports
  are gone; retaining the vendor regex is intentional until emitted bundles
  provide evidence that transitive runtime Lodash is absent.
- Current dependency documentation is stale relative to the installed graph; the
  plan updates only current inventories and the current migration note, not
  historical examples.
- No implementation, tests, builds, or independent external review were run by
  this planning task. Those remain execution-time verification requirements.
