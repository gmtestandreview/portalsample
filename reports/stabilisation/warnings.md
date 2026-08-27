# Warning Census — Task C1

Measured 2026-08-27 at commit `25d1e4e` on `fix/dependency-vulnerability-remediation`.

This census is the input to Tasks C2–C6 and the precondition for C7's global ratchet.
Counts are baseline evidence, not identifiers. The durable keys are the **signature** and
the **first owning stack**; a count that moves without a signature changing is not a new
row.

## How this was measured, and one correction to earlier evidence

```powershell
npm run test:unit -- --reporter=default      > reports/stabilisation/c1-unit-census.log
npm run test:storybook -- --reporter=default > reports/stabilisation/c1-storybook-census.log
```

**`--reporter=default` is load-bearing.** Without it, Vitest 4 writes no intercepted console
output at all when stdout is not a TTY. The first attempt at this census ran
`npm run test:unit` piped to a file and produced a 13-line log with zero warnings — which
reads exactly like a clean tree. Two existing evidence files in this directory,
`unit.before.log` and `d1-unit.log`, are 13 lines for the same reason and are blind, not
green. `a1-unit.log` and `a1-storybook.log` passed the flag and did capture output.

This is the same class of defect as findings B1 and B8: evidence that looks like proof of
absence but never had the ability to observe.

### Evidence files

| File | Contents |
| --- | --- |
| `c1-unit-census.log` | Full unit run, 124 files / 1450 tests, exit 0 |
| `c1-storybook-census.log` | Full Storybook browser-mode run, 87 files / 218 tests, exit 0 |
| `c1-modal-repetitions.log` | Three focused repetitions of `ClientApp/src/components/modals` |

## Summary

| ID | Signature | Surface | Blocks | Lines | Owner files | Classification | Task |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| W1 | React Aria missing visible label | unit | 200 | 425 | 4 | production accessibility contract | C2 |
| W2 | React Aria missing visible label | storybook | 69 | 132 | 7 | production accessibility contract (same owner as W1) | C2 |
| W3 | React `not wrapped in act(...)` | unit | — | 15 | 2 | unit-test synchronization | C3 |
| W4 | React `not wrapped in act(...)` | storybook | 55 | 106 | 11 | story synchronization/effect cleanup | C3 |
| W5 | `[env] Missing required runtime variable` | storybook | 66 | 140 | setup | Storybook runtime fixture | C4 |
| W6 | `SB_CORE-SERVER_0002 CriticalPresetLoadError` | unit | 1 | 1 | 1 | unit-test fixture side effect | C7 |
| W7 | `Copied to clipboard:` | unit | 1 | 1 | 1 | out of guard scope (`console.log`) | none |
| W8 | MSW startup banner | storybook | 7 | — | setup | out of guard scope (`console.log`) | none |

No `console.warn`/`console.error` signature outside W1–W6 was emitted by either run. In
particular there is **no** third-party warning requiring a bounded exception, which matches
the plan's finding that the reviewed evidence does not justify a blanket third-party
exception.

---

## W1 — React Aria missing visible label (unit)

**Signature**

```
If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility
```

**First owning stack.** `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggestContainer.tsx:110`
renders a native `<label htmlFor={controlId}>` as a child of React Aria's `<ComboBox>`:

```tsx
<ComboBox<AutoSuggestOption<T>> …>
    <AutoSuggestMenuState hasOptions={options.length > 0} />
    <label htmlFor={controlId} className={`${name.toLowerCase()}-auto-suggest-label form-label`}>
        {label}
    </label>
```

React Aria discovers its label through `LabelContext`, which only `react-aria-components`'
own `<Label>` populates. A plain DOM `<label>` never reaches it, so `ComboBox` believes it
is unlabelled and warns — once per render pass, which is why the counts are large.

**This is not fixture noise.** The `htmlFor`/`id` pair does give the `<input>` an accessible
name, so an axe check on the input passes. What is missing is the ARIA wiring React Aria
derives from the same context for the *listbox and popover* it renders, which are left
unnamed. `combobox.accessibility.test.tsx` — the nominal, correctly-labelled case — emits
the warning too, confirming the owner is the component and not any one test's fixture.

**Affected tests**

