# React Aria component reorganisation — design

**Status:** Approved
**Date:** 2026-09-22

## Context

`ClientApp/src/components` contains a formally recognised, CI-enforced "React
Aria evaluation surface": 23 directories enumerated in
`tests/unit/storybook/reactAriaEvaluationContract.test.ts`
(`AriaComponents`, `Breadcrumb/AriaBreadcrumb`, `Buttons/AriaButton`,
`Calendar`, `ColorArea`, `ColorField`, `ColorPicker`, `ColorSlider`,
`ColorSwatch`, `ColorThumb`, `ColorWheel`, `ComboBox`, `CommandPalette`,
`Dialog`, `Disclosure`, `DisclosureGroup`, `DropZone`, `GridLists`,
`Inputs/AriaCheckbox`, `Inputs/AriaDateField`, `Inputs/AriaDatePicker`,
`Inputs/AriaDateRangePicker`, `Inputs/AriaInputGroup`, `forms/AriaForm`).
That contract enforces 48 Storybook stories titled `Evaluation/React Aria/*`,
NMI icons only (no `lucide-react`), a `.react-aria-evaluation`-scoped
`theme.css` with no bare `:root`, and full `tsc` coverage with no
demo-only carve-outs.

A separate folder, `reactaria_components/` (`AlertMessage.tsx`,
`PageHeader.tsx`, `StatusPill.tsx`), is explicitly called out by the same
test as a "retained scaffold" — outside the 23-directory contract, with no
stories and no dedicated tests.

Storybook's navigation hierarchy is driven entirely by each story's explicit
`title:` string (confirmed via `.storybook/main.ts`, which has no
`storySort` or title-template logic, and via grep of all `title:` literals
in the tree) — it is **not** derived from file location. This means the
whole reorganisation below changes zero Storybook titles and has zero
Storybook-navigation risk.

Full repo-wide import search (`ClientApp/src` and `tests/**`, including the
`@/*` tsconfig alias, webpack aliases, and dynamic/lazy imports — none of
which exist in this app) found **no consumer of any in-scope file outside
the evaluation surface itself**. The surface is self-referential: two hub
files, `forms/AriaForm/Form.tsx` and `Buttons/AriaButton/Button.tsx`, are
imported by most of the rest of the surface; nothing reaches out to
`routes/**` or to any production component.

### Duplicate-name investigation (resolves prior open question)

`reactaria_components/StatusPill.tsx` and `AlertMessage.tsx` share names
with `Pill/StatusPill.tsx` and the `AlertMessage` exported from
`Alert/index.tsx`. Direct comparison of all four files found **they are not
copies**:

- `Pill/StatusPill.tsx` is a `react-bootstrap` `Badge` wrapper encoding a
  full business-rules switch over `DashboardItemStatus` / `QuoteStatus` /
  `PaDashboardItemStatus` / `ReportStatus`. `reactaria_components/StatusPill.tsx`
  is a bare presentational `<span>` with a generic `tone` prop and zero
  status-mapping logic.
- `Alert/index.tsx`'s `AlertMessage` is a stateful `react-bootstrap` `Alert`
  wrapper with dismiss/`show` state and a documented public variant API
  (`AlertSuccess`/`AlertInfo`/`AlertWarning`/`AlertError`).
  `reactaria_components/AlertMessage.tsx` is a stateless React Aria
  (`Heading`/`Text`) wrapper with a different prop contract and no dismiss
  behaviour.
- `reactaria_components/PageHeader.tsx` (an in-page title/eyebrow/actions
  block) is not a duplicate of `Header/*` at all — `Header/*` is site
  navigation chrome (navbar, brand, auth state). No conflict.

Given the project's long-term goal — eventually replacing `react-bootstrap`
with `react-aria-components` wherever there is functional impact — these
two files read as **early, incomplete prototypes toward that future
replacement**, not orphaned duplicates. They are retained and folded into
the evaluation surface rather than deleted.

## Target structure

