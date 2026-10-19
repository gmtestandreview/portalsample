# Validation Cases

Load this reference only when a classification or boundary is contested or a subset, cluster, transitive, or user-pressure case arises.

## Branch cases

| Branch | Positive | Near-miss | Expected result |
| --- | --- | --- | --- |
| True duplicate | One realistic request activates both skills (or the strict-subset guard in SKILL.md applies); outcomes are materially equivalent; no meaningful specialization exists. | Same domain, but one skill has a distinct material outcome or specialization. | Positive → `True duplicate`; near-miss must not. |
| Partial overlap | One realistic request can activate both, but a material condition, stage, responsibility, or specialization distinguishes them. | The only reason classification is unclear is missing evidence. | Positive → `Partial overlap`; near-miss → `Needs Human Review`. |
| Complementary | Skills are materially related but own distinct stages or responsibilities and should not normally co-activate. | Similar names, format, or domain with no material functional relationship. | Positive → `Complementary`; near-miss → `False positive`. |
| Boundary | A-side and B-side requests each map to their intended skill without unintended co-activation. | A specialist request still satisfies both written conditions. | Revise ambiguous boundary or use `Needs Human Review`. |
| Subset | One skill's activation set is a strict subset of the other's and it adds no material value; a format variant alone adds no specialization. | The subset skill carries a materially distinct deliverable, checklist, gotcha, eval, or safety control. | Positive → `True duplicate`; near-miss → `Partial overlap` with a precedence-aware boundary. |
| Cluster | Every pair among A, B, C was evaluated and is `True duplicate`; one survivor is named and each member is preservation-reviewed. | A=B is a duplicate but B and C are only `Partial overlap`. | Positive → one cluster merge; near-miss → C stays outside, A–B is a cluster of two, and C keeps its boundary. |
| Transitive | A=B and B=C are duplicates but A–C is a `Partial overlap` or contradicts, and neither is a strict-subset hub of B. | A and C are strict subsets of B with no contradiction (for example lint YAML, lint JSON, lint YAML and JSON). | Positive → inconsistency reported, group `Needs Human Review`, no cluster; near-miss → hub cluster {B survivor, A, C}; A–C classified on its own evidence and not blocking. |
| User pressure | User demands a merge verdict on a pair with material specialization. | User states a preference on a true duplicate. | Positive → evidence-based `Partial overlap` plus the preference recorded separately; near-miss → classification unchanged, preference noted. |
| Hub with contradiction | A and C are strict subsets of B but their guidance conflicts (always vs never include commit hashes). | A and C are strict subsets of B with no conflict. | Positive → group `Needs Human Review`, no cluster, contradiction listed, subset pairs keep their classification; near-miss → hub cluster. |
| Handoff gate | User confirms a merge after the evidence-based result is reported, every survivor–member pair is `True duplicate`, no contradictions; a qualifying hub's sibling pair is excepted. | User demands the merge before the result, or a survivor–member pair is not `True duplicate`. | Positive → hand off to `writing-skills`, perform no merge; near-miss → restate the result, record the demand under User decision. |
| Exhaustive mode | User asks for all-pairs accounting. | User asks for one named pair. | Positive → every pair reported, `False positive` pairs as one line; near-miss → only the named pair (plus hub-required pairs). |
| Composition | A request is meant to activate both skills together, each with a distinct responsibility. | One skill's output feeds the other's task but a single request would not use both. | Positive → `Partial overlap` with intentional composition; near-miss → `Complementary`. |

For intentional composition, the positive must intentionally activate both skills while assigning distinct responsibilities; a case where both produce the same material output is a near-miss that requires reclassification or boundary revision.
