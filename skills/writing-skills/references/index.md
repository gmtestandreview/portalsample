# Agent Skills Reference Index

Use this file as the **first lookup point** for the `writing-skills` reference set.

Purpose: route the agent to the **smallest sufficient set of references** for the current task. Do not load every reference.

## Lookup rules

1. Identify the task class before loading references.
2. Load the smallest primary reference that governs the task.
3. Load a secondary reference only when its stated condition is met.
4. Use `specification.md` for mandatory Agent Skills format/compliance claims.
5. Use `best-practices-evaluations.md` for quality criteria, including knowledge-delta, anti-pattern, and common failure-pattern review; use `audit-scoring.md` for scoring mechanics.
6. Use `SKILL-testing-checklist.md` as the final validation/deployment gate, not as a substitute for specialist methods.
7. Treat best-practice guides, operational methods, and templates as supporting guidance rather than specification authority.
8. Apply Anthropic-specific guidance only when the target environment is Claude or Anthropic Agent Skills.
9. If sources conflict, use:
   `safety/trust/permissions > mandatory current spec > explicit user requirements > applicable environment/project rules > best-practice guidance > examples/templates`.
10. If a referenced file is absent, report it as missing. Do not silently substitute another file.
11. Use QAQ/RMI for critical trigger, branch, and load-condition decisions.
12. Do not load templates, merge prompt workflows, or persuasion guidance unless the task actually needs them.

## Fast routing table

| Task | Primary reference | Add only when needed |
| --- | --- | --- |
| Mandatory `SKILL.md` format, frontmatter, directory/resource rules | `specification.md` | `SKILL-testing-checklist.md` at final validation |
| General skill authoring and information architecture | `best practices-for-skill-creators.md` | `anthropic-best-practices.md` only for Claude/Anthropic targets |
| Static quality audit or optimization | `best-practices-evaluations.md` | `audit-scoring.md` for scoring; `templates/skill-audit.md` only for report shape |
| Full scored audit | `best-practices-evaluations.md` | `audit-scoring.md`; `SKILL-testing-checklist.md` for final validation |
| Classify as Discipline, Technique, Pattern, Reference, or Hybrid | `skill-classification.md` | Testing reference selected from the resulting class |
| Fix activation or description wording | `description-optimization.md` | Use for rigorous description evaluation testing. |
| Behavioral/output-quality evals | `evaluating-skill-output.md` | `scripts/evals/README.md` for seeded case files after applying the primary eval workflow; `scripts/evals/campaigns/` when reviewing executed campaign evidence; `testing-skills-with-subagents.md` when classification-specific RED/GREEN/REFACTOR, pressure/edge, Reference retrieval/application, resource-discovery, or regression evidence is needed |
| RED/GREEN/REFACTOR pressure testing | `testing-skills-with-subagents.md` | `persuasion-principles.md` only after a concrete adherence/rationalization failure |
| Script-bearing skills or bundled commands | `using-scripts-in-skills.md` | `scripts/README.md` and `scripts/pyproject.toml` when installing or running this skill's deterministic tests; `scripts/skills_ref/` and `scripts/tests/` only for local validator/parser/CLI tooling; specification for structural compliance; checklist for final validation |
| Codex skill listing or installation | `codex-skill-installation.md` | `using-scripts-in-skills.md` only when editing or validating installer scripts; `specification.md` when validating an installed skill package |
| Persistent evidence model, audit records, or evaluation storage design | `skill-testing-data-model.md` | `scripts/evals/evaluation-schema.md` when mapping seeded behavioral case fields |
| Agent Skills runtime/client support | `adding-skills-support.md` | `specification.md` for format rules; local client policy only when target environment requires it |
| Compare two skills for merge viability | `best-practices-evaluations.md` | `skill-classification.md` if scope/type differs; `templates/SWOT Analysis.md` only when SWOT output helps |
| Quick merge plan for supplied skills | `prompt-1-quick-merge-plan.md` | `best-practices-evaluations.md` only when quality criteria must be applied; `skill-classification.md` only when type affects the recommendation |
| Full audit and conditional merge of supplied skills | `prompt-2-full-audit+conditional-merge.md` | `specification.md` for mandatory format; `SKILL-testing-checklist.md` before deployment/readiness claims |
| Final validation before deployment | `SKILL-testing-checklist.md` | Specification plus any specialist reference needed to execute unresolved checks |
| Claude/Anthropic-specific authoring decisions | `anthropic-best-practices.md` | Generic specification still controls universal compliance claims |
| Adding or editing a flowchart in a skill | `scripts/graphviz-conventions.dot` | `scripts/render-graphs.js` to render the skill's flowcharts to SVG |

## Authority and role model

### Tier 1 - Mandatory specification

#### `specification.md`

Use for claims about what a valid Agent Skill **must** contain or obey, including:

- skill-directory and `SKILL.md` structure;
- YAML frontmatter;
- `name` and `description`;
- supported optional fields;
- specification-defined resource and progressive-disclosure rules.

