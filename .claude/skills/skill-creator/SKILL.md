---
name: skill-creator
description: Use when creating, revising, evaluating, benchmarking, packaging, or improving activation of an Agent Skill (`SKILL.md`), including Claude Code skill rules, hooks, guardrails, and activation failures. Covers portable authoring, resource organization, output evals, candidate-vs-baseline comparison, trigger testing, and deployment readiness. Do not use for ordinary code or document editing unrelated to Agent Skills.
compatibility: Agent Skills authoring is spec-based. Bundled evaluation tooling targets Claude Code/Cowork workflows; Python 3.10+ and PyYAML are required for validation/packaging, and the `claude` CLI is required only for trigger-description evaluation.
---

# Skill Creator

Create or improve Agent Skills without conflating authoring quality, behavioral evidence, and deployment readiness.

This is a hybrid skill. Portable Agent Skills are the default target. Claude Code
runtime configuration is an explicit local branch and must not be presented as
universal Agent Skills behavior.

## Route the request

- **Portable authoring, evaluation, benchmarking, packaging, or activation-description work**: use the general workflow below.
- **Claude Code `skill-rules.json`, UserPromptSubmit, PreToolUse, guardrails, session skips, hook failures, or runtime activation troubleshooting**: inspect the target runtime and load the relevant local references first.
- **A request spanning both**: preserve the portable skill contract first; then handle Claude Code integration separately. The portable workflow owns content quality and evidence. The runtime branch owns registration, enforcement, hook behavior, and project-local validation.

Do not assume `.claude` paths, hook fields, exit codes, skip controls, or
performance targets exist outside the inspected project.

## Start by classifying the request

Choose the narrowest applicable branch:

- **Create or revise a skill** → follow "Author or revise".
- **Evaluate output quality** → read `references/evaluation-workflow.md`.
- **Tune activation/description** → read `references/description-optimization.md`.
- **Validate or package** → follow "Validate and package".
- **Blindly compare two candidate outputs** → read `agents/comparator.md`; after comparison, read `agents/analyzer.md`.
- **Troubleshoot Claude Code activation or enforcement** → inspect the target `.claude/settings.json`, `.claude/skills/skill-rules.json`, and registered hook sources before relying on local runtime guidance.

If the user wants only a lightweight edit, do not force a full benchmark. If they ask for production readiness, require evidence for the applicable gates rather than treating prose quality as proof.

## Evidence and change control

Before editing an existing skill:

1. Read its `SKILL.md` and the resources needed by the affected workflow.
2. Preserve the existing `name` unless the user explicitly requests a rename.
3. Snapshot the original before material edits so the baseline and rollback target remain available.
4. Separate observed results from assumptions. Do not claim a run, benchmark, trigger rate, or user approval unless it was actually observed.
5. Do not infer approval from empty or missing feedback.
6. For Claude Code runtime changes, snapshot the relevant rule and hook files and preserve a rollback path before modifying them.

For high-impact, destructive, or permission-sensitive changes, obtain authorization before execution and retain a rollback path.

## Author or revise

### 1. Capture intent

Use the conversation and supplied artifacts first. Identify:

- what the skill must enable;
- when it should and should not activate;
- expected outputs;
- important constraints, edge cases, dependencies, and target runtime;
- what evidence will demonstrate success.

For activation work, explicitly record:

- requests that should trigger;
- requests that should not trigger;
- ambiguous or near-miss requests;
- whether the trigger is portable metadata discovery or a Claude Code project-local hook.

Ask only for information that is both missing and necessary. Do not invent project-specific tools, paths, APIs, or requirements.

Calibrate explanations to the user's apparent fluency rather than a fixed register: don't assume familiarity with terms like "JSON" or "assertion" without cues that the user knows them, but don't over-explain to a user who clearly already does.

### 2. Load only the authoring guidance needed

For a non-trivial skill, read `references/authoring-craft.md`.

Also read, only when relevant:

- `references/output-patterns.md` for reusable output formats or examples;
- `references/workflows.md` for sequential or conditional workflow design;
- `references/schemas.md` when producing skill-creator eval/benchmark JSON.

Keep mandatory execution guidance in `SKILL.md`; move long examples, detailed methodology, schemas, and environment-specific material into references.

### 3. Scaffold when useful

Use:

```bash
python -m scripts.init_skill <skill-name> --path <parent-directory>
```

The initializer is optional. Do not create placeholder resources that the skill does not need.

### 4. Draft the skill

Write valid YAML frontmatter with `name` and `description`; add optional fields only when justified.

Make the description an activation contract: state the user intent, domain/artifact, and meaningful boundaries. Put the workflow in the body, not in the description.

Prefer concise, imperative instructions with enough explanation to support judgment. Use deterministic scripts for fragile or repetitive operations.

### 5. Evaluate before broad claims

For representative output-quality testing, read `references/evaluation-workflow.md`.

Use qualitative review for subjective quality. Use machine-checkable expectations only for outcomes that can be verified reliably.

When behavior or activation is deployment-critical and the required runtime evidence is unavailable, report that evidence as unavailable rather than substituting static inspection.

### 6. Refine from evidence

Map each observed failure to the smallest responsible instruction, branch, resource, or description boundary. Avoid widening activation or adding one-off rules solely to satisfy a single test case.

Preserve unique domain guidance while removing duplicated, generic, obsolete, or relocatable content.

