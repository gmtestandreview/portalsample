---
name: writing-skills
description:
  Use when creating, editing, auditing, optimizing, testing, validating, merging,
  installing, or deploying Agent Skills/SKILL.md packages, especially activation
  boundaries, frontmatter, scope, progressive disclosure, supporting resources,
  evals, SKILL-specific validators, Codex installation, or deployment readiness.
compatibility: Codex, Claude, A Team, Claude Code, GitHub Copilot
metadata:
  version: '2026-10-06-auto-opt-3'
  last-updated: '2026-10-06'
---

# Writing Skills

Treat skill work as evidence-driven lifecycle management. Observe representative
behavior where possible, add the smallest justified guidance, and revalidate
after consequential changes. Never invent requirements, paths, tools, tests,
results, permissions, or supporting resources.

## Scope

Use this skill for Agent Skills / `SKILL.md` lifecycle work: creation, editing,
auditing, optimization, activation, testing, validation, merge decisions,
supporting-resource design, Codex installation, and deployment readiness.

Do not use it for ordinary Markdown editing, one-off project instructions,
generic linters, or agent-role definitions unless the request is specifically
about packaging them as an Agent Skill.

## Evidence and authority

- Read the candidate and task-relevant resources before judging or editing.
- Use `references/index.md` first and load the smallest sufficient reference set.
- Use `references/specification.md` for mandatory format/compliance claims.
- Treat best-practice, provider, repository, and local-client guidance as
  subordinate to mandatory specification and safety requirements.
- Precedence:
  `safety/trust/permissions > mandatory current spec > explicit user requirements
  > applicable skill/project/domain requirements > audit policy > best-practice
  defaults > examples/legacy material`.
- Only claim edits, tests, validator runs, builds, or behavior that were actually
  performed or directly evidenced.
- Mark required but unverifiable outcomes `Needs Human Review` (`NHR`).
- A checklist defines required evidence; it is not execution evidence.
- Tested behavior is evidence, not authority to waive mandatory requirements.
- Do not claim safety, readiness, or compliance beyond the evidence available.

## Workflow

### 1. Explore

Review scope, target environment, supplied resources, risks, references, and
available evidence. Preserve a baseline before meaningful implementation.
Report missing or broken references rather than inventing substitutes.

### 2. Qualify

Classify the skill as `Discipline`, `Technique`, `Pattern`, `Reference`, or
justified `Hybrid` using `references/skill-classification.md`. Choose the
narrowest class that preserves the skill's primary reusable value.

### 3. Define activation boundaries

Record realistic `Should trigger`, `Should not trigger`, and `Ambiguous` cases.
For each critical trigger, branch, or load condition, apply QAQ/RMI:

1. map a positive request to its governing instruction and expected behavior;
2. verify a realistic near-miss should not activate it;
3. reverse-map the behavior to the intended request class;
4. fail unresolved conflicts; if behavioral execution is unavailable, use `NHR`.

### 4. Plan

Decide what to create, update, merge, split, retain, relocate, deprecate, or
hold. Define preservation, safety, validation, rollback, human review, and done
criteria. Planning is read-only unless implementation is authorized.

### 5. Score

For scored audits, load `references/best-practices-evaluations.md` and
`references/audit-scoring.md`. Classify artifact completeness before scoring.
Use the current 100-point rubric and normalize only genuine `N/A` criteria.
A numeric score never overrides a blocker.

### 6. Test or assess evidence

Select tests by classification and risk. Use
`references/evaluating-skill-output.md` for output-quality eval design and
`references/testing-skills-with-subagents.md` for class-specific behavioral
RED/GREEN/REFACTOR, pressure, retrieval, resource-discovery, and regression
evidence.

Record each required evaluation as `PASS`, `AMBER`, `FAIL`, `NHR`, or justified
`N/A`. Use `NHR` only when evidence is genuinely unavailable, not merely
inconvenient to obtain. Required behavior-critical `AMBER`, `FAIL`, or `NHR`
blocks `deploy`.

### 7. Refine

Map each failure, ambiguity, contradiction, or static defect to the smallest
responsible trigger, instruction, branch, boundary, resource, or precedence
rule. Do not broaden scope merely to make one case pass.

### 8. Implement

Modify only the authorized target. Preserve unique domain guidance and valid
activation boundaries. Use progressive disclosure:

- keep mandatory, frequently needed guidance in `SKILL.md`;
- put detailed methods and source guidance in `references/`;
- put executable helpers in `scripts/`;
- put output templates/assets in `assets/`;
- put evaluation case definitions and fixtures in `evals/`.

High-impact overwrite, merge, publish, install-overwrite, or deploy operations
require authorization, a backup/checkpoint, validation, and a practical rollback
path before side effects.

### 9. Verify and refactor

Compare the candidate with the preserved baseline. Rerun affected available
checks after the latest relevant change. Confirm that the revision does not
silently broaden activation, create new false negatives, remove unique guidance,
weaken safety, or break resource paths. Mark unavailable execution evidence
`NHR`.

### 10. Validate

Apply `references/SKILL-testing-checklist.md` as the final deployment gate.
Separate specification failures from best-practice, conditional, and local
failures. `deploy` is prohibited while any required blocker remains unresolved.

### 11. Auto-optimize

Run only when optimization/remediation/revision/implementation is requested.
Audit-only requests report fixes without silent revision.

1. Score the baseline.
2. Apply the smallest justified fixes.
3. Rerun affected available checks and regressions.
4. Rescore from fresh evidence and re-evaluate blockers.
5. Stop when the requested threshold is met, after at most 3 iterations, or
   earlier for no improvement, repeated failure, missing authorization/context/
   tooling/evidence, unsafe or conflicting requirements, unresolved spec
   conflict, or required human judgment.

For this reference set, `96-100` is the production-ready score band; a user
request for “over 96” requires at least `97`. Score and deployment eligibility
must be reported separately.

## Resource routing

Always start with `references/index.md`. Important conditional routes:

- activation/description work -> `references/description-optimization.md`;
- observed instruction-shaping failures -> `references/instruction-form.md`;
- scripts or commands -> `references/using-scripts-in-skills.md`;
- runtime/client support -> `references/adding-skills-support.md`;
- Codex installation -> `references/codex-skill-installation.md`;
- Claude/Anthropic-specific authoring -> `references/anthropic-best-practices.md`;
- merge planning or execution -> the merge workflow selected by the index.

Do not rely on a path that has not been supplied or verified. Keep reference
chains shallow and load optional material only when its condition applies.

## Completion contract

Deliver the requested artifact plus changed paths, exact revision identifier,
fresh checks actually run, applicable score(s), blockers, `NHR` items, and
exactly one recommendation:

`deploy | revise | split | merge | deprecate | hold`
