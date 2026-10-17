# Independent reviewer handbacks

## Initial target review

```text
F07 needs a narrow consistency fix before validation. No files edited; all inspected files passed secret scans.

Concrete defects:

- skills/skill-duplication-audit/references/validation-cases.md:13: “unique output format” automatically makes a subset specialist. This contradicts SKILL.md:48, :101, and oracle R1. Specify a materially distinct deliverable; explicitly exclude formatting alone.
- skills/skill-duplication-audit/evals/expected.md:40: permits Needs Human Review as the pair classification solely for an established contradiction, contrary to SKILL.md:104. Separate evidence-based pair labels from merge/group holds and remove the unsupported alternative.
- skills/skill-duplication-audit/evals/cases/04-modes-handoff-contradiction.md:8 versus evals/expected.md:38: Qdrant gets no activation condition or skill outcome, yet all three affected comparisons must be False positive. Supply complete evidence or expect three classified NHR pairs. With the latter correction, S1 counts are one duplicate, two false positives, three NHR: six pairs.

Focused behavioral cases:

1. Broad commit writer plus format-only subset → duplicate; preserve formatting rule; no invented specialist boundary.
2. Broad release-notes hub plus contradictory subset instructions → preserve pair classifications, list contradiction, hold merge/group, count each flag separately, forbid handoff.
3. YAML/JSON hub without contradictions → two duplicate pairs, one sibling false positive, three evaluated pairs, one hub cluster; explicit mode unchanged.
4. Exhaustive four-skill case with one missing activation/outcome → all three affected pairs NHR; classification totals still reconcile to six.
```

## Python implementation review

```text
One verified P2 finding remains in skills/writing-skills/scripts/skills_ref/evidence.py:169: default JSON float parsing can round scores across the deployment threshold.

Reproduction: a fully PASS deploy record with literal JSON "value": 95.999999999999999999, "operator": ">=", and "threshold": 96 exits 0 and reports Evidence consistent: deploy. This contradicts references/bounded-optimisation.md:93. Budget comparisons can similarly lose decimal distinctions.

Small fix: parse fractional numbers as Decimal, retain exact numeric values through validation/comparison, and add a regression using literal JSON near the threshold.

Reviewed the updated oversized-integer guard and regression. No other material findings within the four-file scope. No edits, broad audit, host-readiness assessment, or full-suite execution performed.
```

## Oracle follow-up, without GREEN output

```text
Recommend False positive for the S3 sibling pair under the unchanged rules.

The original fixture distinguishes git-history versus merged-PR inputs, gives both the same release-notes outcome, specifies no other specialization, and supplies no handoff. That matches SKILL.md:99’s input-type sibling guard. The opposite hash instructions separately hold the merge/group under SKILL.md:104; they must not create Partial overlap.

The oracle should require: sibling pair False positive, contradiction listed, group/merge held, no formed hub cluster or handoff. Mandatory Partial overlap lacks supporting evidence.

If overlapping source inputs are meant to distinguish this case from input-only siblings, clarify that policy and fixture before another evaluation; do not resolve that ambiguity by grading against an unstated interpretation.
```
