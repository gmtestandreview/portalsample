# Guard wrapper-option security fix

## Artifact, provenance and outcome

Implemented the user's separately authorized fix in `scripts/pre_tool_use.py`,
with regressions in `tests/hooks/test_pre_tool_use.py` and
`tests/hooks/test_guard_parser.py`. The reported gaps predate the pending Python
3.14 migration and reproduce against `527b01c4`.

The pre-fix working-copy guard has SHA256
`7247866A863554A8509E01992CC84B7D269678BA8B4A403C385666251A669669`. Its
preserved copy remains at
`.worktrees/python314-hooks-20261017/scripts/pre_tool_use.py`; that checkpoint
includes the Python 3.14 changes and is the rollback reference for this task.

The fix replaces the separate verb-index and directory-change scans with one
command-prefix parser. Each wrapper is parsed once through standard-library
`getopt.getopt`, using a fixed-arity supported option subset.
[Python's getopt contract](https://docs.python.org/3.14/library/getopt.html)
supplies short-option clustering, attached values, end-of-options handling and
canonical unique long-option abbreviations.

Location changes come only from parsed `env -C/--chdir` or
`sudo -D/--chdir/-R/--chroot` options. Values that resemble those flags do not
change directory state. GNU env's lone `-` and broader assignment operands after
options or terminators are handled before selecting the actual command; this
also covers option-looking assignment names and names beyond shell identifier
syntax.

Unknown, ambiguous, malformed or unsupported wrapper options block through the
existing `command-parser-limit` rule. Shell/expansion modes such as `env -S`,
`sudo -s` and `xargs -I` are deliberately unsupported. Options interspersed
after assignment operands are rejected conservatively.

## Fresh checks

Windows environment: Python 3.14.7, pytest 9.0.2, Ruff 0.16.7 and Pyright
1.1.414. Git Bash was added to PATH only for the test command.

| Check                                                         | Result                                                                                                                                                                                                             |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Existing migration baseline                                   | 249 hook tests passed before this task.                                                                                                                                                                            |
| Final wrapper decision matrix against preserved pre-fix guard | 38 missed blocks and 2 false blocks among 60 cases.                                                                                                                                                                |
| Review-driven regression tests before repair                  | Seven newly exposed assignment/substitution cases failed for the expected allow-versus-block mismatch.                                                                                                             |
| Final guard/parser suites                                     | 219 passed.                                                                                                                                                                                                        |
| Final full hook suite                                         | 322 passed, no skips. Includes 60 new decision cases and 13 new exact parser cases.                                                                                                                                |
| `ruff check` on the three edited files                        | Passed under existing Python 3.14 overrides and E/F/I/UP/B/SIM selection.                                                                                                                                          |
| `ruff format --check` on the three files                      | Passed.                                                                                                                                                                                                            |
| Compilation with SyntaxWarning treated as error               | Passed.                                                                                                                                                                                                            |
| Pyright baseline                                              | Three intended files analyzed, zero diagnostics.                                                                                                                                                                   |
| Final strict Pyright                                          | Three intended files analyzed, zero errors or warnings. Temporary configuration used relative explicit includes, empty excludes/ignores, strict mode, Python 3.14, Windows platform and the installed interpreter. |
| Independent Python/code and security reviews                  | Approved after assignment-boundary and xargs substitution corrections. Both independently ran the 219-case guard/parser suite; security review also exercised 12 adversarial/near-miss cases.                      |
| Deterministic secrets scans and `git diff --check`            | Passed for task artifacts.                                                                                                                                                                                         |
| `sonar analyze --file scripts/pre_tool_use.py --format json`  | Secrets scan passed; server-side analysis returned HTTP 403.                                                                                                                                                       |

An initial temporary Pyright configuration with absolute include paths checked
zero files and was rejected as evidence. The corrected relative configuration
checked all three intended files; only that result supports the strict-clean
claim. Editor Pylance/SonarLint equivalence remains unknown.

## Compatibility and residual status

The reported wrapper-option bypasses and the additional reviewed assignment
boundary are closed for the tested forms. Supported ordinary artifact cleanup,
nested wrappers, legitimate option values and secret-file behavior retain
regression coverage. Exit codes and metadata-only audit output are unchanged.

Compatibility intentionally tightens: unsupported options and expanding modes
now block even for otherwise harmless commands. This avoids guessing where the
child command starts. The guard remains a bounded literal parser; dynamically
generated command names and stdin-supplied targets to ordinary xargs remain
outside this fix.

AMBER overall verification: no known material defect remains in this scoped
option-parsing repair, but POSIX/sudo runtime execution, fresh Claude session
integration, Pylance/SonarLint and server-side Sonar analysis remain unverified.
The local Windows/GNU env evidence does not establish every platform or utility
version.

## Ownership and rollback

Work was isolated in `.worktrees/guard-getopt-20261017` on
`fix/guard-getopt-20261017`, seeded with the reviewed pending Python 3.14
migration. Only the three edited files and this task's plan/report were applied
to root after baseline hash checks. Pending migration files and unrelated user
edits were preserved. No commit, push or merge was requested or performed.

Every guard fixture was submitted as data; no destructive command or live
watcher queue executed. Owned temporary project trees, audit logs, analyzer
configurations and the temporary baseline copy were cleaned up. Existing audit
history was preserved. Roll back only the three task files from the preserved
Python 3.14 worktree checkpoint; do not restore the older commit's Python 3.10
source over the migration.
