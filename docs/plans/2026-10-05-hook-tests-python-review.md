# Hook test Python review and refactor

## Goal and architecture

Assess and improve the four hook test files without changing the guard's
security policy or local hook registration. Use real subprocess contracts,
pytest discovery, typed fixture matrices, and temporary directories with bounded
subprocess lifetimes. Keep existing expectations, including those that currently
expose upstream failures.

## Source inputs and assumptions

- User's Python review request and three pasted Pylance diagnostic exports (no
  analyzer version or timestamp supplied).
- Current worktree based on `ef53dd8f9700bfd6064b956a098a345ae1d8154c`; existing
  edits in the pre/post test files and untracked wrapper test are the
  authoritative baseline.
- `ruff.toml`: Python 3.10 floor, 100 columns, E/F/I/UP/B/SIM rules. Local
  Python 3.14.7, Ruff 0.16.7, Pyright 1.1.414.
- `scripts/pre_tool_use.py`, `scripts/post_tool_use.py`,
  `scripts/process_utils.py`, both watcher implementations, and local
  `.claude/settings.json` inspected after secrets scans.
- Baseline pytest: 11 passes, but pre-tool and wrapper matrices are
  undiscovered. Direct guard matrix: 13 failures. Wrapper matrix with Git Bash
  available: 2 failures.
- Local settings are optional and absent from a fresh checkout. Tests must
  distinguish unavailable local integration from verified integration.

## Requirement traceability and files

| Requirement                                    | Files and task                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Purpose, architecture, score and impact review | Final review report in `docs/skill-reviews/2026-10-05-hook-tests-python-review.md`                           |
| Typed fixtures and diagnostics                 | Task 1: `tests/hooks/test_pre_tool_use.py`, `tests/hooks/test_wrapper.py`, `tests/hooks/test_watcher_pid.py` |
| Honest pytest discovery and resource cleanup   | Task 1: pre-tool/wrapper matrices; Task 2: watcher assertions and subprocesses                               |
| Watcher regression protection                  | Task 2: watcher AST and both real liveness helpers                                                           |
| Post-tool boundary behavior                    | Task 3: `tests/hooks/test_post_tool_use.py`                                                                  |
| Fresh verification                             | Task 4: all four files, compile, Ruff, strict Pyright, direct CLI, differential and pressure checks          |

## Framework fit

Small test-harness repair: no new runtime abstraction, API schema, dependency,
datastore or ADR. Real hook inputs remain JSON on stdin; outputs and exit codes
remain unchanged upstream. pytest is already available and used by the existing
post-tool tests.

## Tasks and ordering

1. Preserve original four files in the ignored isolated worktree
   `.worktrees/hooks-python-review-20261005/hook-review-baseline`. Run all
   baseline commands. Add typed matrix annotations and pytest parameterization
   to the pre-tool and wrapper tests. Replace import-time temporary
   directories/source reads with per-test reads and `TemporaryDirectory`
   contexts. Set subprocess cwd to test-owned directories. Retain guard decision
   expectations. Correct stale wrapper crash expectations to the existing
   configured fail-closed policy and verify secret blocking by exit code; do not
   change that policy or depend on an invented diagnostic label.
2. Demonstrate watcher false-green with `check('injected failure', False)` and
   demonstrate missed module-level `os.kill(pid, 0)` with the existing AST
   helper. Change checks to assertions; use a scope-aware AST visitor that
   includes module-level calls without duplicate nested attribution. Add
   regression fixtures for module, nested function and ordinary non-probe calls.
   Replace unresolvable imports with `scripts.process_utils` and support direct
   invocation at the CLI boundary. Exercise both maintained and distributed
   helpers in real child processes; kill and reap test children in bounded
   cleanup.
3. Keep all six post-tool tests. Parameterize malformed/wrong-root/wrong-field
   and failure-result inputs. Isolate subprocess cwd; skip only the optional
   local-settings registration test when settings are absent. Preserve exact
   successful PostToolUse output assertions.
4. Run `python -m compileall -q tests/hooks`, `ruff check tests/hooks`,
   `ruff format --check tests/hooks`, and strict Pyright with an external
   temporary configuration limited to these four files. Run
   `python -m pytest -q tests/hooks` and direct pre-tool/watcher/wrapper CLIs.
   Compare old/new upstream decisions on identical matrices and verify
   temporary-directory cleanup. Request independent Python/code review, apply
   supported fixes, and copy only reviewed test files back after checking
   baseline hashes. Repeat final checks there; write the report with actual
   counts and unresolved upstream failures.

## Safety, rollback and expected verification

Changes affect tests only. They intentionally make pytest detect failures it
previously missed, which may turn a previously green gate red. No changes to
`.claude/settings.json`, guard policy, watcher runtime, package scripts or
analyzer configuration. Never execute destructive fixture commands: send them
only as JSON to the guard. Temporary fixture logs are deleted with their owning
directories. The baseline copy permits restoration of this task's changes while
preserving prior work.

Expected: lint/format/compile/type checks pass; post-tool and wrapper tests
pass. Watcher tests reproduce both live/released behavior and the newly
demonstrated exited-process/open-handle defect. Existing guard mismatches and
watcher defects are detected and reported, not suppressed. Exact Pylance
extension-version equivalence and POSIX runtime evidence may be unavailable and
must be disclosed.

## Final plan validation and handoff

Requirement coverage, exact paths, test-first reproductions, commands,
sequencing and rollback reviewed. No critical plan failures; self-review score
97/100. Execute using the executing-plans workflow in the isolated worktree,
then integrate only the four scoped files and this report into the user's
working tree. No commit, push or merge is requested.
