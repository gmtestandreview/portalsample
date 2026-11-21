# Final Review and Finish

Read this when every plan task has a `Task <N>: complete` ledger line.

## 1. Validate at HEAD

Run the validation commands the plan names. If it names none, use the
repository's documented ones (`CLAUDE.md`, `AGENTS.md`, package scripts). If
there are none, stop and ask the human; do not invent a command.

Capture output to `<workspace>/validation-<head7>.log` and ledger
`Validation @<head7>: <command> -> exit <code>; log <path>`. A non-zero exit is
a finding for the fix wave in step 3, not something to report around.

## 2. Final whole-branch review

Run `scripts/review-package.sh PLAN_FILE MERGE_BASE HEAD`. MERGE_BASE is the
commit the branch started from, for example `git merge-base main HEAD`; on
`main` that equals HEAD, so use the ledger's BASE instead. Dispatch
`../task-reviewer-prompt.md` with:

- that diff path;
- the plan file as the requirements source in place of a task brief (set
  `[BRIEF_FILE]` to the plan);
- the plan's global constraints;
- the ledger's deferred minors and parked findings, so the reviewer can triage
  which must be fixed before merge.

Fill the placeholders as: `[BASE_SHA]` = MERGE_BASE, `[HEAD_SHA]` = HEAD,
`[DIFF_FILE]` = the printed path, `[REPORT_FILE]` = the ledger
(`<workspace>/progress.md`, which points at every task report), and `[MODEL]`
per SKILL.md "Model selection".

Use Tier 2 by default and a more capable model for a subtle or high-risk diff.

## 3. One fix wave

If the review (or step 1) returns findings, dispatch ONE fix subagent with the
complete findings list, written to `<workspace>/final-fixes-brief.md`: use
`../implementer-prompt.md` with that file as `[BRIEF_FILE]`,
`<workspace>/final-fixes-report.md` as `[REPORT_FILE]`, and Tier 2 as `[MODEL]`.
Per-finding fixers each rebuild context and re-run suites, and a real session's
final-review fix wave cost more than all its tasks combined. Then run exactly
one scoped re-review of the fix range and re-run step 1 at the new HEAD. There
is no second fix wave: residual load-bearing findings go to the human when
`finishing-a-development-branch` presents the options.

## 4. Check before you claim done

Compare each "Outcome and acceptance" criterion in SKILL.md with its evidence
(ledger lines, report files, validation log). Any criterion without evidence
goes under "Unverified" in the final message; do not word the result as
complete.

## 5. Final message

In this order, each section present ("none" if empty):

- **Delivered:** tasks completed (count, commit range).
- **Verified:** each validation command with exit status and log path.
- **Unverified:** criteria with no evidence, and anything you could not run.
- **Deferred minors** and **parked findings:** one line each with its ruling.
- **Rulings I made:** every ledger line containing `Ruling:`, in order, each
  with what it costs if wrong. The list is exhaustive: a ruling left only in the
  ledger is a decision made in secret.
- **Next step:** what the human must decide or do.

## 6. Finish

Use `finishing-a-development-branch`. Keep the workspace; delete it only if the
human asks, and never delete a sibling plan's directory.
