# Unified Improvement Plan v2 — High-Assurance, Token-Efficient SKILL Optimisation

**Status:** Ready for a repository-based implementation review. **No source SKILL has been modified by this analysis.**
**Based on:** Original transcript atomic audit (253 atoms); existing F01–F12 plan; supplementary review of 20 October reports/evidence records.
**Delivery objective:** Finish one bounded run with a frozen, evidenced `RELEASE`, `HOLD`, `BLOCKED` or `RESOURCE STOP` decision; never spend all available capacity chasing a score and leave no usable result.

## 1. Core diagnosis and what not to do

Do **not** reopen all 54 `writing-skills` files by default. A 5 October review already documented the ten-stage workflow, red/green and evidence-freshness safeguards, 54 scores at 98–100/100, and a runtime readiness hold. These facts describe that historical candidate only. First inspect actual current sources and locate the missing *execution enforcement*, rather than reimplementing everything described in the historical report.

Do **not** merge `writing-skills` and `skill-creator`: the corrected October SWOT calls for intentional composition. Do **not** transfer the unrelated hook security changes into the skill optimisation workstream. Do **not** replace unavailable fresh target-client activation with a proxy pass. Do **not** turn `>96` into `>=96` (or `>95`) without an explicit user change.

The 38/100 prior grade measures execution/process quality, not current writing-skills authoring quality, and is not a new audit score for current SKILL bytes.

## 2. Existing work F01–F12: retain, deduplicate and implement only if missing

| Existing ID | Priority | Owner/target | Current treatment in v2 |
|---|---|---|---|
| F01 | P0 | Orchestration/execution profile | Mandatory bounded lifecycle, completion reserve and resource stop. Verify what the parent already says; enforce with runner/checkpoint. |
| F02 | P0 | `references/audit-scoring.md` and runner | Immutable rubric, candidate/assessor/evidence metadata; parametric exact score comparator. Integrate F14 score taxonomy. |
| F03 | P0 | Worktree / runner | Candidate hash frozen for every evaluation wave; stale results rejected after any edit. |
| F04 | P0 | Evals/test selector | One discriminating RED/GREEN by default; only incremental retests of changed invariants, not repeated full campaigns. |
| F05 | P0 | Delegation/orchestrator | One owner and, by default, at most one evaluator plus one independent adversary; extra model work must add specific evidence. Integrate F13. |
| F06 | P0 | Evals storage | Raw outputs, manifests, oracle, grade records and hashes persisted before summary claims; integrate F15 applicability. |
| F07 | P0 for affected target only | `skill-duplication-audit` | Formal pair/merge/graph/NHR/handoff invariant matrix. **Not** a blanket edit to the parent `writing-skills`. |
| F08 | P1 | Patch/test tooling | Scope-limited changes, line endings, deterministic lint/frontmatter/link checks; no full-skill rerun for text-only nonsemantic edits. |
| F09 | P1 | Resource index/loader | Canonical links and minimal evidence reads; do not invent missing references or dump whole resources. |
| F10 | P0 | Closing/reporting contract | Early closeout draft, last verified candidate, evidence, score and blockers; always deliver even on limit. |
| F11 | P1 | Scope owner | Separate in-scope, blocking prerequisite and unrelated security/hook findings. |
| F12 | P0 | Oracle control | Version expectations before RED; never edit expected answers after seeing GREEN without declaring a new oracle and invalidating comparisons. |

**Important:** `Already described in prior 5 October report` does not mean `proved present in latest repository` or `enforced in the failed 17 October execution`. Implementation requires an applicability check against current file hashes and the actual consumer of each instruction.

## 3. Evidence-driven additional fixes F13–F19

