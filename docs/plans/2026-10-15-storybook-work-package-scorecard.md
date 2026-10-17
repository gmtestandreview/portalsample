# Storybook work-package readiness scorecard

Date: 2026-10-15 (Australia/Sydney). Source plan:
[Revised remediation plan](2026-10-14-storybook-coverage-and-mcp-remediation.md).
This scores plan readiness, not implemented behavior, test results or a coverage
percentage. The 2026-10-14 document-quality97/100 review and initial operational
scores remain historical. The earlier Pauli reassessment is historical too:
subsequent pressure review exposed additional gaps. All RT1–RT7 recommendations
are now incorporated; current pressure retest and reassessment are recorded
below. No implementation or runtime result is implied.

## Unchanged assessment rubric

| ID  | Criterion                   | Maximum | Full-credit evidence                                               |
| --- | --------------------------- | ------: | ------------------------------------------------------------------ |
| P   | Purpose/scope               |      10 | User outcome, sufficient indirect evidence, no unrelated change    |
| V   | Storybook10.6.1 correctness |      20 | Installed supported metadata/lifecycle/test-result semantics       |
| A   | Atomic execution            |      15 | Independent reviewable slices, precise inputs/files/outputs        |
| T   | Testing quality             |      20 | Intended RED, positive/negative/regression/isolation tests         |
| D   | Dependencies/sequence       |      10 | Shared capabilities/contracts precede consumers                    |
| S   | Safety/accessibility        |      10 | Local side-effect isolation, preserved gates, narrow rollback      |
| E   | Evidence/exit               |      10 | Current attributable results, truthful exclusions and claim limits |
| M   | Maintenance/effort          |       5 | Minimal machinery, explicit owner, realistic cost                  |
|     | Total                       |     100 | Every package must exceed95 independently; mean is insufficient    |

## Baseline and corrective changes

| Package | Baseline | Material correction                                                                           |
| ------- | -------: | --------------------------------------------------------------------------------------------- |
| T1      |       78 | Managed/externalCI lifecycle, command+endpoint derivation, boundedBDD, actualMCP schema       |
| T2      |       72 | ExplicitJSON/CLI contracts, all-inputfreshness, idempotence, code-only mjslint                |
| T3      |       83 | Four independent owner/default/version slices, honest controls, peer docs and stableID checks |
| T4      |       79 | Named maintainer approval/bootstrapMCP path, inheritedprop completeness, sevenverticalslices  |
| T5      |       84 | Perclaim sufficiency/negativecontrol, repeatedisolation, narroweddependencies                 |
| T6      |       78 | Sharedharness/networkregressions first, explicitparams/types/Apppatterns, independentroutes   |
| T7      |       83 | Shellclaimboundaries, capabilitydependencies, robustforwarding reassessment                   |
| T8      |       76 | Effective-tag acceptance sets, explicitlint, full/docsbuildcomparison, localnotCI verdict     |

## Historical independent review — before pressure testing

Reviewer: Pauli (independent subagent), two read-only rounds on2026-10-15. First
revised review scored T2 93, T5 94 and T8 92; its corrections were implemented
before reassessment. Final review found zero critical planning blockers and
approved the document99/100.

| Package | P /10 | V /20 | A /15 | T /20 | D /10 | S /10 | E /10 | M /5 | Final /100 |
| ------- | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ---: | ---------: |
| T1      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |        100 |
| T2      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |        100 |
| T3      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |        100 |
| T4      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |        100 |
| T5      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |        100 |
| T6      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |        100 |
| T7      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |        100 |
| T8      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    4 |         99 |

The final minor deduction was an estimate discrepancy between alternatives and
execution; it was aligned without claiming a higher score. Overall document
breakdown: P10/V20/A15/T20/D10/S10/E10/M4 =99/100. This document-wide judgment
is not the package average.

## Changes closing the deductions

- T1: same validated target drives command/browser/request/MCP; external mode
  omits webServer in CI; explicit focused timeouts; native structured per-ID and
  a11y evidence.
