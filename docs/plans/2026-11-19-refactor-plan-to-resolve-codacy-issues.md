# Codacy Refactoring Plan — Evidence-First, Atomic and Quality-Gated

## 1. Role and Mission

Act as a **Principal Software Engineer, Software Architect, Python 3.14
specialist, Ruff/Pyright expert, TypeScript/React specialist, Security Engineer,
Test Architect, and independent Devil's Advocate reviewer**.

Your mission is to investigate the current repository and produce a detailed,
evidence-based, atomic execution plan for remediating Codacy pull-request
findings.

The plan must:

1. Account for all reported new findings.
2. Identify verified root causes rather than recommending superficial fixes.
3. Preserve existing functionality, interfaces, and security controls.
4. Protect previously resolved findings from regression.
5. Establish dependency-ordered, independently verifiable work packages.
6. Define measurable test, quality, and acceptance gates.
7. Include risks, recovery procedures, and owner decisions.
8. Pass an evidence-bound Devil's Advocate assessment.

**Operating mode: PLAN ONLY — READ-ONLY.**

Do not implement, edit, format, generate, install, commit, push, or otherwise
modify repository files.

Do not create temporary files, caches, reports, or generated artifacts during
investigation. Use only verified non-writing inspection commands and return
deliverables in your response.

Stop after producing the plan.

---

## 2. Source of Truth and Confirmed Report Snapshot

The supplied Codacy PR report contains these verified summary values:

| Metric                                    | Value |
| ----------------------------------------- | ----: |
| New issues                                |   133 |
| Previously solved issues                  |   871 |
| Maximum new issues permitted              |     0 |
| Files with reported complexity increases  |    24 |
| Files with reported complexity decreases  |    10 |
| Files with added clone entries            |    30 |
| Files with removed clone entries          |    17 |
| Inline issue annotations in supplied text |    50 |

### Mandatory interpretation

These categories describe different metrics.

Do not add complexity or clone entries to the static-analysis finding count.

Do not assume that the 50 available annotations represent all 133 newly
introduced findings.

Do not assume an increase in file complexity represents the cognitive complexity
of a particular function.

Do not assume all clone entries require consolidation.

Do not interpret the 871 solved findings as proof that every previously fixed
issue remains resolved at the current commit.

### Evidence precedence

Use this order:

1. Actual repository implementation and configuration.
2. Commit-specific Codacy issue evidence and complete analysis exports.
3. Reproducible local diagnostics, where safely available.
4. Existing tests, CI definitions, and architecture documentation.
5. Supplied PR summary.
6. Explicitly labelled engineering hypotheses.

Record disagreement between sources instead of silently choosing the most
convenient interpretation.

For every externally reported finding, retain its originating tool, rule ID,
severity, location, and analysis context.

---

## 3. Non-Negotiable Planning Controls

### 3.1 Read-only requirements

- Inspect relevant source, tests, configuration, and documentation.
- Inspect Git state, commit identities, changed files, and diffs.
- Do not edit or stage files.
- Do not execute auto-fix or formatting commands.
- Do not install dependencies.
- Do not modify lockfiles.
- Do not run scripts that may write results or caches without a verified
  non-writing configuration.
- Do not modify quality thresholds or suppress rules.
- Do not create new Git branches or worktrees.
- Do not modify CI workflows.
- Do not execute the refactoring.

If unexpected repository modifications are detected, disclose them and stop
rather than claiming a clean planning run.

### 3.2 Scope protection

Plan only the changes required to remediate verified issues and preserve their
related contracts.

Changes outside the PR scope require an explicit dependency justification.

Do not use this remediation as justification for unrelated architecture
rewrites, dependency upgrades, or stylistic cleanups.

### 3.3 Quality protection

Never recommend weakening:

- Ruff or other lint rules
- Pyright/Pylance strictness
- ESLint or Oxlint
- Sonar or Codacy security policies
- Existing test assertions
- Coverage thresholds
- Authentication or authorisation controls
- Dependency and architectural boundaries

Reject blanket suppressions, exclusions, and unverified false-positive
dispositions.

Document unavoidable exceptions as proposed owner decisions, not approved
changes.

---

# PART A — INVESTIGATION

## 4. Phase 0: Freeze and Establish Baselines

Before planning code changes, establish the exact repository state.

### Required evidence

Identify:

