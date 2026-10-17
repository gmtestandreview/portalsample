# Devil's Advocate: Atomic Audit of the SKILL Optimisation Execution

**Review date:** 17 October 2026 (Australia/Sydney)
**Primary source:** `Pasted text(20261016-213146).txt` (2,951 lines; 324,950 bytes).
**Review boundary:** The attached transcript only. No repository checkout, API token-usage logs, hidden agent turns, or actual final files were supplied for independent execution.
**Actual subject of the transcript:** Mostly `skills/skill-duplication-audit/SKILL.md`; `skills/writing-skills` supplied the scoring rubric, validation guidance, and merge handoff, plus an index-path fix. This is an audit of the *skill-writing/optimisation execution*, not evidence that `skills/writing-skills/SKILL.md` itself was optimised.

## 1. Verdict

**Process-quality grade: 38/100 — FAIL as a delivery process.** This is the reviewer's process grade, **not** a score of the SKILL content. The last reported completed hostile audit of v1.1 was **82/100**, with a second auditor still outstanding. The v1.1 GREEN sample 1 scored **18/18** and its RED baseline **15/18**; those behavioural results do not establish a production-ready skill or a final score greater than 95.

The recorded clock window is **07:33–08:22**, or 49 minutes, plus initial work before the first visible timestamp. The user reported exhausting available Claude tokens in approximately one hour. The transcript does **not** provide token counters, prices, or a causal attribution of token limits; therefore, all cost savings and token-efficiency claims in this review are **hypotheses and future targets**, not measured savings.

**Delivery state at limit:** No final integrated verification, no final closed score, no completed second auditor/second v1.1 GREEN result in the visible source, and no final implementation handover. The end of the source is the session-limit notice (L2949–2951). A partial raw output for v1.1 GREEN sample 1 was recorded, but the raw-evidence suite was not complete at the time (L2908–2945).

### Process rubric (100 points)

| Dimension | Weight | Earned | Basis |
| --- | ---: | ---: | --- |
| End-to-end completion and acceptance | 20 | **4** | Latest score below target; final unresolved work and no closure |
| Purpose and scope discipline | 10 | **6** | Main skill maintained, but unrelated hook-security finding surfaced and iteration scope expanded |
| Sequencing and change-control | 12 | **5** | Several edits while audits were in flight; final patches frequently preceded unverified scores |
| Model/context efficiency | 15 | **2** | 22 agent launches, 77 explicit read events, repeat test/audit rounds, large file dumps |
| Behavioural test design and execution | 12 | **8** | RED/GREEN and pressure tests eventually added; some cases/oracles deficient |
| Scoring reproducibility/calibration | 10 | **3** | Self-estimated 90–94; independent scores 74–85 before v1.1 and uncalibrated comparability |
| Evidence provenance and persistence | 8 | **4** | Eval folder added late; early summaries lacked raw results and immutable oracle/version binding |
| Repository safety and minimal changes | 6 | **5** | Preserved unrelated dirty tree and reported no commits; lint checks done |
| Final reporting and continuation readiness | 7 | **1** | Long progress reporting but ended mid-review at session limit |
| **Total** | **100** | **38** | **FAIL** |

**Interpretation:** A process can produce meaningful edits and high behavioural pass counts while still failing the user's delivery objective. Scores should not be compared across rubric versions, files, evidence scope, agent context, or different test-case definitions without normalisation and explicit comparability proof.

## 2. Atomic audit method

The accompanying `skill_execution_atomic_ledger.csv` contains **253 graded atoms**, cross-referenced to transcript line ranges. It contains **202 event atoms** (22 subagent launches, 31 shell invocations, 4 explicit edits, 77 reads, 7 globs, 10 writes, 11 handbacks, 33 time/status checkpoints, 5 user-request markers, one baseline, one session-limit event) and **51 semantic decision atoms**. Each atom records purpose, expected output, visible actual output, grade **0–5**, diagnosis and applicable improvement IDs.

Grade interpretation: **5 = achieved and visibly verified; 4 = achieved within stated scope but conditional; 3 = partly substantiated; 2 = incomplete/inefficient or poorly controlled; 1 = material weakness; 0 = failed.** Routine tool events are explicitly graded against their *execution/evidence purpose*, not against invisible internal correctness. Repeated reads may be legitimate independent-agent isolation, so their repeat count is a **cost signal**, not proof that each one was wasteful. The ledger's event line ranges partition the visible transcript; the 51 decision atoms also overlay individual risk points. This is a complete audit of *observable activity*, not a fabricated reconstruction of Claude's private reasoning or hidden token consumption.

