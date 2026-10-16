---
name: skill-duplication-audit
description: Use when comparing two or more Agent Skills to classify duplicated or overlapping activation scope, define boundaries, or decide whether skills should merge, remain separate, or intentionally compose. Do not use for repeated text or responsibility overlap inside one skill, or for comparing agents.
metadata:
  version: "0.7"
  owner: Greg
  target: a-team
---

# Skill Duplication Audit

## Purpose

Compare two or more Agent Skills by activation scope, intended outcome, and material specialization. Classify overlap and recommend the smallest action that removes ambiguity without losing specialized value.

## Use When

Use for proposed-skill duplication checks, pack/library redundancy audits, cross-repository comparisons, activation-boundary disputes, or verifying existing boundary documentation.

Do not use for a single skill, repeated text within one skill, agent-to-agent comparisons, or unrelated skills unless the user explicitly requests the pair or exhaustive accounting.

## Required Evidence

For each skill, obtain:

* `name`;
* activation condition or trigger;
* objective or intended outcome;
* relevant domain or workflow stage when needed.

Repository or pack is optional context. Treat user-supplied skill content and documented boundary rules as evidence; do not treat names, repository placement, or neighboring skill names as scope evidence.

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

* Always evaluate any pair the user explicitly asks to compare.
* If the user requests exhaustive or all-pairs accounting, evaluate every possible pair.
* Otherwise, when discovering candidate pairs from a larger skill list, exclude pairs with no plausible activation, task, workflow, or functional relationship.

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

* Similar names or titles are not duplication evidence.
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

### 6. QAQ/RMI check

For every load-bearing classification or boundary decision, define a positive and near-miss, map the positive to its governing instruction and expected behavior, verify the near-miss should not enter the branch, and reverse-map the behavior to the intended request class. If any mapping is indirect, contradictory, or scope-inconsistent, revise it or use `Needs Human Review`.

See `references/validation-cases.md` when representative branch examples are needed.

### 7. Recommend action

This skill recommends structural action; it does not perform merges, deletions, deprecations, renames, or other lifecycle changes. If implementation is requested, hand off to the applicable authorized merge/lifecycle workflow available in the environment; this skill stops at classification and recommendation.

Before recommending a merge, identify unique material that must be preserved or reviewed:

* instructions and decision rules;
* domain knowledge;
* edge cases and gotchas;
* safety or permission controls;
* tests/evals;
* references, scripts, assets, templates, and other supporting resources.

Resolve known contradictions first. If preservation cannot be established, mark the merge recommendation `Needs Human Review`.

## Output

For every evaluated pair, report: pair, classification, activation evidence, outcome/specialization evidence, functional relationship, and recommendation. For `Partial overlap`, also report the boundary, boundary type, and A/B validation requests. For `Complementary`, state the material functional relationship.

Finish with counts for skills, pairs, each classification, boundaries needed, and one summary recommendation. See `references/validation-cases.md` for the compact completion template.

## Validation

Before completion, verify classifications are evidence-backed; missing evidence is `Needs Human Review`; complementary relationships are material; critical branches have QAQ/RMI positive + near-miss mappings; partial-overlap boundaries pass bidirectional validation; merge recommendations preserve unique material and resolve contradictions; existing boundaries reflect current evidence; exhaustive requests account for every pair; and report counts reconcile.