Do not let local checks, templates, or provider-specific conventions override it.

### Tier 2 - Operational evaluation and validation

#### `best-practices-evaluations.md`

Defines **what good looks like** for scope, discoverability, context efficiency, execution quality, resource handling, safety, edge cases, testability, maintainability, knowledge delta, anti-pattern quality, and common audit failure patterns.

Use it to identify quality failures. Do not use it alone for numeric scoring.

#### `audit-scoring.md`

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

#### `SKILL-testing-checklist.md`

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

#### `skill-classification.md`

Classifies a candidate as Discipline, Technique, Pattern, Reference, or justified Hybrid and selects the appropriate testing emphasis.

#### `description-optimization.md`

Operational procedure for improving a `description` and its activation boundary. Use for rigorous description-trigger evaluation, near-miss design, repeated trigger runs, trigger rates, and generalization-style testing.

#### `testing-skills-with-subagents.md`

Behavioral testing methodology across Discipline, Technique, Pattern, Reference, and Hybrid skills. Use for RED/GREEN/REFACTOR evidence, activation boundaries, class-appropriate pressure/edge testing, Reference retrieval/application/resource discovery, and regression.

#### `skill-testing-data-model.md`

Use when designing, auditing, or mapping persistent evidence records for skill revisions, requirements, behavioral eval campaigns, deterministic test runs, audit findings, and deployment decisions.

#### `persuasion-principles.md`

Optional adherence-wording support.

Load only after testing identifies a concrete rationalization or compliance failure. Do not use persuasion language as a substitute for evidence, clear instructions, or specification requirements.

### Tier 3 - Source-level guidance

#### `best practices-for-skill-creators.md`

Use for source-level authoring guidance, domain value, context efficiency, degrees of freedom, workflow design, and iterative refinement.

#### `evaluating-skill-output.md`

Use for behavioral eval design, with-skill/without-skill comparisons, assertions, grading, workspaces, and iterative evaluation.

#### `using-scripts-in-skills.md`

Use when a skill contains or proposes commands or bundled executable scripts.

#### `codex-skill-installation.md`

Use when a user asks to list installable Codex skills, install curated or experimental skills, install skills from GitHub repository paths, or reason about `$CODEX_HOME/skills` installation behavior.

This is operational Codex guidance. Use a dedicated installer skill or available installer scripts when the environment provides them; otherwise report the missing installer capability instead of inventing script paths.

#### `adding-skills-support.md`

Use when adding Agent Skills support to a runtime, client, loader, or integration. It covers discovery, parsing, validation, activation prompt construction, execution access, and security boundaries for clients that consume skills.

#### `anthropic-best-practices.md`

Use only for Claude/Anthropic-specific authoring guidance. Do not promote Anthropic-only conventions into universal Agent Skills requirements.

### Tier 4 - Task-specific merge workflows

These files are executable workflow prompts for skill consolidation tasks. They are references only for merge-planning or merge-execution requests and should not be loaded for ordinary audits, description tuning, or validation.

#### `prompt-1-quick-merge-plan.md`

Use when the user asks for an early merge plan, overlap analysis, preservation inventory, conflict list, or recommendation before deciding whether to run a full merge audit.

It produces a concise plan and recommendation only. It must not produce a final merged `SKILL.md`.

#### `prompt-2-full-audit+conditional-merge.md`

Use when the user asks for a full audit and conditional merge of supplied `SKILL.md` files and supporting resources.

It may produce a final merged `SKILL.md` only when preservation and conflict review establish **Ready to Merge**. If readiness is **Needs Human Review** or **Do Not Merge**, it stops at the audit and decision.

## Flowchart authoring

### `scripts/graphviz-conventions.dot`

Load condition: adding or editing a flowchart in a skill. Graphviz style rules for skill flowcharts - shapes, labels, layout, and what not to put in a diagram.

Note: `scripts/render-graphs.js` renders a skill's flowcharts to SVG (`node scripts/render-graphs.js <skill-dir>`, add `--combine` for one SVG). Requires graphviz (`dot`) on the system.

## Behavioral eval suite

### `scripts/evals/README.md`

Load condition: planning or executing behavioral evaluation campaigns, seeded case files, or reusable eval-case discovery. Apply `evaluating-skill-output.md` first for output-quality eval workflow, then use this file to route to the activation, RED/GREEN, pressure, reference, and regression case libraries plus the shared evaluation schema.

### `scripts/evals/evaluation-schema.md`

Load condition: recording or validating behavioral eval case fields, outcome semantics, requiredness, and evidence records.

### `scripts/evals/campaigns/`

Load condition: reviewing executed behavioral-evaluation campaigns, prior RED/GREEN evidence, deployment decisions, or evidence freshness for this skill. These records are evidence artifacts, not reusable case definitions.

## Deterministic tooling

### `scripts/skills_ref/`