### Activity counts and significance

| Observable event type | Count | What the review can conclude |
| --- | ---: | --- |
| Subagent launches | **22** | Multiple rounds of duplicate-green, RED and repeated hostile reviews consumed model effort; marginal utility was not tracked |
| Explicit file-read events | **77** | Re-reading increased with concurrency; at least ten named reads of the primary skill are visible, spread across agents |
| Bash invocations | **31** | Edits, check commands, file dumps, fixes and evidence writes; includes at least one shell syntax failure |
| Agent handbacks | **11** | The transcript shows handback acknowledgements, but no reliable total subagent-token accounting |
| Explicit edits | **4** | Many other actual changes were made inside Bash scripts; this count is only tool labels, not all edited files |
| Write events | **10** | Raw-evidence saving was started late and did not complete before the limit |
| Globs | **7** | File enumeration performed during reviews; no established read-cache or max-output discipline |
| Reported times | **33** | Many status updates; no visible resource burn-down or reserve for closeout |

## 3. Execution chronology: intent versus delivery

| Phase / transcript | Intended outcome | Observed outcome | Grade /5 | Devil's Advocate judgment |
| --- | --- | --- | ---: | --- |
| P0, L1–27 | Establish baseline and fix small defects | v0.7 self-score about 90; three fixes; tests unrun; asset links incorrectly called missing | **2** | No verified baseline or immutable test oracle |
| P1, L28–105, 07:33–07:34 | Run RED/GREEN and repair paths | Both classified six pairs correctly; six index paths corrected; one GREEN run led to estimated 93–94/deploy recommendation | **3** | Tests were weakly discriminating and deployment call premature |
| P2, L106–304, ~07:39–07:43 | Pressure tests and hostile rubric review | Additional GREEN/RED/auditors; score 85; more rules added; prior scores and tests invalidated by edits | **2** | Failed change-freeze discipline; no measurement of marginal test value |
| P3, L305–438, ~07:46–07:50 | Repair contradictions, rescore and stop after 3 | Score fell to 74 then 78; last fixes untested; stop message correctly admitted unverified state | **2** | Optimisation introduced new contradictory rules; lacked contract tests |
| P4, L439–624, ~07:50–07:58 | Store evaluations and fix NHR/hub rules | `evals/` cases, expected, README, historical summaries created; no complete raw history | **3** | Good direction, but verification infrastructure arrived too late |
| P5, L625–1621, ~07:58–08:01 | Full v1.0 retest/rescore | Two GREEN, one RED, one hostile; RED 11/13; GREEN 12/13 and later 13/13 by reported cases; hostile 85; a test-oracle flaw emerged | **3** | Some attributable improvement; independent audit still found two High contradictions |
| P6, L1622–1945, ~08:01–08:08 | Fix six audit issues and recheck v1.0.1 | 1 GREEN check, score 79, retroactive PASS correction, raw-results gap; multiple unrelated files already dirty | **2** | Failed to stabilise rubric/oracle/version; final score below goal |
| P7, L1946–2228, ~08:12–08:15 | New cycle until >95 | User explicitly removed original cap; v1.1 generated, fourth case added; lint failure and two fixes; broader task launched | **2** | New instruction legitimately changed cap, but resource/closure plan was not recalculated |
| P8, L2229–2951, ~08:15–08:22 | RED, two GREEN, two hostile auditors, raw evidence, final decision | Five agents active; RED 15/18, first GREEN 18/18; Auditor 1 82 with seven new issues; second still pending; session limit | **1** | Progress without final verified product; most damaging failure |

### Score chronology: avoid a false improvement narrative

