---
name: subagent-driven-development
description: >-
  Use when executing a written implementation plan whose tasks are mostly
  independent, in the current session. Dispatches a fresh subagent per task
  with a combined spec-compliance and code-quality review after each, then
  a final whole-branch review. Prefer over executing-plans when all work
  stays in one session and tasks do not need parallel worktrees.
---

# Subagent-Driven Development

Execute a plan by dispatching a fresh subagent per task, reviewing each
task's implementation for spec compliance and code quality, then finishing
the branch.

## When to use

Choose this skill when **all three** conditions hold:

1. You have a written implementation plan (from `writing-plans` or equivalent).
2. The plan's tasks are mostly independent (no tight sequential coupling).
3. You will execute all tasks in the current session (no parallel worktrees).

If tasks are tightly coupled or you need parallel sessions, use
`executing-plans` instead. If no plan exists, run `writing-plans` first
(or `brainstorming` before that).

## Prerequisites

- A plan file with numbered tasks (e.g. `docs/plans/feature-plan.md`).
- The plan's base commit identified (for diffing later).
- A working directory where scripts can run.

Run `scripts/sdd-workspace PLAN_FILE` once to create the per-plan working
directory at `.agent-sync/sdd/<plan-basename>/`. All intermediate artifacts
(briefs, diffs, reports) go there.

## Process

### Setup (controller does once)

1. Read the plan file.
2. Extract every task's full text and note cross-task context.
3. Create a TodoWrite entry per task.
4. Run `scripts/sdd-workspace PLAN_FILE` to create the workspace.

### Per task (repeat for each)

1. **Extract brief:** Run `scripts/task-brief PLAN_FILE N` to write the task
   brief to `<workspace>/task-N-brief.md`.

2. **Dispatch implementer subagent** using `./implementer-prompt.md`.
   - If the implementer asks questions, answer clearly, then re-dispatch or
     let them continue.
   - The implementer implements, writes tests (TDD), commits, self-reviews,
     and writes a report file.

3. **Generate review package:** Run
   `scripts/review-package PLAN_FILE BASE HEAD` to write the diff to
   `<workspace>/review-<base7>..<head7>.diff`.

4. **Dispatch reviewer subagent** using `./task-reviewer-prompt.md` (combined
   spec-compliance + code-quality, single pass).

5. **If reviewer finds issues:**
   - The implementer subagent (same session, not a fresh dispatch) fixes them
     and commits.
   - Generate a new review package for the fix range.
   - Dispatch a re-reviewer using `./re-review-prompt.md`.
   - Repeat until all findings are addressed.

6. **Mark task complete** in TodoWrite.

### After all tasks

1. Dispatch a final whole-branch code reviewer for the entire implementation.
2. Use `finishing-a-development-branch` to complete the branch.

## Model selection

Choose the reviewer model deliberately. An omitted `model:` parameter
silently inherits the session's most expensive model, wasting budget on
review work a mid-tier model handles well.

| Role | Recommended tier | Rationale |
| --- | --- | --- |
| Implementer | Tier 2 (balanced) | Writes code, runs tests |
| Task reviewer | Tier 2 (balanced) | Reads diffs, assesses quality |
| Re-reviewer (small fix) | Tier 3 (lightweight) | Scoped to the fix diff only |
| Final branch reviewer | Tier 2 (balanced) | Broader scope, still review |

## Templates and scripts

### Templates

| Template | Purpose |
| --- | --- |
| `./implementer-prompt.md` | Dispatch an implementer subagent for one task |
| `./task-reviewer-prompt.md` | Combined spec-compliance + code-quality review (primary) |
| `./re-review-prompt.md` | Scoped re-review after a fix round |
| `./spec-reviewer-prompt.md` | Spec-compliance-only review (alternative) |
| `./code-quality-reviewer-prompt.md` | Code-quality-only review (alternative) |

