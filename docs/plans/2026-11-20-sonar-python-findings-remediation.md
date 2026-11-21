# Sonar Python findings remediation plan

**Goal:** Resolve the explicitly reported static-analysis findings in the listed
Python scripts without changing their observable behavior or weakening security
checks.

**Base:** Record the current `HEAD` before each task. The working tree already
contains unrelated user changes; do not revert, stage, or edit them.

## Global constraints

- Touch only files named by the current task, plus this plan and SDD ledger
  artifacts.
- Preserve report schemas, command behavior, process cleanup, and test intent.
- Do not use broad lint suppressions, `# noqa`, or `# nosec` as a substitute for
  a code fix. If an intentionally user-driven subprocess boundary cannot be made
  statically provable without changing the tool contract, document the narrow
  exception in the task report and ledger for final review.
- Keep authored text in English and use Python 3.14-compatible syntax.
- Run focused regression tests for each task, then run the repository's relevant
  Python checks at `HEAD`.

## Task 1: Harden skill-creator imports, types, and test fixtures

Files:

- `.claude/skills/skill-creator/scripts/Regression tests/test_improve_description.py`
- `.claude/skills/skill-creator/scripts/Regression tests/test_run_eval.py`
- `.claude/skills/skill-creator/scripts/Regression tests/test_run_pipeline.py`
- `.claude/skills/skill-creator/scripts/run_early_exit_eval.py`
- `.claude/skills/skill-creator/scripts/run_eval.py`
- `.claude/skills/skill-creator/scripts/run_pipeline.py`
- `.claude/skills/skill-creator/scripts/run_readiness_pressure_eval.py`

Resolve the reported dynamic-import, TypedDict inheritance, `CompletedProcess`,
B105 boolean-literal, broad-exception, and five strict `type(...) is int`
findings. Allowlist the internal module names before `importlib.import_module`;
define `_CaseRequired` with class syntax; use a static command in the subprocess
fixture; preserve report keys and boolean semantics without embedding suspicious
password-like literals; narrow the thread-boundary exception tuple to the
failures raised by the worker; and use one helper that accepts integers but
rejects booleans at all five validation sites. Add or update focused tests only
where needed to prove the behavior.

Acceptance: the named regression tests pass; no requested finding remains in
these files; report the exact commands and outputs.

## Task 2: Make TypeScript diagnostic test fixtures and status naming explicit

Files:

- `.claude/skills/typescript-expert/scripts/tests/test_ts_diagnostic.py`
- `.claude/skills/typescript-expert/scripts/ts_diagnostic.py`

Use a static string command in each `TimeoutExpired` test fixture. Resolve the
hardcoded-password warning on the `PASS` status constant while preserving the
external status value and all existing assertions/callers.

Acceptance: the TypeScript diagnostic unit tests pass and the status output is
unchanged.

## Task 3: Remove avoidable test subprocess execution and make server launches

explicitly validated

Files:

- `.claude/skills/webapp-testing/scripts/tests/test_with_server.py`
- `.claude/skills/webapp-testing/scripts/with_server.py`

Replace the unrelated-process test fixture's unnecessary child interpreter with
an in-process multiprocessing fixture if that preserves the test's
`is_alive`/cleanup assertions. Keep server commands shell-free and routed
through the existing parser/executable validation. Address the three reported
server subprocess findings through explicit validation or a narrowly documented
boundary exception only if the public CLI contract necessarily accepts a
validated user command. Preserve exit-code propagation and process-tree cleanup.

Acceptance: the webapp-testing unittest suite passes (including resource
warnings as errors where configured), with no behavioral regression.

## Task 4: Remove the no-op expression and validate the eyeball conversion

boundary

Files:

- `.claude/skills/ui-design-system/scripts/design_token_generator.py`
- `.github/skills/eyeball/tools/eyeball.py`

Delete the expression with no effect in the color-scale loop. For the eyeball
LibreOffice subprocess, preserve the existing absolute-path, non-shell execution
contract and make the source/executable provenance explicit enough for the
analyzer; if the analyzer still cannot prove this intentional boundary, record
that narrow exception for final review rather than changing supported document
conversion behavior.

Acceptance: the design-token tests/checks and relevant eyeball checks pass, and
the reported no-op finding is gone.

## Validation at HEAD

Run the focused Python test commands from each task, plus the repository's
available Python static checks for the touched files. Record exit status and
logs in the SDD workspace. Run a final whole-branch review against the merge
base, including the unrelated pre-existing worktree changes in the review scope
but excluding them from this plan's acceptance claims.
