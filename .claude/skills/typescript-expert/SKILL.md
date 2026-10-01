---
name: typescript-expert
description: >-
  Use when writing, reviewing, debugging, refactoring, migrating, or hardening
  TypeScript projects targeting 5.9.3 strict mode, including compiler or emit
  failures, ESLint or SonarQube findings, module resolution, declaration/public
  typing, advanced types, project references, monorepos, or type-check
  performance. Do not use for unrelated JavaScript-only or UI/UX tasks.
compatibility: >-
  Claude Code project skill. Requires Python 3.10+ for scripts/ts_diagnostic.py
  and project/workspace-local or PATH TypeScript 5.9.3; optional lint/build/test/Sonar
  gates depend on project tools. Sonar also requires configured network access
  and credentials.
metadata:
  version: "1.2.0"
  typescript: "5.9.3"
---

# TypeScript Expert

Treat TypeScript correctness as a release gate. For code-changing tasks, do not
claim completion until every applicable compiler, lint, test/build, and Sonar
gate has actually passed or is explicitly reported as unresolved.

## Scope and boundaries

Use this skill for TypeScript code, configuration, architecture, migrations,
reviews, refactors, debugging, declaration files, advanced types, modules,
monorepos, and performance. Use it for JavaScript only for a TypeScript
migration, `checkJs` hardening, or TypeScript/JavaScript interop.

Do not use it for UI/UX design or unrelated JavaScript-only work.

## Non-negotiable rules

1. Target TypeScript **5.9.3**. Verify the project compiler before relying on
   version-specific behavior. A different version is unresolved until the
   project requirement is clarified or corrected.
2. Preserve the project's runtime, package manager, framework, module system,
   path conventions, public API, tests, and documented local rules.
3. Never weaken `tsconfig`, ESLint, tests, Sonar rules, or a Sonar quality gate
   merely to make failures disappear.
4. Prefer correct types over suppression. Avoid `any`, broad assertions,
   non-null assertions, `@ts-ignore`, `@ts-expect-error`, lint disables, and
   Sonar exclusions unless a narrow exception is necessary and explained.
5. Fix root causes. Do not replace a real compiler/linter failure with casts,
   dead code, duplicated types, or wider public contracts.
6. Do not invent passing results. Missing tools, credentials, network access,
   configuration, or execution evidence remain unresolved.
7. Do not install or download replacement tooling just to satisfy this skill.

## Change safety

Before consequential edits, inspect repository status/diff and avoid overwriting
unrelated work. For changes to compiler configuration, package metadata, public
APIs, migrations, or shared build settings:

- preserve a rollback path through the existing VCS/diff or an equivalent
  project-approved backup;
- stage the smallest justified change and validate it before widening scope;
- do not revert unrelated user changes;
- run networked Sonar analysis only when the project already configures it and
  external analysis is authorized; otherwise report that gate as unresolved.

## Workflow

### 1. Inspect before editing

Read the smallest relevant set first: `package.json`, the active
lockfile/package-manager declaration, applicable `tsconfig*.json` (including
`extends`/references), ESLint and Sonar configuration, nearby source/tests,
generated-type boundaries, and public exports.

Prefer existing project scripts. In monorepos, distinguish the **project
root** (package/TSConfig being diagnosed) from the **tool root** (workspace
lockfile and hoisted `node_modules`). Pass `--root <project>` and
`--tool-root <workspace>` when they differ; do not guess from the current
directory.

For a broad or unclear failure set, run:

```bash
python scripts/ts_diagnostic.py \
  --root . --expect-ts 5.9.3 --strict --typecheck --lint
```

Add `--emit` only for a single-project emit check. If project references are
present, prefer the repository build or an existing `tsc --build` workflow.
Add `--build`, `--test`, or `--sonar` only when those gates apply.

### 2. Establish the compiler contract

Use `references/tsconfig-strict.json` as the strictness baseline, not as a
drop-in runtime configuration. A baseline deviation is a failure unless the
project intentionally documents that exact exception. For a documented
exception, pass `--allow-strict-exception <flag>`; the diagnostic reports
`WARN`, not a baseline `PASS`. Never exempt `strict` itself. Keep `module`,
`moduleResolution`, `target`, `lib`, JSX, emit, and path settings aligned with
the actual runtime/build tool.

