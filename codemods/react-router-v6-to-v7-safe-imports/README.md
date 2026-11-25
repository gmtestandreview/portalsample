# react-router-v6-to-v7-safe-imports

Private, conservative React Router v6-to-v7 import and root dependency migration. It fixes import paths and upgrades recognized v6 `react-router` dependency ranges without claiming to perform the full behavioral v7 migration.

## Run

```bash
codemod run react-router-v6-to-v7-safe-imports
# Or from this package checkout:
codemod workflow run -w .
```

The workflow processes `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.mts`, and `.cts` files. It excludes `.git`, `node_modules`, `generated`, `build`, `dist`, and `coverage`. Empty trees and files without recognized imports are no-ops. AST edits preserve local aliases, type-only markers, quote style, and most surrounding source formatting.

## Import Transformations

- Named ESM imports/re-exports from the exact `react-router-dom` package move to `react-router`, except `RouterProvider` and `HydratedRouter`, which move to `react-router/dom` for DOM runtime imports.
- Named `RouterProvider` imports from `react-router` move to `react-router/dom`. Other existing `react-router` imports, including existing `/dom` imports, stay unchanged.
- Mixed named imports are split into separate declarations as needed. Type-only specifiers keep their `type` marker and aliases are preserved.
- Package matching is exact: subpaths, other package names, comments, strings, and test mock targets are not rewritten.
- A duplicate local binding from an already-present v7 module is retained from the old package and reported rather than emitted as a duplicate binding.

CommonJS `require`, dynamic `import()`, namespace imports, default imports, side-effect imports, and imports with a simultaneous default/namespace binding are not transformed. These forms emit actionable warnings, and source scanning prevents `react-router-dom` removal while any supported source file still mentions the package. Review those warnings and update those references manually.

## Dependencies And Lockfiles

The manifest reconciler edits only the root `package.json` and the existing dependency section (`dependencies`, `devDependencies`, `optionalDependencies`, or `peerDependencies`). It adds `react-router: ^7.0.0` if only `react-router-dom` exists, upgrades recognized React Router v6 ranges, and leaves existing v7 ranges such as `^7.18.5` intact. Non-semver aliases and unrecognized ranges are reported and left unchanged. It does not change workspace package manifests.

`targetVersion` defaults to `^7.0.0`; the script accepts only values beginning with a v7 range. `updateLockfile` defaults to `false`, so no package-manager operation runs unless enabled. If enabled after a manifest edit, the script updates only when exactly one supported lockfile exists: npm `package-lock.json`, pnpm `pnpm-lock.yaml`, or Yarn `yarn.lock`. Ambiguous/missing lockfiles produce a warning and are not modified. No competing lockfile is created. If source references are unresolved, the old dependency is retained.

Workflow script parameters `preRunScript` and `postRunScript` default to safe `echo` commands. Set them only to commands appropriate for the target repository. The optional `runAiCleanup` boolean defaults to `true` and is exposed as a campaign toggle; its step is named **AI review and cleanup**. The AI prompt explicitly limits cleanup to the requested migration and flags behavioral work rather than inventing it.

## Scope And Prerequisites

This migration does not add v7 future flags, replace `json`/`defer`, rewrite route lazy APIs, change `fallbackElement`, adjust form methods, or convert to framework/SSR mode. React Router v7 requires Node.js 20+ and React/ReactDOM 18+. Review the official [v6-to-v7 upgrade guide](https://reactrouter.com/upgrading/v6), address behavior changes separately, run your project tests, and inspect all warnings. This codemod is intentionally conservative and can leave references for manual migration.

`RouterProvider` documentation confirms it is available from `react-router/dom`; that entry wires React DOM's `flushSync`, while the core `react-router` export is intended for non-DOM environments. `HydratedRouter` is handled as a DOM-specific symbol by this migration.

## Development And Validation

```bash
pnpm test
pnpm check-types
codemod workflow validate -w workflow.yaml
```

Fixtures cover mixed imports, aliases, type imports/exports, quote styles, existing imports, negative string/comment cases, and already-correct DOM imports. Manifest tests cover v7 range preservation, v6 upgrades, existing dependency sections, workspace protocols, unresolved references, removal decisions, aliases, and no unnecessary install. The workflow must run from its package-resolved `scripts/` paths; it does not use `$FILE_PATH` or assume a script exists in the target repository.

## License

MIT
