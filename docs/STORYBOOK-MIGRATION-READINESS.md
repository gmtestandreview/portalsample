# Storybook Migration Readiness

## Purpose

This document records the Storybook baseline that should exist before the portal
migration starts. The corresponding Storybook pages live under the `Migration`
section and are backed by a regression test so the inventory stays aligned with
the real source tree.

## Scope

The Storybook baseline covers:

- routes
- reusable components
- authentication structure
- validation schemas and Yup extensions
- assets and media

## Storybook Pages

| Storybook page | File |
| --- | --- |
| `Migration/Overview` | `ClientApp/src/storybook/MigrationReadiness.docs.mdx` |
| `Migration/Coverage Matrix` | `ClientApp/src/storybook/CoverageMatrix.docs.mdx` |
| `Migration/Routes` | `ClientApp/src/routes/RouteInventory.docs.mdx` |
| `Migration/Components` | `ClientApp/src/components/ComponentInventory.docs.mdx` |
| `Migration/Authentication` | `ClientApp/src/authentication/Authentication.docs.mdx` |
| `Migration/Validation` | `ClientApp/src/validationSchemas/ValidationSchemas.docs.mdx` |
| `Migration/Assets and Media` | `ClientApp/src/assets/AssetsAndMedia.docs.mdx` |

## Validation

Run these checks after changing Storybook migration inventory content:

```bash
npm run type-check
npm run test:unit -- tests/unit/storybook/coverageDrift.test.ts tests/unit/e2e/routeCoverage.test.ts
npm run test:storybook
npm run build-storybook
```

For Storybook BDD coverage updates, also run:

```bash
npx bddgen -c playwright.storybook.config.ts
npm run test:e2e:storybook
```

## Current Implementation Status

- Shared Storybook harnessing now exists for router, auth/MSAL, account context, modal context, and Formik-backed route steps.
- Shared UI coverage now includes both the high-priority migration families and the optional breadth pass, including `Header`, `Footer`, `Layout`, `Inputs`, `SearchFilter`, `Pagination`, `PaginationHeader`, `Pill`, `SteppedNavigation`, `SummaryDisplay`, `tiles`, `Welcome`, `Actions`, `BlockUISpinner`, visible `Utilities`, `Buttons`, and `Icons`.
- Major route families now have route stories for dashboard, home/get-started, help, auth entry/exit, account, contact, request-for-quote, accept-quote, quotation, measurement-report, success, and error flows.
- Pattern/type approval has isolated stories for the dashboard shell, pre-application, four wizard steps, instrument information panel, and the application details/documents/messages management tabs.
- The narrowed Storybook-complete goal from the coverage matrix is now satisfied, and the remaining work is polish depth rather than missing family-level breadth.
- Current inventory (counted 2026-09-01): **41** registered paths, **48** top-level component directories under `ClientApp/src/components/`, **132** story files, and **13** MDX docs files. The `storybook-static/index.json` build index contains **412** entries: **270** stories and **142** docs. *(Previous revision said 31 families / 87 stories / 315 entries — all stale. The index figure reflects the last static build in the tree, so re-run `npm run build-storybook` before relying on it.)*

- **Not all component directories are live.** An import-reachability walk from `ClientApp/src/index.tsx` and `App.tsx` (following static, dynamic and bare side-effect imports) finds **69 of 344 first-party source files unreachable from the application**. They cluster in `components/AriaComponents/` (36 files) and the React Aria scaffold families: `ColorArea`, `ColorField`, `ColorPicker`, `ColorSlider`, `ColorSwatch`, `ColorThumb`, `ColorWheel`, `Calendar`, `ComboBox`, `CommandPalette`, `Dialog`, `Disclosure`, `DisclosureGroup`, `DropZone`, `GridLists`, `reactaria_components`.

  These inflate both the component count and the coverage denominator. **But unreachable-from-the-app is not the same as deletable** — Storybook stories and tests are excluded from that walk, so some are reachable from stories only. Confirm per-directory before removing anything.

  *Correction: an earlier revision of this bullet named eleven families and asserted `AriaComponents` was unreferenced. That came from a faulty search (the filter excluded the very import lines it was looking for). `AriaComponents` is imported — but only by other unreachable code, so it is unreachable from the application entry points. The figure above is from the reachability walk, not a text search.*
- Storybook BDD now includes breadth and route/form coverage expansion through:
  - `tests/e2e/features/storybook/components/breadth.feature`
  - `tests/e2e/features/storybook/forms/forms-coverage.feature`
  - `tests/e2e/features/storybook/routes/routes-coverage.feature`
- ~~The six pattern/type approval paths are reviewed `app-bdd` exclusions~~ — **superseded 2026-09-01.** Those six paths now carry `app-bdd` coverage. `tests/e2e/route-coverage.ts` holds 41 entries — 25 `app-bdd`, 16 `storybook-bdd`, **0 exclusions**. Storybook remains useful as isolated-state documentation for them, but it is no longer the only evidence.

## Recent Hardening Notes

- Global Storybook routing now uses a data-router decorator (`createMemoryRouter` + `RouterProvider`) in `.storybook/preview.ts`.
- `withPortalProviders` in `ClientApp/src/storybook/storybookHarness.tsx` no longer wraps stories with `MemoryRouter`.
- Story-level `MemoryRouter` wrappers were removed from affected stories to avoid nested-router conflicts.
- Footer modal assertions now use page-level text checks when content is portal-rendered outside `#storybook-root`.

For the next Storybook plus Playwright-BDD execution approach, see `docs/PLAYWRIGHT-STORYBOOK-BDD-IMPROVEMENT-PLAN.md`.

## Notes

- The coverage matrix is the source of truth for what is still missing before the UI can be called Storybook-complete.
- This baseline now includes shared route harnessing and the narrowed Storybook-complete route/state set.
- API-heavy and redirect-heavy flows still benefit from broader MSW state coverage or structural documentation where full browser simulation is not practical.

Current release gate position: `CLOSED_SUCCESS` for the narrowed Storybook migration-readiness baseline in this workspace snapshot. **Scope caveat:** API-heavy flows still require application BDD or reviewed exclusions. In particular, the pattern/type approval stories are component-level evidence and do not prove the full authenticated workflow.

This Storybook-specific result does not clear the repository-wide unit-coverage gate. As of 2026-06-28, `npm run test:unit:coverage` failed the configured 100% thresholds and is tracked separately as Priority 1 `COVERAGE-GATE-001`. **That measurement is stale** — it was taken against 114 unit test files and the suite is now 163. No current figure exists.

> **Storybook readiness is not migration readiness.** Story coverage demonstrates that components
> render in isolation with mocked MSAL, mocked MSW handlers and a canonical mock account. It does not
> exercise real token acquisition, the `PreConditions` redirect matrix, organisation switching, or the
> same-origin API boundary — which is where a migration actually breaks. Treat this document as
> evidence about the component layer only.
