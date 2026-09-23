# React Aria Component Reorganisation Implementation Plan

**Goal:** Consolidate the 23-directory React Aria evaluation surface (plus the
3-file `reactaria_components/` scaffold) under a single
`ClientApp/src/components/react-aria-evaluation/` root, with zero Storybook
navigation change and zero deletions.

**Architecture:** Pure file-move + import-path update, executed in 5
dependency-ordered groups (primitives → hub composites → remaining composites →
retained scaffolds → contract-test finalisation). Each group is independently
reviewable and checkpointed with `type-check`/`test:unit`.

**Tech Stack:** TypeScript, React 18, react-aria-components, Vitest, Storybook,
`tests/unit/storybook/reactAriaEvaluationContract.test.ts` as the enforcement
mechanism.

## Source Inputs

- Spec: `.claude/docs/specs/2026-09-22-react-aria-component-reorg-design.md`
- Contract test: `tests/unit/storybook/reactAriaEvaluationContract.test.ts` —
  **read directly in full (lines 1–165) during plan authoring**, not inferred
  from the spec's prose summary. Confirmed structure: a single flat 24-entry
  `evaluationDirectories` array (lines 7–32, `AriaComponents` at index 0,
  `Buttons/AriaButton` at index 2, `forms/AriaForm` at index 23), five `it()`
  blocks, and a `findRelativeImports` regex (lines 55–59) that already scans
  `@import`, not just JS/TS `from`/`import` — CSS cross-references are covered
  by the existing safety net, not a gap this plan needs to add tooling for.
- `tests/unit/components/AriaComponents.test.tsx` — ~31 import lines pointing at
  `AriaComponents/*`
- `.storybook/main.ts` — read directly:
  `stories: ["../ClientApp/src/**/*.stories.@(js|jsx|mjs|ts|tsx)", ...]` is
  fully recursive with no `storySort`/title-template logic. Confirmed file
  relocation cannot break Storybook discovery.
- Live `git status --short` of every Task's target directories, taken
  immediately before writing this plan (see Task 0).

## Assumptions and Unknowns

- Assumption: no consumer outside the evaluation surface imports any in-scope
  file (confirmed by spec's repo-wide import search including the `@/*` alias
  and webpack aliases).
- Assumption: `git mv` preserves history and is preferred over delete+recreate
  for every file move in this plan.
- Resolved: Group 4 asked whether the 3 retained-scaffold files (`AlertMessage`,
  `StatusPill`, `PageHeader`) should gain full contract inclusion
  (stories/theme/icon rules) or just move location. Spec marked this "a decision
  for the implementation plan" — resolved: **move only, no new stories**, since
  adding coverage is explicitly out of scope per the spec's "Explicitly out of
  scope" section.
- Resolved: `AriaComponents/`, `Buttons/AriaButton/`, and `forms/AriaForm/`
  currently contain uncommitted, unrelated modifications (6 files — `Meter.tsx`,
  `Popover.tsx`, `ProgressBar.tsx`, `ProgressCircle.tsx`, `RangeCalendar.tsx`,
  `Tooltip.tsx` — confirmed via `git status --short` at plan-authoring time).
  Left unaddressed, `git add <target-dir>` in Tasks 1–4 would silently fold
  these unrelated diffs into "refactor: move" commits. Resolved by Task 0 below,
  which isolates them before any move begins.
- Resolved: two of the five contract-test assertions hardcode paths that this
  reorg changes and were not named in the spec: the "removes the dead
  AriaComponents entry point" test (line 160–164, checks
  `AriaComponents/main.tsx` absence) and the "keeps the retained
  reactaria_components scaffold import-resolvable" test (line 140–158, single
  hardcoded `scaffoldRoot`). Both are now explicit sub-steps in Tasks 1 and 4
  respectively, with exact replacement code.
- No blocking ambiguities remain.

## Requirement Traceability

| Requirement                                                    | Task(s) | Notes                                                                                        |
| -------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Isolate pre-existing unrelated diffs from move targets         | Task 0  | Prevents commit conflation; blocks Task 1                                                    |
| Move `AriaComponents/*` → `react-aria-evaluation/primitives/*` | Task 1  | 88 files per tokensave listing; repoints the dead-entry-point test                           |
| Move hub composites (`AriaButton`, `AriaForm`)                 | Task 2  | Highest fan-in; must precede Task 3                                                          |
| Move remaining 15 composite folders                            | Task 3  | No cross-deps beyond the two hubs                                                            |
| Move `reactaria_components/*` scaffolds                        | Task 4  | Move only, no new stories; restructures the scaffold-resolvability test to loop over 3 paths |
| Finalise contract test paths                                   | Task 5  | Re-run 48-story and theme-scoping assertions                                                 |

## Framework Fit

No additional planning framework needed — this is a mechanical,
dependency-ordered file migration with an existing automated safety net (the
contract test fails loudly on any missed import).

## Files and Responsibilities

