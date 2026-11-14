---
name: subagent-driven-development
description: >-
  Use when executing a written implementation plan of three or more mostly
  independent tasks, in the current session. Dispatches a fresh subagent per
  task with a combined spec-compliance and code-quality review after each, then
  a final whole-branch review, under repository governance (resumable ledger,
  human gates, fix-round cap that escalates to the human). Prefer over
  executing-plans when all work stays in one session and tasks do not need
  parallel worktrees.
---

# Subagent-Driven Development

Execute a plan by dispatching a fresh subagent per task, reviewing each task's
implementation for spec compliance and code quality, then finishing the branch.

**Why it exists:** a fresh subagent per task keeps each implementer focused on
one brief and keeps the controller's context free for coordination, while an
independent review per task catches what self-review misses. This skill adds
this repository's governance to the generic method: a recoverable ledger, human
gates, and the `.agent-sync/` workspace.

## Outcome and acceptance

The run is done only when all of these hold, each observable:

- every plan task has a `Task <N>: complete` ledger line, and each one's review
  ended spec ✅ and quality approved (or the human parked the finding);
- the implementers' reports show passing covering tests with command and output,
  and the controller has run the plan's validation commands at HEAD (then
  `verification-before-completion`) with results recorded, not assumed;
- the final whole-branch review has a recorded verdict and its findings are
  fixed or handed to the human;
- the change is minimal for the plan: nothing the plan did not request, and no
  Critical/Important finding left open without a recorded ruling (the
  controller's where the spec settles it, otherwise the human's);
- every `Ruling:` ledger line is listed in the final message.

Workflow compliance alone (every template dispatched) is not success: report
what you could not verify instead of claiming the run complete.

## When to use

Choose this skill when **all three** conditions hold:

1. You have a written implementation plan (from `writing-plans` or equivalent)
   with **three or more tasks**. One or two tasks do not repay the ledger,
   per-task review, and final review: implement them directly and run one
   `code-review` pass at the end, unless the human asks for the full process.
2. The plan's tasks are mostly independent: each can be implemented and reviewed
   from its brief plus at most the previous task's report, and no more than a
   quarter of the tasks need an earlier task's code. Record the call (task
   count, dependent tasks) in the ledger.
3. You will execute all tasks in the current session (no parallel worktrees).

If tasks are tightly coupled, or you need parallel or separate sessions, use
`executing-plans` instead. If no plan exists, run `writing-plans` first (or
`brainstorming` before that).

## Prerequisites

- A plan file with numbered tasks (for example `docs/plans/feature-plan.md`) and
  its base commit identified.
- An isolated branch or worktree (`using-git-worktrees`). Never start
  implementation on `main`/`master` without the human's explicit consent.
- A shell positioned **inside the git working tree you are executing in**. The
  scripts use that working tree's repository, never one derived from the plan
  file's location (a plan often sits in the main checkout while you work in a
  linked worktree). Run them as `bash <skill-dir>/scripts/<name>.sh ...` by
  absolute path, or add `-C DIR` to act on another working tree.

`scripts/sdd-workspace.sh PLAN_FILE` creates and prints the per-plan workspace
`.agent-sync/sdd/<plan-basename>/` (a distinct directory for each plan, even
when two plans share a filename). Ledger, briefs, reports, review packages and
validation logs live there; another plan's directory is never yours to read or
write.

## Process

### Setup (controller does once)

1. Read the plan once. Note its context and Global Constraints. If it names a
   spec, read that too: the spec is the binding authority, the plan is its
   argument. A plan with no reachable spec gets a ledger note, and rulings made
   without one are provisional.
