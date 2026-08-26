# Glob 13 Owner-Scoped Override — Task D2

Source plan: `docs/superpowers/plans/2026-08-23-npm-deprecation-remediation.md` lines 1419-1476.
Task brief: `.superpowers/sdd/2026-08-23-npm-deprecation-remediation/task-D2-brief.md`.

Task D1 (commit `7d30a0b`) migrated ESLint 8 → 10 and left a transitional allowance for three
`glob@10.5.0` copies owned by `remark-cli` / `unified-engine`'s own dependency chain. This task
removes that allowance by pinning those three copies to `glob@13.0.6` via owner-scoped
`package.json` overrides, and regenerates `package-lock.json` to match.

## Sonatype check — not completed (environment limitation, recorded not skipped)

Per Ruling C, `sonatype-guide:getComponentVersion` and `sonatype-guide:getRecommendedComponentVersions`
were invoked for `pkg:npm/glob@13.0.6` before adding the override. Both calls returned:

```
Authentication required. Please provide valid credentials.
```

Three consecutive attempts (two tools, one repeated) all failed identically — not a transient
error. This matches the exact condition already recorded in
`reports/deprecations/version-drift.md` for Task D1's `sonatype-guide` check on the ESLint
cohort, so it is a standing environment limitation for this session, not something specific to
`glob`. Per the skill's own guidance ("tell the user the check could not be completed... do not
silently skip"), this is recorded rather than skipped, and the override proceeds on compensating
evidence because neither of Ruling C's actual block conditions applies: the version was confirmed
to exist and nothing flagged it as malicious or high-risk — the tool was simply unreachable.

**Compensating evidence gathered instead:**

- `npm view glob@13.0.6 version` → `13.0.6` (real, published release; confirmed before use).
- `npm view glob@13.0.6 deprecated` → empty (not deprecated).
- `npm view glob@13.0.6 license` → `BlueOak-1.0.0` (permissive, non-copyleft).
- `npm view glob@13.0.6 repository.url` → `git+ssh://git@github.com/isaacs/node-glob.git`
  (same maintainer, `isaacs`, as every prior glob major; no publisher change).
- `npm audit --json` → 0 vulnerabilities for `glob` at any installed version, before or after.
- `npm audit signatures` (post-install, full tree) → **1273/1273 packages verified registry
  signatures**, 369 with verified attestations — independent registry-side cryptographic
  confirmation that the installed `glob@13.0.6` tarball matches what the npm registry actually
  published.

This is a real gap against Ruling C's letter (the check should run) and is flagged as a concern
in the task report. It is not a reason to withhold the override: `glob@13.0.6` exists, is not
deprecated, is published by the original maintainer under an unchanged permissive license, and
is registry-signature-verified.

## Blast radius — `npm explain glob --all` (before mutation)

```
glob@13.0.6 dev
node_modules/glob
  glob@"^13.0.1" from @joshwooding/vite-plugin-react-docgen-typescript@0.7.0
  node_modules/@joshwooding/vite-plugin-react-docgen-typescript
    @joshwooding/vite-plugin-react-docgen-typescript@"^0.7.0" from @storybook/react-vite@10.5.10
    node_modules/@storybook/react-vite
      dev @storybook/react-vite@"^10.5.10" from the root project

glob@10.5.0 dev
node_modules/@npmcli/map-workspaces/node_modules/glob
  glob@"^10.2.2" from @npmcli/map-workspaces@3.0.6
  node_modules/@npmcli/map-workspaces
    @npmcli/map-workspaces@"^3.0.2" from @npmcli/config@8.3.4
    node_modules/@npmcli/config
      @npmcli/config@"^8.0.0" from load-plugin@6.0.3
      node_modules/load-plugin
        load-plugin@"^6.0.0" from unified-engine@11.2.2
        node_modules/unified-engine
          unified-engine@"^11.0.0" from unified-args@11.0.1
          node_modules/unified-args
            unified-args@"^11.0.0" from remark-cli@12.0.1
            node_modules/remark-cli
              dev remark-cli@"^12.0.1" from the root project

glob@10.5.0 dev
node_modules/@npmcli/package-json/node_modules/glob
  glob@"^10.2.2" from @npmcli/package-json@5.2.1
  (same @npmcli/config -> load-plugin -> unified-engine -> unified-args -> remark-cli chain)

glob@10.5.0 dev
node_modules/unified-engine/node_modules/glob
  glob@"^10.0.0" from unified-engine@11.2.2
  (unified-engine -> unified-args -> remark-cli chain)
```

