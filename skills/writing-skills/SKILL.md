---
name: writing-skills
description: Use when creating, editing, optimizing, testing, validating, or deploying Agent Skills/SKILL.md files, including activation boundaries, frontmatter, scope, progressive disclosure, supporting resources, evals, SKILL-specific validators, and deployment readiness.
---
<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->

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
└── evals/               # typical location for candidate behavioral evals
```

`SKILL.md` requires YAML frontmatter followed by Markdown.

This skill keeps its seeded behavioral eval library under `scripts/evals/` because it is packaged with the local deterministic harness. For other skills, use `evals/` unless the target repository documents a different location.

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

For every critical trigger, branch, or load condition, run QAQ/RMI:

1. Map a positive request to its governing instruction and behavior.
2. Verify that a near-miss does not activate it.
3. Reverse-map the behavior to the intended request class.
4. Revise indirect, ambiguous, or scope-inconsistent mappings.

### 2. Decide whether a skill is justified

Create a skill when it captures reusable domain knowledge, a repeatable technique, a meaningful workflow, a decision pattern, or authoritative reference material the agent would not reliably reproduce unaided.

Do not create a skill for:

- solutions intended for a single use only;
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

Keep activation-time guidance in `SKILL.md`. Move detailed methods/docs/examples to `references/`, deterministic operations to `scripts/`, static templates/assets to `assets/`, and evaluation cases/fixtures to `evals/` or a documented local eval location.

For this skill, the documented local eval location is `scripts/evals/` because those fixtures live beside the parser, validator, CLI, and test harness.

Use relative paths, state each resource's load/run condition, avoid deep reference chains, and split or extract material when `SKILL.md` approaches roughly 500 lines or 5,000 tokens.

### 7. Match instruction form to failure

Use the form that fits the observed failure:

- **Rule skipped under pressure** → explicit prohibition, red flag, or rationalization counter.
- **Output has the wrong shape** → positive output contract or template.
- **Required element is omitted** → required structural field or slot.
- **Behavior depends on a condition** → explicit conditional keyed to an observable predicate.

Do not add stronger wording by default; use test evidence.

#### Match the form to the failure — evidence and rules

The four bullets above are the summary; the rest of this step is the evidence behind each pairing and the rules that hold whichever form you pick. It does not override the bullets — still lead with test evidence, and still do not escalate wording by default.

Before writing guidance, classify the baseline failure. The form that bulletproofs one failure type measurably backfires on another.

| Baseline failure | Right form | Wrong form |
|---|---|---|
| Skips/violates a rule under pressure (knows better, does it anyway) | Prohibition + rationalization table + red flags | Soft guidance ("prefer...", "consider...") |
| Complies, but output has the wrong shape (bloated prompt, buried verdict, restated spec) | Positive recipe or contract: state what the output IS — its parts, in order | Prohibition list ("don't restate", "never narrate") |
| Omits a required element from something they already produce | Structural: REQUIRED field or slot in the template they fill in | Prose reminders near the template |
| Behavior should depend on a condition | Conditional keyed to an observable predicate ("if the brief exists, reference it") | Unconditional rule + exemption clauses |

**Why prohibitions backfire on shaping problems:** under a competing incentive ("make the prompt self-contained"), agents negotiate with "don't X". In head-to-head wording tests on dispatch-prompt guidance, the prohibition arm produced clearly more of the unwanted content than the recipe arm (fully separated distributions), and trended worse than even the no-guidance control — micro-test your own case rather than assuming, but never reach for the prohibition by default. A recipe leaves nothing to negotiate: the output matches the stated shape or it doesn't.

**Rules for whichever form you pick:**

- **No nuance clauses.** "Don't X unless it matters" reopens the negotiation — appending a single nuance clause to a winning recipe degraded it from consistent to noisy in the same wording tests. Express a real exception as its own conditional on an observable predicate.
- **Exemption clauses don't scope.** "This limit doesn't apply to code blocks" still suppresses code blocks. If part of the output must be exempt, restructure so the rule can't reach it.

### 8. Test

Select tests according to skill type and risk.

At minimum, cover positive activation, realistic near-misses, edge cases, regressions, referenced paths/files, scripts/tools when present, and safety/destructive operations when applicable.

For output-quality and behavioral eval design, load `references/evaluating-skill-output.md`. For Discipline pressure tests, classification-specific RED/GREEN/REFACTOR suites, reference retrieval/application checks, resource discovery, or regression evidence, load `references/testing-skills-with-subagents.md`. For this skill's deterministic parser, validator, prompt, and CLI tests, use `scripts/README.md`.

For trigger optimization, test multiple realistic phrasings.

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
7. If the target repository uses A Team skill registration, add it to `CLAUDE.md`, `AGENTS.md`, and `skills/using-a-team/SKILL.md`.
8. If the target runtime has another documented registration mechanism, follow that local policy instead.
9. Test it: give an agent a task that should trigger the skill, verify they use it correctly.

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

Use `references/index.md` as the **first lookup point** for the `writing-skills` reference set.

Keep detailed routing rules in `references/index.md`; it is the source of truth for reference load conditions and conflict handling.

At minimum:

- use `references/specification.md` for mandatory Agent Skills format/compliance claims;
- use `references/SKILL-testing-checklist.md` as the final validation/deployment gate;
- load only the specialist references selected by `references/index.md`.
