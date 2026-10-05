---
name: writing-skills
description:
  Use when creating, editing, optimizing, testing, validating, installing, or
  deploying Agent Skills/SKILL.md files, including activation boundaries,
  frontmatter, trigger aliases such as "writing skills" or "called writing
  skills", scope, progressive disclosure, supporting resources, evals,
  SKILL-specific validators, Codex skill installation, and deployment readiness.
compatibility: codex, claude, a-team, claude-code, Github Copilot
metadata:
  version: 2026-10-05-package-review
  last-updated: '2026-10-05'
---

<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->

# Writing Skills

Treat skill authoring as test-driven process that teaches the agent: observe a
baseline (RED), add minimal justified guidance (GREEN), close loopholes and
retest (REFACTOR). Never invent a failure when representative evidence is
available.

## Purpose

Agent Skills are a lightweight, open format for extending AI agent capabilities
with specialized knowledge and workflows.

Use this document for:

- agent skill lifecycle work,
- activation/frontmatter/scope,
- supporting resources,
- skill-specific evaluations/validators, and
- explicit requests related to `writing skills`.

## Rules and scope

### Review and evidence

- Review the provided artifacts and link findings to the corresponding evidence.
- Do not assume, expand, or invent requirements without supporting evidence.
- Report any missing references; never invent substitutes.
- Follow the host instruction hierarchy.

### Edits and tests

- Eliminate duplicated, obsolete, unsafe, or generic content;
- Only claim edits or tests when they have been performed or evidenced.
- Evaluation sources do not provide execution permissions.
- Mark any unverifiable required outcomes `Needs Human Review` (`NHR`).

### Progressive disclosure, extracting, and relocating content

- Retain unique, mandatory, or domain-specific content in the `SKILL.md` file.
- Move optional, generic, or project-only content to `references/`.
- Move detailed methods, optional conditions, or examples to `references/`.
- Extract executable code in the `SKILL.md` file or supporting files to the
  `scripts/` directory.
- Place templates and assets in the `assets/` directory.
- Store cases or fixtures in the `evals/` directory or the designated local
  location.

### Routing and references best practice

- Use `references/index.md` as the first routing point for all references.
- Utilize relative paths, explicit load and run conditions, and shallow
  reference chains.
- Avoid long, deep, or circular reference chains; do not rely on external links.
- Avoid generic, ambiguous, or overly broad references; link to the most
  specific applicable reference.

### Governance and authorization

- `SKILL-testing-checklist.md` is the final deployment gate. A checklist does
  not constitute execution evidence.
- Ask about authorization when requested implementation is ambiguous.
- High-impact changes require authorization, backup, validation, and a rollback
  plan.
- Label requested Quick Triage `Preliminary`; do not indicate final readiness.

### Context and size

- Target `<200` body lines/~`2,000` tokens; split near `500`/~`5,000`. Note:
  These are context targets, not validity rules.
- Extract details to reference documents as the context expands.

### For Codex discovery and installation

Prioritize using a dedicated installer that is actively maintained, exclude:

- standard Markdown,
- one-time project instructions,
- generic linters, and
- definitions related to agent roles.

## Specification

Refer to [the specification](references/specification.md) for compliance claims:

```text
skill-name/
├── SKILL.md          # Required: frontmatter + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation
├── assets/           # Optional: templates, resources
├── evals/            # Optional: test cases, fixtures
└── ...               # Any additional files or directories
```

A skill directory must include a `SKILL.md` file. The `SKILL.md` file must
contain YAML frontmatter followed by Markdown content.

- `name`: Must consist of 1 to 64 lowercase alphanumeric characters or hyphens;
  - There should be no leading, trailing, or consecutive hyphens,
  - it must match the name of the parent directory.
- `description`: This field must not be empty and can contain up to 1024
  characters.
  - It should clearly state what the skill is and when it is applicable.
- Optional fields:
  - Only include fields that are supported by the current specification.

Policies regarding paths, registration, validators, naming preferences, and
packaging limits are determined locally unless stated otherwise.

Supporting directories such as `references/`, `scripts/`, `assets/`, and
typically `evals/` are optional.

This package maintains seeded evaluations in `evals/`.

## Authoring workflow

### 1. Define the skill boundary

Record triggers that **Should trigger**, **Should not trigger**, and are
**Ambiguous**. For each critical trigger, branch, or load condition, run a
QAQ/RMI:

- Map a positive request to its corresponding instruction and behavior.
- Examine a near-miss scenario.
- Reverse-map the behavior to identify the intended request class.
- Revise any ambiguous or inconsistent mappings.

### 2. Decide whether a skill is justified

Maintain reusable reference materials the agent cannot reliably reproduce
unaided. For instance:

- domain knowledge,
- techniques,
- workflows, and
- decision patterns.

Store single-use solutions or deterministic enforcement in separate artifacts.
For example:

- project-only conventions,
- generic knowledge, and
- purely mechanical rules.

### 3. Classify the skill

Choose the narrowest type that explains its primary reusable value:

- `Discipline`: involves decisions, gates and pressure-testing.
- `Technique`: is a bounded method that tests its application and edges.
- `Pattern`: are decision structures that require recognition and counterexample
  testing.
- `Reference`: authoritative knowledge; Testing involves retrieval, coverage,
  and application
- `Hybrid`: is only used when one type significantly misrepresents its value.

### 4. Establish RED evidence

For new skills or meaningful behavior changes, perform the following:

- Representative task without the candidate or
- Use the preserved previous version during revisions.

Map failures, ambiguities, inefficiencies, and rationalizations to weak
instructions.