- T2: literal root globs, complete source/assets/config input set, precisely
  normalized and length-framed SHA-256; canonical manifest replaces raw
  contribution; negative fixtures and actual code-only mjs lint.
- T3: four independent ownership/default/version slices; subcomponents do not
  promise independent controls; stable IDs and supported fallbacks.
- T4: named maintainer-approved standalone Docs bootstrap and MCP requery before
  prop use; inherited API completeness and seven independent slices.
- T5: restored ten-row family/consumer table, individual conditional-state
  proof, negative controls and repeated isolation.
- T6: shared stable-router/MSW v3 regression capabilities precede independent
  routes; actual App patterns and returned parameter consumption.
- T7: precise shell boundaries and capability-level dependencies; forwarding
  reassessment preserves sufficient indirect coverage.
- T8: frozen-full-index/frozen-docs-index separation, fullIndexDigest-bound
  receipts, changed eligibility with same IDs negative, serial gates and
  local-versus-CI distinction.
- Historical task aggregation is explicitly superseded by the current dated
  eight-package artifacts.

## Current pressure revision and reassessment

The Red Team findings override the earlier unconditional readiness statement.
They are corrected in the authoritative plan and companion test/task artifacts:

- RT1: hash all dependency patches; validate applied patch/installer provenance.
- RT2: generate/edit documentation before freeze; rerun all qualifying gates on
  final inputs; reject pre-freeze results.
- RT3: require at least one meaningful required baseline for every renderable
  record; reject empty/all-unsupported or smoke-only state sets.
- RT4: revert dependent route/shell consumers before shared capabilities, or the
  complete dependency group atomically.
- RT5: delayed/rejected worker and eager import/loader negatives use inert
  transports and prove zero live sends.
- RT6: frame-local Docs handlers and overlapping conflicting-response cleanup
  tests; label iframe Controls limitations and test actual generated Docs.
- RT7: verify owned producer/install/child/native URL identity and enforce
  write-denied input freeze, including optional-root-file and A-to-B-to-A cases.

Current evidence: [pressure retest](2026-10-15-storybook-pressure-retest.md).
First pressure reassessment: Gauss scored the document93/100, finding two RT7
blockers (unassigned launcher and child-before-cold identity). These were fixed,
not waived. Final independent reviewer Boole approved the corrected planning
contract97/100 with zero critical blockers. Its nonblocking BDD environment and
owned-child reset clarification was applied without inflating the scores.

| Package | P /10 | V /20 | A /15 | T /20 | D /10 | S /10 | E /10 | M /5 | Current /100 |
| ------- | ----: | ----: | ----: | ----: | ----: | ----: | ----: | ---: | -----------: |
| T1      |    10 |    20 |    15 |    20 |     9 |    10 |    10 |    4 |           98 |
| T2      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    4 |           99 |
| T3      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |          100 |
| T4      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |          100 |
| T5      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |          100 |
| T6      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    4 |           99 |
| T7      |    10 |    20 |    15 |    20 |    10 |    10 |    10 |    5 |          100 |
| T8      |    10 |    20 |    14 |    20 |     9 |    10 |    10 |    4 |           97 |

Every package exceeds95 independently. Conservative deductions remain for
ownership/dependency transitions and maintenance effort in T1/T2/T6/T8; an added
clarification does not manufacture a higher score. Document-review rubric:
coverage15, files10, granularity8, tests15, specificity9, sequencing9, safety10,
usability9, framework7, minimality5 =97/100. This is distinct from the package
mean and is not a runtime quality or coverage measurement.

## Verification and limits

Target: every package >95, not merely the mean. Arithmetic and artifact checks
run after the final plan edits. Scores are reviewer judgments about executable
plans, not measurements of coverage, actual test passes, accessibility
conformance or production quality. A100 means no deduction found under this
rubric. No code implementation, server restart, commit or deployment was
performed. Before execution, rebaseline the current checkout and user changes,
obtain required approval/contracts and run all planned gates.
