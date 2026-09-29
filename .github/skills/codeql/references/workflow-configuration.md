# CodeQL workflow configuration

Load for GitHub Actions/default-vs-advanced setup decisions.

## Setup choice

Default setup is the low-maintenance starting point for eligible repositories and can be customized without maintaining a workflow. Advanced setup is appropriate when the needed control is not available through default setup, including explicit workflow orchestration or manual build steps.

Do not assume switching setup types is a harmless file edit. Explain the effect on existing scanning configuration and preserve rollback information before changing security configuration.

## Advanced workflow skeleton

```yaml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '30 6 * * 1'

permissions:
  contents: read
  security-events: write

jobs:
  analyze:
    strategy:
      fail-fast: false
      matrix:
        include:
          - language: javascript-typescript
            build-mode: none
          - language: java-kotlin
            build-mode: autobuild
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: github/codeql-action/init@v4
        with:
          languages: ${{ matrix.language }}
          build-mode: ${{ matrix.build-mode }}
      - uses: github/codeql-action/analyze@v4
        with:
          category: "/language:${{ matrix.language }}"
```

Before using this example, verify the current CodeQL Action major version and the target language/build-mode combination. For manual builds, insert the project's explicit build steps between `init` and `analyze`.

## Triggers

`push`, `pull_request`, and scheduled scans serve different coverage goals. Add `merge_group` when required by the repository's merge-queue policy. Path filters decide whether a workflow triggers; CodeQL configuration `paths`/`paths-ignore` controls analysis scope where supported. Do not conflate them.

Scheduled workflows must be present on the default branch to run.

## Permissions

For advanced CodeQL setup, current `github/codeql-action` guidance requires `security-events: write`; private-repository workflows additionally require `contents: read`. Uploading third-party SARIF may also require `actions: read` for private repositories. Event, fork, reusable-workflow, and organization policy can further constrain the effective token.

Use least privilege. Do not “fix” a permission error by broadly granting `write-all`.

## Configuration files

Use a CodeQL configuration file for supported path/query/model configuration. Keep trigger filtering in the workflow and analysis-scope filtering in CodeQL configuration conceptually separate.

## Query selection

Use the documented built-in suites or explicitly versioned custom packs. Do not invent pack names or assume a pack is available in the installed bundle. For custom packs, verify resolution before relying on them.

## Monorepos and categories

Use stable, distinct analysis categories when multiple analyses target the same commit so GitHub can distinguish result sets. Keep categories consistent across runs for the same logical analysis.

## Dependency caching

Treat dependency caching as an optimization, not a correctness requirement. Verify current Action inputs before adding caching options.

## Safety review

Workflow changes execute with repository context and may run build scripts. Review third-party actions, build commands, secret exposure, permissions, and fork behavior before recommending execution.

## Action boundaries

`github/codeql-action/init` sets up CodeQL analysis; `analyze` finalizes the database, runs analysis, and uploads CodeQL results. Do not add a separate `upload-sarif` step after `analyze` for the same CodeQL analysis.

`github/codeql-action/upload-sarif` is for SARIF generated outside the normal CodeQL `analyze` flow, including third-party tools.

`setup-codeql` is experimental and installs the CodeQL CLI without initializing a database. Do not use it as a drop-in replacement for `init` in a normal advanced CodeQL analysis workflow.

## Version policy

Examples use current documented major versions at review time, but action majors are release-sensitive. Check `github/codeql-action` releases and current GitHub documentation before creating or upgrading production workflows. Prefer a supported stable major; do not recommend nightly or experimental behavior for production unless the user explicitly accepts that risk.

## SARIF/setup conflict

When CodeQL default setup is enabled, GitHub rejects separately uploaded CodeQL-generated SARIF from the CodeQL Action, CLI, or API. This is a configuration conflict, not a malformed-SARIF error. Keep default setup and stop the competing upload, or deliberately switch away from default setup before using the external/advanced CodeQL upload path. Do not disable a security configuration silently.
