---
name: skill-duplication-audit
description: Use when comparing two or more Agent Skills to detect duplicated or overlapping scope, clarify ambiguous activation boundaries, or decide whether skills should merge, remain separate, or document their distinction. Do not use for identifying identical text or overlapping responsibilities within a single skill, or for comparing agents.
metadata:
  version: "0.5"
  owner: Greg
  target: a-team
---

# Skill Duplication Audit

## Problem

Skills across the 5 ecosystem repositories overlap in scope without documented distinctions. This creates confusion about which skill to invoke, silent redundancy in packs, and conflicting guidance when two skills are active in the same session. Without a structured way to detect and classify overlaps, the ecosystem grows noisier over time.

## Purpose

Compare two or more Agent Skills by activation scope, intended outcome, and material specialization. Classify overlap and recommend the smallest action that removes ambiguity without losing specialized value.

Do not classify skills based solely on names, titles, repository locations, shared terminology, or output format.

## Use When

* Checking whether a proposed skill duplicates an existing skill.
* Auditing a pack or skill library for redundant capabilities.
* Comparing skills across repositories or packs.
* Resolving confusion about which skill should activate.
* Verifying whether an existing skill-boundary document still matches current skills.

Do not use:

* For a single skill.
* To detect repeated text inside one skill.
* To compare agents rather than Agent Skills.
* For skills that do not share a functional relationship unless the user explicitly asks to compare them or requests exhaustive pair accounting.

## Required Evidence

For each skill, obtain:

* `name`;
* activation condition or trigger;
* objective or intended outcome;
* relevant domain or workflow stage when needed.

Repository or pack is optional context.

If activation or outcome evidence is missing:

1. Record what is missing.
2. Do not infer scope from names or neighboring skills.
3. Mark every affected comparison `Needs Human Review`.
4. Do not assign another classification until sufficient evidence exists.

## Workflow

### 1. Prepare the comparison

For each skill, record:

* activation condition;
* intended outcome;
* material specialization: domain, workflow stage, safety/compliance, required tools, or output responsibility.

Determine the comparison set:

- Always evaluate any pair the user explicitly asks to compare. 
- If the user requests exhaustive or all-pairs accounting, evaluate every possible pair. 
- Otherwise, when discovering candidate pairs from a larger skill list, exclude pairs with no plausible activation, task, workflow, or functional relationship. 

An explicitly requested or exhaustively included pair with no material functional relationship is `False positive`.

### 2. Verify existing boundaries

If an authoritative boundary already distinguishes a pair:

1. Compare it with the current activation conditions and outcomes.
2. Reuse it only if it is current, authoritative, and still resolves the overlap.
3. If stale, incomplete, ambiguous, or contradicted, continue the audit and recommend updating it.

### 3. Classify each pair

Answer in order:

1. **Evidence complete?**

   * no → `Needs Human Review`.
2. **Could the same realistic user request reasonably activate both?**

   * yes → compare outcome and specialization:

     * materially equivalent outcomes + no meaningful specialization → `True duplicate`;
     * otherwise → `Partial overlap`.
   * no → check functional relationship:

     * materially related responsibilities, stages, handoffs, or specialist roles → `Complementary`;
     * no material functional relationship → `False positive`.

Use `Needs Human Review` whenever an unknown answer would change the classification.

| Classification         | Meaning                                                                                                                                    | Recommendation                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **True duplicate**     | Same realistic requests activate both; outcomes are materially equivalent; no meaningful specialization warrants separation.               | Recommend merge after preservation and conflict review.    |
| **Partial overlap**    | At least one realistic request can activate both, but conditions, outcomes, stages, responsibilities, or specialization differ materially. | Keep distinct and document a valid boundary.               |
| **Complementary**      | Materially related skills perform distinct responsibilities or workflow stages, so the same request should not normally activate both.     | Keep both and document the relationship when useful.       |
| **False positive**     | No material functional relationship; similarity is superficial or the pair appears only because of exhaustive accounting.                  | No duplication action.                                     |
| **Needs Human Review** | Evidence cannot establish activation, outcome, specialization, relationship, or boundary reliably.                                         | Obtain missing evidence before structural recommendations. |

Decision guards:

* Similar names are not duplication evidence.
* Different repositories do not prevent overlap.
* Shared format, workflow pattern, or domain alone does not establish duplication or complementarity.
* Different tools alone do not establish separate scope.
* A broad skill and a narrower specialist are not duplicates when the specialist carries material value.
* Do not use `Partial overlap` as a fallback for uncertainty.
* Never recommend merging unresolved contradictory guidance.

### 4. Resolve partial-overlap boundaries

Every `Partial overlap` boundary must be one of:

* **mutually exclusive**;
* **precedence-aware**; or
* **intentional composition**.

For broad/narrow pairs, prefer:

`Use [narrow skill] when [specialized condition]; otherwise use [broad skill] when [remaining condition].`

Do not write boundaries where the specialist request still satisfies both conditions.

For intentional composition:

1. state that both should activate;
2. assign each a distinct responsibility;
3. explain why both are required.

### 5. Validate the boundary

For exclusive or precedence-aware boundaries, test:

* an A request maps to A and not unintentionally to B;
* a B request maps to B and not unintentionally to A.

For intentional composition, verify:

* both activate intentionally;
* responsibilities are distinct;
* neither duplicates the other.

If the mapping remains ambiguous, revise the boundary or mark it `Needs Human Review`.

### 6. Recommend action

This skill recommends structural action; it does not perform merges, deletions, deprecations, renames, or other lifecycle changes.

Before recommending a merge, identify unique material that must be preserved or reviewed:

* instructions and decision rules;
* domain knowledge;
* edge cases and gotchas;
* safety or permission controls;
* tests/evals;
* references, scripts, assets, templates, and other supporting resources.

Resolve known contradictions first. If preservation cannot be established, mark the merge recommendation `Needs Human Review`.

## Output

For every evaluated pair:

| Pair | Classification | Activation evidence | Outcome/specialization evidence | Functional relationship | Recommendation |
| ---- | -------------- | ------------------- | ------------------------------- | ----------------------- | -------------- |

For each `Partial overlap`, also provide:

* proposed boundary;
* A-side test request;
* B-side test request;
* boundary type: exclusive, precedence-aware, or intentional composition.

For each `Complementary` pair, state the material functional relationship.

Finish with:

```text
skill-duplication-audit complete.
Skills analyzed: [count]
Pairs evaluated: [count]
True duplicates: [count] — [pairs or NONE]
Partial overlaps: [count] — [pairs or NONE]
Complementary pairs: [count] — [pairs or NONE]
False positives: [count] — [pairs or NONE]
Needs Human Review: [count] — [pairs or NONE]
Boundary docs needed: [count] — [pairs or NONE]
Recommendation: [summary action]
```

## Validation

Before completion, verify:

* every classification is evidence-backed;
* missing evidence is documented as `Needs Human Review`;
* complementary pairs have a material functional relationship;
* partial-overlap boundaries pass bidirectional validation;
* true-duplicate recommendations preserve unique material and resolve contradictions;
* existing boundaries were checked against current behavior;
* exhaustive audits account for every requested pair;
* completion counts match the pair-level report.
