# Supplementary Devil's Advocate Audit — Writing-Skills Optimisation Execution

**Review basis:** 20 additional user-supplied records (16 Markdown reports, four JSON evidence/manifest/score records), assessed together with the earlier 2,951-line execution transcript and its 253-atom audit.
**Review status:** Evidence review complete; no user repository changes or new execution of Claude, skills, evaluators, hooks, linters, or benchmarks.
**Important distinction:** Most new files report *separate work* on 5–6 or 17 October 2026. They are not raw logs of the failed 17 October duplication-audit optimisation, and cannot establish the tokens consumed or prove its implementation was applied.

## 1. Updated verdict

1. **Keep the prior execution-process assessment at 38/100, provisionally.** These 20 reports do not supply token counters or new raw observations of the session-ending execution, so they do not justify retrospectively changing that process score. It was the prior reviewer's rubric judgment, not the `writing-skills` package score.
2. **Revise the diagnosis:** the parent `writing-skills` methodology was not missing wholesale. The 5 October full-package assessment describes a ten-stage workflow, a frozen per-file rubric, a RED/GREEN process, bounded optimisation and explicit NHR/hold gates. Its **54 assessed distributable files scored 98–100**, while broad target-runtime readiness remained **HOLD**. See `2026-10-05-writing-skills-package-review.md:1–20,22–61,206–239`.
3. **The primary optimisation subject in the failed transcript was another skill:** `skills/skill-duplication-audit/SKILL.md`. `writing-skills` supplied rubric/methodology and the merge handoff. Improving the parent must not be conflated with repairing every task-specific `skill-duplication-audit` rule.
4. **The demonstrated bottleneck is orchestration and evaluation governance:** repeated full-model loops, changing oracles/contracts, unstable candidates, weak evidence persistence, scarce completion capacity and confusion between a quality score and readiness. Those defects can occur even when the parent methodology is well designed.
5. **The two skill packages have an existing division of responsibility.** `writing-skills` owns requirements, scope, acceptance and evidence limits; `skill-creator` owns optional specialist grader/comparator, benchmark, reviewer, packaging and provider tools. The comparison explicitly says one shared owner, baseline and verdict—not two full competing reviews. See `2026-10-05-skill-creator-contract-corrections.md:36–55` and `2026-10-05-writing-skills-vs-skill-creator-swot-after-corrections.md:41–59,121–160`.
6. **Do not rescore or rediagnose the current repository on historical reports alone.** The present `writing-skills/SKILL.md`, `skill-duplication-audit/SKILL.md`, `skill-creator/SKILL.md`, their active authoritative rubric files, and executable evals were *not* attached as current source files. The reports provide their historical claims, not verified present contents.

## 2. Twenty-source inventory: relevance and evidence limits