| ID | Priority | Action and owning layer | Acceptance condition | Source anchors |
|---|---|---|---|---|
| **F13** | **P0** | **Single owner + conditional tool dispatch.** Add a small responsibilities map to the execution profile: writing-skills controls audit methodology, requirements, scope, decision and final output; skill-creator provides selected grader/comparator/benchmark/package tools only when needed; target-specific SKILL owns domain rules. Forbid two parallel full audits using divergent rubrics. | Both entrypoints relevant ⇒ one baseline, one candidate, one canonical scoring decision, tools invoked only for an identified evidence gap, one final report. | `skill-creator-contract-corrections.md` C0; corrected SWOT boundary |
| **F14** | **P0** | **Score taxonomy + exact target.** Encode `score_kind` (`file_quality`, `skill_lifecycle`, `comparative_package`, `behavioral_accuracy`, `runtime_readiness`, `execution_process`); `rubric_hash`; `candidate_hash`; `evidence_hash`; user `operator`/`threshold`; normalization basis; evidence status. Keep readiness a separate mandatory gate. | A 96 score passes `>95` but fails `>96`; original SWOT 97/79 is preserved separately from normalized baseline 94/79 and corrected 95/96; a `NHR` runtime gate never becomes deploy PASS. | Package review; corrected SWOT and score JSON |
| **F15** | **P0** | **Evidence applicability/reuse index.** Every test report declares exact file hashes, tool/host/config, oracle, behaviors measured, dates, source of raw output and stale-on-change rules. Reuse prior deterministic evidence only if applicable; mark other results HISTORICAL/NHR. | Hash match + unchanged behavior/config can reuse bounded evidence; changed candidate invalidates affected checks; absent raw result cannot be promoted to Verified. | Full-package manifest; creator correction C5; Python retest |
| **F16** | **P0 for runtime claim, otherwise P1** | **Claim-matched activation acceptance.** Split metadata discovery, skill invocation/loading, instruction application, resulting task quality and provider runtime. Record `PASS/FAIL/NHR` separately; do not substitute synthetic trigger matches or local pytest for current Claude activation. | Local 141/169-test passes + high static score while current target invocation unexecuted ⇒ complete review but `HOLD/NHR`, not release. | Full-package hold; corrected SWOT C11 and gates |
| **F17** | **P0** | **Evaluator truth preflight.** At schema/aggregator layer reject summary-vs-Boolean contradictions, null/unknown-as-failures, invalid aggregates, spurious winner selection, ambiguous ties, malformed example JSON and missing grading coverage. Freeze expectations before model runs. | Each injected contradictory result fails deterministically before score/report generation; count invariants and per-criterion weights reconcile. | Creator C1/C2/C4; Python report-contract F1–F5 |
| **F18** | **P1 (P0 where editor diagnostics are user acceptance)** | **Analyzer applicability statement.** Before `PASS`, capture actual checked file count, tool/version, cwd, interpreter, stubs/imports, effective rules/overrides, return code and deviations from original editor. Concise final text must put missing equivalence beside the claim. | Zero-file Pyright clean run fails evidence gate; Ruff pass never asserts full Sonar/Pylance or editor equivalence; unknown analyzer remains AMBER/NHR. | Python performance F1/F2; 6 Oct retest; POSIX/editor review |
| **F19** | **P1** | **Model-cost and marginal-value telemetry.** Log actual input/output/cached token counters where surfaced, agent/model invocation count, repeated-case IDs, elapsed time and closeout reserve; when token counters unavailable, clearly label counts as proxies. Before starting another evaluator, require the exact new failure it can expose. | A test with identical cases, unchanged candidate and no identified uncertainty is skipped or explicitly justified. No unmeasured “X tokens saved” claim. | Failed transcript 22 launches; corrected evidence's unrelated 778 tokensave datum |

## 4. Recommended minimal implementation architecture

**Avoid adding pages of mandatory prose to an already reviewed parent entrypoint.** Prefer conditional references and executable checks. Verify present file layout first; the below is a proposed distribution, not an assertion that the paths currently exist:

```text
skills/writing-skills/
  SKILL.md                        # concise dispatch + closeout mandate only (if absent)
  references/
    optimisation-execution.md    # bounded owner/state machine F01,F05,F10,F13
    audit-scoring.md             # existing rubric; add score taxonomy/strict target only if missing
    evidence-applicability.md    # hash+host+oracle applicability (reuse or extend existing index)
  evals/
    optimisation/
      manifest.schema.json       # frozen contract (optional if existing schema reusable)
      cases/                     # discriminating acceptance cases
      oracle/                    # versioned expectations
      results/                   # candidate-bound raw & graded output
```

`skill-creator` retains its own specialist tool contracts; do not duplicate grading engine logic in writing-skills. `skill-duplication-audit/SKILL.md` retains pair/cluster semantic rules and domain regressions; only its own domain checks should change there.

### Proposed short entrypoint contract (adapt to present text, never blindly paste)

