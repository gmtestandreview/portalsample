---
name: writing-skills
description: Use when creating, editing, optimizing, testing, validating, or deploying Agent Skills/SKILL.md files, including activation boundaries, frontmatter, scope, progressive disclosure, supporting resources, evals, SKILL-specific validators, and deployment readiness.
---

# Writing Skills

Treat skill authoring as test-driven development for process documentation:

1. **RED** — observe a representative failure, ambiguity, or missing context without the candidate skill.
2. **GREEN** — add the smallest guidance that prevents the failure or satisfies a mandatory requirement.
3. **REFACTOR** — close loopholes, remove non-load-bearing content, and retest.

Do not invent requirements from hypothetical failures when representative evidence is available.

## Scope

Use this skill to create or scaffold, edit, optimize, test, validate, or deploy Agent Skills; improve activation, frontmatter, scope, workflows, and progressive disclosure; organize supporting resources; and maintain SKILL-specific evals or deterministic validators.

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

Treat runtime-, client-, repository-, or checklist-specific paths, registration rules, validators, naming preferences, and packaging limits as local policy unless the current specification makes them mandatory. Report spec failures separately from local-policy failures.

## Authoring workflow

### 1. Define activation boundaries

Before drafting, record:

- **Should trigger** — realistic requests the skill must handle.
- **Should not trigger** — near-misses with overlapping vocabulary.
- **Ambiguous** — requests that expose unclear scope.

For every critical trigger, branch, or load condition, run QAQ/RMI:

1. Map a positive request to its governing instruction and expected behavior.
2. Verify a near-miss does not activate that behavior.
3. Reverse-map the behavior to the intended request class.
4. Revise any trigger, branch, or instruction whose mapping is indirect, ambiguous, or scope-inconsistent.

### 2. Decide whether a skill is justified

Create a skill when it captures reusable domain knowledge, a repeatable technique, a meaningful workflow, a decision pattern, or authoritative reference material the agent would not reliably reproduce unaided.

Do not create a skill for:

- one-off solutions;
- project-only conventions better kept in project instructions;
- generic background knowledge;
- purely mechanical rules better enforced deterministically.

### 3. Classify the skill

Choose the narrowest type that explains its primary reusable value:

- **Discipline** — broad practice with multiple decisions or quality gates; emphasize pressure and adherence tests.
- **Technique** — bounded repeatable method; emphasize application and edge cases.
- **Pattern** — reusable decision structure; emphasize recognition and counterexamples.
- **Reference** — authoritative knowledge; emphasize retrieval, coverage, and correct application.
- **Hybrid** — use only when one category would materially misrepresent the skill.

### 4. Establish RED evidence

For a new skill or meaningful behavioral change, run at least one representative task without the candidate when possible.

Capture the failure, skipped step, ambiguity, inefficiency, or rationalization. Map each observed failure to a specific missing or weak instruction.

For Discipline skills, combine pressures such as time, sunk cost, authority, fatigue, confidence, or speed bias. If baseline execution is unavailable, mark RED evidence `Needs Human Review`; do not claim it passed.

### 5. Write minimal GREEN guidance

Add only guidance required to prevent observed failures or satisfy mandatory requirements.

Prefer:

- explicit triggers and non-triggers;
- atomic actions and observable decision criteria;
- one clear default when several approaches are safe;
- concrete failure → correction pairs;
- measurable completion criteria.

Avoid generic advice the base agent already knows.

For mechanically decidable SKILL-specific checks:

- prefer a deterministic script or validator;
- align pass/fail rules with the current specification or explicit local policy;
- distinguish specification failures from local-policy failures;
- run the validator after relevant edits when tooling is available;
- otherwise mark the check `Needs Human Review`.

### 6. Apply progressive disclosure

Keep activation-time guidance in `SKILL.md`.

| Content | Preferred location |
|---|---|
| Core triggers, workflow, decisions, validation | `SKILL.md` |
| Detailed methodology or domain documentation | `references/` |
| Reusable deterministic operations | `scripts/` |
| Templates, images, static resources | `assets/` |
| Evaluation cases and fixtures | `evals/` |

