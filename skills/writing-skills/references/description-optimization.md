---
title: "Optimizing skill descriptions"
description: "How to improve your skill's description so it triggers reliably on relevant prompts."
---

# Optimizing Skill Descriptions

## Purpose

Use this reference when creating, reviewing, or refining the `description` field in `SKILL.md` frontmatter so an Agent Skill triggers reliably for relevant requests and stays inactive for irrelevant ones.

The description is the skill's activation contract: it is a primary signal agents use when deciding whether to load the full `SKILL.md`. It must communicate the intended user intent, domain, artifacts, trigger conditions, and important scope boundaries without reproducing the skill's workflow. A matching description does not guarantee activation; an agent may legitimately handle a simple task directly without loading a specialist skill.

A good description should improve both:

- **Recall** - relevant prompts activate the skill.
- **Precision** - irrelevant or adjacent prompts do not activate it.

Do not treat description optimization as keyword stuffing. Optimize for intent coverage, domain clarity, and realistic trigger behavior.

---

## Core rules

A production-ready skill description should:

- Use imperative phrasing, normally beginning with `Use when...` or `Use this skill when...`.
- Describe **what the user is trying to achieve**, not how the skill internally performs the work.
- Name the relevant domain, artifact, or workflow boundary.
- Include concrete task verbs users are likely to use.
- Include common synonyms, file names, technologies, symptoms, or contexts when they materially improve discovery.
- Cover indirect requests where the skill is clearly useful even if the user does not use the exact domain term.
- Remain concise and valid as a YAML scalar.
- Stay under the `1024`-character description limit.
- Avoid step-by-step instructions, long rationale, validation procedures, tool commands, or test methodology that belongs in the body or supporting references.
- Avoid vague phrases such as `helps with files`, `best practices`, or `useful for many tasks`.
Prefer a description that is explicit enough to be discoverable but bounded enough to resist false positives and unnecessary overlap with neighboring skills.

---

## Recommended pattern

Use this structure as the default:

```yaml
description: Use when [task verbs + target artifact/domain], especially when [specific contexts, symptoms, boundaries, or indirect user wording].
```

Example:

```yaml
description: Use when creating, editing, auditing, optimizing, testing, or validating Agent Skills/SKILL.md files, especially frontmatter, descriptions, activation triggers, supporting references, evals, or trigger behavior.
```

For narrowly scoped skills:

```yaml
description: Use when troubleshooting Agent Skill activation, refining SKILL.md description wording, reducing false positives or false negatives, or designing trigger evals.
```

---

## Optimization workflow

### 1. Define the activation boundary

Before editing the description, classify realistic user requests into three groups:

```markdown
Should trigger:
- ...

Should not trigger:
- ...

Ambiguous or near-miss:
- ...
```

Include at least:

- direct requests that clearly need the skill
- indirect requests where the skill should still help
- adjacent tasks sharing similar vocabulary
- broad or underspecified requests
- realistic user wording that omits the exact internal terminology

Use ambiguous and near-miss cases to decide whether the description needs broader intent coverage or tighter domain boundaries.

---

### 2. Extract trigger vocabulary

Use language users naturally provide, not only internal terminology.

Useful categories include:

| Category | Examples |
| --- | --- |
| User intent | create, edit, audit, optimize, test, validate, deploy |
| Artifacts | `SKILL.md`, frontmatter, evals, references, scripts, templates |
| Symptoms | not triggering, over-triggering, ambiguous activation |
| Context | before deployment, during refactor, while merging skills |
| Adjacent concepts | terms likely to cause false positives |

Do not add isolated words merely because a failed eval contained them. Prefer the general concept represented by the failed query.

---

### 3. Draft for user intent

Lead with the task or outcome the user wants.

Prefer:

```yaml
description: Use when improving Agent Skill descriptions in SKILL.md frontmatter so activation is accurate, specific, and resistant to false positives and false negatives.
```

Avoid:

```yaml
description: Helps with skills.
```

Avoid implementation-heavy descriptions such as:

```yaml
description: Use when writing skills by first creating failing tests, then editing the file, running three passes, and refactoring until the tests pass.
```

The description should decide **whether the skill should load**. The body should explain **what to do after loading**.

---

### 4. Check breadth and boundaries

Ask both questions:

1. **False negatives** - Would the skill activate when the user describes the need without using exact domain vocabulary?
2. **False positives** - Would the skill activate for ordinary or adjacent work outside the skill's intended scope?

If too broad, add:

- explicit artifact names
- domain qualifiers
- phase or workflow boundaries
- clear exclusions implied through narrower intent wording

If too narrow, add:

- common synonyms
- alternate user verbs
- indirect user intents
- failure symptoms the skill is designed to solve

Do not solve false negatives by making the description universally broad.

---

### 5. Remove body-only content

