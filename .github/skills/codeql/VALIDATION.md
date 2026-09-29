# Static validation report

Candidate: codeql-skill-pack-v2

Checks performed:

- PASS: SKILL.md YAML frontmatter parsed.
- PASS: required `name` and `description` present and within supplied specification limits.
- PASS: `name` syntax valid.
- PASS: SKILL.md body under 200 lines.
- PASS: every reference path named in SKILL.md exists.
- PASS: no known contradictory `java-kotlin` + `build-mode: none` example.
- PASS: no universal “compiled languages require --command” rule.
- PASS: references have explicit load conditions and scoped responsibilities.
- PASS: safety boundaries cover untrusted build execution, credentials, permissions, security-setting changes, and unverifiable coverage.
- NHR: representative agent activation/near-miss runs were not executed.
- NHR: CodeQL CLI/workflow commands were not executed against a repository in this environment.

Static rubric assessment: 98/100.
Deployment gate: blocked by required execution-dependent evidence if deployment requires demonstrated behavioral/deterministic runs.

## Atomic authoritative-source review — 2026-09-29

PASS — OASIS SARIF authority is separated from GitHub ingestion behavior.
PASS — SARIF top-level `version` and `runs` requirements recorded from the Errata 01 normative schema.
PASS — `$schema` is correctly optional and version-consistent when present.
PASS — GitHub categories, directory `runAutomationDetails.id`, and `partialFingerprints` behavior are separated from SARIF conformance.
PASS — current supplied GitHub upload example alignment uses `github/codeql-action/upload-sarif@v4` and `actions/checkout@v6`.
PASS — `analyze` vs `upload-sarif` responsibilities are explicit; duplicate upload guidance is prohibited.
PASS — `setup-codeql` is labeled experimental and limited to CLI installation without database initialization.
PASS — CodeQL Action/bundle version guidance points to current releases; nightly is not a production default.
PASS — advanced-workflow/upload permission guidance is tightened to current repository documentation.
NHR — no live GitHub Actions run or CodeQL CLI execution was performed.

Revised static rubric assessment: 99/100.

## Pressurized testing campaign — 2026-09-29

PASS — 18 representative evaluation cases seeded across activation, pressure, reference, and regression groups.
PASS — 11 deterministic written-policy pressure assertions executed against v3 and passed.
NHR — RED without-skill agent baseline unavailable: no clean subagent/eval runner exposed.
NHR — GREEN with-skill agent runs unavailable for the same reason.
NHR — activation/resource-discovery behavior remains unexecuted.
Deployment remains blocked by behavioral NHR.

## SARIF atomic review — 2026-09-29

PASS — frontmatter
PASS — refs_resolve
PASS — 10mb_gzip
PASS — full_limits
PASS — soft_hard
PASS — token_matrix
PASS — invalid_branch
PASS — ghas_branch
PASS — default_setup_branch
PASS — nondeterminism
PASS — troubleshoot_routes
PASS — 7 additional SARIF pressure cases seeded.
NHR — live GitHub SARIF upload/API execution unavailable.
NHR — behavioral RED/GREEN runner unavailable.
