# Persuasion Principles for Skill Design

<!-- markdownlint-disable MD013 -->

## Overview

Load only after observing a concrete adherence or rationalization failure; use
[instruction-form.md](instruction-form.md) for other output-shaping failures.
Inputs: governing requirement, representative failure, candidate wording, and
permitted evaluation environment. Output: a scoped wording hypothesis and a
comparative test, not a guarantee of compliance.

**Evidence boundary:** Meincke et al.'s 2025 study reported 28,000 conversations
with GPT-4o mini and two objectionable-request tasks, with average compliance of
33.3% for controls and 72.0% for persuasion prompts. This is evidence about that
study, not measured skill quality, general model psychology, or reliability on
current clients. The
[authors' abstract](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5357179)
was checked on 2026-10-04 and links a later published version. The full study
and per-principle effects were not re-evaluated here; transferring effects to
this package remains `NHR` until tested.

The seven categories below are design hypotheses derived from a human influence
framework. They do not override the host instruction hierarchy, permissions, or
user scope. Use truthful requirements and proportional controls; do not invent
authority, urgency, consensus, or guarantees.

Navigation: [principles](#the-seven-principles),
[type fit](#principle-combinations-by-skill-type),
[mechanism hypotheses](#mechanism-hypotheses-to-test), [ethics](#ethical-use),
[sources](#research-citations), [test sequence](#quick-reference).

## The Seven Principles

### 1. Authority

**What it is:** Deference to expertise, credentials, or official sources.

**How it works in skills:**

- Imperative language: "YOU MUST", "Never", "Always"
- Explicit framing of actual mandatory requirements and their source
- May reduce ambiguity; compare adherence rather than asserting an effect

**When to use:**

- Discipline-enforcing skills (TDD, verification requirements)
- Safety-critical practices
- Documented governing rules; best-practice preferences remain preferences

**Example:**

```markdown
Candidate: In this authorized disposable test-first exercise, discard only the
generated candidate implementation if test-first order was violated. Preserve
existing user work and follow the governing recovery policy outside the
exercise.
```

### 2. Commitment

**What it is:** Consistency with prior actions, statements, or public
declarations.

**How it works in skills:**

- Require announcements: "Announce skill usage"
- Record explicit choices when they affect the governing requirement
- Use a checklist or the target client's available tracking tool when useful

**When to use:**

- Ensuring skills are actually followed
- Multi-step processes
- Accountability mechanisms

**Example:**

```markdown
Candidate, only where announcement is required: State the skill and its purpose
when first applying it. An announcement is not evidence that the workflow ran.
```

### 3. Scarcity

**What it is:** Urgency from time limits or limited availability.

**How it works in skills:**

- Time-bound requirements: "Before proceeding"
- Sequential dependencies: "Immediately after X"
- Makes a real dependency visible; it must not fabricate urgency

**When to use:**

- Immediate verification requirements
- Time-sensitive workflows
- Preventing "I'll do it later"

**Example:**

```markdown
Candidate: When the governing workflow requires review before release, obtain
that review before the release step. External messages still require
authorization.
```

### 4. Social Proof

**What it is:** Conformity to what others do or what's considered normal.

**How it works in skills:**

- Cite actual documented team norms or relevant failure evidence
- Avoid claims of universal failure or consensus without support

**When to use:**

- Documenting established local practices with clear applicability
- Warning about common failures
- Reinforcing standards

**Example:**

```markdown
Candidate: This team's release checklist records each required gate and its
evidence. Use the documented tracking mechanism when this workflow applies.
```

### 5. Unity

**What it is:** Shared identity, "we-ness", in-group belonging.

**How it works in skills:**

- Collaborative language: "our codebase", "we're colleagues"
- Shared goals: "we both want quality"

**When to use:**

- Collaborative workflows
- Establishing team culture
- Non-hierarchical practices

**Example:**

```markdown
✅ We're colleagues working together. I need your honest technical judgment. ❌
You should probably tell me if I'm wrong.
```

### 6. Reciprocity

**What it is:** Obligation to return benefits received.

**How it works:**

- Use sparingly - can feel manipulative
- Rarely needed in skills

**When to avoid:**

- Compliance where obligation or guilt would replace task-relevant reasons

### 7. Liking

**What it is:** Preference for cooperating with those we like.

**How it works:**

- **DON'T USE for compliance**
- Conflicts with honest feedback culture
- May encourage agreement instead of evidence-based judgment

**When to avoid:**

- Always for discipline enforcement

## Principle Combinations by Skill Type

These are starting hypotheses, not empirically validated combinations. Use the
narrowest wording supported by the observed failure.

| Skill Type           | Use                                   | Avoid               |
| -------------------- | ------------------------------------- | ------------------- |
| Discipline-enforcing | Authority + Commitment + Social Proof | Liking, Reciprocity |
| Guidance/technique   | Moderate Authority + Unity            | Heavy authority     |
| Collaborative        | Unity + Commitment                    | Authority, Liking   |
| Reference            | Clarity only                          | All persuasion      |

## Mechanism hypotheses to test

**Explicit rules may reduce rationalization:**

- Explicit mandatory language may make a real rule easier to identify
- Observable conditions can distinguish valid exceptions from invented ones
- Rationalization counters should address failures actually observed

**Conditional instructions may help selection:**

- Compare "when X, do Y" with general guidance on both branches
- Check whether the trigger is observable and within the skill boundary
- Evaluate omission, over-application, and task quality as well as adherence

**Human-language analogies are not causal proof:**

- Training on human text motivates comparing these forms
- It does not prove human motives, automatic execution, or general compliance

## Ethical Use

**Legitimate:**

- Ensuring critical practices are followed
- Creating effective documentation
- Preventing predictable failures

**Illegitimate:**

- Manipulating for personal gain
- Creating false urgency
- Guilt-based compliance

**The test:** Would this technique serve the user's genuine interests if they
fully understood it?

## Research Citations

**Cialdini, R. B. (2021).** _Influence: The Psychology of Persuasion (New and
Expanded)._ Harper Business.

- Seven principles of persuasion
- Human influence framework; not a skill-performance evaluation

**Meincke, L., Shapiro, D., Duckworth, A. L., Mollick, E., Mollick, L.,** &
**Cialdini, R. (2025).**
[Call Me A Jerk: Persuading AI to Comply with Objectionable Requests](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5357179).
Wharton School working paper; the abstract links its later published version.

- Tested 7 principles with N=28,000 LLM conversations
- Compliance increased 33% → 72% with persuasion techniques
- No universal ranking or cross-model guarantee is established by this guide

## Quick Reference

When designing a skill, ask:

1. Classify the actual failure and confirm a governing requirement.
2. Select one plausible correction; keep unrelated task conditions constant.
3. Use [behavioral tests](testing-skills-with-subagents.md) to compare baseline
   and candidate, including near-misses and pressure appropriate to the class.
4. Reject a correction that improves compliance by harming scope, safety, or
   output correctness. Record partial evidence `AMBER` and missing evidence
   `NHR`.
5. Retain only supported improvements; report model, revision, sample, and
   limitations. Re-evaluate after relevant client/model/policy changes.