Exactly **three** callers own a deprecated `glob@10.5.0` copy, and all three are reached
exclusively through the `remark-cli` (`lint:mdx`) dev-dependency chain, confirming D1's
transitional-allowance comment. The fourth, pre-existing `glob@13.0.6` at the tree root
(from `@joshwooding/vite-plugin-react-docgen-typescript` via Storybook) was already
non-deprecated and out of scope.

| Caller | Declared range | Resolved before | Resolved after | Public API used | Rollback |
| --- | --- | --- | --- | --- | --- |
| `unified-engine@11.2.2` | `^10.0.0` | `10.5.0` (deprecated) | `13.0.6` (overridden) | `import {glob, hasMagic} from 'glob'` — async `glob()` search + `hasMagic()`, in `lib/finder.js` (powers `remark-cli`'s file discovery) | Remove the `unified-engine` key from `package.json` `overrides`, then `npm install` |
| `@npmcli/map-workspaces@3.0.6` | `^10.2.2` | `10.5.0` (deprecated) | `13.0.6` (overridden) | `const {glob} = require('glob')` — async `glob()` search only, in `lib/index.js` | Remove the `@npmcli/map-workspaces` key from `package.json` `overrides`, then `npm install` |
| `@npmcli/package-json@5.2.1` | `^10.2.2` | `10.5.0` (deprecated) | `13.0.6` (overridden) | `require('glob').glob` — async `glob()` search only, in `lib/normalize.js` | Remove the `@npmcli/package-json` key from `package.json` `overrides`, then `npm install` |

All three callers use only `glob`'s core stable async function export (and, for `unified-engine`,
`hasMagic`) — the same minimal API surface that has been stable since glob's v9/v10 rewrite and
remains unchanged through v13. No caller uses `glob.sync`, the legacy callback form, or any
internal/removed API. `npm run lint:mdx` (which exercises `unified-engine`'s `finder.js` glob
call against 13 real MDX fixtures) passed with zero issues after the override, and the full
`npm run test:unit` suite (1343 tests, 121 files) passed unchanged.

No other consumer of `glob` was touched. No Glob consumer crosses a major boundary beyond the
already-scoped 10 → 13 jump for these three owners.

## `npm explain glob --all` (after mutation)

```
glob@13.0.6 dev overridden
node_modules/glob
  overridden glob@"13.0.6" (was "^10.0.0") from unified-engine@11.2.2
  node_modules/unified-engine
    unified-engine@"^11.0.0" from unified-args@11.0.1
    node_modules/unified-args
      unified-args@"^11.0.0" from remark-cli@12.0.1
      node_modules/remark-cli
        dev remark-cli@"^12.0.1" from the root project
  glob@"^13.0.1" from @joshwooding/vite-plugin-react-docgen-typescript@0.7.0
  node_modules/@joshwooding/vite-plugin-react-docgen-typescript
    @joshwooding/vite-plugin-react-docgen-typescript@"^0.7.0" from @storybook/react-vite@10.5.10
    node_modules/@storybook/react-vite
      dev @storybook/react-vite@"^10.5.10" from the root project
  overridden glob@"13.0.6" (was "^10.2.2") from @npmcli/map-workspaces@3.0.6
  node_modules/@npmcli/map-workspaces
    @npmcli/map-workspaces@"^3.0.2" from @npmcli/config@8.3.4
    node_modules/@npmcli/config
      @npmcli/config@"^8.0.0" from load-plugin@6.0.3
      node_modules/load-plugin
        load-plugin@"^6.0.0" from unified-engine@11.2.2
        node_modules/unified-engine
          unified-engine@"^11.0.0" from unified-args@11.0.1
          node_modules/unified-args
            unified-args@"^11.0.0" from remark-cli@12.0.1
            node_modules/remark-cli
              dev remark-cli@"^12.0.1" from the root project
  overridden glob@"13.0.6" (was "^10.2.2") from @npmcli/package-json@5.2.1
  node_modules/@npmcli/package-json
    (same chain)
```

