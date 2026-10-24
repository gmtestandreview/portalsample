# Boundary: using-git-worktrees

## Skill purpose

Operational execution skill. Creates one isolated git worktree for a specific
feature or implementation plan, with safety verification (`.gitignore` guard),
polyglot project setup, and a clean baseline test run. Delivers a ready
workspace at a verified path.

## Distinguished from worktree-guide

**Boundary type:** precedence-aware

| Intent | Use |
|--------|-----|
| Create an isolated workspace for a specific feature or plan | **this skill** |
| Learn the worktree system / explore Ghostty + Lazygit workflows | `worktree-guide` |
| Programmatic invocation from `brainstorming` Phase 4 or `executing-plans` | **this skill** |
| Troubleshoot a worktree issue / get a reference card | `worktree-guide` |
| Multi-task parallel development setup with `/worktree-*` commands | `worktree-guide` |

## Validation cases

| Request | Correct skill |
|---------|--------------|
| "Set up a worktree for the auth feature" | using-git-worktrees |
| "Guide me through parallel development" | worktree-guide |
| "Before I start coding, isolate this branch" | using-git-worktrees |
| "Show me how to use Ghostty with worktrees" | worktree-guide |
| `brainstorming` approved — Phase 4 handoff | using-git-worktrees |
| "How do I clean up a worktree after merge?" | worktree-guide |

## see: BOUNDARY.md

[worktree-guide](../worktree-guide/BOUNDARY.md)