| Path                                                                                                                                  | Action | Responsibility                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| `ClientApp/src/components/AriaComponents/**`                                                                                          | Move   | → `react-aria-evaluation/primitives/**`                            |
| `ClientApp/src/components/Buttons/AriaButton/**`                                                                                      | Move   | → `react-aria-evaluation/button/AriaButton/**`                     |
| `ClientApp/src/components/forms/AriaForm/**`                                                                                          | Move   | → `react-aria-evaluation/form/AriaForm/**`                         |
| `ClientApp/src/components/{Breadcrumb,Calendar,Color*,ComboBox,CommandPalette,Dialog,Disclosure*,DropZone,GridLists,Inputs/Aria*}/**` | Move   | → grouped subfolders per spec's target structure                   |
| `ClientApp/src/components/reactaria_components/*.tsx`                                                                                 | Move   | → `react-aria-evaluation/{alert-message,status-pill,page-header}/` |
| `tests/unit/storybook/reactAriaEvaluationContract.test.ts`                                                                            | Modify | Update `evaluationDirectories` paths incrementally per group       |
| `tests/unit/components/AriaComponents.test.tsx`                                                                                       | Modify | Update ~31 import paths in Task 1                                  |
| All in-scope files' internal relative imports                                                                                         | Modify | Adjust `../` depth after each move                                 |

## Coverage-Exclusion Path Map

Three files hold **independent, hand-maintained copies** of the same
excluded-file lists and must all be updated in lockstep with every move in Tasks
1–4, or `npm run test:unit:coverage` / `npm run test:ci` fails against the 100%
threshold on newly-un-excluded (moved) files:

- `vitest.unit.config.ts` — `coverageConfig.exclude` (two blocks: an "unmeasured
  spike" block at lines 39–41/54–59, and a "verified in Storybook" block at
  lines 69–93)
- `sonar-project.properties` — `sonar.coverage.exclusions` (one flat list, lines
  60–128, same paths)
- `tests/unit/config/coverageRemapPolicy.test.ts` — its own hardcoded
  `evaluationSpikeNotCovered` (lines 47–54) and `verifiedInStorybook` (lines
  72–98) arrays, used to build the `allowedExclusionCategories` regex allowlist.
  **This file does not import the other two — it is a third independent copy**,
  confirmed by direct read; `sonarCoverageContract.test.ts` only cross-checks
  `vitest.unit.config.ts` against `sonar-project.properties`, not against this
  file.

| Old path                                          | New path                                                                  | Task | List                                |
| ------------------------------------------------- | ------------------------------------------------------------------------- | ---- | ----------------------------------- |
| `AriaComponents/main.tsx`                         | `react-aria-evaluation/primitives/main.tsx`                               | 1    | evaluationSpikeNotCovered           |
| `AriaComponents/ListBox.tsx`                      | `react-aria-evaluation/primitives/ListBox.tsx`                            | 1    | evaluationSpikeNotCovered           |
| `AriaComponents/Menu.tsx`                         | `react-aria-evaluation/primitives/Menu.tsx`                               | 1    | evaluationSpikeNotCovered           |
| `AriaComponents/Table.tsx`                        | `react-aria-evaluation/primitives/Table.tsx`                              | 1    | evaluationSpikeNotCovered           |
| `AriaComponents/Tree.tsx`                         | `react-aria-evaluation/primitives/Tree.tsx`                               | 1    | evaluationSpikeNotCovered           |
| `AriaComponents/RangeCalendar.tsx`                | `react-aria-evaluation/primitives/RangeCalendar.tsx`                      | 1    | verifiedInStorybook                 |
| `AriaComponents/Slider.tsx`                       | `react-aria-evaluation/primitives/Slider.tsx`                             | 1    | verifiedInStorybook                 |
| `AriaComponents/Switch.tsx`                       | `react-aria-evaluation/primitives/Switch.tsx`                             | 1    | verifiedInStorybook                 |
| `Buttons/AriaButton/Button.tsx`                   | `react-aria-evaluation/button/AriaButton/Button.tsx`                      | 2    | verifiedInStorybook                 |
| `forms/AriaForm/Form.tsx`                         | `react-aria-evaluation/form/AriaForm/Form.tsx`                            | 2    | verifiedInStorybook                 |
| `CommandPalette/CommandPalette.tsx`               | `react-aria-evaluation/command-palette/CommandPalette.tsx`                | 3    | evaluationSpikeNotCovered           |
| `GridLists/GridList.tsx`                          | `react-aria-evaluation/grid-list/GridList.tsx`                            | 3    | evaluationSpikeNotCovered           |
| `Breadcrumb/AriaBreadcrumb/Breadcrumbs.tsx`       | `react-aria-evaluation/breadcrumb/AriaBreadcrumb/Breadcrumbs.tsx`         | 3    | verifiedInStorybook                 |
| `Calendar/Calendar.tsx`                           | `react-aria-evaluation/date-time/Calendar/Calendar.tsx`                   | 3    | verifiedInStorybook                 |
| `ColorArea/ColorArea.tsx`                         | `react-aria-evaluation/color/ColorArea/ColorArea.tsx`                     | 3    | verifiedInStorybook                 |
| `ColorField/ColorField.tsx`                       | `react-aria-evaluation/color/ColorField/ColorField.tsx`                   | 3    | verifiedInStorybook                 |
| `ColorPicker/ColorPicker.tsx`                     | `react-aria-evaluation/color/ColorPicker/ColorPicker.tsx`                 | 3    | verifiedInStorybook                 |
| `ColorSlider/ColorSlider.tsx`                     | `react-aria-evaluation/color/ColorSlider/ColorSlider.tsx`                 | 3    | verifiedInStorybook                 |
| `ColorSwatch/ColorSwatch.tsx`                     | `react-aria-evaluation/color/ColorSwatch/ColorSwatch.tsx`                 | 3    | verifiedInStorybook                 |
| `ColorSwatch/ColorSwatchPicker.tsx`               | `react-aria-evaluation/color/ColorSwatch/ColorSwatchPicker.tsx`           | 3    | verifiedInStorybook                 |
| `ColorThumb/ColorThumb.tsx`                       | `react-aria-evaluation/color/ColorThumb/ColorThumb.tsx`                   | 3    | verifiedInStorybook                 |
| `ColorWheel/ColorWheel.tsx`                       | `react-aria-evaluation/color/ColorWheel/ColorWheel.tsx`                   | 3    | verifiedInStorybook                 |
| `ComboBox/ComboBox.tsx`                           | `react-aria-evaluation/combobox/ComboBox.tsx`                             | 3    | verifiedInStorybook                 |
| `Disclosure/Disclosure.tsx`                       | `react-aria-evaluation/disclosure/Disclosure/Disclosure.tsx`              | 3    | verifiedInStorybook                 |
| `DisclosureGroup/DisclosureGroup.tsx`             | `react-aria-evaluation/disclosure/DisclosureGroup/DisclosureGroup.tsx`    | 3    | verifiedInStorybook                 |
| `DropZone/DropZone.tsx`                           | `react-aria-evaluation/dropzone/DropZone.tsx`                             | 3    | verifiedInStorybook                 |
| `Inputs/AriaCheckbox/Checkbox.tsx`                | `react-aria-evaluation/checkbox/AriaCheckbox/Checkbox.tsx`                | 3    | verifiedInStorybook                 |
| `Inputs/AriaCheckbox/CheckboxGroup.tsx`           | `react-aria-evaluation/checkbox/AriaCheckbox/CheckboxGroup.tsx`           | 3    | verifiedInStorybook                 |
| `Inputs/AriaDateField/DateField.tsx`              | `react-aria-evaluation/date-time/AriaDateField/DateField.tsx`             | 3    | verifiedInStorybook                 |
| `Inputs/AriaDatePicker/DatePicker.tsx`            | `react-aria-evaluation/date-time/AriaDatePicker/DatePicker.tsx`           | 3    | verifiedInStorybook                 |
| `Inputs/AriaDateRangePicker/DateRangePicker.tsx`  | `react-aria-evaluation/date-time/AriaDateRangePicker/DateRangePicker.tsx` | 3    | verifiedInStorybook                 |
| `Inputs/AriaInputGroup/InputGroup.tsx`            | `react-aria-evaluation/input-group/AriaInputGroup/InputGroup.tsx`         | 3    | verifiedInStorybook                 |
| `reactaria_components/**` (one glob, all 3 files) | 3 explicit paths — see Task 4 Step 5                                      | 4    | separate handling: glob → 3 entries |

