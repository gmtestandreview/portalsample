# Warning Settlement — Task C3

Measured 2026-08-29 at commit `430820c` on `fix/dependency-vulnerability-remediation`,
after Task C2 landed in `f1de495`.

This report is the C3 evidence base. It re-measures the C1 census rows C3 owns (W3, W4),
runs the plan's three-mode settlement experiment on every owner, and names the first
owning stack for each surviving cluster.

## Re-measurement commands

```powershell
npm run test:unit      -- --reporter=default > reports/stabilisation/c3-unit-remeasure.log
npm run test:storybook -- --reporter=default > reports/stabilisation/c3-storybook-remeasure.log
```

`--reporter=default` remains load-bearing; without it Vitest 4 writes no intercepted
console output to a non-TTY stdout and the log reads as clean.

| Run | Result |
| --- | --- |
| Unit | 126 files / 1488 tests, exit 0 |
| Storybook | 87 files / 218 tests, exit 0 |

---

## W3 — React `not wrapped in act(...)` (unit): CLOSED, no repair required

The C1 census predicted this: "C3 should re-measure after C2 lands: an unlabelled React
Aria `ComboBox` takes a different internal path, so part of this count may be a consequence
of W1 rather than an independent defect."

Measured post-C2:

| Signature | C1 census (2026-08-27) | C3 re-measure (2026-08-29) |
| --- | ---: | ---: |
| `not wrapped in act(...)` | 15 lines / 4 owner stacks | **0** |
| React Aria missing visible label (W1) | 425 lines / 4 owner files | **0** |

Both W1 and W3 were closed by one change — C2's replacement of the native `<label>` with
the `react-aria-components` `<Label>`, plus the five `element.focus()` to
`await user.click()` replacements. W3 was entirely downstream of W1; it was never an
independent defect.

The unit surface now emits exactly two signatures, both already owned elsewhere and neither
owned by C3:

| Signature | Owner | Census row |
| --- | --- | --- |
| `SB_CORE-SERVER_0002 (CriticalPresetLoadError)` | `tests/unit/config/vitestTopology.test.ts` | W6, owned by C7 |
| `Copied to clipboard:` (`console.log`) | `tests/unit/components/utilityCoverageSlice.test.tsx` | W7, no action |

**Status: closed.** No unit test file is edited by C3.

---

## W4 — React `not wrapped in act(...)` (Storybook): open, 118 lines

W2 (React Aria missing visible label, story surface) is also **closed** — 0 lines, down
from 132. W5 (`[env] Missing required runtime variable`) is unchanged at 140 lines and
remains C4's.

### C2 moved this row rather than only shrinking it

Per-component counts against the C1 census:

| Component | C1 (2026-08-27) | C3 (2026-08-29) | Change |
| --- | ---: | ---: | --- |
| `ReportRecipient` | 16 | 16 | — |
| `QuotationSummary` | 10 | 10 | — |
| `DeliveryAndReturn` | 10 | 10 | — |
| `PaymentDetails` | 8 | 8 | — |
| `InstrumentAndRequest` | 6 | 6 | — |
| `InstrMeasurementReport` | 6 | 6 | — |
| `ViewPdfQuote` | 4 | 4 | — |
| `ServicesWeOffer` | 4 | 4 | — |
| `OrganisationNameLookup` | 4 | 8 | **+4** |
| `CertificateNumberLookup` | 4 | 8 | **+4** |
| `RouteAccessibleNavigation` | 2 | 2 | — |
| `$dbdc5e6e7ce01b4b$var$ComboBoxInner` | 0 | 6 | **new** |
| `$542a13ca2fa5b484$var$PopoverInner` | 0 | 2 | **new** |
| `$42ceafc619f9c3ba$export$bf788dd355e3a401` | 0 | 4 | **new** |

Total 106 to 118. The four increased or new rows are all React Aria internals of the
`ComboBox` that C2 repaired. Giving the combobox a real `LabelContext` provider puts it on
its labelled render path, which schedules additional state updates it previously skipped.
These are a consequence of C2 and are C3's to settle, not a regression to revert: the
accessibility contract W1/W2 fixed is the correct behaviour.

`ClientApp/src/routes/ta/manage/appMessages.stories.tsx` fell from 5 lines to 0 over the
same window and needs no C3 work.

---

## Step 1 — Three-mode settlement experiment

For every owner, mode 1 is the story alone (`-t "<Story Name>"`), mode 2 is its complete
story file, mode 3 is the full sequential run. Logs are in
`reports/stabilisation/c3-settlement/`.

### Result: every owner is mode 1 or mode 2. No owner requires a mode-3 explanation.

