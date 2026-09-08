# GREEN after-baseline — subagent-driven-development (post-merge, Task 2.2)

Date: 2026-09-09
Merge SOURCE: `.claude/docs/plans/_sp-6.3.0-snapshot/subagent-driven-development/`
(superpowers 6.3.0, frozen). Live plugin cache NOT consulted.

## What changed

- `skills/subagent-driven-development/SKILL.md` — body fully replaced with the
  snapshot body (was the 72-line pre-merge A Team fork). 5 preserved items +
  4 path/skill-ref rewrites applied (see table below).
- `skills/subagent-driven-development/scripts/{sdd-workspace,task-brief,review-package}`
  — copied from snapshot; `.superpowers/sdd` → `.agent-sync/sdd` in all three
  (code path in `sdd-workspace:36`, header comments in the other two).
- `skills/subagent-driven-development/{implementer,task-reviewer,re-review}-prompt.md`
  — copied verbatim from snapshot; no leak strings, self-contained, unmodified.
- `.gitignore` — `.agent-sync/sdd/` added on its own line, immediately below
  `.agent-sync/logs/`.

No files deleted.

## Representative task re-run (trace against the NEW SKILL.md)

Prompt: `"Execute this 2-task plan: (1) add a formatDate util with a test, (2) use it in appDetails.tsx."`

| Required behaviour | Present in new body? | Where |
|---|---|---|
| (a) Ledger created under `.agent-sync/sdd/` | YES | Setup §: `scripts/sdd-workspace PLAN_FILE` prints `<repo-root>/.agent-sync/sdd/<plan-basename>/`; ledger at `<workspace>/progress.md`, identity first line `# SDD ledger — plan: …`. Script `sdd-workspace:36` `base="$root/.agent-sync/sdd"`. |
| (b) Fresh subagent dispatched per task | YES | Opening line ("fresh implementer subagent per task"); "The Task Loop → 1. Dispatch the implementer"; process graph loop `More tasks remain? → Dispatch implementer subagent`; "Never dispatch multiple implementation subagents in parallel". Task 1 (formatDate util) and Task 2 (appDetails.tsx) each get their own `task-brief` + dispatch. |
| (c) Two-stage review (spec + quality) per task | YES | "3. Review the task": "never accept a report missing either verdict — spec compliance AND task quality are both required"; task-reviewer-prompt.md returns both. Fix loop gates on spec ❌ or Critical/Important before "Complete the task". |
| Final whole-branch review | YES (retargeted) | "Final Review": dispatch the `code-reviewer` agent (`.claude/agents/code-reviewer.md`) on the most capable model over `review-package … MERGE_BASE HEAD`. |
| Branch completion | YES | "Finish": "Rulings I made" hand-off, then `finishing-a-development-branch`. |

Behaviour is equivalent to the RED baseline. The snapshot body is richer than
the pre-merge A Team fork (adds: git-ignored per-plan workspace + ledger
discipline, pre-flight conflict-scan table, 5-round fix-loop circuit breaker,
"Rulings not stalls", batching of same-shape work, model-selection turn-count
guidance) — those are superpowers 6.3.0 gains adopted wholesale, not Task 2.2
deltas. Task 2.2 deltas are limited to items 1–5 + the `.gitignore` line.

## The 5 preserved items (applied)

| # | Item | Applied? | Where |
|---|---|---|---|
| 1 | Keep EXISTING A Team frontmatter `description` verbatim | YES | `SKILL.md` frontmatter — unchanged from pre-merge ("…Dispatches a fresh subagent per task with two-stage review (spec compliance, then code quality)."). Snapshot's shorter description discarded. |
| 2 | `.superpowers/sdd/` → `.agent-sync/sdd/`; `docs/superpowers/plans/` → `.claude/docs/plans/` | YES | SKILL.md: Setup § workspace path + old-flat-path sentence; Example Workflow `.claude/docs/plans/feature-plan.md` (×2). Scripts: `sdd-workspace` (code + 2 comments), `task-brief` (comment), `review-package` (comment). |
| 3 | `superpowers:finishing-a-development-branch` → `finishing-a-development-branch`; `superpowers:using-git-worktrees` → `using-git-worktrees`; final review retargeted to the `code-reviewer` agent; dangling `../requesting-code-review/…` removed | YES | SKILL.md: process graph nodes (×3 `code-reviewer agent … (.claude/agents/code-reviewer.md)`, ×2 `Use finishing-a-development-branch`); Setup § `using-git-worktrees`; "Final Review" para reworded to "Dispatch the `code-reviewer` agent (`.claude/agents/code-reviewer.md`) on the most capable available model … for the whole-branch diff"; "Finish" + Example Workflow `finishing-a-development-branch`. `requesting-code-review` / `../requesting-code-review/code-reviewer.md` no longer appears (grep-clean). |
| 4 | Provenance comment as first body line after closing `---` | YES | `SKILL.md` line 5: `<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->` |
| 5 | Keep tier guidance (snapshot's Model Selection is fine); add `Tiers map to .claude/rules/performance.md.` | YES | `SKILL.md` "## Model Selection" — snapshot guidance kept verbatim (turn-count beats token price; rounds 4-5 escalation; complexity signals); added line `Tiers map to .claude/rules/performance.md.` after the opening sentence. |

## `.gitignore` line

```
.agent-sync/logs/
.agent-sync/sdd/        <- added
__pycache__/
```

## REFACTOR checklist output

```
frontmatter OK
--- string leak check ---
clean
tier link OK
gitignore OK
provenance OK
--- referenced support files ---
OK   implementer-prompt.md
OK   re-review-prompt.md
OK   scripts/review-package
OK   scripts/sdd-workspace
OK   scripts/task-brief
OK   task-reviewer-prompt.md
--- git status ---
 M .gitignore
 M skills/subagent-driven-development/SKILL.md
?? skills/subagent-driven-development/implementer-prompt.md
?? skills/subagent-driven-development/re-review-prompt.md
?? skills/subagent-driven-development/scripts/
?? skills/subagent-driven-development/task-reviewer-prompt.md
```

## Verdict

PASS — body adopted, 5 preserved items + gitignore line applied, no string
leaks, all referenced support files present, behaviour equivalent to RED.