| Owner file | Blocks | Notes |
| --- | ---: | --- |
| `tests/unit/components/inputs/complexInputs.behavior.test.tsx` | 188 | 13 tests; worst is `uses AddressLookup fallbacks for missing labels and address fields` at 79 lines |
| `tests/unit/components/inputs/residualBranches.test.tsx` | 5 | `keeps AutoSuggest keyboard movement inert while closed and uses fallback ids` |
| `tests/unit/routes/acceptQuote/deliveryAndReturn.test.tsx` | 4 | route consumer, regression surface only |
| `tests/unit/components/inputs/combobox.accessibility.test.tsx` | 3 | nominal labelled combobox |

**Reproduction**

| Mode | Command | Result |
| --- | --- | --- |
| single test | `npm run test:unit -- …/complexInputs.behavior.test.tsx --reporter=default -t "drives AutoSuggest search and selection through the public input"` | reproduces, 23 lines |
| file-scoped | `npm run test:unit -- …/combobox.accessibility.test.tsx --reporter=default` | reproduces, 6 lines |
| file-scoped | `npm run test:unit -- …/residualBranches.test.tsx --reporter=default` | reproduces, 13 lines |
| file-scoped | `npm run test:unit -- …/deliveryAndReturn.test.tsx --reporter=default` | reproduces, 7 lines |
| sequential | full run | reproduces, 425 lines |

Reproduces identically in every isolation mode, so the cause is local to each render and
**not** cross-test lifecycle leakage. This closes the plan's secondary leakage hypothesis
for this signature.

**Intended repair (C2).** Replace the native `<label>` with `react-aria-components`' `<Label>`
inside `<ComboBox>`, keeping the existing class names and the `controlId` association so the
rendered DOM contract and existing selectors are unchanged. Consumers listed above are
regression surfaces and should not be edited.

**Status:** open, owned by C2.

---

## W2 — React Aria missing visible label (Storybook)

Same signature and same first owner as W1, measured through the story surface.

| Owner story | Blocks |
| --- | ---: |
| `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx` | 31 |
| `ClientApp/src/routes/account/AccountRoute.stories.tsx` | 13 |
| `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx` | 9 |
| `ClientApp/src/routes/account/organisationDetails.stories.tsx` | 6 |
| `ClientApp/src/routes/ta/organisationAndContact.stories.tsx` | 6 |
| `ClientApp/src/components/Inputs/AddressLookup/AddressLookup.stories.tsx` | 3 |
| setup-time (`unknown test`) | 1 |

**Reproduction:** sequential full run, 132 lines. Not re-run in isolation — the owner is
already proven local by W1, and story-level isolation adds no new information about a
component-level cause.

**Intended repair (C2).** Closed by W1's repair. Any story edit here is a Gate C-MCP surface
and must not precede that gate.

**Status:** open, owned by C2, closes with W1.

---

## W3 — React `not wrapped in act(...)` (unit)

**Signature**

```
Warning: An update to %s inside a test was not wrapped in act(...).
```

Emitted as a format string; the census matches the interpolated form. Note that React Aria
ships Parcel scope-hoisted bundles, so one component name arrives build-hashed
(`$dbdc5e6e7ce01b4b$var$ComboBoxInner`). Expectations must not anchor on that hash.

**First owning stacks**

| Component | Owner file | Lines |
| --- | --- | ---: |
| `ForwardRef(Input)` | `tests/unit/components/inputs/complexInputs.behavior.test.tsx` | 6 |
| `ForwardRef(Input)` | `tests/unit/components/inputs/residualBranches.test.tsx` | 4 |
| `ComboBoxInner` (hashed) | `tests/unit/components/inputs/complexInputs.behavior.test.tsx` | 3 |
| `ComboBoxInner` (hashed) | `tests/unit/components/inputs/residualBranches.test.tsx` | 2 |

Both owners are React Aria internals of the same `ComboBox` as W1, and every occurrence is
co-emitted in a stderr block that also carries the W1 signature.

**Reproduction:** file-scoped run of `residualBranches.test.tsx` reproduces 6 of the 15
lines. Reproduces without the rest of the suite, so this is local settlement, not leakage.

**Intended repair (C3).** Await the combobox's own settled state in the two owning tests
rather than wrapping assertions in bare `act`. C3 should re-measure after C2 lands: an
unlabelled React Aria `ComboBox` takes a different internal path, so part of this count may
be a consequence of W1 rather than an independent defect.