| Owner story | Mode 1 | Mode 2 | Mode 3 attribution | First owning stack |
| --- | ---: | ---: | ---: | --- |
| `RequestForQuote > Instrument And Request Step` | **24** | 24 | 0 | `InstrumentAndRequest`, `DatePicker`, `CustomDatePicker`, `HidableField`, `NumberFormatBase` |
| `RequestForQuote > Instrument And Request Validation` | **14** | — | 0 | same |
| `AcceptQuote > Delivery And Return Step` | **10** | 11 | 15 | `DeliveryAndReturn` |
| `AcceptQuote > Quotation Summary Step` | **10** | 6 | 12 | `QuotationSummary`, `ViewPdfQuote` |
| `AcceptQuote > Summary And Accept Step` | **10** | 13 | 7 | `QuotationSummary`, `ViewPdfQuote` |
| `AcceptQuote > Report Recipient Step` | **8** | 5 | 4 | `ReportRecipient` |
| `AcceptQuote > Payment Details Step` | **4** | 9 | 4 | `PaymentDetails` |
| `indexList > Shell` | **8** | 8 | 4 | `InstrMeasurementReport` plus React Aria collection |
| `ServicesWeOffer > Default` | **6** | 6 | 6 | `ServicesWeOffer` plus React Aria collection |
| `PreConditions > Renders Protected Content` | **4** | 4 | 4 | `PreConditions`, `Layout` |
| `routeAccessibleNavigation > Live Region` | **2** | 2 | 1 | `RouteAccessibleNavigation` |
| `AccountRoute > Organisation Details Validation` | 0 | **4** | 2 | `ComboBoxInner`, scheduled by a preceding story in the same file |
| `SlateEditor > Empty` | 0 | **2** | 1 | `ForwardRef(Editable)`, scheduled by a preceding story in the same file |

### Files that show a count only in the full run, and are not owners

| File | Mode 2 | Mode 3 |
| --- | ---: | ---: |
| `ClientApp/src/components/Inputs/AutoSuggest/AutoSuggest.stories.tsx` | **0** | 9 |
| `ClientApp/src/routes/ta/summaryAndSubmit.stories.tsx` | **0** | 4 |
| `ClientApp/src/routes/ta/applicationAndInstrument.stories.tsx` | **0** | 2 |
| `ClientApp/src/routes/account/organisationDetails.stories.tsx` | **0** | 2 |
| `ClientApp/src/routes/requestForQuote/requestForQuoteSummary.stories.tsx` | **0** | 1 |
| `ClientApp/src/components/Layout/Layout.stories.tsx` | **0** | 0 (stderr only) |

These six files are clean in isolation. They accumulate lines in the full run only because
React attributes a late update to whichever test is currently active, not to the test that
scheduled it.

### The attribution-drift proof

`RequestForQuote.stories.tsx` demonstrates the mechanism unambiguously, because the file has
**no `play` functions at all** — every story only renders.

| Run | act lines | Attributed to |
| --- | ---: | --- |
| Mode 1, `Organisation And Contact Validation` | 0 | — |
| Mode 1, `Instrument And Request Step` | 24 | `Instrument And Request Step` |
| Mode 2, whole file | 24 | 21 to `Organisation And Contact Validation`, 3 to `unknown test` |

`Organisation And Contact Validation` renders `OrganisationAndContact` and cannot produce a
`DatePicker` or `NumberFormatBase` update. The 24 lines are `InstrumentAndRequest`'s, landing
one test later in file order. **The attribution in the census is not the owner.** This is why
the plan's instruction to locate the first owner rather than patch the reporting route is
load-bearing here: repairing `Organisation And Contact Validation` would have changed nothing.

### Conclusion for Step 1

Local settlement, not leakage. The plan's constraint — "Do not design a global cleanup around
cross-story leakage unless modes 2 or 3 prove it" — is satisfied in the negative: no global
cleanup is justified. Each owner is repaired at its own effect boundary, and the mode-3-only
files are expected to fall to zero as a side effect, with no edit of their own.

---

## First owning stack — `InstrumentAndRequest` (worked example)

`ClientApp/src/routes/requestForQuote/instrumentAndRequest.tsx:69` mounts an effect that
awaits `instance.acquireTokenSilent(...)` and then
`Promise.all([getLookup(...), getLookup(...)])` against the MSW `/api/lookup` handler, and
on resolution calls four setters:

```
setMeasurementCategories(sorted);
setArtefactTypes(artefactTypeResult);
setArtefactTypesSelected(getArtefactTypes(...));   // or setArtefactTypesSelected([])
setIsInstrumentOrArtefactTypeDisabled(true);
```

The story renders and the test ends before the MSW response resolves, so every setter in
that chain — plus the `DatePicker`/`CustomDatePicker`/`HidableField`/`NumberFormatBase`
re-render it triggers — lands outside `act`. The effect is correct production behaviour and
is not to change. The repair belongs in the story: await a named stable UI state that only
exists once the lookup has resolved.

---

## Status

| Row | Owner | Status |
| --- | --- | --- |
| W3 | C3 | **closed** by C2, verified by re-measurement, no edit |
| W4 | C3 | open — 13 owner stories across 11 files, all mode 1 or mode 2 |
| W2 | C2 | closed, verified here (132 to 0) |
| W5 | C4 | unchanged at 140 lines |
