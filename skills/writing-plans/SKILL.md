---
name: writing-plans
description: Use when converting an approved implementation spec into an execution-ready, phased engineering plan with concrete file changes, dependencies, risks, tests, and success criteria; before implementation by executing-plans or subagent-driven-development.
---

# Writing Plans

Convert an approved spec into a repository-grounded plan that another agent can execute without redesigning the solution.

Do not implement the plan.

## Preconditions

Proceed only when the implementation direction is approved.

If requirements, architecture, or success criteria contain unresolved decisions that materially change implementation, identify them as blockers instead of guessing.

## Workflow

### 1. Read the source of truth

Read the approved spec and extract:

* requirements
* architecture or design decisions
* constraints
* success criteria
* explicitly deferred work

Preserve the spec's decisions. Do not silently redesign them.

### 2. Inspect the affected repository

Inspect the files, tests, configuration, interfaces, and conventions relevant to the spec.

For every planned path:

* verify it exists, or label it **New file**
* use the repository's actual names and structure
* do not invent functions, modules, APIs, or dependencies without marking them as proposed

Record any mismatch between the spec and the current repository.

### 3. Build requirement traceability

Map every in-scope requirement and success criterion to one or more implementation steps and validation checks.

Do not add speculative features.

If an approved requirement has no implementation or validation step, the plan is incomplete.

### 4. Divide work into phases

Create the smallest number of ordered phases needed.

Each phase must be:

* **Deliverable** — leaves the repository in a coherent state
* **Testable** — has an objective validation gate
* **Scope-bounded** — has a clear outcome
* **Dependency-aware** — prerequisites are explicit

Prefer vertical increments that deliver usable behavior.

Use MVP, happy path, edge cases, migration, cleanup, or optimization phases only when they fit the work; do not force a fixed phase structure.

### 5. Write atomic implementation steps

Each step must include:

* **Files:** exact existing paths or paths marked **New file**
* **Action:** concrete change and intended behavior
* **Why:** requirement or architectural reason
* **Dependencies:** prerequisite step IDs, or `None`
* **Risk:** Low / Medium / High
* **Validation:** test, check, or observable result proving the step is complete

Keep a step small enough to implement, review, test, and revert independently.

Split a step when it spans unrelated responsibilities, independent validation boundaries, or multiple changes that could be delivered separately.

### 5.1 Identify parallel work

When the plan may be executed by multiple agents, identify steps that can run concurrently and steps that must remain sequential because of file overlap, shared interfaces, migrations, or dependencies.

Do not parallelize steps that modify the same implementation surface unless their ownership boundaries are explicit.

### 6. Define testing by phase

For each phase, select only applicable levels:

* **Unit:** functions, modules, or components
* **Integration:** boundaries or cooperating systems
* **E2E:** user or system journeys
* **Regression:** existing behavior that must remain unchanged
* **Manual/operational:** only when automation is impractical

Name the relevant test files or mark proposed test files as **New file**.

Every success criterion must have a validation path.

### 7. Validate the plan

Before handoff, challenge the plan from an implementer's perspective:

* What requirement has no corresponding step?
* What step depends on an assumption not established by the spec or repository?
* What path, API, dependency, or test was inferred rather than verified?
* Where could execution fail, conflict, or require an unplanned design decision?

Revise the plan for any issue found.

#### 7.1 Before Presenting

Before presenting the plan, verify:

* every approved requirement is covered
* every success criterion is testable
* file paths are verified or marked **New file**
* dependencies form a coherent execution order
* phases can be validated independently
* no step silently changes the approved design
* no speculative scope was added
* high-risk steps include mitigation or rollback
* downstream execution does not require major design decisions

If any check fails, revise the plan before handoff.

### 8. Save and hand off

Default path:

`docs/plans/YYYY-MM-DD-<feature>.md`

Before writing, check whether the target already exists. Do not overwrite an existing plan without explicit authorization.

Use this structure:

```markdown
# Implementation Plan: [Feature]

## Source
[Approved spec path]

## Overview
[What will change and the implementation approach]

## Requirements Traceability
| Requirement | Steps | Validation |
|---|---|---|

## Architecture Changes
- [path]&#58; [change]

## Implementation Steps

### Phase 1: [Outcome]

#### Step 1.1: [Action]
- Files: `path/to/file`
- Action: ...
- Why: ...
- Dependencies: None
- Risk: Low
- Validation: ...

## Testing Strategy
- Unit: ...
- Integration: ...
- E2E: ...
- Regression: ...

## Risks and Rollback
- ...

## Success Criteria
- [ ] ...
```

Present the completed plan for human approval before implementation begins.

## Handoff contract

The plan is ready for `executing-plans` or `subagent-driven-development` only when an implementation agent can determine:

1. what to change,
2. where to change it,
3. why the change is required,
4. what must happen first, and
5. how to prove the change works,

without making unresolved product or architecture decisions.
