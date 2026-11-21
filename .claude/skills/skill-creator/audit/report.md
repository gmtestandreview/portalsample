# Skill Creator v4 — Atomic Devil’s Advocate Remediation & Rescore

**Decision: HOLD for production deployment.** This is an auditable source and
diagnostic-test improvement, **not** a Python 3.14 run or observed Claude host
activation. No files were scored higher merely to reach the threshold.

## Executive findings

| Measure                             | v3 frozen audit | v4 candidate |
| ----------------------------------- | --------------: | -----------: |
| First-party source files            |              74 |           79 |
| Files scoring strictly above 95/100 |              31 |           65 |
| At or below 95/100                  |              43 |           14 |
| Score range                         |           81–99 |        84–99 |
| Source files changed in v4          |               — |           43 |
| New first-party files               |               — |            5 |

The **39 of 43 originally flagged files with direct source edits** have targeted
remediation. Four original evidence artifacts were intentionally preserved
byte-for-byte: the three activation-case datasets and
`references/validation-results.json`. Additional annotations, test contracts,
and a fresh, clearly limited schema snapshot were added separately; freezing
those inputs prevents invalidating their original oracles or overwriting
history. Four already-above-threshold files also changed to close cross-file
regressions.

## Frozen scoring authority and method

| Category                     | Points | How applied to files                                                                 |
| ---------------------------- | -----: | ------------------------------------------------------------------------------------ |
| Purpose                      |     15 | A file fulfils a distinct role in the skill package                                  |
| Objective                    |     15 | Its producer/consumer contract, inputs and preservation boundaries are actionable    |
| Goal / Success State         |     15 | The delegated output has observable success and non-negotiable invariants            |
| Test Plan                    |     25 | Positive, negative, failure and regression oracles are appropriate for its file type |
| Self-Review Before Execution |     15 | The caller can challenge assumptions, provenance, risk and authority                 |
| Expected Output              |     15 | Expected artifact/result, evidence and failure representation are explicit           |

**Rubric and threshold frozen:** Six categories, 15+15+15+25+15+15=100; one
point granularity; `score > 95` requires >=96. We did **not** substitute the
fallback ten-category file rubric or change category weights. Tiny
config/evaluation files were assessed against their real consumer and delegated
role, not expected to duplicate the whole skill. Base scores carried over for
unchanged files where there was no new direct evidence; modified scores are
individual quality judgments supported by the source differences and executed
tests. These are **static content/contract-quality** scores. Observed behaviour,
unavailable evidence (NHR) and deployment readiness are recorded separately. A
high static score cannot clear a required NHR gate.

## Actual remediation

1. **Release pipeline handoff and false approvals:** `scripts/run_pipeline.py`
   now strips bookkeeping `id` before invoking `run_eval` (which rejects
   unexpected keys), while retaining IDs in persisted stage evidence. Existing
   fail-closed release checks remain. `test_run_pipeline.py` verifies the exact
   evaluator payload, ID preservation, worker forwarding, and adversarial
   incomplete/forged summaries.
2. **Stale evaluation and missing result controls:** The description and full
   resource digest now participate in activation/RED–GREEN checkpoint identity.
   A zero-exit process with no observable terminal event is not a successful
   RED/GREEN evaluation. Missing engagement and partial holdout are rejected or
   marked NHR rather than counted as success.
3. **Adversarial documentation:** The six-area scoring authority is now explicit
   for any selected file-level review, workflow and output examples have
   falsifiable acceptance/negative cases, and private holdout requirements no
   longer conflate the bundled public holdout with independent evidence.
4. **Browser and input validation:** The review UI gained accessible controls,
   offline support and XSS-safe observation tests. Both originally Node-only
   browser checks now run in Chromium through a Python Playwright fallback; new
   real-browser tests check inert hostile text, navigation persistence and
   offline feedback export. Description rewriting rejects duplicate tags and
   forbidden control characters; review inputs reject malformed identifiers and
   placeholders.
5. **Schemas and preserved evidence:** Six previously untested schemas now have
   positive/negative fixture pairs. All 11 schema definitions and their current
   hashes are checked. The old historical schema record is preserved and openly
   remains stale on eight hashes. A new diagnostic-only snapshot records current
   results without claiming Python 3.14 execution.
