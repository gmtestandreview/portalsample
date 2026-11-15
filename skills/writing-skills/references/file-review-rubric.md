# File-level skill package review rubric

Load for an atomic, role-specific review of every first-party file in a skill
package. **A rubric explicitly supplied by the user takes numeric precedence for
every file within its stated scoring scope.** This reference supplies
file-inspection methods, not a competing numeric score in that case. If no user
rubric applies, use the fallback ten-criterion rubric below for file-level
scores and [audit-scoring.md](audit-scoring.md) for the default whole-skill
lifecycle rubric. Neither can override specification or deployment evidence
gates.

## Purpose and expected result

Identify each file's purpose, intended consumer, input/output contract, failure
behavior, validation method, and package dependencies. Challenge whether it adds
execution value or creates contradictions, unnecessary loading, false
confidence, or unsafe behavior. Produce evidence-backed criterion scores,
concrete findings, bounded corrections, and a fresh final file inventory.

Freeze the selected rubric, its applicable scope, weights, category scoring
anchors, and threshold **before** assessing files. Record the source of numeric
authority in the report. A requested score is a remediation target, never
permission to award unsupported credit.

## Numeric authority — choose once, before scoring

1. **Explicit user-supplied rubric:** Apply its categories, weights, scoring
   anchors and evidence states to each file the request places in scope,
   including support and reference files. Interpret each category against the
   file's delegated role and its verified consumer. Do **not** substitute the
   local ten-criterion weights, silently blend the schemes, or issue a second
   competing numeric total. Use the role-specific questions below as
   _unscored diagnostic checks_ only. For the supplied six-area Devil's Advocate
   rubric, `devils-advocate-rubric.md` records its questions, while the user's
   actual attached version is authoritative if they differ.
2. **Explicitly limited user-rubric scope:** Respect that limit. For file-level
   scores outside it, identify the separate rubric chosen before scoring; label
   those totals as distinct and never present them as scores under the user's
   rubric. Do not infer that a rubric for one file controls unrelated files
   unless the request establishes that scope.
3. **No applicable user rubric:** The ten-criterion rubric below is the
   default for first-party support files. The default whole-skill lifecycle
   rubric remains in `audit-scoring.md`; use the six-area local rubric only when
   explicitly selected.
4. **Conflicting or missing authority:** Report the exact ambiguity and score
   the reliably supported scope only. Mark affected totals `NHR` instead of
   claiming a completed comparison. A prior score under a different rubric is
   not a like-for-like baseline.

This routing must agree with `index.md` and the main `SKILL.md`. Changes to the
routing rule require a regression check for both a supplied-rubric case and a
no-user-rubric fallback case.

## Fallback 100-point rubric — only without an applicable user rubric

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

**Only when this fallback governs the score**, all ten criteria apply through
the role-specific interpretations below. A tiny protocol marker need not explain
itself if its verified consumer establishes its contract. For an inapplicable
fallback criterion, record why, exclude its maximum, normalize to 100, and round
the final result. For user rubrics, follow the user's own treatment of `N/A`,
rounding and scoring anchors instead. Missing evidence is not `N/A`.

## Credit and deductions

For the **fallback rubric only**, start from each criterion's maximum and apply
the deduction anchors below. When the user's rubric governs, use its anchors
instead. In both cases record a finding ID, requirement, file location, observed
consequence and justified correction; avoid double-counting.

- Full credit: role-appropriate evidence satisfies the criterion.
- Minor defect: lose 1 point when one localized defect has limited execution
  impact.
- Material gap: retain at most 74% of the criterion where a required contract,
  boundary, or evidence path is ambiguous or incomplete.
- Major defect: retain at most 49% where the core purpose cannot be performed
  reliably.
- Absent/contradicted requirement: retain at most 24%.

For the fallback, use integer points. `Supported` textual reasoning can
establish a document's contract; it cannot establish unexecuted script behavior,
activation rates, historical experiment results, or cross-client deployment
readiness.

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
2. Select and record numeric authority by the rule above. Freeze the applicable
   weights, anchors, request scope, threshold and role interpretations.
3. For every file, record purpose, consumer, goal, input/output contract,
   validation, expected result, and a realistic counterexample.
4. Ask: does this file's absence harm execution; can its example actually run;
   does it claim more authority/evidence than it has; can a consumer mistake a
   historical result for fresh readiness; does its failure branch lead to a
   concrete next action?
5. Inspect all owned files. Run available verifiers and independent
   representative evaluations. Do not infer file scores from the package
   average.
6. Score **only** the selected rubric's numeric criteria and identify blockers
   separately. Use the local diagnostic criteria unscored when superseded.
   Revise only when authorized; preserve provenance and unique knowledge.
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
Selected numeric rubric (source, version/scope, criteria, points, states):
P K C A U R V I M F diagnostics (unscored if user rubric governs):
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