```
ClientApp/src/components/
  react-aria-evaluation/
    primitives/          # current AriaComponents/*.tsx, *.ts, *.css (31 files + theme/styles/utilities.css)
    button/AriaButton/
    form/AriaForm/
    breadcrumb/AriaBreadcrumb/
    checkbox/AriaCheckbox/
    input-group/AriaInputGroup/
    date-time/
      AriaDateField/
      AriaDatePicker/
      AriaDateRangePicker/
      Calendar/
    color/
      ColorArea/ ColorField/ ColorPicker/ ColorSlider/
      ColorSwatch/ ColorThumb/ ColorWheel/
    combobox/
    command-palette/
    dialog/
    disclosure/           # Disclosure.tsx, DisclosureGroup.tsx
    dropzone/
    grid-list/
    alert-message/        # was reactaria_components/AlertMessage.tsx
    status-pill/          # was reactaria_components/StatusPill.tsx
    page-header/          # was reactaria_components/PageHeader.tsx
```

`reactaria_components/` is removed once its three files move; no file is
deleted.

## Migration groups (each is its own reviewable change, in order)

1. **Primitives** — move `AriaComponents/*` → `react-aria-evaluation/primitives/*`.
   Update the contract test's `evaluationDirectories[0]` entry and its
   `theme.css` literal path; update `tests/unit/components/AriaComponents.test.tsx`'s
   ~31 import lines; update every downstream file's relative import depth
   to `Content`/`NmiIcon`/`ProgressCircle`/`ToastQueue`/`Separator`/etc.
   Checkpoint: `npm run type-check`, `npm run test:unit`.

2. **Hub composites** — move `Buttons/AriaButton` and `forms/AriaForm` (the
   two highest-fan-in files: `Form.tsx` is imported by ~13 other in-scope
   files, `Button.tsx` by ~10). Update every consumer import.
   Checkpoint: `npm run type-check`, `npm run test:unit`.

3. **Remaining composite folders** — `Breadcrumb/AriaBreadcrumb`, `Calendar`,
   the seven `Color*` folders, `ComboBox`, `CommandPalette`, `Dialog`,
   `Disclosure`, `DisclosureGroup`, `DropZone`, `GridLists`,
   `Inputs/AriaCheckbox`, `Inputs/AriaDateField`, `Inputs/AriaDatePicker`,
   `Inputs/AriaDateRangePicker`, `Inputs/AriaInputGroup`. No
   cross-dependencies exist among these beyond the two hubs already moved,
   so they can move in parallel batches.
   Checkpoint: `npm run type-check`, `npm run test:unit`, `npm run build-storybook`.

4. **Retained-scaffold prototypes** — move `reactaria_components/AlertMessage.tsx`,
   `StatusPill.tsx`, `PageHeader.tsx` into `react-aria-evaluation/` as
   individually named folders (`alert-message/`, `status-pill/`,
   `page-header/`), per the duplicate-name investigation above. Update the
   contract test's second assertion (currently keyed to the
   `reactaria_components` path) to point at the new locations, or fold it
   into the same `evaluationDirectories`-style check if it now qualifies
   for full inclusion (story/theme/icon rules) — a decision for the
   implementation plan, since these three have no stories today and adding
   them is out of scope for a pure reorg.
   Checkpoint: `npm run type-check`, `npm run test:unit`.

5. **Contract-test finalisation** — full `evaluationDirectories` array
   updated to final paths; re-run the 48-story-count assertion; re-run the
   theme-scoping assertion.
   Checkpoint: `npm run test:ci`, `npm run test:e2e:storybook`, manual
   confirmation that Storybook's "Evaluation/React Aria/*" sidebar entry
   still lists all 48 stories, unchanged, since no `title:` string changes.

## Explicitly out of scope for this reorg

- Adding Storybook stories or tests for the three former
  `reactaria_components` files, or for any other currently-untested
  composite folder.
- Any change to `title:` strings — none are required.
- Deleting any file.
- Replacing any `react-bootstrap` usage with `react-aria-components` — that
  is the long-term goal this reorg supports, not part of it.
- Subgrouping within `color/` beyond the flat per-component folders shown
  above (no evidence favours a finer split; can be revisited later).

## Risks

- `forms/AriaForm/Form.tsx` and `Buttons/AriaButton/Button.tsx` are the
  highest-fan-in files in scope — Group 2 is the highest-risk single step
  and should not be parallelised with Group 3.
- The contract test is the safety net for the whole migration: if any
  import is missed, `npm run test:unit` fails immediately and names the
  file. Do not weaken or skip that test to make a group "pass."
- No external (outside-this-repository) consumer of any of these paths can
  be ruled out from repository evidence alone; this reorg only verifies
  in-repo references.