6. **Claude Code guidance:** External hooks, skip markers and rule-engine claims
   gained explicit fail-open risks and positive/near-miss checks; no missing
   hook code was invented, and external host behaviour remains NHR.

## Verification actually executed

| Check                                                                 | Outcome                                                      | Limits                                                                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Candidate source syntax/frontmatter (`quick_validate.py`, standalone) | PASS: `Skill is valid`                                       | Structural check, not activation                                                                                           |
| Full deterministic diagnostic regressions, Python 3.13.5              | **277 passed**, 1 skipped, 1 deselected, 415 subtests passed | Tests ran in a separate copy with two explicit 3.14 import guards disabled; the distributable source keeps its 3.14 guards |
| Pipeline integration regression (`test_run_pipeline.py`)              | PASS: 15 tests, 33 subtests                                  | Mocked Claude execution, no host assertions                                                                                |
| Browser UI using installed Chromium / Python Playwright               | PASS, included in 277 tests                                  | Not a complete accessibility or cross-browser audit                                                                        |
| All bundled Markdown links                                            | PASS: 0 unresolved                                           | Local files only; URLs and runtime-generated paths not proven live                                                         |
| Python parsing / JSON parsing                                         | PASS: 39 `.py` files / 17 `.json` files                      | Does not establish official 3.14 compatibility                                                                             |
| JSON Schema Draft 2020-12 definition validity                         | PASS: 11 schemas                                             | Semantic requirements beyond schema remain separate                                                                        |
| Schema snapshot vs source hashes                                      | PASS: all 11 match                                           | Snapshot explicitly diagnostic, Python 3.13                                                                                |
| `run_pipeline.py release --dry-run`                                   | PASS: plan emitted                                           | No model calls, not a release                                                                                              |
| Packaging with bundled `scripts/package_skill.py`                     | PASS: 79 first-party files                                   | Executed via Python 3.13 diagnostic copy, not 3.14                                                                         |
| Official Python 3.14 full suite                                       | **NHR: not run**                                             | Python 3.14 unavailable in this environment                                                                                |
| Actual Claude Code host selection, RED/GREEN and pressure tests       | **NHR: not run**                                             | Claude CLI and target host not available                                                                                   |
| Independently held private generalisation evaluation                  | **NHR: not run**                                             | Private data and independent evaluation unavailable                                                                        |
| External Claude Code hook/rules activation                            | **NHR: not run**                                             | Hook scripts and installed integration not shipped                                                                         |

Executed command for the complete diagnostic suite (on a copy of the source):

```bash
cd /mnt/data/skill_creator_remediation4/diagnostic-py313
python -m pytest 'scripts/Regression tests' scripts/test_regressions.py -q --disable-warnings -k 'not test_runtime_is_python_314'
```

The one deselected runtime-guard test checks the **required Python 3.14**
environment. It remains enabled in the distributable source; running it under
3.13 would fail by design. Runtime evidence cannot be inferred from the proxy
results. The skipped test and deselected test are not reported as passes.

## Remaining files at or below the strict >95 threshold