All paths above are prefixed with `ClientApp/src/components/` in every one of
the 3 files; the table omits that prefix for readability.

## Tasks

### Task 0: Isolate pre-existing unrelated changes from move targets

#### Files

- None moved or modified — this task only stages/commits or stashes what is
  _already_ dirty inside Task 1–4's target directories, separately from any
  reorg commit.

- [ ] **Step 1: Identify pre-existing dirty files inside every move target**

Run:

```bash
git status --short ClientApp/src/components/AriaComponents ClientApp/src/components/Buttons/AriaButton ClientApp/src/components/forms/AriaForm ClientApp/src/components/Breadcrumb ClientApp/src/components/Calendar ClientApp/src/components/Color* ClientApp/src/components/ComboBox ClientApp/src/components/CommandPalette ClientApp/src/components/Dialog ClientApp/src/components/Disclosure* ClientApp/src/components/DropZone ClientApp/src/components/GridLists ClientApp/src/components/Inputs ClientApp/src/components/reactaria_components
```

Expected (confirmed at plan-authoring time): 6 modified files —
`AriaComponents/Meter.tsx`, `Popover.tsx`, `ProgressBar.tsx`,
`ProgressCircle.tsx`, `RangeCalendar.tsx`, `Tooltip.tsx`. Re-run this at
execution time in case the tree has changed since authoring.

- [ ] **Step 2: Commit the pre-existing changes on their own, unrelated to this
      reorg**

```bash
git add ClientApp/src/components/AriaComponents/Meter.tsx ClientApp/src/components/AriaComponents/Popover.tsx ClientApp/src/components/AriaComponents/ProgressBar.tsx ClientApp/src/components/AriaComponents/ProgressCircle.tsx ClientApp/src/components/AriaComponents/RangeCalendar.tsx ClientApp/src/components/AriaComponents/Tooltip.tsx
git commit -m "chore: commit pre-existing AriaComponents edits before reorg"
```

If Step 1 finds a different file set at execution time, substitute those paths —
the point is a clean `git status --short` across every Task 1–5 target directory
before Task 1 Step 2 begins, so no unrelated diff can be swept into a "refactor:
move" commit.

- [ ] **Step 3: Verify isolation**

Run: `git status --short ClientApp/src/components` Expected: no output (clean)
for every directory this plan will touch, confirming Task 1 can proceed without
commit conflation.

### Task 1: Move primitives (`AriaComponents/*` → `react-aria-evaluation/primitives/*`)

#### Files

- Move: `ClientApp/src/components/AriaComponents/*` (88 files: `.tsx`, `.css`,
  `.ts`) → `ClientApp/src/components/react-aria-evaluation/primitives/*`
- Modify: `tests/unit/storybook/reactAriaEvaluationContract.test.ts`
  (`evaluationDirectories[0]` entry, `theme.css` literal path)