- Repository identity
- Current branch
- HEAD commit
- PR base branch
- Merge-base commit
- Relevant changed files
- Working-tree status
- Commit associated with the supplied Codacy snapshot
- Codacy analysis time, configuration, and tool versions where available
- Python runtime support
- TypeScript and frontend toolchain versions
- Existing CI quality gates
- Current test and coverage requirements
- Relevant architecture and governance rules

Record whether the Codacy snapshot and the local repository refer to comparable
revisions.

### Existing failures

Separate:

- Pre-existing failures
- Newly introduced PR failures
- Confirmed resolved findings
- Unverified or stale diagnostics
- Findings in generated or third-party code

Do not claim a regression merely because a failure exists in the current branch.

Do not claim a finding was previously resolved without suitable evidence.

### Phase 0 acceptance gate

| Requirement            | Condition                      |
| ---------------------- | ------------------------------ |
| Repository revision    | Identified                     |
| PR baseline            | Identified                     |
| Existing modifications | Recorded                       |
| Toolchain              | Verified or explicitly unknown |
| Quality policies       | Identified                     |
| Codacy comparability   | Confirmed or flagged           |

**Exit:** BASELINED / NEEDS EVIDENCE / BLOCKED

---

## 5. Phase 1: Reconcile All 133 Findings

Build a complete, uniquely identified register of the 133 reported new findings.

Obtain a complete Codacy export or equivalent analysis records if accessible.

Accept a suitable structured format such as JSON, SARIF, CSV, or issue API
output.

The supplied PR text is not sufficient by itself.

### Required fields

| Field        | Description                                                                            |
| ------------ | -------------------------------------------------------------------------------------- |
| Finding ID   | Stable unique identifier or evidence-backed composite key                              |
| Snapshot     | Source analysis and commit reference                                                   |
| File         | Exact repository-relative path                                                         |
| Location     | Line and column or range                                                               |
| Tool         | Reporting analyser                                                                     |
| Rule         | Exact identifier                                                                       |
| Severity     | Original reported severity                                                             |
| Category     | Security, correctness, typing, maintainability, complexity, duplication, documentation |
| State        | Current, stale, review pending, or unverified                                          |
| Root cause   | Verified explanation or hypothesis                                                     |
| Work package | Remediation task reference                                                             |
| Test cases   | Related validation references                                                          |
| Evidence     | Supporting code, diagnostic, or document                                               |
| Disposition  | Planned fix, justified retention, accepted exception, or pending decision              |
| Owner        | Required technical or security decision-maker                                          |

### Completeness rules

1. Every reported new finding must have one unique inventory record.
2. Grouping multiple findings into a remediation task must not remove their
   individual identities.
3. Do not treat related findings as duplicate records merely because they share
   a root cause.
4. Distinguish true duplicate source records from separate findings.
5. Treat suspected false positives as pending until supported and appropriately
   reviewed.
6. Record missing fields explicitly.
7. Track the identities of the 871 previously solved findings if reliable data
   is available.
8. Where historical identities are unavailable, do not claim that none have
   reappeared.

### Reconciliation gate

The report may be declared complete only when all 133 reported new findings have
been individually accounted for or a documented, evidence-supported difference
between snapshots explains the changed total.

Required checks:

- Unique issue inventory is complete.
- No unexplained duplicate identifiers.
- No unattributed findings.
- Every record has a disposition.
- Active findings map to remediation tasks.
- Retained findings have explicit rationale and any required approval.
- Aggregate totals reconcile to the source snapshot.
- Source-to-repository revision differences are documented.

**Hard gate:**

If a complete issue register is unavailable, planning may continue
provisionally, but the final planning decision MUST be **NEEDS MORE EVIDENCE**
or **BLOCKED**.

It must not be READY FOR APPROVAL.

---

## 6. Phase 2: Root-Cause and Architectural Investigation

Investigate every active finding and relevant surrounding code.

Inspect:

- Implementation
- Callers and consumers
- Public interfaces
- Type contracts
- Existing test coverage
- Error handling
- Configuration
- File and process lifecycle
- Security trust boundaries
- Shared abstractions
- Architectural ownership
- Relevant documentation

Classify root causes into evidence-backed remediation families.

Examples:

- Incorrect subprocess execution
- Unsafe filesystem access
- Invalid typing contracts
- Redundant dynamic attribute access
- Resource-lifecycle defects
- Excessive cognitive complexity
- Genuine code duplication
- Invalid Markdown structure
- Import formatting or style defects
- Regression-test design problems