Load condition: inspecting, fixing, or extending this skill's local parser, validator, prompt-generation, or CLI implementation. Prefer executing the CLI/tests over reading implementation files when only validation output is needed.

### `scripts/README.md`

Load condition: installing the local `skills-ref` package, running deterministic tests, or using the local CLI/API examples.

### `scripts/pyproject.toml`

Load condition: debugging test execution, dependency installation, editable installs, pytest discovery, or package build behavior for the local deterministic tooling.

### `scripts/tests/`

Load condition: validating or changing the local `skills_ref` parser, validator, prompt-generation, or CLI behavior.

## Templates

Templates are **not references** and do not define policy, scoring, or requirements.

### `templates/skill-audit.md`

Optional output template for a formal skill-audit report.

Use `best-practices-evaluations.md` for audit criteria and `audit-scoring.md` for scoring mechanics.

### `templates/SWOT Analysis.md`

Optional output template for comparing two skills.

Load only when SWOT framing materially helps a merge/keep/split/deprecate decision or the user explicitly requests SWOT.

## Common recipes

### Static audit without scoring

Load:

1. candidate `SKILL.md` and directly relevant supporting resources;
2. `specification.md`;
3. `best-practices-evaluations.md`;
4. `skill-classification.md` only if classification affects the review.

Load `templates/skill-audit.md` only if the requested output should use that format.

### Full scored audit

Load:

1. candidate skill and relevant supporting resources;
2. `specification.md`;
3. `best-practices-evaluations.md`;
4. `audit-scoring.md`;
5. `skill-classification.md` when test emphasis or scope depends on type;
6. `SKILL-testing-checklist.md` before a final deployment/readiness claim.

Do not assign definitive scores to unknown/incomplete artifacts as though missing evidence were confirmed failure.

### Description remediation

Load:

1. candidate `SKILL.md`;
2. `description-optimization.md`.

### Behavioral evaluation

Load:

1. candidate skill;
2. `evaluating-skill-output.md`.

Also load `testing-skills-with-subagents.md` when the evaluation needs classification-specific RED/GREEN/REFACTOR evidence, activation-boundary testing, pressure/edge cases, Reference retrieval/application/resource discovery, or behavioral regression. Do not restrict this reference to Discipline skills.

Load `persuasion-principles.md` only after a specific pressure/adherence failure is observed.

Use `SKILL-testing-checklist.md` to determine whether the resulting evidence is sufficient for final validation.

### Script-bearing skill review

Load:

1. candidate skill and relevant script;
2. `using-scripts-in-skills.md`;
3. `specification.md`.

Validate dependencies, inputs, outputs, error handling, path assumptions, reproducibility, and safety separately.

Use `SKILL-testing-checklist.md` before deployment.

### Merge evaluation

Load:

1. both source skills and their unique supporting resources;
2. `best-practices-evaluations.md`;
3. `skill-classification.md` when scope/type affects merge viability;
4. `audit-scoring.md` only when a scored comparison or rescore is required.

Load `templates/SWOT Analysis.md` only when SWOT comparison is requested or materially clarifies the decision.

After a merge is implemented, use `SKILL-testing-checklist.md` for regression and final validation.

### Quick merge plan

Load:

1. supplied skill files and directly relevant supporting resources;
2. `prompt-1-quick-merge-plan.md`.

Add `best-practices-evaluations.md` only when the plan needs explicit quality criteria. Add `skill-classification.md` only when the source skills' type affects merge viability or testing emphasis.

Do not produce the final merged `SKILL.md` from the quick-plan workflow.

### Full audit and conditional merge

Load:

1. supplied skill files and directly relevant supporting resources;
2. `prompt-2-full-audit+conditional-merge.md`;
3. `specification.md` when a final `SKILL.md` may be produced;
4. `SKILL-testing-checklist.md` before deployment/readiness claims.

Produce a final merged `SKILL.md` only when the workflow's readiness decision is **Ready to Merge**. If preservation, conflicts, ownership, purpose, or supporting-resource treatment is unresolved, stop at **Needs Human Review** or **Do Not Merge**.

## Final deployment validation

Load:

1. `SKILL-testing-checklist.md`;
2. `specification.md`.

Then load only the specialist references needed to resolve unchecked or failed gates.

A behavior-critical skill with any required `AMBER`, `FAIL`, or `NHR` outcome, or otherwise unresolved required behavioral evidence, must remain `revise` or `hold`, not `deploy`. This includes applicable pure Reference evaluations.

## Load-boundary QAQ/RMI

For every optional reference or template:

1. Define a positive request that requires it.
2. Define a near-miss that should not load it.
3. Map the positive request to the file's unique value.
4. Verify the near-miss can be handled by the primary reference or base skill.
5. Reverse-map the resulting behavior to the intended request class.
6. If the mapping is ambiguous, narrow the route instead of loading more context.

The index succeeds when a task reaches the smallest sufficient file set without dead paths, unnecessary context, authority inversion, or template-as-policy confusion.