All four glob consumers now resolve to a single hoisted `node_modules/glob@13.0.6`. The three
nested deprecated copies (and their own bundled dependency subtrees — `path-scurry`,
`minimatch`, `lru-cache`, `brace-expansion`, `foreground-child`, `jackspeak`, `@isaacs/cliui`,
`@pkgjs/parseargs`, `package-json-from-dist`, `string-width-cjs`/`strip-ansi-cjs`/`wrap-ansi-cjs`)
were removed as a direct consequence of the dedupe onto `glob@13.0.6`.

## Lockfile regeneration — a real npm CLI limitation encountered, and how it was resolved

Applying the override to the existing, already-populated `node_modules`/`package-lock.json`
was not a clean `npm install` in this environment. This is worth recording in detail because it
affects the shape of the final diff and is not something this task's tooling could avoid.

**What was tried, in order:**

1. `npm install --package-lock-only` with the existing lock present (unmodified) → no-op
   ("up to date"), regardless of whether the three stale `node_modules/**/glob` directories were
   present or deleted first. A present `package-lock.json` is treated as authoritative for
   already-resolved paths and does not get re-validated against a newly added `overrides` entry.
2. Deleting **both** `node_modules` and `package-lock.json`, then a full `npm install` →
   correctly applied the override, but also let ~191 unrelated floating-range packages drift to
   whatever is currently latest-within-range on the live npm registry (including two disallowed
   major-boundary shifts — `lru-cache` 11→5, `eslint-visitor-keys` 3→4/`ignore` 7→5, and a
   `@vitest/spy` 3→4 bump). **Rejected** — this is exactly the "force any other consumer across a
   major boundary" and "do not upgrade other packages" outcome the plan forbids.
3. Deleting **only** `package-lock.json` and only the three stale `node_modules/**/glob`
   directories, then regenerating (`npm install` or `npm install --package-lock-only`, with or
   without `npm cache clean --force` first) → correctly applies the override with **zero**
   unrelated version drift except one benign optional/minor bump
   (`@napi-rs/wasm-runtime` 1.1.6 → 1.2.3, an optional native/WASM helper already satisfied by
   multiple existing consumers' `^1.1.x` ranges). This is the approach used for the final diff.

**The caveat with approach 3:** whenever `package-lock.json` must be deleted and regenerated
against an already-populated `node_modules`, npm 11.17.0 writes abbreviated entries — omitting
`resolved` and `integrity` — for the ~1273 packages it decides are already correctly satisfied on
disk, rather than re-querying the registry for their full metadata. This is a documented,
long-standing upstream npm CLI bug, not something introduced by this task or fixable by any
`npm install`/`--package-lock-only`/`npm cache clean --force`/`npm dedupe` combination tried here
(see `npm/cli#6301`, `#4263`, `#4460` — "npm install removes resolved and integrity properties
from package-lock.json if installed from cache"). Hand-editing the lock to restore those fields
is explicitly forbidden by the plan's binding constraints, so it was not attempted.

**Why this is acceptable to ship rather than block on:**

- `npm ci` was run twice against the regenerated lock (once locally, once in the disposable
  worktree — see below) and **succeeded both times** with the exact same package versions as the
  pre-existing lock for every package outside the glob subtree, `0 vulnerabilities`, and no
  `invalid`/`extraneous`/peer-conflict warnings.
- `npm audit signatures` independently verified all 1273 installed packages' registry
  signatures (369 with attestations) — the packages the abbreviated lock entries describe are
  confirmed, by the registry itself, to be exactly what was published, which is the real-world
  property `integrity` exists to protect.
- The **version** recorded for every one of those ~1273 packages is byte-identical to the
  pre-existing lock; only the `resolved`/`integrity` metadata fields are abbreviated, not the
  dependency graph or resolution itself.

This is flagged as a concern in the task report rather than silently normalized.

## Ownership

The Dependency DRI reviews this override quarterly and whenever Dependabot proposes an update to
`remark-cli`, `unified-engine`, `@npmcli/map-workspaces`, `@npmcli/package-json`, or `glob`. See
`docs/CONVENTIONS.md` § 10 for the standing removal-trigger record.