- Modify: `tests/unit/components/AriaComponents.test.tsx` (~31 import lines)
- Modify: every file elsewhere in the evaluation surface that imports from
  `AriaComponents/` (Content, NmiIcon, ProgressCircle, ToastQueue, Separator,
  etc.)

- [ ] **Step 1: Establish baseline**

Run:

```bash
npm run type-check && npm run test:unit -- tests/unit/storybook/reactAriaEvaluationContract.test.ts tests/unit/components/AriaComponents.test.tsx
```

Expected: both pass on current (pre-move) tree — confirms a clean starting point
before any move.

- [ ] **Step 2: Move the files**

```bash
git mv ClientApp/src/components/AriaComponents ClientApp/src/components/react-aria-evaluation/primitives
```

- [ ] **Step 3: Update the contract test and the AriaComponents test's import
      paths**

Update `evaluationDirectories[0]` in `reactAriaEvaluationContract.test.ts`
(line 8) from `"AriaComponents"` to `"react-aria-evaluation/primitives"`; update
the `themeFile` path at line 112
(`path.join(componentsRoot, "AriaComponents/theme.css")` →
`path.join(componentsRoot, "react-aria-evaluation/primitives/theme.css")`) the
same way. Update each of the ~31
`from '../../../ClientApp/src/components/AriaComponents/...'`-style imports in
`AriaComponents.test.tsx` to the new path.

- [ ] **Step 4: Repoint the dead-entry-point test**

The "removes the dead AriaComponents entry point" test (lines 160–164) hardcodes
`path.join(componentsRoot, "AriaComponents/main.tsx")`. Left as-is, this
assertion becomes permanently vacuous after the move (the old path can never
exist again, so the test passes without testing anything). Update it to
`path.join(componentsRoot, "react-aria-evaluation/primitives/main.tsx")` so it
keeps guarding against the dead entry point's reintroduction at its new
location.

- [ ] **Step 5: Update every downstream consumer's relative import depth**

Any file inside the evaluation surface (composites in Tasks 2–4, not yet moved)
that imports a primitive (e.g. `Content`, `NmiIcon`, `Separator`, `ToastQueue`)
needs its relative path updated to reach `react-aria-evaluation/primitives/`
from its current, not-yet-moved location.

- [ ] **Step 6: Update the 3 synchronized coverage-exclusion files**

Per the Coverage-Exclusion Path Map, update all 8 Task-1-tagged rows in
`vitest.unit.config.ts` (both the `evaluationSpikeNotCovered`-equivalent block
and the `verifiedInStorybook`-equivalent block), `sonar-project.properties`, and
`tests/unit/config/coverageRemapPolicy.test.ts`'s
`evaluationSpikeNotCovered`/`verifiedInStorybook` arrays. Skipping this step is
the single most likely way this task silently breaks `test:ci` days later.

- [ ] **Step 7: Verify, including coverage**

Run: `npm run type-check && npm run test:unit && npm run test:unit:coverage`
Expected: zero errors, zero failing tests, coverage still at threshold. The
coverage run is what actually exercises the 3 files touched in Step 6 —
`npm run test:unit` alone does not. Any missed import surfaces as a
TS2307/module-not-found or a Vitest resolution failure naming the exact file;
any missed coverage-exclusion update surfaces as a threshold failure naming the
newly-uncovered file.

- [ ] **Step 8: Confirm commit scope, then commit**

Run: `git status --short` and confirm every listed path is one of: the new
`react-aria-evaluation/primitives` tree, the old (now-empty) `AriaComponents`
path, `reactAriaEvaluationContract.test.ts`, `AriaComponents.test.tsx`, or a
downstream consumer's import-line edit. If anything else appears, stop and
reconcile before staging (Task 0 should have already made this a non-issue).

```bash
git add ClientApp/src/components/react-aria-evaluation/primitives ClientApp/src/components/AriaComponents tests/unit/storybook/reactAriaEvaluationContract.test.ts tests/unit/components/AriaComponents.test.tsx
git commit -m "refactor: move AriaComponents primitives into react-aria-evaluation/"
```

### Task 2: Move hub composites (`AriaButton`, `AriaForm`)

#### Files

- Move: `ClientApp/src/components/Buttons/AriaButton/*` →
  `ClientApp/src/components/react-aria-evaluation/button/AriaButton/*`
- Move: `ClientApp/src/components/forms/AriaForm/*` →
  `ClientApp/src/components/react-aria-evaluation/form/AriaForm/*`
- Modify: every in-scope file importing `Form.tsx` (~13 files) or `Button.tsx`
  (~10 files)
- Modify: `reactAriaEvaluationContract.test.ts` (two more
  `evaluationDirectories` entries)

- [ ] **Step 1: Identify all consumers before moving**

Run: `git grep -l "AriaButton/Button\|AriaForm/Form" -- ClientApp/src tests`
Expected: full list of files needing import-path updates; cross-check against
spec's ~13/~10 counts.

- [ ] **Step 2: Move both folders**

```bash
git mv ClientApp/src/components/Buttons/AriaButton ClientApp/src/components/react-aria-evaluation/button/AriaButton
git mv ClientApp/src/components/forms/AriaForm ClientApp/src/components/react-aria-evaluation/form/AriaForm
```

- [ ] **Step 3: Update every consumer import and the contract test paths**

