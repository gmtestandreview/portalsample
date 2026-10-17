# Implementation Plan: Make SKILL Optimisation High-Assurance and Token-Efficient

**Status:** Proposed changes; **not applied to the user's repository**.  
**Basis:** Atomic review of attached 2,951-line execution transcript (see companion report and 253-atom ledger).  
**Target:** The orchestration and optimisation instructions in `skills/writing-skills/SKILL.md` and/or its authoritative optimisation resource(s); relevant rules and evaluators under `skills/skill-duplication-audit/`. Exact insertion points must be verified from current repository files before editing.

The user wants both thorough Devil's Advocate testing **and** a finished answer. The answer is **not** to eliminate challenge: it is to deliver the *minimum additional independent evidence* needed to reach a frozen acceptance standard, then stop or preserve a ready-to-resume checkpoint.

## 1. Priority matrix and actionable fixes

| ID | Priority | Target | Concrete change required | Acceptance evidence |
| --- | --- | --- | --- | --- |
| **F01** | **P0** | `writing-skills` optimisation execution instructions | **Budget- and closure-aware state machine:** preflight → baseline → select cases → patch → verify → adversarial audit → final decision. Allocate a completion reserve *before* launching optional agents; enforce explicit max cycles, runs and delegated tasks per cycle; if user asks to continue until threshold, checkpoint and resume across sessions rather than assuming one session has unlimited capacity. | An artificial budget-exhaustion test stops optional agents, writes all outputs and a continuation manifest; no unfinished blind loop |
| **F02** | **P0** | `references/audit-scoring.md` + optimisation instructions | **Immutable, calibrated rubric:** record rubric ID/hash, weights, N/A denominator, evidence state, threshold and assessor at baseline. Independent scores only comparable with same rubric, same artifact scope, same versioned evidence. Gate release on score **>95**, zero blocking severity findings and final regression PASS. Do not project score improvements. | Same frozen candidate rescored gives traceable per-criterion evidence; contradictory scores trigger reconciliation instead of new edits |
| **F03** | **P0** | Optimisation instructions + repository workflow | **Immutable candidate gate:** snapshot file list, git status and content hashes; never edit files while an agent is reading/evaluating that candidate. All auditors use a pinned snapshot; patches create a new candidate/version and invalidate earlier post-change claims. | Mutation-during-audit simulation is blocked or causes automatic cancellation/invalidation of stale runs |
| **F04** | **P0** | `evals/README.md`, test selection | **Risk-targeted test portfolio:** one concise RED baseline, one GREEN candidate, and *one* hostile review initially. Add a case only for an uncovered invariant, discriminating failure or changed behavior. Do not repeat a passing full baseline merely because another round begins. Final targeted regression and one compact smoke suite. | Case selection manifest shows why each test runs, what novel failure it can detect and whether it is redundant |
| **F05** | **P0** | Subagent/orchestrator instructions | **Delegation contract:** default to 1 independent auditor plus 1 evaluator; use a second auditor only for disputed P0/P1 findings, rubric disagreement or complex security. Require source hash, allowed files, prohibited writes, max response size, rubric/expected version and explicit read acknowledgements. Do not use five-way fan-out by default. | Agent returns structured metadata and cannot be accepted if an authoritative reference was skipped; max concurrency policy tested |
| **F06** | **P0** | `evals/` and results data schema | **Evidence-first harness:** create `cases/`, `oracle/`, `results/`, `run-manifest.json`, and `raw/` before any tests. Store immutable expected-case version, exact skill hash, file paths, arm, checker, run ID, stdout artifact path, timestamp and PASS/AMBER/FAIL/NHR. Results are generated from raw evidence, not memory. | Fresh reviewer reconstructs 100% of classifications and count checks from saved inputs/results; raw write-failure test detects absence |
| **F07** | **P0** | `skill-duplication-audit/SKILL.md`, validation cases | **Formal decision model and invariants:** separate pair classification from merge eligibility; encode strict subset, specialized subset, contradictory guidance, complementary tasks, false-positive siblings, hub cluster, non-transitive graph, NHR hold and explicit-confirmation handoff as a table/graph. Do not patch rules independently; require full truth-table and graph regression for every semantic edit. | Every rule has a positive, negative, near-miss and combination case; no reachable contradiction; hub handoff and NHR counts tested |
| **F08** | **P1** | Editing/check scripts | **Small-patch hygiene:** check existing diff; touch only in-scope files; run deterministic static validation after each patch; avoid fragile shell heredocs and broad string replacement where a structured patch works. Do not treat markdownlint as semantic proof. | Line endings retained; no unrelated file changes; lint, frontmatter, links and invariant tests pass; failed writes leave no partial artifact |
| **F09** | **P1** | Index/reference loading | **One-time manifest and bounded reads:** enumerate actual assets before declaring missing links; keep one canonical resource manifest, read only changed/different relevant sections, and pass short evidence extracts to agents. For independence, agents may independently read necessary files from the same frozen snapshot, but must not dump entire docs into coordinator output. | Broken assets caught by path checker; no whole-tree/whole-document dump unless justified and logged |
| **F10** | **P0** | Completion contract | **Mandatory delivery pack:** even below the target score, report actual final candidate version/hash, files changed, verifier status, measured score and denominator, unresolved P0/P1, last verified state, raw evidence pointers, committed/uncommitted status, and an exact continuation command/prompt. Start composing it before the final optional run. | Simulated interruption yields readable acceptance/hold report and a restart step that does not repeat existing work |
| **F11** | **P1** | Scope safety | **No opportunistic unrelated fixes:** classify each finding as in-scope / blocking dependency / external; record external items in a follow-on backlog and preserve existing user changes. Do not mix `pre_tool_use.py` remediation with skill audit unless a direct blocker is shown. | Dirty-tree and unrelated-high-severity test touches only approved paths and records external risk |
| **F12** | **P0** | Eval oracle and scores | **Immutable oracle/version migration:** never silently edit expected.md after observing results. A flawed test becomes superseded with reason and new oracle version; affected prior grades become incomparable or are recomputed against the *original* oracle. Replay affected cases with new oracle on the same frozen candidate. | R4 evidence flaw and A–C expected-label-change simulations produce a provenance warning, not an unjustified green improvement |

