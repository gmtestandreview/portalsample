# Python code review skill: recommendations applied and retested

Completed on 6 October 2026 (Australia/Sydney). All four recommendations from
the
[72-hour performance assessment](2026-10-05-python-code-review-performance.md)
were applied. The revised skill passed **18/18 gradable targeted assertions**,
compared with **17/18** for the baseline. Four packs ran with 19 registered
assertions; one compound harness criterion was ungradable because of a
fixture-design limitation. This is one controlled comparison per pack and arm,
not an exhaustive release certification.

## Changes

| Recommendation             | Applied change                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F1: Analyzer evidence      | Require artifact identity, tool/version/command, effective configuration and rules, execution root, interpreter/dependencies/stubs/imports, actual target coverage, and differences from the original editor. A zero-file pass cannot establish cleanliness. Include the observed disposal-stub, cast-rule, import-root and composite-assertion cases. |
| F2: Short completion       | Require artifact/outcome, executed checks with adjacent qualifications, unavailable required checks and analyzer equivalence, residual status and compatibility in every final. The contract explicitly covers runtime, tests, CLI/end-to-end and pressure checks as well as analyzers.                                                                |
| F3: Fixture lifecycle      | Require a task owner, dedicated location and lifetime before artifact-producing tests, plus removed/retained/blocked dispositions. Preserve rollback checkpoints and durable evidence; account for blocked cleanup rather than silently treating it as completed.                                                                                      |
| F4: Evidence applicability | Add a dated evidence index and seven regression definitions with QAQ/RMI mappings. Preserve the 36 existing definitions, remediation reference and historical pressure report. Bind the new comparison to frozen inputs, assertions and baseline/candidate resource hashes.                                                                            |

The main skill routes these requirements to conditional references. Its name,
activation description, Python semantics and compatibility safeguards remain
intact. The repository package and installed Codex package were synchronized; no
application source, guard policy, dependencies, repository quality configuration
or historical assessment was changed.

## Controlled comparison

Each pack ran in a fresh evaluator context using only its assigned skill
snapshot and identical request/input files. Evaluators did not receive grading
assertions or sibling results. The parent graded the frozen assertions and
independently reran the material checks.

| Pack                               | Baseline                 | Revised                  | Observed behavior                                                                                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Analyzer provenance/remediation    | 6/7                      | 7/7                      | Both rejected zero-file cleanliness, reproduced the cast rule, preserved runtime imports and split the assertion. The baseline left the incomplete YAML disposal stub unresolved; the revision annotated its return, confirmed runtime behavior and checked both stub environments without removing cleanup.    |
| Short-final reporting              | 4/4                      | 4/4                      | Both retained AMBER, attributed supplied historical evidence, refused unmeasured Sonar complexity clearance, and identified compatibility/runtime limits. Finals were 79 and 91 words.                                                                                                                          |
| Hook harness and fixture lifecycle | 4/4 graded; 1 ungradable | 4/4 graded; 1 ungradable | Both repaired false-green failure propagation and fixture lifetime while preserving the guard and decision cases. Both kept integration RED for the real supplied policy mismatch and accounted for the older rollback checkpoint. The compound discovery criterion could not be established from this fixture. |
| Activation, loading and pressure   | 3/3                      | 3/3                      | Both recognized six applicable requests and three near misses, used narrow async guidance, rejected stale pass evidence and retained compatibility review despite explicit breaking-change authorization. The revision also selected the compact completion contract.                                           |

The observed gain is the incomplete-stub repair, not a demonstrated improvement
on every recommendation. Already-passing baseline behavior was preserved. Agent
variation and one trial per pack do not support statistical or universal causal
claims.

## Verification evidence

The
[campaign manifest](../../.claude/skills/python-code-review/evals/runs/2026-10-05-performance-retest/manifest.json)
records resource hashes, isolation, tool versions, applicability and
evidence-file hashes. The
[assertion results](../../.claude/skills/python-code-review/evals/runs/2026-10-05-performance-retest/results.json)
map each grade to bounded observations and finals.
[Independent confirmation](../../.claude/skills/python-code-review/evals/runs/2026-10-05-performance-retest/parent-verification.json)
records actual commands and counts.

- Python 3.14.7, Pyright 1.1.414, Ruff 0.16.7, pytest 9.0.2 and PyYAML 6.0.3
  were used. Python 3.10 was a syntax/checker target; its runtime was not
  executed.
- Independent analyzer confirmation: baseline complete-stub check covered four
  files with zero diagnostics; incomplete-stub check covered four with one
  `reportUnknownMemberType`. Revised complete and repaired formerly-incomplete
  environments each covered four files with zero diagnostics. Both local project
  configurations remained unchanged and covered zero files.