| File                                                  | Score | Why the score remains below threshold                                                                                                                               |
| ----------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `references/activation-cases/README.md`               |    94 | Documented each of 32 frozen activation positives/near-misses with NHR and public-holdout limit; no host measurements.                                              |
| `references/activation-cases/activation-eval.json`    |    94 | Frozen 20-case positive/near-miss oracle preserved byte-for-byte; companion file documents individual cases. Host activation remains NHR.                           |
| `references/activation-cases/activation-holdout.json` |    89 | Frozen public holdout remains useful for regression but is not independent/private; cannot claim generalisation without unseen host cases.                          |
| `references/activation-cases/activation-smoke.json`   |    93 | Frozen 4-case smoke corpus retained; strict case-contract and pipeline-handoff checks added. Small corpus cannot prove activation.                                  |
| `references/authoring-craft.md`                       |    94 | Added domain-specific positive/near-miss and failure-output checks; still partly generic with no target-host authoring comparison.                                  |
| `references/claude-code-advanced.md`                  |    91 | Aligned real package paths and documented missing hook implementation/host verification; proposed external mechanism remains NHR.                                   |
| `references/claude-code-hook-mechanisms.md`           |    91 | Added explicit absence/fail-open risk, blocking-or-advisory boundary and counterexamples; external hooks cannot be executed here.                                   |
| `references/claude-code-patterns-library.md`          |    93 | Added grounded positive and negative trigger pattern checks and regex regression proxy; no target-host rate measurement.                                            |
| `references/claude-code-skill-rules-reference.md`     |    91 | Added explicit skip-marker/guardrail checks and host prerequisites; skill-rules implementation not shipped.                                                         |
| `references/claude-code-trigger-types.md`             |    93 | Added trigger-type near-misses, regex proxy test and host measurement boundary; actual Claude activation NHR.                                                       |
| `references/claude-code-troubleshooting.md`           |    93 | Clarified missing-hook recovery and evidence boundary; external Node/Claude hook stack not available.                                                               |
| `references/independent-holdout-protocol.md`          |    94 | Preserved private independent holdout requirement and no data leakage. No private held-out host evaluation was supplied.                                            |
| `references/schema-validation-2026-11-17-py313.json`  |    92 | Fresh diagnostic schema snapshot with 11 matching hashes and fixture observations, explicitly Python 3.13 only; 3.14 NHR.                                           |
| `references/validation-results.json`                  |    84 | Historical evidence intentionally preserved unchanged. Eight source hashes are stale and cannot certify current schema contents; see new fresh diagnostic snapshot. |

**Remediation boundaries:** The three immutable activation datasets cannot be
credited with observed host trigger rates; the publicly shipped holdout is not a
private generalisation test. Claude Code hook references require real local hook
integration and host traces. The historical schema record must remain labelled
historical; the new snapshot verifies current definitions but is
diagnostic-only. Missing evidence is **NHR**, never `N/A` or a passing test.
Where corrections would require unprovided external code, credentials, source
authority or independent test inputs, no content was fabricated.

## Complete atomic file-by-file score register

Scores use `P/O/G/T/S/E` = Purpose (15), Objective (15), Goal (15), Test plan
(25), Self-review (15), Expected output (15). The detailed machine-readable
register contains original/candidate hashes, consumers, criterion deductions,
execution states and negative oracles for **all 79 files**.