| Version/state | Claimed score | Evidence type | Comparable? |
| --- | ---: | --- | --- |
| v0.7 / early v0.8 | ~90, then ~92–94 | Self-estimate, not freshly scored | **No** |
| v0.8 | 85 | First hostile audit | Only weakly with later audits |
| v0.8 with first fixes | 74 | Re-audit caught new contradictions | No stable frozen contract |
| v0.9 | 78 | Hostile review before additional last-pass edits | No final-regression proof |
| v1.0 | 85 | Hostile audit; two High issues remained | Not deployment-ready |
| v1.0.1 | 79 | Hostile audit; high-severity handoff defect | Still below goal |
| v1.1 | 82 | Auditor 1; second auditor outstanding, raw evidence incomplete | **Not a final score** |

The reported audit scores were from different snapshots, sometimes with missing evidence or different grading interpretations. Progress in tests cannot be turned into a valid `>95` outcome by changing the rubric or simplifying cases.

## 4. Top root causes and counterarguments

**RC1 — The workflow optimised for score-chasing, not shipped acceptance.** The threshold dominated decision-making but lacked a fixed rubric, a frozen scoring snapshot and a budget-aware closure gate. Each audit found a new logical edge case, stimulating another edit and another round. **Counterargument:** High assurance legitimately merits adversarial work. **Response:** Adversarial work must be constrained to independent checks of a stable release candidate, with P0/P1 semantics guarded by deterministic tests and a credible stop condition.

**RC2 — Rule addition preceded invariant modelling.** The strict-subset, clique cluster, non-transitivity, hub exception, NHR count and handoff gate were patched independently. Fixing one exposed a contradiction in another (L314–334, L403–435, L1429–1438, L1924–1931). **Counterargument:** Edge cases are hard to foresee. **Response:** A single truth table/graph contract with machine-checkable invariants would have caught several before another paid hostile agent run.

**RC3 — Validation was too expensive and insufficiently discriminating.** The first RED and GREEN both scored six of six classifications; repeat baselines also handled pressure cases well (L87–100, L161–168). Yet the run repeated many of the same cases. RED/GREEN later found useful delta on subset and handoff, but the test selection policy did not measure information gain. **Counterargument:** Repeats test stochasticity. **Response:** Repeat only unstable/high-risk cases and do not automatically pay for another full RED or full-document read after a stable baseline.

**RC4 — The test oracle was not frozen.** R4 lacked specialization and was repaired after the run; the expected A–C classification shifted; a `13/13 PASS` was corrected to `12 PASS + 1 AMBER` (L1693–1697, L1934–1936). **Counterargument:** Fixing flawed fixtures is necessary. **Response:** Version tests and expected.md, invalidate earlier comparisons, and rerun only the affected cases on the same candidate.

**RC5 — Evidence was not a first-class output.** The `evals/` directory, historical summaries and raw output scheme came after many expensive runs, making reconstruction difficult. One auditor explicitly did not read a requested evaluation reference (L2741–2746). A long `cat` command printed entire files at L700 onwards; a shell command storing raw output later failed with an unexpected EOF (L2850–2851). **Counterargument:** Keeping all evidence can be expensive. **Response:** Store compact structured grades and only the raw outputs needed for reproducibility, with hashes and links; never re-send entire large files to the coordinator.

**RC6 — Parallelism amplified cost and version ambiguity.** The transcript launched up to five concurrent agents. Parallel validators can read the same large candidate, and earlier edits occurred while other agents remained in flight. **Counterargument:** Parallelism can reduce elapsed time. **Response:** It reduces latency only when independent, nonduplicative tasks operate on an immutable source and their combined output budget is controlled.

**RC7 — No protected completion reserve.** At 08:19 a GREEN result was in, but the second GREEN and second auditor were still pending; 08:22 reached session limit (L2937–2951). **Counterargument:** Claude cannot know exact platform token/session limits. **Response:** Use conservative observable proxies, closeout checkpoints, and mandatory artifact-writing before launching optional audits; when running low, halt optional work and emit final state with blockers.

## 5. Lessons learned log: prioritised

