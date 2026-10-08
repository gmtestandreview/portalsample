# Python report and regression contract review

## Goal and architecture

Review the three requested Python files and repair demonstrated defects below
the frozen 95-point threshold. Keep JSON validation separate from rendering;
preserve training-only winner selection and independently recoverable metrics.
Use Python, unittest, JSON Schema, Ruff, mypy, and Pyright already installed.

## Source inputs

- User's Python review request and python-code-review skill.
- `.claude/skills/skill-creator/scripts/generate_report.py`.
- `.claude/skills/skill-creator/scripts/run_loop.py`: upstream report producer.
- `.claude/skills/skill-creator/scripts/aggregate_benchmark.py`: metric
  recovery.
- Requested tests under `scripts/Regression tests/` in that same skill.
- `agents/comparator.md` and `references/schemas/comparison.schema.json`.

## Assumptions and unknowns

Assess current working copies, including pre-existing edits, against Python 3.10
syntax and local Python 3.14.7. Specific supplied analyzer rules are absent;
fresh CLI diagnostics are the evidence. Sonar quality analysis is unavailable on
this connection. Schema semantics and command-line flags remain stable.

## Frozen rubric and traceability

| Criterion                              | Points | Task    |
| -------------------------------------- | -----: | ------- |
| Runtime and semantic correctness       |     25 | 1, 2, 3 |
| Type architecture                      |     20 | 1, 2    |
| Boundary validation and error handling |     15 | 1, 2, 3 |
| Static-analysis quality                |     15 | 4       |
| Maintainability and complexity         |     10 | 1, 2, 3 |
| Determinism and performance            |      5 | 1, 3    |
| Compatibility and CLI preservation     |      5 | 1, 4    |
| Verification evidence                  |      5 | 4       |

## Framework fit and files

Use test-first contract repairs, without new dependencies in the repository.
Edit the requested files; add `test_generate_report.py` beside the requested
tests. Repair the demonstrated upstream defects in `aggregate_benchmark.py` and
the JSON example in `agents/comparator.md`. Create a durable review under
`docs/skill-reviews/`. Leave policy and schema definitions unchanged.

## Tasks

1. Add report regressions for null holdout results, training-only selection,
   missing observations, HTML escaping, and malformed inputs. Run
   `python -m unittest discover -s '.claude/skills/skill-creator/scripts/Regression tests' -p 'test_generate_report.py'`.
   Observe contract failures before normalizing only null holdout data,
   rendering neutral missing cells/scores, and selecting by training verdicts.
2. Preserve the two failing documented-example regressions. Repair the JSON
   reasoning string upstream; type the validated example boundary and verify
   dimension means, shared rubric criteria, and counts. Run the same discovery
   command with `-p 'test_comparison_schema.py'`; expect every test to pass.
3. Add paired independent-field recovery cases in `test_aggregate_benchmark.py`.
   Observe valid duration/tokens disappearing when the sibling is invalid.
   Separate field validation in `load_timing_file`. Preserve zero precedence.
   Run discovery with `-p 'test_aggregate_benchmark.py'`; expect all cases
   green.
4. Run focused tests, existing script regressions, compile checks, Ruff, mypy,
   Pyright, CLI file/stdin/error smoke, and old/new valid-fixture differential
   comparisons. Request independent Python/security review. Report unavailable
   Sonar quality evidence without claiming it passed.

## Safety, rollback, and verification

Work in `.worktrees/python-report-review`, copied from current skill files.
Checkpoint the four originally requested/upstream files in the task's temporary
backup directory. Transfer only reviewed file patches after verification and
confirm originals still match the checkpoint; preserve unrelated dirty edits. No
deployment, commit, schema migration, or policy change is required.

## Final validation and execution handoff

Paths, requirements, sequencing, test-first steps, rollback, and commands
checked against the repository. Self-review: 97/100; no critical gaps. Proceed
with executing-plans for the authorized refactoring. No blocking human
decisions. Score final artifacts only after fresh verification.
