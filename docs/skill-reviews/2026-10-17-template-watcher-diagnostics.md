# Template watcher diagnostic repair — 2026-10-17

## Repair

Repaired the supplied typing and Ruff import-order diagnostics in
`templates/watcher.py`. Baseline reproduction produced 40 strict Pyright errors
and one Ruff error. Final scoped Pyright and Ruff checks pass.

The patch models the documented task fields with `TypedDict`, annotates string
and PID inputs, `Path` task files, subprocess results, signal callback
arguments, lifecycle return types, and the heterogeneous receipt. Imports are
ordered. The existing decoder returns arbitrary JSON; its explicit `Any` return
preserves that boundary's existing behavior, including iterable-pair updates and
malformed scalar failures. No casts, diagnostic ignores, or analyzer
configuration changes were introduced.

All twelve function bodies are identical to the baseline after removing
annotations. The inline platform PID implementation remains synchronized with
the maintained helper. Prompt construction, CLI arguments, parsing, receipt
contents, output, exits, and filesystem transitions are unchanged in the
executed comparisons.

## Evidence

Execution root: repository workspace. Interpreter: `.venv/Scripts/python.exe`,
Python 3.14.7. Analyzer versions: Pyright 1.1.414 and Ruff 0.16.7.

| Check                          | Observed result                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Scoped strict Pyright          | Exactly one intended file analyzed; baseline 40 errors, final zero errors/warnings/information diagnostics; final exit 0 |
| Ruff check                     | Final exit 0, all checks passed                                                                                          |
| Behavior differential          | 40 checks passed against the final workspace file                                                                        |
| Full hook suite                | 322 passed in 22.82 seconds, exit 0; Git Bash `sh` available on PATH                                                     |
| Secrets scan                   | Final template clean                                                                                                     |
| Independent Python/code review | Approved; no blocking findings                                                                                           |

The temporary Pyright configuration used strict mode, Python 3.14, an empty
exclude list, the workspace `typings` path, and no severity overrides. Both
baseline and final commands explicitly targeted `templates/watcher.py` and
selected the repository interpreter. The baseline output identified that exact
workspace file.

```powershell
.\.venv\Scripts\ruff.exe check templates/watcher.py --output-format concise
.\.venv\Scripts\python.exe -m pyright --project $probeConfig --pythonpath .venv/Scripts/python.exe --outputjson templates/watcher.py
$env:PATH = 'C:\Program Files\Git\bin;' + $env:PATH
.\.venv\Scripts\python.exe -m pytest -q -r s -p no:cacheprovider tests/hooks
```

The isolated differential covered function-body and configuration identity;
default and explicit task prompts; subprocess arguments; absent, malformed,
scalar, object, and iterable-pair structured JSON; successful and failed CLI
receipts; retained processing files on errors; PID-file state; and cleanup exit
behavior. Subprocess invocation and orchestrator notification were mocked. Only
owned temporary queue, processing, and result directories were used.

## Provenance and disposition

- Baseline SHA-256:
  `5b58f80e7860bce08b65bcf9c5ba6bceb1704fe7994d226bc06529ed00b4be71`.
- Final SHA-256:
  `fa6efc43d4782d7567573881a15ca72dd44cab763b18a2d6b5448f30d41f20df`.
- Candidate developed in `.worktrees/template-watcher-diagnostics-20261017`; the
  root baseline was checked before copying the verified candidate back.
- The matching original remains in
  `.worktrees/python314-hooks-20261017/templates/watcher.py`.
- Temporary fixtures, checker dumps, and probe scripts were removed. The
  candidate and earlier baseline worktrees were retained. Other existing
  workspace edits were preserved.

Actual Pylance clearance remains unverified: the CLI reproduces strict checks
using the same Pyright version previously identified in the editor log, but does
not establish current editor buffer or analyzer lifecycle equivalence. Residual
editor-clearance status is AMBER. This patch preserves the template's existing
input acceptance and error behavior; it does not claim a separate security audit
or new input validation.
