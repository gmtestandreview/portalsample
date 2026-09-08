# Agent Skills Reference Index

Use this file as the **first lookup point** for the `writing-skills` reference set.

Purpose: route the agent to the **smallest sufficient set of references** for the current task. Do not load every reference.

## Location and path rules

This file lives at:

```text
skills/writing-skills/references/index.md
```

The main skill is one level up at `../SKILL.md`.

Sibling references use bare relative filenames:

```text
skill-classification.md
audit-scoring.md
SKILL-testing-checklist.md
```

Templates live in the sibling `templates/` directory:

```text
../templates/Skill Audit.md
../templates/SWOT Analysis.md
```

From the main `SKILL.md`, load this index as:

```text
references/index.md
```

Use forward-slash relative paths in skill content. Do not invent suffixes, alternate directories, or unavailable files.

## Lookup rules

1. Identify the task class before loading references.
2. Load the smallest primary reference that governs the task.
3. Load a secondary reference only when its stated condition is met.
4. Use `agent-skill-specification-format-page-2.md` for mandatory Agent Skills format/compliance claims.
5. Use `best-practices-evaluations.md` for quality criteria and `audit-scoring.md` for scoring mechanics.
6. Use `SKILL-testing-checklist.md` as the final validation/deployment gate, not as a substitute for specialist methods.
7. Treat best-practice guides, operational methods, and templates as supporting guidance rather than specification authority.
8. Apply Anthropic-specific guidance only when the target environment is Claude or Anthropic Agent Skills.
9. If sources conflict, use:
   `safety/trust/permissions > mandatory current spec > explicit user requirements > applicable environment/project rules > best-practice guidance > examples/templates`.
10. If a referenced file is absent, report it as missing. Do not silently substitute another file.
11. Use QAQ/RMI for critical trigger, branch, and load-condition decisions.
12. Do not load templates or persuasion guidance unless the task actually needs them.

# Fast routing table

| Task | Primary reference | Add only when needed |
|---|---|---|
| Mandatory `SKILL.md` format, frontmatter, directory/resource rules | `agent-skill-specification-format-page-2.md` | `SKILL-testing-checklist.md` at final validation |
| General skill authoring and information architecture | `agent-skills-best practices-page-3.md` | `anthropic-best-practices.md` only for Claude/Anthropic targets |
| Static quality audit or optimization | `best-practices-evaluations.md` | `audit-scoring.md` for scoring; `../templates/Skill Audit.md` only for report shape |
| Full scored audit | `best-practices-evaluations.md` | `audit-scoring.md`; `SKILL-testing-checklist.md` for final validation |
| Classify as Discipline, Technique, Pattern, Reference, or Hybrid | `skill-classification.md` | Testing reference selected from the resulting class |
| Fix activation or description wording | `description-optimization.md` | `agent-skills-optimizing-skill-descriptions-page-4.md` for measured trigger methodology |
| Behavioral/output-quality evals | `agent-skills-evaluating-skill-output-page-5.md` | `testing-skills-with-subagents.md` for Discipline/adherence pressure |
| RED/GREEN/REFACTOR pressure testing | `testing-skills-with-subagents.md` | `persuasion-principles.md` only after a concrete adherence/rationalization failure |
| Script-bearing skills or bundled commands | `agent-skills-using-scripts-in-skills-page-6.md` | Specification for structural compliance; checklist for final validation |
| Compare two skills for merge viability | `best-practices-evaluations.md` | `skill-classification.md` if scope/type differs; `../templates/SWOT Analysis.md` only when SWOT output helps |
| Final validation before deployment | `SKILL-testing-checklist.md` | Specification plus any specialist reference needed to execute unresolved checks |
| Claude/Anthropic-specific authoring decisions | `anthropic-best-practices.md` | Generic specification still controls universal compliance claims |

# Authority and role model

## Tier 1 — Mandatory specification

### `agent-skill-specification-format-page-2.md`

Use for claims about what a valid Agent Skill **must** contain or obey, including:

- skill-directory and `SKILL.md` structure;
- YAML frontmatter;
- `name` and `description`;
- supported optional fields;
- specification-defined resource and progressive-disclosure rules.

Do not let local checks, templates, or provider-specific conventions override it.

## Tier 2 — Operational evaluation and validation

### `best-practices-evaluations.md`

Defines **what good looks like** for scope, discoverability, context efficiency, execution quality, resource handling, safety, edge cases, testability, and maintainability.

Use it to identify quality failures. Do not use it alone for numeric scoring.

### `audit-scoring.md`

Defines **how to score**:

- artifact-completeness classification;
- applicability and `N/A` normalization;
- 100-point rubric;
- deduction anchors;
- severity;
- QAQ/RMI scoring;
- blocking conditions;
- score bands;
- verdict/recommendation mechanics.

Load it only when a score, severity, formal audit verdict, or rescoring is required.

### `SKILL-testing-checklist.md`

Final validation/deployment gate.

Use it to verify:

- specification checks;
- activation boundaries;
- progressive disclosure;
- behavioral RED/GREEN/REFACTOR evidence;
- paths/resources;
- scripts/tools;
- safety/rollback;
- regression;
- local-policy separation;
- deployment readiness.