### Critical investigation targets

Examine the supplied Codacy report's identified paths, including:

**Python skill-creator**

- `run_pipeline.py`
- `run_loop.py`
- `run_eval.py`
- `eval_control.py`
- `run_early_exit_eval.py`
- `run_readiness_pressure_eval.py`
- `run_red_green_eval.py`
- `aggregate_benchmark.py`
- `generate_review.py`
- Associated regression tests

**Security and process execution**

- `.claude/hooks/secret-scanner.py`
- `.claude/skills/webapp-testing/scripts/with_server.py`
- `.claude/skills/webapp-testing/scripts/tests/test_with_server.py`
- `.claude/skills/typescript-expert/scripts/tests/test_ts_diagnostic.py`

**React/TypeScript**

- WizardForm
- ContactDetails
- BranchSelectorModal
- authenticatedClient
- acceptQuote redirection
- NMIContactDetails
- RouteExportCoverage stories

**Other reported skill scripts**

Investigate all additional affected paths in the complete finding register,
including Markdown, Python, complexity, and clone-related records.

Do not treat this shortlist as exhaustive.

### Root-cause requirements

For each remediation family establish:

1. Actual cause
2. Supporting code evidence
3. Affected contracts
4. Related findings
5. Existing test protection
6. Likely hidden coupling
7. Proposed solution
8. Alternatives considered
9. Risks and side effects
10. Required owner approval

Avoid introducing helper abstractions simply to make duplication metrics
smaller.

---

# PART B — REFACTOR DESIGN

## 7. Phase 3: Build a Dependency Graph

Create a directed acyclic dependency graph of proposed changes.

Express actual predecessor relationships between:

- Baseline and characterisation tests
- Contract and interface changes
- Security controls
- Shared helpers
- Implementation changes
- Callers
- Regression tests
- Documentation
- Cleanup
- Quality verification

### Sequencing rules

1. Establish current behaviour and protective tests before high-risk changes.
2. Resolve prerequisite contracts and types before dependent implementations.
3. Implement shared infrastructure before changing consumers.
4. Keep security-sensitive changes as small as practical.
5. Run targeted verification after each logical change.
6. Remove deprecated code only after all dependent consumers have migrated.
7. Reserve integrated verification for the end of each work package and phase.
8. Avoid unrelated changes in the same atomic task.

If the graph has a cycle, identify it and propose a safe decomposition instead
of imposing an arbitrary order.

Urgent security risks may be prioritised, but prerequisite contracts and tests
must still be considered.

### Deliverable

Provide a Mermaid graph when supported, plus a dependency table containing:

| Task | Depends On | Blocks | Contract | Critical Path |
| ---- | ---------- | ------ | -------- | ------------- |

---

## 8. Phase 4: Create Atomic Work Packages

Build the implementation backlog using traceable, independently reviewable
tasks.

Use identifiers such as:

- `SEC-001` — Security
- `PY-001` — Python
- `TS-001` — TypeScript
- `CX-001` — Complexity
- `DRY-001` — Duplication
- `TEST-001` — Testing
- `DOC-001` — Documentation

### Required task contract

Each atomic task must contain:

| Property           | Requirement                             |
| ------------------ | --------------------------------------- |
| Task ID            | Stable unique identifier                |
| Title              | Specific engineering action             |
| Findings           | All linked Codacy IDs                   |
| Target             | Exact files and symbols                 |
| Root cause         | Supported explanation                   |
| Proposed change    | Specific modification                   |
| Alternatives       | Relevant tradeoffs                      |
| Prerequisites      | Blocking task IDs                       |
| Downstream effects | Affected callers or tests               |
| Contract           | Invariants to preserve                  |
| Baseline           | Current measurable state                |
| Target             | Expected measurable state               |
| Test IDs           | Linked verification cases               |
| Commands           | Repository-verified validation commands |
| Risk               | Likelihood and severity                 |
| Rollback           | Reversal boundary                       |
| Owner              | Required review responsibility          |
| Acceptance         | Explicit pass/fail criteria             |

### Atomicity requirements

Prefer one coherent behavioural or structural concern per task.

A single task may resolve several findings when they share a verified root
cause.

Avoid mixing security-sensitive changes with unrelated formatting fixes.

If a task is too broad to validate independently, split it.

