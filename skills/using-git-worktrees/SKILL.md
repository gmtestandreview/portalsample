---
name: using-git-worktrees
description: Create or verify an isolated Git worktree before implementing a feature, bug fix, or other repository change that requires isolation. Use before subagent-driven development, executing implementation plans, parallel development, multi-file changes, or when the user explicitly requests a separate worktree.
---

# Using Git Worktrees

## Goal

Start implementation only from a clean, isolated Git worktree based on the intended repository state.

## When to Use

Use this skill before:

- implementing a feature or bug fix;
- `subagent-driven-development`;
- `executing-plans`;
- parallel development that must not disturb another checkout;
- changes spanning more than one file;
- creating or verifying a separate worktree when the user explicitly requests isolation.

Do not create a worktree merely for ordinary read-only investigation unless the user explicitly requests a separate worktree or isolation is otherwise necessary.

## Workflow

### 1. Confirm repository context

Run:

```bash
git rev-parse --show-toplevel
git rev-parse --git-dir
git rev-parse --git-common-dir
git status --short
git branch --show-current
```

If the directory is not inside a Git worktree, stop and report that this skill does not apply.

Treat the current checkout as a linked worktree only when `--git-dir` and `--git-common-dir` resolve to different paths. If they resolve to the same path, treat it as the primary checkout.

If the current checkout is already a linked worktree, use these steps:

1. Check whether it is the intended worktree for this task.
2. If it is the intended worktree, continue to Step 3.
3. If it is not the intended worktree, do not implement there. Locate or create the correct task worktree, then verify it before continuing.

If the current checkout is the primary checkout and git status --short shows uncommitted changes, leave those changes untouched. Do not stash, commit, reset, copy, move, or discard them automatically.

If the new task can start from the committed repository state without relocating those changes, create the isolated worktree while leaving the primary checkout unchanged.

If the task requires moving or incorporating the existing uncommitted changes, stop and obtain explicit authorization for the preservation or migration strategy before modifying them.

Do not begin task implementation in the primary checkout.

### 2. Create an isolated worktree

First inspect existing worktrees:

```bash
git worktree list
```

Choose a task-specific path and branch that match the repository's conventions. Do not reuse a path or branch already checked out elsewhere.

For a new branch:

```bash
git worktree add <worktree-path> -b <branch-name>
```

Examples:

```bash
git worktree add ../worktrees/stripe-billing -b feat/stripe-billing
git worktree add ../worktrees/fix-auth-bug -b fix/auth-token-expiry
```

If the repository already has a dedicated worktree location such as `.claude/worktrees/`, follow that project convention instead of inventing a new one.

For an existing branch that is not already checked out:

```bash
git worktree add <worktree-path> <branch-name>
```

Never use `--force` to bypass an existing checkout or a dirty worktree.

### 3. Verify the isolated baseline

Change into the worktree and verify:

```bash
cd <worktree-path>
git status --short
git branch --show-current
git log --oneline -3
```

Required conditions:

- `git status --short` produces no output;
- the current branch is the intended task branch;
- the recent history matches the intended base.

If any condition fails, investigate before implementation. Do not discard or overwrite unexpected changes.

### 4. Run project-defined baseline checks

Use the repository's documented setup, build, lint, and test commands. Prefer commands already defined by the project; do not guess a package manager or mutate dependency files unnecessarily.

Record any baseline failure before making task changes.

If the clean baseline fails, stop task implementation and report the failure. Do not fix the baseline on the primary checkout as part of this workflow. Address it only as a separate, explicitly authorized change.

### 5. Proceed with implementation

Implementation may begin only after:

- the task is in an isolated worktree;
- the worktree is clean;
- the branch and base are correct;
- required baseline checks have passed, or the user has explicitly accepted a known baseline limitation.

## Cleanup

Clean up only after the work is merged or explicitly abandoned.

From outside the worktree:

```bash
git worktree remove <worktree-path>
```

The command should refuse removal if uncommitted changes remain. Do not add `--force` merely to make cleanup succeed.

After a merged branch is no longer needed:

```bash
git branch -d <branch-name>
```

Do not force-delete an unmerged branch unless the user explicitly authorizes losing that branch and its commits.

## Common Failures

| Failure | Response |
| --- | --- |
| Branch is already checked out | Use the existing worktree or choose another branch; do not force-add it |
| Worktree path already exists | Inspect it before choosing a different path |
| Current linked worktree belongs to another task | Do not implement there; locate or create the correct task worktree |
| Primary checkout has uncommitted changes | Preserve them first; do not automatically stash, commit, reset, copy, move, or discard them |
| Worktree contains unexpected changes | Stop and investigate; preserve the changes |
| Baseline checks fail before task edits | Report the baseline failure and do not start implementation |
| Setup assumes absolute paths | Adapt to the worktree path only after confirming project intent |
| Submodules are required but unavailable | Follow the repository's documented submodule setup |
| Current directory is the primary checkout | Create a separate worktree before implementation |

## Completion Check

Before declaring isolation ready, verify all of the following:

- [ ] The current directory is the intended linked worktree for this task.
- [ ] The intended task branch is checked out.
- [ ] `git status --short` is empty.
- [ ] The base commit/history is correct.
- [ ] Project-required baseline checks passed, or an accepted limitation is documented.
- [ ] Any pre-existing primary-checkout changes were preserved without silent mutation or loss.
- [ ] No unexpected changes were discarded, overwritten, or force-removed.
