# MSW mockServiceWorker.js — Migration Checklist

## Problem

`mockServiceWorker.js` is **absent from this workspace snapshot**. It is a
browser-side service-worker script that MSW (`msw` v2) registers to intercept
fetch/XHR calls in the browser. It must be present in the `/public` directory
of the production build and the Storybook static output.

## Why it is absent here

This repository is a source-map capture of the deployed portal. The `public/`
directory is not included in source-map exports. The file exists in the running
application but was not captured.

## Action required in the migration target

After scaffolding the new repository, run once:

```bash
npx msw init public/ --save
```

This command:
1. Copies the correct version of `mockServiceWorker.js` into `public/`
2. Adds `"msw": { "workerDirectory": ["public"] }` to `package.json`

The file must be committed to source control so it is included in production
builds and Storybook static builds.

## Verification

After running `npx msw init public/`, verify:

```bash
ls public/mockServiceWorker.js
```

Then run the Storybook BDD suite:

```bash
npx bddgen -c playwright.storybook.config.ts
npm run test:e2e:storybook
```

All 129 Storybook BDD scenarios must pass with no MSW worker registration
errors in the browser console.

For the Vitest-based Storybook play-function suite, also run:

```bash
npm run test:storybook
```

Current source result: 87 files / 218 tests with clean command output.
`vitest.storybook.setup.ts` provides jsdom-only browser API shims; do not remove
those shims while migrating MSW or Storybook configuration.

For the combined migration gate, also run:

```bash
npm run migration-check
```

As of CRD-032 (2026-06-02), this combined gate is clean in the source snapshot.
The earlier CRD-030 failure was classified as Vitest/Storybook validation debt,
not TypeScript compiler debt, and is now resolved. `npm run migration-check`
passes end-to-end with TypeScript, the default Vitest run, and the Storybook
static build.

For the current source-snapshot validation baseline, also record:

```bash
npm run type-check
npm run lint
npm run test:unit
npm run test:e2e
```

Current CRD-041 source result: `type-check` and `lint` pass with zero
diagnostics, `test:unit` passes 114 files / 1,169 tests, and
`test:storybook` passes 87 files / 218 tests. The BDD source contains 28
application and 129 Storybook scenarios.

Transport retry and behavior-lock TODO completion (CRD-031) does not change this
MSW checklist scope; this document remains focused on worker generation and
Storybook/BDD runtime wiring in the migration target.

## MSW version constraint

The current codebase uses MSW v2 (confirmed by `.storybook/msw-handlers.ts`
using `http.get()` / `HttpResponse` API). When regenerating in the target:

- Run `npm install msw@latest` (v2.x)
- Run `npx msw init public/ --save`
- Do **not** use `setupWorker()` from MSW v1 (`rest.*` API) — it is incompatible

## Files involved

| File | Status |
|---|---|
| `public/mockServiceWorker.js` | Absent — must be generated in target via `npx msw init public/` |
| `.storybook/msw-handlers.ts` | Present — uses MSW v2 `http.*` / `HttpResponse` API |
| `package.json` | Must contain `"msw": { "workerDirectory": ["public"] }` after init |