**Status:** open, owned by C3, sequenced after C2.

---

## W4 — React `not wrapped in act(...)` (Storybook)

Same signature, story surface. 55 blocks / 106 lines across 11 story files plus setup.

| Owner story | Lines |
| --- | ---: |
| `ClientApp/src/routes/acceptQuote/AcceptQuote.stories.tsx` | 44 |
| `ClientApp/src/routes/requestForQuote/RequestForQuote.stories.tsx` | 24 |
| `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx` | 6 |
| `ClientApp/src/routes/services-we-offer/ServicesWeOffer.stories.tsx` | 6 |
| setup-time (`unknown test`) | 6 |
| `ClientApp/src/routes/ta/manage/appMessages.stories.tsx` | 5 |
| `ClientApp/src/routes/preConditions/PreConditions.stories.tsx` | 4 |
| `ClientApp/src/routes/measurementReport/indexList.stories.tsx` | 4 |
| `ClientApp/src/components/SlateEditor/SlateEditor.stories.tsx` | 2 |
| `ClientApp/src/routes/account/AccountRoute.stories.tsx` | 2 |
| `ClientApp/src/routes/ta/applicationAndInstrument.stories.tsx` | 2 |
| `ClientApp/src/components/Utilities/routeAccessibleNavigation.stories.tsx` | 1 |

Component-level owners across those files, most frequent first: `ReportRecipient` (16),
`QuotationSummary` (10), `DeliveryAndReturn` (10), `PaymentDetails` (8),
`InstrumentAndRequest` (6), `InstrMeasurementReport` (6), `ViewPdfQuote` (4),
`ServicesWeOffer` (4), `OrganisationNameLookup` (4), `CertificateNumberLookup` (4),
`RouteAccessibleNavigation` (2).

This confirms the plan's finding that AutoSuggest is **not** the only scheduler-warning
owner. Each owner cluster is a separate acceptance.

**Reproduction:** sequential full run only. Per-story isolation is C3's work, not the
census's — the owner list is what C3 needs to start.

**Intended repair (C3).** Settle each owner at its own effect boundary. Story edits are a
Gate C-MCP surface.

**Status:** open, owned by C3.

---

## W5 — `[env] Missing required runtime variable` (Storybook)

**Signature**

```
[env] Missing required runtime variable: REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY
[env] Missing required runtime variable: REACT_APP_GA_TRACKINGID
```

70 lines each, 140 total, all emitted at setup time (`unknown test`) via
`ClientApp/src/env.ts:61`.

**First owning stack.** Both Storybook entry paths assign empty strings for exactly these
two variables, and `env.ts` treats a falsy required value as missing:

- `vitest.storybook.setup.ts:17,19`
- `.storybook/preview-setup.ts:13,16`

Every other required variable in both files already carries a deterministic non-empty value,
including `REACT_APP_APPINSIGHTS_CONN_STRING`. Only these two were left blank.

**Reproduction:** sequential full Storybook run. Does not occur in the unit surface —
`vitest.setup.ts` supplies non-empty values for both.

**Intended repair (C4).** Supply deterministic non-empty test values in both entry paths, in
the same shape as the existing connection string. Production validation in `env.ts` is not
to change.

**Status:** open, owned by C4.

---

## W6 — Storybook `CriticalPresetLoadError` unhandled rejection (unit)

**Signature**

```
Unhandled promise rejection: SB_CORE-SERVER_0002 (CriticalPresetLoadError): Storybook failed to load the following preset: …/.storybook/main.ts.
```

**First owning stack.** `tests/unit/config/vitestTopology.test.ts:5` imports
`vitest.storybook.config.ts` to assert its shape. Evaluating that module calls
`storybookTest({ configDir })`, which asynchronously starts loading `.storybook/main.ts` and
the `@chromatic-com/storybook` preset in a Node/jsdom unit context where the server-side
presets cannot resolve. The rejection is unhandled and printed to stderr.

The test itself is correct and passes 16/16; only the import's side effect is at fault.

**Open question for C7.** It is not yet established whether this text reaches
`console.warn`/`console.error` — and therefore whether the guard sees it at all — or is
printed by Vitest's own unhandled-rejection path. That cannot be settled without installing
the guard, which C1 explicitly does not do. C7 must determine this before enabling the
ratchet, because if the guard does catch it, `vitestTopology.test.ts` fails on day one.

