# CodeQL compiled-language decisions

Load this reference when choosing a build mode, runner, or build strategy.

## First distinction: Action vs CLI

Do not copy a build-mode matrix between GitHub Actions and the CLI. Current GitHub documentation exposes different supported `none` sets.

### GitHub CodeQL Action

Current GitHub documentation states:

- `none`: interpreted languages plus C/C++, C#, Java, and Rust.
- `autobuild`: C/C++, C#, Go, Java, Kotlin, and Swift.
- `manual`: use explicit project build steps where supported/needed.

Kotlin must be built. A `java-kotlin` job that needs Kotlin coverage must use `autobuild` or `manual`, not `none`.

### CodeQL CLI

For the installed CLI, prefer:

```bash
codeql database create --help
codeql resolve languages
```

Current CLI documentation for `database init` documents:

- `none`: C#, Java, JavaScript/TypeScript, Python, Ruby.
- `autobuild`: C/C++, C#, Go, Java/Kotlin, Swift.
- `manual`: C/C++, C#, Go, Java/Kotlin, Swift.

A `--command` build implies a manual traced build; do not add `--build-mode=manual` merely for redundancy.

Because CLI support evolves, verify the installed release before generating automation.

## Selection procedure

1. Identify Action vs CLI.
2. Identify every language actually requiring coverage.
3. If Kotlin is present, require a build.
4. Prefer the simplest supported mode that provides required coverage.
5. Use `autobuild` when automatic build detection is acceptable.
6. Use `manual` when the project needs explicit build commands, generated code, special flags, or autobuild fails.
7. Verify extraction/coverage after the run; successful build does not prove intended CodeQL coverage.

## Mixed-language Action example

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - language: c-cpp
        build-mode: manual
      - language: csharp
        build-mode: none
      - language: java-kotlin
        build-mode: autobuild
```

Place manual build steps after `github/codeql-action/init` and before `analyze`.

## Runner decisions

Choose an OS capable of building the target project. Swift analysis requires a supported macOS environment. Windows-specific C/C++ or .NET Framework builds may require Windows. Do not select a runner from language name alone when the project's build system imposes stronger requirements.

## Freshness boundary

Autobuild detection order, dependency restoration heuristics, supported modes, and runner requirements are release-sensitive. Verify them in current GitHub CodeQL documentation when they determine the answer.
