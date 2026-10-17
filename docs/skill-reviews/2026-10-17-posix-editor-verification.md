# POSIX and editor verification — 2026-10-17

## Result

POSIX hook tests pass. Editor verification is AMBER: the selected interpreter is
Python 3.14, but fresh Pylance coverage was not established and SonarQube for
IDE could not initialize. No product code or editor settings were changed during
this verification.

This supplements the [Python 3.14 hook review](2026-10-17-python314-hooks.md)
and [guard wrapper review](2026-10-17-guard-wrapper-getopt.md).

## POSIX runtime

An independently repeated run against the current workspace returned exit code
0: **312 passed, 10 skipped in 10.32 seconds**. All ten skips are explicitly
Windows batch launcher tests in `tests/hooks/test_github_mcp_server.py`; no
POSIX hook tests failed or were skipped.

The container used Linux x86_64, Debian Bookworm, Python 3.14.8, Node 24.22.0,
pytest 9.0.2, and `/bin/sh` resolving to `/usr/bin/dash`. Tests ran with
networking disabled, the repository mounted read-only, and Python caches
redirected to temporary container storage. The tests exercise the guard,
wrapper, Python selector, post-tool hook, and watcher PID behavior without
executing destructive fixture commands.

The temporary image was built from this Dockerfile:

```dockerfile
FROM node:24-bookworm-slim AS node
FROM python:3.14-slim-bookworm
COPY --from=node /usr/local/bin/node /usr/local/bin/node
RUN python -m pip install --no-cache-dir pytest==9.0.2
ENV PYTHONDONTWRITEBYTECODE=1
WORKDIR /workspace
```

Resolved base image digests:

- Node:
  `sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5`
- Python:
  `sha256:48b13b003dda20b16f9442b8475aa05fe21bf6579a8c881db92ffb4d8fd20f83`

The decisive command, run from the repository root:

```powershell
$verifyRoot = (Get-Location).Path
docker run --rm --name codex-posix-final-check --network none --mount "type=bind,source=$verifyRoot,target=/workspace,readonly" --tmpfs /workspace/tests/hooks/__pycache__ --tmpfs /workspace/scripts/__pycache__ --tmpfs /workspace/templates/__pycache__ --tmpfs /workspace/.claude/hooks/__pycache__ -e PYTHONDONTWRITEBYTECODE=1 codex-posix-final:20261017 python -X pycache_prefix=/tmp/codex-pycache -m pytest -q -r s -p no:cacheprovider --tb=short tests/hooks
```

## Actual editor configuration

The running VS Code 1.141.0 workspace was inspected through a temporary
extension using the public VS Code extension API. Its active extensions were
Python 2026.8.0, Pylance 2026.4.1, and Ruff 2026.86.0. SonarQube for IDE 6.1.0
was installed but failed activation. These are the running versions, which
differ from some newer versions listed by the CLI.

The selected interpreter was the repository's `.venv/Scripts/python.exe`,
resolved by the Python extension as **3.14.7**. Effective Pylance settings were
`typeCheckingMode: strict`, `diagnosticMode: openFilesOnly`, no diagnostic
severity overrides, and `stubPath: typings`.

Thirteen Python files were opened: the six migrated scripts and seven
`tests/hooks/test_*.py` files. A separate temporary Python file intentionally
contained an undefined name and a multiple-invocation exception test to check
analyzer coverage. That control was never executed.

## Editor limits and observed diagnostics

Pylance did not publish a diagnostic for the invalid control during the
two-minute initial observation. Other editor diagnostics from Codacy did flag
it, which proves that diagnostic collection worked but does not prove Pylance
coverage. Empty results for twelve scope files therefore do **not** establish a
Pylance pass.

The initial snapshot retained three Pylance diagnostics for
`scripts/pre_tool_use.py`:

| Line | Severity | Diagnostic                                                             |
| ---- | -------- | ---------------------------------------------------------------------- |
| 901  | Error    | `reportUnknownVariableType`: `record` inferred as `dict[str, Unknown]` |
| 870  | Hint     | Code is structurally unreachable                                       |
| 392  | Hint     | `_value` is not accessed                                               |

These are conditional editor observations, not confirmed defects in the current
disk artifact. Fresh analysis and matching editor buffer contents were not
established; the disk artifact already contains a `JsonObject` annotation on
`record`. A second probe intended to pin all documents and restart Pylance did
not activate in the existing window, so no restart or fresh result is claimed.

SonarQube for IDE activation returned `Internal error`. Its startup log reports
`Could not initialize SonarLint Backend`; the `SonarLint.AnalyseOpenFile`
command was unavailable. Consequently, neither current Sonar cleanliness nor the
earlier `python:S5778` exception-test diagnostic is verified by the editor. This
is an analyzer startup failure, not a source-code finding.

The local evidence came from the running workspace's extension host and Python
Language Server logs under
`%APPDATA%/Code/logs/20261017T062022/window1/exthost`, plus its
`SonarSource.sonarlint-vscode/SonarQube for IDE.log`.

## Artifact identity

All thirteen disk hashes captured by the editor probe still matched after the
final POSIX run. Hashes below identify the verified workspace files; they do not
establish that editor buffers matched disk.

| File                                    | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| `scripts/pre_tool_use.py`               | `55a7608e79762a7d6bc7bce466d4b99840c497295d5c540dcf1cb12c509587f5` |
| `scripts/post_tool_use.py`              | `eb105a62663a60342af98ea0a5b6a4f3e1bc310740c25aa09c20f0e16edc1915` |
| `scripts/watcher.py`                    | `f57eee20a0506b2b6a5af4124e2880f64909f904623a559c39ef2c7852fd481b` |
| `scripts/process_utils.py`              | `a7365b40b21c5ef638e359d18310c40258b854b4b94d39226560ad650d787b92` |
| `templates/watcher.py`                  | `5b58f80e7860bce08b65bcf9c5ba6bceb1704fe7994d226bc06529ed00b4be71` |
| `.claude/hooks/secret-scanner.py`       | `84fdf9e4ebdfd4d408141ab7febdbf9b46208ee98019413c1d315c9ebda9ab64` |
| `tests/hooks/test_github_mcp_server.py` | `cf63c597c9e19a1d491bb210e77a51d24ea9e33ba99815ad1af4e3e45bbc6e5f` |
| `tests/hooks/test_guard_parser.py`      | `601c0f909bbc207c2d06e2f0578de82446f75a53f17a1e58862b7e67e25e9772` |
| `tests/hooks/test_post_tool_use.py`     | `212a11a7439567679158b32e60340715103ec79382f32192e65492a1481b2ad2` |
| `tests/hooks/test_pre_tool_use.py`      | `3d41d3b931491c2236a3a51cb142908ef1a73868982dbe17614840063cc85cd9` |
| `tests/hooks/test_python314.py`         | `1ec4fd4ea12630fb6719fb5c7b31c6036a13c5a7c8812d780fdd4d6989081089` |
| `tests/hooks/test_watcher_pid.py`       | `5013a81256a859cc393658320d218eca9e0d8a481cb9c36c44d16d21abfcfdf1` |
| `tests/hooks/test_wrapper.py`           | `d0f0422104ad25c40de3cfb50a924d67d24ae41a982925155843b09449496242` |

## Follow-up boundary

Remaining editor proof requires a responsive Pylance session that flags the
positive control and analyzes the current buffers, plus successful SonarQube for
IDE initialization and analysis. No analyzer settings were weakened, and no
unrelated files were repaired. Temporary control files, probe extensions,
containers, verification image tags, and build contexts were removed after
verification; shared Docker build cache was retained.
