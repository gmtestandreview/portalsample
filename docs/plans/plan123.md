# React Aria Evaluation Reorganisation Proposal

| Current path                                                  | Proposed path                                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `components/Breadcrumb/AriaBreadcrumb/Breadcrumbs.tsx`        | `components/react-aria-evaluation/breadcrumb/AriaBreadcrumb/Breadcrumbs.tsx`             |
| `components/Inputs/AriaCheckbox/{Checkbox,CheckboxGroup}.tsx` | `components/react-aria-evaluation/checkbox/AriaCheckbox/{Checkbox,CheckboxGroup}.tsx`    |
| `components/Inputs/AriaDateField/DateField.tsx`               | `components/react-aria-evaluation/date-time/AriaDateField/DateField.tsx`                 |
| `components/Inputs/AriaDatePicker/DatePicker.tsx`             | `components/react-aria-evaluation/date-time/AriaDatePicker/DatePicker.tsx`               |
| `components/Inputs/AriaDateRangePicker/DateRangePicker.tsx`   | `components/react-aria-evaluation/date-time/AriaDateRangePicker/DateRangePicker.tsx`     |
| `components/Calendar/Calendar.tsx`                            | `components/react-aria-evaluation/date-time/Calendar/Calendar.tsx`                       |
| `components/Inputs/AriaInputGroup/InputGroup.tsx`             | `components/react-aria-evaluation/input-group/AriaInputGroup/InputGroup.tsx`             |
| `components/ColorArea/ColorArea.tsx`                          | `components/react-aria-evaluation/color/ColorArea/ColorArea.tsx`                         |
| `components/ColorField/ColorField.tsx`                        | `components/react-aria-evaluation/color/ColorField/ColorField.tsx`                       |
| `components/ColorPicker/ColorPicker.tsx`                      | `components/react-aria-evaluation/color/ColorPicker/ColorPicker.tsx`                     |
| `components/ColorSlider/ColorSlider.tsx`                      | `components/react-aria-evaluation/color/ColorSlider/ColorSlider.tsx`                     |
| `components/ColorSwatch/{ColorSwatch,ColorSwatchPicker}.tsx`  | `components/react-aria-evaluation/color/ColorSwatch/{ColorSwatch,ColorSwatchPicker}.tsx` |
| `components/ColorThumb/ColorThumb.tsx`                        | `components/react-aria-evaluation/color/ColorThumb/ColorThumb.tsx`                       |
| `components/ColorWheel/ColorWheel.tsx`                        | `components/react-aria-evaluation/color/ColorWheel/ColorWheel.tsx`                       |
| `components/ComboBox/ComboBox.tsx`                            | `components/react-aria-evaluation/combobox/ComboBox.tsx`                                 |
| `components/CommandPalette/CommandPalette.tsx`                | `components/react-aria-evaluation/command-palette/CommandPalette.tsx`                    |
| `components/Dialog/Dialog.tsx`                                | `components/react-aria-evaluation/dialog/Dialog.tsx`                                     |
| `components/Disclosure/Disclosure.tsx`                        | `components/react-aria-evaluation/disclosure/Disclosure.tsx`                             |
| `components/DisclosureGroup/DisclosureGroup.tsx`              | `components/react-aria-evaluation/disclosure/DisclosureGroup.tsx`                        |
| `components/DropZone/DropZone.tsx`                            | `components/react-aria-evaluation/dropzone/DropZone.tsx`                                 |
| `components/GridLists/GridList.tsx`                           | `components/react-aria-evaluation/grid-list/GridList.tsx`                                |

**Reason (all rows above):** every consumer is internal to the 23-directory
evaluation surface (§3, §4); the contract test already treats these as one named
unit; regrouping under a single umbrella directory makes that existing intent
legible without inventing new semantics. **Usage status:**
`Storybook / test / docs only` + `Used transitively`. **Confidence:** High for
"no runtime consumer found"; Medium on "no consumer exists anywhere"
(absence-of-evidence caveat, §4). **Affected references:** each file's own
relative imports (depth changes by 1–2 segments), each file's `.stories.tsx`
sibling (moves with it, title unchanged), `AriaComponents.test.tsx`'s ~35 import
lines, the contract test's `evaluationDirectories` array and its `theme.css`
path, `withReactAriaEvaluation` relative-import depth in every story that uses
it. **Risk:** Low-mechanical (all resolvable by a codemod + `tsc`/test run), but
**high blast-radius concentration** on `forms/AriaForm/Form.tsx` and
`Buttons/AriaButton/Button.tsx` — see §7.