> For optimisation, select one accountable owner, freeze the candidate/rubric/oracle, and apply only the high-risk changes justified by evidence. Run bounded deterministic checks plus one discriminating evaluation wave. Delegate specialist benchmark/grader/packaging work to skill-creator only when necessary; do not run duplicate whole-skill evaluations. A static score is not runtime acceptance. If budget or tool capacity becomes insufficient, stop optional evaluation, preserve the last verified state, and produce a complete release/hold/blocked checkpoint with an exact continuation plan.

## 5. Execution state machine and practical budget

| State | Required artifact | Rule allowing next state | Budget control |
|---|---|---|---|
| 0 SCOPE | target paths, owner, exclusions, repository status | source and target actually accessible | no agents |
| 1 REUSE | prior evidence applicability table, last valid baseline | only usable evidence reused; stale items labelled | never rerun identical baseline merely for assurance |
| 2 FREEZE | source/rubric/oracle hashes, exact score operator | manifest mechanically validates | do not edit until wave finishes |
| 3 PATCH | minimal change list plus triggered test IDs | all changed rules have expected outcomes | max three coherent patch waves only if user set that cap; otherwise choose bounded cap explicitly |
| 4 CHECK | mechanical, schema, links, invariant and focused unit tests | local deterministic gates PASS or explicit BLOCKED | no LLM agents for arithmetic/schema/lint checks |
| 5 EVALUATE | one relevant GREEN; RED only if missing; one independent adversary | same candidate/oracle and expected checks; raw output persisted | 1+1 model evaluators default; add only justified cases |
| 6 DECIDE | comparative rubric score + separate release gates | release, hold, blocked, or resource stop | **reserve capacity for closure before optional wave** |
| 7 CLOSE | signed-off summary and continuation manifest | full report exists, even below target | stop further work in this invocation |

Do **not** invent a numeric token ceiling if tooling does not expose the quota. Use configurable maximum task count and a mandatory finalization reserve. If provider usage information is available, report exact counters and enforce the user's requested cap. If not, disclose that tokens are unmeasured.

## 6. New discriminating acceptance/pressure cases (supplement T01–T16)

| Test | Scenario | Expected disposition |
|---|---|---|
| **N01** | The audited writing SKILL scores 100 and local tests pass, but target-client invocation was never run. | Local quality PASS; runtime NHR and deployment HOLD; report still completes. |
| **N02** | Both writing-skills and creator trigger for one skill-authoring/benchmark request. | One owner/candidate/baseline/acceptance verdict; creator tools called only for chosen specialist steps. |
| **N03** | Original comparative scores are 97/79; current rebased 94/79; current corrected 95/96. | Preserve all bases, no straight-line 97→95 or 79→96 improvement claim without rubric/revision/basis. |
| **N04** | User requirement is `score >96`, evaluator returns exactly 96. | FAIL threshold; with 97 and zero blockers, pass the numeric gate; score success still cannot waive runtime HOLD. |
| **N05** | Expectation detail says 2 PASS/1 FAIL but aggregate reports 3 PASS or a different winner. | Deterministic aggregator rejects contradictory result, no report published with invented facts. |
| **N06** | Prior full evaluation uses same skill/oracle/config hashes, and no changed behavior is identified. | Reuse/hash-check applicable raw evidence; no repeated full RED/GREEN; explain new test only when discriminatory. |
| **N07** | Prior scorecard applies to a different candidate hash or editor/stub configuration. | Mark stale/not equivalent, schedule targeted recheck, do not say current verified. |
| **N08** | A Pyright pass analyzed zero files; `sonar analyze` returned 403; exact Pylance not run. | No “editor clean” or Sonar quality pass; scoped result plus NHR/AMBER. |
| **N09** | Hook baseline 117 pass/16 fail; 17 Oct Windows 322 pass; POSIX 312 pass/10 skips. | Report three separate revisions/platform test states; do not combine or retroactively rewrite the earlier failure. |
| **N10** | Remaining model quota is unknown/low; four agents are proposed; no final report exists. | Reduce/stop optional agents, commit evidence files to local output location, produce HOLD/resource-stop report and continuation. |
| **N11** | A `tokensave` status record says 778 saved tokens, but the failed 1-hour Claude run has no usage counters. | Do not claim net savings or token cost; report that this datum is unrelated and use task/agent counts as proxies only. |
| **N12** | A different, high-priority hook-security issue appears during an audit-only skill task. | Record separate owner and security follow-up; no scope expansion unless execution is blocked and the user authorizes it. |

**Grading rule:** Run every case against a frozen oracle and unchanged candidate; record at least a direct positive, a near miss, a known negative, an interruption and an environment mismatch. Model answers do not count as verified if underlying raw output is missing. A 12/12 answer with a stale oracle is not an accepted result.