Use relative paths, state each resource's load or run condition, avoid deep reference chains, and split or extract material when the main file approaches roughly 500 lines or 5,000 tokens.

### 7. Match instruction form to the failure

Use the form that fits the observed failure:

- **Rule skipped under pressure** → explicit prohibition, red flag, or rationalization counter.
- **Output has the wrong shape** → positive output contract or template.
- **Required element is omitted** → required structural field or slot.
- **Behavior depends on a condition** → explicit conditional keyed to an observable predicate.

Do not add stronger wording by default; justify specificity with test evidence and risk.

### 8. REFACTOR against observed behavior

After GREEN behavior:

- remove duplicated or ignored content only when it is not load-bearing;
- close new rationalizations with the smallest explicit counter;
- tighten ambiguous steps;
- preserve unique domain knowledge, trigger boundaries, safety rules, and edge cases;
- relocate long optional material instead of deleting it solely for length.

### 9. Test

Select tests according to skill type and risk.

At minimum, cover:

- positive activation;
- realistic near-misses;
- edge cases;
- regressions after meaningful edits;
- referenced paths and files;
- scripts or tools when present;
- safety and destructive operations when applicable.

For Discipline skills, add adversarial pressure tests. When detailed scenario design is needed, load `testing-skills-with-subagents.md`. For activation problems, test multiple realistic phrasings and false-positive/false-negative boundaries.

### 10. Validate

Before deployment, verify:

- YAML frontmatter parses;
- mandatory specification constraints pass;
- description matches actual scope;
- positive and near-miss activation cases are tested;
- the original RED failure is prevented when RED evidence exists;
- fixed failures do not regress;
- referenced files and paths exist;
- scripts or commands were run in a representative environment or are marked unvalidated;
- destructive or high-impact changes require authorization, backup or snapshot where practical, validation, and rollback;
- known limitations and `Needs Human Review` items are explicit.

Run `SKILL-testing-checklist.md` for final validation when it is part of the skill library. Treat checklist-only requirements as local policy when they exceed the current specification. Do not claim tests or deployment readiness without fresh evidence after the last meaningful edit.

## Scaffolding a new skill

When creating a new skill:

1. Choose a lowercase hyphenated directory name that matches `name`.
2. Create `SKILL.md`.
3. Write a concise description focused on user intent and trigger conditions.
4. Add only supporting directories the skill actually needs.
5. Add representative evals before expanding documentation.
6. Validate structure and behavior before deployment.

Do not assume a repository path, registration mechanism, quoting style, asset-size limit, validator command, or client convention unless the target environment documents it.

## Common failures

| Failure | Correction |
|---|---|
| Drafting before observing a baseline failure | Run RED when representative execution is available |
| Vague or workflow-stuffed description | Focus on concrete intent, artifacts, and activation boundaries |
| No negative activation boundary | Add realistic near-misses |
| Generic-knowledge draft | Ground it in real tasks, artifacts, corrections, or observed failures |
| Vague steps such as “review” or “verify” | State the action, criterion, and expected evidence |
| Long optional material lives in `SKILL.md` | Relocate it behind an explicit load condition |
| Mechanical requirements are judged only by prose | Use deterministic SKILL-specific validation when mechanically decidable |
| Client convention is presented as universal | Label it project/runtime policy |
| Tests, paths, or tools are assumed | Verify them or mark `Needs Human Review` |
| Registration is assumed for every harness | Use only the target environment's documented discovery or registration process |

## Integration

After authoring, use the target agent's documented skill-discovery or registration mechanism. Verify any required registration files and paths before editing them; preserve existing entries.

A skill is ready to deploy only when required specification checks pass and representative activation and behavior tests support the intended scope.

## References

When this skill is packaged with the accompanying reference set, use `index.md` as the first lookup point and load only the smallest relevant reference set for the task.