Do not split changes so finely that intermediate commits would violate necessary
contracts.

---

## 9. Phase 5: Define Measurable Outcomes

For each work package specify quantitative, observable acceptance requirements.

### Static analysis

Define:

- Finding IDs expected to be resolved
- Rules involved
- Expected remaining issue count
- Maximum permissible newly introduced findings
- Required comparison scope

**Default:** zero newly introduced issues relative to the applicable frozen
baseline.

The overall PR target is the configured Codacy gate of zero new issues.

### Complexity

Record:

- Original measurement
- Targeted symbol or file
- Measurement tool
- Target value or acceptable bound
- Reason the target is justified

Do not promise arbitrary complexity reductions unsupported by implementation
evidence.

### Duplication

Record:

- Existing clone group
- Shared behaviour
- Consolidation feasibility
- Expected reduction or justified retention
- Cross-module coupling risk

### Type safety

Require:

- No new unexplained type errors
- No new unsafe casts or weakened annotations
- No unnecessary use of `Any` or `Unknown`
- No unexpected public contract changes

### Tests and coverage

Record:

- Existing test count and result, where available
- Relevant test cases
- New or changed regression tests
- Required pass rate
- Required coverage thresholds
- Known baseline failures
- Zero unexplained new regressions

Do not lower any existing coverage threshold.

### Security

Record:

- Original security concern
- Trust boundary
- Expected protective behaviour
- Abuse or failure scenarios
- Required validation evidence
- Security-owner approval when appropriate

### Documentation and governance

Specify required updates and verification for:

- Public or internal contracts
- Architectural documentation
- CLI documentation
- Storybook and route governance
- Relevant repository manifests

---

# PART C — VERIFICATION

## 10. Phase 6: Build the Test-to-Task Traceability Matrix

Every work package must link to specific verification cases.

Every active finding must link to a task or approved non-change disposition.

For every behavioural change, document an observable before/after contract.

### Required matrix

| Finding ID | Task ID | Contract | Test ID | Test Type | Command | Expected Result |
| ---------- | ------- | -------- | ------- | --------- | ------- | --------------- |

### Minimum verification dimensions

**Python**

- Python 3.14 compatibility when required
- Ruff
- Pyright/Pylance
- Sonar/Codacy
- Unit tests
- CLI integration
- Error handling
- Subprocess timeouts
- Exit codes
- Resource cleanup
- Platform compatibility where applicable

**TypeScript and React**

- Type checking
- ESLint and Oxlint where configured
- Unit and integration tests
- Storybook tests
- Routing and authentication contracts
- Accessibility
- E2E tests
- Coverage
- Governance manifests

**Security**

- Authorised operation
- Invalid input
- Untrusted input handling
- Boundary conditions
- Exception paths
- Timeout paths
- Resource cleanup
- Failure recovery

**Duplication and complexity**

- Baseline comparison
- Functional equivalence
- Contract invariants
- Complexity measurement
- Duplication measurement

### Command verification rules

Use commands found in repository scripts, CI, configuration, or authoritative
local documentation.

Do not fabricate validation commands.

If a command cannot be verified, mark it:

`COMMAND UNVERIFIED — REQUIRES CONFIRMATION`

Distinguish:

- **PLANNED:** Command identified but not run
- **NOT RUN:** Execution has not occurred
- **PASS:** Verified successful execution
- **FAIL:** Verified unsuccessful execution
- **BLOCKED:** Cannot execute or interpret results safely

Since this is PLAN ONLY, do not claim that implementation tests have passed.

---

## 11. Phase 7: Independent Work-Package Review Gates

Each work package must define four review gates.

### Gate A — Ready to Implement

Requires:

- Findings mapped
- Root cause established
- Dependencies resolved in the plan
- Contract documented
- Tests identified
- Acceptance criteria measurable
- Risk and rollback documented
- Required approvals identified

### Gate B — Local Remediation Verified

Planned future gate:

- Targeted change complete
- Linked findings addressed or dispositioned
- No new local static-analysis violations
- Targeted tests pass
- Type safety preserved
- Behavioural contracts verified

### Gate C — Integration Verified

Planned future gate:

- Upstream callers pass
- Downstream consumers pass
- Integration tests pass
- Security controls remain valid
- Coverage policies satisfied
- No unexplained regression

### Gate D — Approved for Next Work Package

Planned future gate:

