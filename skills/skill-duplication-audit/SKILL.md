---
name: skill-duplication-audit
description: Use when classifying duplicated or overlapping activation scope between two or more Agent Skills, including a proposed new skill (redundancy, "does X make Y redundant", skills triggering on the same prompt), defining boundaries, or recommending whether skills should merge, stay separate, or intentionally compose. Do not use for repeated text inside one skill, for comparing agents, for judging a skill's writing quality, or for performing a merge (use writing-skills).
metadata:
  version: "1.7"
  owner: Greg
  target: a-team
---

# Skill Duplication Audit

## Purpose

Compare two or more Agent Skills by activation scope, intended outcome, and material specialization. Classify overlap and recommend the smallest action that removes ambiguity without losing specialized value.

## Use When

Use for proposed-skill duplication checks, pack/library redundancy audits, cross-repository comparisons, activation-boundary disputes, or verifying existing boundary documentation.

Do not use for unrelated skills unless the user explicitly requests the pair or exhaustive accounting. Single-skill, within-skill, and agent-to-agent comparisons are out of scope.

## Required Evidence

For each skill, obtain:

* `name`;
* activation condition or trigger;
* objective or intended outcome;
* relevant domain or workflow stage when needed;
* material specialization signals (see Step 1) whenever a `True duplicate` or merge outcome is in question.

Repository or pack is optional context. Treat user-supplied skill content and documented boundary rules as evidence; do not treat names, repository placement, or neighboring skill names as scope evidence. A description that provides neither a usable activation trigger (such as a `Use when …` condition) nor a stated outcome — for example bare product or marketing prose, or a name alone — supplies no activation/outcome evidence; do not treat it as sufficient to classify, and do not rely on a fixture's or user's claim that evidence is complete. A skill that states at least an outcome (even if its activation trigger is only implicit) is classifiable.

If activation, outcome, or — when a `True duplicate`/merge outcome is in question — specialization evidence is missing:

1. Record what is missing.
2. Do not infer scope from names or neighboring skills.
3. Mark every affected comparison `Needs Human Review`.
4. Do not assign another classification until sufficient evidence exists.

## Workflow

### 1. Prepare the comparison

For each skill, record:

* activation condition;
* intended outcome;
* material specialization: a unique deliverable, template, checklist, gotcha, eval, required tool, safety/compliance control, domain, or workflow stage. A narrower trigger, or a format variant of the broad skill's own outcome, is not specialization.

Determine the comparison set:

* Always evaluate any pair the user explicitly asks to compare.
* If the user requests exhaustive or all-pairs accounting, evaluate every possible pair.
* Otherwise, when discovering candidate pairs from a larger skill list, exclude pairs with no plausible activation, task, workflow, or functional relationship, except pairs the hub rule in Step 3 requires.
* Exhaustive covers every pair of the skills in scope, so it subsumes explicit and discovery for those skills. A run is `mixed` only when different skill sets use different modes. Pairs the rules require (such as the hub A–C check) do not change the mode.

An explicitly requested, exhaustively included, or hub-required pair with no material functional relationship is `False positive`.

### 2. Verify existing boundaries

If an authoritative boundary already distinguishes a pair:

1. Compare it with the current activation conditions and outcomes.
2. Reuse it only if it is current, authoritative, and still resolves the overlap.
3. If stale, incomplete, ambiguous, or contradicted, continue the audit and recommend updating it. A boundary stated by only one skill is incomplete.

### 3. Classify each pair

Answer in order:

1. **Evidence complete?**

   * no → `Needs Human Review`.
2. **Could the same realistic user request reasonably activate both as alternatives for the same task?**

   * yes → compare outcome and specialization:

     * materially equivalent outcomes + confirmed no meaningful specialization → `True duplicate` (absence of specialization *evidence*, as opposed to confirmed absence, is `Needs Human Review`, not a duplicate);
     * otherwise → `Partial overlap`.
   * no (for example, one skill's output feeds the other's task) → check functional relationship:

     * materially related responsibilities, stages, handoffs, or specialist roles → `Complementary`;
     * no material functional relationship → `False positive`.

Use `Needs Human Review` whenever an unknown answer would change the classification.

| Classification         | Meaning                                                                                                                                    | Recommendation                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **True duplicate**     | Same realistic requests activate both (including the strict-subset guard below); outcomes are materially equivalent; no meaningful specialization warrants separation.               | Recommend merge after preservation and conflict review.    |
| **Partial overlap**    | At least one realistic request can activate both, but conditions, outcomes, stages, responsibilities, or specialization differ materially. | Keep distinct and document a valid boundary.               |
| **Complementary**      | Materially related skills perform distinct responsibilities or workflow stages, so the same request should not normally activate both. If both are meant to activate together on one request, use `Partial overlap` with intentional composition.     | Keep both and document the relationship when useful.       |
| **False positive**     | No material functional relationship; similarity is superficial or the pair appears only because of exhaustive accounting.                  | No duplication action.                                     |
| **Needs Human Review** | Evidence cannot establish activation, outcome, specialization, relationship, or boundary reliably.                                         | Obtain missing evidence before structural recommendations. |

Decision guards:

