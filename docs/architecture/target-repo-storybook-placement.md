# Target-Repo Storybook Placement — Architecture Decision

## Context

The roadmap for migrating `portal.measurement.gov.au` to a rebuilt React
application does not yet specify how the Storybook harness relates to the
production build in the target repository.

The current snapshot has two distinct build pipelines:

| Concern | Current config | File |
|---|---|---|
| Production bundle | webpack 5 | `ClientApp/webpack/webpack.config.js` |
| Storybook (dev/test) | Vite adapter | `.storybook/main.ts` (framework: `@storybook/react-vite`) |

See `docs/architecture/storybook-vs-webpack-runtime.md` for the divergence
implications.

## Placement options for the rebuild

### Option A: Storybook co-located in the app repo (current approach)
`.storybook/` and story files live alongside source in `ClientApp/src/`.

**Pros:** Stories are adjacent to components; single `npm install`.
**Cons:** Storybook devDependencies bloat the production repo; Vite/webpack
split must be managed.

### Option B: Storybook in a dedicated workspace package
A monorepo structure (e.g. `packages/ui/`, `packages/storybook/`) separates
the Storybook harness from the production app package.

**Pros:** Clean build boundary; Storybook can use Vite while production uses
webpack or Vite independently.
**Cons:** More complex monorepo tooling (npm workspaces / Turborepo).

### Option C: Storybook migrated to webpack adapter
Switch `.storybook/main.ts` to `@storybook/react-webpack5` to align with
the production bundler.

**Pros:** Eliminates Vite/webpack divergence.
**Cons:** Slower Storybook dev experience; webpack Storybook is less maintained
than the Vite adapter.

## Recommendation

**Option A (co-located) with Vite production** is the recommended path for the
rebuild. Migrate the production bundler from webpack to Vite (aligning with the
Storybook adapter already in use). This eliminates the divergence entirely and
is consistent with the React 18 / TypeScript ecosystem direction.

If webpack must be retained (e.g. for .NET integration), use **Option B**
(monorepo) to isolate the Storybook Vite environment from the webpack build.

## Migration checklist items

Before choosing a placement strategy:

- [ ] Confirm whether the ASP.NET Core host requires webpack (SPA middleware
      integration may depend on the webpack dev server).
- [ ] Confirm whether the CI pipeline can run Storybook BDD separately from
      the production build.
- [ ] Decide on a monorepo tool (npm workspaces / Turborepo / Nx) if Option B
      is chosen.
- [ ] Confirm the Playwright config `baseURL` points to the correct server
      (Storybook vs production app) for each test suite.

## Files involved

| File | Role |
|---|---|
| `.storybook/main.ts` | Current: `@storybook/react-vite` adapter |
| `ClientApp/webpack/webpack.config.js` | Current: production webpack 5 config — do not edit |
| `docs/architecture/storybook-vs-webpack-runtime.md` | Divergence analysis |
| `docs/STORYBOOK-MIGRATION-READINESS.md` | Storybook readiness gate status |