- Review evidence available
- Risks resolved or accepted by authorised owners
- No new unresolved critical planning or implementation blocker
- Work-package acceptance signed off where required

Do not progress automatically across gates merely because individual commands
report success.

Document required approval authorities.

The current planning task must define Gates B–D but must not execute them.

---

# PART D — GOVERNANCE

## 12. Phase 8: Risk, Rollback, and Recovery

For every material risk provide:

- Risk identifier
- Trigger condition
- Affected contracts
- Likelihood
- Impact
- Mitigation
- Detection test
- Rollback boundary
- Recovery verification
- Owner
- Residual risk

Identify reversible and irreversible operations.

For cross-cutting changes, define safe dependency-aware rollback order.

Prefer small reversible work packages over broad multi-module rewrites.

Maintain clean boundaries for security-sensitive changes.

---

## 13. Phase 9: Independent Devil's Advocate Review

Challenge the entire plan.

### Mandatory questions

1. Are all 133 findings individually accounted for?
2. Have report counts been interpreted correctly?
3. Are snapshot and repository revisions comparable?
4. Can the plan protect previously solved issues from regression?
5. Does every proposed change address a verified cause?
6. Are any changes unnecessary or outside scope?
7. Could lint fixes weaken runtime behaviour or type safety?
8. Could security changes introduce new failure paths?
9. Could clone consolidation increase coupling?
10. Could complexity reduction obscure important behaviour?
11. Are contract changes ordered safely?
12. Are tests specific enough to detect failures?
13. Are exact commands grounded in the repository?
14. Are all acceptance criteria measurable?
15. Does every work package have an independent review gate?
16. Are rollback plans realistic?
17. Are unknowns and owner decisions explicit?
18. Are any unresolved critical planning deficiencies being concealed by the
    rubric score?

### Review outcomes

Classify each objection as:

- CRITICAL
- HIGH
- MEDIUM
- LOW

For each objection:

- Explain the concern.
- Identify the supporting evidence.
- Describe the potential failure.
- Provide the required correction.
- State whether the plan was updated.
- Record remaining residual risk.

No unresolved critical planning deficiencies are permitted for READY FOR
APPROVAL.

A critical code vulnerability may have a proposed remediation plan; distinguish
that planned engineering work from a critical deficiency in the plan itself.

---

## 14. Frozen Plan-Quality Rubric — 100 Points

Use this rubric throughout all planning revisions.

| Category                                  | Maximum |
| ----------------------------------------- | ------: |
| Evidence and baseline accuracy            |      15 |
| Findings completeness and traceability    |      20 |
| Root-cause and dependency analysis        |      15 |
| Atomic sequencing and execution readiness |      15 |
| Verification and regression protection    |      15 |
| Security, risk, and rollback              |      10 |
| Independent adversarial review            |       5 |
| Clarity and implementation usability      |       5 |
| **Total**                                 | **100** |

### Scoring requirements

- Cite evidence for each awarded score.
- Explain deductions.
- Do not award points for assumptions presented as verified facts.
- Do not lower the rubric to increase the score.
- Evaluate missing evidence explicitly.
- Repeat scoring after material corrections, up to three assessments.
- Stop when improvements become cosmetic or the maximum iterations are reached.

### Mandatory scoring caps

Apply the most restrictive applicable cap:

| Condition                                                              | Maximum score |
| ---------------------------------------------------------------------- | ------------: |
| Complete 133-finding inventory unavailable                             |            69 |
| Baseline or repository revision cannot be established reliably         |            79 |
| Required verification commands lack repository support                 |            89 |
| Material owner decisions unresolved without adequate proposed controls |            94 |
| Critical planning deficiency unresolved                                |            79 |

These caps apply to the plan being generated, not to an independent assessment
of this prompt's design.

### Hard readiness gates

READY FOR APPROVAL is prohibited if:

- The complete finding register is missing or unreconciled.
- Repository and source evidence cannot be compared reliably.
- Active findings lack a planned disposition.
- Material behavioural changes lack relevant verification.
- The dependency sequence is unsafe or unexplained.
- Critical planning deficiencies remain.
- Material risks lack safe recovery strategies.
- Required approval responsibilities are unidentified.

A high score never overrides a hard gate.

### Acceptance target

**Plan score ≥96/100 AND no unresolved critical planning deficiencies AND all
mandatory readiness gates satisfied.**

If any condition fails, report the actual result without claiming success.

---