**Intended repair (C7).** Preferred: assert the config's shape without evaluating the
plugin's side effect. Fallback: an exact local expectation via `expectConsoleMessage`.

**Status:** open, owned by C7, applicability unconfirmed.

---

## W7 — `Copied to clipboard:` (unit)

`tests/unit/components/utilityCoverageSlice.test.tsx > utility component coverage slice >
prints, copies and can hide mailing label actions` emits a multi-line `console.log` on
stdout carrying the rendered mailing label.

The guard covers `warn` and `error` only, so this is out of scope and needs no repair. It is
recorded so a future reader does not mistake it for an unhandled signature. If the ratchet
is ever widened to `log`, this becomes an intentional-output row needing a local expectation.

**Status:** no action.

---

## W8 — MSW startup banner (Storybook)

Seven `console.log` blocks at Storybook setup: the Mock Service Worker banner, docs URL,
worker script URL, worker scope and client IDs. Out of guard scope, same reasoning as W7.

**Status:** no action.

---

## Findings that change the plan

### The ten modal failures do not reproduce at HEAD

The plan carries `Ten modal visibility assertions in four files` as an open feature-level
defect owned by C6, evidenced by PR runs `32643895854` and `32644658694`, and records that
a targeted run failed all five stories in `Modals.stories.tsx` in 152 ms at the first
visibility assertion.

Measured now:

| Run | Result |
| --- | --- |
| Full Storybook census | 87 files / 218 tests, **exit 0**; `Modals.stories.tsx` 5/5 in 2589 ms; `ContentModal/ContentModal.stories.tsx` 2/2 in 988 ms |
| Focused repetition 1 | 2 files / 7 tests passed, 5.65 s |
| Focused repetition 2 | 2 files / 7 tests passed, 5.58 s |
| Focused repetition 3 | 2 files / 7 tests passed, 5.42 s |

The 152 ms fast-fail signature is gone; the stories now take the time a real transition
takes. The most likely cause is the Storybook autodocs work merged from the declared
concurrent lane, which resolved 22 docgen failures via `patch-package`.

This does **not** close C6. The plan's acceptance is ten consecutive focused repetitions,
and four green runs is not ten. What it does change is C6's premise: it is no longer
repairing a reproducing deterministic failure, it is confirming a resolved one and pinning
it against recurrence. C6 should be re-scoped accordingly rather than started as written.

### The unit census is unchanged since 2026-08-24

Owner-for-owner and count-for-count against `a1-unit.log`:

| Owner file | `a1-unit.log` (2026-08-24) | This census |
| --- | ---: | ---: |
| `complexInputs.behavior.test.tsx` | 188 | 188 |
| `residualBranches.test.tsx` | 5 | 5 |
| `deliveryAndReturn.test.tsx` | 4 | 4 |
| `combobox.accessibility.test.tsx` | 3 | 3 |

This is direct evidence for the corrected form of finding B3. The audit's original claim was
that hoisting `StrictMode` in `ClientApp/src/index.tsx` would invalidate any census taken
before it, because StrictMode's double render is a first-order source of `act` warnings. The
resolution corrected that on the grounds that `index.tsx` is imported only by a fully-mocked
bootstrap test and that Storybook's preview never imports it. The census now confirms it by
measurement: the hoist landed in `c09a62c`, and the unit warning census did not move by a
single block.

### The plan's owner list for the aria signature was over-scoped

The plan names `OrganisationNameLookup` and unspecified "route consumers" among the reproducing
owners for the React Aria warning. In the unit surface neither emits it:
`tests/unit/components/inputs/OrganisationNameLookup.behavior.test.tsx` and
`OrganisationNameLookup.test.ts` are both silent. `OrganisationNameLookup` does appear, four
times, but as an **act** owner in the Storybook surface (W4), not an aria owner. The aria
signature has exactly four unit owner files and seven story owner files, listed above.

## What C7 needs before the ratchet can be enabled

1. W1/W2 closed at the shared owner (C2).
2. W3/W4 closed per owner cluster (C3), re-measured after C2 in case part of W3 is downstream of W1.
3. W5 closed in both Storybook entry paths (C4).
4. W6's guard applicability settled, then closed or given an exact local expectation.
5. No row left in `open` without either a repair or a named exact local expectation.
