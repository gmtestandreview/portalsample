# Validation Cases

Load this reference only when constructing or checking representative QAQ/RMI cases or the completion summary.

## Branch cases

| Branch | Positive | Near-miss | Expected result |
| --- | --- | --- | --- |
| True duplicate | One realistic request activates both skills; outcomes are materially equivalent; no meaningful specialization exists. | Same domain, but one skill has a distinct material outcome or specialization. | Positive → `True duplicate`; near-miss must not. |
| Partial overlap | One realistic request can activate both, but a material condition, stage, responsibility, or specialization distinguishes them. | The only reason classification is unclear is missing evidence. | Positive → `Partial overlap`; near-miss → `Needs Human Review`. |
| Complementary | Skills are materially related but own distinct stages or responsibilities and should not normally co-activate. | Similar names, format, or domain with no material functional relationship. | Positive → `Complementary`; near-miss → `False positive`. |
| Boundary | A-side and B-side requests each map to their intended skill without unintended co-activation. | A specialist request still satisfies both written conditions. | Revise ambiguous boundary or use `Needs Human Review`. |

For intentional composition, the positive must intentionally activate both skills while assigning distinct responsibilities; a case where both produce the same material output is a near-miss that requires reclassification or boundary revision.

## Completion template

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
