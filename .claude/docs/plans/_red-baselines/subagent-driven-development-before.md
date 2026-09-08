# RED baseline — subagent-driven-development (pre-merge)

Date: 2026-09-09
Resolves to: `superpowers` plugin cache (unshadowed — not yet symlinked). Same
resolution mechanism verified live for `brainstorming` this session; the pre-merge
A Team 72-line fork in `skills/subagent-driven-development/SKILL.md` is NOT what
currently loads.

## Observable contract of the current (superpowers) body

- Fresh implementer subagent per task; **task review = spec compliance + code quality**, both required; broad whole-branch review at the end.
- **Ledger discipline**: each plan owns a git-ignored workspace at `.superpowers/sdd/<plan-basename>/`; `progress.md` ledger is the recovery map across compaction; `Task <N>: complete` lines mark done tasks.
- **Pre-flight conflict scan** of the plan (task-pair table) before Task 1; rule on every conflict, ledger it.
- **5-round fix-loop circuit breaker** per task: rounds 1–3 resume the implementer, rounds 4–5 fresh implementer on a higher model; at round 5 adjudicate (park / rule) — never silently discard.
- "Rulings, not stalls" — controller decides conflicts/ambiguities, ledgers `Ruling: <what> — <why> — <cost if wrong>`; only 4 things stop it (irreversible op, security-sensitive action, out-of-worktree side effect, wholly-broken plan).
- Model Selection section (turn-count beats token price; escalate rounds 4–5).
- Scripts: `scripts/sdd-workspace`, `scripts/task-brief`, `scripts/review-package`; prompt templates `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md`.
- Final review dispatches `superpowers:requesting-code-review`'s `code-reviewer.md`.
- Ends via `superpowers:finishing-a-development-branch`; "Rulings I made" hand-off.

## Representative task

Prompt: `"Execute this 2-task plan: (1) add a formatDate util with a test, (2) use it in appDetails.tsx."`
Expected: create the ledger under the plan workspace, dispatch a fresh subagent for task 1, run spec + quality review, mark complete, then task 2, then a final whole-branch review.

## Post-merge expectation (Task 2.2)

Behaviour is **preserved** — Task 2.2 adopts this body. Deltas:
1. frontmatter `description` = the A Team one;
2. scratch dir `.superpowers/sdd/` → `.agent-sync/sdd/` (in SKILL.md and `scripts/sdd-workspace`); prose `docs/superpowers/plans/` → `.claude/docs/plans/`;
3. `superpowers:finishing-a-development-branch` → `finishing-a-development-branch`, `superpowers:using-git-worktrees` → `using-git-worktrees`; final-review `../requesting-code-review/code-reviewer.md` → **dispatch the `code-reviewer` agent** (`requesting-code-review` is not ported, spec §8);
4. provenance comment;
5. keep the A Team Model-Selection tier table, merge SP's extra guidance, add `Tiers map to .claude/rules/performance.md.`

`subagent-driven-development-after.md` records the re-run confirming 1–5 and the
ledger + two-stage-review behaviour unchanged.
