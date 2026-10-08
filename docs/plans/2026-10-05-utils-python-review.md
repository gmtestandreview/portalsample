# Skill metadata parser review plan

## Goal and architecture

Assess and repair the current skill-creator metadata reader. Preserve
`parse_skill_md(Path) -> tuple[str, str, str]`, missing-field defaults, UTF-8
reads, and complete content. Use one PyYAML SafeLoader document for constructed
values and effective scalar styles, with bounded errors.

## Source inputs

- User diagnostics: six Pylance Unknown diagnostics at lines 35, 51, 52; Sonar
  `python:S3776`, supplied complexity 21 versus threshold 15.
- `.claude/skills/skill-creator/scripts/utils.py`: reviewed working copy.
- `.claude/skills/skill-creator/scripts/Regression tests/test_utils.py`:
  existing unittest contract coverage; 11 tests pass before changes.
- `run_eval.py`, `run_loop.py`, `generate_eval_review.py`, and
  `improve_description.py` in the same scripts directory: consumers.
- `ruff.toml`: Python 3.10 floor, 100-column lines, lint families
  E/F/I/UP/B/SIM. Explicit file checks must bypass vendored exclusion.

## Assumptions and unknowns

- Work on the dirty working copy, never restore HEAD over user changes.
- No public signature, dependency manifest, policy, or caller edits.
- Preserve PyYAML duplicate-key last-value-wins and merge precedence.
- Correct style normalization and bound malformed-tag errors; these are
  intentional behavior corrections, covered by RED tests.
- Exact Pylance version/profile and diagnostic timestamps were not supplied.
  Strict Pyright 1.1.414 reproduces all six diagnostics.
- Sonar CLI 1.7.0 full analysis returns 403; the exact final S3776 result
  remains unavailable. This limits the final pressure status.
- Local Python is 3.14.7, PyYAML 6.0.3. Verify 3.10 syntax/type semantics; an
  actual Python 3.10 runtime is not yet evidenced.

## Requirement traceability

| Requirement                                      | Task    |
| ------------------------------------------------ | ------- |
| Purpose, architecture, goal, expected outcome    | 1, 3    |
| Fixed rubric out of 100; refactor at 95 or below | 1, 2, 3 |
| Supplied analyzer findings                       | 1, 2, 3 |
| Upstream/downstream impacts                      | 1, 3    |
| Compatibility and regression evidence            | 2, 3    |

## Framework fit

Use a module-level dependency map and test-first repair. A new service, schema
migration, ADR, or application framework is unnecessary.

## Files and responsibilities

| Path                                                                  | Action  | Responsibility                              |
| --------------------------------------------------------------------- | ------- | ------------------------------------------- |
| `.claude/skills/skill-creator/scripts/utils.py`                       | Modify  | Parser                                      |
| `.claude/skills/skill-creator/scripts/Regression tests/test_utils.py` | Extend  | Behavioral regression and boundary tests    |
| `docs/skill-reviews/2026-10-05-utils-python-review.md`                | Create  | Rubric, findings, impacts, verified results |
| `.worktrees/skill-utils-review-20261005`                              | Isolate | Candidate using copied current scripts      |

## Task 1: Freeze provenance and reproduce

1. Secret-scan files before inspection. Record SHA-256 and preserve
   `utils.before.py` and `test_utils.before.py` outside the workspace.
2. Establish the 11-test baseline and compile the original.
3. Use temporary strict Pyright configuration targeting Python 3.10; confirm the
   supplied Unknown diagnostics before remediation.
4. Verify the four production callers in source. Trace downstream validation,
   serialization, generated metadata, and error handling.
5. Freeze weights: correctness 25, types 20, validation 15, static analysis 15,
   maintainability 10, performance 5, compatibility 5, verification 5. Score the
   original after baseline/pressure evidence.

## Task 2: Test and repair the parser

