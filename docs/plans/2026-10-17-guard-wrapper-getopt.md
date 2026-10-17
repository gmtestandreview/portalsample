# Shared wrapper option parsing

Implemented and independently reviewed. See the
[completion evidence](../skill-reviews/2026-10-17-guard-wrapper-getopt.md): 322
hook tests pass. Review added explicit utility-assignment operand handling and
rejected xargs substitution mode. Independent plan review approved at 97/100.

## Inputs and scope

The user authorized verification and implementation of the recommended guard
fix. Six command forms were allowed by both `527b01c4` and the current Python
3.14 guard; harmless GNU env probes verified clustered short options and
abbreviated chdir syntax. Scope is `scripts/pre_tool_use.py`,
`tests/hooks/test_pre_tool_use.py`, `tests/hooks/test_guard_parser.py` and a
completion report. Preserve all pending Python 3.14 migration and unrelated user
edits.

## Assumptions and framework

This is a bounded literal-shell guard, not a complete interpreter. Prefer the
standard library's `getopt.getopt` over another custom lexer for wrapper
options. It must reject unsupported/unknown options and missing values, process
short clusters and attached values, honor `--`, and canonicalize unique long
abbreviations. Ambiguous abbreviations must block. Support a documented
fixed-arity subset of wrapper options; unsupported optional-argument or
shell-changing modes fail closed. No new package or public API is required.

## Requirement traceability and exact changes

| Requirement               | Change                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Cluster/value parsing     | Replace `_WRAPPER_VALUES` with fixed-arity short/long option specifications; use `getopt.getopt` once per wrapper.            |
| Location tracking         | Derive changes from canonical parsed `env -C/--chdir` and `sudo -D/--chdir/-R/--chroot`, never from option values.            |
| Shared parsing            | Replace the separate verb and directory scans with one command-prefix parser returning both command index and location state. |
| Unknown/ambiguous options | Convert getopt errors to the existing parser-limit blocking sentinel. Preserve argument privacy in errors.                    |
| Regression protection     | Extend the two named test files with real stdin decisions and exact parser outputs; no command fixture executes.              |

## Tasks and verification

1. Copy the reviewed pending 3.14 migration into the ignored isolated
   `.worktrees/guard-getopt-20261017` worktree and preserve the guard baseline.
   Root changes are later applied only after hashes match.
2. Add failing decision cases for bundled value options, attached/split values,
   chroot, chdir abbreviations, nested wrappers, unknown short/long options,
   ambiguous abbreviations, and missing required values. Add positive controls
   for legitimate artifact cleanup, canonical parsed values that resemble flags,
   end-of-options and ordinary wrapper options.
3. Run
   `python -m pytest -q tests/hooks/test_pre_tool_use.py -k wrapper_options --tb=short -p no:cacheprovider`
   before implementation; require the security cases to fail for
   allow-versus-block differences.
4. Implement `_parse_wrapper_options(tokens, index, wrapper)` returning
   `(next_index, changes_directory)` or `None` on unsupported syntax. Use getopt
   specifications for env, sudo, command, time, nohup, exec, xargs and call.
   Treat GNU env's lone `-` as ignore-environment. Reject expanding modes such
   as env split-string and sudo shell/login/edit by omitting them from the
   supported subset.
5. Implement one `_command_prefix` loop that skips existing control/assignment
   tokens, applies the shared parser to nested wrappers, and aggregates location
   state. A parse failure becomes `command-parser-limit`; valid commands retain
   their existing checks. Remove the duplicate scans.
6. Run the failing cases, then
   `python -m pytest -q tests/hooks --tb=short -p no:cacheprovider` with Git
   Bash on PATH. Run compile, scoped Ruff/format and explicit strict Pyright for
   the guard and two edited tests (Python 3.14/Windows, empty ignores/excludes).
   Run Pyright before and after structural edits. Do not change quality policy.
7. Request independent Python/code and security reviews; resolve verified
   blockers. Record exact results and remaining analyzer/platform limits in
   `docs/skill-reviews/2026-10-17-guard-wrapper-getopt.md`. Apply only the three
   modified files and new plan/report to root after hash checks, rerun affected
   checks, remove owned temporary fixtures. No real queue watcher or destructive
   fixture executes.

## Safety and rollback

Keep security exit code 2 and metadata-only audit output. Unknown wrapper
options intentionally become stricter. Existing guard limitations for
dynamically constructed commands remain. Roll back this task by restoring the
three files from its preserved pre-fix working-copy checkpoint; do not revert
the pending 3.14 migration or unrelated skill edits. No commit/push/merge was
requested.

## Validation and handoff

Self-review: 97/100, zero critical failures; exact ownership, regression-first
steps, implementation approach and rollback are defined. Independent plan review
is required before implementation. Execute inline under the user's
authorization. Tests above are planned until separately executed. Fresh
Sonar/Pylance/POSIX evidence is not assumed.
