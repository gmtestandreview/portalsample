# Description Optimization for Skills

## Purpose

Use this reference when a skill should trigger more reliably, stop triggering on irrelevant tasks, or communicate its scope more clearly through the `description` field in `SKILL.md`.

The description is the activation contract: it tells the agent when to load the full skill. Optimize it for user intent, concrete trigger terms, and scope boundaries.

## Fast rules

A good skill description:

- Describes what the skill helps with **and** when to use it.
- Uses third person or imperative trigger phrasing.
- Includes concrete task verbs and domain terms.
- Names common user wording, file types, tools, or artifacts.
- Stays under 1024 characters.
- Avoids implementation details that belong in the body.
- Avoids broad phrases like “helps with files,” “best practices,” or “useful for many tasks.”

Prefer:

```yaml
description: Use when creating, editing, evaluating, optimizing, testing, or deploying Agent Skills/SKILL.md files; when refining skill descriptions, frontmatter, progressive disclosure, supporting files, scripts, references, examples, evals, or trigger behavior.
```

Avoid:

```yaml
description: Helps with skills
description: Explains how to write skills using TDD and progressive disclosure
description: I can help you make better SKILL.md files
```

## Optimization workflow

### 1. Identify the target behavior

Write three lists before editing:

```markdown
Should trigger:
- User asks to create a new SKILL.md
- User asks to improve skill frontmatter
- User asks why a skill is not activating

Should not trigger:
- User asks how to learn a general writing skill
- User asks to edit a normal Markdown article
- User asks to write code unrelated to skills

Ambiguous:
- User asks to “optimize this markdown”
- User asks to “improve this workflow doc”
```

Use the ambiguous list to decide whether the description needs narrower wording or “only when...” boundaries.

### 2. Extract trigger vocabulary

Look for terms users naturally say, not only internal implementation terms.

| Category | Examples |
|---|---|
| User intent | create, edit, audit, optimize, test, deploy, validate |
| Artifact names | `SKILL.md`, skill, agent skill, frontmatter, evals |
| Supporting files | scripts, references, assets, examples, templates |
| Failure symptoms | not triggering, over-triggering, ambiguous activation, stale description |
| Context | before deployment, during refactor, when merging skills |

### 3. Draft with this pattern

```yaml
description: Use when [task verbs + target artifact/domain]; when [specific contexts, symptoms, or edge cases].
```

Examples:

```yaml
description: Use when creating or editing Agent Skills/SKILL.md files, especially frontmatter, descriptions, triggers, supporting files, scripts, references, evals, or deployment validation.
```

```yaml
description: Use when troubleshooting skill activation, refining a skill description, writing trigger evals, reducing false positives, or clarifying when an Agent Skill should or should not load.
```

### 4. Remove body-only details

The description should not include the full workflow.

Move these to the body:

- Step-by-step instructions
- Long policy rationale
- Full examples
- Validation checklists
- Tool commands
- Testing methodology

Keep only what helps the agent decide whether to load the skill.

### 5. Check breadth

Ask two questions:

1. **False negatives:** Would the skill trigger when the user does not know the exact vocabulary?
2. **False positives:** Would it trigger for ordinary tasks outside the skill’s domain?

Tighten with domain terms when too broad:

```yaml
# Too broad
description: Use when optimizing descriptions, examples, and documentation.

# Better
description: Use when optimizing Agent Skill descriptions in SKILL.md frontmatter, especially trigger wording, false positives, false negatives, and activation evals.
```

Broaden with synonyms when too narrow:

```yaml
# Too narrow
description: Use when editing SKILL.md descriptions.

# Better
description: Use when editing Agent Skill descriptions, activation triggers, SKILL.md frontmatter, or eval queries for false positives and false negatives.
```

## Trigger evals

Create a small trigger eval set whenever activation is important.

```json
[
  {
    "query": "Can you improve this SKILL.md description so the skill triggers when users ask about evals?",
    "should_trigger": true
  },
  {
    "query": "This skill keeps loading when I ask for normal Markdown editing. Can you narrow it?",
    "should_trigger": true
  },
  {
    "query": "Please rewrite this blog post description to be punchier.",
    "should_trigger": false
  },
  {
    "query": "Create a validation checklist for a new Agent Skill before deployment.",
    "should_trigger": true
  },
  {
    "query": "What is a good project README structure?",
    "should_trigger": false
  }
]
```

Minimum useful set:

- 3 clear positives
- 3 clear negatives
- 2 ambiguous or near-miss prompts
- 1 user prompt that omits the exact domain term but should still trigger

## Diagnostic table

| Symptom | Likely cause | Fix |
|---|---|---|
| Skill does not load for relevant tasks | Missing user vocabulary | Add common verbs, artifacts, and synonyms |
| Skill loads too often | Description is too generic | Add domain boundaries and “Agent Skill/SKILL.md” terms |
| Skill loads for implementation-only tasks | Description names tools instead of intent | Lead with user goal; move tools to body |
| Agent skips reading the skill body | Description summarizes the whole workflow | Shorten description to trigger conditions only |
| Similar skills conflict | Descriptions overlap without boundaries | State distinct artifacts, phases, or domains |
| Description is hard to scan | Too many clauses | Split into “Use when…” plus “especially…” |

## Before and after examples

### Example 1: too vague

```yaml
description: Helps write better documentation.
```

Improved:

```yaml
description: Use when creating, editing, or validating Agent Skills/SKILL.md files, especially descriptions, activation triggers, frontmatter, examples, supporting references, scripts, or evals.
```

### Example 2: workflow stuffed into description

```yaml
description: Use when writing skills by first creating failing pressure tests, then writing the minimal skill, then refactoring it until tests pass.
```

Improved:

```yaml
description: Use when creating or testing Agent Skills that require pressure scenarios, rationalization checks, RED/GREEN/REFACTOR validation, or deployment readiness review.
```

### Example 3: too broad

```yaml
description: Use when improving prompts, descriptions, and instructions.
```

Improved:

```yaml
description: Use when improving Agent Skill descriptions in SKILL.md frontmatter so skill activation is accurate, specific, and resistant to false positives or false negatives.
```

## Final checklist

Before accepting a description:

- [ ] Valid YAML scalar
- [ ] Under 1024 characters
- [ ] No first-person phrasing
- [ ] Names the relevant artifact or domain
- [ ] Includes likely user verbs and synonyms
- [ ] Includes at least one context or failure symptom
- [ ] Does not encode the full workflow
- [ ] Does not overlap unnecessarily with nearby skills
- [ ] Positive and negative trigger evals are documented
- [ ] The description still matches the actual body of `SKILL.md`

## Definition of done

A description is optimized when relevant prompts reliably activate the skill, irrelevant prompts do not, and the wording remains short enough to scan in a large skill catalog.