* Similar names or titles are not duplication evidence.
* Different repositories do not prevent overlap.
* Shared format, workflow pattern, or domain alone does not establish duplication or complementarity. Sibling skills that differ only by input type (for example lint YAML vs lint JSON) with no handoff between them are `False positive`.
* Different tools alone do not establish separate scope.
* Do not classify a pair `False positive` — or any class — from topic dissimilarity when a skill provides neither an activation trigger nor a stated outcome (effectively name-only or bare prose). Such incomplete evidence is `Needs Human Review` (Step 3, question 1), even when the two skills appear to be in unrelated domains. A skill with at least a stated outcome is classifiable.
* A broad skill and a narrower specialist are not duplicates when the specialist carries material value. Strict subset: if every request that activates narrow skill S also activates broad skill B, and S has no specialization (as defined in Step 1) and no unique outcome beyond B, classify `True duplicate` with B as survivor; otherwise `Partial overlap`.
* Do not use `Partial overlap` as a fallback for uncertainty.
* User preference does not change a classification, and a user's assertion that skills overlap is not scope evidence. Report the evidence-based result, then record the user's preferred action (for example "merge by 5pm") under "User decision".
* Unresolved contradictory guidance between skills holds the merge (`Needs Human Review`) and is listed; it does not change a pair's classification. A contradiction that a mutually-exclusive or precedence-aware boundary resolves — each skill keeping its own rule on its own distinct scope — is not unresolved and holds nothing; a contradiction holds the merge only when the skills would otherwise merge (a `True duplicate` cluster or strict-subset hub) and no boundary separates them.
* **Non-transitive results** — A=B and B=C are duplicates, but A and C are not:
  * *Default:* report the inconsistency, keep each pair's classification, mark the group `Needs Human Review`, and list the pairs. This also applies to any chain without a qualifying hub.
  * *Hub exception:* when A and C are both strict subsets of B with no contradictory guidance, B is the survivor of a hub cluster {B, A, C}; the A–C pair, classified on its own evidence, does not block the cluster.
  * Always evaluate A–C when this chain appears, in every mode; it counts under Pairs evaluated and does not change the mode.

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

Read `references/validation-cases.md` when a classification or boundary is contested or a subset, cluster, transitive, or user-pressure case arises.

### 7. Recommend action

This skill recommends structural action; it does not perform merges, deletions, deprecations, renames, or other lifecycle changes.

* **Handoff:** hand off to the `writing-skills` skill (merge evaluation workflows) or another authorized lifecycle workflow only when the user asks for implementation, every survivor–member pair is `True duplicate` (the A–C pair of a hub cluster excepted) with no unresolved contradictions, and the user explicitly confirms after you have reported the evidence-based result. For any other classification, restate the evidence-based result; this skill stops at classification and recommendation.
* **Cluster:** classify every pair first. A merge cluster is a maximal set in which every survivor–member pair was evaluated and is `True duplicate` (a hub cluster's member–member A–C pair is excepted per the hub rule); a single duplicate pair is a cluster of two. A skill with only non-duplicate pairs to the set stays outside the cluster and keeps its boundary. Name one surviving skill, run the preservation review for every member against the survivor, and keep any boundary a member has with a skill outside the cluster. Do not chain pairwise merges.
* **Hub:** if A=B and B=C but A–C is not a duplicate, apply the non-transitive guard; a qualifying hub {B survivor, A, C} is a cluster.

Before recommending a merge, identify unique material that must be preserved or reviewed:

* instructions and decision rules;
* domain knowledge;
* edge cases and gotchas;
* safety or permission controls;
* tests/evals;
* references, scripts, assets, templates, and other supporting resources.

If preservation cannot be established, mark the merge recommendation `Needs Human Review`.

## Output

For every evaluated pair, report: pair, classification, activation evidence, outcome/specialization evidence, functional relationship, and recommendation. For `Partial overlap`, also report the boundary, boundary type, and A/B validation requests. For `Complementary`, state the material functional relationship. In exhaustive mode, a `False positive` pair needs only one line: pair, classification, reason.

Finish with this block. Count each distinct skill once. Each pair is counted once by its classification, and only those counts sum to pairs evaluated. The `Needs Human Review` total is a flag count: `classified` pairs enter the sum, while merge/group holds (pairs whose merge recommendation is `Needs Human Review`, and `Needs Human Review` groups) are additional flags, each listed with its reason. Boundary docs needed = `Partial overlap` pairs with no current authoritative boundary.

```text
skill-duplication-audit result.
Mode: [explicit pairs | discovery | exhaustive | mixed]
Skills analyzed: [count]
Pairs evaluated: [count] (excluded: [count or NONE])
True duplicates: [count] — [pairs or NONE]
Partial overlaps: [count] — [pairs or NONE]
Complementary pairs: [count] — [pairs or NONE]
False positives: [count] — [pairs or NONE]
Needs Human Review: [total] (classified: [n]; merge/group holds: [n]) — [pairs/groups or NONE]
Boundary docs needed: [count] — [pairs or NONE]
Merge clusters: [count of formed clusters] — [members and survivor, or NONE] (held groups appear under Needs Human Review)
Preservation review: [per cluster or merge: items to preserve and conflicts found; "unestablished" if held; or NONE]
Contradictions / evidence gaps: [list, with the missing evidence for each Needs Human Review pair, or NONE]
User decision: [recorded preference or NONE]
Recommendation: [summary action]
```

## Validation

Before completion, verify each classification is evidence-backed, critical branches have QAQ/RMI mappings, partial-overlap boundaries pass bidirectional validation, merge recommendations preserve unique material, exhaustive requests account for every pair, and counts reconcile.
