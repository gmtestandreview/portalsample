---
name: codeql
description: Use when configuring, running, auditing, or troubleshooting GitHub CodeQL code scanning, including default or advanced setup, GitHub Actions workflows, CodeQL CLI databases and queries, compiled-language build modes, SARIF upload/interpretation, code scanning alerts, monorepos, custom query packs, or failures such as missing source, build errors, incomplete extraction, or rejected SARIF.
---

# CodeQL Code Scanning

Use this skill for CodeQL-specific execution and diagnosis. Do not use it for generic GitHub Actions, generic SAST advice, or arbitrary SARIF tooling unless CodeQL or GitHub code scanning behavior is material.

## Operating rules

1. Establish the target first: GitHub.com vs GHES, default vs advanced setup vs external CI/CLI, languages, repository layout, and whether the user wants configuration, diagnosis, interpretation, or commands.
2. Prefer current GitHub documentation for version-sensitive facts. Do not infer a build mode, action input, CLI flag, permission, product entitlement, or limit from memory when correctness depends on the current release.
3. Treat repository build steps and workflow changes as executable code. Inspect user-supplied commands before recommending execution; do not run untrusted build scripts merely to make CodeQL succeed.
4. Never expose tokens. Prefer the environment/secret mechanism appropriate to the user's CI. Request the least privilege needed for the operation.
5. Do not claim a scan is complete or clean from workflow success alone. Confirm the intended languages/components were extracted and analyzed when evidence is available.

## Choose the execution path

### GitHub code scanning setup

Start with default setup when the repository is eligible and the user does not need workflow-level control. Use advanced setup when the required customization cannot be expressed by default setup, such as explicit workflow orchestration or manual build steps.

Before changing setup type, explain the configuration impact and preserve the existing workflow/configuration when rollback matters. Do not silently enable, disable, or replace security configuration.

Load `references/workflow-configuration.md` for triggers, matrices, permissions, config files, query suites, monorepos, caching, or setup transitions.

### Compiled languages

Do not generalize build-mode support across CodeQL Action and CodeQL CLI: their supported `none` sets can differ. Determine the interface and language first.

Kotlin requires a build. For Java/Kotlin repositories, do not select `none` when Kotlin must be analyzed.

Load `references/compiled-languages.md` before choosing a build mode, runner, or manual build strategy.

### CodeQL CLI / external CI

Use the CodeQL bundle appropriate to the environment. The normal flow is:

1. create a database;
2. analyze it to SARIF;
3. optionally upload SARIF to GitHub code scanning.

Use `codeql resolve languages` and command `--help` output when installed-version behavior matters. Do not assume every compiled language needs `--command`; choose a supported build mode or traced build for the specific language.

Load `references/cli-commands.md` before producing nontrivial CLI commands or CI automation.

### SARIF

Use CodeQL-generated SARIF for local interpretation or upload. Treat GitHub ingestion limits and supported-property behavior as GitHub code-scanning concerns, not properties of the SARIF standard itself.

Load `references/sarif-output.md` for object structure, categories, fingerprints, limits, validation, or upload behavior.

### Alerts

Separate query severity, security severity, alert state, and repository merge-protection policy. Do not infer exploitability or remediation priority solely from one severity label.

Load `references/alert-management.md` for triage, dismissal, PR behavior, merge protection, or Autofix.

## Troubleshooting

Diagnose from evidence before changing configuration:

1. identify the failing stage: trigger, init/database creation, build/extraction, query analysis, SARIF upload, or alert presentation;
2. inspect the relevant logs/error text and intended language/component coverage;
3. apply the smallest change that addresses the observed failure;
4. rerun the affected stage where possible;
5. verify coverage, not just exit status.

Load `references/troubleshooting.md` for known failure signatures and diagnostic branches.

## Completion checks

Before presenting a configuration or fix:

- verify language identifiers and build mode against the chosen interface;
- keep workflow and CLI examples internally consistent;
- distinguish current documented facts from project-specific assumptions;
- identify any destructive/security-setting change before suggesting it;
- state what was verified and what still requires an actual CodeQL run;
- when a fact is release-sensitive, direct the user to current GitHub CodeQL documentation rather than freezing an unverified value into the answer.

## Reference map

Load only what the request needs:

- `references/workflow-configuration.md` — setup types, Actions triggers, permissions, matrices, config files, queries, monorepos.
- `references/compiled-languages.md` — Action/CLI build-mode support, Kotlin, runner/build decisions.
- `references/cli-commands.md` — bundle, database creation/analysis, SARIF upload, installed-version checks.
- `references/sarif-output.md` — SARIF structure and GitHub ingestion behavior.
- `references/alert-management.md` — alert semantics, triage, dismissal, PR/ruleset behavior.
- `references/troubleshooting.md` — evidence-led diagnosis and recovery.
