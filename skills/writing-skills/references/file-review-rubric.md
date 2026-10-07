# File-level skill package review rubric

Load for a scored review of every file in a skill package. Use the existing
[skill audit rubric](audit-scoring.md) for a whole-skill lifecycle verdict; this
extension assesses individual files by their actual role. It does not replace
specification requirements or deployment evidence gates.

## Purpose and expected result

Identify each file's purpose, intended consumer, input/output contract, failure
behavior, validation method, and package dependencies. Challenge whether it adds
execution value or creates contradictions, unnecessary loading, false
confidence, or unsafe behavior. Produce evidence-backed criterion scores,
concrete findings, bounded corrections, and a fresh final file inventory.

Freeze the rubric and acceptance threshold before scoring. A requested score is
a target for remediation, never permission to award unsupported credit.

## 100-point rubric

| Criterion                                      | Maximum | Full-credit evidence                                                                                                               |
| ---------------------------------------------- | ------: | ---------------------------------------------------------------------------------------------------------------------------------- |
| Purpose and boundaries (P)                     |      10 | One clear role; load/run condition and exclusions are understandable from the file or its documented consumer                      |
| Domain value and context cost (K)              |      10 | Necessary, reusable information/behavior with no material filler, duplication, or orphan content                                   |
| Inputs, outputs, and expected outcomes (C)     |      15 | Required inputs, resulting artifact/decision, success conditions, and limitations are explicit or enforced by a verified interface |
| Correctness and authority (A)                  |      15 | Claims/behavior match authoritative sources and local contracts; examples, evidence, and specification rules are distinguished     |
| Usability and discovery (U)                    |      10 | Intended consumer can locate and use the file; steps/examples/interfaces work without guessing hidden prerequisites                |
| Failure handling and proportional controls (R) |      10 | Relevant malformed/missing/unsupported cases and side effects are bounded; safeguards match actual risk                            |
| Validation and evidence integrity (V)          |      15 | Role-appropriate fresh checks exercise meaningful requirements; unsupported empirical/runtime claims remain explicitly unresolved  |
| Package integration (I)                        |       5 | Dependencies, references, callers, terminology, and results agree across the package                                               |
| Maintainability (M)                            |       5 | Ownership/update conditions are clear; provenance and intentional compatibility choices survive revisions                          |
| Mechanical integrity (F)                       |       5 | Appropriate parsing, formatting, links, packaging, and syntax checks pass                                                          |
| Total                                          |     100 |                                                                                                                                    |

All ten criteria apply through the role-specific interpretations below. A tiny
protocol marker is not required to explain itself in prose if its verified
consumer establishes its contract. If a criterion is genuinely inapplicable,
record why, exclude its maximum, normalize earned/applicable points to 100, and
round only the final result. Missing evidence is not `N/A`.

## Credit and deductions

Start from each criterion's maximum; subtract only evidence-backed defects.
Record a finding ID, affected requirement, file location, observed consequence,
and correction for every deduction. Avoid double-counting the same consequence.

- Full credit: role-appropriate evidence satisfies the criterion.
- Minor defect: lose 1 point when one localized defect has limited execution
  impact.
- Material gap: retain at most 74% of the criterion where a required contract,
  boundary, or evidence path is ambiguous or incomplete.
- Major defect: retain at most 49% where the core purpose cannot be performed
  reliably.
- Absent/contradicted requirement: retain at most 24%.

Use integer points. `Supported` textual reasoning can establish a document's
contract; it cannot establish unexecuted script behavior, activation rates,
historical experiment results, or cross-client deployment readiness.

Record `Verified`, `Supported`, `Failed`, or `NHR` per criterion. Never score an
unverified required runtime outcome as successful. Distinguish file quality from
the outcome a file truthfully reports: a faithful negative test or historical
failure record can be a high-quality resource.

## Role-specific evidence

| Role                      | Purpose/contract evidence                                                               | Required validation emphasis                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| SKILL.md entrypoint       | Activation contract, scope, workflow, authority, observable completion                  | Frontmatter/spec validation, representative activation/application, resource discovery, pressure/edge and regression cases       |
| Instructional reference   | Conditional load purpose, authoritative versus advisory claims, actionable outcome      | Source/claim review, runnable examples when relevant, cross-reference checks, representative task walkthrough/application        |
| Template/example          | Identified consumer; placeholders versus literal values; expected generated shape       | Filled representative example, required fields/gates, usable Markdown/code, preservation of input constraints                    |
| Script/library            | Verified callable interface, dependencies, output/exit/error behavior and side effects  | Representative execution, invalid/edge inputs, meaningful regression coverage; no testing by source-shaped assertions alone      |
| Test/eval definition      | Governing behavior, setup/isolation, expected result, discriminating failure conditions | Execution for deterministic tests; scenario/requiredness/evidence-contract review for reusable behavioral cases                  |
| Historical campaign       | Exact revision/time/scope, actual observations, provenance, unresolved evidence         | Internal consistency, trace/provenance availability, clear freshness limit; never rerun history or silently rewrite its outcomes |
| Configuration/lock/marker | Declared consumer/protocol, reproducible build/discovery role                           | Consumer/build/load check; package metadata/lock consistency and intended artifact inclusion                                     |

Long provider/source snapshots may retain unique authoritative material. Add
navigation and applicability boundaries instead of deleting specialized content
to meet an arbitrary size target. Runtime caches, environments, hook logs, and
other ignored execution state are not distributable skill resources; record
their exclusion explicitly.

## Review procedure

1. Inventory distributable files, including non-Markdown resources. Preserve a
   baseline and hash the revision actually assessed.
2. Freeze the rubric, requested threshold, and role interpretations.
3. For every file, record purpose, consumer, goal, input/output contract,
   validation, expected result, and a realistic counterexample.
4. Ask: does this file's absence harm execution; can its example actually run;
   does it claim more authority/evidence than it has; can a consumer mistake a
   historical result for fresh readiness; does its failure branch lead to a
   concrete next action?
5. Inspect all owned files. Run available verifiers and independent
   representative evaluations. Do not infer file scores from the package
   average.
6. Score each criterion and identify blockers separately. Revise only when
   authorized; preserve provenance and unique knowledge.
7. Revalidate affected contracts after the last relevant change, then rescore
   with the frozen rubric. Stop for genuinely missing authoritative evidence or
   unsafe/out-of-scope changes; report the unmet threshold rather than inflate
   it.
8. Publish a complete score table and exact evidence limits. The package meets a
   per-file threshold only when every applicable file does; new resources added
   during remediation must also be reviewed.

## Output contract

For each file record:

```text
Path and role:
Purpose / consumer / goal:
Inputs / expected outcome:
Validation and observed result:
Devil's-advocate counterexample:
P K C A U R V I M F points and evidence states:
Total / applicable maximum / normalized score:
Findings and deductions:
Revision / validation freshness / blockers:
```

The report must distinguish authoring quality, executable correctness,
historical evidence integrity, and deployment readiness. Record the minimum
individual score, not just an average. For a request that every file score
**over 96**, use **97/100** as the acceptance threshold after rounding. An
unresolved mandatory failure or required `AMBER`, `FAIL`, or `NHR` gate prevents
a readiness claim regardless of score. Scoring a faithful historical record
highly does not reactivate its old deployment recommendation.
