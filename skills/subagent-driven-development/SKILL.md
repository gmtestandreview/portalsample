---
name: subagent-driven-development
description: >-
  Use when executing a written implementation plan of three or more mostly
  independent tasks, in the current session. Dispatches a fresh subagent per
  task with a combined spec-compliance and code-quality review after each, then
  a final whole-branch review, under repository governance (resumable ledger,
  human gates, 3-round fix cap). Prefer over executing-plans when all work stays
  in one session and tasks do not need parallel worktrees.
---

# Subagent-Driven Development

Execute a plan by dispatching a fresh subagent per task, reviewing each task's
implementation for spec compliance and code quality, then finishing the branch.

**Why it exists:** a fresh subagent per task keeps each implementer focused on
one brief and keeps the controller's context free for coordination, while an
independent review per task catches what self-review misses. This skill adds
this repository's governance on top of the generic method: a recoverable ledger,
human gates, a 3-round fix cap, and the `.agent-sync/` workspace.

## Outcome and acceptance

The run is done only when all of these hold, each observable:

- every plan task has a `Task <N>: complete` ledger line, and each one's review
  ended spec ✅ and quality approved (or the human parked the finding);
- the implementers' reports show passing covering tests with command and output,
  and the controller has run the plan's validation commands at HEAD (the focused
  checks the plan names, then `verification-before-completion`) with results
  recorded, not assumed;
- the final whole-branch review has a recorded verdict and its findings are
  fixed or handed to the human;
- the change is minimal for the plan: nothing the plan did not request, and no
  Critical/Important finding left open without a human-approved ruling;
- every `Ruling:` ledger line is listed in the final message.

Workflow compliance alone (every template dispatched) is not success: report
what you could not verify instead of claiming the run complete.

## When to use

Choose this skill when **all three** conditions hold:

1. You have a written implementation plan (from `writing-plans` or equivalent)
   with **three or more tasks**. One or two tasks do not repay the ledger,
   per-task review, and final review: implement them directly and use
   `requesting-code-review`, unless the human asks for the full process.
2. The plan's tasks are mostly independent: each can be implemented and reviewed
   from its brief plus at most the previous task's report, and no more than a
   quarter of the tasks need an earlier task's code. Record the call (task
   count, dependent tasks) in the ledger.
3. You will execute all tasks in the current session (no parallel worktrees).

If tasks are tightly coupled or you need parallel sessions, use
`executing-plans` instead. If no plan exists, run `writing-plans` first (or
`brainstorming` before that).

## Prerequisites

- A plan file with numbered tasks (e.g. `docs/plans/feature-plan.md`).
- The plan's base commit identified (for diffing later).
- An isolated branch or worktree (`using-git-worktrees`). Never start
  implementation on `main`/`master` without the human's explicit consent.
- A working directory where scripts can run, inside the repository that owns the
  plan.

Run `scripts/sdd-workspace PLAN_FILE` once to create the per-plan working
directory at `.agent-sync/sdd/<plan-basename>/` and print its path. All
artifacts for this plan (ledger, briefs, reports, review packages) live there.
Another plan's directory is never yours to read or write.

## Process

### Setup (controller does once)

1. Read the plan once. Note its context and Global Constraints. If it names a
   spec, read that too: the spec is the binding authority, the plan is its
   argument. A plan with no reachable spec gets a ledger note, and rulings made
   without one are provisional.