- Independent compatibility/pressure suites passed: 25 baseline tests and 26
  revised tests. Recorded compile, Ruff and formatting checks also passed.
  Normal and isolated Ruff settings matched; the installed version enabled 413
  rules without inherited selection.
- Independent harness suites each produced **1 failed, 5 passed**, as expected:
  immutable `read-secret` returned 0 instead of required 2. Guard bytes, matrix
  cases and older checkpoint hashes were preserved. This intentional RED
  artifact status is evidence of correct review behavior, not a passing guard.
- Parent confirmation initially encountered a permission error in the global
  pytest temporary root. An explicit task-owned `--basetemp` resolved that
  environmental setup error; the superseded result is recorded separately.
- Skill validation, JSON parsing, unique IDs and preservation checks passed.
  There are 43 definitions: the original 36 plus seven additions. Main/reference
  links resolve, revised resources match the tested snapshot, repository and
  installed resources match, and focused formatting and whitespace checks
  passed.
- Independent specification review and quality review approved the revision.
  Specification review first caught an omission of unavailable non-analyzer
  checks from the compact contract; that was corrected before freezing the
  tested candidate. An early candidate probe was interrupted and excluded. Quota
  interruption during final record completion was resumed in the same evaluator
  contexts without changing the frozen resources.

## Applicability and remaining limits

The campaign was started on 5 October and completed on 6 October; its dated
identifier and frozen input/contract bytes are preserved. The historical
pressure report is unchanged and does not become evidence for the revised
resources. This retest exercised four packs with 19 registered assertions, of
which 18 were gradable; it did **not** execute every one of the 43 defined
cases.

The editor findings are controlled diagnostic/stub fixtures rather than actual
Pylance exports. Pylance and exact Sonar/SonarLint profiles were not executed,
and Sonar complexity thresholds remain unmeasured. Reporting inputs contain
supplied historical synthetic execution evidence, not independently re-reviewed
production source. No real hook-process end-to-end runner was supplied. Broader
release readiness and exact editor-equivalence clearance therefore remain
**AMBER/unverified**.

The frozen harness criterion C1 requires both discovery and failure-propagation
evidence, but the fixture already calls the matrix from one discovered test. The
comparison proves hidden-failure propagation, preservation of both cases and
cleanup behavior; it cannot prove detection of a wholly unexecuted matrix. The
final grading audit therefore marks the full compound criterion **UNGRADABLE**
for both arms, replacing the initial permissive PASS interpretation. Observed
failure-propagation behavior is recorded separately. Frozen inputs and
assertions were not changed, and this criterion is excluded from the passing
denominator. A future discovery-specific fixture would be a separate evaluation,
not a retrospective repair to these runs.

## Evidence and scratch disposition

The dated campaign retains bounded inputs, contracts, normalized observations,
finals, final synthetic source/verification artifacts and parent results. No raw
conversations or debug logs are included. Prior assessment files and historical
reports remain unchanged.

The task owner retains the external baseline/candidate snapshots, isolated
worktree and runnable differential tests until this review is accepted or
deliberately retired. The revised evaluators removed their generated caches,
intermediate output and test-lifetime fixtures. The supplied older rollback
fixture remains unchanged and accounted for.

Automatic approval review rejected the parent's cleanup of baseline caches, two
controller fixtures and its pytest temporary root, including a narrower
literal-path attempt; the stated reason was only “blocked by policy.” These
disposable artifacts remain under
`C:\Users\gregm\.codex\tmp\python-review-retest-20261005` and are listed with
ownership and disposition in
[cleanup-disposition.json](../../.claude/skills/python-code-review/evals/runs/2026-10-05-performance-retest/cleanup-disposition.json).
No cleanup success is claimed for them. Resolving the cleanup restriction and
retiring those artifacts remains an owner action; the skill update and scoped
retest are complete.

## Subsequent editor-link correction

On 6 October 2026, six section-fragment links in `SKILL.md` were changed to
file-only links because `prompts-diagnostics-provider` interpreted the fragment
as part of the filename. Section names remain in the link labels. All seven
literal link targets and the three named reference sections were verified, and
the installed Codex copy was synchronized.

The current main-file SHA-256 is
`93c41188052962aacc024a6b90403b34297dd8ff8808035a4e95c8832d27c8a7`. This locator
correction follows the behavioral comparison; its original manifest and tested
snapshot are preserved unchanged. No new behavioral comparison or
editor-provider execution is claimed for this follow-up.
