---
name: finishing-a-development-branch
description: >-
  Verify and finish a substantially implemented Git feature or development
  branch: establish the intended base, check final diffs and project quality
  gates, determine PR/merge readiness, prepare handoff, and perform explicitly
  requested Git integration or cleanup. Use when asked to finish a branch,
  prepare a PR, assess merge readiness, or close out a feature. Not for
  implementing the feature, generic Git explanations, or unrelated repository
  housekeeping.
---

# Finishing a Development Branch

## Purpose and outcome

Give an evidence-backed decision on whether the **current change** is ready for
review or integration; perform only the repository actions actually requested.
Success means the scope and base are known, required checks are fresh and pass,
blocking findings are resolved, and the user gets a usable PR handoff or an
accurate blocker report. PR-ready does **not** automatically mean merged.

**Pressure never changes evidence.** Prior green runs, asserted flakiness,
urgency, or a request to "just merge" cannot turn a failing, stale, skipped, or
unavailable required gate into a pass.

## Activation and authority

Use after substantial implementation, including requests to assess an unfinished
branch; report incomplete implementation as a blocker. Do not use for initial
feature coding, isolated Git instruction, or unrelated cleanup.

Repository/organization instructions, branch protection, required CI checks,
security policy, and task requirements control acceptance. Do not invent or
silently relax project thresholds. Never commit, push, rebase, merge, open a PR,
delete a branch/worktree, or discard changes without an explicit user request
for that action and the required permissions. Treat uncertain authority as a
reason to stop the side effect, not the read-only audit.

**Same-named skill:** this repository's skill replaces the plugin skill
`superpowers:finishing-a-development-branch` here. Use this one unless the user
explicitly invokes the plugin skill; where the two differ, this one's
explicit-request rule for side effects governs.

## Workflow

### 1. Establish the authoritative target

Read relevant contributor/agent guidance, branch protection and PR rules, CI
workflows, package/task scripts, build/test/coverage/lint/type/security config,
and documentation conventions. Determine what gates are **required** versus
advisory. If instructions conflict, identify the owner/policy and report the
conflict; do not pick the easier rule.

Confirm the intended base from user instructions, PR metadata, repository
conventions, or a documented tracked target. **Do not assume `main`.** If no
reliable base exists, continue safe inspection, but mark full diff review and
merge readiness **BLOCKED: base unknown** (report the state as NOT READY). Do
not compare the branch against a guessed candidate base; name the candidate
branches only. Ask the user for the target; that is the only question to put to
them until it is answered.

### 2. Capture branch and evidence baseline

From the actual repository, record current branch/ref, HEAD, base ref and
commit, upstream/remote if relevant, staged/unstaged/untracked state, and the
commits and changed paths relative to the confirmed base. Check for detached
HEAD, in-progress merge/rebase, or multiple worktrees; do not infer ownership.

Review both committed and uncommitted changes: a base-to-HEAD diff alone omits
local edits. Inspect `git status`, the committed branch diff, the staged diff,
and the unstaged diff; include untracked files in the inventory. Do not add,
reset, stash, restore, or delete anything during inspection.

If the remote base or branch may have moved, establish its freshness using
permitted read-only fetch/remote checks; report unavailable network access or
unverified remote status. A local pass does not prove remote CI or the future
merge result will pass.

### 3. Execute the project-required validation

Use repository-defined commands and thresholds. Follow documented ordering;
otherwise run focused tests, required full tests, coverage, compilation/build,
type checking, lint/format, and mandated security/quality checks as applicable.
When project policy is silent, use the strongest relevant non-destructive checks
available in the component's normal configuration; do not equate silence with
permission to skip all testing.

For each required check, capture **command, revision/tree tested, result/exit
status, and acceptance threshold**. Classify as `PASS`, `FAIL`, or `BLOCKED`
(unavailable/unrun); identify `ADVISORY` results separately. A warning, TODO,
skipped test, or coverage percentage blocks only when the project/task/check
requires it. A required check passes only after successful execution against its
acceptance criterion.

On a failure, retain the evidence. Remediate only if authorized; rerun the
failed check after the correction. Claims of "flaky", "pre-existing", or
"unrelated" require a documented policy, accepted quarantine, or a suitable
baseline comparison; without such evidence, leave the required gate failing.

### 4. Review the complete change

