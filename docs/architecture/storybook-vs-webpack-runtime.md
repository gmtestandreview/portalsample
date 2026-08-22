# Storybook vs Production Runtime Gap

## Summary

The NMI Portal Storybook uses the **Vite** dev server (via `@storybook/react-vite`
adapter). The production portal uses **webpack 5** as its bundler
(configured in `ClientApp/webpack/`).

This is not a contradiction — two different build pipelines can coexist — but
it creates a divergence that must be understood before migrating stories or
introducing build-time plugins.

## Why the dual setup exists today

The current split is intentional:

- **webpack 5** remains the production bundler path used by the deployed portal.
- **Vite** is used in Storybook to reduce feedback time for component development.

This lets teams improve component quality and developer speed without changing
production packaging in the source-map snapshot.

## What this means for migration

| Concern | Storybook (Vite) | Production (webpack 5) |
|---|---|---|
| CSS/SCSS processing | Vite native (fast) | `css-loader` + `sass-loader` |
| Module aliases | Vite `resolve.alias` | webpack `resolve.alias` |
| Static assets | Vite asset handling | `file-loader` / `asset/resource` |
| `process.env` | Vite injects `import.meta.env` | webpack `DefinePlugin` |
| Tree shaking | Rollup (Vite) | webpack TerserPlugin |
| HMR | Vite HMR | webpack HMR |

## Divergence checklist (must pass before merge)

For any UI/platform change that passes in Storybook, also confirm production parity for:

1. CSS/SCSS import and ordering behavior
2. Alias and module resolution behavior
3. Asset URL/base-path behavior (especially fonts and media)
4. Route-level lazy loading and chunk fetch behavior
5. Runtime env variable behavior (`window.*` via `env.ts`, never `import.meta.env` in app runtime code)

## Why stories can pass but production can fail

A story rendered in Storybook's Vite environment may:

- Import a CSS module or SCSS partial that Vite resolves differently from webpack
- Rely on `import.meta.env.*` which is undefined in webpack builds
- Use a dynamic `import()` with a path that webpack tree-shakes differently

The 56 font-path failures resolved 2026-05-31 in `.storybook/preview.ts` are an
example: Vite resolved relative font paths from a different base than webpack.

## Known production-only behaviour not covered by Storybook

1. **MSAL redirect flow** — the Azure B2C redirect sets cookies and storage keys
   that require a real browser navigation cycle. Storybook stories mock MSAL state
   via `storybookHarness.tsx`; the real redirect flow is only exercised in E2E tests.

2. **API error boundaries** — production `AuthenticatedElement` wraps children in
   an `ErrorBoundary`; stories use `withPortalProviders` which includes the same
   boundary but does not simulate real 401/403 responses from MSW.

3. **webpack code splitting** — route-level lazy loading is configured in
   `App.tsx` via `React.lazy`. Storybook/Vite does not exercise the webpack chunk
   boundary, so chunk-load failures are invisible in stories.

## Rebuild recommendation

In the rebuilt portal, align Storybook and production on the same bundler
(either both Vite or both webpack) to close this gap. Vite is the recommended
direction given the React ecosystem trend.

If the rebuild uses Vite for production, the Storybook adapter should remain
`@storybook/react-vite` (as already used here).

## Files involved

| File | Role |
|---|---|
| `.storybook/main.ts` | Configures Storybook adapter (vite adapter confirmed) |
| `.storybook/preview.ts` | Global decorators — font paths resolved here |
| `ClientApp/webpack/` | Production webpack config — do not edit |
| `ClientApp/src/storybook/storybookHarness.tsx` | MSAL/auth mock context for stories |