| # | Attached source | Relevance | What it demonstrates / what it does not |
|---|---|---|---|
| 01 | `2026-10-05-hook-tests-python-review.md` | Analogous execution control | Test harness truth: **117 pass/16 fail**, with upstream guard and process-helper defects honestly left RED; zero-skip count did not erase failures (`:3–30,289–369`). Separate hook task, not a failure count for writing-skills. |
| 02 | `2026-10-05-python-code-review-performance.md` | Direct workflow-design analogue | Selected 72-hour cohort: four substantial reviews needed user diagnostic corrections; calls for exact analyzer provenance, qualified concise finals, scratch lifecycle and revision-bound evals (`:3–51,131–222`). Selected cohort, not population-wide failure rate. |
| 03 | `2026-10-05-python-report-contract-review.md` | Direct evaluator/report contract analogue | High score **96–97** coexisted with AMBER pressure state; findings include erroneous winner, fabricated failures, missing/pending data and malformed example JSON (`:3–29,130–217`). Do not equate format-valid reporting with semantic correctness. |
| 04 | `2026-10-05-render-graphs-review.md` | Supporting tooling | Refactor **88→97** with specific Graphviz/renderer tests; a Sonar server returned 403, independent reviewers hit capacity limits (`:10–36,140–191`). This is an example of honest tool-limited closure, not a reason to rerun full skill reviews. |
| 05 | `2026-10-05-skill-creator-contract-corrections.md` | **Direct** | C0–C12 identify composition ownership, frozen expectations, grader truth, schema/consumer agreement, evidence applicability and platform-specific boundaries; result **96/100, HOLD** pending current behavioral evidence (`:3–55,63–136`). |
| 06 | `2026-10-05-skills-ref-python-review.md` | Supporting tooling | Reviewed writing-skills parser/CLI/prompt/renderer tests; **85→96**, AMBER because exact Sonar/editor/independent reviewer evidence unavailable (`:3–35,63–184,184–247`). Avoid calling analyzer substitutes equivalent. |
| 07 | `2026-10-05-utils-python-review.md` | Supporting tooling | `skill-creator` YAML metadata parser **71→96**, still AMBER for Sonar/Pylance equivalence; effective YAML semantics and consumers matter (`:3–30,64–82,179–313`). |
| 08 | `2026-10-05-writing-skills-package-review.md` | **Direct** | Existing ten-stage workflow, frozen rubric, 54 file scores 98–100, 141 package tests, high quality but runtime **HOLD** (`:1–61,63–85,206–239`). Avoid rewriting proven contracts as new mandates. |
| 09 | `2026-10-05-writing-skills-vs-skill-creator-swot.md` | **Direct historical baseline** | Original **97/79** assessment, keep packages separate, preserve authoring vs tooling; creator defects and NHR readiness recorded (`:1–41,84–121,152–224`). This is a different snapshot/assessment from the corrected comparison. |
| 10 | `2026-10-05-writing-skills-vs-skill-creator-swot-after-corrections.md` | **Direct corrected comparison** | Current-at-that-date **95/96** under symmetrical evidence-gap cap, one owner/verdict, partial overlap / intentional composition, both NHR readiness (`:1–39,72–120,121–203`). Historical original scores are not overwritten. |
| 11 | `2026-10-06-python-code-review-retest.md` | Direct evidence-design analogue | Four targeted improvements applied; controlled comparison **17/18→18/18** gradable assertions; one of 19 registered criteria explicitly ungradable (`:1–40,46–115`). Further repeated tests should require discriminating value. |
| 12 | `2026-10-17-guard-wrapper-getopt.md` | Separate security implementation | Guard parser tests culminated in **322 hook passes** on Windows, with expected unsupported command forms clearly bounded (`:3–49,61–94`). Cannot be substituted for earlier hook-state or unrelated skill-eval results. |
| 13 | `2026-10-17-posix-editor-verification.md` | Separate environment verification | Linux/POSIX hook test **312 pass/10 platform skips**, editor check AMBER because Pylance/Sonar IDE incomplete (`:3–25,52–104`). A tool passes only the environment it actually exercised. |
| 14 | `2026-10-17-pre-tool-use-guard-completion.md` | Separate security implementation | Guard/wrapper/hook changes applied under distinct authorization; six tasks, with session activation remaining pending (`:3–38,40–85`). The failed skill review was right not to absorb that unrelated work. |
| 15 | `2026-10-17-python314-hooks.md` | Separate runtime migration | Version-pinned Python 3.14 path and **249** hook passes at that revision (`:3–35,37–86`); later totals changed after additional patches. Do not assemble one fictitious continuous result from incompatible revisions. |
| 16 | `2026-10-17-secret-scanner-diagnostics.md` | Separate analyzer remediation | Exact scoped Pyright/Ruff checks, differential behavior, and POSIX skip qualifications (`:3–20,22–79`). Useful provenance standard but not a writing-skills defect. |
| 17 | `2026-10-05-writing-skills-vs-skill-creator-evidence.json` | **Direct historical evidence** | Captures 54-file writing package hashes, 141-test run, original creator review and explicit limits. Its `final_verification` verifies local report/source consistency—not live Claude activation. |
| 18 | `2026-10-05-writing-skills-vs-skill-creator-swot-after-corrections-evidence.json` | **Direct corrected evidence** | Logs writing **141** tests, creator **169 + 253 subtests, 15 smoke**, source preservation and NHR limitations. `tokensave.saved_tokens=778` is an index/status datum, **not measured savings from the failed one-hour execution**. |
| 19 | `2026-10-05-writing-skills-vs-skill-creator-swot-after-corrections-manifest.json` | **Direct revision identity** | Manifest describes writing **54** owned files and creator **134** development-checkout files at that comparison revision; counts have different distribution meaning, so avoid treating all as runtime cost or uniform test subjects. |
| 20 | `2026-10-05-writing-skills-vs-skill-creator-swot-after-corrections-scores.json` | **Direct scoring integrity** | Fixed criteria, historical **97/79**, analytical common-cap baseline **94/79**, corrected **95/96**, and both readiness flags **NHR**. These are three different score bases, not a single raw score progression. |

**Evidence confidence:** Direct sources support the design/score/ownership findings as *historical recorded claims*; analogous reports support transferable control patterns; separate guard/environment files establish their own outcomes only. Raw current skill bytes, a complete token ledger, and actual current host activation were not supplied. Some Markdown reports reference external scorecard/evidence files not present in this upload; their reported tests were not independently rerun here.