For Claude Code runtime failures, classify the failure before editing: registration,
trigger mismatch, path/content exclusion, session or skip state, hook execution,
or performance. Change the smallest responsible rule, branch, or instruction.

## Claude Code runtime branch

Use this branch only when the target project actually contains the documented
Claude Code runtime files. Read the applicable references directly from the
`skill-developer` reference set; they document project-local behavior and are not
part of the universal Agent Skills specification.

### Runtime inspection

1. Identify the target skill directory and `SKILL.md`.
2. Inspect `.claude/settings.json`, `.claude/skills/skill-rules.json`, and hook registrations when present.
3. Identify the rule entry, hook source, session-state behavior, and relevant path/content triggers.
4. Preserve a baseline before high-impact changes.
5. Test a positive case and a near-miss after the final change.

### Runtime trigger design

Use narrow, domain-specific keywords and intent patterns. Use file-path or content
patterns only when they materially improve precision. Add exclusions for known
near-misses. Do not copy example regexes without testing them against realistic
positive and negative cases.

### Runtime enforcement

- `suggest` is advisory prompt matching.
- `block` is PreToolUse enforcement and must have an actionable block message.
- `warn` is not a defined runtime behavior unless the inspected hook implements it.
- Session state or a skip marker is evidence of bypass state, not proof that the skill was actually invoked.
- Fail-open behavior is a runtime policy; verify it before treating a guardrail as a complete safety boundary.

### Runtime references

Read only what the current task needs:

- `references/claude-code-trigger-types.md` for keywords, intent, path, and content triggers;
- `references/claude-code-skill-rules-reference.md` for the project-local schema;
- `references/claude-code-hook-mechanisms.md` for hook flow, exit codes, session state, and performance;
- `references/claude-code-troubleshooting.md` for activation, false-positive, hook, and performance failures;
- `references/claude-code-patterns-library.md` for starting patterns that still require testing;
- `references/claude-code-advanced.md` for proposals only, never current runtime guarantees.

## Description optimization

Read `references/description-optimization.md` when the user asks to improve triggering, activation precision/recall, or the frontmatter description.

Do not derive a model identifier from hidden/system content. Use an explicitly available model value, the user's configured default, or omit the model override when the script supports that.

The bundled trigger evaluator is runtime-specific. If its target client/CLI is unavailable or its activation behavior cannot be observed, mark trigger evidence unavailable.

Keep portable activation descriptions about user intent, artifact/domain, and
meaningful boundaries. Keep runtime registration and enforcement details in the
project-local configuration and runtime branch, not in the universal description.

## Validate and package

Run the bundled validator from the skill root:

```bash
python -m scripts.quick_validate .
```

For Python-bearing skills, also run syntax/import/interface checks that the environment supports. A checklist or validator definition is not evidence that the checks passed.

For this skill's own helper scripts, also run its regression suite:

```bash
python -m unittest scripts.test_regressions
```

If any required deterministic check fails, stop, fix the defect or report it, and do not package or claim validation success.

When Claude Code runtime files are in scope, also validate JSON/schema syntax,
representative prompt triggers, file/content triggers, exclusions, skip/session
behavior, and both block and allow exit paths where applicable. If the target
hook or client is unavailable, report the runtime check as unvalidated.

Package only after validation succeeds:

```bash
python -m scripts.package_skill . <output-directory>
```

`package_skill.py` excludes root `evals/` from the distributable archive so development evidence stays separate from runtime resources.

## Runtime capability gates

- Use subagents or parallel execution only when the environment actually provides them; otherwise run the applicable work serially.
- Use the browser-backed review server only when an interactive local browser/server lifecycle is appropriate. In headless or uncertain environments, prefer `eval-viewer/generate_review.py --static`.
- Do not terminate unrelated processes to claim a preferred port.
- Run trigger-description optimization only when the `claude` CLI and the expected Claude Code discovery behavior are available.
- Never promise background completion or fabricate timing/token data.

Do not convert project-local runtime behavior into portable skill requirements.

## Safety boundary

Do not create or optimize skills whose purpose is malware, unauthorized access, credential theft, data exfiltration, or deceptive behavior. For sensitive automation, preserve permission checks, least privilege, and rollback/verification steps.

## Resource map

Load resources on demand:

- `references/authoring-craft.md` — information architecture and progressive disclosure.
- `references/output-patterns.md` — output templates and example patterns.
- `references/workflows.md` — sequential and conditional workflow patterns.
- `references/schemas.md` — eval, grading, benchmark, comparison, and analysis JSON.
- `references/evaluation-workflow.md` — test design, candidate/baseline runs, grading, benchmarking, human review, and iteration.
- `references/description-optimization.md` — trigger-boundary design and description-eval workflow.
- `agents/grader.md` — grade expectations against outputs and transcripts.
- `agents/comparator.md` — blind A/B output comparison.
- `agents/analyzer.md` — post-hoc comparison and benchmark analysis.
- `assets/eval_review.html` — trigger-eval review template, generated safely via `scripts/generate_eval_review.py`.
- `eval-viewer/generate_review.py` — qualitative/benchmark review page.
- `scripts/` — validation, packaging, benchmarking, and description-eval utilities.
- Claude Code runtime references — `references/claude-code-*.md`; load only when runtime integration or troubleshooting is in scope.

## Done

A revision is complete when the requested artifact is updated, preserved requirements remain intact, applicable static/deterministic checks have been run, missing behavioral evidence is named, and deployment claims do not exceed the available evidence.