**Order matters:** F01/F03/F06/F12 before another optimisation; F07 before complex semantic fixes; F04/F05 before launching expensive runs; F02/F10 before declaring completion. F08/F09/F11 are hygiene controls that should be applied alongside the first batch.

## 2. Proposed explicit additions to SKILL.md (ready for review and adaptation)

The following are **recommended contract text**, not assertions about current file wording. They should be inserted at appropriate existing sections, not blindly appended as duplicate policy.

### A. Optimisation execution contract

```markdown
## Bounded optimisation execution

Before changing files, write an execution manifest recording:
- target skill and owned supporting resources; explicit exclusions
- immutable baseline candidate hash and changed-file inventory
- authoritative rubric ID/hash, weights, normalization and release threshold
- required output artifacts (changed files, tests, review, final report)
- iteration limit and evaluation/delegation budget for this session
- latest known session/resource constraints and closure reserve
- unresolved severity-ranked findings and their acceptance tests

The process has six stages: BASELINE, PLAN, PATCH, VERIFY, AUDIT, CLOSE.
Do not re-enter PATCH solely because a reviewer offered a cosmetic suggestion.
A finding must have a severity, contradictory source or failing acceptance test,
minimal proposed fix, and verified downstream impact before it enters PATCH.

No file may be edited while an agent is reviewing that candidate. If the
candidate changes, its previous post-change checks become stale.

If the user asks for quality above a threshold across multiple cycles, honor
the quality objective while respecting available execution resources. When
one-session completion is not feasible, stop optional work and produce a
versioned checkpoint and exact next-session continuation plan. Never claim
completion solely because a numerical estimate is high.
```

