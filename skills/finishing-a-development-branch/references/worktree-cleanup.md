# Linked-worktree cleanup: safe execution guide

**Load only** if finishing a branch in a linked worktree **and the user has
explicitly requested that worktree be removed** after the requested branch
integration or discard decision. This is a destructive filesystem operation;
read-only assessment does not authorize cleanup.

## Identify the worktree and owner

Run **inside the candidate worktree**, before changing directories:

```bash
WORKTREE_PATH=$(git rev-parse --show-toplevel) || exit 1
GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P) || exit 1
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P) || exit 1
git worktree list --porcelain
```

If `GIT_DIR` equals `GIT_COMMON`, this is the primary checkout: **do not remove
it**. Otherwise it is a linked worktree. `detached HEAD` is **not proof** it was
created by a host; a named branch is **not proof** it belongs to the agent.
Establish ownership from task history and host policy, not naming or location.
Only remove a worktree created for this task, unless the user specifically
authorizes removal of another user-owned worktree and the host permits it. Leave
host-managed worktrees to the host's workspace-exit mechanism.

## Validate before touching files

1. Identify the actual expected branch, PR/merge or discard result, and desired
   post-cleanup state. Do **not** infer that a PR creation means a merge.
2. Confirm the integration/discard choice and branch state using real refs. If
   deleting an integrated branch is also requested, verify its commits are
   reachable from the correct target; do not delete an unmerged branch by
   accident. Branch deletion is a separate authorized action.
3. Inventory staged, unstaged, untracked **and ignored** data. Ignored files can
   contain local-only secrets or build outputs; inspect with care and avoid
   copying their contents into logs.

```bash
git -C "$WORKTREE_PATH" status --porcelain=v1 --untracked-files=all
git -C "$WORKTREE_PATH" clean -ndx  # dry-run inventory; never change to -fdx
```

`git worktree remove` only removes clean worktrees by default. A "clean" status
is not a guarantee that ignored/local-only files are disposable. Before removal,
inspect the path and obtain an explicit decision for any valuable local-only
content. A worktree with submodules or a lock may require special handling: stop
and report; do not bypass Git safeguards by forcing removal.

## Remove only the approved worktree

From another known, registered checkout (find one using the earlier
`git worktree list --porcelain`) and **outside** `WORKTREE_PATH`, run only after
the approval and all data checks:

```bash
git -C "$OTHER_WORKTREE" worktree remove -- "$WORKTREE_PATH"
git -C "$OTHER_WORKTREE" worktree list --porcelain
```

Set `OTHER_WORKTREE` to a verified existing checkout outside the target; never
blindly derive it by taking the parent directory of `WORKTREE_PATH`. Do not run
`git worktree prune` as routine cleanup: it can remove registrations for other
missing worktrees. Use prune only after separate inspection/authorization for
stale records. Never use `--force` automatically.

## When removal refuses or verification fails

Stop and show the file inventory and reason, without deleting anything. Give
specific reversible options: commit relevant work, preserve/move local-only
files to an approved destination, leave the worktree in place, or obtain a
separate informed authorization to discard identified files. Re-inventory before
retry. If integration/checks fail, **keep the branch/worktree**.

Confirm removal by inspecting `git worktree list --porcelain`. Report what was
removed, what remained, and any unverified external/host-managed state.

See the official Git documentation for semantics:
<https://git-scm.com/docs/git-worktree>
