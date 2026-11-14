---
name: refactor
description:
  Use when restructuring existing code to improve maintainability, readability,
  modularity, or type safety while preserving externally observable behavior.
  Applies to cleanup, extracting or renaming code, reducing duplication or
  complexity, and incremental design improvements; not feature work, bug-fix
  behavior changes, rewrites, or migrations.
license: MIT
---

# Refactor

Improve internal code structure without intentionally changing externally
observable behavior.

## Purpose and Success Contract

Use this skill to prevent maintainability improvements from silently changing
behavior or expanding into feature work. Success means the requested structural
problem is materially improved, protected observable contracts remain supported
by available evidence, validation gaps are explicit, and no unrelated behavior
change is bundled into the refactor.

## Scope

Use this skill for incremental structural changes such as:

- extracting, moving, renaming, or simplifying code;
- reducing duplication, nesting, coupling, or oversized units;
- strengthening types without changing supported behavior;
- introducing an abstraction or design pattern to remove a demonstrated smell.

Do not use it as the primary workflow for feature development, behavior-changing
bug fixes, broad rewrites, migrations, or speculative architecture changes. When
a request mixes refactoring with behavior changes, separate the behavior change
from the refactor and validate each independently.

## Inputs and Preconditions

Before editing:

1. Identify the requested maintainability problem and the smallest relevant
   scope.
2. Inspect nearby code, tests, callers, public interfaces, and project
   conventions that constrain behavior.
3. Establish a behavior baseline from available tests and observable contracts.
   If coverage is missing, add focused characterization tests when practical.
4. Preserve the current working state with version control, a patch, or another
   reversible checkpoint before consequential edits.
5. If behavior cannot be established well enough to judge preservation, narrow
   the change or state that preservation is unverified.

Before consequential editing, challenge the plan:

- confirm the request is actually behavior-preserving refactoring rather than a
  feature, bug fix, migration, or rewrite;
- identify the assumption most likely to make the planned refactor wrong;
- identify the highest-risk observable behavior and whether available validation
  can detect a regression there;
- confirm the intended deliverable and what evidence would justify calling the
  refactor complete.

If a material ambiguity remains, narrow the plan or surface the uncertainty
before editing. Do not invent requirements from examples in this skill.

## Workflow

### 1. Define the invariant

State what must remain unchanged: public API, outputs, errors, side effects,
ordering, persistence, timing-sensitive semantics, compatibility, or another
observable contract.

Internal implementation details are not invariants unless the repository or user
makes them contractual.

### 2. Choose one smell and one transformation

Prefer the smallest transformation that addresses the identified problem.
Examples include Extract Function/Class, Rename, Introduce Parameter Object,
Guard Clauses, replacing duplicated literals with named constants, or moving
behavior toward the data it owns.

Load [references/refactoring-catalog.md](references/refactoring-catalog.md) only
when selecting among smells, transformations, type-safety techniques, or
design-pattern alternatives.

Do not introduce a pattern merely because it is familiar. Require a concrete
problem it solves and avoid abstractions whose indirection exceeds their value.

### 3. Refactor in reversible steps

For each step:

1. Make one coherent structural change.
2. Keep behavior-changing edits out of the same step.
3. Run the narrowest relevant validation available.
4. Inspect the diff for accidental semantic changes.
5. Continue only when the step is supported by evidence; otherwise revert,
   reduce, or diagnose it.

Do not claim tests, builds, linters, benchmarks, or runtime checks passed unless
they were actually run and passed.

### 4. Check behavior-sensitive risks

Pay extra attention when refactoring can alter:

- evaluation or call order;
- mutation, aliasing, object identity, or shared state;
- async scheduling, concurrency, transactions, retries, or resource lifetime;
- exception types, error text, logging, metrics, or other observable side
  effects;
- serialization, reflection, decorators/annotations, dependency injection, or
  framework conventions;
- numeric precision, nullability, coercion, defaults, or type narrowing;
- performance where latency, memory, or complexity is part of the contract.

If a transformation crosses one of these boundaries, add or run targeted checks
before treating it as behavior-preserving.

### 5. Finish with fresh validation

Run the applicable project checks after the final edit, not only after
intermediate steps. Prefer existing project commands and conventions over
generic tool choices.

Compare the final diff with the baseline and confirm:

- the requested smell or maintainability issue is materially improved;
- public behavior and required compatibility are preserved by available
  evidence;
- no unrelated cleanup, feature work, or speculative abstraction was bundled;
- comments/docs are updated only where the refactor changed structure or
  invalidated them;
- temporary compatibility shims or dead code are removed only when safe.

If validation is unavailable or incomplete, report the specific gap instead of
declaring the refactor safe.

## Stopping Rules

Stop and reassess when:

- the change requires redefining expected behavior;
- a failing test exposes an unclear pre-existing contract;
- the refactor expands materially beyond the requested scope;
- the safest next step is a feature, migration, or rewrite rather than a
  behavior-preserving transformation;
- rollback is no longer straightforward for a consequential change.

## Completion Output

Report:

1. **Structural changes** — what was refactored and why.
2. **Preserved invariant** — the observable behavior intended to remain
   unchanged.
3. **Validation performed** — only checks actually run, with their results.
4. **Preservation status** — what is verified versus unverified.
5. **Remaining risks** — assumptions, untested behavior-sensitive areas, or
   incomplete validation.
6. **Excluded scope** — behavior changes, feature work, or cleanup intentionally
   left out.

Do not collapse unverified preservation into a success claim.

## Skill Evaluation Contract

When revising this skill, use `evals/evals.json` for direct, indirect,
near-miss, missing-evidence, pressure, behavior-sensitive, and regression cases.
The case definitions are a test plan, not execution evidence; unresolved
required behavior remains `NHR` until representative runs demonstrate it.