It answers **whether validation is complete**. Use specialist references for **how** to perform complex checks.

### `skill-classification.md`

Classifies a candidate as Discipline, Technique, Pattern, Reference, or justified Hybrid and selects the appropriate testing emphasis.

### `description-optimization.md`

Compact operational procedure for improving a `description` and its activation boundary.

### `testing-skills-with-subagents.md`

Pressure-testing methodology for skills whose instructions may be rationalized away. Use for clean RED baselines, GREEN verification, adversarial pressure, and loophole refactoring.

### `persuasion-principles.md`

Optional adherence-wording support.

Load only after testing identifies a concrete rationalization or compliance failure. Do not use persuasion language as a substitute for evidence, clear instructions, or specification requirements.

# Tier 3 — Source-level guidance

### `agent-skills-best practices-page-3.md`

Use for source-level authoring guidance, domain value, context efficiency, degrees of freedom, workflow design, and iterative refinement.

### `agent-skills-optimizing-skill-descriptions-page-4.md`

Use for rigorous description-trigger evaluation, near-miss design, repeated trigger runs, trigger rates, and generalization-style testing.

### `agent-skills-evaluating-skill-output-page-5.md`

Use for behavioral eval design, with-skill/without-skill comparisons, assertions, grading, workspaces, and iterative evaluation.

### `agent-skills-using-scripts-in-skills-page-6.md`

Use when a skill contains or proposes commands or bundled executable scripts.

### `anthropic-best-practices.md`

Use only for Claude/Anthropic-specific authoring guidance. Do not promote Anthropic-only conventions into universal Agent Skills requirements.

# Templates

Templates are **not references** and do not define policy, scoring, or requirements.

### `../templates/Skill Audit.md`

Optional output template for a formal skill-audit report.

Use `best-practices-evaluations.md` for audit criteria and `audit-scoring.md` for scoring mechanics.

### `../templates/SWOT Analysis.md`

Optional output template for comparing two skills.

Load only when SWOT framing materially helps a merge/keep/split/deprecate decision or the user explicitly requests SWOT.

# Common recipes

## Static audit without scoring

Load:

1. candidate `SKILL.md` and directly relevant supporting resources;
2. `agent-skill-specification-format-page-2.md`;
3. `best-practices-evaluations.md`;
4. `skill-classification.md` only if classification affects the review.

Load `../templates/Skill Audit.md` only if the requested output should use that format.

## Full scored audit

Load:

1. candidate skill and relevant supporting resources;
2. `agent-skill-specification-format-page-2.md`;
3. `best-practices-evaluations.md`;
4. `audit-scoring.md`;
5. `skill-classification.md` when test emphasis or scope depends on type;
6. `SKILL-testing-checklist.md` before a final deployment/readiness claim.

Do not assign definitive scores to unknown/incomplete artifacts as though missing evidence were confirmed failure.

## Description remediation

Load:

1. candidate `SKILL.md`;
2. `description-optimization.md`.

Escalate to `agent-skills-optimizing-skill-descriptions-page-4.md` when measured trigger rates, repeated runs, near-miss sets, or generalization testing are required.

## Behavioral evaluation

Load:

1. candidate skill;
2. `agent-skills-evaluating-skill-output-page-5.md`.

For a Discipline skill or rationalization risk, also load `testing-skills-with-subagents.md`.

Load `persuasion-principles.md` only after a specific pressure/adherence failure is observed.

Use `SKILL-testing-checklist.md` to determine whether the resulting evidence is sufficient for final validation.

## Script-bearing skill review

Load:

1. candidate skill and relevant script;
2. `agent-skills-using-scripts-in-skills-page-6.md`;
3. `agent-skill-specification-format-page-2.md`.

Validate dependencies, inputs, outputs, error handling, path assumptions, reproducibility, and safety separately.

Use `SKILL-testing-checklist.md` before deployment.

## Merge evaluation

Load:

1. both source skills and their unique supporting resources;
2. `best-practices-evaluations.md`;
3. `skill-classification.md` when scope/type affects merge viability;
4. `audit-scoring.md` only when a scored comparison or rescore is required.

Load `../templates/SWOT Analysis.md` only when SWOT comparison is requested or materially clarifies the decision.

After a merge is implemented, use `SKILL-testing-checklist.md` for regression and final validation.

## Final deployment validation

Load:

1. `SKILL-testing-checklist.md`;
2. `agent-skill-specification-format-page-2.md`.

Then load only the specialist references needed to resolve unchecked or failed gates.

A behavior-critical skill with unresolved RED/GREEN/pressure evidence should remain `revise` or `hold`, not `deploy`.

# Load-boundary QAQ/RMI

For every optional reference or template:

1. Define a positive request that requires it.
2. Define a near-miss that should not load it.
3. Map the positive request to the file's unique value.
4. Verify the near-miss can be handled by the primary reference or base skill.
5. Reverse-map the resulting behavior to the intended request class.
6. If the mapping is ambiguous, narrow the route instead of loading more context.

The index succeeds when a task reaches the smallest sufficient file set without dead paths, unnecessary context, authority inversion, or template-as-policy confusion.