2. Create a task-list entry per task (TodoWrite or the session's task tool).
3. Resolve the workspace and check `<workspace>/progress.md` before anything
   else. Memory does not survive compaction (controllers have re-dispatched
   whole completed sequences), so the ledger and `git log` outrank recollection.
   - First line names this plan: `# SDD ledger — plan: <plan file path>`. Tasks
     with a `Task <N>: complete` line are DONE; resume at the first task without
     one. A task whose last line is a fix round is mid-loop: resume at the next
     round.
   - No ledger, or a ledger naming a different plan: start a fresh one and leave
     the other plan's files alone.
4. Pre-flight conflict scan, written to the ledger as a table, not a verdict: a
   row per pair of tasks sharing a file or interface (what one produces, what
   the other consumes), a row per task for self-consistency (tests vs code,
   files created vs later touched), and a row for anything the plan mandates
   that the review rubric treats as a defect (a test asserting nothing, verbatim
   duplication). Rule on every finding before Task 1 and ledger it as
   `Ruling: <what you decided> — <why> — <what it costs if wrong>`. A ruling
   that changes architecture, public API, data, security, or billing also goes
   to the Veto Buffer for the human; never resolve those alone.
5. Tasks that are small, independent edits of the same kind across disjoint
   files may be batched into one implementer dispatch listing every file and its
   change; review its diff as one unit, file by file. Anything needing its own
   judgment, tests, or review surface gets one dispatch per task.

### When to stop

Do not pause between tasks for progress check-ins or "should I continue?"
prompts. Stop and ask the human only for:

- an irreversible or destructive operation;
- a security-sensitive action;
- a side effect outside this worktree (merge, push to a shared branch, publish;
  the controller never merges);
- a plan so broken that every path forward is a guess;
- a review loop that reaches its round cap (below);
- a material public, data, or billing choice (see Setup step 4).

Everything else is a ruling in the ledger, not a stall.

### Per task (repeat for each)

1. **Record BASE** (`git rev-parse HEAD`) in the ledger, then **extract brief:**
   run `scripts/task-brief PLAN_FILE N` to write `<workspace>/task-N-brief.md`.
   N matches the heading's whole task number, so `5` and `5.1` are distinct
   tasks.

2. **Dispatch the implementer** using `./implementer-prompt.md`. The dispatch
   describes one task, never the session's history:
   - one line on where the task fits;
   - the brief path, as "read this first, it is your requirements with exact
     values to use verbatim" (exact values appear only in the brief);
   - interfaces and decisions from earlier tasks the brief cannot know, plus
     your resolution of any ambiguity you noticed;
   - the report path `<workspace>/task-N-report.md` (the brief's name with
     `report`) and the report contract;
   - a pointer to any ledger entry where an earlier task parked a finding in
     this task's area.

   Hand artifacts over as files: anything pasted into a prompt or printed back
   stays in your context. Never make a subagent read the whole plan, and never
   dispatch implementers in parallel. Record the implementer's agent identity
   (fix rounds resume it). It writes its full report to the report file and
   returns only status, commits, a one-line test summary, and concerns.

3. **Handle the implementer's status:**
   - **DONE:** go to step 4.
   - **DONE_WITH_CONCERNS:** read the concerns first. Correctness or scope
     concerns are addressed before review; observations (for example "this file
     is getting large") are noted in the ledger, then proceed.
   - **NEEDS_CONTEXT:** supply the missing context and re-dispatch.
   - **BLOCKED:** context problem, supply it and re-dispatch on the same model;
     needs more reasoning, re-dispatch on a more capable model; task too large,
     split it; plan wrong, rule on the correction, ledger it, and carry the
     ruling in the dispatch. Never retry the same model unchanged.

4. **Generate the review package:** run
   `scripts/review-package PLAN_FILE BASE HEAD` (BASE from step 1, never
   `HEAD~1`, which drops all but the last commit of a multi-commit task) and
   dispatch `./task-reviewer-prompt.md` (combined spec-compliance +
   code-quality, single pass) with four inputs: the brief file, the report file,
   the printed diff path, and the plan's binding constraints copied verbatim
   (exact values, formats, stated relationships). When writing the reviewer
   prompt:
   - never tell it to ignore or down-rank anything ("do not flag", "at most
     Minor", "the plan chose"); adjudicate suspected false positives in the
     loop;
   - no open-ended directives ("check all uses") without a task-specific reason;
   - do not ask it to re-run tests the implementer already ran.

   Before accepting a ✅ verdict, spot-check at least one cited `file:line`
   against the diff; a verdict with no citations is not accepted.

   Resolve every "⚠️ Cannot verify from diff" item yourself before marking the
   task complete (you hold the cross-task context), with evidence: the command
   you ran or the file and lines you read, recorded in the ledger. A judgment
   without evidence stays open. A confirmed gap counts as a failed spec review
   and enters the fix loop.

5. **Fix loop**, when the review reports spec ❌, any Critical or Important
   finding, or a confirmed ⚠️ gap:
   - Minor findings never enter the loop: ledger them as
     `Task <N>: minor (deferred): <one-liner>`; the final review triages them.
   - A finding labeled plan-mandated, or one that conflicts with the plan's
     text, is yours to rule on against the spec before acting: ledger the
     ruling. Do not dismiss a finding because the plan mandates it.
   - A fix round is one fix dispatch plus one scoped re-review. **Resume the
     original implementer** with the open findings verbatim. If the harness
     cannot message a live subagent, dispatch a fresh implementer carrying the
     brief path, report path, and findings; the report file is the memory.
   - Each round the implementer fixes, re-runs the tests covering the amended
     code, and appends a fix report to the same report file. Before
     re-reviewing, confirm that report names the covering tests, the command,
     and the output.
   - Re-review: `scripts/review-package PLAN_FILE FIX_BASE HEAD` (FIX_BASE is
     the head the previous review saw) and `./re-review-prompt.md` with the
     findings, brief, report, and diff path. New Critical/Important breakage in
     the fix diff joins the open findings; out-of-scope observations go to the
     ledger as deferred minors and never extend the loop.
   - After each round append
     `Task <N>: fix round <R>/3 (<X> addressed, <Y> open — <one-liners>; commits <a7>..<b7>)`.
   - Never fix findings yourself in the controller session: it pollutes your
     context and skips review.
   - **Round cap: 3.** If round 3's re-review still leaves findings open, stop
     and escalate to the human with the open findings and the report path. The
     human may authorize a fresh implementer on a more capable model, a re-plan,
     or a parked finding with a recorded ruling.

6. **Complete the task:** append
   `Task <N>: complete (commits <base7>..<head7>, review clean)` to the ledger
   in the same message as other bookkeeping, then mark the task-list entry
   complete. Never start the next task while a Critical/Important finding is
   neither fixed nor parked by the human.

### After all tasks

1. **Validate at HEAD.** Run the validation commands the plan names; if it names
   none, the repository's documented ones (`CLAUDE.md`, `AGENTS.md`, package
   scripts); if there are none, stop and ask the human. Capture output to
   `<workspace>/validation-<head7>.log` and ledger
   `Validation @<head7>: <command> -> exit <code>; log <path>`. A non-zero exit
   is a finding for the fix wave in step 3, not something to report around.
2. Final whole-branch review: run
   `scripts/review-package PLAN_FILE MERGE_BASE HEAD` (MERGE_BASE = the commit
   the branch started from, for example `git merge-base main HEAD`) and dispatch
   `./task-reviewer-prompt.md` with that diff path, the plan file as the
   requirements source in place of a task brief (set `[BRIEF_FILE]` to the
   plan), its global constraints, and the ledger's deferred minors and parked
   findings so it can triage which must be fixed before merge.
3. If it (or step 1) returns findings, dispatch ONE fix subagent with the
   complete findings list (per-finding fixers each rebuild context and re-run
   suites), then run exactly one scoped re-review of the fix range and re-run
   step 1 at the new HEAD. There is no second fix wave: residual load-bearing
   findings go to the human when `finishing-a-development-branch` presents the
   options.
4. **Check before you claim done.** Compare each "Outcome and acceptance"
   criterion with its evidence (ledger lines, report files, validation log). Any
   criterion without evidence goes under "Unverified" below; do not word the
   result as complete.
5. **Final message**, in this order, each section present ("none" if empty):
   - **Delivered:** tasks completed (count, commit range).
   - **Verified:** each validation command with exit status and log path.
   - **Unverified:** criteria with no evidence, and anything you could not run.
   - **Deferred minors** and **parked findings:** one line each with its ruling.
   - **Rulings I made:** every ledger line containing `Ruling:`, in order, each
     with what it costs if wrong. The list is exhaustive: a ruling left only in
     the ledger is a decision made in secret.
   - **Next step:** what the human must decide or do.
6. Use `finishing-a-development-branch`. Keep the workspace; delete it only if
   the human asks.

## Model selection

**Always specify `model:` explicitly on every dispatch.** An omitted `model:`
silently inherits the session's most expensive model and defeats this section.
Use the lowest tier that can do the role (`.claude/rules/performance.md`).

| Role                    | Recommended tier     | Rationale                     |
| ----------------------- | -------------------- | ----------------------------- |
| Implementer             | Tier 2 (balanced)    | Writes code, runs tests       |
| Task reviewer           | Tier 2 (balanced)    | Reads diffs, assesses quality |
| Re-reviewer (small fix) | Tier 3 (lightweight) | Scoped to the fix diff only   |
| Final branch reviewer   | Tier 2 (balanced)    | Broader scope, still review   |

Adjust by task, not by habit:

- **Turn count beats token price.** The cheapest tier often takes 2-3x the turns
  on multi-step work. Tier 2 is the floor for reviewers and for implementers
  working from prose; Tier 3 only when the brief contains the complete code to
  write, or for a single-file mechanical fix.
- **By complexity:** one or two files with a complete spec, cheaper tier;
  multi-file integration, standard; design judgment, most capable.
- **Raise the tier** for a final review of a subtle or high-risk diff
  (concurrency, auth, data migration) and for any human-authorized fresh
  implementer after the round cap.

## Templates and scripts

### Templates

| Template                            | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `./implementer-prompt.md`           | Dispatch an implementer subagent for one task            |
| `./task-reviewer-prompt.md`         | Combined spec-compliance + code-quality review (primary) |
| `./re-review-prompt.md`             | Scoped re-review after a fix round                       |
| `./spec-reviewer-prompt.md`         | Spec-compliance-only review (alternative)                |
| `./code-quality-reviewer-prompt.md` | Code-quality-only review (alternative)                   |

Default to the combined `task-reviewer-prompt.md` (one invocation, both
verdicts). Use the separate spec and quality pair only for an adversarial spec
review by a different model.

### Scripts

| Script                                       | Purpose                                                |
| -------------------------------------------- | ------------------------------------------------------ |
| `scripts/sdd-workspace PLAN_FILE`            | Create per-plan workspace at `.agent-sync/sdd/<plan>/` |
| `scripts/task-brief PLAN_FILE N`             | Extract task N's full text to a brief file             |
| `scripts/review-package PLAN_FILE BASE HEAD` | Generate diff package for review                       |

All scripts are Bash: run them as `bash <skill-dir>/scripts/<name> ...` (exec
bits may be stripped), from anywhere inside the plan's repository. Two plans
that share a filename get distinct workspaces (a `plan-path` marker records the
owner). `review-package` exits 3 on an empty range or a HEAD that is not a
descendant of BASE.

## Example

```text
[Read plan: docs/plans/feature-plan.md — 5 tasks]
[Run: scripts/sdd-workspace docs/plans/feature-plan.md]
[Create task list: Task 1–5; create progress.md ledger, write pre-flight table]

Task 1:
  [Ledger: BASE a1b2c3d. Run: scripts/task-brief docs/plans/feature-plan.md 1]
  [Dispatch implementer with task-1-brief.md + task-1-report.md paths + context]
  Implementer: "Should the hook install at user or system level?"
  Controller: "User level (~/.config/hooks/)"
  Implementer: DONE, 5/5 tests pass, committed; report in task-1-report.md.
  [Run: scripts/review-package ... BASE HEAD]
  [Dispatch reviewer with task-reviewer-prompt.md]
  Reviewer: ✅ Spec compliant. Code quality approved.
  [Ledger: Task 1: complete (commits a1b2c3d..d4e5f6a, review clean)]

Task 2:
  Reviewer: ❌ Missing progress reporting. Extra --json flag.
  [Resume implementer with both findings; it fixes, re-runs the covering test,
   appends a fix report. Dispatch re-reviewer with re-review-prompt.md]
  Re-reviewer: All findings addressed, no new breakage.
  [Ledger: Task 2: fix round 1/3 (2 addressed, 0 open; commits d4e5f6a..b7c8d9e)]
  [Ledger: Task 2: complete (commits d4e5f6a..b7c8d9e, review clean)]

... Tasks 3–5 ...

[Run review-package PLAN MERGE_BASE HEAD; dispatch final branch reviewer]
[Final message: "Rulings I made" list, then finishing-a-development-branch]
```

## Red flags

- **A subagent that cannot be resumed or fails entirely:** dispatch a fresh one
  with specific instructions, the brief path, and the report path. Do not fix
  manually (context pollution).
- **A subagent that spawns its own reviewer or helper** is a defect to flag, not
  extra rigor: it duplicates a review seat at full cost and its approval counts
  for nothing. The task reviewer is the gate.
- **Waiting on subagents:** do not poll with short timeouts or sit in one silent
  open-ended wait. Do local work (ledger, packaging the next review); when idle,
  wait in bounded 5-10 minute stretches, post one status line between them, and
  chase any child that finished without reporting.

| Excuse                                             | Reality                                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| "Close enough on spec compliance"                  | Spec gaps mean not done. Fix, or hit the cap and escalate.                        |
| "I'll fix it myself, dispatching is overhead"      | Controller fixes pollute your context and skip review. Resume the implementer.    |
| "One more round will converge"                     | Past the cap the failure is structural. Escalate.                                 |
| "The reviewer will just find something new anyway" | Scoped re-reviews verify fixes; new findings elsewhere go to the ledger.          |
| "The fix was small, skip the re-review"            | Unreviewed fixes are how regressions land. Every round ends with a re-review.     |
| "Ledger bookkeeping is overhead"                   | The ledger survives compaction; without it controllers re-dispatch finished work. |

## Safety

- Record the base SHA before each task. To revert a task,
  `git reset --soft <base>` undoes only that task's commits.
- The controller never writes product code; reviews are read-only (templates
  enforce this).
- Do not dispatch a new task until the previous task's review loop is closed.

## Edge cases

- **Task depends on a previous task's output:** dispatch sequentially (the
  default) and include the prior report and file paths in the dispatch.
- **Plan changes mid-execution:** stop, update the plan, re-extract affected
  briefs with `scripts/task-brief`, and resume. Never continue with stale
  briefs.
- **Reviewer and implementer disagree:** the reviewer's verdict stands; a valid
  implementer concern is adjudicated by the controller, never overruled by the
  implementer.
- **Review loop reaches round 3 with findings open:** stop and escalate to the
  human (see Per task, step 5). The task may need re-planning or a different
  implementer approach.
- **Ledger missing after compaction or `git clean -fdx`:** rebuild it from
  `git log` (the commits it named still exist) before dispatching anything;
  never re-dispatch a task whose commits are already in history. A rebuilt
  ledger carries no test evidence: mark those tasks `evidence lost` and cover
  them in the "Validate at HEAD" step.
- **Plan outside a git repo:** `sdd-workspace` exits 2. A plan under a parent
  repo (for example a home-directory repo) uses that repo, so keep plans in
  their own project.

## Integration

- **Upstream:** `writing-plans` produces the plan this skill executes.
- **Downstream:** `finishing-a-development-branch` after all tasks complete.
- **Subagents follow:** `test-driven-development` for each task.
- **Alternative:** `executing-plans` for parallel-session execution with
  worktrees.
- **Upstream variant:** `superpowers:subagent-driven-development` (plugin
  version 7.0.0) is what this skill was merged with. Here this skill takes
  precedence where they differ, each difference required by a repo rule: human
  gates and Veto Buffer (`.claude/rules/orchestration.md`), a 3-round fix cap
  that escalates to the human, the `.agent-sync/sdd/` workspace kept after the
  run, and Tier 2 as the default final-review model
  (`.claude/rules/performance.md`). Re-diff against the upstream skill whenever
  the plugin version changes, and update this list and the version above. The
  maintainer is the human acceptance owner for this repository's skills.