**Files that should remain where they are:**

| Current path                        | Reason                                                                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/reactaria_components/*` | Ambiguous status — not part of the formal contract, mixed React-Aria/non-React-Aria content, possible duplicates of production components. Moving it now would smuggle a judgment call into a "mechanical" pass. See §9. |

**Components requiring an architectural/human decision (not moved in this
proposal):**

| File                                                                                                     | Decision needed                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `reactaria_components/StatusPill.tsx`                                                                    | Duplicate vs. `Pill/StatusPill.tsx`? Merge, delete, or keep both with a disambiguating name?                                                                                                                 |
| `reactaria_components/AlertMessage.tsx`                                                                  | Duplicate vs. `Alert/index.tsx`'s exported `AlertMessage`?                                                                                                                                                   |
| `reactaria_components/PageHeader.tsx`                                                                    | Overlaps conceptually with `Header/*`? **Insufficient evidence — requires verification** (I did not diff behaviour/props, only confirmed both exist).                                                        |
| Whether `reactaria_components/` should be deleted, renamed, or folded into the evaluation surface at all | Its own regression test explicitly frames it as "retained" after a repair, not as active work — someone made a deliberate keep-decision previously; that decision, not file evidence, should drive its fate. |

---

## 7. Dependency and blast-radius findings

- **`forms/AriaForm/Form.tsx`** (`Description`, `FieldError`, `Label`, `Text`)
  is imported by at least 13 other scoped files (ColorField, ColorSlider,
  ComboBox, Inputs/AriaCheckbox×2, Inputs/AriaDateField, Inputs/AriaDatePicker,
  Inputs/AriaDateRangePicker, Inputs/AriaInputGroup,
  AriaComponents/{Meter,NumberField,ProgressBar,RadioGroup,SearchField,Select,Slider,Switch,TagGroup,TextField,TimeField}).
  **Evidence:** direct grep matches, High confidence. **Impact if moved:** every
  one of those import lines must update in the same commit/codemod pass — this
  is the single highest-fan-in file in scope.
- **`Buttons/AriaButton/Button.tsx`** is the second hub (consumed by Calendar,
  CommandPalette's story, Dialog's story, Form's story, Menu's story, Modal's
  story, Popover's story, Toast, Toolbar's story, Tooltip's story,
  RangeCalendar, AriaComponents/ProgressCircle-via-Button). Same treatment
  required.
- **`AriaComponents/Content.tsx`, `NmiIcon.tsx`, `ProgressCircle.tsx`** are the
  primitive-layer hubs, each with 5–8 internal consumers.
- **No circular dependencies detected** between the moved directories — the
  dependency direction is consistently "composite folder → AriaComponents
  primitive," never the reverse (confirmed by the same grep passes; primitives
  only import each other same-directory, never reach into composite folders).
- **`theme.css`'s `.react-aria-evaluation` scope class and the contract test's
  hard-coded `AriaComponents/theme.css` path** are both string-literal
  dependencies on the current location — moving `theme.css` to
  `primitives/theme.css` requires updating the contract test in the same change
  (a one-line path fix, already identified exactly).
- Because Storybook titles are independent of file paths (§2), **the migration
  has zero blast radius on Storybook navigation** — this is the main
  risk-reducer for the whole plan.

---

## 8. Alternative structures and trade-offs

**Alternative — leave everything exactly where it is, only rename
`AriaComponents` → `react-aria-evaluation`.** Lower migration effort (one
directory rename, not ~20), but forfeits the discoverability win of grouping the
currently-scattered composite folders (Calendar, Color×7, ComboBox, etc.) under
one umbrella — a new engineer would still need to know that "Calendar" at the
top level is evaluation-only, indistinguishable by location from a hypothetical
future production `Calendar`. Not recommended given the task's own emphasis on
discoverability, but worth naming as the lower-effort fallback if migration
budget is constrained.

**Alternative — mirror Storybook titles exactly in the filesystem
(`components/Evaluation/ReactAria/Tabs/...`).** Rejected per your explicit
instruction to avoid reproducing Storybook levels mechanically, and because
"Evaluation" as a folder name reads oddly for what is, functionally, this
codebase's only React Aria implementation — the umbrella name
`react-aria-evaluation` preserves the "this is provisional" signal without the
awkward nesting.

No other structure was credible enough to warrant full comparison — the existing
contract test already settles the "what belongs together" question; the
remaining choice was really just naming and grouping depth, both covered above.

---

## 9. Components requiring human decisions

1. **`reactaria_components/*` disposition** (§3 Cluster C, §6) — three possible
   duplicates of production components, zero Storybook presence, a test that
   explicitly frames it as "retained" rather than removed. This needs someone
   who knows _why_ it was repaired-not-deleted, which I cannot recover from
   repository evidence alone.
2. **Whether the "evaluation" framing itself should change** — i.e., is this
   React Aria work expected to graduate to production, get abandoned, or stay
   perpetually parallel? No document describes an intended end-state (I searched
   `docs/` for migration/graduation language and found none). That answer would
   change whether `react-aria-evaluation/` is the right long-term name at all,
   versus e.g. eventually replacing the production `Buttons/PrimaryButton`,
   `Inputs/Checkbox`, etc. **Insufficient evidence — requires verification**
   from whoever owns this initiative.
3. **Color folder granularity** — I proposed grouping the 7 Color* folders under
   `color/`, but did not find evidence either supporting or opposing finer
   subgrouping (e.g., separating "pickers" from "controls"); this is a stylistic
   call, not one repository evidence resolves.

---

## 10. Ordered migration plan (proposed only — not executed)

**Group 1 — primitives.** Move `AriaComponents/*` →
`react-aria-evaluation/primitives/*` (including CSS). Update: contract test's
`evaluationDirectories[0]` and its `theme.css` literal path;
`AriaComponents.test.tsx`'s ~31 import lines; every composite-folder file's
relative import depth to primitives (Content, NmiIcon, ProgressCircle,
ToastQueue, Separator, etc.). _Checkpoint:_ `npm run type-check`,
`npm run test:unit` (this is where the contract test and the monolithic
AriaComponents test would immediately fail if anything is missed — they are the
safety net for this whole migration).

**Group 2 — the two hub composites.** Move `Buttons/AriaButton` and
`forms/AriaForm` next, since Group 3+ depends on both. Update every consumer
import found in §7. _Checkpoint:_ type-check + unit tests again before touching
anything downstream.

**Group 3 — remaining composite folders** (Breadcrumb/AriaBreadcrumb, Calendar,
Color×7, ComboBox, CommandPalette, Dialog, Disclosure, DisclosureGroup,
DropZone, GridLists, Inputs/AriaCheckbox, Inputs/AriaDateField,
Inputs/AriaDatePicker, Inputs/AriaDateRangePicker, Inputs/AriaInputGroup). These
can move in parallel batches since §7 found no cross-dependencies among them
beyond the two hubs already moved. _Checkpoint:_ type-check, unit tests, then
`npm run build-storybook` (confirms the glob-based story discovery and autodocs
still resolve with zero title changes).

**Group 4 — contract-test finalization.** Update the full
`evaluationDirectories` array to the new paths, re-run the 48-story-count
assertion, re-run the theme-scoping assertion. _Checkpoint:_ `npm run test:ci`
(full gate) + `npm run test:e2e:storybook` (Storybook BDD suite) as final
confirmation nothing in the interaction-test layer broke.

**Not scheduled:** any action on `reactaria_components/` — pending §9
decision 1.

---

## 11. Validation checkpoints

- After each group: `npm run type-check`, `npm run test:unit`.
- After Group 3: `npm run build-storybook` (catches glob/resolution breaks the
  unit tests wouldn't).
- Final gate: `npm run test:ci`, `npm run test:e2e:storybook`, and a manual
  Storybook sidebar check that "Evaluation/React Aria/*" still lists all 48
  entries unchanged.

---

## 12. Open questions / unresolved uncertainty

- `reactaria_components/`'s intended future (§9.1, §9.2) — needs a person, not a
  repo search.
- Whether `PageHeader.tsx` genuinely duplicates `Header/*` in behaviour, not
  just in name — **Insufficient evidence — requires verification**.
- Whether any external consumer (a different repo, a Storybook Composition
  reference, a future build step) depends on these paths — not discoverable from
  within this repository; flagged per your instruction not to treat internal
  silence as proof of no external use.

---

This is the design for a filesystem reorganisation — nothing has been changed.
If you'd like to proceed, the next step per the brainstorming process would be
writing this up as a spec doc and handing it to `writing-plans` for an actual
implementation plan; happy to do that, or to adjust the grouping/naming above
first if anything looks off.
