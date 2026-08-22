# Command Canon

## Purpose

This repository has a working Node toolchain at the workspace root. Agent files
should use these commands when they need validation, tests, or Storybook work.

## Package Manager

Use `npm`. Do not assume `pnpm` for this repository.

## Primary Commands

| Purpose | Command |
| --- | --- |
| Install dependencies | `npm install` |
| Type check | `npm run type-check` |
| Lint editable app code | `npm run lint` |
| Unit tests | `npm run test:unit` |
| CI-style unit validation | `npm run test:ci` |
| Unit tests with coverage | `npm run test:unit:coverage` |
| Storybook dev server | `npm run storybook` |
| Storybook static build | `npm run build-storybook` |
| App production build | `npm run build` |
| E2E tests | `npm run test:e2e` |
| BDD tests | `npm run test:bdd` |

## Snapshot Boundaries

Even though the repo is tool-enabled, agents must still respect source boundaries.

Editable:

- `static/js/**/*.ts`
- `static/js/**/*.tsx`
- `static/css/styles/**/*.scss`
- `tests/**/*.ts`
- `tests/**/*.tsx`
- `docs/**/*.md`
- `.github/**/*.md`

Do not edit generated or vendor content:

- `static/js/main.*.js`
- `static/css/main.*.css`
- `static/source-map-http-downloads/**`
- `static/js/external/**`
- `static/webpack/**`
- `storybook-static/**`
- `coverage/**`
- `reports/**`

## Repo-Specific App Rules

- Runtime config must come from `static/js/env.ts`, not `process.env`.
- Protected route composition must preserve `AuthenticatedElement`.
- Validation schemas that use custom Yup string methods must import
  `validationSchemas/yupExtensions`.
- Storybook should prefer source styles over generated `main.*.css` bundles.