### B. Agent and test budget

```markdown
## Evaluation selection and delegation

Default first-cycle evidence:
1. Run deterministic lint/schema/link/invariant checks locally.
2. Run one RED baseline on a small high-risk portfolio if not already available.
3. Run one GREEN evaluation on the identical frozen cases.
4. Run one independent adversarial review against the same candidate hash.

Additional RED samples are required only if the baseline is unstable, cases
changed materially, or a new behavior class is introduced. Additional GREEN
samples target failed, newly modified, or flaky cases. A second hostile auditor
is conditional on critical unresolved findings or meaningful rubric disagreement.
Do not launch overlapping full reviews simply for reassurance.

Delegated tasks must specify: exact version/hash, minimal allowed file set,
read-only status, expected/oracle version, format, output size, and raw-result
path. Reject incomplete auditor results that skipped mandatory inputs. Prefer
short structured outputs with cited file and line evidence over full file dumps.
```

### C. Fixed scoring and acceptance gate

```markdown
## Scoring and release decision

Score the same candidate using the same frozen 100-point rubric and N/A
normalization. For each criterion report: weight, earned points, evidence
level, source file/line or test run, and open defects. Historical scores are
non-comparable if the rubric, case oracle, candidate or evidence set differs.
Do not present estimated post-fix scores as audited results.

A release recommendation requires:
- independently audited normalized score >95/100;
- zero unresolved Critical/High semantic, safety, or correctness blockers;
- all deterministic contract checks PASS;
- final regression on the exact final candidate PASS;
- case/oracle version and raw evidence saved;
- working-tree changes and deployment/rollback impact reported.

If any gate fails, the result is HOLD/REVISE with a precise next action, not
DEPLOY. A passing GREEN classification suite is not a substitute for this gate.
```

### D. Closure contract (must execute even on exhaustion)

```markdown
## Mandatory end-of-run handover

Reserve the final execution slice for closure. Before another optional review,
confirm that sufficient time/resource remains to write the handover.
At the close of each session write:
- final/last-verified candidate hash and version, changed-file list and git state
- baseline and latest comparable audited score, rubric ID and evidence status
- PASS/FAIL/NHR checks and exact unresolved blockers
- raw artifact locations and any known data missing from them
- next smallest actionable fix and validation to rerun
- stop reason (accepted / blocked / iteration cap / session/resource cap)
- exact continuation prompt that restarts from the last verified checkpoint

Do not begin another multi-agent wave if this handover has not been saved.
```

### E. Pair classification versus merge eligibility (target-specific)

```markdown
## Classification, graph and release invariants

Evaluate each requested or required pair once on its own evidence. Store its
class independently from a merge recommendation and from hold flags.

Pair classes must be mutually exclusive: True duplicate, Partial overlap,
Complementary, False positive, Needs Human Review. A contradiction in merge
guidance can hold a merge without silently rewriting the pair classification.

Construct candidate merge groups only after classifying the relevant pairs.
A hub exception is eligible only when each narrow specialist is a strict
unspecialized subset of the survivor and no contradictory requirements exist.
A non-duplicate sibling pair must still be evaluated and counted, but its
label is not automatically converted to True duplicate. Preserve all outside
boundaries and unique safe behavior on the eventual survivor.

The classification counts partition evaluated distinct pairs. The NHR hold
flags form a separate overlapping dimension and must never be added to the
classification sum. Output the number of distinct skills, distinct evaluated
pairs, excluded pairs and held groups with machine-checkable identifiers.

Handoff/merge permission is a separate gate: evidence-based eligibility,
preservation inventory, zero unresolved contradictions, and explicit user
confirmation after the analysis, not before. Do not perform a merge as part
of a classification-only skill.
```

## 3. Tests to add before the next expensive multi-agent run

All tests require (a) one independent input and expected outcome, (b) immutable candidate and oracle hashes, (c) raw evidence, (d) machine-checkable counts or state transitions, and (e) a post-run status.