- For `Discipline` skills, consider factors such as time, sunk costs, authority,
  fatigue, confidence, and speed pressures that contribute to discipline
  failures.
- For `Technique` skills, take into account edge cases, resource discovery, and
  conditional behavior.
- For `Pattern` skills, focus on recognition, counterexamples, and decision
  structures.
- For `Reference` skills, assess retrieval, coverage, and application.
- For `Hybrid` skills, evaluate the relevant combination of the above factors.

Record the observed failures, their triggers, and the associated evidence.

If execution is genuinely unavailable, label it RED `NHR`; note that
inconvenience does not equate to a lack of capability.

### 5. Write minimal GREEN guidance

Add guidance to prevent observed failures or to satisfy mandatory rules.

Utilize explicit boundaries, atomic actions, observable conditions, a single
clear default, failure-to-correction pairs, and measurable completion criteria.
For skill checks that can be mechanically decided, prioritize deterministic
validation. Distinguish between specification failures and local-policy
failures. Execute available validators and label any unavailable required checks
as `NHR`.

### 6. Match instruction form to failure

- **Rule skipped under pressure** → prohibition, red flag, rationalization
  counter.
- **Wrong output shape** → positive output contract or template.
- **Required element omitted** → required structural field or slot.
- **Conditional behavior** → conditional keyed to an observable predicate.

Do not strengthen wording by default. Express exceptions as observable
conditions; scope limits to the affected field. For shaping failures, exemption
wording, or experiment claims, load
[instruction-form guidance](references/instruction-form.md). Findings from other
agents/tasks are hypotheses to test locally.

### 7. Test

Cover activation positives, realistic near-misses, edges, regressions, resource
paths, scripts/tools, and applicable safety/destructive operations. Use multiple
realistic phrasings for trigger optimization. Select tests by class and risk:

- Output-quality/behavioral eval design: load
  [evaluating skill output](references/evaluating-skill-output.md).
- Class-specific RED/GREEN/REFACTOR, pressure/edge, retrieval/application,
  resource discovery, or regression: load
  [testing skills with subagents](references/testing-skills-with-subagents.md).
- This package's deterministic parser/validator/prompt/CLI tests: execute via
  [scripts/README.md](scripts/README.md). They do not prove agent behavior.

### 8. Validate

Apply [the testing checklist](references/SKILL-testing-checklist.md) as the
final deployment gate. Verify frontmatter/specification, scope/description
alignment, activation boundaries, prevention of evidenced RED failures,
regressions, resource paths, fresh command results, and proportionate
authorization, backup, validation, and rollback controls. State limitations and
unvalidated commands.

Record behavioral results as `PASS`, `AMBER`, `FAIL`, `NHR`, or justified `N/A`.
Required unresolved `AMBER`, `FAIL`, or `NHR` blocks `deploy`. Checklist
additions beyond the specification are local policy, not universal format
constraints.

### 9. Auto-optimize

Run only for requested optimization/remediation/revision/implementation.
Audit-only requests report fixes without silent revision. Before scoring, load
[quality criteria](references/best-practices-evaluations.md) and
[audit scoring](references/audit-scoring.md); record applicability, evidence,
deductions, and normalized score. The 96-point threshold is local audit policy.
For a requested per-file package review, also use the
[file review rubric](references/file-review-rubric.md): inventory every owned
resource, apply its role-specific contract, and report each score separately.
Honor a stricter user threshold; “over 96” requires at least 97 per file.

If below the applicable threshold or a blocker remains, apply minimal fixes,
rerun checks, then rescore and re-evaluate blockers. Stop after at most 3
iterations, or earlier for no improvement, repeated failure, missing
authorization, context, tooling, or evidence; unsafe/conflicting requirements,
unresolved specification conflict, or required human judgment. A high score
never clears a blocker. Finish with one recommendation (`deploy`, `revise`,
`split`, `merge`, `deprecate`, or `hold`) and supporting evidence/limitations.
Deliver the requested artifact plus changed paths, its exact revision, fresh
checks, applicable scores, unresolved evidence, and the recommendation.

## Creating and merging

For new skills, use a matching lowercase hyphenated directory and concise
intent/trigger description. Add only needed resources and representative evals
before expanding documentation. Validate structure and a real activation task.
In A Team repositories, register in `CLAUDE.md`, `AGENTS.md`, and
`skills/using-a-team/SKILL.md`; elsewhere follow documented runtime
registration. Do not assume paths, quoting conventions, asset-size limits, or
validator commands.

Merge same purpose+scope. Separate distinct domains or extract a shared base.
For partial overlap, preserve specialized value while extracting shared content.
Resolve contradictions before merging; preserve unique content before
deprecating. Choose a justified tool default with useful conditional
alternatives. Preserve trigger boundaries or split; retain narrow skills with
domain-specific value.

For evaluation claims: specification governs compliance; user requirements
govern requested scope; project/domain rules govern local policy; audit policy
governs scoring. Defaults/examples cannot override these sources. Follow the
host instruction hierarchy during execution. Tested behavior is evidence, not
permission to waive requirements or label a specification deviation compliant.
Never silently expand activation or claim safety without evidence.

## References and common failures

Use [references/index.md](references/index.md) first; it owns detailed routing.
For Codex listing/installation without a dedicated installer, load
[Codex skill installation](references/codex-skill-installation.md). Load only
task-relevant specialist references.

Correct vague/workflow-stuffed descriptions with concrete intent and boundaries;
ground generic drafts in observed tasks; relocate bloated context; validate
mechanical checks deterministically; label client conventions local; mark unrun
tests or unavailable paths/tools `NHR` or unvalidated.

skills\writing-skills\assets\templates\skill-audit.md