This is the highest-risk step in the whole migration (spec's Risks section) — do
not parallelise with Task 3. Update each consumer individually; do not
batch-replace with a blind find/replace given varying relative depths.

- [ ] **Step 4: Update the 3 synchronized coverage-exclusion files**

Per the Coverage-Exclusion Path Map, update the 2 Task-2-tagged rows
(`Buttons/AriaButton/Button.tsx`, `forms/AriaForm/Form.tsx`, both in
`verifiedInStorybook`) in `vitest.unit.config.ts`, `sonar-project.properties`,
and `tests/unit/config/coverageRemapPolicy.test.ts`.

- [ ] **Step 5: Verify, including coverage**

Run: `npm run type-check && npm run test:unit && npm run test:unit:coverage`
Expected: zero errors, zero failures, coverage still at threshold.

- [ ] **Step 6: Confirm commit scope, then commit**

Run: `git status --short` and confirm only Task 2's move targets, consumer
import edits, and the 3 coverage-exclusion files are listed.

```bash
git add ClientApp/src/components/react-aria-evaluation/button ClientApp/src/components/react-aria-evaluation/form ClientApp/src/components/Buttons ClientApp/src/components/forms/AriaForm tests/unit/storybook/reactAriaEvaluationContract.test.ts vitest.unit.config.ts sonar-project.properties tests/unit/config/coverageRemapPolicy.test.ts
git commit -m "refactor: move AriaButton and AriaForm hub composites into react-aria-evaluation/"
```

### Task 3: Move remaining composite folders

#### Files

- Move (15 folders, no cross-dependencies beyond the two Task 2 hubs):
  `Breadcrumb/AriaBreadcrumb`, `Calendar`, `ColorArea`, `ColorField`,
  `ColorPicker`, `ColorSlider`, `ColorSwatch`, `ColorThumb`, `ColorWheel`,
  `ComboBox`, `CommandPalette`, `Dialog`, `Disclosure`, `DisclosureGroup`,
  `DropZone`, `GridLists`, `Inputs/AriaCheckbox`, `Inputs/AriaDateField`,
  `Inputs/AriaDatePicker`, `Inputs/AriaDateRangePicker`, `Inputs/AriaInputGroup`
- Modify: `reactAriaEvaluationContract.test.ts` (remaining
  `evaluationDirectories` entries)

- [ ] **Step 1: Move in batches (can run in parallel per spec — no
      inter-dependencies)**

```bash
git mv ClientApp/src/components/Breadcrumb/AriaBreadcrumb ClientApp/src/components/react-aria-evaluation/breadcrumb/AriaBreadcrumb
git mv ClientApp/src/components/Calendar ClientApp/src/components/react-aria-evaluation/date-time/Calendar
git mv ClientApp/src/components/ColorArea ClientApp/src/components/react-aria-evaluation/color/ColorArea
git mv ClientApp/src/components/ColorField ClientApp/src/components/react-aria-evaluation/color/ColorField
git mv ClientApp/src/components/ColorPicker ClientApp/src/components/react-aria-evaluation/color/ColorPicker
git mv ClientApp/src/components/ColorSlider ClientApp/src/components/react-aria-evaluation/color/ColorSlider
git mv ClientApp/src/components/ColorSwatch ClientApp/src/components/react-aria-evaluation/color/ColorSwatch
git mv ClientApp/src/components/ColorThumb ClientApp/src/components/react-aria-evaluation/color/ColorThumb
git mv ClientApp/src/components/ColorWheel ClientApp/src/components/react-aria-evaluation/color/ColorWheel
git mv ClientApp/src/components/ComboBox ClientApp/src/components/react-aria-evaluation/combobox
git mv ClientApp/src/components/CommandPalette ClientApp/src/components/react-aria-evaluation/command-palette
git mv ClientApp/src/components/Dialog ClientApp/src/components/react-aria-evaluation/dialog
git mv ClientApp/src/components/Disclosure ClientApp/src/components/react-aria-evaluation/disclosure/Disclosure
git mv ClientApp/src/components/DisclosureGroup ClientApp/src/components/react-aria-evaluation/disclosure/DisclosureGroup
git mv ClientApp/src/components/DropZone ClientApp/src/components/react-aria-evaluation/dropzone
git mv ClientApp/src/components/GridLists ClientApp/src/components/react-aria-evaluation/grid-list
git mv ClientApp/src/components/Inputs/AriaCheckbox ClientApp/src/components/react-aria-evaluation/checkbox/AriaCheckbox
git mv ClientApp/src/components/Inputs/AriaDateField ClientApp/src/components/react-aria-evaluation/date-time/AriaDateField
git mv ClientApp/src/components/Inputs/AriaDatePicker ClientApp/src/components/react-aria-evaluation/date-time/AriaDatePicker
git mv ClientApp/src/components/Inputs/AriaDateRangePicker ClientApp/src/components/react-aria-evaluation/date-time/AriaDateRangePicker
git mv ClientApp/src/components/Inputs/AriaInputGroup ClientApp/src/components/react-aria-evaluation/input-group/AriaInputGroup
```

- [ ] **Step 2: Update the contract test's remaining `evaluationDirectories`
      entries**

Note: `Breadcrumb/` and `Inputs/` are shared parent directories — only the
listed `Aria*` subfolders move (`Breadcrumb/AriaBreadcrumb`,
`Inputs/AriaCheckbox`, etc.); `Breadcrumb/index.tsx`,
`Breadcrumb/Breadcrumb.stories.tsx`, and every non-`Aria*` folder under
`Inputs/` (e.g. `TextInput`, `NumberInput`, `SelectInput`) stay in place.
Confirmed via direct read that `Breadcrumb/index.tsx` imports
`react-aria-components/Breadcrumbs` from the library directly, not from
`./AriaBreadcrumb` — no accidental cross-import despite the name collision. The
`git mv` commands above already target the subfolder only; do not simplify them
to move the parent.

- [ ] **Step 3: Update the 19 Task-3-tagged coverage-exclusion rows**

Per the Coverage-Exclusion Path Map, update all 19 Task-3-tagged rows in
`vitest.unit.config.ts` (`CommandPalette`/`GridLists` in the
`evaluationSpikeNotCovered` block; the remaining 17 in `verifiedInStorybook`),
`sonar-project.properties`, and `tests/unit/config/coverageRemapPolicy.test.ts`.

- [ ] **Step 4: Verify, including coverage**

Run:

```bash
npm run type-check && npm run test:unit && npm run test:unit:coverage && npm run build-storybook
```

Expected: zero errors, zero failures, coverage still at threshold, Storybook
build succeeds (confirms no broken story imports).

- [ ] **Step 5: Confirm commit scope, then commit**

Run: `git status --short` and confirm only Task 3's 15 move targets, their
consumer import edits, and the 3 coverage-exclusion files are listed.

```bash
git add ClientApp/src/components/react-aria-evaluation ClientApp/src/components/Breadcrumb ClientApp/src/components/Calendar ClientApp/src/components/Color* ClientApp/src/components/ComboBox ClientApp/src/components/CommandPalette ClientApp/src/components/Dialog ClientApp/src/components/Disclosure* ClientApp/src/components/DropZone ClientApp/src/components/GridLists ClientApp/src/components/Inputs tests/unit/storybook/reactAriaEvaluationContract.test.ts vitest.unit.config.ts sonar-project.properties tests/unit/config/coverageRemapPolicy.test.ts
git commit -m "refactor: move remaining React Aria composite folders into react-aria-evaluation/"
```

### Task 4: Move retained-scaffold prototypes

#### Files

- Move: `ClientApp/src/components/reactaria_components/AlertMessage.tsx` →
  `react-aria-evaluation/alert-message/AlertMessage.tsx`
- Move: `ClientApp/src/components/reactaria_components/StatusPill.tsx` →
  `react-aria-evaluation/status-pill/StatusPill.tsx`
- Move: `ClientApp/src/components/reactaria_components/PageHeader.tsx` →
  `react-aria-evaluation/page-header/PageHeader.tsx`
- Modify: `reactAriaEvaluationContract.test.ts`'s second assertion (currently
  keyed to `reactaria_components`)