| Test | Scenario | Expected behaviour | What it would have caught |
| --- | --- | --- | --- |
| T01 | User says “keep going until >95”, budget is low | Generate checkpoint and resume; do not start another optional wave | 08:22 session-limit cliff |
| T02 | RED and GREEN both 6/6 | Stop repeated baseline; choose new discriminating cases or close | First-case redundant full retests |
| T03 | R4 test oracle lacks specialist content | NHR/test-fixture-defect, no post hoc PASS; version oracle | R4 changed evidence after results |
| T04 | A–B True duplicate, B–C True duplicate, A–C False positive (hub) | Preserve pair labels; hub only when exact guard holds | Clique/hub contradictions |
| T05 | Hub with conflicting safety instructions | Hold merge, classify pairs independently; report conflict | False hub-merge eligibility |
| T06 | Handoff for hub after confirmed user decision | Gate permits survivor–member pairs; excludes sibling exception | v1.0.1 handoff dead end |
| T07 | NHR pair also held for merge | Classification totals equal pairs; NHR flags outside sum | High count double-count issue |
| T08 | Auditor omits required scoring reference | Reject/re-run auditor, not a valid completed audit | v1.1 A1 skipped source |
| T09 | Mutate SKILL while GREEN agent running | Reject mutation/cancel stale agent; exact hash must match | Floating candidate reviews |
| T10 | Raw-write `unexpected EOF` | Atomic write fails visibly and no results claim PASS | Lost evidence during v1.1 |
| T11 | High-severity unrelated hook finding | Record external risk, no scope expansion | Hook-security tangent |
| T12 | Historic score 90 estimate, hostile 78 | Mark incomparable without stable rubric/assessor | Artificial “improvement” narrative |
| T13 | Exhaustive four skills | Six distinct pairs; one-line false positives; exact sum | Pair count confusion |
| T14 | Repeated pair across case files | Deduplicate pair IDs with source references; no hidden omissions | 15/16/27 pair count mismatch |
| T15 | Read-only auditor and dirty worktree | No writes to candidate; preserve unrelated changes | Accidental user work disturbance |
| T16 | No unresolved P0 but score 82 and GREEN 18/18 | HOLD, with blockers and next fix | “Test pass means deploy” fallacy |

**Evidence anchor:** Existing transcript cases P1–P6, Q1–Q3, R1–R4, S1–S5 should be retained as regression references only where their fixtures and expected outcomes are internally consistent. When an expectation was corrected, preserve original and corrected versions instead of silently replacing history.

## 4. Recommended execution in next review

### Stage 0 — Baseline and inventory (no speculative edits)

Identify the real owning optimisation SKILL; read `AGENTS.md`, relevant current skill metadata, authoritative rubric and validation resources once. Inspect `git status --short` and protect unrelated work. Create `manifest.json` containing the scoped files and SHA-256 digests. Verify registered paths and the scoring rubric. Do not infer missing resources before checking `assets/` and `references/` relative paths.

### Stage 1 — Turn previous findings into a small dependency graph

Group findings by underlying invariant, not by wording. Repair the contract underlying all occurrences of subset/cluster/hub/NHR/handoff at one time. Use a two-column matrix (input conditions → classification; merge eligibility → allow/hold). Choose no more than one coherent change-set for each iteration.

### Stage 2 — Apply and verify

Patch, run link/frontmatter/format checks and all deterministic invariants on the local candidate; if these fail, fix locally before spending a model call. Freeze candidate hash before delegating. Record each patch and its direct upstream/downstream impact. No agent sees a mutable candidate.

### Stage 3 — One informative evaluation wave

Run RED only where baseline missing or oracle changed; GREEN changed/near-miss cases; one hostile full audit. Use one coherent acceptance matrix. If score differences exceed five points, reconcile named criteria and evidence by coordinator **without automatically launching new auditors**. Add a second auditor only for a specified unresolved dispute. Keep answers compact and source-cited.

### Stage 4 — Release or hold, then handover

