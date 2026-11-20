# Sonar max-lines Remediation Plan

**Goal:** Bring four files under the Sonar file-size limit (target at most 450
non-comment lines of code each) without changing any behaviour.

**Architecture:** Pure extraction. Move cohesive logic into sibling modules and
hooks next to its only consumer; share the byte-identical dashboard helpers
through one module used by both dashboards. No public prop, route, story name or
story id changes.

**Tech Stack:** React 18, TypeScript (strict, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax`), React Router v7, MSAL, Vitest, Storybook.

## Source Inputs

Sonar findings (non-comment lines of code):

| File                                                            | NCLOC | Target          |
| --------------------------------------------------------------- | ----- | --------------- |
| `ClientApp/src/components/modals/BranchSelectorModal/index.tsx` | 625   | <= 450          |
| `ClientApp/src/components/modals/Modals.stories.tsx`            | 648   | <= 450 per file |
| `ClientApp/src/routes/dashboard/dashboard-ta.tsx`               | 718   | <= 450          |
| `ClientApp/src/routes/dashboard/index.tsx`                      | 812   | <= 450          |

## Global Constraints

- Behaviour-preserving refactor. No change to rendered output, network calls,
  notifications, storage keys, analytics events, ARIA, or story names/ids.
- Do not edit generated or vendor files (NSwag client,
  `ClientApp/src/external/**`).
- Follow `CLAUDE.md`: use `env` not `process.env`; keep `<AuthenticatedElement>`
  and `<UnsavedFormPrompt>` usage as is; explicit `undefined` handling under
  `exactOptionalPropertyTypes`; no `useEffect` plus `setState` to derive state.
- No new dependencies. No new abstraction with a single caller unless it is the
  extraction target named in the task.
- Measure NCLOC for each touched file at the end of the task (blank lines and
  comment-only lines excluded; a throwaway script in the scratchpad is fine, do
  not commit it). Every resulting file must be at most 450.
- Validation after every task (all must pass, record command and output):
  `npm run type-check`, `npm run lint`, and the targeted tests named in the task
  (use `--configLoader runner --reporter=default`; see `CLAUDE.md`).
- English-only authored text. Conventional commit per task, `refactor:` type.

## File Map

- Task 1 touches only `ClientApp/src/components/modals/BranchSelectorModal/`.
- Task 2 touches only `ClientApp/src/components/modals/*.stories.tsx` and a new
  helper module beside them.
- Task 3 creates `ClientApp/src/routes/dashboard/dashboardShared.tsx` and edits
  `dashboard-ta.tsx`.
- Task 4 edits `ClientApp/src/routes/dashboard/index.tsx` to use the Task 3
  module. Task 4 depends on Task 3.

### Task 1: Split BranchSelectorModal below 450 NCLOC

Files: `ClientApp/src/components/modals/BranchSelectorModal/index.tsx` (625
NCLOC; `BranchSelectorModal` component spans lines 175-670).

Already separate small helpers in the same file: `showBranchModalMessage`,
`setNotification`, `SavingBranchSelectorError`, `BranchSelectorButtons`,
`hasDefaultOrganisationId`, `toSortableText`, `applyAccountDispatchUpdates`,
`finaliseAccountCreation`.

Steps:

1. Read the component and its existing tests/stories (`Modals.stories.tsx`, any
   `*.test.tsx` under the folder) to learn the behaviour that must stay
   identical.
2. Move the non-component helpers and small components listed above into sibling
   files in the same folder (for example `branchSelectorHelpers.tsx` for the
   notification and account helpers, `SavingBranchSelectorError.tsx` and
   `BranchSelectorButtons.tsx` for the components). `index.tsx` keeps the
   default export and re-exports nothing new.
3. Extract the selection/sort state and handlers from the component body into
   one hook (for example `useBranchSelection`) and the save/finalise flow into a
   second hook if needed to reach the target. Hooks stay in this folder.
4. Do not change the public exports of `index.tsx` or `enums.ts`.

Acceptance: `index.tsx` is at most 450 NCLOC and so is every new file; story
tests for the modals pass; type-check and lint pass.

Run: `npm run test:storybook` filtered to the Modals stories, and any unit tests
under `ClientApp/src/components/modals`.

### Task 2: Split Modals.stories.tsx below 450 NCLOC per file

Files: `ClientApp/src/components/modals/Modals.stories.tsx` (648 NCLOC).

Contents by line range: shared mock data and fetch helpers (16-157:
`mockBranches`, `findVisibleDialog`, `findBranchRadios`, `RecordedRequest`,
`ModalObservations`, `emptyObservations`, `observed`, `jsonResponse`,
`resolveFetchUrl`, `createBranchSelectorFetch`), hosts and demos (161-268),
ConfirmationModal stories (270-366), BranchSelectorModal stories (368-617),
RFQDeleteModal stories (619-732).

Steps:

1. Move the shared helpers and mock data into
   `ClientApp/src/storybook/modalsStoryHelpers.tsx` (not a `.stories` file, so
   Storybook does not index it).
2. Split into `ConfirmationModal.stories.tsx`, `BranchSelectorModal.stories.tsx`
   and `RFQDeleteModal.stories.tsx`, each with its own `meta` that preserves the
   original `title` hierarchy so story ids stay stable (check the existing
   `meta` and any references to these ids in tests, BDD features or the coverage
   manifest and update them only if an id must change; prefer not).
3. Keep every `play` function body unchanged.

Acceptance: all original stories still exist with the same ids (or any id change
is listed in the report with the references updated); each file at most 450
NCLOC; `npm run test:storybook` passes for the three files; type-check and lint
pass.

### Task 3: Extract shared dashboard module and shrink dashboard-ta.tsx

Files: create `ClientApp/src/routes/dashboard/dashboardShared.tsx`; edit
`ClientApp/src/routes/dashboard/dashboard-ta.tsx` (718 NCLOC; component
`DashboardTA` spans lines 179-781).

Byte-identical today in both `dashboard-ta.tsx` and `index.tsx`:
`DEFAULT_DASHBOARD_PAGESIZE`, `showDashboardMessage`, `setNotification`,
`setInfoNotification`, `handlePaginationScroll`. Do NOT merge
`fetchRequestsByTab`/`FetchRequestsParams`: they use different NSwag client
types (`PatternApprovalClient` vs `DashboardClient`).

Steps:

1. Create `dashboardShared.tsx` exporting the five identical items above (check
   `ClientApp/src/routes/common/constants` first; if
   `DEFAULT_DASHBOARD_PAGESIZE` fits there, put it there instead).
2. In `dashboard-ta.tsx`, import them from the shared module and delete the
   local copies. Do not touch `index.tsx` in this task.
3. Move the TA-only pure helpers (`fetchRequestsByTab`, `FetchRequestsParams`,
   `resolveFilterParams`, `classifyLoadError`) to `dashboard-ta.helpers.ts(x)`
   beside the component.
4. If still above 450, extract the profile-save logic (`saveUserProfile` and the
   debounced tab-save effect, lines 220-310) into a hook `useDashboardTaProfile`
   in the same folder.

Acceptance: `dashboard-ta.tsx` at most 450 NCLOC; new files at most 450;
existing dashboard unit/story tests pass; type-check and lint pass.

Run: unit tests under `ClientApp/src/routes/dashboard` and the dashboard
stories.

### Task 4: Use shared module and shrink dashboard/index.tsx

Depends on Task 3 (`dashboardShared.tsx` exists).

Files: `ClientApp/src/routes/dashboard/index.tsx` (812 NCLOC; component
`Dashboard` spans lines 273-882, helpers above it at lines 63-271).

Steps:

1. Replace the local copies of the five shared items with imports from
   `dashboardShared.tsx`. `handleNotificationScroll` and
   `DEFAULT_SEARCH_PLACEHOLDER` stay local (or move with the other helpers).
2. Move the remaining pure helpers (`fetchRequestsByTab`, `FetchRequestsParams`,
   `checkAcceptedQuoteStatus`, `handleDashboardLoadError`,
   `applyErrorNotifications`) to `dashboard.helpers.ts(x)` beside the component.
3. If still above 450, extract the data-loading effect (lines ~468-547) and the
   profile/filter initialisation (lines ~293-435) into hooks in the same folder
   (for example `useDashboardRequests`, `useDashboardFilters`). Keep effect
   dependency arrays and abort/cleanup behaviour exactly as they are.

Acceptance: `index.tsx` at most 450 NCLOC; new files at most 450; existing
dashboard unit/story tests pass; type-check and lint pass; no remaining
duplicate of the five shared items across the two dashboards (`grep` shows
definitions only in `dashboardShared.tsx`).

Run: unit tests under `ClientApp/src/routes/dashboard` and the dashboard
stories.
