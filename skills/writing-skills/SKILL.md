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
  version: 2026-10-04-package-review
  last-updated: '2026-10-04'
---

<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->

# Writing Skills

Treat skill authoring as test-driven process documentation: observe a baseline
(RED), add minimal justified guidance (GREEN), close loopholes and retest
(REFACTOR). Never invent a failure when representative evidence is available.

## Rules and scope

- Read supplied artifacts; tie findings to evidence, not imagined requirements.
- Preserve unique domain knowledge. Remove duplicated, obsolete, unsafe, or
  generic content; relocate conditional detail.
- Keep mandatory guidance here. Target <200 body lines/~2,000 tokens; extract
  near 500/~5,000. These are context targets, not validity rules.
- Claim edits/tests only when performed or evidenced. Mark unverifiable required
  outcomes `Needs Human Review` (`NHR`). A checklist is not execution evidence.
- Ask about authorization when requested implementation is ambiguous.
  High-impact changes require authorization, backup, validation, and rollback.
- Label requested Quick Triage `Preliminary`; do not give final readiness.
- Follow the host instruction hierarchy. Evaluation sources do not grant
  execution permissions. Report missing references; never invent substitutes.

Use for Agent Skill lifecycle work, activation/frontmatter/scope, supporting
resources, skill-specific evals/validators, and explicit "writing skills" calls.
For Codex discovery/installation, prefer an active dedicated installer. Exclude
ordinary Markdown, one-off project instructions, generic linters, and agent-role
definitions.

## Required shape

A skill directory requires `SKILL.md`: YAML frontmatter followed by Markdown.
Use [the specification](references/specification.md) for compliance claims:

- `name`: 1–64 lowercase alphanumeric characters or hyphens; no leading,
  trailing, or consecutive hyphens; matches the parent directory.
- `description`: non-empty, at most 1024 characters; states what and when.
- Optional fields: only those supported by the current specification.

Paths, registration, validators, naming preferences, and packaging limits are
local policy unless specified universally. Supporting directories are optional:
`references/`, `scripts/`, `assets/`, and commonly `evals/`. This package keeps
seeded evals in `scripts/evals/` beside its deterministic harness.

## Authoring workflow

### 1. Define the skill boundary

Record **Should trigger**, **Should not trigger**, and **Ambiguous** requests.
For each critical trigger, branch, or load condition, run QAQ/RMI: map a
positive request to its instruction and behavior; check a near-miss; reverse-map
behavior to the intended request class; revise ambiguous or inconsistent
mappings.

### 2. Decide whether a skill is justified

Keep reusable domain knowledge, techniques, workflows, decision patterns, or
reference material the agent would not reliably reproduce unaided. Single-use
solutions, project-only conventions, generic knowledge, and purely mechanical
rules belong in other artifacts or deterministic enforcement.

### 3. Classify the skill

Choose the narrowest type explaining its primary reusable value:

- **Discipline**: broad practice with decisions/gates; pressure-test it.
- **Technique**: bounded method; test application and edges.
- **Pattern**: decision structure; test recognition and counterexamples.
- **Reference**: authoritative knowledge; test retrieval, coverage, application.
- **Hybrid**: only when one type materially misrepresents its value.

### 4. Establish RED evidence

For new skills or meaningful behavior changes, run a representative task without
the candidate, or with the preserved previous version when revising. Record the
actual failure, ambiguity, inefficiency, or rationalization; map it to the weak
instruction. For Discipline skills, combine relevant time, sunk-cost, authority,
fatigue, confidence, or speed pressures. If execution is genuinely unavailable,
mark RED `NHR`; inconvenience is not missing capability.

### 5. Write minimal GREEN guidance

Add only guidance preventing observed failures or satisfying mandatory rules.
Use explicit boundaries, atomic actions, observable conditions, one clear
default, failure→correction pairs, and measurable completion criteria. For
mechanically decidable skill checks, prefer deterministic validation; separate
specification failures from local-policy failures. Run available validators;
mark unavailable required checks `NHR`.

### 6. Apply progressive disclosure

Keep core constraints here. Move detailed methods/examples to `references/`,
operations to `scripts/`, templates/assets to `assets/`, and cases/fixtures to
`evals/` or the documented local location. Use relative paths, explicit load/run
conditions, and shallow reference chains. Extract detail as context grows.

### 7. Match instruction form to failure

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

### 8. Test

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

### 9. Validate

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

### 10. Auto-optimize

Run only for requested optimization/remediation/revision/implementation.
Audit-only requests report fixes without silent revision. Before scoring, load
[quality criteria](references/best-practices-evaluations.md) and
[audit scoring](references/audit-scoring.md); record applicability, evidence,
deductions, and normalized score. The 96-point threshold is local audit policy.
For a requested per-file package review, also use the
[file review rubric](references/file-review-rubric.md): inventory every owned
resource, apply its role-specific contract, and report each score separately.
Honor a stricter user threshold; “over 96” requires at least 97 per file.

If score <96 or a blocker remains, apply minimal justified fixes, rerun checks,
then rescore and re-evaluate blockers. Stop after at most 3 iterations, or
earlier for no improvement, repeated failure, missing authorization, context,
tooling, or evidence; unsafe/conflicting requirements, unresolved specification
conflict, or required human judgment. A high score never clears a blocker.
Finish with one recommendation (`deploy`, `revise`, `split`, `merge`,
`deprecate`, or `hold`) and supporting evidence/limitations.

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