# PART E — REQUIRED OUTPUT

## 15. Output Contract

Deliver four separate artifacts, in this order, each under its own heading. Do
not write them to repository files.

### Delivery rules

1. **Single source of truth.** Each fact is stated once, in the artifact that
   owns it. Other artifacts cite it by ID (Finding ID, Task ID, Test ID, Risk
   ID) and do not restate it.
2. **No silent omission.** If an artifact cannot be reproduced in full, state
   what is missing and why, give the count delivered against the count expected
   (for example "Finding records: 50 of 133 delivered"), and mark the artifact
   **INCOMPLETE**. Then continue in a labelled follow-up
   (`Artifact 2, part 2 of N`) rather than truncating.
3. **Label every claim by evidence level:** `VERIFIED` (observed in this session
   with the command or source cited), `REPORTED` (stated in the supplied report,
   not independently checked), or `HYPOTHESIS` (inferred). Do not present
   `REPORTED` or `HYPOTHESIS` as `VERIFIED`.
4. **No fabricated records.** Never invent findings, rule IDs, line numbers,
   commands, or test results to reach a count of 133. A missing record is shown
   as a gap, not filled.
5. **Planned versus observed.** Commands in the plan are _proposed_. Never write
   that a proposed test passes. Only commands actually run in this session may
   show an observed result.

### Artifact 1 — Executive Refactoring Plan

Limit: 800 words excluding tables. Written for technical reviewers who will not
read the other artifacts.

Sections, in order:

1. Executive summary (what is being fixed, why, and the readiness decision in
   one line)
2. Current state and baseline evidence (revision, snapshot, counts, evidence
   level)
3. Target state (measurable, from §9)
4. Remediation strategy and dependency graph (diagram or indented list)
5. Phase plan (table in §16)
6. Milestones and review gates (A–D from §11)
7. Top risks (maximum five, linked to Risk IDs)

The final readiness decision is **not** repeated here beyond the one-line
summary. It is owned by §17.

### Artifact 2 — Complete Finding Register

Use the fields defined in §5 (Phase 1). Do not add or rename fields.

Format:

- Deliver as one table row per finding, or one compact JSON object per finding,
  whichever is shorter. Do not mix formats.
- Group rows by File, then by line.
- Omit a field's text only when it is genuinely unknown, and write `UNKNOWN`
  instead of leaving it blank. Do not use `N/A` for unknown values.

State the inventory status once, at the top, as exactly one of:

| Status           | Meaning                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **COMPLETE**     | All 133 records present, unique, with no unexplained duplicates, and totals reconcile to the source snapshot (or the difference is evidenced). |
| **PARTIAL**      | Some records present and evidenced. State the delivered count, the missing count, and the specific source needed to close the gap.             |
| **UNRECONCILED** | Records exist but counts, snapshots, or revisions conflict. List each conflict.                                                                |

If only the 50 available annotations can be evidenced, deliver those 50 records,
report 83 findings as unaccounted for, set the status to **PARTIAL**, and apply
the 69-point cap in §14. Do not pad, estimate, or group the missing 83.

### Artifact 3 — Atomic Execution Backlog

Each work package uses the task contract in §8. Do not drop or rename its
fields.

To keep the artifact readable, present each task as a compact card with these
properties, in this order:

`Task ID` · `Title` · `Priority` · `Findings` · `Target` · `Root cause` ·
`Proposed change` · `Alternatives` · `Prerequisites` · `Downstream effects` ·
`Contract` · `Baseline → Target` · `Test IDs` · `Commands` · `Acceptance` ·
`Risk` · `Rollback` · `Owner`

Rules:

- `Priority` is one of P0 (security or correctness defect), P1 (gate blocker),
  P2 (maintainability), P3 (cosmetic), with a one-line reason.
- Every active Finding ID in Artifact 2 appears in exactly one task's `Findings`
  field, or carries an approved non-change disposition.
- `Commands` must be taken from `package.json` or other repository files and
  cited. A command that was not found in the repository is marked `UNSUPPORTED`
  and caps the score per §14.
- Group tasks into execution phases. Within each phase, list tasks in dependency
  order and mark which can run in parallel.

### Artifact 4 — Verification and Readiness Report

Contents, in order:

1. Test-to-task traceability matrix (the §10 matrix, unchanged)
2. Verified validation commands with expected outcomes and evidence level
3. Coverage, complexity, duplication, type-safety, and security targets (from
   §9)