2. Create a task-list entry per task (TodoWrite or the session's task tool).
3. Resolve the workspace and look for `<workspace>/progress.md`. **If it exists,
   read `references/resuming.md` before anything else.** Otherwise create it
   with the identity line `# SDD ledger — plan: <plan file path>` and the plan's
   BASE commit.
4. **Before dispatching Task 1, read `references/preflight.md`** and run the
   conflict scan it describes; its table and rulings go in the ledger.
5. **If the plan has several small same-shape edits, read
   `references/batching.md`.** Anything needing its own judgment, tests, or
   review surface gets one dispatch per task.

### When to stop

Do not pause between tasks for progress check-ins or "should I continue?"
prompts. Stop and ask the human only for:

- an irreversible or destructive operation;
- a security-sensitive action;
- a side effect outside this worktree (merge, push to a shared branch, publish;
  the controller never merges);
- a plan so broken that every path forward is a guess;
- a review loop that reaches its round cap (`references/fix-loop.md`);
- a material public, data, or billing choice (a ruling that changes
  architecture, public API, data, security, or billing also goes to the Veto
  Buffer);
- starting implementation on `main`/`master` with no `Consent:` ledger line.

A stop halts the run at that step: do not run or delegate the step, and do not
continue to later tasks until the human answers. Work already complete stays
complete. Record the answer as `Consent: <what, who, when>` in the ledger.
Everything else is a ruling in the ledger, not a stall.

### Per task (repeat for each)

1. **Record BASE** (`git rev-parse HEAD`) in the ledger, then extract the brief:
   `scripts/task-brief.sh PLAN_FILE N` writes `<workspace>/task-N-brief.md`. N
   is compared to the heading's whole task ID, so `5` and `5.1` are distinct
   tasks.

2. **Dispatch the implementer** using `./implementer-prompt.md`. The dispatch
   describes one task, never the session's history:
   - one line on where the task fits;
   - the brief path, as "read this first, it is your requirements with exact
     values to use verbatim" (exact values appear only in the brief);
   - interfaces and decisions from earlier tasks the brief cannot know, and your
     resolution of any ambiguity you noticed;
   - the report path `<workspace>/task-N-report.md` and the report contract;
   - a pointer to any ledger entry where an earlier task parked a finding in
     this task's area.

   Hand artifacts over as files: anything pasted into a prompt or printed back
   stays in your context. Never make a subagent read the whole plan, and never
   dispatch implementers in parallel. Record the implementer's agent identity in
   the ledger as `Task <N>: implementer <agent id>` (fix rounds resume it). It
   writes its full report to the report file and returns only status, commits, a
   one-line test summary, and concerns.

3. **Handle the status.** DONE: go to step 4. Anything else (DONE_WITH_CONCERNS,
   NEEDS_CONTEXT, BLOCKED): **read `references/handling-reports.md`.**

4. **Generate the review package and dispatch the reviewer:**
   `scripts/review-package.sh PLAN_FILE BASE HEAD` (BASE from step 1, never
   `HEAD~1`, which drops all but the last commit of a multi-commit task), then
   `./task-reviewer-prompt.md` with four inputs: the brief file, the report
   file, the printed diff path, and the plan's binding constraints copied
   verbatim. When writing the reviewer prompt:
   - never tell it to ignore or down-rank anything ("do not flag", "at most
     Minor", "the plan chose"); adjudicate suspected false positives in the
     loop;
   - no open-ended directives ("check all uses") without a task-specific reason;
   - do not ask it to re-run tests the implementer already ran.

   Before accepting a ✅ verdict, spot-check at least one cited `file:line`
   against the file at HEAD; a verdict with no citations is not accepted. If a
   citation does not match the file, read the cited file yourself, ledger the
   discrepancy, and accept the verdict only if the substance holds; otherwise
   re-dispatch the reviewer. **If the reviewer reports "⚠️ Cannot verify from
   diff" items, read `references/cannot-verify.md`.**

5. **If the review reports spec ❌, a Critical or Important finding, or a
   confirmed ⚠️ gap, read `references/fix-loop.md`** and follow it. Five rounds
   at most, then escalate to the human.

6. **Complete the task:** append
   `Task <N>: complete (commits <base7>..<head7>, review clean)` to the ledger
   in the same message as other bookkeeping, then mark the task-list entry
   complete. Never start the next task while a Critical/Important finding is
   neither fixed nor parked by the human.

### After all tasks

**Read `references/final-review.md`.** It covers validation at HEAD, the final
whole-branch review, the single fix wave, the check before you claim done, the
final-message shape (Delivered, Verified, Unverified, Deferred minors and parked
findings, Rulings I made, Next step), and finishing.

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

- **Turn count beats token price.** The cheapest tier often takes 2-3x the turns
  on multi-step work. Tier 2 is the floor for reviewers (a scoped re-review of a
  small fix diff may use Tier 3) and for implementers working from prose; Tier 3
  for an implementer only when the brief contains the complete code to write, or
  for a single-file mechanical fix.
- **By complexity:** one or two files with a complete spec, cheaper tier;
  multi-file integration, standard; design judgment, most capable.
- **Raise the tier** for a final review of a subtle or high-risk diff
  (concurrency, auth, data migration) and for fix rounds 4-5.

## Templates and scripts

| Template                            | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `./implementer-prompt.md`           | Dispatch an implementer subagent for one task            |
| `./task-reviewer-prompt.md`         | Combined spec-compliance + code-quality review (default) |
| `./re-review-prompt.md`             | Scoped re-review after a fix round                       |
| `./spec-reviewer-prompt.md`         | Spec-compliance-only review (alternative)                |
| `./code-quality-reviewer-prompt.md` | Code-quality-only review (alternative)                   |

Default to the combined reviewer (one invocation, both verdicts). Use the
separate pair only for an adversarial spec review by a different model.

| Script                                                             | Purpose                                             |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| `scripts/sdd-repo.sh [--with-commit]`                              | Print the working tree's repo root (exit 2 if none) |
| `scripts/sdd-workspace.sh [-C DIR] PLAN_FILE`                      | Create and print the per-plan workspace             |
| `scripts/task-brief.sh [-C DIR] PLAN_FILE N`                       | Extract task N's full text to a brief file          |
| `scripts/review-package.sh [-C DIR] PLAN_FILE BASE HEAD [OUTFILE]` | Generate the diff package for a review              |

All scripts are Bash. Exit codes: 2 for usage errors, bad input, or no git
working tree here; 3 for an unknown task, an empty range, or a HEAD that is not
a descendant of BASE; 4 for a plan whose unclosed code fence hides the requested
task's end. `bash evals/test-scripts.sh` re-runs their tests.

## Red flags

- **A subagent that cannot be resumed or fails entirely:** dispatch a fresh one
  with specific instructions, the brief path, and the report path. Do not fix
  manually.
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
- A ledger correction comes before any new dispatch: if a ledgered claim turns
  out false, fix the ledger and re-verify before starting the next task.
- Ledger only results you saw: capture command output to a log file and read the
  summary from it. A pipe through `grep` that matches nothing is not a result.

## Edge cases

- **Task depends on a previous task's output:** dispatch sequentially (the
  default) and include the prior report and file paths in the dispatch.
- **Plan changes mid-execution:** stop, update the plan, re-extract affected
  briefs with `scripts/task-brief.sh`, and resume. Never continue with stale
  briefs.
- **Reviewer and implementer disagree:** the reviewer's verdict stands; a valid
  implementer concern is adjudicated by the controller, never overruled by the
  implementer.
- **Scripts run from the wrong place:** they exit 2 with a message when the
  current directory is not inside a git working tree (or has no commit yet).
  `cd` into the working tree you are executing in, or pass `-C DIR`.

## Integration

- **Upstream:** `writing-plans` produces the plan this skill executes.
- **Downstream:** `finishing-a-development-branch` after all tasks complete.
- **Subagents follow:** `test-driven-development` for each task.
- **Alternative:** `executing-plans` for tightly coupled plans, or for parallel
  or separate sessions.
- **Upstream variant:** `superpowers:subagent-driven-development`, merged here
  from plugin 7.0.2 (including its `references/` split, `sdd-repo` and the
  working-tree repository rule). Where they differ this skill follows two repo
  rules: human gates and the Veto Buffer (`.claude/rules/orchestration.md`) and
  Tier 2 as the default final-review model (`.claude/rules/performance.md`).
  Other differences are local choices, not repo rules: escalating to the human
  at the round cap (upstream adjudicates itself), the `.agent-sync/sdd/`
  workspace kept after the run (the `.agent-sync/` directory is the repo's
  convention for orchestration state, per `.claude/rules/orchestration.md`; its
  `sdd/` subdirectory is this skill's own choice), the three-task threshold, the
  main-branch consent stop, the Validate-at-HEAD and final-message steps, the
  `.sh` script names, the rewritten alternative reviewer templates (required
  `model:`, files not pasted text, no plugin dependency), the quote-the-line
  citation rule, and the ledger-only-what-you-saw rule. Re-diff against upstream
  whenever the plugin version changes, and update this list and the version
  above. The maintainer is the human acceptance owner for this repository's
  skills.
