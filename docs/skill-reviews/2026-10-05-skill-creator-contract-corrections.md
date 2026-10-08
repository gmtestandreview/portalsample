# skill-creator contract corrections

The demonstrated contract defects are corrected in the working package. **29
files changed or added; independent review approved the frozen candidate with no
unresolved findings.** Fresh checks in the final working location passed **169
regression tests, 253 subtests and 15 smoke tests**, with one existing Windows
skip.

The shared package rubric reassessment is **96/100**, up from the historical
**79/100**. The remaining deduction concerns missing current-revision behavioral
acceptance evidence. **Recommendation: hold** for release/readiness; the
requested local corrections are complete.

## Scope and exact revision

This is targeted remediation of C0–C12 from the
[original SWOT](2026-10-05-writing-skills-vs-skill-creator-swot.md), following
the [implementation plan](../plans/2026-10-05-skill-creator-contract-fixes.md)
and the invoked [writing-skills workflow](../../skills/writing-skills/SKILL.md).
The original comparison remains a historical baseline. No merger or runtime
activation expansion was introduced.

The [manifest](2026-10-05-skill-creator-contract-corrections-manifest.json)
lists all 134 inventoried package files and all 29 changed/new paths. SHA-256 of
the canonical frozen inventory is:

`4cf5a326061a762021b1fc5a24862942874d2d475e6c07c3aa9c07eb0c7abdf3`

All 134 applied file hashes match the independently approved candidate. Skill
name and decoded description are unchanged. All 54 writing-skills files and all
73 pre-existing creator development/evidence files remain byte-for-byte
unchanged. The inherited validation map is additionally preserved verbatim in
the dated development collection. The worktree
`fix/skill-creator-contracts-20261005` is retained as the recovery candidate.

## Defect closure

