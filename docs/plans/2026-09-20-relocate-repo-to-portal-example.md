# Relocate Repo to `C:\Users\gregm\source\portal-example` — Impact and Plan

**Goal:** Move this repository to `C:\Users\gregm\source\portal-example` with no loss of git history, tooling state, or Claude Code memory.

**Approach:** Same-volume (C:) directory move via `Move-Item` (instant rename), then re-anchor every absolute-path consumer: git worktree links, the Python venv, Claude Code project memory, and the tokensave/claude-mem indexes.

## Source Inputs (inspected 2026-09-20)

- `git worktree list`: one linked worktree, `.worktrees/vscode-problems-remediation` (branch `vscode-problems-remediation`).
- `git remote -v`: `origin https://github.com/gmtestandreview/portalsample.git` — independent of folder name.
- `git rev-parse --show-toplevel`: this folder is the repo root; the parent folders `source-map-capture` and `offline-site-robots-off\portal.measurement.gov.au` contain only this folder.
- `.git/worktrees/*/gitdir` and `.worktrees/*/.git`: both hold absolute paths to the old location.
- `.venv/pyvenv.cfg`: `command = ... -m venv c:\Users\gregm\offline-site-robots-off\...\.venv` (absolute).
- `.mcp.json`, `.vscode/mcp.json`, `.codex/config.toml`: the only absolute paths point at user-level binaries (`sonar.exe`, `tokensave.exe`) — unaffected. Repo scripts use relative paths (`scripts\...cmd`).
- `portal.measurement.gov.au.code-workspace`: uses `"path": "."` — unaffected.
- `.tokensave/branch-meta.json`: relative `db_file`; any global registry entry is keyed by path (unverified).
- `C:\Users\gregm\.claude\projects\` holds project dirs keyed by the sanitized absolute path; three exist for the old path (main, plus two suffixed variants).
- Old-path string appears in 13 tracked files (203 hits): mostly `docs/eslint-baseline.md` (61), `docs/change-record/storybbok_change_remaining_errors.md` (62), `.github/react19-audit.md` (9), and 4 eval `transcript.jsonl` fixtures.

## Assumptions and Unknowns

- Assumption: nothing is running against the folder (VS Code, Storybook, node, Claude sessions closed). Windows file locks make `Move-Item` fail otherwise.
- Non-blocking unknown: whether `.venv`, `.sonar`, `.remember`, `.agent-sync` are git-ignored (`git check-ignore` printed only `.worktrees`, `.tokensave`, `.scannerwork`, `.claude/settings.local.json`). Confirm with `git status` after the move.
- Non-blocking unknown: whether the sibling `C:\Users\gregm\source\React19DesignSystem\apps\portal-spa` references this path. Task 1 greps it.
- Non-blocking unknown: whether the SonarQube project key depends on the folder name (`sonar-project.properties` returned no `projectKey` match).

## Impact Summary

| Area | Impact | Severity | Action |
| --- | --- | --- | --- |
| Git history, branches, remote | None — `.git` moves with the folder | None | — |
| Linked worktree | Breaks (absolute links both ways) | High | `git worktree repair` |
| `.venv` | Breaks (absolute paths in scripts and `pyvenv.cfg`) | High | Delete and recreate |
| Claude Code memory (14 memories, `MEMORY.md`) and session history | Not found under the new path (new project dir starts empty) | High | Copy old project dir contents to new key |
| `.claude/skills/react-aria` symlink | 1 of 31 skill symlinks has an absolute target (the other 30 are relative, e.g. `..\..\skills\adr`); it will dangle | Medium | Recreate with a relative target (Task 3b) |
| `.tokensave/config.json`, `.remember/logs`, `.agent-sync/logs` | Contain old-path strings; logs are harmless, tokensave config is not | Low | Re-run `tokensave sync`; leave logs |
| `.claude/settings.local.json` allow-list | Stale absolute-path permissions | Medium | Re-approve or rewrite paths |
| claude-mem observations | Filed under old project name `portal.measurement.gov.au` | Medium | Accept split history or re-tag |
| tokensave index | Registry keyed by path | Medium | `tokensave sync` in the new root |
| `node_modules` | Shims are relative; caches may hold old paths | Low | Verify with `npm run type-check`; reinstall only if it fails |
| Docs with old absolute links | Dead links, cosmetic | Low | Leave (historical) or edit the 3 live docs |
| Path length | New root is 36 chars vs 109, which reduces MAX_PATH risk | Positive | — |
| GitHub, CI, Chromatic, package name | Independent of folder name | None | — |
| Empty parent shell dirs | Left behind | Cosmetic | Delete |
| VS Code | Recent-workspace entry, workspace-trust prompt | Low | Reopen and trust |

## Tasks

### Task 1: Pre-flight (read-only)

- [ ] `git status --short` — record dirty files (3 modified skill-creator files at session start); commit or stash first.
- [ ] `git -C .worktrees\vscode-problems-remediation status --short` — confirm the worktree is clean.
- [ ] `Test-Path C:\Users\gregm\source\portal-example` — Expected: `False` (was `False` at inspection).
- [ ] `Get-ChildItem C:\Users\gregm\source\React19DesignSystem\apps\portal-spa -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern 'offline-site-robots-off' -List` — Expected: no hits; otherwise add the hits to Task 7.
- [ ] Close VS Code, Storybook, and all Claude Code sessions on this folder.

### Task 2: Move

Run from a shell whose cwd is outside the repo:

```powershell
Move-Item -LiteralPath 'C:\Users\gregm\offline-site-robots-off\portal.measurement.gov.au\source-map-capture\portal.measurement.gov.au' -Destination 'C:\Users\gregm\source\portal-example'
```

Expected: no output; `git -C C:\Users\gregm\source\portal-example log --oneline -1` prints the latest commit.

### Task 3: Repair git worktree

```powershell
git -C C:\Users\gregm\source\portal-example worktree repair
git -C C:\Users\gregm\source\portal-example worktree list
```

Expected: both entries show `C:/Users/gregm/source/portal-example[...]`, and `Get-Content .worktrees\vscode-problems-remediation\.git` points at the new path.

### Task 3b: Fix the absolute `react-aria` skill symlink

Use PowerShell, not git-bash `ln` (which silently copies). Inspect the current target first with `(Get-Item .claude\skills\react-aria).Target`; keep the same destination folder but express it relatively (as the other 30 links do):

```powershell
cd C:\Users\gregm\source\portal-example
Remove-Item .claude\skills\react-aria
New-Item -ItemType SymbolicLink -Path .claude\skills\react-aria -Target <relative-target-matching-old-destination>
```

If the old target pointed outside the repo, stop and confirm intent before relinking. Verify: `Test-Path .claude\skills\react-aria\SKILL.md` returns `True`. Note: `git status` may show a type change if the link is tracked.

### Task 4: Recreate `.venv`

```powershell
cd C:\Users\gregm\source\portal-example
Remove-Item -Recurse -Force .venv
c:\python314\python.exe -m venv .venv
```

Then reinstall Python deps from the repo's requirements file. Locate it with `Get-ChildItem -Recurse -Filter requirements*.txt -Depth 3 | Where-Object FullName -notmatch node_modules`. If none is found, stop and ask rather than guess. Verify: `.venv\Scripts\python.exe -c "import sys; print(sys.prefix)"` prints the new path.

### Task 5: Carry Claude Code memory and indexes

- [ ] With Claude closed, copy (do not move) the old project folder into the new key:

  ```powershell
  $p='C:\Users\gregm\.claude\projects'
  New-Item -ItemType Directory -Force "$p\C--Users-gregm-source-portal-example" | Out-Null
  Copy-Item -Recurse -Force "$p\C--Users-gregm-offline-site-robots-off-portal-measurement-gov-au-source-map-capture-portal-measurement-gov-au\*" "$p\C--Users-gregm-source-portal-example\"
  ```

  Expected: `memory\MEMORY.md` exists under the new key.
- [ ] Open the new folder in VS Code and confirm a fresh Claude session loads the memory index.
- [ ] Run `tokensave sync` in `C:\Users\gregm\source\portal-example`; verify with `tokensave_status`.
- [ ] Re-approve or edit paths in `.claude/settings.local.json` (git-ignored, local only).

### Task 6: Verify

```powershell
cd C:\Users\gregm\source\portal-example
npm run type-check
npm run lint
npm run test:unit
git status --short
```

Expected: type-check and lint exit 0; unit tests pass as before the move; `git status` shows only the pre-existing modifications.

### Task 7: Cleanup

- [ ] After Task 6 passes: `Remove-Item -Recurse 'C:\Users\gregm\offline-site-robots-off'` — only if `Get-ChildItem -Recurse -Force` shows it contains nothing but empty folders.
- [ ] Optional: rename `portal.measurement.gov.au.code-workspace` to `portal-example.code-workspace`.
- [ ] Optional: update old absolute links in `.github/react19-audit.md`, `docs/eslint-baseline.md`, `docs/change-record/storybbok_change_remaining_errors.md`. Leave the `transcript.jsonl` eval fixtures untouched.

## Safety, Rollback, and Verification

- Risk: a locked file could abort `Move-Item`. A same-volume move is an atomic rename, so a failure leaves the original intact.
- Backup (recommended before Task 2): `git bundle create $env:TEMP\portal-backup.bundle --all`.
- Rollback: `Move-Item` back to the original path, then `git worktree repair`. The old Claude project dir is only copied from, never deleted, until Task 6 passes.
- Verification: Task 6 commands and `git worktree list`.

## Execution Handoff

- Plan path: `docs/plans/2026-09-20-relocate-repo-to-portal-example.md`
- Blocking unknowns: none.
- Not run: nothing in this plan has been executed. Only read-only inspection ran, and the formal 100-point reviewer rubric was not applied.
- Supported execution mode: manual, or `executing-plans` in a session opened outside the repo folder.
