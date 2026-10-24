# Boundary: worktree-guide

## Skill purpose

Pedagogical reference skill. Guides users through the parallel development
system using Ghostty terminal panels, Lazygit monitoring, and the
`/worktree-init|check|deliver|cleanup` command ecosystem. Provides keybinding
references, a full workflow walkthrough, troubleshooting, and a quick reference
card.

## Distinguished from using-git-worktrees

**Boundary type:** precedence-aware

| Intent | Use |
|--------|-----|
| Learn / explore the worktree system | **this skill** |
| Set up a Ghostty + Lazygit multi-task environment | **this skill** |
| Troubleshoot a worktree issue | **this skill** |
| Create one isolated workspace for a specific feature or plan | `using-git-worktrees` |
| Programmatic invocation from `brainstorming` or `executing-plans` | `using-git-worktrees` |

## Validation cases

| Request | Correct skill |
|---------|--------------|
| "Guide me through parallel development" | worktree-guide |
| "Set up a worktree for the auth feature" | using-git-worktrees |
| "Show me Ghostty keybindings for worktrees" | worktree-guide |
| "Before I start coding, isolate this branch" | using-git-worktrees |
| "How do I clean up a worktree after merge?" | worktree-guide |
| `brainstorming` Phase 4 handoff to create worktree | using-git-worktrees |

## see: BOUNDARY.md

[using-git-worktrees](../using-git-worktrees/BOUNDARY.md)