## 3. New or strengthened findings (against the prior audit)

### S01 — High: enforcement gap, not absence of ten-stage policy

**Purpose:** make the parent method produce a bounded finished result, not merely a well-structured review.
**Evidence:** Existing writing-skills ten stages include RED→GREEN→test→validate→bounded auto-optimize, and declare NHR/hold (`writing-skills-package-review.md:48–61`). The later transcript nevertheless launched 22 agents, changed candidate semantics repeatedly and ended without closure (prior atomic ledger and transcript lines L1946–2951).
**Adversarial question:** Is adding another long optimisation rule to the parent SKILL useful, or would a small executable execution profile/runner be better?
**Fix:** Audit actual current parent instructions first. Add only missing enforcement: machine-checked manifest, budget/closeout checkpoints, evaluator eligibility and a stop state; use the existing rubric/testing references rather than duplicating them. Existing fixes F01/F04/F05/F10 own the gap.

### S02 — High: authoring owner versus evaluator/tool provider must be explicit

**Evidence:** Creator correction C0 assigns one baseline/change owner/verdict, and the after-corrections SWOT calls the pair **Partial overlap with intentional composition**, not a duplicate or a mandatory full merger (`skill-creator-contract-corrections.md:36–43`; `...swot-after-corrections.md:121–160`).
**Failure mode:** Both frameworks conduct independent full audits, duplicate score calculations, or produce two incompatible final results.
**Fix:** F13: a single orchestration/ownership map, optional creator tool calls only when they produce evidence unavailable locally, exactly one final verdict. No parallel all-in-one auditing by both skills.

### S03 — Critical: separate score types and apply symmetric evidence gaps

**Evidence:** 5 October original comparison 97/79, corrected common-baseline 94/79, corrected current 95/96. The correction explicitly harmonized validation deductions (V11) and preserved the original assessment (`...after-corrections.md:72–120`; `...scores.json` fields `published_historical_baseline`, `analytical_baseline_common_current_campaign_cap`, `totals`).
**Failure mode:** Misleading “score improved” headlines compare different assessor, candidate, rubric, evidence scope, normalization or reference version.
**Fix:** F14: record *which* score is shown: per-file authoring, integrated comparative, skill lifecycle, empirical test accuracy, runtime readiness or execution efficiency. Require `rubric_hash`, `candidate_hash`, `oracle_hash`, evidence coverage and comparison-basis ID for any before/after claim. Runtime NHR cannot be compensated by file quality score.

### S04 — High: previous evidence should reduce model work only when applicable

**Evidence:** 54 writing package files were hash-bound; creator correction preserved 134-file inventory and documented independent regressions (`writing-skills-package-review.md:1–20,206–239`; `skill-creator-contract-corrections.md:14–34`). Retest used 18 gradable assertions, not unlimited repeated full audits (`python-code-review-retest.md:1–40`).
**Failure mode:** Reopen already proven contracts after each score dispute, or blindly reuse historical PASS on changed bytes.
**Fix:** F15: evidence applicability index keyed by source/oracle/tool/config/host hash and behavior claim. Reuse unchanged deterministic checks and prior raw evidence; rerun only changed and risky dependencies. Historical summary without raw output can inform test selection but cannot substitute for required verification.

### S05 — Critical: mechanical correctness is not operational activation

**Evidence:** 54-file review 100 entrypoint/98–100 files but runtime HOLD; corrected SWOT 95/96 with both runtime NHR, despite 141 and 169 local passes (`writing-skills-package-review.md:1–20,206–239`; `...swot-after-corrections.md:152–203`).
**Failure mode:** PASS authoring grade ⇒ deploy, or mock selection PASS ⇒ real host loading/application PASS.
**Fix:** F16: separate activation/selection, loaded-body application, correctness of resulting artifact, and relevant host runtime gates. If current-host execution unavailable, declare `HOLD/NHR` and deliver a complete review without fabricating activation proof.

### S06 — Critical: evaluator contracts can produce authoritative-looking false answers

**Evidence:** Report review found a reporter choosing the wrong winner and fabricating failures; creator fixes addressed summary-to-Boolean truth and expectation ordering (`python-report-contract-review.md:130–197`; `skill-creator-contract-corrections.md:36–55`).
**Failure mode:** A rubric/JSON schema or aggregate count passes syntactically yet logically contradicts actual outcomes; changing expected results later hides the fault.
**Fix:** F17: deterministic score/grader preflight checking truth-vs-summary, missingness, ties, weights, exact pair/class totals, expectations frozen before runs and null/unknown treatment. Reject contradictory report production rather than asking an LLM to reconcile after emitting it. This augments F02/F06/F12.

