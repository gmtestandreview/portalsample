---
name: writing-plans
description: Use when creating or updating implementation plans for multi-step software changes from specs, requirements, PRDs, bug reports, feature requests, migrations, refactors, or architecture changes before coding. Produces repository-grounded, test-first, agent-ready plans. Do not use for one-step edits, non-code project planning, GitHub Epic/Feature/Story decomposition, or Copilot-specific three-artifact planning workflows.
---

# Writing Plans

Produce an implementation plan only. Do not implement code.

Read the governing source material before planning, then inspect the relevant repository implementation, tests, configuration, and documentation when available. Never invent repository paths, symbols, commands, tests, dependencies, or behavior.

Use the user's requested output path or an established project convention. Otherwise use `docs/plans/YYYY-MM-DD-<feature-name>.md` when file output is available; if it is not, return the complete plan and state the intended path.

## Scope

Use this skill for multi-step software implementation planning.

- If an installed `refactor-plan` skill specifically governs a coupling-heavy multi-file refactor with confirmation/rollback requirements, prefer it.
- If an installed `breakdown-plan` skill governs GitHub Epic > Feature > Story/Enabler > Test/Task decomposition or board automation, prefer it.
- If the target workflow explicitly requires validated research plus exactly three `.copilot-tracking` artifacts, use that Copilot-specific workflow instead.
- Do not turn a planning request into code changes.

## Plan contract

A finalized plan must be executable by a skilled engineer from the plan and cited source material alone. Include:

- source inputs, assumptions, constraints, and blocking unknowns;
- requirement-to-task traceability;
- exact repository-relative files to create, modify, and test;
- dependencies and ordering;
- behavior-first tests or acceptance tests before implementation for user-visible behavior and business logic;
- exact commands and expected results when execution is part of a task;
- concrete code, exact edits, or repository-grounded patch guidance for code-changing steps;
- independently reviewable tasks and targeted commits when the repository workflow uses commits;
- verification and rollback for destructive, data-changing, migration, deployment, auth, billing, permission-sensitive, or security-sensitive work;
- no unresolved drafting placeholders, undefined references, contradictory assumptions, or vague paths.

Use DRY and YAGNI. Do not add speculative abstractions or unrelated refactors.

## Workflow

1. **Establish evidence**
   - Read the source requirement/specification.
   - Inspect affected implementation, tests, configuration, docs, and existing patterns when available.
   - Record assumptions and unknowns. Treat an unknown as blocking only when it could change behavior, files, tests, sequencing, or safety.

2. **Choose mode and output shape**
   - **Create:** build a new plan from source and repository evidence.
   - **Update:** preserve valid requirements, decisions, traceability, and stable identifiers; change only affected sections.
   - For ordinary plans, read `references/implementation-plan-template.md` before drafting.
   - For a rigid machine-readable plan with fixed sections or identifier prefixes, read `references/deterministic-plan-template.md` instead.
   - For an explicitly required single-PR/dedicated-branch, commit-shaped structured-autonomy workflow, also read `references/structured-autonomy-mode.md`.
   - **Mode precedence:** the Plan contract and final reviewer gate remain mandatory in every mode. Deterministic mode replaces the ordinary presentation template when its fixed format is required. Structured-autonomy mode overlays the selected plan format: its branch, path, research, and commit conventions may override ordinary defaults, but it must retain all mandatory Plan contract content and reviewer-required sections, adapting their placement without dropping them.

3. **Scope and structure**
   - Split independent subsystems into separate plans only when each can produce a working, testable outcome.
   - Map each affected file to its action and responsibility before defining tasks.
   - Follow repository patterns and place setup, schemas, interfaces, fixtures, and helpers before dependent work.

4. **Choose the smallest useful framework**
   - Always use requirement traceability, vertical slices, test-first sequencing, risk-first ordering, and verification.
   - Add DDD only for domain-heavy logic or unclear invariants.
   - Add C4-style mapping only across meaningful service/system/module boundaries.
   - Add ADR-lite only for architectural choices future engineers may reasonably question.
   - Add migration planning for incremental replacement of legacy behavior.
   - Add threat modeling for auth, permissions, secrets, billing, data access, or external trust boundaries.

5. **Write atomic tasks**
   - Make each task independently reviewable and testable.
   - For behavior changes: define the failing test or acceptance test, exact run command and expected failure, minimal implementation, passing command/result, relevant regressions, then the commit step when applicable.
   - Do not invent commands, paths, symbols, fixtures, or expected outputs that repository evidence does not support. Record the missing evidence instead.

6. **Cover risk**
   - For high-impact work, include authorization/approval gates where required, backup or checkpoint, dry-run/staging when useful, verification, and rollback.
   - Put irreversible or dependency-sensitive work after its safeguards.

7. **Critical-failure scan**
   Do not mark the plan implementation-ready while it contains:
   - drafting placeholders such as `TBD`, `TODO`, `implement later`, or `similar to above`;
   - vague instructions without concrete execution guidance;
   - undefined files, symbols, routes, commands, types, schemas, fixtures, or helpers;
   - missing behavior tests for behavior changes;
   - vague/conflicting paths or invalid task ordering;
   - risky work without proportional verification and rollback;
   - contradictory naming, signatures, commands, or environment assumptions;
   - unsupported details presented as facts.

8. **Review and refine**
   - Try to prove the plan will fail: check requirement coverage, missing setup/imports/fixtures, undefined references, test gaps, sequencing, safety, framework misuse, overengineering, and buildability friction.
   - Fix supported defects, then read `references/plan-document-reviewer-prompt.md` and apply its 100-point rubric.
   - The plan passes this local quality gate only at `>=96/100` with zero critical failures.
   - If an independent reviewer/subagent is available, use it after self-review; otherwise apply the reviewer reference manually and do not claim independent-review evidence.
   - Do not convert missing repository evidence or human judgment into a pass.

## Handoff

After available validation:

- state the plan path or intended path;
- state blocking unknowns or required human decisions;
- identify the execution mode supported by the current environment;
- distinguish planned tests from tests actually run;
- do not claim implementation or test execution occurred unless it did.