4. Baseline comparison requirements
5. Devil's Advocate findings (§13), each with severity and plan-updated status
6. Rubric scoring (§14), showing raw score, caps applied, and capped score
7. Outstanding decisions, each with a named owner
8. Final readiness decision (§17)

---

## 16. Required Summary Tables

Use these column sets exactly. Tables index the artifacts; they do not replace
them.

### Findings reconciliation

| Category | Count expected | Count delivered | Snapshot | Source | Evidence level | Status |
| -------- | -------------: | --------------: | -------- | ------ | -------------- | ------ |

Include one row per category, a row for the 871 previously solved findings
(state whether identities are available), and a totals row that reconciles
to 133.

### Remediation backlog

| Priority | Task ID | Findings | Prerequisites | Risk | Acceptance |
| -------- | ------- | -------- | ------------- | ---- | ---------- |

### Phase plan

| Phase | Objective | Entry gate | Task IDs | Exit gate | Owner |
| ----- | --------- | ---------- | -------- | --------- | ----- |

### Verification matrix

| Finding ID | Task ID | Test ID | Test type | Command | Expected result | Evidence level |
| ---------- | ------- | ------- | --------- | ------- | --------------- | -------------- |

This is the same matrix as §10, with the evidence column added. Do not create a
second matrix with different columns.

### Risk register

| Risk ID | Risk | Severity | Likelihood | Mitigation | Recovery | Owner |
| ------- | ---- | -------- | ---------- | ---------- | -------- | ----- |

### Rubric

| Criterion | Maximum | Raw awarded | Evidence | Deduction | Cap applied |
| --------- | ------: | ----------: | -------- | --------- | ----------- |

End with: raw total, each cap triggered with its limit, and the **final capped
total** (the lowest applicable cap, or the raw total if none applies).

---

## 17. Final Readiness Decision

Choose exactly one decision. Evaluate in this order and stop at the first match:

1. **BLOCKED** if any of the following is true: a critical planning deficiency
   is unresolved; the dependency sequence is unsafe; sources conflict
   irreconcilably; or a required approval cannot be obtained.
2. **NEEDS MORE EVIDENCE** if the plan is sound so far but any hard gate in §14
   fails for lack of evidence (for example an incomplete finding register,
   unsupported commands, or an unresolved owner decision).
3. **READY FOR APPROVAL** only if every hard gate passes, the final capped score
   is at least 96/100, and no critical planning deficiency remains.

Report:

| Item                                   | Content                                           |
| -------------------------------------- | ------------------------------------------------- |
| Decision                               | One of the three labels, verbatim                 |
| Raw score and final capped score       | Both, with each cap named                         |
| Hard gates                             | Pass or fail for each, with the evidence          |
| Evidence for the decision              | Citations by ID                                   |
| Unresolved risks                       | Risk IDs                                          |
| Missing evidence                       | Specific item and the source that would supply it |
| Required approvals                     | Named role per approval                           |
| Recommended first implementation phase | Phase and task IDs                                |
| No-change confirmation                 | See below                                         |

**No-change confirmation.** State that no source files were modified and the Git
state was not changed by this task, and support it with a read-only check, for
example comparing `git status --porcelain` and `git rev-parse HEAD` against the
Phase 0 baseline. If the working tree was already dirty at Phase 0, say so and
confirm only that this task introduced no further change.

Approval of the plan is not permission to implement. State that explicitly.

---

## 18. Mandatory Stop Condition

After delivering the four artifacts:

1. Do not modify source files.
2. Do not execute the proposed remediation.
3. Do not perform unapproved cleanup.
4. Do not change the Git state.
5. Do not claim that proposed tests have passed.
6. Do not declare completion based only on rubric score.
7. Do not bypass any hard readiness gate.
8. Await explicit human approval before implementation.

Close with the sentence for the decision reached:

- **READY FOR APPROVAL:** "The refactoring plan is ready for review. No
  repository files were modified. Shall I proceed with implementation Phase 1?"
- **NEEDS MORE EVIDENCE:** "The plan is not ready for approval. No repository
  files were modified. Please supply: <missing items>."
- **BLOCKED:** "The plan is blocked by: <blockers>. No repository files were
  modified. Please resolve these before I continue."

"Implementation Phase 1" means the first phase of the proposed remediation. It
is not Phase 1 (finding reconciliation) of this planning process.
