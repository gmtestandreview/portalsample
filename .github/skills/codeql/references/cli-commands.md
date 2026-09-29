# CodeQL CLI command reference

Load for local or external-CI CodeQL operation.

## Version discipline

Prefer the CodeQL bundle so the CLI and bundled queries/libraries are compatible. Before relying on release-sensitive flags:

```bash
codeql version
codeql resolve languages
codeql database create --help
codeql database analyze --help
```

Do not claim a command or flag exists in an older installation without checking its `--help`.

## Create a database

No-build example for a language supported by the installed CLI:

```bash
codeql database create codeql-db   --language=python   --source-root=.   --build-mode=none
```

Autobuild example:

```bash
codeql database create codeql-db   --language=java-kotlin   --source-root=.   --build-mode=autobuild
```

Explicit build example:

```bash
codeql database create codeql-db   --language=java-kotlin   --source-root=.   --command='./gradlew build'
```

`--command` performs a traced/manual build; verify the build command is trusted before executing it. Build-mode availability is language- and release-specific; see `compiled-languages.md`.

For multiple languages, use database clustering only after checking each language's compatible extraction strategy. Do not attach one arbitrary build command to interpreted and compiled languages merely to make a cluster example shorter.

## Analyze

```bash
codeql database analyze codeql-db   <suite-or-pack>   --format=sarif-latest   --output=results.sarif
```

Use a suite/pack that resolves in the installed distribution. Add a stable SARIF category when multiple analyses of the same commit must remain distinct.

## Upload to GitHub

```bash
codeql github upload-results   --repository=OWNER/REPO   --ref=refs/heads/main   --commit=<full-commit-sha>   --sarif=results.sarif
```

Authenticate using the mechanism supported by the environment. Never print or embed a token in generated scripts. Repository eligibility and token permissions for GitHub code scanning are product/policy-sensitive; verify current GitHub documentation when upload fails.

## Useful diagnostics

```bash
codeql resolve languages
codeql resolve packs
codeql database create --help
codeql database analyze --help
```

Use `--threads`/`--ram` only after checking the command's current help and the runner's resources.

## Success criteria

A zero exit status is necessary but not sufficient for a trustworthy scan. Confirm that the intended source root, language database, query set, and output file correspond to the requested analysis.

## GitHub Action integration

For external or third-party SARIF produced in GitHub Actions, use `github/codeql-action/upload-sarif` rather than adding CodeQL `analyze`; `analyze` is the normal CodeQL database-analysis flow and already uploads its own results.

The repository's `setup-codeql` action is experimental. It installs the CodeQL CLI without initializing a database. Prefer the normal documented CodeQL workflow unless the task specifically requires CLI-only setup and accepts experimental action behavior.

When selecting a CodeQL Action or bundle version, check current `github/codeql-action` releases. The action's `tools` input can select a local bundle, release-asset URL, `linked`, or `nightly`; nightly is unstable and is not a production default.

## CodeQL SARIF upload preflight

Before uploading CodeQL-generated SARIF with the CLI, check repository eligibility and whether CodeQL default setup is enabled. GitHub rejects competing CodeQL-generated SARIF uploads while default setup is enabled. If blocked, choose between keeping default setup or intentionally switching setup; do not repeatedly retry or rewrite valid SARIF.
