# Storybook bundle-size remediation plan

## Objective

Reduce the JavaScript parse/execute cost reported by the production Storybook build without increasing `chunkSizeWarningLimit`, while preserving all existing route paths, authentication wrappers, and Type Approval messaging behaviour.

## Evidence, assumptions, and constraints

- Source request: split eager route modules, replace the single Vite `vendor` bucket with Rolldown `output.codeSplitting.groups`, use modular Lodash entry points, and defer Slate-based messaging code.
- User-provided baseline: `vendor` 672.97 kB and `main` 1,810.46 kB uncompressed. A fresh local `npm run build-storybook` measurement is required before these numbers are treated as independently reproduced.
- Existing behavioural baseline on 2026-10-19: `npm run test:unit -- tests/unit/config/viteConfig.test.ts tests/unit/routes/ta/appDetails.test.tsx tests/unit/routes/ta/appMessages.test.tsx` passed 69 tests.
- The worktree contains pre-existing uncommitted work. In particular, `vite.config.mts` is untracked and `tests/unit/config/viteConfig.test.ts` is modified. Changes must be narrow and must not overwrite unrelated content.
- Keep `chunkSizeWarningLimit` unchanged. Do not edit generated `storybook-static/**` output.
- Preserve all route paths and each route's existing `AuthenticatedElement`, `Layout`, `PreConditions`, and `displayHeaderAndFooter` semantics.

## Requirement traceability

| Requirement | Implementation | Verification |
| --- | --- | --- |
| Route-level lazy loading | Convert route component imports in `ClientApp/src/App.tsx` to React Router `lazy` route functions | New route contract test, type-check, app build, Storybook build |
| Vendor-group splitting | Replace `manualChunks` in `vite.config.mts` with named Rolldown `codeSplitting.groups` | Update and run `tests/unit/config/viteConfig.test.ts`; inspect emitted chunks |
| Modular Lodash entry points | Replace root named imports in `ClientApp/src/**` with `lodash/<method>` defaults | Literal search has zero root imports; type-check, unit suite, builds |
| Defer heavy feature code | Dynamically import the Type Approval Messages tab and `SlateEditor` | Existing Type Approval unit tests, emitted chunk inspection |
| Do not hide warnings | Leave warning budget unchanged | Diff inspection and Storybook config test |

## Tasks

### 1. Add failing configuration and route-splitting contracts

- Modify `tests/unit/config/viteConfig.test.ts` to require the five named Rolldown groups (`react-runtime`, `auth`, `forms`, `ui`, and `utilities`) and to reject `manualChunks`.
- Add `tests/unit/config/appRoutes.test.ts` to require each formerly eager feature route to expose a React Router `lazy` function while preserving the complete route-path set.
- Run both focused tests before implementation. Expected: failures because `manualChunks` and eager route elements still exist.

### 2. Split routes and vendor groups

- Modify `ClientApp/src/App.tsx` to replace static feature-route imports with dynamic imports returned through React Router route `lazy` functions.
- Keep shared shell/error components eager and preserve route wrappers and the `name=''` prop on the request-summary route.
- Modify only the `build.rolldownOptions.output` chunk strategy in `vite.config.mts`; preserve all pre-existing configuration work.
- Run the focused contracts and `npm run type-check`.

### 3. Convert Lodash imports mechanically

- Modify all `ClientApp/src/**` files currently importing named members from the root `lodash` package so each member uses its own `lodash/<method>` default import.
- Do not refactor call sites.
- Verify with an exact source search and run type-check plus the relevant unit suite.

### 4. Defer the Type Approval editor path

- Modify `ClientApp/src/routes/ta/manage/appDetails.tsx` to dynamically load `appMessages` only when its tab is mounted, with an explicit loading fallback.
- Modify `ClientApp/src/routes/ta/manage/appMessages.tsx` so `SlateEditor` and its serializer are reached only through dynamic imports; retain type-only imports for editor value types.
- Run `tests/unit/routes/ta/appDetails.test.tsx`, `tests/unit/routes/ta/appDetails.summary.test.tsx`, `tests/unit/routes/ta/appMessages.test.tsx`, and focused Storybook tests for the affected stories if available.

### 5. Rebuild, compare, and review

- Run `npm run type-check`, focused unit tests, `npm run lint`, `npm run build`, and `npm run build-storybook` after the last source change.
- Compare emitted uncompressed and gzip JavaScript sizes to the fresh baseline. A pass requires that the former monolithic `main`/`vendor` chunks are replaced or materially reduced and that no warning threshold was raised.
- Inspect the final diff for route-path/wrapper parity, accidental policy changes, unrelated edits, and generated artifacts.
- Obtain independent code and TypeScript reviews. Treat reviewer findings as evidence to assess, not as automatic proof.

## Rollback

All changes are source/configuration-only and reversible per file. If route behaviour or builds regress, revert only the task-authored hunks in `App.tsx`, the two Type Approval files, the Vite config/test hunks, the new route test, and the modular Lodash import lines; do not reset the worktree or discard pre-existing changes.

## Plan quality self-review

The plan covers every requested reduction lever, uses existing repository commands, establishes RED/GREEN evidence, preserves dirty-worktree ownership, and defines measurable completion. The installed plan skill's referenced template and 100-point reviewer prompt were absent, so their exact rubric could not be executed; this plan applies the skill's documented contract directly.
