# Storybook and Production Runtime Alignment

## Summary

The NMI Portal uses Vite 8 for the production application, local development,
Storybook, and Vitest Browser Mode. The production application is configured by
`vite.config.mts`; Storybook uses the `@storybook/react-vite` adapter.

Using one bundler family removes the former production-versus-Storybook build
gap and keeps module resolution, Sass processing, asset handling, and lazy
loading behavior aligned.

## Canonical pipelines

| Surface | Entry point | Purpose |
| --- | --- | --- |
| Application development | `npm run dev` / `npm start` | Vite dev server |
| Application production | `npm run build` | Vite production bundle |
| Storybook | `npm run storybook` | Component development and documentation |
| Storybook tests | `npm run test:storybook` | Browser-mode story interaction tests |
| Application E2E | `npm run test:e2e:app` | Real application workflows against the Vite server |

## Shared build contract

| Concern | Production application | Storybook and tests |
| --- | --- | --- |
| CSS/SCSS | Vite `css.preprocessorOptions` | Storybook Vite configuration |
| Module aliases | `vite.config.mts` | `.storybook/main.ts` |
| Static assets | Vite asset handling | Vite asset handling |
| Runtime environment | `env.ts` reads injected `window.*` values | Test and Storybook harness stubs the same contract |
| Code splitting | Vite-generated lazy chunks | Storybook exercises the component-level module graph |

## Verification checklist

For changes that affect bundling, assets, or runtime configuration, run:

1. `npm run type-check`
2. `npm run build`
3. `npm run verify:vite-build`
4. `npm run verify:vite-runtime`
5. Relevant Storybook tests and application E2E scenarios

A passing Storybook story is useful component evidence, but it does not replace
the production build and runtime verifiers.

## Runtime behavior not covered by Storybook

1. **MSAL redirects** — Azure B2C navigation and browser storage require a real
   application navigation cycle and are covered by application E2E tests.
2. **API error boundaries** — Storybook uses MSW and provider harnesses; it does
   not reproduce every real 401/403 response or server failure.
3. **Lazy chunk failures** — route-level `React.lazy` loading is exercised by
   the production build and application E2E flow, not by isolated stories.

## Files involved

| File | Role |
| --- | --- |
| `vite.config.mts` | Application development, production, Sass, alias, and runtime plugins |
| `.storybook/main.ts` | Storybook Vite adapter and shared build settings |
| `.storybook/preview.ts` | Global decorators and asset setup |
| `ClientApp/src/storybook/storybookHarness.tsx` | MSAL and application-provider test context |