### S07 — High: editor/analyzer provenance and final-message qualifiers matter

**Evidence:** Four-for-four selected Python review follow-ups needed user diagnostic corrections, and retest repaired analyzer evidence recording (`python-code-review-performance.md:3–16,131–222`; `python-code-review-retest.md:12–25`). POSIX editor verification remained AMBER notwithstanding tests (`posix-editor-verification.md:3–7,52–104`).
**Failure mode:** “Analyzer clean” on wrong files/mode/stubs, or “Pylance/Sonar fixed” inferred from a Pyright/Ruff proxy.
**Fix:** F18: for any tool-dependent acceptance claim record target-file count, executable/version, effective configuration, working directory, import/stub context, execution exit, and equivalence to user editor. Zero files analyzed cannot count as clean. Final summary must put missing/non-equivalent checks beside every PASS claim.

### S08 — Medium: unrelated guard/hook work has a documented independent lifecycle

**Evidence:** 5 October hook suite 117 pass/16 fail; 17 October Python 3.14 migration reported 249 passes; later guard wrapper 322 passes; POSIX verification 312 pass/10 Windows-only skips. These occurred after different authorized changes/environments (`hook-tests-python-review.md:289–369`; `python314-hooks.md:37–65`; `guard-wrapper-getopt.md:35–60`; `posix-editor-verification.md:13–25`).
**Failure mode:** Treat them as one continuous test total, fix unrelated security issues during the skill audit, or suppress a genuine separate risk.
**Fix:** Preserve separate change IDs, candidates, test platforms and security follow-up ownership. Include basic hook health as a preflight only if it can actually affect this optimisation's command execution. Existing F11 suffices.

### S09 — Medium: “tokens saved” is not measured process efficiency

**Evidence:** The corrected evidence JSON includes `tokensave.saved_tokens: 778` for an indexed status check, while the failed transcript has no model API/token ledger or billing data.
**Failure mode:** Claim a cost reduction from fewer model runs, a compact skill, or an unrelated cache metric.
**Fix:** F19: capture measured per-run input/output/cache tokens when available, plus evaluator count, total model requests, time-to-close and evidence artifacts. When counters are unavailable, report only observable proxies, and call expected improvements hypotheses.

### S10 — High: numerical acceptance thresholds must preserve the user’s exact operator

**Evidence:** Historical tasks in the attached materials use different requirements, including “above 95”, “exceeds 95” and “above 96”. A score of 96 satisfies `>95` but **fails** `>96`; neither score can by itself clear a readiness hold.
**Failure mode:** The executor silently changes `>96` into `≥96`, or optimises toward an internally assumed 95-point threshold after the user supplied another.
**Fix:** Encode `score_operator`, `score_target`, `score_scope` and `release_gates` in the frozen run manifest. Confirm a literal strict comparison mechanically, with tests for boundary values and NHR overrides. This strengthens F02/F14.

## 4. Overall causal assessment

**Directly demonstrated in the failed transcript:** repeated agent launches, weak incremental test value, floating candidate/grade/oracle, scoring confusion, late raw-evidence persistence and missing final closure.
**Corroborated by these reports:** framework already had many quality controls; user-selected Python reviews sometimes under-reproduced editor diagnostics; benchmark/report contracts once created false winner/missingness artifacts; corrected creator tooling now includes repairs to these categories; high score and readiness are intentionally separate.
**Not demonstrated:** that `writing-skills/SKILL.md` was itself the direct cause of Claude consuming its quota, any exact prompt/token cost, the current repository implementation state, a verified Claude provider activation campaign, or defects in the independent October security fixes.

**Changed attribution:** the next improvement should target *execution of the existing writing-skills method* and selective tool integration. A blanket re-authoring of the whole 54-file writing package is not justified by the added evidence.

## 5. Implication for the earlier 253-atom audit

Retain the original atom rows and original score unchanged as an immutable transcript-only assessment; do **not** relabel observations based on reports from different dates. Add this 20-source review as a separate evidence layer. If later work supplies the actual historical source hashes, original rubric/oracles and full raw transcripts, regrade only the specifically affected atoms and publish an explicit delta. No such regrade is claimed here.

## 6. Next action

Implement and acceptance-test F01–F12 from the original plan **only after** verifying the current SKILL already contains or delegates the proposed controls. Add F13–F19 from the unified v2 plan, preferentially as small references/eval scripts rather than a longer entrypoint. Freeze the test contract and source hashes; run one discriminating evaluation wave; close with a release-or-hold pack even when the target score is not reached. The owner must not start another unlimited “repeat until >95” campaign within one session.