1. Add regression fixtures to `ParseSkillMdTests` for a block description
   followed by a duplicate quoted `"last\\n"`, an inherited block description,
   and malformed explicit bool/timestamp/int/float tags.
2. Run from the isolated worktree:

   ```powershell
   python -m unittest discover -s '.claude/skills/skill-creator/scripts/Regression tests' -p test_utils.py -v
   ```

   Expected RED: duplicate and merged descriptions mismatch literal newline
   expectations; malformed tags escape the ValueError contract.

3. Add characterization cases for final block duplicates, aliases, merge
   overrides, empty/null documents, delimiters, and unchanged content.
4. Extract delimiter slicing, YAML construction/error normalization, and
   effective description style into cohesive private helpers.
5. Construct with `SafeLoader.get_single_node()` and `construct_document()`
   once; always dispose in `finally`. Catch PyYAML/ValueError/RecursionError and
   the demonstrated KeyError/AttributeError/IndexError only at that dependency
   boundary.
6. Keep YAML data as `object`, check dictionary shape, then narrow to
   `dict[object, object]`. Check metadata strings before returning. Narrow the
   library's incomplete MappingNode entry typing locally to its documented
   node-pair structure; do not suppress diagnostics.
7. Resolve description style from the last matching node after merge flattening.
   Trim trailing newlines only for literal/folded scalars.
8. Re-run original RED cases, then all parser tests. Expected: all pass.

## Task 3: Verify and report

1. Explicitly run Ruff check/format against both edited Python files.
2. Run strict Pyright against final `utils.py`, Python version 3.10; expected
   zero diagnostics with types-PyYAML available.
3. Compile and run affected existing parser/consumer regression tests. Use
   synthetic fixtures; do not initiate paid Claude evaluations.
4. Differential-test original and candidate on valid/malformed YAML, comparing
   tuples and exceptions. Only documented fixes may differ.
5. Pressure-test unsafe tags, null/nonstring metadata, complex keys, malformed
   input, CRLF, aliases, duplicate/merge precedence, missing files, and
   directory/file mismatch. Inspect bounded diagnostics.
6. Obtain independent code/Python/security review; resolve supported findings
   and re-run affected checks. At most three repair cycles.
7. Verify root files still match baseline hashes before copying back only
   candidate `utils.py` and `test_utils.py`. Verify again in root.
8. Write the final report with before/after rubric, exact evidence,
   compatibility corrections, and unavailable Sonar/Pylance checks.

## Safety, rollback, and verification

- The worktree is under an already ignored `.worktrees` directory.
- Preserve all pre-existing edits. No commits, pushes, or deployments.
- Restore only this task's edits from the saved working-copy checkpoint if
  needed; never reset other work or replace files changed concurrently.
- Temporary diagnostics and debug artifacts are removed when no longer needed.
  Keep the durable review and plan.
- Final status stays AMBER if exact required analyzer evidence is absent; a
  score is an engineering assessment, not production certification.

## Final validation and execution handoff

- Requirements, exact paths, test-before-repair order, commands, implementation
  guidance, and rollback: checked in local self-review.
- Local plan rubric: 98/100, zero critical failures. Independent plan review
  must precede implementation.
- Plan: `docs/plans/2026-10-05-utils-python-review.md`.
- Execution: authorized repair in an isolated worktree, then copy back only
  verified changes. No blocking contract decision is outstanding.

## Execution evidence

Independent plan review approved at 97/100 with zero critical failures. The
implementation retains the composed root through a typed SafeLoader subclass;
`get_single_data` performs construction internally, avoiding the incompletely
typed low-level `construct_document` call site.

Final root verification: 85/85 selected regressions pass, 21/21 parser tests
also pass on Python 3.10.19, strict Pyright reports zero diagnostics, and Ruff
check/format pass. Compatibility and independent review evidence, exact
commands, rubric results, and remaining Sonar limitations are in
`docs/skill-reviews/2026-10-05-utils-python-review.md`.