Inspect the diff against the confirmed base, plus staged, unstaged, and
untracked changes. Look for unintended scope, secrets, generated or vendor
artifacts, debug instrumentation, commented-out code, behavior without tests,
missing required documentation/changelog, and breaking API or config changes.
Preserve intentional logging, TODOs, generated outputs, and comments that meet
project policy. Distinguish a review finding from an enforced blocker.

### 5. Establish the exact readiness state

After the **last relevant edit**, rerun checks affected by that edit; do not
reuse stale evidence. If rebasing, updating from the base, resolving conflicts,
or merging changes the effective tree, validate the integrated result according
to project policy before claiming integration readiness. Do not call an
unvalidated merged result green merely because both parents were green.

- **READY FOR PR REVIEW:** known scope/base, complete diff review, fresh local
  required gates pass, no unresolved blocking findings; external checks that
  cannot run locally are explicitly pending the PR/CI gate.
- **READY TO INTEGRATE:** all required pre-integration approvals and checks,
  including applicable CI/branch-protection gates, have verified evidence for
  the actual candidate and expected integration method.
- **NOT READY:** any required gate fails, scope/base is unresolved, blocking
  findings remain, or required checks/approvals cannot be verified. Distinguish
  `FAIL` from `BLOCKED` and say what would unblock each.

Never report `READY TO INTEGRATE` solely on local checks when repository policy
requires remote CI, approval, or a post-update validation that has not happened.

### 6. Prepare an actionable handoff

Report: base and HEAD; changed scope; review findings; gate table (command,
result, evidence revision); readiness state and blockers; required manual/CI
steps; and a concise PR title/summary, testing, risks, screenshots or recordings
for UI changes if available, and follow-ups. Label unrun and unavailable checks.
Do not imply a screenshot, PR, commit, or approval exists when it does not.

When the user asked to finish or close out the branch, end the handoff by asking
which next action they want; perform none until they answer, and treat a vague
reply as no answer and ask again. If the base is unknown, ask only for the
target (step 1) instead. For a review-only request, stop at the review and the
recommended action. Offer only options the readiness state and repository policy
allow:

1. **Open or update a PR** (recommended for a protected base); offer only when
   `READY FOR PR REVIEW` or `READY TO INTEGRATE`.
2. **Integrate** (merge) via the project's required route; offer only when
   `READY TO INTEGRATE`.
3. **Keep** the branch and worktree as they are.
4. **Discard** local-only work that was never pushed or shared; describe exactly
   what would be lost, require the user to retype the branch name before any
   deletion, and follow step 7 and the worktree reference.

### 7. Execute only requested Git actions

Where expressly requested and permitted, stage selected files, commit using
repository conventions, sync with the base using the **project's** chosen
merge/rebase policy, push, or create/update a PR. Do not use broad staging,
force-push, branch deletion, or history rewrites as default cleanup. For any
history rewrite or destructive operation, describe scope and consequences,
record a recoverable ref/checkpoint, obtain authorization, and verify the
result. If a push is rejected, investigate the remote; do not force it.

If the user explicitly requests integration, verify the correct target, that
required gates and approvals are satisfied, and the intended merge strategy. For
conflict or merged-result failures, stop and preserve branch/worktree state; do
not delete the recovery path. Finish by verifying the resulting ref/status and
reporting what actually happened. Never bypass required PR review by merging
directly into a protected/default branch.

For a linked Git worktree **only when cleanup is requested**, read
[references/worktree-cleanup.md](references/worktree-cleanup.md) before removal.
Skill maintainers can use
[references/evaluation-cases.md](references/evaluation-cases.md) for activation,
pressure, and regression test designs; do not load it for ordinary branch
completion.

## Common rationalizations to reject

| Claim                                         | Required response                                              |
| --------------------------------------------- | -------------------------------------------------------------- |
| "It passed earlier"                           | Recheck evidence against the final relevant tree.              |
| "They said finish; they must mean merge"      | Report readiness; no side effects beyond the explicit request. |
| "The base is obviously `main`"                | Confirm the intended target; otherwise block final readiness.  |
| "The failing merged result is probably flaky" | Preserve branch/worktree and investigate with evidence.        |
| "Worktree remove failed; use `--force`"       | Inventory potential data loss and require a separate decision. |
| "Push rejected; force-push it"                | Inspect remote divergence and preserve others' work.           |

## Completion contract

Return **one readiness state**, supporting gate evidence, unresolved blockers,
and a clear next action. Never report a completed repository action unless it
was performed and verified. If user authorizes only a review, finish with the
review and recommended action, not an unrequested commit or merge.
