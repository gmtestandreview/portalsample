# Python review performance fixes and retest plan

## Goal and architecture

Apply all four recommendations in
[the performance assessment](../skill-reviews/2026-10-05-python-code-review-performance.md).
Keep the existing Python review discipline and activation scope. Add concrete
analyzer evidence, concise completion and scratch-lifecycle contracts, plus
revision-bound regression evidence. Use one current-skill baseline and one
candidate in separate evaluator contexts.

## Source inputs

- `.claude/skills/python-code-review/SKILL.md`, its references and 36 evaluation
  definitions.
- The performance assessment and its source manifest.
- `writing-skills`, `skill-creator`, and their behavioral evaluation methods.
- Historical September pressure evidence is preserved unchanged.

## Assumptions and unknowns

The user authorizes applying and retesting the recommendations. Preserve
pre-existing work and repository policy. Current installed Codex resources match
the repository baseline. Equivalent Pyright fixture checks are available; exact
VS Code Pylance and Sonar editor execution are not assumed available. Isolated
agents can run bounded comparison scenarios; these are scoped skill evaluations,
not exhaustive platform/readiness certification.

## Requirement traceability

| Requirement                                                           | Task    |
| --------------------------------------------------------------------- | ------- |
| F1: effective analyzer environment and nonempty coverage              | 1, 2, 3 |
| F2: qualified concise completion                                      | 1, 2, 3 |
| F3: task-owned fixtures and explicit disposition                      | 1, 2, 3 |
| F4: preserve history, revision-bound current evidence and added cases | 1, 2, 3 |
| Actual skill used matches revised source                              | 4       |

## Framework fit

Use test-first discipline documentation changes, frozen evaluator expectations,
independent implementation/review, and hash-checked integration. No new
production framework, source-code analyzer, policy change, or dependency is
required.

## Files and responsibilities

Paths below are relative to `.claude/skills/python-code-review/` unless stated
otherwise.

| File                                                         | Responsibility                                                                               |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `SKILL.md`                                                   | Route analyzer, completion, scratch and evidence requirements without broadening activation. |
| `references/ruff-pyright-verification.md`                    | Analyzer evidence record and acceptance gates.                                               |
| `references/review-reporting.md`                             | Short-final contract, adjacent qualifications and scratch disposition.                       |
| `references/python-general-review.md`                        | Fixture ownership/lifetime and safe cleanup rules.                                           |
| `evals/cases.json`, `evals/qaq-rmi.md`                       | Extend existing regressions and static branch mappings.                                      |
| `evals/evidence-applicability.md`                            | Dated applicability index preserving September evidence.                                     |
| `evals/runs/2026-10-05-performance-retest/`                  | Frozen contracts, inputs, observations, grading and revision manifests.                      |
| `docs/skill-reviews/2026-10-05-python-code-review-retest.md` | Changes, executed results and limitations.                                                   |

## Tasks

### 1. Freeze baseline and comparison contracts

Create ignored sparse worktree `.worktrees/python-skill-performance-20261005`
from HEAD and overlay the current skill. Preserve original bytes under
`C:/Users/gregm/.codex/tmp/python-review-retest-20261005/baseline/python-code-review`.
Hash all eight resources and confirm current frontmatter, paths, case IDs and
JSON structure before editing.

Freeze assertions before evaluator runs. Cover three task packs: analyzer
environment/stub/rule/import drift and zero-file results; pressured short
completion with unavailable editor analyzers; collected harness failures plus
scratch disposition and blocked-cleanup variant. Add negative
activation/resource-loading scenarios as a fourth routing pack. The harness
assertions require exposing the undiscovered matrix, making a deliberate failure
fail pytest, and retaining the known guard failure. Record the exact
skill-resource paths each evaluator received and loaded. Execute old-skill tasks
in clean agents with only baseline access. Existing user corrections establish
historical RED; new baseline results must be reported as observed even if they
pass.

### 2. Apply minimal guidance and scenario changes

One implementation agent owns the candidate skill package. Required analyzer
record: artifact/hash, tool/version, root, effective configuration and rule
overrides, interpreter/dependencies/stubs/import roots, files actually analyzed,
supplied-editor differences, and outcome. Zero-file or ignored-target checks
cannot establish clean status. Preserve local policy and diagnose uncertainty
upstream.

Require concise finals to contain artifact/outcome, executed checks with
qualifications, unavailable/non-equivalent checks, and residual
pressure/compatibility status. Add task-owned scratch planning before
artifact-generating tests and removed/retained/blocked disposition at
completion, preserving recovery and unrelated files.

Extend regression definitions for the four reported diagnostic variants,
zero-file evidence, concise qualifications and fixture ownership. Add the
applicability index; keep historical evidence and existing definitions intact.
Include current candidate/reference hashes in actual run evidence. Independent
spec review precedes quality review; resolve material issues before integrating.

### 3. Retest candidate and relevant regressions

Run identical task packs against the revised frozen candidate in fresh agents.
Capture observable outputs, executed checks and identified resource loads; grade
against the pre-frozen assertions. Store each arm separately and distinguish
supplied evidence, simulated fixtures, actual tool execution and missing editor
equivalence. Run multiple positive/negative activation cases and existing
evidence/compatibility/material-RED scenarios as scoped regression probes. No
baseline agent receives candidate resources or authoring history.

Validate JSON, unique case IDs, frontmatter constraints, local links, resource
hashes, unchanged historical bytes, final claims and scratch dispositions. Run
targeted Prettier using the root installation:
`node node_modules/prettier/bin/prettier.cjs --check <changed Markdown and JSON files>`.
Run `sonar analyze secrets <file>` before workspace reads and against final
files. Do not describe these as Sonar Python quality or behavioral passes.

### 4. Integrate verified resources and record result

Hash-check original repository and installed resources against the captured
baseline before copying only candidate skill changes and their durable
evaluation records back. The retest report is created explicitly in the original
repository's `docs/skill-reviews/2026-10-05-python-code-review-retest.md`.
Refresh the already-installed Codex copy from the verified repository skill,
preserving a rollback checkpoint and avoiding installer policy changes. Rerun
structural, formatting, resource/evidence consistency and equality checks
against the final copies. Record actual evaluation results and unresolved gates
in the retest report. No commit, push, publication or production deployment is
requested.

## Safety, rollback and verification

Edits are reversible process-documentation changes. Worktree and external
baseline preserve recovery. No broad cleanup: remove only exact task-generated
scratch targets after validating their absolute paths; durable eval
inputs/results and named rollback snapshots may remain. Preserve the old
performance report and its manifest as dated evidence. Restore only files
changed in this task if rollback is needed; never reset the workspace.

## Final validation and execution handoff

Self-review checks requirement coverage, exact paths, baseline-before-candidate
sequence, observable assertions, two-stage review, rollback and claim
boundaries. Planned checks are not PASS until executed. Use clean-context
evaluator agents and one implementation owner. No additional user approval is
needed for the authorized revisions and retest; missing exact editor execution
limits the conclusion rather than preventing bounded work.
