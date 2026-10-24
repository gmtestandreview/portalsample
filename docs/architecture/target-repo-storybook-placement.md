# Target-Repo Storybook Placement — Architecture Decision

## Context

The roadmap for migrating `portal.measurement.gov.au` to a rebuilt React
application does not yet specify how the Storybook harness relates to the
production build in the target repository.

The current snapshot uses one canonical Vite build family for the application
and Storybook:

| Concern | Current config | File |
| --- | --- | --- |
| Production bundle | Vite 8 | `vite.config.mts` |
| Storybook (dev/test) | Vite adapter | `.storybook/main.ts` (framework: `@storybook/react-vite`) |

See `docs/architecture/storybook-vs-webpack-runtime.md` for the shared-runtime
verification contract.

## Placement options for the rebuild

### Option A: Storybook co-located in the app repo (current approach)

`.storybook/` and story files live alongside source in `ClientApp/src/`.

**Pros:** Stories are adjacent to components; single `npm install`; the
application and Storybook share the Vite build family.
**Cons:** Storybook devDependencies remain in the production repo.

### Option B: Storybook in a dedicated workspace package

A monorepo structure (e.g. `packages/ui/`, `packages/storybook/`) separates
the Storybook harness from the production app package.

**Pros:** Clean build boundary; Storybook can use Vite independently.
**Cons:** More complex monorepo tooling (npm workspaces / Turborepo).

### Option C: Storybook migrated to a separate bundler

Switch `.storybook/main.ts` to a different adapter.

**Pros:** Allows an independently selected Storybook toolchain.
**Cons:** Reintroduces build divergence and is not required by this project.

## Recommendation

**Option A (co-located) with Vite production** is the implemented direction.
The production, development, Storybook, and Vitest paths now use Vite, so no
separate bundler boundary or webpack capture is required.

## Migration checklist items

Before choosing a placement strategy:

- [x] Confirm this snapshot has no webpack config or webpack dev-server
      entrypoint; verify host integration separately before deployment.
- [ ] Confirm whether the CI pipeline can run Storybook BDD separately from
      the production build.
- [ ] Decide on a monorepo tool (npm workspaces / Turborepo / Nx) if Option B
      is chosen.
- [ ] Confirm the Playwright config `baseURL` points to the correct server
      (Storybook vs production app) for each test suite.

## Files involved

| File | Role |
| --- | --- |
| `.storybook/main.ts` | Current: `@storybook/react-vite` adapter |
| `vite.config.mts` | Production and development Vite configuration |
| `docs/architecture/storybook-vs-webpack-runtime.md` | Shared build/runtime verification |
| `docs/STORYBOOK-MIGRATION-READINESS.md` | Storybook readiness gate status |
