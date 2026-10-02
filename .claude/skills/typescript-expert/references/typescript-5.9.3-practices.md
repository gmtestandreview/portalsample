# TypeScript 5.9.3 Practices

Load this reference for compiler configuration, module resolution, typed ESLint,
SonarQube, or project-reference decisions. The project configuration remains
authoritative where it intentionally differs.

## Version target

This skill targets TypeScript 5.9.3. Verify the actual compiler before making
version-specific changes. Do not silently use TypeScript 6 behavior or assume
that a globally installed compiler matches the project.

Official references:

- TypeScript 5.9 release notes:
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
- TypeScript 5.9.3 release:
  https://github.com/microsoft/TypeScript/releases/tag/v5.9.3
- TSConfig reference:
  https://www.typescriptlang.org/tsconfig/

## Strictness baseline

The project baseline is `references/tsconfig-strict.json`.

`strict: true` enables TypeScript's strict-family checks. The project baseline
adds checks that are not all implied by `strict`, including unchecked indexed
access, exact optional-property semantics, override checks, index-signature
property-access discipline, fallthrough prevention, and side-effect-import
checking.

Do not disable a strictness option just to clear generated errors. Fix the code
or document an intentional project exception. The diagnostic baseline may
accept a documented per-flag exception only when it is named explicitly; that
result is a deviation warning, not proof that the full baseline is enabled.
`strict` itself is not an allowable exception for this strict-mode skill.

## TypeScript 5.9 configuration guidance

TypeScript 5.9's simplified `tsc --init` enables strong defaults including
`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noUncheckedSideEffectImports`, `verbatimModuleSyntax`, `isolatedModules`,
`moduleDetection: "force"`, and `skipLibCheck`.

Treat module/transpilation options as environment-dependent:

- `module: "node20"` is the stable TypeScript 5.9 mode for Node 20 behavior.
- `nodenext` tracks modern Node semantics and can change with newer Node/TS.
- `moduleResolution: "bundler"` is for bundler-managed resolution and does not
  enforce every Node runtime import constraint.
- Libraries must validate emitted declarations against how consumers resolve
  modules; a bundler-safe source import is not automatically Node-safe in `.d.ts`.

References:

- https://www.typescriptlang.org/tsconfig/moduleResolution.html
- https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options

## Project references and workspace roots

Use project references when the repository has real project boundaries that
benefit from independent checking/building. Referenced projects use `composite`
and declaration output; `tsc --build` coordinates the graph.

In monorepos, distinguish the package/project root from the workspace tool root.
The package root owns the relevant `package.json`, scripts, and TSConfig; the
workspace root may own the lockfile and hoisted `node_modules`. When using the
bundled diagnostic, set `--root` to the package/project and `--tool-root` to the
workspace only when those boundaries genuinely differ. This prevents PATH or a
sibling package from silently supplying the compiler.

Reference:
https://www.typescriptlang.org/docs/handbook/project-references.html

## ESLint and typescript-eslint

Respect the repository's existing ESLint configuration. When typed linting is
configured, keep it working rather than replacing it with syntax-only linting.

Current typescript-eslint guidance provides `recommendedTypeChecked` and
`strictTypeChecked` families for rules that require type information, commonly
with `parserOptions.projectService: true`. `strictTypeChecked` is intentionally
opinionated and is not semver-stable, so do not introduce it silently into an
existing project. The goal of this skill is to pass the project's configured
rules, not to swap presets without a requirement.

References:

- https://typescript-eslint.io/getting-started/typed-linting/
- https://typescript-eslint.io/users/configs/

## SonarQube / Sonar way

This skill is pinned to TypeScript 5.9.3. When the project upgrades TypeScript
or SonarQube, verify analyzer/compiler compatibility in the project's current
Sonar documentation rather than assuming this reference remains current.

The built-in **Sonar way** quality profile is server-managed. Do not suppress or
disable its findings to obtain a green result. Fix the source when possible.
For a scanner-based gate, `sonar.qualitygate.wait=true` makes the scanner wait
for the server result and fail when the quality gate fails.

A successful waited scan proves the quality-gate result only. It does **not**
prove which server-side quality profile is assigned. If a project requirement
specifically mandates Sonar way, verify the assignment from accessible
server/project evidence; otherwise record profile assignment as unverified
rather than inferring it from scanner success.

If the project has multiple TSConfigs or a monorepo, keep Sonar's TSConfig scope
consistent with the source scope; use the project's existing
`sonar.typescript.tsconfigPaths` policy when present.

References:

- https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/languages/javascript-typescript-css
- https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-profiles/
- https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/analysis-parameters

## Update boundary

When upgrading this skill beyond TypeScript 5.9.3, review together: the pinned
compiler version, `references/tsconfig-strict.json`, module-mode guidance,
typescript-eslint guidance, Sonar compatibility, and deterministic diagnostic
tests. Do not update only the frontmatter version.