| Path                                                           |  v3 |     v4 | Six criteria: P/O/G/T/S/E | Changed | Evidence-based note                                                                                                                                                 |
| -------------------------------------------------------------- | --: | -----: | ------------------------- | :-----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.python-version`                                              |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `LICENSE.txt`                                                  |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `SKILL.md`                                                     |  93 | **97** | `15/15/15/22/15/15`       |   yes   | Per-file scoring authority and explicit negative-release gates are integrated in the entrypoint. Host loading and 3.14 checks remain NHR.                           |
| `agents/analyzer.md`                                           |  91 | **96** | `15/15/15/22/14/15`       |   yes   | Removed ambiguous causal phrasing; added separate counterexample/traceable-evidence calibration contract. No observed agent-model calibration.                      |
| `agents/comparator.md`                                         |  95 | **96** | `15/15/15/22/14/15`       |   yes   | Explicit blind comparison contamination/identity challenge and evidence reporting. Independent model runs NHR.                                                      |
| `agents/grader.md`                                             |  95 | **96** | `15/15/15/22/14/15`       |   yes   | Explicit grader false-PASS negative oracle and evidence constraints. Human/model grading agreement NHR.                                                             |
| `assets/eval_review.html`                                      |  88 | **96** | `15/15/15/22/14/15`       |   yes   | Offline accessible status and controls; Chromium browser validation of review UI and focus. Broader accessibility audit NHR.                                        |
| `eval-viewer/generate_review.py`                               |  93 | **97** | `15/15/15/23/14/15`       |   yes   | Duplicate/missing run-ID input now rejected; deterministic regression coverage and browser-viewer integration exercised; 3.14 NHR.                                  |
| `eval-viewer/viewer.html`                                      |  88 | **96** | `15/15/15/22/14/15`       |   yes   | Real Chromium checks for XSS-inert text, feedback persistence and offline download; complete assistive-technology audit NHR.                                        |
| `references/activation-cases/README.md`                        |   — | **94** | `15/15/15/20/14/15`       |   new   | Documented each of 32 frozen activation positives/near-misses with NHR and public-holdout limit; no host measurements.                                              |
| `references/activation-cases/activation-eval.json`             |  94 | **94** | `15/15/14/21/14/15`       |   no    | Frozen 20-case positive/near-miss oracle preserved byte-for-byte; companion file documents individual cases. Host activation remains NHR.                           |
| `references/activation-cases/activation-holdout.json`          |  89 | **89** | `15/14/13/18/14/15`       |   no    | Frozen public holdout remains useful for regression but is not independent/private; cannot claim generalisation without unseen host cases.                          |
| `references/activation-cases/activation-smoke.json`            |  93 | **93** | `15/15/14/20/14/15`       |   no    | Frozen 4-case smoke corpus retained; strict case-contract and pipeline-handoff checks added. Small corpus cannot prove activation.                                  |
| `references/adversarial-quality-review.md`                     |  88 | **97** | `15/15/15/22/15/15`       |   yes   | Fixed numeric-authority conflict: explicitly selected six-area rubric governs all requested first-party files; NHR separate from score.                             |
| `references/authoring-craft.md`                                |  90 | **94** | `14/15/14/22/14/15`       |   yes   | Added domain-specific positive/near-miss and failure-output checks; still partly generic with no target-host authoring comparison.                                  |
| `references/claude-code-advanced.md`                           |  86 | **91** | `14/14/14/20/14/15`       |   yes   | Aligned real package paths and documented missing hook implementation/host verification; proposed external mechanism remains NHR.                                   |
| `references/claude-code-hook-mechanisms.md`                    |  82 | **91** | `14/14/14/20/14/15`       |   yes   | Added explicit absence/fail-open risk, blocking-or-advisory boundary and counterexamples; external hooks cannot be executed here.                                   |
| `references/claude-code-patterns-library.md`                   |  86 | **93** | `14/15/14/21/14/15`       |   yes   | Added grounded positive and negative trigger pattern checks and regex regression proxy; no target-host rate measurement.                                            |
| `references/claude-code-skill-rules-reference.md`              |  86 | **91** | `14/14/14/20/14/15`       |   yes   | Added explicit skip-marker/guardrail checks and host prerequisites; skill-rules implementation not shipped.                                                         |
| `references/claude-code-trigger-types.md`                      |  86 | **93** | `14/15/14/21/14/15`       |   yes   | Added trigger-type near-misses, regex proxy test and host measurement boundary; actual Claude activation NHR.                                                       |
| `references/claude-code-troubleshooting.md`                    |  88 | **93** | `15/15/14/20/14/15`       |   yes   | Clarified missing-hook recovery and evidence boundary; external Node/Claude hook stack not available.                                                               |
| `references/description-optimization.md`                       |  92 | **96** | `15/15/15/22/14/15`       |   yes   | Description checkpoint identity and negative cases strengthened. Live rewrite/holdout unrun.                                                                        |
| `references/evaluation-workflow.md`                            |  93 | **96** | `15/15/15/22/14/15`       |   yes   | Removed unsupported automatic-confirmation claim; enumerated host prerequisites and fail-closed evidence conditions. Live release NHR.                              |
| `references/independent-holdout-protocol.md`                   |  94 | **94** | `15/15/15/20/14/15`       |   yes   | Preserved private independent holdout requirement and no data leakage. No private held-out host evaluation was supplied.                                            |
| `references/output-patterns.md`                                |  81 | **96** | `15/15/15/22/14/15`       |   yes   | Replaced generic placeholders with readiness and change-report output contracts, falsifiable positive/negative oracles and NHR fields.                              |
| `references/schema-manifest.json`                              |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `references/schema-validation-2026-11-17-py313.json`           |   — | **92** | `15/15/14/19/14/15`       |   new   | Fresh diagnostic schema snapshot with 11 matching hashes and fixture observations, explicitly Python 3.13 only; 3.14 NHR.                                           |
| `references/schemas.md`                                        |  92 | **96** | `15/15/15/22/14/15`       |   yes   | Added current schema snapshot and semantic fixture links; historical hash mismatches disclosed rather than overwritten.                                             |
| `references/schemas/analysis.schema.json`                      |  94 | **97** | `15/15/15/23/14/15`       |   yes   | Preserved constraints and clarified semantic limits; positive/missing-required/unexpected-key fixtures executed; Python 3.14 NHR.                                   |
| `references/schemas/benchmark.schema.json`                     |  97 | **97** | `15/15/15/23/14/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `references/schemas/common.schema.json`                        |  96 | **96** | `15/15/15/22/14/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `references/schemas/comparison.schema.json`                    |  97 | **97** | `15/15/15/23/14/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `references/schemas/eval-metadata.schema.json`                 |  94 | **97** | `15/15/15/23/14/15`       |   yes   | Schema-specific positive/negative JSON Schema tests and limitations; current hash captured in diagnostic snapshot.                                                  |
| `references/schemas/evals.schema.json`                         |  94 | **97** | `15/15/15/23/14/15`       |   yes   | Malformed-evaluation fixture tests; cross-file duplicate IDs explicitly remain downstream semantic checks.                                                          |
| `references/schemas/feedback.schema.json`                      |  95 | **97** | `15/15/15/23/14/15`       |   yes   | Positive/negative feedback-schema fixtures plus actual Chromium feedback/download test; host 3.14 NHR.                                                              |
| `references/schemas/grading.schema.json`                       |  95 | **97** | `15/15/15/23/14/15`       |   yes   | Fixtures test structural boundaries and demonstrate arithmetic must be checked semantically outside schema.                                                         |
| `references/schemas/history.schema.json`                       |  94 | **97** | `15/15/15/23/14/15`       |   yes   | Malformed and valid history instance fixtures plus current schema hash evidence. CLI cross-file history flow NHR.                                                   |
| `references/schemas/metrics.schema.json`                       |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `references/schemas/timing.schema.json`                        |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `references/validation-results.json`                           |  84 | **84** | `15/14/12/16/13/14`       |   no    | Historical evidence intentionally preserved unchanged. Eight source hashes are stale and cannot certify current schema contents; see new fresh diagnostic snapshot. |
| `references/workflows.md`                                      |  81 | **96** | `15/15/15/22/14/15`       |   yes   | Replaced generic procedure examples with an actual Agent Skill editing workflow, decision branch, missing-input failure and rollback/test acceptance.               |
| `scripts/Regression tests/test_aggregate_benchmark.py`         |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_browser_viewer_py.py`           |   — | **97** | `15/15/15/23/14/15`       |   new   | Two real Chromium cases check XSS inert output, feedback persistence and download path; additional OS/browser matrices NHR.                                         |
| `scripts/Regression tests/test_comparison_schema.py`           |  96 | **96** | `15/15/15/22/14/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_eval_control.py`                |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_eval_review_ui.py`              |  86 | **97** | `15/15/15/23/14/15`       |   yes   | Both former Node-only browser cases now run in installed Chromium through Python Playwright fallback; Python 3.14 NHR.                                              |
| `scripts/Regression tests/test_generate_report.py`             |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_generate_review.py`             |  98 | **98** | `15/15/15/23/15/15`       |   yes   | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_improve_description.py`         |  91 | **96** | `15/15/15/22/14/15`       |   yes   | Added hostile model-output cases including duplicate tags and control characters; model rewrite quality NHR.                                                        |
| `scripts/Regression tests/test_init_skill.py`                  |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_package_skill.py`               |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_quick_validate.py`              |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_reference_contracts.py`         |   — | **97** | `15/15/15/23/14/15`       |   new   | Frozen activation input, adversarial scoring and hook-boundary regression checks executed; target-host activation NHR.                                              |
| `scripts/Regression tests/test_run_early_exit_eval.py`         |  87 | **96** | `15/15/15/22/14/15`       |   yes   | Expanded malformed/duplicate case, missing engagement and CLI tests; actual model early-exit behavior NHR.                                                          |
| `scripts/Regression tests/test_run_eval.py`                    |  96 | **96** | `15/15/15/22/14/15`       |   yes   | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_run_loop.py`                    |  90 | **96** | `15/15/15/22/14/15`       |   yes   | Added stratified frozen split and incomplete holdout NHR regression; no live tuning/holdout run.                                                                    |
| `scripts/Regression tests/test_run_pipeline.py`                |  99 | **98** | `15/15/15/23/15/15`       |   yes   | Strengthened mocked live handoff to prove case IDs are retained in evidence but removed from strict eval input; 15 pipeline tests pass.                             |
| `scripts/Regression tests/test_run_readiness_pressure_eval.py` |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_run_red_green_eval.py`          |  87 | **96** | `15/15/15/22/14/15`       |   yes   | Added false-success and source-digest invalidation cases; live without/with-skill comparison NHR.                                                                   |
| `scripts/Regression tests/test_schema_fixture_contracts.py`    |   — | **97** | `15/15/15/23/14/15`       |   new   | Six schemas tested with valid, missing-required and unexpected-key cases; arithmetic semantic gap explicitly tested.                                                |
| `scripts/Regression tests/test_utils.py`                       |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/Regression tests/test_viewer.py`                      |  90 | **96** | `15/15/15/22/14/15`       |   yes   | Added accessible review progress proxy plus separate actual browser security/feedback tests; full AT audit NHR.                                                     |
| `scripts/__init__.py`                                          |  97 | **97** | `15/15/15/22/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/aggregate_benchmark.py`                               |  97 | **97** | `15/15/15/23/14/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/eval_control.py`                                      |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/generate_eval_review.py`                              |  93 | **97** | `15/15/15/23/14/15`       |   yes   | Input/template ambiguity now fails closed and malformed placeholder tests pass; Chromium integration exercised.                                                     |
| `scripts/generate_report.py`                                   |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/improve_description.py`                               |  93 | **96** | `15/15/15/22/14/15`       |   yes   | Rejects duplicate tags and forbidden controls, new malformed-output tests pass. Live LLM reliability NHR.                                                           |
| `scripts/init_skill.py`                                        |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/package_skill.py`                                     |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/quick_validate.py`                                    |  98 | **98** | `15/15/15/23/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/run_early_exit_eval.py`                               |  91 | **96** | `15/15/15/22/14/15`       |   yes   | Fails closed on invalid cases; missing engagement no longer silently counts negative; expanded deterministic coverage.                                              |
| `scripts/run_eval.py`                                          |  95 | **96** | `15/15/15/22/14/15`       |   yes   | Checkpoint key now includes evaluated description plus effective file hash; stale resume regression passes; Claude host NHR.                                        |
| `scripts/run_loop.py`                                          |  92 | **96** | `15/15/15/22/14/15`       |   yes   | Incomplete holdout yields NHR, no false measured score; full digest propagation and deterministic tests pass.                                                       |
| `scripts/run_pipeline.py`                                      |  97 | **98** | `15/15/15/23/15/15`       |   yes   | Fixed integration defect: stripping case IDs for strict evaluator while preserving ID in stage evidence; positive and forgery regression tests pass.                |
| `scripts/run_readiness_pressure_eval.py`                       |  97 | **97** | `15/15/15/23/14/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/run_red_green_eval.py`                                |  91 | **96** | `15/15/15/22/14/15`       |   yes   | Requires observable terminal result instead of trusting exit zero; source-digest invalidation regression passes.                                                    |
| `scripts/test_regressions.py`                                  |  96 | **96** | `15/15/15/22/14/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |
| `scripts/utils.py`                                             |  99 | **99** | `15/15/15/24/15/15`       |   no    | No edit in v4; original file-specific evidence and static score retained. Existing tests rerun in Python 3.13 proxy; no host evidence added.                        |

## Deployment gates and recommendation

**Decision: `hold`.** Do not install as production-certified until Python 3.14
execution, required live model/host positive and near-miss activation, RED/GREEN
results, independent private holdout and relevant external hook checks are
observed, linked to the exact full-source hashes, and all necessary case
outcomes PASS. The v4 candidate represents a substantially stronger static
implementation, not a proved live release.

Artifacts supplied: installable `.skill`, source ZIP, atomic CSV/JSON score
register, manifest hashes, validation results and full diagnostic test log. The
source retains original skill identity (`skill-creator`) and does not contain
diagnostic runtime bypasses.
