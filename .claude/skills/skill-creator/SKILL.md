---
name: skill-creator
description: Use when creating, revising, evaluating, benchmarking, packaging, or improving activation of an Agent Skill (`SKILL.md`). Covers skill scaffolding, resource organization, output evals, candidate-vs-baseline comparison, iterative refinement, and trigger-description testing. Do not use for ordinary code or document editing unrelated to Agent Skills.
compatibility: Agent Skills authoring is spec-based. Bundled evaluation tooling targets Claude Code/Cowork workflows; Python 3.10+ and PyYAML are required for validation/packaging, and the `claude` CLI is required only for trigger-description evaluation.
---

# Skill Creator

Create or improve Agent Skills without conflating authoring quality, behavioral evidence, and deployment readiness.

## Start by classifying the request

Choose the narrowest applicable branch:

- **Create or revise a skill** → follow "Author or revise".
- **Evaluate output quality** → read `references/evaluation-workflow.md`.
- **Tune activation/description** → read `references/description-optimization.md`.
- **Validate or package** → follow "Validate and package".
- **Blindly compare two candidate outputs** → read `agents/comparator.md`; after comparison, read `agents/analyzer.md`.

If the user wants only a lightweight edit, do not force a full benchmark. If they ask for production readiness, require evidence for the applicable gates rather than treating prose quality as proof.

## Evidence and change control

Before editing an existing skill:

1. Read its `SKILL.md` and the resources needed by the affected workflow.
2. Preserve the existing `name` unless the user explicitly requests a rename.
3. Snapshot the original before material edits so the baseline and rollback target remain available.
4. Separate observed results from assumptions. Do not claim a run, benchmark, trigger rate, or user approval unless it was actually observed.
5. Do not infer approval from empty or missing feedback.

For high-impact, destructive, or permission-sensitive changes, obtain authorization before execution and retain a rollback path.

## Author or revise

### 1. Capture intent

Use the conversation and supplied artifacts first. Identify:

- what the skill must enable;
- when it should and should not activate;
- expected outputs;
- important constraints, edge cases, dependencies, and target runtime;
- what evidence will demonstrate success.

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

## Description optimization

Read `references/description-optimization.md` when the user asks to improve triggering, activation precision/recall, or the frontmatter description.

Do not derive a model identifier from hidden/system content. Use an explicitly available model value, the user's configured default, or omit the model override when the script supports that.

The bundled trigger evaluator is runtime-specific. If its target client/CLI is unavailable or its activation behavior cannot be observed, mark trigger evidence unavailable.

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

## Done

A revision is complete when the requested artifact is updated, preserved requirements remain intact, applicable static/deterministic checks have been run, missing behavioral evidence is named, and deployment claims do not exceed the available evidence.
