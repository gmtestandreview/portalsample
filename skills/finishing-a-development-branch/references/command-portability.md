# Command portability and evidence contract

**Load when** determining how to run project commands, dealing with multiple
shells/package managers, or investigating command/runner failures. Use only
installed and permitted tooling; `git` commands below are shell-independent when
issued separately from the correct checkout.

## Preflight inventory (read-only)

Run separately from the repository root in Bash, PowerShell, or a compatible
terminal; capture output and failures without a pipeline that hides exit codes:

```text
git --version
git rev-parse --show-toplevel
git rev-parse --verify HEAD
git branch --show-current
git status --porcelain=v1 --untracked-files=all
git worktree list --porcelain
git diff --name-status
git diff --cached --name-status
```

For an intended base confirmed by repository policy, resolve its exact ref with
`git rev-parse --verify <base-ref>`; if missing/ambiguous stop readiness claim.
The shell used is established by the host/session (for example `$PSVersionTable`
in PowerShell or `$SHELL` in POSIX shells when present); do **not** treat
`echo $SHELL` as proof when an interactive shell was launched differently.
Record shell, cwd, Git version and exit status. Command snippets in this file
are individual commands; `<base-ref>` is a placeholder, not a command to paste.

## Select the documented project runner

Identify the project root and inspect contributor guidance and available
manifests/lockfiles first. Prefer the declared package manager and pinned
version (`packageManager` field or project docs) and use repository scripts:

| Project reality      | Example only; prefer repo scripts | Notes                                                  |
| -------------------- | --------------------------------- | ------------------------------------------------------ |
| pnpm + lockfile      | `pnpm run test`                   | Confirm installed pnpm/corepack and working directory  |
| npm + lockfile       | `npm run test`                    | Never create a second lockfile to run tests            |
| Yarn + lockfile      | `yarn test`                       | Version may depend on Corepack/checked-in Yarn release |
| Other/non-JS project | documented project command        | Do not invent an npm runner                            |

Do not install/switch versions, mutate lockfiles, or run `--fix` as part of a
read-only readiness review. When a command is unavailable, record `BLOCKED`, the
missing dependency, a safe equivalent if already installed, and the owner. Use
the project's required tests/thresholds; a successful runner exit does not
negate a failed coverage gate or ignored error in its output.

## Bash / PowerShell differences

Avoid Bash `$(...) || exit 1`, `VAR=value`, `&&` (not portable across all
PowerShell editions), and POSIX-path assumptions in instructions meant for
PowerShell. To capture repo root, for example:

```bash
# Bash (run inside the candidate repository)
repo_root=$(git rev-parse --show-toplevel) || exit 1
printf '%s\n' "$repo_root"
```

```powershell
# PowerShell (run inside the candidate repository)
$repoRoot = git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'Cannot resolve Git repository root' }
Write-Output $repoRoot
```

When shell-specific commands are unavailable, execute the single read-only Git
commands listed above individually; if a required **project** command cannot be
represented safely in the available shell, stop with `BLOCKED` rather than
translate it speculatively.

## Scope, generated output, and stale sessions

- Capture committed, staged, unstaged and untracked paths **before** applying
  any scan exclusion. `git status --ignored --short` and `git clean -ndx` reveal
  ignored/local-only paths; the latter is **dry-run only**.
- Use the project-defined exclusions for generated/vendor files **only** for
  test/lint/clone scans; do not hide changed generated files from review.
- When checking UI/E2E/Storybook/dev servers, verify the active process, port,
  revision/build, environment and invocation against the current candidate;
  restart **only an owned process with permission**, otherwise mark stale or
  inaccessible evidence `BLOCKED`.
- Record exact command, cwd, shell, runner version, output location, exit code,
  threshold, timestamp and tested HEAD/dirty-tree identity. For typical CLI
  commands `0` means process success and nonzero failure unless documented
  otherwise. Re-run after relevant edits, including documentation command
  claims.
- Never treat a cached log, unchanged server port, or old green CI badge as
  evidence about a new tree.

## Portability validation contract

- Record `shell_name`, `shell_version`, `git_version`, `cwd`, project
  `packageManager`, lockfile, runner availability and exact command before
  invocation. **Detect rather than guess**. Run each command in its actual
  declared shell; do not copy Bash syntax into PowerShell.
- Probe a non-mutating `git rev-parse --show-toplevel` with exit `0` expected;
  wrong directory/non-repository produces a nonzero exit and must block
  readiness.
- Run the **project's** required test from its documented working directory.
  Example fixture's Python unittest command is executable when Python exists;
  its pnpm package manager declaration does not authorise installation of pnpm
  merely to satisfy a fixture. If a required pnpm command cannot run, use
  `BLOCKED`, not an npm substitution.
- Before a scan, inventory all changed paths including ignored and generated.
  Then apply only project-policy scanner exclusions. Assert no approved
  exclusion has suppressed a changed path in the Git review inventory.
- For PowerShell, test native execution using `pwsh`/`powershell` in a
  disposable checkout **when installed**. If neither is available, record
  PowerShell execution `NHR` and use individual shell-independent Git commands
  in the current environment; Bash syntax checks do not prove PowerShell
  execution.
- Do not claim command portability from a snippet's readability. Capture exit
  codes and actual stdout/stderr (redact secrets). Retest after final edits.

### Native PowerShell proof (conditional)

When `pwsh` or Windows PowerShell is installed, use a **disposable marked
fixture** generated by `run-fixtures.py`; never run arbitrary repository scripts
against a live checkout:

```powershell
pwsh -NoProfile -File scripts/evals/check-powershell.ps1 -Repository '<scratch>/fixtures/pnpm-powershell' -Output '<scratch>/powershell-result.json' -FixtureRoot '<scratch>/fixtures' -RunProjectTest
```

The script requires an explicit `-FixtureRoot` containing the repository and a
`.branch-eval-disposable` marker before any project test. The JSON output must
be outside the checkout, so producing evidence cannot contaminate the repository
snapshot. `-RunProjectTest` may mutate files or perform other project-defined
side effects: the script compares before/after HEAD, refs, worktree
registration, tracked/untracked status and ignored state. An unchanged Git
snapshot does **not** prove there were no external side effects. The
`ENVIRONMENT_PROBE_ONLY` outcome is reserved for read-only inspection; a
successful test is `PROJECT_TEST_EXECUTED`, never labelled read-only.

PowerShell exit code contract: `0` probe success or completed project test
without detected Git-state drift; `1` project test failed; `2` project runner
unavailable; `3` unsafe/unmarked fixture or missing explicit fixture root; `5`
project test changed Git-visible state. Invalid repository, missing Git or
unsafe output path raises a terminating error and is **never** PASS.

Run native negative checks on a supported PowerShell host with distinct new
output paths: (a) non-repository path, (b) absent fixture root/marker, (c)
output placed inside checkout, (d) pnpm missing, (e) failing project test, (f)
project test writes a file, and (g) repeated output path. Record stdout, stderr,
exit codes, file digests and any detected side effects. Do **not** execute
project tests in a real repository to complete these probes.

If the interpreter is not installed, native execution remains **NHR**, not PASS.
Python syntax checks, Bash execution and text review do not validate PowerShell
semantics.