Move the following out of the description:

- step-by-step procedures
- long policy rationale
- full examples
- validation checklists
- tool commands
- testing methodology
- implementation architecture
- deployment instructions

Keep only information that materially helps activation.

---

## Trigger evaluation

Description quality should be tested with realistic user prompts rather than judged only by inspection.

### Activation preconditions and confounders

Before interpreting a trigger failure as a description defect:

1. **Verify registration and discoverability.** Confirm the skill is installed or registered where the agent expects skills and can be discovered by the client under test.
2. **Verify observability.** Use execution logs, tool-call history, verbose output, or equivalent evidence to determine whether the agent actually loaded the skill's `SKILL.md`. Do not infer activation solely from the final answer.
3. **Account for direct handling.** A relevant prompt may legitimately bypass the skill when the agent can complete a simple task without specialist instructions. Do not automatically broaden the description in response.
4. **Isolate the failure cause.** Distinguish description mismatch from registration, discovery, client configuration, observability, or capability-selection problems before revising the wording.

A relevant prompt that does not load the skill is therefore **evidence to investigate**, not automatic proof that the description is too narrow.

### Evaluation tiers

Use the lightest tier that provides enough confidence.

#### Baseline evaluation

Suitable for routine authoring or early iteration.

Minimum useful coverage:

- 3 clear should-trigger prompts
- 3 clear should-not-trigger prompts
- 2 ambiguous or near-miss prompts
- 1 indirect prompt that should trigger without using the exact domain term

This is a practical lower bound, not a final production benchmark.

#### Production evaluation

Use for important, widely distributed, overlapping, or difficult-to-trigger skills.

Aim for roughly:

- 8-10 should-trigger prompts
- 8-10 should-not-trigger prompts
- strong representation of near-misses and indirect requests

Around 20 total queries is a useful target when the activation boundary is important.

---

## Designing strong eval queries

### Should-trigger queries

Vary:

- **Phrasing** - formal, casual, abbreviated, imperfect grammar, minor typos
- **Explicitness** - direct domain naming and indirect intent
- **Detail** - terse prompts and context-rich requests
- **Complexity** - single-step and multi-step workflows
- **Position** - skill-relevant work appearing as one part of a larger task

The most valuable positive queries are not the obvious ones. Include requests where the skill is useful but the connection is not stated directly.

### Should-not-trigger queries

Prioritize **near-misses** over obviously unrelated prompts.

Strong negatives share vocabulary, artifacts, tools, or concepts with the skill while requiring a different capability.

Weak negative:

```text
What's the weather today?
```

Stronger negative for a skill about Agent Skill descriptions:

```text
Rewrite this product description so it sounds more concise.
```

The stronger case tests whether the activation boundary is precise rather than merely keyword-sensitive.

### Realism

Where appropriate, include realistic details such as:

- file paths
- project names
- artifact names
- user goals
- filenames
- specific technologies
- casual language
- abbreviations
- minor typos

Avoid synthetic evals that users would never plausibly send.

---

## Repeated-run testing

Agent behavior can be nondeterministic. For higher-confidence evaluation, run each query multiple times.

Three runs per query is a reasonable starting point.

For each query:

```text
trigger_rate = triggered_runs / total_runs
```

A practical default classification is:

- should-trigger passes when `trigger_rate > 0.5`
- should-not-trigger passes when `trigger_rate < 0.5`

Treat `0.5` as a heuristic, not a universal standard. Increase or otherwise adjust the acceptance threshold when activation reliability is critical or when false positives are costly.

For production evaluation, **declare the acceptance threshold or thresholds before interpreting results**. If should-trigger and should-not-trigger cases use different limits, document both. Do not move the threshold after seeing failures merely to make the candidate pass.

Record the observed trigger behavior rather than assuming a description is deterministic.

---

## Train and validation split

When iteratively optimizing a description, separate evaluation data to reduce overfitting.

A useful split is:

- **Train set: ~60%** - use failures to guide revisions.
- **Validation set: ~40%** - reserve for measuring whether revisions generalize.

Both sets should contain a representative mix of:

- should-trigger prompts
- should-not-trigger prompts
- near-misses
- indirect requests

Keep the split fixed during an optimization cycle.

Do not revise the description based on validation failures during the same cycle. Otherwise the validation set becomes part of training and stops measuring generalization.

---

## Optimization loop

1. Evaluate the current description.
2. Record false negatives and false positives.
3. Use **train-set** failures to identify general categories of missing or over-broad intent.
4. Revise the description.
5. Keep the description below `1024` characters.
6. Re-run train and validation tests.
7. Repeat until:
   - train performance is acceptable,
   - validation performance stops improving, or
   - further changes only add complexity.
8. Select the best-performing description by **validation behavior**, not merely the latest iteration.
9. Run **5-10 fresh, previously unseen holdout prompts** before deployment, with a mix of should-trigger and should-not-trigger cases.

