---
name: writing-plans
description: Use when creating or updating implementation plans for multi-step software work from specs, requirements, PRDs, bug reports, feature requests, migrations, or architecture changes before coding. Produces repository-grounded, test-first, agent-ready plans. Do not use for one-step edits, non-code project planning, GitHub Epic/Feature/Story breakdowns, or Copilot-specific three-artifact planning workflows.
---

# Writing Plans

## Activation

When this skill activates, announce:

> I'm using the writing-plans skill to create the implementation plan.

Produce a plan only. Do not implement code.

Read the source spec, requirement, PRD, bug report, or feature request before planning. Inspect the target repository or relevant files when available.

Use the user's requested output path or an established project convention. If neither exists, save to `docs/plans/YYYY-MM-DD-<feature-name>.md`.

## Scope boundaries

Use this skill for implementation planning.

- For a multi-file refactor where hidden coupling, interface sequencing, rollback, and a confirmation gate are the primary concern, use `refactor-plan`.
- For GitHub project decomposition into Epic > Feature > Story/Enabler > Test/Task with board or issue automation, use `breakdown-plan`.
- For a Copilot workflow that requires validated research plus exactly three `.copilot-tracking` planning artifacts, use the separate `task-planner.agent.md` workflow.
- Do not turn a planning request into code changes.

## Plan contract

Write a plan a skilled engineer can execute with no prior context beyond the plan and source material.

Every finalized plan must include:

- exact repository-relative files to create, modify, and test;
- exact commands and expected results where execution is required;
- behavior-first tests or acceptance tests before implementation for user-visible behavior and business logic;
- concrete implementation guidance: code, exact edits, or repository-grounded patch instructions;
- requirement-to-task traceability;
- dependencies and ordering;
- verification and rollback for destructive, data-changing, migration, deployment, auth, billing, permission-sensitive, or security-sensitive work;
- independently reviewable tasks and targeted commits;
- no unresolved placeholders, undefined references, contradictory assumptions, or vague paths.

Use DRY and YAGNI: do not add speculative abstractions or unrelated refactors.

## Workflow

1. **Confirm entry criteria**
   - Read the source material.
   - Inspect relevant repository implementation, tests, configuration, and docs when available.
   - Record assumptions, constraints, and blocking unknowns.
   - Do not begin implementation.

2. **Choose create or update mode**
   - **Create:** build a new plan from the source material and repository evidence.
   - **Update:** preserve valid existing plan content, traceability, and decisions; change only sections affected by the new or changed requirements.
   - If the user or target system requires a rigid machine-readable plan with identifier prefixes and fixed sections, read `references/deterministic-plan-template.md`.
   - If the user/project explicitly requires a single-PR dedicated-branch, commit-shaped structured-autonomy workflow, read `references/structured-autonomy-mode.md`.

3. **Scope the work**
   - Split independent subsystems into separate plans when each can produce a working, testable outcome.
   - Treat an ambiguity as blocking only when it could cause the wrong behavior, files, tests, sequence, or unsafe work.

4. **Choose the smallest useful planning framework**
   - Always use requirement traceability, vertical slices, test-first sequencing, risk-first ordering, and verification.
   - Add DDD only for domain-heavy business logic or unclear invariants.
   - Add C4-style mapping only for changes spanning service/system/module boundaries.
   - Add ADR-lite only for architectural choices future engineers may reasonably question.
   - Add migration planning for incremental replacement of legacy behavior.
   - Add threat modeling for auth, permissions, secrets, billing, data access, or external trust boundaries.

5. **Map files before tasks**
   - List each affected path, action, and responsibility.
   - Follow existing repository patterns.
   - Identify dependencies and likely setup/interfaces needed before callers.

6. **Create bite-sized tasks**
   - Each task must be independently reviewable and testable.
   - Each step should be one concrete action.
   - For behavior changes: write the failing test, run it and record the expected failure, implement the minimal change, rerun to pass, run relevant regressions, then commit.
   - Do not prescribe a fixed 2-5 minute duration when the repository evidence does not support it.

7. **Cover risk and rollback**
   - Identify destructive or high-impact operations before execution.
   - Include backup/checkpoint, dry-run or staging where useful, verification, rollback, and approval gates when the operation warrants them.

8. **Run the critical-failure scan**
   The plan is not ready while any of these remain:
   - placeholders such as `TBD`, `TODO`, `implement later`, `fill in details`, or `similar to above`;
   - vague instructions such as “add validation,” “handle edge cases,” or “write tests” without exact guidance;
   - undefined files, functions, classes, methods, routes, commands, types, schemas, fixtures, or helpers;
   - missing behavior tests;
   - code-changing steps without concrete code, exact edits, or sufficient patch guidance;
   - vague or conflicting paths;
   - unsafe work without verification and rollback;
   - contradictory naming, signatures, commands, ordering, or environment assumptions;
   - a plan an engineer cannot execute from the plan and source material alone.

9. **Self-review and validate**
   - Read `references/implementation-plan-template.md` for the standard plan shape.
   - Try to prove the plan will fail: inspect requirement coverage, undefined references, test gaps, sequence errors, safety gaps, framework misuse, overengineering, and buildability friction.
   - Fix blockers, then score with the 100-point rubric in `references/plan-document-reviewer-prompt.md`.
   - Passing standard: at least 96/100 and zero critical failures.

10. **External review when available**
    - After self-review, read `references/plan-document-reviewer-prompt.md`.
    - If the environment supports an independent reviewer/subagent, dispatch that reviewer before implementation.
    - Treat reviewer critical failures as blockers.
    - If independent review is unavailable, use the reference as a manual checklist and do not claim independent-review evidence.

## Handoff

After the plan passes the available validation:

- state the plan path;
- summarize any blocking unknowns or human decisions;
- identify the execution mode supported by the current environment;
- do not claim implementation has started or tests have run unless they actually have.
