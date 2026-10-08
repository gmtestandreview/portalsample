# Skills reference Python review plan

## Goal and source inputs

Review the current working copies of `parser.py`, `test_cli.py`,
`test_prompt.py`, and `test_render_graphs.py` under
`skills/writing-skills/scripts/`. Assess architecture, purpose, expected
outcomes, and upstream/downstream effects; remediate scores below 95.

The baseline is HEAD `ef53dd8f9700bfd6064b956a098a345ae1d8154c` plus existing
local edits. Preserve those edits. Python support starts at 3.11. Read
`pyproject.toml`, `ruff.toml`, CLI, model, validator, prompt, parser tests,
renderer, and scripts README as supporting evidence.

## Architecture and framework fit

Keep the existing synchronous parser-to-model boundary and independent
validator, JSON CLI, and XML prompt consumers. Renderer tests remain black-box
tests of Node and Graphviz. Use characterization tests for refactors, failing
regressions for demonstrated defects, and focused review agents. No new
dependencies or module boundaries are needed.

## Assumptions and unknowns

- Interpret the requested threshold as at least 95/100.
- No specific analyzer issue list was supplied; establish fresh evidence.
- Work in `.worktrees/skills-python-review-20261005`, overlaying the current
  scripts onto an isolated checkout and preserving a baseline.
- Pytest's default shared temporary directory is inaccessible. Use new,
  task-owned `--basetemp` directories; do not change test policy.

## Requirement traceability and files

| Requirement                           | Task | Files and responsibility                                    |
| ------------------------------------- | ---- | ----------------------------------------------------------- |
| Architecture and impacts              | 1    | Target files and their direct consumers                     |
| Safe parsing and clear types          | 2    | `scripts/skills_ref/parser.py`                              |
| CLI boundary regression               | 2    | `scripts/tests/test_cli.py`                                 |
| XML lookup narrowing                  | 3    | `scripts/tests/test_prompt.py`                              |
| SVG labels and subprocess portability | 3    | `scripts/tests/test_render_graphs.py`                       |
| Rubric and verification               | 4    | `docs/skill-reviews/2026-10-05-skills-ref-python-review.md` |

Paths beginning `scripts/` above are relative to `skills/writing-skills/`.

## Tasks

### 1. Establish baseline and contracts

Run the full script test suite from `skills/writing-skills/scripts`:

```powershell
python -m pytest -q tests --basetemp .pytest-temp-review-baseline
```

Observed: 141 tests pass. Run Ruff check/format and Pyright against all four
target files. Observed: Ruff clean; five Pyright errors concerning optional XML
text. Trace parser callers and verify graph evidence against source. Freeze
scoring weights before remediation.

### 2. Protect and repair parser boundary failures

Reproduce any demonstrated unhandled parser exception through all three CLI
commands before implementation. Add parameterized CLI regressions asserting exit
1, controlled `SystemExit`, an error on stderr, and no success payload on
stdout. Run the new tests before changing the parser. Keep catches at
`strictyaml.load`, translating only demonstrated parser failure classes into
`ParseError`.

Replace frontmatter `Any` with `object` at the untrusted boundary. Narrow
mapping keys, required strings, optional strings, and metadata values before
constructing `SkillProperties`. Preserve runtime dictionary shape, all optional
fields, error classification, and full-validator separation. Use existing
malformed-field tests and compare old/new valid outputs.

### 3. Refactor test boundaries

In `test_prompt.py`, use an assertion helper that requires XML text to exist
before calling `.strip()`. Preserve semantic assertions, escaping, and CR/LF
round trips. Explicitly write UTF-8 test fixtures.

In `test_render_graphs.py`, narrow actual SVG text nodes before appending to
`list[str]`; missing text must fail clearly rather than be coerced. Use UTF-8
subprocess decoding if portability review confirms the need. Preserve real
renderer/Graphviz execution and capability-specific skips. Strengthen CLI
stdout/stderr assertions where they guard the public success/error contract. Do
not normalize unrelated tests.

### 4. Verify and report

Run new regressions first, then full tests, compileall, Ruff check and format,
and Pyright against the final artifacts. Exercise Python 3.11 when dependencies
are available. Run Sonar file analysis if configured; distinguish unavailable
full analysis from successful secrets scans. Compare parser/model and CLI/XML
outputs using baseline and candidate on identical representative fixtures.
Record counts and exact limitations.

Create the report with per-file architecture, findings, classification, impact
chains, rubric breakdown, before/after scores, versions, test evidence,
compatibility results, and pressure status.

## Safety, rollback, and verification

Keep baseline copies in the isolated worktree. Before copying fixes back, verify
original target hashes still match the captured baseline. Copy only reviewed
files; rerun checks against the actual final working copies. Rollback only this
task's changes using the saved baseline; never reset existing edits. No policy
changes, commits, pushes, or deployment.

## Final validation and execution handoff

Requirement coverage, exact paths, characterization baseline, behavior
regressions before fixes, concrete commands, rollback, and no undefined
references: reviewed. Self-review: 97/100, no critical failures. Execute the
four tasks in order; parallel reviewers remain read-only. No blocking user
decision is required for compatibility-preserving fixes.