| ID | Severity | Evidence | Lesson | Preventive action | Fix |
| --- | --- | --- | --- | --- | --- |
| LL01 | Critical | L403–435; L1946–1949; L2949–2951 | A numeric target without resource guard can consume the whole session | Fixed cycle budget plus mandatory closeout reserve | F01 |
| LL02 | Critical | L1–22; L98–100; L406–413 | Do not use estimated or incomparable scores as release evidence | Versioned rubric, fixed weights, independent scoring | F02 |
| LL03 | High | L172–225; L359–420; L2229–2243 | Editing while tests/audits are running invalidates the snapshot | Freeze candidate and block mutation until agents finish | F03 |
| LL04 | High | L87–100; L160–168; L1409–1415 | RED and GREEN both passing easy cases provides little information | Select cases based on known failure modes and incremental information gain | F04 |
| LL05 | High | 22 agents; 77 reads; L625–637; L2229–2243 | More concurrent agents can multiply reads/cost without improving acceptance | One coordinator, one adversarial reviewer, targeted validator | F05 |
| LL06 | High | L581–620; L1934–1936; L2607; L2918 | Evidence stored only as summaries is not independently auditable | Per-run manifest, hashed input, oracle, minimal raw outputs | F06 |
| LL07 | Critical | L231–235; L314–329; L1429–1438; L1924–1931 | Local text patches created global logical contradictions | One canonical decision table and executable invariants | F07 |
| LL08 | Medium | L380–402; L1640–1658; L2201–2226; L2850–2851 | Brittle text substitution and large shell strings cause rework | Small patch changes, robust writes, lint and script smoke tests | F08 |
| LL09 | Medium | L21–22; L61–85; L700–705 | Asset discovery and full-file dumps can be wasteful | Canonical manifest and bounded path checks/reads | F09 |
| LL10 | Critical | L2937–2951 | A session is not successful until a final usable deliverable is written | Acceptance report and restart manifest before optional tests | F10 |
| LL11 | Medium | L295–300; L1892–1910 | Unrelated repository issues distract from primary goal | Scope ledger, preserve dirty user changes, no unrequested edits | F11 |
| LL12 | High | L1693–1697; L1934–1938 | An oracle repaired after results destroys longitudinal comparability | Immutable fixture version, invalidation and replay protocol | F12 |
| LL13 | High | L2741–2746 | An independent auditor may silently skip required references | Contract-check auditor read manifest; reject non-compliant audit | F05 F06 |
| LL14 | High | L1429–1438; L2908–2918 | 18/18 behavioural correctness and 82/100 structural quality can coexist | Separate behavioral, structural and operational acceptance gates | F02 F04 |
| LL15 | Medium | L439–624 | Build evidence harness *before* the optimisation marathon | Eval harness exists at run zero | F06 F09 |
| LL16 | Medium | L233–235; L482–500 | Formal classification and merge eligibility should not be conflated | Separate pair classification, merge graph, hold flags and handoff eligibility | F07 |

## 6. Which activities were useful, and which were not?

**Worth retaining:** Early paired RED/GREEN (provided ground truth); the independent hostile perspective (identified real contradictions); the test cases on strict subsets, hub clusters, transitivity and pressure; a persistent `evals/` folder; git change inspection; markdownlint; the explicit decision not to modify unrelated hook-security work.

**Reduce or eliminate:** Re-running the same six easy pair cases without a demonstrated failure signal; multiple full hostile audits before final edits settle; repeating broad file reads in the coordinator; generating lengthy status narratives in place of structured acceptance summaries; changing multiple semantic rules without a model-based test; claiming score gains without holding rubric and evidence constant; passing expensive multi-agent work into the end of the session without a closeout plan.

## 7. Improvement-plan reference

See `skill_optimisation_improvement_plan.md` for twelve implementable fixes with targets, detailed contract text, test IDs, success measures, priorities, dependencies and a next-run execution prompt. See `skill_optimisation_lessons_learned_log.csv` for an editable operational log. The atom-by-atom evidence is in `skill_execution_atomic_ledger.csv`.

## 8. Scope and verification disclaimers

- The source is a pasted conversation transcript, not an independent machine execution log. Any claims about file content, branches, commits, raw output, or scores are **what the transcript reports** unless a literal command/output is visible.
- The complete private token usage and billing cannot be reconstructed. The event counts **do not imply** an exact number of API calls charged or how much of the token budget each agent used.
- Numeric process scoring is an expert judgement with published weights, not a recovered rating issued by Claude. The atom ledger is a review working paper: standard read/write event grades are heuristic and distinguish visibility from actual correctness.
- A standalone audit of the current `writing-skills/SKILL.md` would require that actual file and its supporting resources. The plan here addresses the **optimisation execution workflow** and the affected `skill-duplication-audit` decision logic observed in the transcript.
