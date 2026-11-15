# Linked-worktree cleanup: safe execution guide

**Load only** when the user separately requests removal of a linked worktree and
its integration/discard disposition has been decided. Read-only branch closeout
or PR creation **never** authorizes checkout removal. Worktree removal is a
destructive filesystem operation, not routine housekeeping.

## 1. Discover target, ownership, and host constraints

From the candidate checkout, issue these **individual cross-shell Git commands**
(no Bash-only assignment or pipeline):

```text
git rev-parse --show-toplevel
git rev-parse --git-dir
git rev-parse --git-common-dir && pwd -P
git worktree list --porcelain
git status --porcelain=v1 --untracked-files=all
git status --ignored --short
```

Use the worktree registry and canonical paths to establish whether the target is
the primary checkout or a linked checkout; the primary must **not** be removed.
The Git directory and common directory may be printed as relative paths, so
resolve them against the actual checkout before comparing. A detached HEAD is
**not** proof of host ownership, and a named branch is **not** proof of user
ownership. Confirm task origin and host/workspace policy. Leave host-managed
worktrees to their host-specific removal mechanism; unknown ownership is
`BLOCKED` until resolved.

## 2. Check data and authorized end state

Confirm the exact absolute checkout path, intended base/branch, verified
integration or approved discard result, and expected post-cleanup status. Do not
infer that a PR creation means a merge. Branch deletion is a **separate**
request; before deletion ensure correct target reachability and retain a
recovery ref/checkpoint.

Inventory staged/unstaged/untracked **and ignored** files. Ignored paths may
contain irreplaceable local secrets; record paths/types without copying their
contents to logs. The following is dry-run only (substitute a previously
verified absolute path and run from a safe registered checkout):

```text
git -C "<approved-target>" clean -ndx
```

Do not replace `-n` with `-f`. Confirm absence or explicit preservation of
valuable local-only data. Locks and submodules may prohibit safe removal; stop
rather than force. Never `git clean -fdx`, `git worktree remove --force` or
routine `git worktree prune` to overcome a refusal.

## 3. Remove only the explicitly approved checkout

Choose `OTHER_WORKTREE` using the registry: an existing registered checkout
**outside** the target, never just its parent filesystem directory. Run the
following individually in the actual shell, substituting verified absolute paths
in place of `<...>`:

```text
git -C "<other-checkout>" worktree remove -- "<approved-target>"
git -C "<other-checkout>" worktree list --porcelain
```

Require success exit status **and** absence of the registered target in the
post-operation registry; verify the primary and unrelated linked worktrees
remain intact. Do not treat success of a directory deletion as evidence of safe
branch deletion or a completed integration.

## 4. Stop, recover, and report

If removal refuses or state differs, **stop** and keep the branch/worktree.
Report the exact refusal and paths at risk; offer reversible next steps: commit
authorised work, move local-only content to a user-approved destination, leave
the checkout registered, or seek separately informed approval about specific
disposable files. Re-inventory and redo the pre-execution gate before any retry.
Never auto-force. Capture action and verified result in the handoff ledger,
including preserved worktrees and unverified host-managed state.

Official command semantics: <https://git-scm.com/docs/git-worktree>