The combined `task-reviewer-prompt.md` is the recommended default: one
subagent invocation instead of two, with both verdicts in a single pass. Use
the separate `spec-reviewer-prompt.md` + `code-quality-reviewer-prompt.md`
pair only when you need an adversarial spec review by a different model than
the quality review.

### Scripts

| Script | Purpose |
| --- | --- |
| `scripts/sdd-workspace PLAN_FILE` | Create per-plan workspace at `.agent-sync/sdd/<plan>/` |
| `scripts/task-brief PLAN_FILE N` | Extract task N's full text to a brief file |
| `scripts/review-package PLAN_FILE BASE HEAD` | Generate diff package for review |

All scripts are Bash. Run from the skill directory or with a full path.

## Example

```text
[Read plan: docs/plans/feature-plan.md — 5 tasks]
[Run: scripts/sdd-workspace docs/plans/feature-plan.md]
[Create TodoWrite: Task 1–5]

Task 1:
  [Run: scripts/task-brief docs/plans/feature-plan.md 1]
  [Dispatch implementer with task-1-brief.md + context]
  Implementer: "Should the hook install at user or system level?"
  Controller: "User level (~/.config/hooks/)"
  Implementer: Implemented, 5/5 tests pass, committed.
  [Run: scripts/review-package ... BASE HEAD]
  [Dispatch reviewer with task-reviewer-prompt.md]
  Reviewer: ✅ Spec compliant. Code quality approved.
  [Mark Task 1 complete]

Task 2:
  [Dispatch implementer]
  Implementer: Implemented verify/repair modes, 8/8 tests pass.
  [Dispatch reviewer]
  Reviewer: ❌ Missing progress reporting. Extra --json flag.
  [Implementer fixes: removes flag, adds reporting]
  [Dispatch re-reviewer with re-review-prompt.md]
  Re-reviewer: All findings addressed, no new breakage.
  [Mark Task 2 complete]

... Tasks 3–5 ...

[Dispatch final branch reviewer]
[Use finishing-a-development-branch]
```

## Red flags

**Never:**

- Skip reviews — every task gets a reviewer pass before moving on.
- Dispatch multiple implementation subagents in parallel (file conflicts).
- Make a subagent read the plan file directly — provide the extracted brief.
- Accept "close enough" on spec compliance — issues found means not done.
- Let self-review replace the actual review (both are needed).
- Move to the next task while the current task has open review findings.

**If a subagent asks questions:** answer clearly and completely before
letting them proceed.

**If a reviewer finds issues:** the implementer fixes, the re-reviewer
verifies, repeat until clean.

**If a subagent fails entirely:** dispatch a fresh fix subagent with
specific instructions. Do not fix manually (context pollution).

## Safety

- Record the base SHA before each task starts. If a task must be reverted,
  `git reset --soft <base>` undoes only that task's commits.
- The controller never writes product code — all implementation goes
  through subagents.
- Reviews are read-only. Templates enforce this explicitly.
- Do not dispatch a new task until the previous task's review loop is
  fully closed.

## Edge cases

- **Task depends on a previous task's output:** dispatch sequentially
  (the default). Include the prior task's report and relevant file paths
  as additional context for the dependent task.
- **Plan changes mid-execution:** stop, update the plan, re-extract
  affected briefs with `scripts/task-brief`, and resume. Do not continue
  with stale briefs.
- **Reviewer and implementer disagree:** the reviewer's verdict stands.
  If the implementer raises a valid concern, the controller adjudicates.
  The implementer never overrules the review.
- **Review loop exceeds 3 rounds:** escalate to the controller. The task
  may need re-planning or a different implementer approach.

## Integration

**Upstream (produces the plan this skill executes):**

- `writing-plans` — creates the implementation plan

**Downstream (after all tasks complete):**

- `finishing-a-development-branch` — branch cleanup and PR preparation

**Subagents should follow:**

- `test-driven-development` — TDD for each task's implementation

**Alternative workflow:**

- `executing-plans` — for parallel-session execution with worktrees