## 7. Multi-dimensional acceptance contract

| Dimension | Required for quality result? | Required for release claim? | How to record |
|---|---|---|---|
| Authoring/file quality score | Yes if requested | Yes at specified exact threshold | `<score> / <max>, rubric hash, scope, assessor, deductions` |
| Real behavioral evaluation | When task requires behavioral change or comparison | Yes for relevant high-risk behavior | cases, raw result refs, oracle & candidate hashes |
| Operational activation in target host | When specifically claimed; otherwise explicitly NHR | **Yes if release depends on real target invocation** | provider, version, invocation/application/output evidence |
| Static/unit/security checks | Applicable subset | Required where risk/contract demands | command/tool/version/config, file count, exit, exceptions |
| Execution efficiency | Measured opportunistically | Should be monitored, not an artificial release substitute | model calls, elapsed time, actual token count if available |
| Closure | **Always** | **Always** | RELEASE/HOLD/BLOCKED/RESOURCE STOP, next step |

Threshold parsing must be literal: `>96` means 97–100 if integer scoring, **not** 96. `>95` means 96–100. A score above threshold does not erase an unresolved Critical/High behavioral defect or required NHR gate. Release readiness and completion of the *review* are different outcomes.

## 8. Next-run order (minimal effective sequence)

1. **Inspect** live `AGENTS.md`, the current parent skill, applicable references, the target-specific skill, `skill-creator` entrypoint, status and manifest; compare to the 5 October saved hashes if those can be obtained and verified. Classify controls as PRESENT/ENFORCED, PRESENT/NOT ENFORCED, MISSING, STALE or NHR.
2. **Implement only the gaps:** execution budget/closure, single-owner routing, rubric/test-oracle freeze, report truth, and evidence applicability. Do not change historic source/evidence to make numbers align.
3. **Run deterministic checks first:** hash/manifest correctness, valid frontmatter and links, exact score acceptance arithmetic, report schema/Boolean truth, duplicate counts and source/oracle freshness.
4. **Freeze candidate and run one informative evaluation:** reuse valid RED if suitable; one GREEN that exercises changed rules and one independent hostile audit; store full raw results. If they both pass, do not add multiple identical agents for assurance.
5. **Close:** deliver actual verified score, blockers, checks, source changes, owned external follow-ups and exact continuation. If user demanded `>96` and only 95 is achieved, deliver a complete HOLD/REVISE instead of running indefinitely.

## 9. Ready-to-run implementation prompt (repository execution)

> Use `skills/writing-skills` as the authoring/audit owner, `skill-creator` only as a specialist tool provider, and the target skill's own regression contract for its domain rules. Read the supplied original atomic audit, supplementary 20-source audit and unified improvement plan v2. Inspect the current repository and present SKILL/resource bytes before editing; identify which proposed F01–F19 safeguards already exist. Implement only justified gaps and preserve all unrelated changes.
>
> Freeze the target, scoring rubric, test oracle, configuration and candidate hashes before model evaluation. Preserve the user's exact score operator and threshold. Ensure grader truth checks and artifact manifests pass before delegated runs. Use one discriminating GREEN, an applicable RED if needed and one independent adversarial audit against the same frozen candidate. Do not spawn more reviewers without a specific unresolved critical finding. Keep static quality and real target-runtime readiness separate; a missing host test is NHR, never silently PASS.
>
> Capture raw results and measured token counters if available, otherwise report observable model/task counts as proxies. If resource pressure arises, stop additional tests and write the final release/hold/resource-stop pack with current verified hashes, score, blockers, changes, validation commands/results and a precise continuation prompt. Do not edit unrelated hook/security work, do not commit/push without request and do not present historical reported tests as fresh executions.

## 10. Reporting and remaining uncertainties

**Still not supplied as current sources:** the live `writing-skills/SKILL.md` and supporting resources, live `skill-creator` source, current target `skill-duplication-audit` source/oracles, raw test outputs for the failed session, and actual Claude API/token counters. Therefore every proposed source change is **PENDING VERIFICATION**, not already made.

**No new production-readiness grade is issued.** Historical reports had different scopes, fixed thresholds and candidate revisions. The earlier 38/100 execution-process grade stands as a historical reviewer assessment unless new direct execution evidence changes it. New F13–F19 are additive implementation requirements, not instructions to rerun all 20 historical projects.
