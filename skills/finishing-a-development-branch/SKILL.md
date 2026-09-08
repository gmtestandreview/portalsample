---
name: finishing-a-development-branch
description: Use when a development branch or feature is ready for final pre-merge verification, cleanup, documentation review, and pull-request preparation; especially before declaring work complete or ready to merge.
---

# Finishing a Development Branch

Finish a branch by verifying the repository's required checks, reviewing the diff, resolving blocking findings, and preparing the change for review.

## Scope

Use this skill when implementation is substantially complete and the next goal is to make the branch review- or merge-ready.

Do not use it to:
- implement the feature itself;
- bypass project-defined review, test, security, or release requirements;
- merge, push, commit, or open a PR unless the user has requested that action and the environment permits it.

## Workflow

### 1. Discover the repository's completion requirements

Before running commands, inspect the repository for its authoritative guidance and available scripts, such as:
- contributor or agent instructions;
- package/build configuration;
- CI workflows;
- test and coverage configuration;
- lint, type-check, security, or review commands;
- PR and changelog conventions.

Use project-defined commands and thresholds when they exist. Do not invent a coverage threshold, quality gate, tool, agent, or command.

If a required check is referenced but unavailable, report it as blocked rather than silently substituting a different check.

### 2. Verify the working state

Identify:
- the current branch;
- the intended base branch, if known;
- staged, unstaged, and untracked changes;
- commits on the branch relative to the base.

Do not discard, reset, overwrite, or rewrite changes as part of cleanup unless the user explicitly authorizes that operation.

### 3. Run required validation

Run the repository's applicable checks in a sensible dependency order. Typical categories are:
1. focused tests for the changed area;
2. required full test suite;
3. coverage check, if the project defines one;
4. build or compile check;
5. lint and formatting checks;
6. type checking;
7. security, quality, or review gates required by the project.

A required check passes only when its command completes successfully and its project-defined acceptance criteria are met.

If a required check fails:
- capture the failing command and relevant result;
- fix it only when the user requested implementation/remediation;
- rerun the affected check after the last relevant change;
- do not declare the branch ready while the required failure remains.

Do not treat skipped tests, warnings, TODOs, or coverage as blockers unless project policy, the task, or the check itself makes them blockers.

### 4. Review the final diff

Review the complete branch diff against the intended base.

Check for:
- accidental or unrelated changes;
- debug-only output or temporary instrumentation;
- commented-out code that should not ship;
- unresolved TODO/FIXME items that violate project policy;
- generated or secret files that should not be committed;
- missing tests for behavior changed by the branch;
- documentation or changelog updates required by the repository.

Preserve intentional logging, comments, TODOs, and generated files when they are valid project content.

### 5. Re-run affected checks after cleanup

Any code, test, configuration, or dependency change can invalidate earlier evidence.

After the final relevant edit, rerun the checks affected by that edit. Do not claim a test, build, lint, type-check, security, or quality result from stale evidence.

### 6. Prepare the review summary

Prepare a PR-ready summary containing:
- what changed and why;
- important implementation or behavior notes;
- validation actually run and its results;
- manual verification still needed;
- screenshots or recordings when UI behavior changed and they are available;
- known warnings, limitations, follow-ups, or blocked checks.

Distinguish verified results from checks that were not run.

### 7. Perform requested repository actions

Only when requested and permitted:
- stage intended files;
- create a commit using the repository's commit convention;
- update the branch from its base using the project's preferred method;
- push the branch;
- create or update the PR.

Before a history-rewriting, destructive, or high-impact Git action, state the action and obtain any required authorization. Preserve a practical rollback path.

Never merge directly to the protected/default branch when the project requires review through a PR.

## Completion Gate

The branch is ready only when:
- all project-required checks have fresh passing evidence;
- no unresolved blocking review or security findings remain;
- the final diff has been reviewed for accidental changes;
- required documentation is updated;
- unrun or unavailable checks are disclosed;
- requested commit/PR actions are complete, or clearly left for the user.

If any required item is unresolved, report the branch as **not ready** and name the blocker.
