---
name: writing-skills
description: Use when creating, editing, optimizing, testing, validating, or deploying Agent Skills/SKILL.md files, including activation boundaries, frontmatter, scope, progressive disclosure, supporting resources, evals, SKILL-specific validators, and deployment readiness.
---

# Writing Skills

Treat skill authoring as test-driven development for process documentation:

1. **RED** — observe a representative failure or missing context without the candidate skill.
2. **GREEN** — add the smallest guidance that prevents the failure or satisfies a mandatory requirement.
3. **REFACTOR** — close loopholes, remove non-load-bearing content, and retest.

Do not invent requirements from hypothetical failures when representative evidence is available.

## Scope

Use this skill to create/scaffold, edit, optimize, test, validate, or deploy Agent Skills; improve activation/frontmatter/scope; organize supporting resources; and maintain SKILL-specific evals or validators.

Do not use it for ordinary Markdown editing, one-off project instructions, generic linters, or agent-role definitions.

## Required shape

A skill is a directory containing `SKILL.md` plus optional supporting resources:

```text
skill-name/
├── SKILL.md
├── scripts/
├── references/
├── assets/
└── evals/
```

`SKILL.md` requires YAML frontmatter followed by Markdown.

Required frontmatter:

```yaml
---
name: skill-name
description: Use when ...
---
```

Apply the current Agent Skills specification. At minimum:

- `name` is 1–64 characters, uses lowercase letters, numbers, and hyphens only, has no leading, trailing, or consecutive hyphens, and matches the parent directory name;
- `description` is non-empty, at most 1024 characters, and states what the skill does and when to use it;
- optional fields are limited to those supported by the current specification.

Treat runtime-, client-, or repository-specific paths, registration rules, validators, naming preferences, and packaging limits as local policy unless the current specification makes them mandatory.

## Authoring workflow

### 1. Define the skill boundary

Before drafting, record **Should trigger**, **Should not trigger**, and **Ambiguous** requests.

For every critical trigger, branch, or load condition, run QAQ/RMI: map a positive request to its governing instruction and behavior; verify a near-miss does not activate it; reverse-map the behavior to the intended request class; revise indirect, ambiguous, or scope-inconsistent mappings.

### 2. Decide whether a skill is justified

Create a skill when it captures reusable domain knowledge, a repeatable technique, a meaningful workflow, a decision pattern, or authoritative reference material the agent would not reliably reproduce unaided.

Do not create a skill for:

- one-off solutions;
- project-only conventions better kept in project instructions;
- generic background knowledge;
- purely mechanical rules better enforced deterministically.

### 3. Classify the skill

Choose the narrowest type that explains its primary reusable value:

- **Discipline** — broad practice with multiple decisions/gates; pressure-test it.
- **Technique** — bounded repeatable method; test application and edges.
- **Pattern** — reusable decision structure; test recognition and counterexamples.
- **Reference** — authoritative knowledge; test retrieval, coverage, and application.
- **Hybrid** — use only when one category would materially misrepresent the skill.

### 4. Establish RED evidence

For a new skill or meaningful behavioral change, run a representative task without the candidate when possible; capture the failure/ambiguity/inefficiency; record rationalizations when relevant; and map each failure to a missing or weak instruction.

For Discipline skills, combine pressures such as time, sunk cost, authority, fatigue, confidence, or speed bias. If baseline execution is unavailable, mark RED evidence `Needs Human Review`.

### 5. Write minimal GREEN guidance

Add only guidance required to prevent observed failures or satisfy mandatory requirements. Prefer explicit triggers/non-triggers, atomic actions, observable criteria, one clear default, failure→correction pairs, and measurable completion criteria. Avoid generic advice.

For mechanically decidable SKILL-specific checks, prefer deterministic validation; align rules with the current specification or explicit local policy; separate spec failures from local-policy failures; run the validator when available or mark `Needs Human Review`.

### 6. Apply progressive disclosure

Keep activation-time guidance in `SKILL.md`. Move detailed methods/docs/examples to `references/`, deterministic operations to `scripts/`, static templates/assets to `assets/`, and evaluation cases/fixtures to `evals/`.

Use relative paths, state each resource's load/run condition, avoid deep reference chains, and split or extract material when `SKILL.md` approaches roughly 500 lines or 5,000 tokens.

### 7. Match instruction form to failure

Use the form that fits the observed failure:

- **Rule skipped under pressure** → explicit prohibition, red flag, or rationalization counter.
- **Output has the wrong shape** → positive output contract or template.
- **Required element is omitted** → required structural field or slot.
- **Behavior depends on a condition** → explicit conditional keyed to an observable predicate.

Do not add stronger wording by default; use test evidence.

### 8. Test

Select tests according to skill type and risk.

At minimum, cover positive activation, realistic near-misses, edge cases, regressions, referenced paths/files, scripts/tools when present, and safety/destructive operations when applicable.

For Discipline skills, add adversarial pressure tests; load `testing-skills-with-subagents.md` when detailed scenario design is needed. For trigger optimization, test multiple realistic phrasings.

### 9. Validate

Before deployment, verify:

- YAML frontmatter parses;
- mandatory specification constraints pass;
- description matches actual scope;
- positive and near-miss activation cases are tested;
- the original RED failure is prevented when RED evidence exists;
- fixed failures do not regress;
- referenced files and paths exist;
- scripts/commands were run in a representative environment or are marked unvalidated;
- destructive or high-impact changes require authorization, backup/snapshot where practical, validation, and rollback;
- known limitations and `Needs Human Review` items are explicit.

Run `SKILL-testing-checklist.md` for final validation. Treat checklist-only requirements as local policy when they exceed the current specification.

## Scaffolding a new skill

When creating a new skill:

1. Choose a lowercase hyphenated directory name that matches `name`.
2. Create `SKILL.md`.
3. Write a concise description focused on user intent and trigger conditions.
4. Add only supporting directories the skill actually needs.
5. Add representative evals before expanding documentation.
6. Validate structure and behavior before deployment.
7. Add it to `CLAUDE.md` skills table
8. Add it to `AGENTS.md` skills table
9. Add it to `skills/using-a-team/SKILL.md` trigger table
10. Test it: give an agent a task that should trigger the skill, verify they use it correctly

Do not assume a particular repository path, runtime registration mechanism, quoting style, asset-size limit, or validator command unless the target environment documents it.

## Common failures

Correct these patterns:

- vague or workflow-stuffed descriptions → focus on concrete intent, artifacts, and boundaries;
- generic-knowledge drafts → ground them in real tasks, artifacts, or observed failures;
- bloated activation context → relocate optional detail behind explicit load conditions;
- prose-only mechanical rules → use deterministic SKILL-specific validation;
- client conventions presented as universal → label them local policy;
- unrun tests, assumed paths, or assumed tools → mark `Needs Human Review` or unvalidated.

## References

Load only when needed:

- `anthropic-best-practices.md` — Anthropic-specific authoring guidance or rationale.
- `testing-skills-with-subagents.md` — adversarial pressure testing and rationalization capture.
- `persuasion-principles.md` — wording support for Discipline rules; use only when test evidence shows compliance pressure is the problem.
- `CLAUDE_MD_TESTING.md` — worked examples of skill-discovery pressure tests.
- `SKILL-testing-checklist.md` — final validation and deployment gate.
