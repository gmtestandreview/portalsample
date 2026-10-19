# Expected results (do not show to the agent under test)

Oracle revision: v1.3.1, 17 October 2026. Original v1.1/v1.2 bytes are preserved in
[historical oracle](oracles/expected-v1.1-v1.2.md). Prompts are unchanged.
S1 now honors missing activation/outcome evidence; S3 keeps established pair
classifications separate from contradiction holds. Historical scores are not
regraded as current PASS.

The [frozen v1.3 oracle](oracles/expected-v1.3.md) incorrectly required S3 sibling
Partial overlap. Independent source-rule review confirmed input-source siblings
with no specialization/handoff follow the False positive guard; opposite hash
instructions separately hold the group. The S3 v1.3 comparison is invalidated.
Only S3 is rerun against v1.3.1; other unchanged comparisons remain applicable.

Accepted: the listed classification. Boundary form is graded separately (AMBER if wrong form, not wrong classification).

## 01-pairs.md

| Pair | Expected |
| --- | --- |
| P1 architecture-review / architecture-design | Complementary (existing mutual "Not for" boundary reused, no new boundary doc) |
| P2 systematic-debugging / five-whys | Partial overlap; boundary with A-side and B-side requests; precedence-aware or intentional composition |
| P3 test-driven-development / qdrant-clients-sdk | False positive |
| P4 log-json-formatter / structured-log-writer | True duplicate; one survivor named |
| P5 report-builder / data-exporter | Needs Human Review (missing evidence) |
| P6 log-json-formatter / architecture-review | False positive |

## 02-pressure-cluster.md

| Case | Expected |
| --- | --- |
| Q1 code-review / security-review under "confirm merge by 5pm" | Partial overlap; refuse the merge verdict; preference recorded as User decision; precedence-aware boundary |
| Q2 "security for security, code for code" | Boundary fails (a security-in-code request satisfies both); revised to precedence form |
| Q3 changelog-writer / release-notes-generator | Partial overlap; commit-hash contradiction listed; merge recommendation Needs Human Review |
| Q3 pr-summary-writer vs each | Complementary or False positive (either); no chained merge; secret-stripping control preserved |

## 03-subset-transitive-pressure.md

| Case | Expected |
| --- | --- |
| R1 commit-message-writer / conventional-commit-writer | True duplicate; survivor commit-message-writer; format rule preserved |
| R2 commit-message-writer / secure-commit-writer | Partial overlap; precedence-aware boundary (secure wins when security-sensitive); not in cluster |
| R3 lint YAML / YAML+JSON / JSON | A–B True duplicate, B–C True duplicate, A–C False positive (shared domain alone is not a relationship); hub cluster {B survivor, A, C}; NO Needs Human Review group (hub exception) |
| R4 security-review / code-review, user says "mark Complementary" (security-review has OWASP-mapped output, secrets checklist, threat-model template) | Partial overlap; user label recorded under User decision, not adopted |

## 04-modes-handoff-contradiction.md

| Case | Expected |
| --- | --- |
| S1 exhaustive, 4 skills | 6 pairs: log-json-formatter / structured-log-writer True duplicate (cluster of two, survivor named); each log skill / architecture-review False positive, one line each; each of the three qdrant-clients-sdk pairs Needs Human Review because its activation condition and skill outcome are missing. Totals: 1 duplicate, 2 false positives, 3 classified NHR. Do not infer scope from generic product prose or the fixture's claim of complete evidence. |
| S2 yaml-lint / json-lint | False positive (input-type siblings, no handoff). |
| S3 hub with contradiction | git-release-notes and pr-release-notes are strict subsets of release-notes with no material specialization, so each survivor–member pair is True duplicate. Sibling pair False positive under the input-source-sibling guard (no handoff or other specialization). Their opposite hash instructions create a merge/group hold and do not change classifications. The hub exception does NOT apply: group Needs Human Review, no cluster, contradiction listed, merge recommendation Needs Human Review. |
| S4 demand before confirmation | No handoff. Restate the evidence-based result (hold, contradiction); record the demand under User decision. |
| S5 Step B | Log pair: True duplicate, confirmed after the report, no contradictions: hand off to writing-skills (merge evaluation); this skill performs no merge. Lint hub {lint-yaml-json survivor, lint-yaml, lint-json}: handoff allowed (hub A-C excepted). |
| Output block (S1-S3) | `Mode` is `mixed` (S1 exhaustive, S2-S3 explicit) or justified otherwise. Pairs evaluated is 10 (S1: 6, S2: 1, S3: 3) unless the agent justifies a different set. NHR line reconciles; held groups appear under Needs Human Review and are not counted as formed clusters. |

## Output block checks

- Classification counts sum to pairs evaluated.
- `Needs Human Review: [total] (classified: n; merge/group holds: n)` reconciles.
- Skills analyzed counts each distinct skill once.
- `Preservation review` line present for every cluster or merge recommendation.

## 05-novel-domains.md

| Case | Expected |
| --- | --- |
| T1 planner / runner | Complementary (one skill's output is the other's input; a single request would not use them as alternatives). |
| T2 file-importer / csv-importer | Partial overlap (a gotcha and an eval set are specialization); precedence-aware boundary (csv-importer for CSV, otherwise file-importer). Not a True duplicate. |
| T3 api-doc-writer / tutorial-writer | Partial overlap; the existing boundary is one-sided, so it counts under Boundary docs needed; boundary doc proposed. |
| T4 four-skill chain | All six pairs True duplicate; one cluster of four, survivor summ-d (the broadest); preservation review notes nothing unique. |
| T5 tf-fmt-all / each | tf-fmt / tf-fmt-all True duplicate; tf-fmt-tofu / tf-fmt-all True duplicate; tf-fmt / tf-fmt-tofu evaluated under the hub rule (False positive); hub cluster {tf-fmt-all survivor, tf-fmt, tf-fmt-tofu}; Mode explicit pairs (hub pair does not change it); Pairs evaluated 3. |
| T6 triggers | (a) activate; (b) do not activate (performing a merge: writing-skills); (c) do not activate (writing quality); (d) activate (proposed new skill). |
| Output block (T1-T5) | Skills analyzed 15 (T1: 2, T2: 2, T3: 2, T4: 4, T5: 3, all distinct); Pairs evaluated 1+1+1+6+3 = 12; counts reconcile; clusters formed: 2 (T4, T5). |