Release only if the complete gate passes on a frozen final version. Otherwise, produce the final deliverable as `REVISE/HOLD`, including last verified state and the next minimal fix. A below-target result that is properly packaged **is still a completed review** and prevents token exhaustion without output.

## 5. Success metrics for the next run

These are **proposed operational targets**, not historical results or guaranteed reductions:

| Metric | Observed in transcript | Proposed target |
| --- | --- | --- |
| Final usable release/hold pack | Absent at session end | **Present every run**, regardless of score |
| Subagent launches | 22 | **≤3 default** in one baseline wave; extras justified in manifest |
| Repeated full REDs on unchanged cases | Several | **0** unless instability is demonstrated |
| Candidate mutated while its audit is live | Risk present | **0** |
| Raw evidence and oracle tied to version | Late/incomplete | **100% of accepted evaluations** |
| Unverified high-risk semantic edits | Recurred | **0 in final candidate** |
| Count invariant checks | Agent reasoning, sometimes muddled | **Automated PASS** |
| Final independent score | 82/100 (v1.1 A1, nonfinal) | **>95**, same rubric and evidence |
| Critical/High unresolved blockers | Recurring | **0 at release** |
| Evaluation cases with standalone valid evidence | R4 was deficient | **100% in scored suite** |

## 6. Detailed completion and decision rules

**PASS / RELEASE:** Candidate hash matches all run metadata; final checker passes; baseline and latest comparable score available; independent score >95; no Critical/High open; regression test outputs stored; no unowned changes; final report generated.

**REVISE / HOLD:** Evidence suggests improvements but threshold or blocker gates fail. Write a consolidated, owner-ready fix list and an executable next-run plan. Do not label the result “deployable” because a GREEN suite passed.

**BLOCKED:** A required source is absent, environment/tool check fails, evaluator skipped the authoritative rubric, or unexpected repository state makes mutation unsafe. Write blocker and recovery details, no speculative score.

**SESSION/RESOURCE STOP:** Preserve the last verified candidate; do not leave a running optional agent wave as the only output. Report incomplete work and exact continuation. The quality target remains open for the next bounded session; do not manufacture compliance.

## 7. Ready-to-run continuation prompt

> Act as a high-assurance SKILL optimisation executor and Devil's Advocate. Use the attached atomic execution review, improvement plan, lessons log, and original repository sources. Read the current owning `writing-skills/SKILL.md`, scoring references and applicable `AGENTS.md`; verify actual file paths before editing. Implement fixes F01–F12 in priority/dependency order, preserving existing user changes and any unrelated hook refactor. First build a frozen execution manifest, stable scoring rubric, versioned eval/oracle harness and deterministic classification-invariant tests. Do not launch agents until these are valid.
>
> For the first candidate run a bounded evidence wave: one meaningful baseline if required, one targeted GREEN and one independent hostile audit on the exact same candidate hash. Use a second auditor only if an identified serious disagreement warrants it. Save raw evidence and grade metadata before changing files again. Never modify files while a reviewer is reading that version. Repair only evidence-backed, severity-ranked defects; recheck affected upstream/downstream decisions plus one compact regression suite. Do not change the expected oracle in place. Keep score and blocker comparisons tied to the same rubric and evidence versions.
>
> The acceptance threshold is a normalized independently verified score strictly greater than 95/100, all required checks PASS and zero Critical/High open issues. Protect enough execution capacity to deliver the full outcome: changed-files inventory, exact scores and rationale, tests and evidence paths, unresolved issues and final release/hold decision. If session limits arise, stop optional agents, write a restart manifest and a precise continuation prompt. Do not claim success unless verified. Do not commit or push unless explicitly requested.

## 8. Important constraint

No current repository files are attached in the source package; only the execution transcript is available. This is therefore a **proposed change plan**, not an applied patch. Before changing an actual SKILL, the next executor must confirm the present file structure and whether these requirements are already implemented, to avoid adding duplicate or conflicting instructions.
