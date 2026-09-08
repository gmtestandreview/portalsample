---
name: writing-skills
description: Use when creating, editing, optimizing, testing, or validating Agent Skills/SKILL.md files, including activation descriptions, frontmatter, scope, workflows, supporting resources, evals, deterministic SKILL-specific validators, and deployment readiness.
---

# Writing Skills

## Core principle

Treat skill authoring as test-driven development for process documentation:

1. **RED** — observe a realistic failure without the skill.
2. **GREEN** — write the smallest guidance that prevents that failure.
3. **REFACTOR** — close loopholes, remove non-load-bearing content, and retest.

Do not invent requirements from hypothetical failures when representative testing is possible.

## When to use

Use this skill to:

- create a new `SKILL.md`;
- edit or optimize an existing Agent Skill;
- improve activation or description wording;
- include only essential information directly related to skill functionality in `SKILL.md`, while placing supplementary materials such as examples and references in supporting resources;
- add or revise tests, examples, references, scripts, or assets;
- create, maintain, or run deterministic validators for Agent Skill structure, frontmatter, paths, or other mechanical requirements;
- validate a skill before deployment.

Do not use it for:

- ordinary Markdown or prose editing unrelated to Agent Skills;
- one-off project instructions better kept in project-level guidance;
- generic validators or linters unrelated to Agent Skills;
- agent-role definitions rather than reusable skills.

## Required shape

A skill directory contains at least `SKILL.md` and may contain supporting resources:

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

Apply the current Agent Skills specification for mandatory constraints. At minimum:

- `name` is 1–64 characters, lowercase letters/numbers/hyphens only, with no leading, trailing, or consecutive hyphens;
- `name` matches the parent skill-directory name;
- `description` is non-empty, at most 1024 characters, and states both what the skill does and when to use it.

Treat client- or project-specific naming, registration, and directory conventions as local policy, not universal specification requirements.

## Authoring workflow

### 1. Define activation boundaries

Write three sets before drafting:

- **Should trigger** — realistic requests the skill must handle.
- **Should not trigger** — near-misses with overlapping vocabulary.
- **Ambiguous** — requests that expose unclear scope.

For each critical boundary, run QAQ/RMI:

1. Map a positive request to the governing instruction and expected behavior.
2. Verify a near-miss does not activate the same behavior.
3. Reverse-map the expected behavior to the intended request class.
4. Revise any trigger or instruction that does not map directly and unambiguously.

### 2. Establish RED evidence

For a new skill or meaningful behavioral change:

1. Run at least one representative task without the candidate skill.
2. Capture the failure, skipped step, ambiguity, or inefficiency.
3. Record the agent's rationale verbatim when rationalization matters.
4. Map each observed failure to a specific missing or weak instruction.

For discipline-enforcing skills, use combined pressure such as time, sunk cost, authority, fatigue, or speed bias.

If baseline execution is unavailable, mark RED evidence `Needs Human Review`; do not claim it passed.

### 3. Write the minimal GREEN guidance

Add only guidance required to prevent observed or specification-mandated failures.

Prefer:

- explicit triggers and non-triggers;
- atomic actions and decision criteria;
- one clear default when several approaches are possible;
- concrete failure → correction pairs;
- measurable completion criteria.

Avoid generic advice the base agent already knows.

For deterministic SKILL-specific checks:

- prefer a script or validator when the requirement is mechanically decidable;
- keep the validator's pass/fail rule aligned with the current specification or explicit local policy;
- distinguish specification failures from local-policy failures;
- run the validator after relevant edits when tooling is available;
- if the validator cannot be run, mark that check `Needs Human Review` rather than simulating success.

### 4. Apply progressive disclosure

Keep activation-time guidance in `SKILL.md`. Move optional or heavy material out:

| Content | Preferred location |
|---|---|
| Core triggers, workflow, validation | `SKILL.md` |
| Detailed methodology or domain docs | `references/` |
| Reusable deterministic operations | `scripts/` |
| Templates, images, static resources | `assets/` |
| Evaluation cases and fixtures | `evals/` |

Reference supporting files with relative paths and state when to load or run them.

### 5. REFACTOR against observed behavior

After GREEN behavior:

- remove duplicated or ignored content when it is not load-bearing;
- close new rationalizations with the smallest explicit counter;
- tighten ambiguous steps;
- preserve unique domain knowledge and edge cases;
- split or extract material when the main file approaches roughly 500 lines or 5,000 tokens.

Do not remove content only because it is long; remove or relocate it when execution evidence shows it is unnecessary at activation time.

### 6. Validate

Before deployment, verify:

- frontmatter parses, preferably through a deterministic parser or validator;
- mandatory specification constraints pass;
- activation positives and near-misses are tested;
- the original RED failure is prevented;
- previously fixed failures do not regress;
- referenced files and paths exist;
- scripts or commands are run in a representative environment or marked unvalidated;
- destructive or high-impact changes require authorization, backup/snapshot where practical, validation, and rollback;
- known limitations and `Needs Human Review` items are explicit.

Do not claim tests or deployment readiness without fresh evidence after the last meaningful edit.

## Common mistakes

| Failure | Correction |
|---|---|
| Drafting before observing a baseline failure | Run RED first when representative execution is available |
| Description only names one narrow use case | Include actual user intents and artifacts covered by the body |
| Description explains the whole workflow | Keep workflow details in the body |
| No negative activation boundary | Add realistic near-misses |
| Vague steps such as “review” or “verify” | State the action, criterion, and expected evidence |
| Long optional material lives in `SKILL.md` | Move it to a referenced resource with a load condition |
| Client-specific convention is presented as universal | Label it as project/runtime policy |
| Registration is assumed for every harness | Apply only the target environment's documented discovery/registration process |
| Mechanical requirements are judged only by prose inspection | Use or maintain a deterministic SKILL-specific validator when the rule is mechanically decidable |
| Tests are described but never run | Mark them `Needs Human Review` instead of claiming success |

## Integration

After authoring, use the target agent's documented skill-discovery or registration mechanism.

For an A Team repository, update `CLAUDE.md`, `AGENTS.md`, or `skills/using-a-team/SKILL.md` only when those files exist and the repository's documented workflow requires those registrations. Verify paths before editing and preserve existing entries.

A skill is ready to deploy only when required specification checks pass and representative activation/behavior tests support the intended scope.
