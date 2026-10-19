# PreToolUse guard completion — 2026-10-17

## Artifact and scope

Completed the remaining implementation work from
[the guard plan](../plans/2026-10-05-pre-tool-use-guard-fixes.md), preserving
the subsequent changes already present at baseline commit `95622046`. The
original guard fixes landed in `d5056a87` (PR #66); later commits introduced the
Node wrapper and further parser hardening.

- `scripts/pre_tool_use.py`: directory-changing `env` and `sudo` wrappers now
  disable artifact cleanup exemptions before checking their child command. Both
  split and attached directory options are covered. Ordinary wrapper commands
  retain the existing behavior.
- `tests/hooks/test_pre_tool_use.py`: five regression cases reproduced the
  cleanup bypass before the fix, then passed afterward. The fixtures submit
  command text to the guard; they do not execute deletes.
- `tests/hooks/test_wrapper.py`: temporary projects now contain the actual Node
  wrapper, including the missing-guard scenario. This fixes six baseline
  integration failures caused by an absent wrapper module.
- `tests/hooks/test_watcher_pid.py`: the probe is selected with `partial` before
  entering `pytest.raises`, leaving one invocation inside the exception test.
  All four modes retain their original assertion and child cleanup behavior.
  This addresses the supplied `python:S5778` diagnostic.
- Gitignored `.claude/settings.local.json`: added
  `GATEGUARD_BASH_ROUTINE_DISABLED=1` and
  `GATEGUARD_EXEMPT_GLOBS=.scannerwork/**,.sonar/**,sonar-project.properties`.

## Plan disposition

| Task                               | Result                                                                                                                                                                                                                                                            |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1: Quote-aware parser              | Implemented previously; parser suite passes freshly.                                                                                                                                                                                                              |
| 2: Target-aware delete rule        | Implemented previously; remaining wrapper directory-change bypass repaired.                                                                                                                                                                                       |
| 3: Filename-based env rule         | Implemented previously; existing expanded secret-file cases pass.                                                                                                                                                                                                 |
| 4: Private JSONL audit and startup | Implemented previously; rotation, concurrent writers, malformed input and credential omission tests pass.                                                                                                                                                         |
| 5: Project-relative wrapper        | Current Node implementation retained. It deliberately blocks on interpreter failure or guard crash, and allows a missing guard with a warning. This supersedes the old plan's shell wrapper and fail-open crash contract. All six current integration cases pass. |
| 6: GateGuard settings              | Both keys applied; actual installed module passes 14 isolated checks. Fresh Claude Code session activation remains pending.                                                                                                                                       |

## Fresh verification

Execution used Windows, Python 3.14.7, Ruff 0.16.7, Pyright 1.1.414 and Node
24.21.0. Git Bash was added to PATH only for the test command. No dependency or
repository quality configuration changed.

| Check                                                                  | Result                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline hook suite                                                    | 216 passed, 6 wrapper fixture failures. The previously reported watcher liveness failures are already repaired in the current baseline.                                                                                                                                                 |
| Five new cleanup boundary cases before repair                          | All five failed for the expected allow-versus-block mismatch.                                                                                                                                                                                                                           |
| Final `python -m pytest -q tests/hooks --tb=short -p no:cacheprovider` | 227 passed, no skips.                                                                                                                                                                                                                                                                   |
| `ruff check scripts/pre_tool_use.py tests/hooks`                       | Passed with repository `ruff.toml`: Python 3.10 target, E/F/I/UP/B/SIM rules.                                                                                                                                                                                                           |
| `ruff format --check scripts/pre_tool_use.py tests/hooks`              | All seven files passed.                                                                                                                                                                                                                                                                 |
| `python -m compileall -q scripts/pre_tool_use.py tests/hooks`          | Passed.                                                                                                                                                                                                                                                                                 |
| Scoped strict Pyright                                                  | Six intended files analyzed, zero errors/warnings. Temporary configuration used strict mode, Python 3.10 target, Windows platform, no ignores/excludes, workspace extra path, and Python 3.14.7 interpreter. Covered guard plus parser, pre-tool, wrapper, post-tool and watcher tests. |
| Settings JSON parsing                                                  | Both settings files parsed successfully.                                                                                                                                                                                                                                                |
| Installed ECC 2.2.1 GateGuard                                          | 14/14 passed via actual exported module in isolated Node processes and temporary session state. Baseline denials, routine-command opt-out, scanner exemptions, unrelated edits, traversal containment and destructive-command protection covered.                                       |
| Python/code review and security review                                 | Approved scoped changes; reviewers' limited independent runs are supplementary to the complete parent run above.                                                                                                                                                                        |
| Sonar `python:S5778` rule lookup                                       | Retrieved from connected SonarQube; source now has one invocation inside the exception block.                                                                                                                                                                                           |
| `sonar analyze --file tests/hooks/test_watcher_pid.py --format json`   | Secrets scan passed; server-side Vortex analysis failed with HTTP 403. No fresh Sonar-clean claim.                                                                                                                                                                                      |
| Deterministic secrets scans and `git diff --check`                     | Passed for touched files.                                                                                                                                                                                                                                                               |

A paired 20-call isolated guard measurement averaged 84.129 ms for the current
baseline and 86.148 ms for the candidate. These local startup measurements are
not a performance improvement claim. The old plan's 248 ms historical
measurement used a different execution context.

## Remaining verification and compatibility

AMBER: no known material defect remains within this scoped repair, but fresh
Claude Code environment propagation, Sonar/SonarLint and Pylance execution are
unverified. Pyright CLI settings are documented above; equivalence to the user's
editor analyzer/profile is unknown. Python 3.10 and POSIX runtime execution were
not available; the type/lint target alone does not prove those runtimes.

Restart Claude Code, use PowerShell `Get-Date` as its first call, then invoke
the normal sonar workflow. Confirm no Fact-Forcing Gate prompt. Keep the local
settings backup until that check succeeds.

The guard remains a bounded literal parser, not a complete shell interpreter.
Dynamically constructed or encoded interpreter access remains outside this plan;
existing permission denies and the current wrapper contract remain in place. The
new repair tightens cleanup approval for directory-changing wrappers without
changing hook exit codes or audit schema.

## Checkpoints and fixture disposition

Changes were developed in `.worktrees/hook-guard-final-20261017` on
`fix/hook-guard-final-20261017` (checkpoints `22ea234e` and `fcc5d218`), then
copied to the user's workspace after baseline hash checks. No push or merge was
performed.

Temporary project trees, audit logs, GateGuard state and analyzer configuration
were removed by their owning tests/runners. The task-owned verification script
was removed after recording evidence. Existing audit history and unrelated
workspace changes were preserved. The local rollback copy
`.claude/settings.local.json.pre-tool-use-guard-20261017.bak` is deliberately
retained pending fresh-session verification; remove the two new keys or restore
that copy to roll back Task 6.