| Finding                         | Correction                                                                                                                                                                                                                                                     | Verification and limit                                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C0: composition ownership       | Entrypoint assigns one baseline/change owner/verdict; writing-skills owns authoring/review requirements, creator supplies selected eval/benchmark/package/runtime tools.                                                                                       | Instruction/consumer review; no automatic data adapter claimed.                                                                                                    |
| C1: contradictory grading truth | Aggregator counts actual Boolean verdicts and rejects inconsistent summaries or explicit null expectations. Absent legacy expectations remain usable with an explicit auditability warning.                                                                    | Both contradictory directions fail before valid aggregation; legacy regression remains green.                                                                      |
| C2: dependency ordering         | Define/refine/freeze expectations before metadata and execution; repair all step references. Qualitative empty expectations remain permitted.                                                                                                                  | Order and cross-reference checks; no inference that historical runs tuned expectations.                                                                            |
| C3: hook authority              | Replace obsolete blanket exit-code claims with event-specific structured JSON/context/decision guidance and review-date/source boundaries.                                                                                                                     | Checked against [official hook protocol](https://code.claude.com/docs/en/hooks); local hook enforcement remains outside this verification.                         |
| C4: comparison contract         | `expectation_results` optional when absent, strict when supplied; reconcile five-total example details and B's correctly rounded 5.3 score. Unrepresentable ties stop before writing comparison; callers skip analysis.                                        | Schema consumer and semantic example regression tests. No invented persisted failure shape.                                                                        |
| C5: evidence applicability      | Fresh eleven-schema record includes reproduction code, commands, runtime versions and exact source hashes. New development index separates older-description passes from interrupted current-description campaigns and annotates ambiguous pressure summaries. | Exact checker reproduced twice; history preserved, current acceptance NHR.                                                                                         |
| C6: archive hygiene             | Exclude environment/VCS/graph state through archive paths and resolved sources, using filesystem case semantics. Reject excluded required entrypoints before output writes.                                                                                    | Actual archive assertions, alias/case probes, prior-output preservation. Ordinary internal asset/entrypoint aliases and legitimate nested eval resources retained. |
| C7: navigation                  | Add targeted contents maps to craft, workflow, schema catalog and grader/comparator/analyzer protocols.                                                                                                                                                        | Real headings/anchors checked; false headings inside code examples removed from maps.                                                                              |
| C8: review UI                   | Query and trigger controls have row-specific accessible names; adding a query focuses its stable identity after sorting.                                                                                                                                       | Real Chromium DOM/focus execution; external requests blocked. No comprehensive accessibility certification.                                                        |
| C9: CLI errors                  | Expected JSON/type/I/O errors yield concise nonzero diagnostics and preserve existing outputs.                                                                                                                                                                 | Real subprocess invalid/missing/output-path cases; no traceback.                                                                                                   |
| C10: YAML semantics             | Safe YAML parsing decodes escaped strings and apostrophes; scalar-style-aware trimming preserves legacy block behavior. Mapping/types rejected; malformed-input errors expose only safe numeric position.                                                      | Equality/rejection tests and exact CLI probe; previous output preserved, one error line, no source snippet.                                                        |
| C11: provider applicability     | Separate pre-invocation metadata discovery, provider invocation controls and loaded-body application guidance.                                                                                                                                                 | Bounded against [official skill controls](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill); fixture matches do not prove natural activation.    |
| C12: resource paths             | Repair all eighteen related-file links and incorrect positive/path examples.                                                                                                                                                                                   | 156 local links/anchors resolve across sixteen runtime instructional documents plus the new development index.                                                     |

Independent review first found four additional contract counterexamples: an
internal alias leaked excluded state (IR-1), uppercase Windows state paths
bypassed exclusion (IR-2), malformed YAML repeated input snippets (IR-3), and
the first strengthened exclusion could produce an empty successful archive when
the entrypoint resolved into excluded state (IR-4). Each received discriminating
RED/GREEN coverage and an independent retained probe. Two localized Ruff
findings (IR-5/IR-6) were also corrected. All six findings are resolved at the
frozen hashes.

## Fresh evidence

Full commands, exit statuses, RED/GREEN observations, independent review
coverage and application checks are in the
[evidence record](2026-10-05-skill-creator-contract-corrections-evidence.json).
Commands below ran from `.claude/skills/skill-creator` after applying the
approved candidate:

| Check                                                                                                               | Observed result                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `python -B -m pytest "scripts/Regression tests" -q -p no:cacheprovider --basetemp <task-scratch>/final-root-pytest` | Exit 0; 169 passed, 253 subtests passed, one existing POSIX permission-bit skip on Windows; 7.11 s.                          |
| `python -B -m unittest scripts.test_regressions`                                                                    | Exit 0; 15 passed; 1.253 s. Expected malformed-directory/legacy auditability warnings exercised.                             |
| `python -B -m scripts.quick_validate .`                                                                             | Exit 0; skill valid.                                                                                                         |
| Ten changed/new Python resources: AST parsing and Ruff                                                              | Clean at frozen candidate; final files hash-identical.                                                                       |
| Targeted changed Markdown/JSON formatting and `git diff --check`                                                    | Clean at frozen candidate; final files hash-identical.                                                                       |
| Eleven JSON schemas                                                                                                 | Recorded hashes and parse/schema observations reproduced; Python 3.14.7, jsonschema 4.26.0.                                  |
| Independent spec then code/Python/security review                                                                   | 84 focused tests +54 subtests pass; one existing Windows skip; all 29 changed/new paths covered and all 134 hashes verified. |

Baseline suites had passed 143 regression tests +231 subtests and 15 smoke tests
despite the demonstrated defects. New negative fixtures expose those defects
before fixes; final green counts alone are not the justification for closure.
Skill-only changes do not call for unrelated application CI. No live provider
campaign, actual deployment, commit, push or PR was performed.

## Shared rubric reassessment

The scoring unit remains the **integrated package** under the original
ten-weight comparative adaptation of the
[file review rubric](../../skills/writing-skills/references/file-review-rubric.md).
Quality criteria and
[audit scoring](../../skills/writing-skills/references/audit-scoring.md) govern
evidence states and blockers. All ten criteria apply; no normalization. This is
neither an average of file scores nor certification that every creator file
exceeds 96. The prior 54-file writing assessment is unchanged.

| Criterion                                     |     Max | Earned | Evidence state                          | Basis                                                                                                                                                               |
| --------------------------------------------- | ------: | -----: | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P: Purpose and boundaries                     |      10 |     10 | Supported                               | C0: one owner, one baseline and one verdict; creator owns selected specialist tools.                                                                                |
| K: Domain value and context cost              |      10 |     10 | Supported                               | Distinct machinery retained; historical execution evidence excluded from runtime archive.                                                                           |
| C: Inputs, outputs and expected outcomes      |      15 |     15 | Verified / Supported                    | C2/C4/C10: freeze before execution, optional comparison expectations, correctly decoded YAML.                                                                       |
| A: Correctness and authority                  |      15 |     15 | Verified / Supported                    | C1/C3: actual verdict-count consistency tested; hook protocol source checked; illustrative comparison reconciled.                                                   |
| U: Usability and discovery                    |      10 |     10 | Verified / Supported                    | C7/C8: usable section maps, real Chromium names/focus behavior.                                                                                                     |
| R: Failure handling and proportional controls |      10 |     10 | Verified                                | C6/C9 and IR1-4: malformed input, archive aliases/case and required entrypoint fail safely.                                                                         |
| V: Validation and evidence integrity          |      15 |     11 | Verified locally / NHR runtime          | C5 provenance corrected and local checks refreshed. Retain material-gap cap (11/15) for required current-revision behavioral evidence; local passes cannot fill it. |
| I: Package integration                        |       5 |      5 | Verified / Supported                    | Producer/schema/caller contracts and 156 local links/anchors agree.                                                                                                 |
| M: Maintainability                            |       5 |      5 | Supported                               | C11: discovery versus loaded-body guidance scoped to providers; compatibility and refresh conditions recorded.                                                      |
| F: Mechanical integrity                       |       5 |      5 | Verified                                | C12: repaired paths, syntax/Ruff, Markdown/JSON style, validator and eleven schema checks pass.                                                                     |
| **Total**                                     | **100** | **96** | **Authoring/tool quality; runtime NHR** | **Required current-revision behavioral acceptance remains missing.**                                                                                                |

The original C5 provenance contradiction is resolved. The retained four-point V
deduction now explicitly applies the material-gap anchor to the required
uncompleted behavioral campaign; it does not treat schema/test passes as
activation evidence or count the same defect twice.
[Structured scores](2026-10-05-skill-creator-contract-corrections-scores.json)
record this reassessment separately from the unchanged original SWOT scores.

## Remaining evidence and disposition

The new
[applicability index](../../.claude/skills/skill-creator/evals/evidence-applicability.md)
records actual historical observations: after-exclusion training completed 0/20
attempts; holdout completed 0/16 attempts; near-miss completed 1/20, with
nineteen errors and zero of five cases passing. The older serial-final pass used
different description bytes. Past HTTP 429 records do not establish present
provider availability.

Current target-runtime activation/application and paired acceptance remain
**NHR**. Closing those gates requires a completed representative
current-revision campaign, actual invocation/output evidence and frozen
expectations; no empirical success is inferred from descriptions, hook examples
or local tests. The existing Windows permission-bit skip also limits
cross-platform claims. **Hold** remains the readiness recommendation; there are
no unresolved findings blocking the requested contract corrections.
