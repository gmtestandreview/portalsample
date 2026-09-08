# Worktree cleanup mechanics

Concrete bash for detecting a linked worktree and removing it safely. Load this
when the branch you are finishing lives in a git worktree and the user has asked
you to merge or discard it (workflow step 7, "Perform requested repository
actions").

## Detect the worktree environment

Capture these values **while still inside the worktree**, before any `cd` — a
later directory change loses them:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
WORKTREE_PATH=$(git rev-parse --show-toplevel)
```

| State | Meaning | Cleanup |
|---|---|---|
| `GIT_DIR == GIT_COMMON` | Primary checkout, not a linked worktree | Nothing to remove |
| `GIT_DIR != GIT_COMMON`, on a named branch | Linked worktree | Remove it after the branch is merged or the discard is confirmed |
| `GIT_DIR != GIT_COMMON`, detached HEAD | Externally managed workspace | Leave it in place — the host owns it |

## Remove the worktree

Worktree removal must run from **outside** the worktree, so `cd` to the main repo
root first and use the values captured above:

```bash
git worktree remove "$WORKTREE_PATH"
git worktree prune   # clears any stale registrations
```

Only remove a worktree you created for this task (typically under `.worktrees/`
or `worktrees/`). A worktree the host environment set up is not yours to remove —
leave it and, if your platform provides a workspace-exit tool, use that instead.

## If removal is refused

`contains modified or untracked files` means the worktree holds files that exist
nowhere else — uncommitted plans, notes, or scratch work. **Never `--force` on
your own initiative** (see the parent skill's "Common Rationalizations"). Show the
user what is at stake and ask:

```bash
git -C "$WORKTREE_PATH" status --porcelain -uall
```

```
Worktree removal refused — these files were never committed:

<file list>

1. Commit them to <branch> before cleanup
2. Move them into <main repo root>
3. Delete them (unrecoverable)

Which?
```

Carry out the choice, then remove the worktree.
