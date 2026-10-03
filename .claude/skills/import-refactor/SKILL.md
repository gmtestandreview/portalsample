---
name: import-refactor
description:
  Use when a file or module move, rename, directory restructure, or code
  consolidation requires updating affected imports, module specifiers, path
  literals, config entries, tests, or documentation references. Applies to
  Python, TypeScript, and JavaScript codebases; do not use for import sorting or
  style-only cleanup when no path or module identity changed.
---

# Import and Reference Refactor

Update references made stale by a file/module move or rename. Preserve behavior
and existing import conventions; do not turn the refactor into an unrelated API
or style change.

## Inputs and boundaries

Before editing:

1. Establish the intended old → new file paths and module identifiers.
2. Define the repository/worktree scope and identify pre-existing local changes.
3. Resolve ambiguous mappings before bulk edits. Do not guess when one old
   reference could map to multiple targets.
4. Treat generated, vendored, cache, and build-output files as non-authoritative
   unless the project explicitly makes them source-controlled inputs. Update
   their source/generator instead.
5. Do not overwrite unrelated local changes. For broad or high-impact edits,
   preserve a reversible VCS checkpoint or backup before changing files.

This skill updates references caused by the structural change. Move or rename
files only when that operation is part of the user's request.

## Workflow

### 1. Build the mapping

Record each affected old → new pair for both:

- filesystem paths; and
- language/module identifiers or import specifiers.

Account for project conventions that can change the written reference, including
relative-import depth, package boundaries, aliases, extensions, index modules,
and package export/import maps.

### 2. Inventory references

Search the intended scope before replacing anything. Cover, as applicable:

- Python, TypeScript, and JavaScript imports/exports;
- dynamic imports and module-loading strings;
- runtime path literals and resource paths;
- tests, fixtures, mocks, and snapshots that encode paths;
- build, bundler, test-runner, lint, type-checker, and package configuration;
- `pyproject.toml`, `tsconfig.json`/`jsconfig.json`, and `package.json`
  path/export mappings when present;
- documentation and executable examples.

Search exact old paths/specifiers first, then broader names only when needed to
find transformed or dynamic references. Classify each hit before editing; do not
use an unreviewed repository-wide text replacement.

### 3. Apply updates

For each confirmed hit:

- replace it with the mapped target appropriate to that reference type;
- preserve absolute-vs-relative import style unless the new structure requires a
  change;
- preserve intentional aliases and public import surfaces;
- update configuration that defines resolution before relying on the new
  resolution behavior;
- leave deliberate historical examples or compatibility shims unchanged and
  record them as exceptions.

Avoid unrelated formatting, API renames, dependency upgrades, or cleanup.

### 4. Validate

Use project-native tooling already defined by the repository; do not invent
commands when the project exposes its own scripts or configuration.

Validate in this order:

1. **Targets** — referenced target files/modules exist and intended aliases
   resolve.
2. **Residuals** — re-search for old paths/specifiers; every remaining hit is
   either fixed or documented as an intentional exception.
3. **Static checks** — run the relevant formatter/linter/type/import-resolution
   checks available for the touched languages and configs.
4. **Focused tests** — run tests that cover the changed modules or paths, then
   broader tests only when the change surface justifies them.
5. **Diff review** — confirm no unrelated or generated changes were introduced.

If a required check cannot run, report it as unverified instead of claiming
success.

### 5. Correct failures

When validation fails:

1. trace the failure back to the smallest incorrect mapping, missed reference,
   or config-resolution rule;
2. fix only that cause;
3. rerun the affected validation step and downstream checks.

If the mapping remains ambiguous, stop that branch, leave it unchanged, and
report the unresolved decision. If edits cannot be made safely without
overwriting unrelated work, restore the affected changes from the
checkpoint/backup and report the conflict.

## Gotchas

- **Python package boundaries:** moving a module can change relative-import
  depth and package resolution even when filenames stay similar.
- **TS/JS aliases:** resolution may be defined in `tsconfig.json`,
  `jsconfig.json`, `package.json`, bundler config, or test config; updating
  source imports alone may be insufficient.
- **Case-only renames:** case-insensitive filesystems can hide stale casing.
  Verify the final on-disk path and references use the intended case.
- **Dynamic strings:** computed paths, globs, registry keys, and plugin names
  may not match the literal old path; broaden search carefully rather than
  replacing by basename globally.
- **Public compatibility surfaces:** package exports, re-export modules, or
  compatibility shims may intentionally retain the old import path. Preserve
  them when they are part of the supported API.

## Completion report

Report:

- old → new mappings applied;
- files changed, grouped by source/tests/config/docs when useful;
- intentional old-reference exceptions;
- validation commands/checks actually run and their outcomes;
- unresolved or unverified items.

Do not report the refactor complete unless target resolution is verified,
stale-reference search is clean except for documented exceptions, and all
required available checks pass.
