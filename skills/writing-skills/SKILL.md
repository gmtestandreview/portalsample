---
name: writing-skills
description:
  Use when creating, editing, auditing, optimizing, testing, validating,
  merging, installing, or deploying Agent Skills/SKILL.md packages, especially
  activation boundaries, frontmatter, scope, progressive disclosure, supporting
  resources, evals, SKILL-specific validators, Codex installation, or deployment
  readiness. Use also when explicitly asked to call "writing skills" or "called
  writing skills".
compatibility: Codex, Claude, A Team, Claude Code, GitHub Copilot
metadata:
  version: '2026-11-14-adversarial-review'
  last-updated: '2026-11-14'
---

# Writing Skills

Treat skill work as evidence-driven lifecycle management. Observe representative
behavior where possible, add the smallest justified guidance, and revalidate
after consequential changes. Never invent requirements, paths, tools, tests,
results, permissions, or supporting resources.

## Purpose, objective, and success state

**Purpose:** Agent Skill changes can look compliant while hiding activation
collisions, broken resource paths, destructive side effects, or unverifiable
behavior. This skill supplies a reusable, evidence-gated workflow that an
ordinary editing prompt does not reliably enforce.

**Objective:** For the supplied Agent Skill and its authorized resources,
inspect and either decide or make the smallest justified improvement; preserve
unique domain knowledge, scope boundaries, safety and existing behavior. Do not
install, publish, overwrite an external target, or claim readiness without the
required authority and evidence.

**Success state:** A reviewed before-state, explicit changes or a supported
no-change decision, protected invariants, a complete deliverable inventory, and
current check results exist. The requested artifact must be accessible; all
applicable mandatory gates must pass before `deploy`. A static score, completed
checklist, or successful test command alone is **not** proof that a skill
activates or improves real behavior. Stop and report `NHR` or a blocker when a
required claim cannot be demonstrated.

## Scope

Use this skill for Agent Skills / `SKILL.md` lifecycle work: creation, editing,
auditing, optimization, activation, testing, validation, merge decisions,
supporting-resource design, Codex installation, and deployment readiness.

Do not use it for ordinary Markdown editing, one-off project instructions,
generic linters, or agent-role definitions unless the request is specifically
about packaging them as an Agent Skill.

## Evidence and authority

- Read the candidate and task-relevant resources before judging or editing.
- Use `references/index.md` first and load the smallest sufficient reference
  set.
- Use `references/specification.md` for mandatory format/compliance claims.
- Treat best-practice, provider, repository, and local-client guidance as
  subordinate to mandatory specification and safety requirements.
- Precedence: `safety/trust/permissions > mandatory current spec > explicit user
  requirements
  > applicable skill/project/domain requirements > audit policy > best-practice
  > defaults > examples/legacy material`.
- Only claim edits, tests, validator runs, builds, or behavior that were
  actually performed or directly evidenced.
- Mark required but unverifiable outcomes `Needs Human Review` (`NHR`).
- A checklist defines required evidence; it is not execution evidence.
- Tested behavior is evidence, not authority to waive mandatory requirements.
- Do not claim safety, readiness, or compliance beyond the evidence available.

## Pre-execution adversarial self-review

Before consequential evaluation or modification, make a compact operational
check: **intent** (what did the user request, and what is excluded?), **scope**
(is this the right skill?), **evidence** (which files/tools/results exist?),
**constraints** (what must remain unchanged?), **risk** (what side effects or
permissions require a checkpoint/authorization?), **validation** (what would
falsify success?), and **deliverable** (what exact files/report are required?).
Challenge the most likely wrong assumption and highest-cost failure. If a
material ambiguity cannot be resolved from supplied evidence, do not invent an
answer or proceed with high-impact changes; record `AMBER`/`NHR` and continue
only with reversible, supported work. Keep this check proportionate to risk.

## Workflow

### 1. Explore

Review scope, target environment, supplied resources, risks, references, and
available evidence. Preserve a baseline before meaningful implementation. Report
missing or broken references rather than inventing substitutes.

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
Use the current 100-point rubric and normalize only genuine `N/A` criteria. A
numeric score never overrides a blocker.

### 6. Test or assess evidence

Before testing, freeze the revision, governing instruction, expected result,
negative oracle, comparison baseline (where meaningful), and evidence location.
Use `evals/README.md` and `evals/evaluation-schema.md` for cases and recording.
At minimum cover direct **positive**, **indirect positive**, **near-miss**,
**edge**, **missing/invalid input**, **pressure**, **known regression**, and
**output** cases as applicable. For every critical trigger or branch, map a
positive and near-miss bidirectionally (QAQ/RMI); test what must **not** occur
as well as what must occur. Distinguish static checks and designed scenarios
from observed runtime activation and with/without-skill comparisons. Never mark
an unexecuted behavioral test `PASS`.

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

Use the user's supplied rubric when one is provided; do not silently substitute
this package's default scoring methodology. For an explicitly requested
**Devil's Advocate** six-area review, use
`references/devils-advocate-rubric.md`. For an exhaustive package review, also
use `references/file-review-rubric.md` to inspect every first-party file by its
role, including code, tests, evals, templates, metadata, and configuration.
Report exclusions such as vendored environments, compiled outputs, caches, and
session logs separately; do not treat them as deployable support files. Score
individual files independently, not by copying the package total. A file's
quality score does not establish fresh behavior or deployment readiness.

Run only when optimization/remediation/revision/implementation is requested.
Audit-only requests report fixes without silent revision.

Load `references/bounded-optimisation.md` before iterative evaluation. It owns
the wave cap, closeout reserve, frozen evidence, and publication/dispatch
preflight; keep one methodology controller and preserve a usable checkpoint.

1. Score the baseline when a scored audit is requested; otherwise record the
   baseline defects and required acceptance gates without inventing a score.
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
- Claude/Anthropic-specific authoring ->
  `references/anthropic-best-practices.md`;
- merge planning or execution -> the merge workflow selected by the index.

Do not rely on a path that has not been supplied or verified. Keep reference
chains shallow and load optional material only when its condition applies.

## Expected output and completion contract

Deliver the exact requested candidate or supported no-change decision and an
independently inspectable report containing: baseline identity/hash and file
inventory; findings versus fixes; before/after rubric scores with criterion
scores and evidence; every first-party file's role and score when an atomic
review is requested; available positive, negative, edge, safety and regression
test results with commands and exit statuses; unrun tests and `NHR`; protected
invariants; remaining blockers; final artifact location; and final decision.
Preserve the supplied original. Never report a proposed action as an edit, a
planned test as executed, a successful static inspection as a behavioral pass,
or a high score as release authorization. The final artifact must be verified at
its actual location before claiming delivery. End with exactly one
recommendation:

`deploy | revise | split | merge | deprecate | hold`