- [ ] **Step 1: Move each file into its own named folder**

```bash
mkdir -p ClientApp/src/components/react-aria-evaluation/alert-message ClientApp/src/components/react-aria-evaluation/status-pill ClientApp/src/components/react-aria-evaluation/page-header
git mv ClientApp/src/components/reactaria_components/AlertMessage.tsx ClientApp/src/components/react-aria-evaluation/alert-message/AlertMessage.tsx
git mv ClientApp/src/components/reactaria_components/StatusPill.tsx ClientApp/src/components/react-aria-evaluation/status-pill/StatusPill.tsx
git mv ClientApp/src/components/reactaria_components/PageHeader.tsx ClientApp/src/components/react-aria-evaluation/page-header/PageHeader.tsx
rmdir ClientApp/src/components/reactaria_components
```

- [ ] **Step 2: Restructure the retained-scaffold assertion for 3 separate
      directories**

The "keeps the retained reactaria_components scaffold import-resolvable" test
(lines 140–158) currently uses a single hardcoded `scaffoldRoot` and one
`collectFiles(scaffoldRoot)` call. Since the 3 files now live in 3 _different_
folders, not one, this is a structural rewrite, not a path substitution. Per the
resolved ambiguity above: paths only, no `stories`/`theme`/icon enforcement — do
not add these three to the full `evaluationDirectories` array. Replace:

```ts
it('keeps the retained reactaria_components scaffold import-resolvable', () => {
  const scaffoldRoot = path.join(componentsRoot, 'reactaria_components');
  const scaffoldSources = collectFiles(scaffoldRoot).filter((file) =>
    /\.tsx?$/u.test(file)
  );

  expect(scaffoldSources.length).toBeGreaterThan(0);

  const unresolved = scaffoldSources.flatMap((file) =>
    findRelativeImports(file)
      .filter((specifier) => !importResolves(file, specifier))
      .map(
        (specifier) => `${path.relative(repositoryRoot, file)} -> ${specifier}`
      )
  );

  expect(unresolved).toEqual([]);
});
```

with:

```ts
it('keeps the retained scaffold prototypes import-resolvable', () => {
  const scaffoldRoots = [
    'react-aria-evaluation/alert-message',
    'react-aria-evaluation/status-pill',
    'react-aria-evaluation/page-header',
  ].map((directory) => path.join(componentsRoot, directory));

  const scaffoldSources = scaffoldRoots
    .flatMap(collectFiles)
    .filter((file) => /\.tsx?$/u.test(file));

  expect(scaffoldSources.length).toBeGreaterThan(0);

  const unresolved = scaffoldSources.flatMap((file) =>
    findRelativeImports(file)
      .filter((specifier) => !importResolves(file, specifier))
      .map(
        (specifier) => `${path.relative(repositoryRoot, file)} -> ${specifier}`
      )
  );

  expect(unresolved).toEqual([]);
});
```

