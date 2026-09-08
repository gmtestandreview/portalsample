---
name: writing-plans
description: Use when a user asks to turn a chosen, supplied, or approved engineering direction into a repository-grounded implementation plan with concrete file changes, dependencies, risks, tests, and success criteria. Use before coding or handing work to an implementation agent. Do not use to choose unresolved product or architecture direction, brainstorm solutions, review completed implementation, or implement the changes.
---
<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->

# Writing Plans

Convert an approved engineering direction into a repository-grounded plan that another agent can execute without redesigning the solution.

Do not implement the plan.

## Preconditions

Proceed only when the implementation direction is sufficiently approved to plan.

Treat an unresolved decision as a **blocker** when different answers would materially change architecture, public interfaces, data models, dependencies, security boundaries, migration strategy, or success criteria.

Do not guess through blockers.

Minor implementation details may remain open only when they can be resolved during execution without changing the approved design. Mark them explicitly as implementation-time decisions.

## Workflow

### 1. Read the source of truth

Extract from the approved spec or design:

- requirements
- architecture and design decisions
- constraints
- success criteria
- explicitly deferred work

Preserve those decisions. Do not silently redesign, broaden, or narrow scope.

Record any blocker before planning implementation that depends on it.

### 2. Inspect the repository

Inspect the implementation surfaces relevant to the approved change:

- source files
- tests
- configuration
- interfaces and schemas
- migrations
- neighboring modules
- established project conventions

For every path named in the plan:

- verify that an existing path exists;
- otherwise mark it **New file**;
- use actual repository names and structure;
- distinguish verified APIs, functions, dependencies, and tests from proposed ones.

If repository access is unavailable, do not invent repository details. Mark affected paths and implementation details **Unverified** and identify what the implementation agent must inspect before proceeding.

Record mismatches between the approved design and the current repository.

### 3. Build requirement traceability

Map every in-scope requirement and success criterion to:

1. one or more implementation steps; and
2. an objective validation path.

Do not add speculative features.

A requirement is not covered unless the plan states both how it will be implemented and how completion will be demonstrated.

### 4. Define phases

Use the smallest number of ordered phases that keeps execution coherent.

Each phase must have:

- **Outcome** — concrete state produced by the phase
- **Scope** — what changes belong in it
- **Dependencies** — prerequisites
- **Validation gate** — objective evidence that the phase is complete

Prefer vertical increments that leave working, testable behavior.

Use labels such as MVP, migration, edge cases, cleanup, or optimization only when they describe the actual work. Do not force a generic phase model onto the repository.

Sequence dependency-blocking, high-risk, or hard-to-reverse work early enough to expose failure before large dependent changes accumulate.

### 5. Write atomic implementation steps

Give every step a stable ID.

Each step must include:

- **Files:** exact verified paths or **New file**
- **Action:** concrete change and intended behavior
- **Why:** requirement or approved design decision it satisfies
- **Dependencies:** prerequisite step IDs or `None`
- **Risk:** Low / Medium / High
- **Validation:** test, command, check, or observable result proving completion

For Medium or High risk, also include the relevant mitigation.

For High risk or hard-to-reverse work, include a practical rollback or recovery path.

Keep each step small enough to implement, review, validate, and revert independently.

Split a step when it combines unrelated responsibilities, independent validation boundaries, or changes that can fail separately.

### 6. Identify parallel work

When multiple agents may execute the plan, identify:

- steps safe to run concurrently;
- sequential dependencies;
- shared files or interfaces that create conflicts;
- ownership boundaries needed for safe parallel work.

Do not parallelize steps that modify the same implementation surface unless ownership boundaries and integration order are explicit.

Parallelism must follow the dependency graph, not merely the phase grouping.

### 7. Define testing

Select only applicable test levels for each phase:

- **Unit** — functions, modules, or components
- **Integration** — cooperating systems or boundaries
- **E2E** — user or system journeys
- **Regression** — behavior that must remain unchanged
- **Manual/operational** — only when automated verification is impractical

Name verified existing test files when known. Mark proposed test files **New file**.

Every success criterion must map to at least one validation method.

Do not invent test commands, fixtures, environments, or frameworks that were not verified in the repository. Mark proposed or unverified details explicitly.

### 8. Challenge the plan

Before handoff, review the plan from the implementer's perspective.

Resolve or report:

- requirements with no implementation step;
- success criteria with no validation;
- steps based on unverified assumptions;
- invented paths, APIs, dependencies, or tests;
- hidden design decisions;
- dependency cycles or missing prerequisites;
- unsafe parallel work;
- high-risk changes without mitigation or rollback;
- speculative scope;
- repository/spec mismatches that prevent execution.

Revise all fixable issues before presenting the plan.

For an independent review pass, dispatch a reviewer with [references/plan-document-reviewer-prompt.md](references/plan-document-reviewer-prompt.md).

Anything that still requires a material product or architecture decision is a blocker, not an implementation step.

## Output

Use this structure, adapting sections only when they are genuinely inapplicable:

```markdown
# Implementation Plan: [Feature]

## Source
[Approved spec or design]

## Overview
[What changes and the approved implementation approach]

## Blockers
- None
# or
- [Unresolved material decision]

## Requirements Traceability
| Requirement | Steps | Validation |
|---|---|---|

## Repository Findings
- [Relevant verified implementation surface or spec/repository mismatch]

## Architecture Changes
- `[path]`: [change]

## Implementation Steps

### Phase 1: [Outcome]

#### Step 1.1: [Action]
- Files: `path/to/file`
- Action: ...
- Why: ...
- Dependencies: None
- Risk: Low
- Validation: ...

## Parallelization
- Can run concurrently: ...
- Must remain sequential: ...

## Testing Strategy
- Unit: ...
- Integration: ...
- E2E: ...
- Regression: ...
- Manual/operational: ...

## Risks and Rollback
- ...

## Success Criteria
- [ ] ...
```

Omit empty testing categories rather than filling them with placeholders.

## Persistence

If the user or surrounding workflow requires a persisted plan, save it to the requested location.

Otherwise, when a repository convention has been verified, follow that convention.

If no location is specified or verified, use:

`docs/plans/YYYY-MM-DD-<feature>.md`

Before writing, check whether the target exists. Never overwrite an existing plan without explicit authorization.

If persistence was not requested and is unnecessary for handoff, present the plan without creating a file.

## Handoff contract

The plan is implementation-ready only when an implementation agent can determine:

1. what must change;
2. where it must change;
3. why each change is required;
4. what dependencies constrain execution;
5. how each phase and success criterion will be verified; and
6. how material risks will be mitigated or reversed,

without making unresolved product or architecture decisions.

Present blockers separately from executable work.

When an execution skill such as `executing-plans` or `subagent-driven-development` is available and appropriate, the completed plan may be handed to it. Otherwise provide the plan as a standalone implementation artifact.

Do not begin implementation as part of this skill.