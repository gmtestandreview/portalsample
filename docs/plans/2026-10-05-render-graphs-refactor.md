# Graph renderer refactor plan

## Goal and architecture

Assess `skills/writing-skills/scripts/render-graphs.js` against a 100-point
rubric, then fix the six supplied Sonar findings while preserving its CLI and
rendering contracts. Keep one dependency-free Node script; extract focused fence
and DOT lexical helpers rather than introducing a parser framework. Graphviz
remains responsible for DOT grammar and SVG layout.

## Source inputs

- User findings: S3776 (complexity 17 and 57), S6557 (prefix comparison), S8786
  (two regexes), and S2310 (loop counter mutation).
- Renderer: CLI, parsing, Graphviz execution, artifact composition/writes.
- `skills/writing-skills/scripts/tests/test_render_graphs.py`: real Node and
  Graphviz regression tests.
- `skills/writing-skills/scripts/README.md`: documented output contract.
- `eslint.config.mjs`: explicit native ESM override for this script.

## Assumptions and unknowns

The requested threshold means refactor below 95/100. The target script and test
file already contain user work; preserve it. Server-side Sonar analysis returned
403; use a local rule analyzer if available and disclose any gap. Pytest's
default temporary directory is inaccessible; use a new directory under ignored
`.worktrees/`. No blocking design decision is required.

## Requirement traceability

| Requirement                                  | Task    |
| -------------------------------------------- | ------- |
| Architecture, purpose, goal, outcome, rubric | 1, 3    |
| Six supplied findings and dependency impacts | 1, 2, 3 |
| Refactor below threshold                     | 2       |
| Preserve current behavior and user work      | 1, 2, 3 |

## Framework fit

Use characterization tests for this behavior-preserving refactor and
input-boundary review for the scanner. No new dependencies, API contract,
service boundary, or consequential architecture decision is needed.

## Files and responsibilities

| Path                                                        | Action | Responsibility               |
| ----------------------------------------------------------- | ------ | ---------------------------- |
| `skills/writing-skills/scripts/render-graphs.js`            | Modify | Renderer                     |
| `skills/writing-skills/scripts/tests/test_render_graphs.py` | Extend | Parsing regression coverage  |
| `docs/skill-reviews/2026-10-05-render-graphs-review.md`     | Create | Assessment and evidence      |
| This plan                                                   | Create | Scope and execution guidance |

## Tasks

### 1. Establish contracts and baseline

Scan files for secrets before reading. Inspect upstream documentation,
downstream tests/artifacts, and the supplied findings. Save the exact current
renderer in the isolated worktree, and record original file hashes.

Run from the workspace root:

```powershell
python -m pytest skills/writing-skills/scripts/tests/test_render_graphs.py -q -p no:cacheprovider --basetemp .worktrees/render-graphs-pytest-baseline --tb=short
```

Observed baseline: 19 passed. Add black-box characterization cases for nested
braces, comments, quotes, invalid fences, long fence lines, and portable
filename trimming. Run them before refactoring; they should pass because they
record existing behavior. Any behavioral bug requires a failing regression
before changing that behavior.

### 2. Refactor lexical responsibilities

Work in `.worktrees/render-graphs-review`, initialized from HEAD with the
current renderer and tests copied in. Replace ambiguous fence matching with
bounded indentation and a linear marker scan. Compare closing marker prefixes
using `startsWith`. Extract DOT block construction from `extractDotBlocks`.

Replace the monolithic `assertOneGraph` loop with a cursor-based `while` loop
and focused skip helpers for quoted strings, line/block comments, and HTML
strings. Preserve escaped quotes, HTML attribute quotes/comments, nested braces,
and comments after a completed graph. Keep existing diagnostics. Trim filename
boundary dots by advancing indices and slicing once.

Run the renderer tests against the isolated copy. Run targeted ESLint,
formatting, Node syntax, and available local Sonar rules. Require cognitive
complexity at most 15 per function and no supplied rule findings. Request
independent code/input-boundary/test review, resolving supported defects.

### 3. Integrate and report

Before copying reviewed files back, compare source hashes against task-start
hashes. If changed externally, merge rather than overwrite. Run the final tests
against the actual workspace renderer and targeted static checks. Write the
assessment with evidence, before/after rubric, issue impacts, preserved
contracts, and limitations. Do not commit, publish, or alter policy.

## Safety, rollback, and verification

The main risk is scanner semantic drift. Real Graphviz integration tests and
input-boundary review protect labels, namespaces, error exits, and artifact
safety. Rollback uses the exact pre-task copy, never `git restore` on existing
user changes. Remove only task-created temporary outputs after validating their
absolute paths are under the intended worktree directories.

## Final validation and execution handoff

Self-review: 97/100; no critical failures. Requirements, exact paths,
characterization-before-refactor sequencing, implementation guidance,
verification, and rollback are specified. Execution is authorized by the user's
conditional refactor request. This plan is executed in the current session; the
final assessment records actual results, not expected results.