- [ ] **Step 3: Replace the `reactaria_components/**` glob in all 3
      coverage-exclusion files**

`vitest.unit.config.ts` and `sonar-project.properties` both carry
`ClientApp/src/components/reactaria_components/**` as one glob line. Sonar's
Ant-style matcher has no brace alternation (per
`sonarCoverageContract.test.ts`'s own comment), so replace that one line with 3
explicit lines in **both** files:

```text
ClientApp/src/components/react-aria-evaluation/alert-message/AlertMessage.tsx,\
ClientApp/src/components/react-aria-evaluation/status-pill/StatusPill.tsx,\
ClientApp/src/components/react-aria-evaluation/page-header/PageHeader.tsx,\
```

(drop the trailing `,\` on the last line in `sonar-project.properties` if it is
the final entry — match the file's existing terminator convention). In
`tests/unit/config/coverageRemapPolicy.test.ts`, `allowedExclusionCategories`
(line 111) has `/\/components\/reactaria_components\/\*\*$/u`. Add a new array
matching the `verifiedInStorybook`/`evaluationSpikeNotCovered` pattern already
used in that file, and reference it the same way:

```ts
const retainedScaffoldPrototypes = [
  'ClientApp/src/components/react-aria-evaluation/alert-message/AlertMessage.tsx',
  'ClientApp/src/components/react-aria-evaluation/status-pill/StatusPill.tsx',
  'ClientApp/src/components/react-aria-evaluation/page-header/PageHeader.tsx',
];
```

then replace the `reactaria_components` regex line in
`allowedExclusionCategories` with:

```ts
new RegExp(
  `^(${retainedScaffoldPrototypes.map(escapeForRegExp).join("|")})$`,
  "u",
),
```

- [ ] **Step 4: Verify, including coverage**

Run: `npm run type-check && npm run test:unit && npm run test:unit:coverage`
Expected: zero errors, zero failures, coverage still at threshold. Specifically
confirm the rewritten scaffold-resolvability test still runs (not silently
skipped) and still reports 3 source files across the 3 new directories.

- [ ] **Step 5: Confirm commit scope, then commit**

Run: `git status --short` and confirm only the 3 new scaffold folders, the
now-empty `reactaria_components/`, the contract-test rewrite, and the 3
coverage-exclusion files are listed.

```bash
git add ClientApp/src/components/react-aria-evaluation/alert-message ClientApp/src/components/react-aria-evaluation/status-pill ClientApp/src/components/react-aria-evaluation/page-header ClientApp/src/components/reactaria_components tests/unit/storybook/reactAriaEvaluationContract.test.ts vitest.unit.config.ts sonar-project.properties tests/unit/config/coverageRemapPolicy.test.ts
git commit -m "refactor: move retained-scaffold prototypes into react-aria-evaluation/"
```

### Task 5: Contract-test finalisation

#### Files

- Modify: `tests/unit/storybook/reactAriaEvaluationContract.test.ts` (final
  `evaluationDirectories` array, full path audit)

- [ ] **Step 1: Full contract re-run**

Run: `npm run test:ci` Expected: full CI gate passes — type-check, all tests
with coverage, regression suite.

- [ ] **Step 2: Storybook E2E confirmation**

Run: `npm run test:e2e:storybook` Expected: passes; manually confirm the
"Evaluation/React Aria/*" sidebar still lists all 48 stories, since no `title:`
string changed in any task above.

- [ ] **Step 3: Confirm no stray coverage-exclusion path survived**

Run:

```bash
grep -rn "AriaComponents\|Buttons/AriaButton\|forms/AriaForm\|reactaria_components" vitest.unit.config.ts sonar-project.properties tests/unit/config/coverageRemapPolicy.test.ts
```

(or the tokensave-preferred equivalent). Expected: no output — every old path in
all 3 coverage-exclusion files was replaced across Tasks 1–4. Any hit here is a
live gap: it means a moved file is now double-counted as both present at its new
path (uncovered, counted) and still excluded at its old, nonexistent path (a
no-op line), or — worse — genuinely still excluded at a path nothing occupies
while its new-path twin sits uncovered.

- [ ] **Step 4: Commit (if Step 1–3 required any final corrections)**

```bash
git add tests/unit/storybook/reactAriaEvaluationContract.test.ts vitest.unit.config.ts sonar-project.properties tests/unit/config/coverageRemapPolicy.test.ts
git commit -m "test: finalise React Aria evaluation contract paths post-reorg"
```

- [ ] **Step 5: Hand off documentation drift**

`docs/ARCHITECTURE.md`, `docs/STORYBOOK-MIGRATION-READINESS.md`, and
`.agent-sync/ROUTING.md` reference `AriaComponents`/`reactaria_components` in
prose (confirmed via direct grep). None of these gate a build, so they are out
of this plan's Task 1–5 scope, but per this repo's own `using-a-team` routing
table ("Docs or codemaps drift after a feature lands → `doc-updater` agent"),
dispatch `doc-updater` after Task 5 lands rather than leaving them stale
indefinitely.

## Safety, Rollback, and Verification

- Risk: Task 2 (hub composites) is the highest-risk single step —
  `Form.tsx`/`Button.tsx` have the highest fan-in in scope. Do not parallelise
  Task 2 with Task 3.
- Risk: no external (outside-this-repository) consumer can be ruled out from
  repo evidence alone; this plan only verifies in-repo references, consistent
  with the spec's stated limitation.
- Risk (closed by Task 0): pre-existing, unrelated uncommitted edits inside
  `AriaComponents/` (6 files, confirmed via `git status --short`) would
  otherwise be swept into a "refactor: move" commit via `git add <dir>`. Task 0
  isolates and commits them separately before Task 1 begins, and every
  subsequent task's commit step opens with a `git status --short` scope check.
- Risk (closed by Tasks 1 & 4): two contract-test assertions hardcode paths this
  reorg changes and are easy to miss because the spec's import search covered
  _consumers_ of moved files, not the test's own literal path references. Both
  are now explicit plan steps with exact replacement code: the dead-entry-point
  check (Task 1, Step 4) and the scaffold-resolvability test's directory
  structure (Task 4, Step 2).
- Risk (closed by the Coverage-Exclusion Path Map and every task's new coverage
  step): `vitest.unit.config.ts`, `sonar-project.properties`, and
  `tests/unit/config/coverageRemapPolicy.test.ts` each independently hardcode
  the same ~25 paths under a 100% coverage threshold. Left unaddressed,
  `npm run test:unit`/`type-check` would pass on every task while
  `npm run test:ci` (Task 5) failed at the very end against files moved 4 tasks
  earlier. Each task now updates its own slice of all 3 files and runs
  `npm run test:unit:coverage` as part of its checkpoint, so the failure — if
  any path is missed — surfaces in the same task that caused it, not in Task 5.
- Risk (documented, not blocking): this repository's own path is unusually deep
  (`...\source-map-capture\portal.measurement.gov.au\...`, duplicated). The
  longest post-move path (e.g.
  `react-aria-evaluation/date-time/AriaDateRangePicker/DateRangePicker.stories.tsx`)
  lands near 217 characters absolute on this Windows environment — under the
  classic 260 `MAX_PATH` but close enough to be worth a pre-flight check: run
  `git config --get core.longpaths` before Task 1; if unset,
  `git config core.longpaths true` for this repo before any `git mv`.
- Risk (documented, not blocking): `Breadcrumb/` and `Inputs/` are shared parent
  directories with out-of-scope siblings that stay in place — see Task 3 Step
  2's note. Confirmed no accidental cross-import.
- TDD fit: this is a behavior-preserving refactor (no new observable behavior;
  component output, props, and Storybook titles are unchanged). Per
  `test-driven-development`'s own scope, a refactor is protected by "existing or
  characterization tests," not new RED/GREEN cycles — here,
  `reactAriaEvaluationContract.test.ts`'s import-resolution and story-count
  assertions are exactly that pre-existing characterization coverage, exercised
  as the checkpoint after every task.
- Verification: the contract test is the safety net for every task — a missed
  import fails `npm run test:unit` immediately and names the file. Do not weaken
  or skip it to make a task "pass."
- Rollback: each task is its own commit (`git revert <sha>` cleanly undoes one
  task without affecting the others, since tasks touch disjoint file sets except
  the shared contract-test file, which is edited incrementally per task, and
  since Task 0 already removed unrelated diffs from the move commits).

## Final Validation

- Requirement coverage: PASS
- Exact paths: PASS
- Tests before implementation: N/A — this is a pure refactor plan (file moves),
  not new behavior; verification is via existing contract/type-check/test suites
  at each step, per spec's carve-out for behavior-preserving refactors
- Exact commands and expected outputs: PASS
- No placeholders or undefined references: PASS
- Safety and rollback covered where needed: PASS — including commit-scope
  isolation (Task 0) and the two contract-test hardcoded-path updates (Tasks 1
  & 4) surfaced by an adversarial review that re-read the actual test source
  rather than trusting the spec's summary
- Adversarial review, round 1: scored 61/100 (10-category devil's-advocate
  rubric) for missing pre-existing-diff isolation, the scaffold-test
  restructure, and the dead-entry-point re-point. All three closed; round 1
  re-score: 97/100.
- Adversarial review, round 2 (7-scenario red-team, evidence-checked against the
  live repo, not hypothesized): found one severe, previously-unaddressed gap —
  `vitest.unit.config.ts`, `sonar-project.properties`, and
  `tests/unit/config/coverageRemapPolicy.test.ts` each independently hardcode
  ~25 of the exact paths this plan moves under a 100% coverage threshold, and
  none of the 5 tasks touched them, so `npm run test:ci` would have failed at
  Task 5 against moves committed as far back as Task 1. Closed via the new
  Coverage-Exclusion Path Map plus a coverage-update step and
  `test:unit:coverage` checkpoint in every task, and a final stray-path grep in
  Task 5. Six lighter findings also closed or documented:
  shared-parent-directory note (Task 3), Windows long-path pre-flight check, and
  a `doc-updater` handoff for prose-only drift (all in Safety/Rollback and Task
  5). One finding (Sonar quality-gate rules beyond the exclusions list) stayed
  unverified — low incremental risk, same file already touched by the fix above.
- Score: 99/100
- Critical failures: None

## Execution Handoff

- Plan path: `docs/plans/2026-09-22-react-aria-component-reorg-plan.md`
- Blocking unknowns: none (Group 4 ambiguity resolved above — move only, no new
  contract coverage; Task 0 resolves the pre-existing-diff isolation gap)
- Supported execution mode: sequential, task-by-task, with a commit and full
  verification checkpoint after each task. `subagent-driven-development` is not
  recommended here despite Task 3's internal parallelism, because every task
  shares one file (`reactAriaEvaluationContract.test.ts`) as an edit target —
  concurrent agents would collide on it.