Five iterations is usually enough to expose whether the description can be improved structurally. If progress stalls, reassess the eval labels, boundary definition, or description structure instead of continuing to add wording.

---

## Diagnostic guide

| Symptom | Likely cause | Corrective action |
| --- | --- | --- |
| Relevant tasks do not activate the skill | Missing user vocabulary or indirect intent | Add common verbs, artifacts, synonyms, or user goals |
| Skill activates too often | Description is too generic | Add domain, artifact, phase, or workflow boundaries |
| Tool-related requests trigger unexpectedly | Description emphasizes implementation instead of intent | Lead with user outcome; move tool details to the body |
| Similar skills both activate | Boundaries overlap | Distinguish artifact, domain, phase, responsibility, or exclusion |
| Agent appears to skip the body | Description contains too much workflow detail | Reduce it to activation conditions |
| Description is difficult to scan | Too many clauses or concepts | Remove secondary details or split with `especially when...` |
| Train results improve but validation worsens | Overfitting | Revert or generalize; stop copying wording from failed evals |
| Repeated runs are unstable | Boundary or wording is ambiguous | Clarify intent and add stronger near-miss coverage |

---

## Conflict-resolution rules for neighboring skills

When two skills may activate for the same request, do not rely on naming alone.

Define the boundary using one or more of:

- different artifacts
- different domains
- different workflow phases
- different user outcomes
- different required expertise
- different ownership or responsibility
- explicit near-miss scenarios

If both descriptions remain valid for the same realistic request, the skills may need architectural consolidation, a shared base, or clearer specialization rather than further wording changes.

Description tuning should not conceal a genuine skill-boundary problem.

---

## Examples

### Too vague

```yaml
description: Helps write better documentation.
```

Better:

```yaml
description: Use when creating, editing, or validating Agent Skills/SKILL.md files, especially descriptions, activation triggers, frontmatter, supporting references, scripts, or evals.
```

### Too broad

```yaml
description: Use when improving prompts, descriptions, and instructions.
```

Better:

```yaml
description: Use when improving Agent Skill descriptions in SKILL.md frontmatter so skill activation is accurate, specific, and resistant to false positives or false negatives.
```

### Too implementation-heavy

```yaml
description: Use when writing skills by creating failing pressure tests, revising the skill, and repeatedly refactoring until tests pass.
```

Better:

```yaml
description: Use when creating or testing Agent Skills that require activation evals, pressure scenarios, trigger-behavior review, or deployment-readiness validation.
```

---

## Production acceptance checklist

Before accepting a description:

- [ ] Valid YAML scalar.
- [ ] Under `1024` characters.
- [ ] Uses imperative activation phrasing.
- [ ] Names the relevant artifact, domain, or responsibility.
- [ ] Includes likely user verbs and meaningful synonyms.
- [ ] Covers at least one indirect context or failure symptom when relevant.
- [ ] Does not encode the full workflow.
- [ ] Does not unnecessarily overlap with neighboring skills.
- [ ] Positive trigger evals are documented.
- [ ] Negative and near-miss evals are documented.
- [ ] At least one positive query omits the exact domain term.
- [ ] The skill is registered/discoverable in the test environment, and activation can be observed reliably.
- [ ] Production-critical skills use a sufficiently broad eval set.
- [ ] Production trigger-rate acceptance threshold(s) are declared before results are interpreted.
- [ ] Repeated-run instability has been considered where nondeterminism matters.
- [ ] Iterative tuning uses validation data to detect overfitting.
- [ ] Final verification includes 5-10 fresh holdout prompts with both should-trigger and should-not-trigger cases.
- [ ] Relevant non-triggers have been checked for registration, discovery, observability, or legitimate direct handling before being classified as description failures.
- [ ] The description still matches the actual behavior and scope of `SKILL.md`.

---

## Definition of done

A skill description is production-ready when:

1. the skill is confirmed discoverable and its loading behavior can be observed in the test environment,
2. relevant prompts meet the **predeclared should-trigger acceptance threshold**,
3. irrelevant and adjacent prompts meet the **predeclared should-not-trigger acceptance threshold**,
4. indirect user intent is covered without making the scope generic,
5. neighboring skills have defensible activation boundaries,
6. validation results and 5-10 fresh holdout prompts show the wording generalizes beyond the prompts used to tune it,
7. unexplained non-triggers have been checked for non-description causes, including legitimate direct handling of simple tasks,
8. the description remains concise, readable, valid frontmatter, and under the required character limit, and
9. every activation claim remains consistent with the actual `SKILL.md` body.

Do not treat a description as production-ready merely because it reads well. Production readiness requires an explicit activation boundary plus evidence from realistic positive, negative, and near-miss evals.