For TypeScript 5.9:

- choose Node module modes for Node runtimes; use `module: "node20"` only when
  the project intentionally models Node 20 semantics;
- use `moduleResolution: "bundler"` only when a bundler controls runtime module
  resolution/output;
- do not assume path aliases work at runtime merely because TypeScript resolves
  them;
- use project references for genuine project boundaries, not as a blanket
  performance tweak.

Load `references/typescript-5.9.3-practices.md` for compiler/module, ESLint,
SonarQube, or project-reference decisions.

### 3. Implement with strict types

Prefer inference for obvious locals and explicit exported/public contracts;
`unknown` plus narrowing for untrusted values; discriminated unions and
exhaustive `never` checks for closed states; `satisfies` when validation should
preserve inference; type-only imports where module semantics require them; and
runtime validation for external data.

Choose `interface` or `type` for semantics and composition needs rather than a
blanket preference. Add decorators/metadata only when the framework and compiler
configuration require them.

Load `references/utility-types.ts` only for reusable advanced type patterns.
Copy selectively; it is a pattern catalog, not a library to import wholesale.
Treat recursive/counting utilities as bounded examples: preserve their guards,
add type tests when reused publicly, and prefer simpler/runtime representations
when requested sizes or recursive schemas exceed the documented bounds.

### 4. Debug in dependency order

Resolve failures in this order unless evidence requires otherwise:

1. invalid configuration, syntax, or module-resolution failures;
2. compiler type errors;
3. TypeScript emit/build failures;
4. ESLint failures, including type-aware rules;
5. behavior/test failures caused by the change;
6. SonarQube findings and quality-gate failures.

For slow type checking, use `--extendedDiagnostics` or a compiler trace before
rewriting types. Reduce avoidable union/intersection recursion, unnecessary
generic distribution, oversized project scope, or broken project boundaries
based on evidence rather than fixed thresholds.

### 5. Validate before completion

For code changes, run the project's applicable gates and keep fixing until they
pass:

- TypeScript 5.9.3 version check and strict-profile check;
- `tsc` type checking;
- `tsc` emit when the project is required to emit with `tsc`;
- ESLint using the project's configured rules;
- project build/tests when behavior or generated output can change;
- SonarQube with quality-gate waiting when Sonar is configured and
  authorized. Use the project's assigned quality profile. If the requirement
  specifically says **Sonar way**, verify that server-side assignment from
  project/server evidence when accessible.

Use `scripts/ts_diagnostic.py` as orchestration/inspection, not as a substitute
for project CI. A successful waited scanner proves the quality-gate result, not
which server-side quality profile was assigned. If a required profile cannot be
verified, report profile assignment as unresolved even when the gate passed.

Do not finish with “clean”, “fixed”, or “passes” while a required gate is
failed, skipped without justification, or unverifiable.

## Review focus

Prioritize defects that commonly survive AI-generated TypeScript: unsafe `any`
or boundary casts; nullable/optional misuse; floating promises; loose impossible
states; unsound generic constraints or excessive instantiation; ESM/CJS and
package-export mismatches; runtime-broken aliases; stale declarations; circular
dependency/barrel amplification; suppressed diagnostics; and duplicated
source-of-truth types.

## Bundled resources

- Execute `scripts/ts_diagnostic.py` for broad diagnostics or deterministic
  gates; use `--format json` for machine-readable output.
- Load `references/typescript-5.9.3-practices.md` for compiler/module, ESLint,
  SonarQube, or project-reference decisions.
- Inspect `references/tsconfig-strict.json` only when establishing or comparing
  strictness; do not copy runtime/module settings from another environment.
- Load `references/utility-types.ts` only for reusable advanced type patterns
  and copy only the pattern needed.

## Completion report

State what changed and why; which compiler/lint/build/test/Sonar commands
actually ran; the actual status of each required gate; and any remaining
blocker, suppression, assumption, or unverified external gate.

Never convert an unavailable check into a pass.
