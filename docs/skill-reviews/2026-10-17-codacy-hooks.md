# Codacy hook and watcher checks — 2026-10-17

## Result

Codacy local analysis reported **169 findings** across fifteen source/test
files. This is not a clean Codacy result. Findings are analyzer reports
requiring review; the count includes overlapping tools and test-code findings,
and is not a count of confirmed vulnerabilities.

[Detailed findings and artifact hashes](2026-10-17-codacy-hooks-findings.json)
contain every reported issue, location, tool, severity, message, file hash, and
tool execution summary.

| Analyzer   | Version | Reported findings | Routed coverage                              |
| ---------- | ------- | ----------------- | -------------------------------------------- |
| Ruff       | 0.16.7  | 0                 | 13 Python files                              |
| Pylint     | 4.0.5   | 31                | 13 Python files                              |
| Prospector | 1.19.1  | 9                 | 13 Python files                              |
| Bandit     | 1.9.4   | 126               | 13 Python files routed; three failed parsing |
| Lizard     | 1.23.0  | 1                 | All 15 files                                 |
| ESLint 8   | 8.57.1  | 2                 | Two JavaScript launchers                     |
| ESLint 9   | 9.39.5  | 0                 | Two JavaScript launchers                     |

## Findings to review

- Pylint reports 23 subprocess calls without explicit `check=` and eight broad
  exception handlers across scripts and tests.
- Prospector reports seven mypy findings involving POSIX `fcntl` attributes and
  optional subprocess/path values in tests; one possible hardcoded secret in a
  test fixture; and one complexity finding in the secret scanner.
- Bandit reports 93 assertion findings, eight subprocess-import findings, twenty
  subprocess-execution findings, and five partial-executable-path findings. Test
  assertions and controlled subprocess fixtures account for much of this output;
  contextual review is required.
- Lizard reports cyclomatic complexity 22 against a threshold of 20 for the
  secret scanner's `main`.
- ESLint 8 reports a nonliteral `existsSync` filename in the pre-tool wrapper
  and an HTML-flow warning for `process.stderr.write` in the Python launcher.

No source remediation was performed during this check.

## Coverage and tool limitations

The targets were the six migrated Python scripts, the two JavaScript launchers,
and seven `tests/hooks/test_*.py` files. Deleted editor-control probes were
absent and were not analyzed.

The normal run used the existing `.codacy/codacy.config.json` and reported 163
findings across fourteen eligible files. Its `.claude/**` exclusion omits the
secret scanner. A second run explicitly checked only
`.claude/hooks/secret-scanner.py` with a temporary copy of that configuration
removing the matching exclusion; all tool patterns and parameters were retained.
That run reported six findings. The saved repository configuration was
unchanged.

Opengrep was unavailable because its binary was missing. Oxlint appears in the
saved configuration, but the installed adapter preset does not register an
Oxlint descriptor, so it did not execute.

Bandit reported syntax/AST parse errors for `scripts/pre_tool_use.py`,
`scripts/post_tool_use.py`, and `.claude/hooks/secret-scanner.py`. Its installed
adapter restricts its interpreter to Python `>=3.8.0 <3.14.0`; these parse
failures prevent a complete Bandit result for the upgraded source. Codacy's
`filesAnalyzed` field counts routed files and must not be interpreted as
successful parsing of those three files. Bandit also warned about text following
`nosec` comments in test files.

The two analysis invocations completed with findings and wrapper exit code 1.
Ruff, ESLint 9, and the other tool statuses do not override these findings or
the missing security coverage. Residual verification status is AMBER; no full
security-clearance claim is made.

## Execution and provenance

The Codacy CLI executable is not on PATH. Checks used the documented public API
of `@codacy/analysis-runner` and `@codacy/analysis-adapters` version 0.23.1
bundled with the installed Codacy VS Code extension 1.16.2. This is the local
engine used by that integration; no editor diagnostic cache or Codacy Cloud
result was substituted for fresh execution.

The engine ran from the repository root under Node 24.21.0 in standard mode,
with two tools allowed concurrently and a 180-second per-tool timeout. It
registered the bundled adapters, scoped
`analyze({repositoryRoot, files, tools, ...})` to the target paths, retained
existing tool rules, and recorded availability, routing, execution summaries,
errors, and issues. Inspection identified Python 3.14.7 for the available
Python-based checks; individual managed analyzer environments can differ, as the
Bandit restriction illustrates.

Ruff used the repository `ruff.toml`; ESLint 9 used `eslint.config.mjs`. Other
tools used the Codacy configuration's patterns. Existing configuration
provenance and behavior are described in the
[official Codacy local-analysis documentation](https://docs.codacy.com/codacy-analysis-cli/).

All fifteen source hashes and the saved Codacy configuration hash captured
before the final one-off run still matched afterward. Source files and policy
settings were preserved. Temporary runner scripts, configuration copies,
inspection output, and raw execution dumps were removed after the findings
artifact was saved; Codacy's shared tool cache and generated analyzer files were
retained.
