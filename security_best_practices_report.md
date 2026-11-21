# Dangerous Subprocess Use Audit

## Executive summary

The repository contains subprocess calls, but this audit found no confirmed
command-injection vulnerability in the Python code searched. The reported calls
use argument vectors and `shell=False`. One fixture utility did inherit
Git-specific environment controls; that was hardened and covered by a regression
test.

The existing subprocess usage should remain list-based with `shell=False`
(explicitly or by default). `shlex.escape()` is not needed when arguments are
passed as a list and would be the wrong mitigation for these calls.

## Scope and method

- Searched Python files under `.claude/`, `.github/`, `scripts/`, `skills/`,
  `templates/`, and `tests/` for `subprocess.Popen`, `subprocess.run`, related
  subprocess helpers, `os.system`, `os.popen`, and `shell=True`.
- Reviewed every matching subprocess call that was found, including command
  construction and data flow into the argument vector.
- Ran the repository's secret scanner on each matching Python file before
  inspection.
- Executed `python -m pytest tests/hooks/test_watcher_pid.py -q`.

## Findings

### F-001 — Reported `Popen` hotspot is not exploitable command injection

- Severity: Informational / false positive
- Location: `tests/hooks/test_watcher_pid.py:163-168`
- Call:
  `subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)' if mode == 'live' else 'pass'], ...)`

The executable is the current Python interpreter selected by the test runtime.
The `-c` payload is one of two literals controlled by the closed `mode` test
parameter. The command is passed as a sequence, and `shell` is not enabled, so
shell metacharacters cannot be interpreted as commands. The working directory is
a newly created temporary directory and stdout/stderr are discarded.

No security fix is required for this call. If a static analyzer still reports
it, use the analyzer's documented false-positive suppression with this rationale
rather than applying `shlex.escape()` or converting the call to a shell command.

### F-002 — LibreOffice executable provenance is environment-dependent

- Severity: Low / deployment-dependent
- Location: `.github/skills/eyeball/tools/eyeball.py:165-179`
- Call: `subprocess.run([soffice_path, ...], shell=False, ...)`

The call does not construct a shell command. `source_path` is converted to an
absolute path before being passed as the final argv element, and the regression
test confirms that an option-like filename is not treated as an option. The
executable comes from `shutil.which()` or the Windows LibreOffice installation
locations selected by the caller, so its trust depends on the runtime
environment.

This is not an argument-injection vulnerability in the current CLI flow. If the
tool is ever run with an attacker-controlled environment under a more privileged
identity, the resolver must be restricted to trusted installation roots or an
explicitly trusted executable configuration.

### F-003 — Git fixture subprocess now uses an isolated Git environment

- Severity: Medium before fix; mitigated
- Location:
  `skills/subagent-driven-development/evals/make-e2e-fixtures.py:41-58,117-119`
- Call: `subprocess.run([GIT, *args], env=ENV, ...)`

The command vector was already constrained: `GIT` is resolved once, `shell` is
not enabled, and `check_git_args()` allowlists subcommands while rejecting
configuration and external-program options. However, the previous
`ENV = dict(os.environ, ...)` inherited Git-specific controls such as
`GIT_SSH_COMMAND` and global/system config overrides.

The fix adds `build_git_env()`, removes inherited `GIT_*` variables, sets
fixture-owned author/committer identity, disables system config, and points
global/system config to the null device. This prevents the fixture builder's Git
subprocesses from executing environment-selected helpers or consuming ambient
Git configuration.

## Reviewed safe patterns

- `scripts/watcher.py:123-124` and `templates/watcher.py:169-170` pass the task
  prompt as one argv element; task data is not interpolated into a shell
  command.
- `tests/hooks/test_pre_tool_use.py:545-552` launches a fixed Python test
  harness with an argv list and an explicit repository-owned script path.
- `tests/hooks/test_github_mcp_server.py:139-175` validates the launcher command
  before passing it to `Popen`.
- The remaining matches use argv lists, fixed utilities, validated paths, or
  test-owned data and do not set `shell=True`.

## Validation

Command:

```text
python -m pytest tests/hooks/test_watcher_pid.py -q
```

Observed: the watcher PID suite passed with `25 passed`; the eyeball argv
regression passed with `1 test`; the Git fixture suite passed with `7 tests`.

Conclusion: the two reported calls are not shell-injection vulnerabilities. The
Git fixture environment was hardened; the LibreOffice executable remains
dependent on the caller's trusted runtime environment. No application runtime
code was changed.
