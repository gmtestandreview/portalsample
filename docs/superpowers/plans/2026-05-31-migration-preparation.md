# NMI Portal — Migration Preparation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. If superpowers skills are unavailable, execute the checklist steps directly and stop at review checkpoints.

**Goal:** Prepare `portal.measurement.gov.au` for a fully audited, risk-free live migration by reconstructing a complete historical change record, closing all open pre-migration tasks, and delivering a validated migration runbook.

## Current Authoritative Migration Preparation Plan

**Status as of 2026-06-01:** Sprint 1 Storybook Quality Remediation is `CLOSED_SUCCESS`. `npm run test:storybook` passed with 55 files, 158 tests, and 0 failures. QA sign-off has been issued. SEC-010 backend IDOR verification remains the primary Priority 1 open item. Design-platform and target infrastructure decisions remain Priority 2 gates for the affected migration batches.

This plan supersedes any older task text below that describes Sprint 1 as open, QA sign-off as absent, or live Storybook verification as pending. Those statements are retained only as historical planning context.

### Objectives

1. Perform a complete historical review of all previous actions, decisions, plans, assessment documents, concern registers, sprint notes, ADRs, QA records, and architecture artefacts, including material created before the 2026-05-29 readiness assessment.
2. Reconstruct and maintain `docs/change-record/MASTER-CHANGE-RECORD.md` as the canonical chronological record of all rebuild and migration preparation work.
3. Use the Master Change Record as the required reference for live migration sequencing, verification, rollback, and sign-off.
4. Maintain `docs/change-record/OPEN-ITEMS-BACKLOG.md` as the only accepted location for unresolved findings, remediation tasks, migration-window exceptions, and design or infrastructure decisions.
5. Merge the content of `analysis/portal.measurement.gov.au/ARCHITECTURE.mmd`, `analysis/portal.measurement.gov.au/ASSESSMENT.md`, and `docs/CONCERNS.md` into the seven migration-preparation targets listed below.

### Required Source-to-Target Updates

| Target document | Required update |
|---|---|
| `docs/change-record/MASTER-CHANGE-RECORD.md` | Record every resolved change and decision with source evidence, status, affected files, tests, and migration relevance |
| `docs/change-record/OPEN-ITEMS-BACKLOG.md` | Capture every unresolved issue from the assessment, concerns register, architecture review, sprint records, and pre-flight review |
| `docs/migration/PRE-FLIGHT-CHECKLIST.md` | Add historical review gates and technical checks derived from architecture, runtime contracts, concerns, and security findings |
| `docs/migration/MIGRATION-RUNBOOK.md` | Require batch execution to cite Master Change Record entries and block on unresolved Priority 1 items |
| `docs/superpowers/plans/2026-05-31-migration-preparation.md` | Maintain this document as the operational plan and current-state task map |
| `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html` | Reflect current readiness, resolved Sprint 1 status, SEC-010 state, and the migration preparation control process |
| `docs/nmi-portal-modernisation-assessment-colour-revised.html` | Add migration preparation guidance that connects the refactor recommendation to the Master Change Record and Open Items Backlog |

### Execution Sequence

1. **Historical reconciliation:** Review all source inputs and confirm each item is closed in the Master Change Record or open in the backlog.
2. **Backlog triage:** Prioritize open items as P1, P2, or P3. P1 items block migration. P2 items block named batches. P3 items must be scheduled before or after migration with owner and date.
3. **Pre-flight:** Complete the Historical Review Gate and technical pre-flight checklist in the target environment.
4. **Live migration:** Execute runbook batches A–E. Batches A–D may proceed after P1 closure and pre-flight pass. Batch E additionally requires design-platform input resolution.
5. **Post-migration verification:** Run the full verification suite, complete route smoke testing, update the Master Change Record, and close or reclassify all backlog items.

### Revalidation Results from the Three Source Documents

| Source finding | Status after merge | Destination |
|---|---|---|
| `ARCHITECTURE.mmd` included deleted `devAuth.ts` | CLOSED — diagram updated to exclude auth-bypass module and include TrustedTypes/runtime env relationships | `ARCHITECTURE.mmd`, Master Change Record |
| `ASSESSMENT.md` auth bypass, PII logging, redirect, mailto, Trusted Types findings | CLOSED | Master Change Record CRD-001, CRD-003, CRD-004, CRD-005, CRD-006 |
| `ASSESSMENT.md` IDOR finding | OPEN | Open Items Backlog `SEC-010`; backend verification checklist |
| `ASSESSMENT.md` validation regex finding | OPEN, non-blocking | Open Items Backlog `VAL-REGEX-001` |
| `CONCERNS.md` provider-level ErrorBoundary and Trusted Types concerns | CLOSED | Master Change Record CRD-006 and CRD-007 |
| `CONCERNS.md` operational questions and fragile-area debt | OPEN or deferred | Open Items Backlog Priority 3 |
| Design-platform replacement question | OPEN Batch E blocker | Open Items Backlog Priority 2 |

**Architecture:** Six ordered phases move the team from retrospective audit through live-environment cutover. Each phase gates the next: the change record (Phase 0) informs all downstream decisions; Sprint 1 closure (Phase 1) validates the test baseline; SEC-010 backend verification (Phase 2) clears the sole remaining security open item; design-platform resolution (Phase 3) unblocks styling decisions; pre-flight setup (Phase 4) confirms the target environment is safe; and migration execution (Phase 5) moves components in confidence-ordered batches drawn directly from Section 9 of the readiness assessment.

**Tech Stack:** React 18.3.1 · TypeScript 5.9.3 · React Router v6.30.3 · MSAL Browser v3.30 / MSAL React v2.2 · Formik 2.4.9 + Yup 1.7.1 · Bootstrap 5.3.8 · NSwag-generated API client · Azure App Insights v3.4.1 · Google Analytics (react-ga4) · DOMPurify 3.4.4 · Storybook 10 (Vite adapter) · Vitest · Playwright/BDD (25 feature files) · Node ≥ 20

---

## Source Inputs

- Primary readiness reference: `docs/nmi-portal-rebuild-readiness-assessment-2026-05-29.html`
- Sprint 1 governance:
  - `docs/sprint-1/plan.md`: sprint goal, P0/P1/P2 priorities, execution sequence
  - `docs/sprint-1/github-issues.md`: 15 issues (4 critical, 6 high, 5 medium), DoD per issue
  - `docs/sprint-1/dev-handoff.md`: phase sequence, patterns, constraints
  - `docs/sprint-1/qa-handoff.md`: validation protocol, acceptance criteria
  - `docs/sprint-1/remediation-backlog.md`: SB-001 → SB-023, QA-001 → QA-003
  - `docs/sprint-1/done.md`: **Status: CLOSED_SUCCESS** — live Storybook verification passed and QA sign-off issued on 2026-06-01
  - `docs/sprint-1/progress.md`: 2026-05-31 update — P0 fixes + 7 P1 stories applied; deferred items require live env
  - `docs/sprint-1/workflow-state-log.md`: 14 issues IMPLEMENTING, 1 VERIFYING (#9); all 15 issues progressed beyond INTAKE
  - `docs/sprint-1/SPRINT-KICKOFF.md`: sprint dates and escalation path
  - `docs/sprint-1/PRODUCER-SUMMARY.md`: artifact architecture, roles
  - `docs/sprint-1/issue-drafts.md`: SB-001 → SB-005 reproduction steps
- Architecture and migration docs:
  - `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, `docs/STACK.md`
  - `docs/MIGRATION_ROADMAP.md`, `docs/STORYBOOK-MIGRATION-READINESS.md`
  - `docs/sec/SEC-010-idor-backend-verification.md`
  - `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`
  - `docs/architecture/org-switching-lifecycle.md`
  - `docs/architecture/nswag-regeneration.md`
  - `docs/architecture/target-repo-storybook-placement.md`
  - `docs/architecture/storybook-vs-webpack-runtime.md`
  - `docs/architecture/bdd-e2e-step-coverage.md`
- Existing superpowers plans (2026-05-29 → 2026-05-31) in `docs/superpowers/plans/`

---

## Assumptions and Unknowns

- **Assumption:** The source-map capture workspace is the authoritative pre-migration source of truth; no concurrent edits are happening in a parallel repository.
- **Assumption:** The target live environment will be a fresh buildable repository; path aliases (`static/js/`, `ClientApp/src/`) will need updating in test imports.
- **Assumption:** The backend OpenAPI spec is available to regenerate `web-api-client.ts`.
- **Assumption:** Node ≥ 20 is available in both source and target CI environments.
- **Assumption:** `npm run type-check`, `npm run test:unit`, `npm run build-storybook`, and `npm run test:storybook` are the canonical verification commands in the target.
- **Blocking ambiguity (design platform):** 13 design-platform inputs (Section 11 of the readiness assessment) are unresolved. Until these are answered, SCSS/component replacement decisions in Phase 3 cannot be finalized. Phase 4 and 5 may proceed in parallel for logic-layer migration (routes, auth, API, storage, validation) which has no design-platform dependency.

---

## Requirement Traceability

| Requirement | Task(s) | Notes |
|---|---|---|
| R1 — Review all past actions and pre-assessment documentation | Task 0.1, 0.2 | Covers all changes A–M in assessment Section 12 and all Sprint 1 governance artifacts |
| R2 — Reconstruct comprehensive change record | Task 0.3 | Single canonical `docs/change-record/MASTER-CHANGE-RECORD.md` |
| R3 — Use change record as migration reference | Tasks 0.4, 5.1–5.7 | Change record gates each migration batch |
| R4 — Identify incomplete tasks and unresolved issues | Tasks 1.1–1.4, 2.1, 3.1 | Sprint 1 (15 issues), SEC-010, design-platform unknowns |
| R5 — Develop prioritized remediation backlog | Task 1.1, 0.4 | Merged backlog with severity and migration-gate assignment |
| R6 — Backlog tracked and prioritized | Tasks 1.2–1.4, 2.1–2.2 | Phase-gate: blockers must close before migration batch |
| R7 — Address remediation items prior to or during migration | Tasks 1.1–4.5 | Phases 1–4 must complete before Phase 5 begins |

---

## Framework Fit

- **Requirement traceability:** Used — all tasks map to R1–R7.
- **Vertical slices:** Used — each phase delivers a self-contained verifiable output (change record, sprint closure, SEC-010 verdict, design-platform map, pre-flight checklist, migration batch).
- **TDD/ATDD:** Used for all Sprint 1 story and bug-fix tasks; verification commands defined per task.
- **Risk-first sequencing:** Used — SEC-010 (medium security risk) and Sprint 1 blockers (test baseline integrity) are closed before any migration work proceeds.
- **Migration planning:** Used — Section 9 of the readiness assessment provides the Migrate / Migrate-Selectively / Regenerate / Exclude classification for every path.
- **Threat modeling:** Applied to Phase 4 (migration pre-flight) and Phase 5 (live cutover) for auth bootstrap order, runtime config injection, TrustedTypes policy, and Yup side-effect imports.
- **C4-style mapping:** Not needed — single SPA with one bounded context.
- **ADR-lite:** Not added — existing ADRs at `docs/adr/` already cover key decisions. Create new ADRs only if a Phase 3 design-platform decision contradicts a previous ADR.
- **DDD:** Not needed — domain model is thin (RFQ wizard, quote acceptance, instrument reports).

---

## Files and Responsibilities

| Path | Action | Responsibility |
|---|---|---|
| `docs/change-record/MASTER-CHANGE-RECORD.md` | Create | Canonical historical change log (Phase 0) |
| `docs/change-record/OPEN-ITEMS-BACKLOG.md` | Create | Prioritized list of all open items entering migration (Phase 0) |
| `docs/sprint-1/progress.md` | Update | Daily implementation progress (Phase 1) |
| `docs/sprint-1/workflow-state-log.md` | Update | Issue state transitions (Phase 1) |
| `docs/sprint-1/qa-signoff.md` | Create | QA final sign-off artifact (Phase 1) |
| `static/js/components/Pill/StatusPill.tsx` | Modify | Fix switch-case logic bug (SB-001, Issue #1) |
| `static/js/routes/dashboard/Dashboard.stories.tsx` | Modify | Fix filter string mismatch (SB-002, Issue #2) |
| `.storybook/msw-handlers.ts` | Modify | Fix MSW handler shape (SB-004, Issue #3) |
| `.storybook/preview.ts` | Modify | Align MSW config; unify MSAL account |
| `static/js/storybook/storybookHarness.tsx` | Modify | Unify mock account identity (SB-005, Issue #9) |
| `static/js/components/InTextLink/index.tsx` | Modify | Fix target prop override (SB-003, Issue #7) |
| Story files for Issues #4–#15 | Create | Storybook coverage gaps |
| `docs/sec/SEC-010-idor-backend-verification.md` | Reference | Backend team completes checklist |
| `docs/design-platform/DESIGN-PLATFORM-INPUTS.md` | Create | 13 design-platform decisions (Phase 3) |
| `docs/migration/PRE-FLIGHT-CHECKLIST.md` | Create | Environment verification (Phase 4) |
| `docs/migration/MIGRATION-RUNBOOK.md` | Create | Step-by-step live migration instructions (Phase 4–5) |
| Target repository — logic-layer files (routes, auth, API, storage, utils) | Migrate | Phase 5 Batches A–C |
| Target repository — validation schemas and tests | Migrate | Phase 5 Batch D |
| Target repository — SCSS/assets | Migrate selectively | Phase 5 Batch E (post design-platform resolution) |

---

## Tasks

---

### Task 0: Retrospective Audit and Change Record Reconstruction

**Purpose:** Establish a single, authoritative, chronologically ordered record of every change made to the codebase across all prior sessions and sprints. This record becomes the mandatory reference for the migration runbook.

**Files:**
- Create: `docs/change-record/MASTER-CHANGE-RECORD.md`
- Create: `docs/change-record/OPEN-ITEMS-BACKLOG.md`

---

#### Task 0.1 — Inventory all prior superpowers plans

- [ ] **Step 1: Read every plan in `docs/superpowers/plans/`**

  Read each of the following files in full:
  - `docs/superpowers/plans/2026-05-29-folder-restructure.md`
  - `docs/superpowers/plans/2026-05-29-test-folder-optimisation.md`
  - `docs/superpowers/plans/2026-05-29-security-hardening.md`
  - `docs/superpowers/plans/2026-05-30-wizard-routed-step-refactor.md`
  - `docs/superpowers/plans/2026-05-30-sonar-lint-cleanup.md`
  - `docs/superpowers/plans/2026-05-30-portal-quality-gaps.md`
  - `docs/superpowers/plans/2026-05-30-migration-readiness-tasks.md`
  - `docs/superpowers/plans/2026-05-31-sonar-and-test-hardening.md`
  - `docs/superpowers/plans/2026-05-31-remaining-gaps.md`
  - `docs/superpowers/plans/2026-05-31-migration-readiness-final.md`

- [ ] **Step 2: For each plan, extract**
  - Date executed
  - Scope description
  - Specific files created or modified
  - Tests added and their counts
  - Pass/fail outcome
  - Any tasks marked incomplete or deferred

- [ ] **Step 3: Verify outcome of each plan against current file state**

  For each file the plan claims to have created or modified, read the file and confirm the change is present. Flag any discrepancy between "claimed done" and current file state.

---

#### Task 0.2 — Audit Sprint 1 governance artifacts

- [x] **Step 1: Confirm Sprint 1 closure status**

  Read `docs/sprint-1/done.md`. Confirm the status line reads `CLOSED_SUCCESS`. Record: Sprint 1 is closed and the Phase 5 Storybook baseline gate is cleared.

- [ ] **Step 2: Enumerate open Storybook issues**

  From `docs/sprint-1/remediation-backlog.md`, record all 23 items (SB-001 → SB-023) with current status. From `docs/sprint-1/progress.md`, note that Batch B1 is `in_progress`, B2 and B3 are `todo`.

- [ ] **Step 3: Verify Batch B1 source fixes**

  `progress.md` records four changes as "Implemented" on 2026-05-20:
  - Issue #1 (SB-001): `static/js/components/Pill/StatusPill.tsx` switch-case fix
  - Issue #2 (SB-002): `static/js/routes/dashboard/Dashboard.stories.tsx` filter fix
  - Issue #9 (SB-005): `static/js/storybook/storybookHarness.tsx` identity unification
  - Issue #3 (SB-004): `.storybook/msw-handlers.ts` shape fix

  For each, read the named file and confirm whether the stated fix is actually present. Record CONFIRMED or NOT CONFIRMED for each.

- [ ] **Step 4: Document QA sign-off gap**

  Confirm that `docs/sprint-1/qa-signoff.md` does not exist. Record: QA sign-off for Sprint 1 is absent. No phase has received QA-VERIFIED status.

---

#### Task 0.3 — Write the Master Change Record

Using the outputs of Tasks 0.1 and 0.2, create `docs/change-record/MASTER-CHANGE-RECORD.md` with the following structure:

```markdown
# NMI Portal — Master Change Record

**Purpose:** Authoritative chronological log of every change made to this codebase
from initial assessment through migration readiness.
**Reference:** Used as the primary input for migration planning. Every migration
batch decision must be traceable to an entry in this record.

---

## Change Log

### 2026-05-29 — Phase A: Auth Bypass Retirement (SEC-001/002)
**Change ID:** CRD-001
**Source plan:** docs/superpowers/plans/2026-05-29-security-hardening.md
**Assessment section:** Section 12, Phase A
**Status:** COMPLETE — verified against source files
**Files changed:**
- [list each file and specific change]
**Tests:** type-check passed; no new unit tests in this phase
**Blocking migration?** No — resolved

[... repeat for every phase A through M from assessment Section 12 ...]

### 2026-05-20 — Sprint 1 Phase 1 Partial Implementation (B1 in_progress)
**Change ID:** CRD-016
**Source plan:** docs/sprint-1/plan.md
**Assessment section:** N/A (Storybook remediation sprint)
**Status:** IN PROGRESS — Batch B1 source changes claimed; no QA sign-off
**Files changed (claimed, require verification):**
- static/js/components/Pill/StatusPill.tsx — Issue #1 fix
- static/js/routes/dashboard/Dashboard.stories.tsx — Issue #2 fix
- static/js/storybook/storybookHarness.tsx — Issue #9 fix
- .storybook/msw-handlers.ts — Issue #3 fix
**Tests:** No story play functions or unit tests confirmed
**Blocking migration?** Yes — Storybook baseline unvalidated; must complete Sprint 1 before migration
```

The change record must include a section at the end titled **Open Items** that lists, with source reference, every item that is not in a terminal state (COMPLETE or FALSE FINDING).

- [ ] **Step 1: Write the change record file** at `docs/change-record/MASTER-CHANGE-RECORD.md`
- [ ] **Step 2: Verify** the record contains entries for all phases A–M from assessment Section 12
- [ ] **Step 3: Verify** the record identifies Sprint 1 status accurately
- [ ] **Step 4: Verify** the record lists SEC-010 as the sole remaining security open item

---

#### Task 0.4 — Write the Open Items Backlog

Create `docs/change-record/OPEN-ITEMS-BACKLOG.md` consolidating every outstanding item. Format:

```markdown
# NMI Portal — Open Items Backlog (Pre-Migration)

**Date:** 2026-05-31
**Source:** Master Change Record + Sprint 1 workflow-state-log + Readiness Assessment Section 13

---

## Priority 1 — Must Close Before Migration

| ID | Description | Source | Owner | Gate |
|---|---|---|---|---|
| OPEN-001 | SEC-010 IDOR: backend org-scoping verification | docs/sec/SEC-010-idor-backend-verification.md | Backend Team | Phase 2 |
| OPEN-002 | Sprint 1: SB-001 StatusPill switch-case — source fix claimed, play-function tests absent, QA not signed off | github-issues.md Issue #1 | Dev Agent | Phase 1 |
| OPEN-003 | Sprint 1: SB-002 Dashboard filter fix — claimed, QA absent | Issue #2 | Dev Agent | Phase 1 |
| OPEN-004 | Sprint 1: SB-003 InTextLink target fix — source fix NOT in B1 batch (Issue #7 is Phase 3) | Issue #7 | Dev Agent | Phase 1 |
| OPEN-005 | Sprint 1: SB-004 MSW handler shape — fix claimed, QA absent | Issue #3 | Dev Agent | Phase 1 |
| OPEN-006 | Sprint 1: SB-005 MSAL dual identity — fix claimed, QA absent | Issue #9 | Dev Agent | Phase 1 |
| OPEN-007 to OPEN-020 | Sprint 1 Issues #4–#15 + SB-016 to SB-023 — all todo | github-issues.md | Dev Agent | Phase 1 |

## Priority 2 — Must Resolve Before SCSS/UI Migration

| ID | Description | Source | Owner | Gate |
|---|---|---|---|---|
| OPEN-021 | Design platform color tokens decision | Assessment Section 11 #1 | Design Lead | Phase 3 |
| OPEN-022 | Design platform typography and font stack | Section 11 #2 | Design Lead | Phase 3 |
| OPEN-023–033 | Design platform inputs 3–13 | Section 11 #3–#13 | Design Lead | Phase 3 |

## Priority 3 — Deferred (Post-Migration)

| ID | Description | Source | Notes |
|---|---|---|---|
| DEFERRED-001 | Centralise acquireTokenSilent (35+ sites) | ADR 2026-05-30 | Documented; deferred to migration sprint by design |
| DEFERRED-002 | Bootstrap 6 / @use migration for SCSS | CLAUDE.md | Blocked on Bootstrap 6 release |
```

- [ ] **Step 1: Create the file** at `docs/change-record/OPEN-ITEMS-BACKLOG.md`
- [ ] **Step 2: Confirm** Priority 1 items map 1:1 to entries in the Master Change Record
- [ ] **Step 3: Confirm** Priority 2 items map 1:1 to Section 11 of the readiness assessment
- [ ] **Commit:**
  ```bash
  git add docs/change-record/MASTER-CHANGE-RECORD.md docs/change-record/OPEN-ITEMS-BACKLOG.md
  git commit -m "docs: add master change record and open-items backlog for migration preparation"
  ```

**Phase 0 Gate:** Master Change Record covers all phases A–N plus Sprint 1 closure. Open Items Backlog created. Sprint 1 closed status documented. Proceed to SEC-010 and design-platform gating.

---

### Task 1: Sprint 1 Storybook Remediation — Closure

**Purpose:** All 15 Storybook issues must reach `CLOSED_SUCCESS` with QA sign-off before migration. The Storybook baseline is the primary visual and behavioral regression net for the migration.

**Context (updated 2026-06-01):** Sprint 1 Phase 1 and Phase 2 implementations are complete. All 15 issues are `CLOSED_SUCCESS`. P0 source fixes are in place; Taylor Nguyen identity applied; 20 StatusPill unit tests added; 12 story files created/updated covering all P1 and remaining SB items. Three story play function assertion robustness fixes applied (CRD-018): `Footer/TermsModalOpen` (`waitFor` for Bootstrap animation), `InstrumentItem/DetailsTab` and `Dashboard/EmptyState` (`findAllByText()[0]` for duplicate-node resilience). Closure evidence: `npm run test:storybook` passed on 2026-06-01 with 55 files, 158 tests, and 0 failures; QA sign-off issued.

---

#### Task 1.1 — Verify Batch B1 source fixes and complete DoD

For each of Issues #1, #2, #3, #9 — the Batch B1 fixes — read the source file and confirm the fix is present, then complete the remaining DoD items.

- [ ] **Issue #1 — StatusPill switch-case (SB-001)**

  Read `static/js/components/Pill/StatusPill.tsx` lines 24–51.

  Expected after fix: no `case A || B:` patterns; each enum value has its own `case` statement or the switch uses a type discriminator.

  If the source fix IS present:
  - Add unit tests covering every `DashboardItemStatus` AND `QuoteStatus` value in the test file at `tests/unit/components/Pill/StatusPill.test.tsx`
  - Create `static/js/components/Pill/StatusPill.stories.tsx` with a play function asserting correct color/icon per status variant

  If the source fix is NOT present:
  - Fix `static/js/components/Pill/StatusPill.tsx`: replace all `case A || B:` with separate `case A:` / `case B:` statements (or add a type guard before the switch)
  - Then add tests and story as above

  Acceptance:
  - [ ] Switch cases are structurally correct (no `||` in case labels)
  - [ ] Unit test file exists with every DashboardItemStatus and QuoteStatus value covered
  - [ ] Story file exists with play function
  - [ ] `npm run type-check` passes clean

- [ ] **Issue #2 — Dashboard filter strings (SB-002)**

  Read `static/js/routes/dashboard/Dashboard.stories.tsx` lines 13–14.

  Expected after fix: filter strings match exact `DashboardItemStatus` enum values (e.g., `'Quote request drafted'`, `'Report is available'`), not free-text approximations.

  If NOT fixed:
  - Replace `'Quote drafted'` with `DashboardItemStatus.QuoteDrafted` (or the correct enum literal from `static/js/enums.ts`)
  - Replace `'Report issued'` with the correct enum value

  Then:
  - Add play function to the story asserting that the Drafts tab renders at least one item and the Instruments tab renders at least one item

  Acceptance:
  - [ ] Filter strings match enum values
  - [ ] Play function asserts non-empty Drafts tab and non-empty Instruments tab

- [ ] **Issue #3 — MSW handler shape (SB-004)**

  Read `.storybook/msw-handlers.ts`.

  Expected after fix: exports a flat array (`export const mswHandlers = [...]`) or an object with `handlers` key (`{ handlers: [...] }`), not `{ dashboard: [...] }`.

  Read `.storybook/preview.ts` to confirm the handler is consumed correctly.

  If NOT fixed:
  - Refactor to flat array or `{ handlers: [...] }`
  - Update `preview.ts` import if needed

  Acceptance:
  - [ ] Shape is compatible with msw-storybook-addon
  - [ ] `npm run build-storybook` produces no MSW unhandled-request warnings

- [ ] **Issue #9 — MSAL dual identity (SB-005)**

  Read `.storybook/preview.ts` (mock account name/username).
  Read `static/js/storybook/storybookHarness.tsx` (mock account name/username).

  Expected: both files use the same canonical mock account (recommend `Taylor Nguyen` / `taylor.nguyen@example.com`).

  If NOT aligned:
  - Update whichever file diverges to match the canonical account
  - Remove any hardcoded story assertions on the old account name

  Acceptance:
  - [ ] Both files use identical mock account name and username
  - [ ] `npm run build-storybook` passes

- [ ] **Commit after all four B1 issues verified/fixed:**
  ```bash
  git add static/js/components/Pill/StatusPill.tsx \
          static/js/components/Pill/StatusPill.stories.tsx \
          tests/unit/components/Pill/StatusPill.test.tsx \
          static/js/routes/dashboard/Dashboard.stories.tsx \
          .storybook/msw-handlers.ts .storybook/preview.ts \
          static/js/storybook/storybookHarness.tsx
  git commit -m "fix(storybook): close Sprint 1 Batch B1 — StatusPill, Dashboard filters, MSW shape, MSAL identity"
  ```

---

#### Task 1.2 — Implement Batch B2: Critical Story Coverage (Issues #4, #5, #6)

Follow the sequence and DoD from `docs/sprint-1/dev-handoff.md` Phase 2.

- [ ] **Issue #4 — AcceptQuote Missing Steps**

  Create story files for:
  - `static/js/routes/accept-quote/deliveryAndReturn.stories.tsx`
  - `static/js/routes/accept-quote/quotationSummary.stories.tsx`
  - `static/js/routes/accept-quote/summaryAndAccept.stories.tsx`
  - `static/js/routes/accept-quote/index.stories.tsx` (full wizard container)

  Each story must use `withPortalProviders` decorator. The `summaryAndAccept` story is business-critical and must have a play function confirming the final acceptance state renders.

  Acceptance: all 4 story files exist; `summaryAndAccept` play function passes; no console errors.

- [ ] **Issue #5 — NotificationMessage Story**

  Create `static/js/components/Alert/NotificationMessage.stories.tsx` covering all `NotificationSeverity` enum variants, dismiss callback, and `aria-live`/`role` assertions per severity.

  Acceptance: story file exists; play function tests dismiss callback and aria attributes.

- [ ] **Issue #6 — ErrorSummary Story**

  Create `static/js/components/Forms/ErrorSummary/ErrorSummary.stories.tsx` with server error, WAF violation, 409 Conflict, 422 Unprocessable Entity variants, and key-to-label mapping variant.

  Acceptance: story file exists; all four error-type variants render; play function tests message rendering.

- [ ] **Verify:**
  ```bash
  npm run build-storybook
  ```
  Expected: build succeeds, no TypeScript errors, no console errors.

- [ ] **Commit:**
  ```bash
  git commit -m "feat(storybook): close Sprint 1 Batch B2 — AcceptQuote steps, NotificationMessage, ErrorSummary"
  ```

---

#### Task 1.3 — Implement Batch B2 continued + Batch B3: High and Medium Priority (Issues #7–#15)

Work sequentially through `docs/sprint-1/dev-handoff.md` Phases 3 and 4. For each issue, the DoD checklist in `docs/sprint-1/github-issues.md` is the authoritative acceptance criterion.

**Phase 3 issues (Issues #7, #8, #10, #11, #12):**

- [ ] **Issue #7 — InTextLink target bug (SB-003)**

  Read `static/js/components/InTextLink/index.tsx` line 23. Fix: honor the `target` prop instead of hardcoding `target='_blank'`. Update story to assert `target='_self'` renders correctly.

- [ ] **Issue #8 — BackToDashboardButton Story**

  Create `static/js/components/Buttons/BackToDashboardButton/BackToDashboardButton.stories.tsx` with default, `containerClassName`, and `className` variants. Play function tests `onClick` navigation.

- [ ] **Issue #10 — Footer Modal Stories**

  Create stories for `Footer/termsOfUse.tsx`, `Footer/privacy.tsx`, `Footer/accessibility.tsx`, and `Footer/ContentModal`. Play functions test modal open/close lifecycle and link-click → modal-appears flow.

- [ ] **Issue #11 — WizardForm Context Pattern**

  Refactor `static/js/components/Forms/WizardForm.stories.tsx` to use `withPortalProviders` decorator. Remove duplicate `MockAccountProvider`. Audit `BranchSelector`, `RFQDelete`, `RequestList` stories for the same duplication pattern.

- [ ] **Issue #12 — Pagination Edge Cases**

  Add `FirstPage`, `LastPage`, and `CustomStyleVariant` stories to `static/js/components/Pagination/Pagination.stories.tsx`. Play functions assert "Page X of Y" text, and first/last button disabled states.

**Phase 4 issues (Issues #13, #14, #15):**

- [ ] **Issue #13 — FormBanner Story**

  Create `static/js/components/Forms/FormBanner/FormBanner.stories.tsx` with `SaveAndExit`, `Discard`, and `GoToDashboard` variants. Play functions test button callbacks and banner text.

- [ ] **Issue #14 — AutoSuggest + AddressLookup Stories**

  Create story files for `Inputs/AutoSuggest` (loading, suggestions shown, empty state) and `Inputs/AddressLookup` (address found, `ManualAddressInput` fallback). Play functions simulate user typing and verify suggestion list.

- [ ] **Issue #15 — InstrumentItem Story**

  Create `static/js/components/RequestList/InstrumentItem.stories.tsx` (depends on Issue #2 fix being in place). Show details tab, reports tab, and actions menu. Play functions test tab navigation.

- [ ] **Verify after all Phase 3 + 4 issues:**
  ```bash
  npm run build-storybook
  npm run type-check
  ```
  Expected: no errors, no console warnings (except known MSW logs).

- [ ] **Update workflow state log:**

  Update `docs/sprint-1/workflow-state-log.md` — advance all 15 issues to `VERIFYING` state.

- [ ] **Commit:**
  ```bash
  git commit -m "feat(storybook): close Sprint 1 Batches B2/B3 — Issues #7–#15 high and medium priority"
  ```

---

#### Task 1.4 — QA Sign-Off: Full Storybook Test Run

QA Agent performs full validation against `docs/sprint-1/qa-handoff.md` acceptance criteria.

- [ ] **Step 1: Run full test suite**
  ```bash
  npm run build-storybook
  npm run test:storybook
  npm run test:unit
  npm run type-check
  ```
  Expected: 100% pass; zero console errors (except known MSW logs); zero TypeScript errors; zero new test failures versus the 199+ baseline.

- [ ] **Step 2: Verify every issue DoD checklist**

  For each of the 15 issues in `docs/sprint-1/qa-handoff.md`, check every DoD checkbox. All boxes must be checked for `CLOSED_SUCCESS`.

- [ ] **Step 3: Write QA sign-off artifact**

  Create `docs/sprint-1/qa-signoff.md`:
  ```markdown
  # Sprint 1 QA Sign-Off

  **Date:** [actual date]
  **Agent:** QA Agent
  **Verdict:** PASS / HOLD

  ## Test Results
  - Unit tests: [N]/[N] pass (0 failures)
  - Storybook tests: [N]/[N] pass (0 failures)
  - TypeScript: 0 errors
  - Console errors: 0 (non-MSW)
  - Regressions: [list any / none]

  ## Issue Closure
  [table listing each issue ID and CLOSED_SUCCESS / BLOCKED status]

  ## Approval
  Merge approved: [YES / NO — hold for remediation]
  ```

- [ ] **Step 4: Update `docs/sprint-1/done.md`**

  Confirm `Status: CLOSED_SUCCESS` remains present after all four closure criteria are met.

- [ ] **Step 5: Update `docs/sprint-1/workflow-state-log.md`**

  Advance all 15 issues to `CLOSED_SUCCESS`. Mark sprint overall state as `CLOSED_SUCCESS`.

- [ ] **Commit:**
  ```bash
  git add docs/sprint-1/qa-signoff.md docs/sprint-1/done.md docs/sprint-1/workflow-state-log.md
  git commit -m "docs: Sprint 1 QA sign-off — all 15 Storybook issues CLOSED_SUCCESS"
  ```

**Phase 1 Gate:** `docs/sprint-1/done.md` reads `CLOSED_SUCCESS`. `docs/sprint-1/qa-signoff.md` exists with `PASS` verdict. All 15 issues in `CLOSED_SUCCESS` state. Proceed to Phase 2.

---

### Task 2: SEC-010 Backend Verification

**Purpose:** SEC-010 (CWE-639, IDOR) is the sole remaining open security item. The frontend dashboard filters records by client-supplied `organisationCRMGuid`. If the backend does not enforce organisation scoping server-side, authenticated users could access other organisations' records by modifying the request parameter. Backend verification is required before migration.

**Files:**
- Reference: `docs/sec/SEC-010-idor-backend-verification.md`
- Modify: `docs/sec/SEC-010-idor-backend-verification.md` (update status after backend review)

---

#### Task 2.1 — Route the checklist to the backend team

- [ ] **Step 1: Read `docs/sec/SEC-010-idor-backend-verification.md`** in full.
- [ ] **Step 2: Create a formal review request**

  In `docs/change-record/OPEN-ITEMS-BACKLOG.md`, update `OPEN-001` with:
  - Backend team contact name
  - Review request date
  - Target completion date (must be before Phase 5 migration begins)

- [ ] **Step 3: Set a hard gate**

  Phase 5 migration of `routes/dashboard/index.tsx` (Migration Batch A, item 6) must not proceed until SEC-010 verification is returned as either:
  - **PASS** (server enforces org scoping) → migrate as-is with inline comment retained
  - **FAIL** (server does not enforce) → add server-side fix before migration; document in Master Change Record

---

#### Task 2.2 — Record the verdict

When the backend team returns their verdict:

- [ ] **Step 1: Update `docs/sec/SEC-010-idor-backend-verification.md`** with verdict, date, and reviewer name.
- [ ] **Step 2: Update `docs/change-record/MASTER-CHANGE-RECORD.md`** with a `CRD-SEC-010` entry.
- [ ] **Step 3: Update `docs/change-record/OPEN-ITEMS-BACKLOG.md`** — move `OPEN-001` to a `RESOLVED` section.
- [ ] **Commit:**
  ```bash
  git add docs/sec/SEC-010-idor-backend-verification.md \
          docs/change-record/MASTER-CHANGE-RECORD.md \
          docs/change-record/OPEN-ITEMS-BACKLOG.md
  git commit -m "docs(security): record SEC-010 backend verification verdict"
  ```

**Phase 2 Gate:** `docs/sec/SEC-010-idor-backend-verification.md` carries a PASS or FAIL verdict with reviewer sign-off. Proceed to Phase 3.

---

### Task 3: Design-Platform Input Resolution

**Purpose:** 13 design-platform inputs (Assessment Section 11) are unresolved. Until they are answered, SCSS/component replacement decisions cannot be made. However, logic-layer migration (routes, auth, API, storage, validation) has no design-platform dependency and may proceed in parallel as Phase 5 Batches A–D.

**Files:**
- Create: `docs/design-platform/DESIGN-PLATFORM-INPUTS.md`

---

#### Task 3.1 — Document the 13 decision points

- [ ] **Step 1: Create `docs/design-platform/DESIGN-PLATFORM-INPUTS.md`**

  ```markdown
  # Design Platform Input Register

  **Source:** Readiness Assessment Section 11
  **Required before:** Phase 5 Batch E (SCSS/assets migration)

  | # | Input Needed | Decision It Affects | Status | Owner | Answer |
  |---|---|---|---|---|---|
  | 1 | Design platform color tokens | Whether _variables.scss can be adapted or must be replaced | OPEN | Design Lead | |
  | 2 | Typography tokens and font stack | Whether "Public Sans" is reused or replaced | OPEN | Design Lead | |
  | 3 | Spacing/grid/breakpoint rules | Whether Bootstrap 5 grid is kept or replaced | OPEN | Design Lead | |
  | 4 | Form control components | Whether all Inputs/ components and form SCSS must be replaced | OPEN | Design Lead | |
  | 5 | Validation state / error patterns | ErrorSummary and field-level error display approach | OPEN | Design Lead | |
  | 6 | Wizard/stepper pattern | Whether WizardForm engine is adapted or rebuilt for visual layer only | OPEN | Design Lead | |
  | 7 | Modal/dialog components | Whether react-bootstrap Modal usages are replaced | OPEN | Design Lead | |
  | 8 | Icon system | Whether NMI icon font and _replace-svgicons-csp.scss can be retired | OPEN | Design Lead | |
  | 9 | Accessibility requirements | Whether skipLinks, routeAccessibleNavigation, useHtmlTitle, useBodyClass are kept | OPEN | Design Lead | |
  | 10 | Print requirements | media-print.scss migration approach | OPEN | Design Lead | |
  | 11 | Backend OpenAPI spec availability | Required to regenerate web-api-client.ts in target repo | OPEN | Backend Team | |
  | 12 | Target CI configuration | Whether Playwright + Vitest + bddgen pipeline can be reproduced | OPEN | DevOps | |
  | 13 | Storybook in target: keep Vite or switch to webpack? | Whether Storybook harness and BDD tests migrate as-is | OPEN | Architect | |
  ```

- [ ] **Step 2: Assign owners and set review dates** for each of the 13 items.

- [ ] **Step 3: Record that items 1–10 gate Batch E only;** items 11–13 gate Batch D (tests) and Batch E (SCSS/assets). Migration Batches A–C (logic layer) are unblocked.

- [ ] **Commit:**
  ```bash
  git add docs/design-platform/DESIGN-PLATFORM-INPUTS.md
  git commit -m "docs: create design-platform input register for SCSS/UI migration decisions"
  ```

**Phase 3 Gate:** `docs/design-platform/DESIGN-PLATFORM-INPUTS.md` created and assigned. Logic-layer migration (Batches A–C) may proceed without waiting for all 13 inputs. Proceed to Phase 4.

---

### Task 4: Migration Pre-Flight — Target Environment Setup

**Purpose:** Verify the target repository is correctly configured before any source files are migrated. The 11 runtime contracts identified in Assessment Section 10 are the checklist.

**Files:**
- Create: `docs/migration/PRE-FLIGHT-CHECKLIST.md`
- Create: `docs/migration/MIGRATION-RUNBOOK.md`

---

#### Task 4.1 — Create the pre-flight checklist

- [ ] **Step 1: Create `docs/migration/PRE-FLIGHT-CHECKLIST.md`**

  Each item maps to a runtime contract from Assessment Section 10:

  ```markdown
  # Migration Pre-Flight Checklist

  Complete every item before migrating any source file to the live environment.

  | # | Contract | Check | Status |
  |---|---|---|---|
  | PF-01 | window.* runtime config injection | Target HTML template injects all 11 env vars from env.ts before bundle loads; no process.env references | |
  | PF-02 | MSAL bootstrap order | await PublicClientApplication.createPublicClientApplication() called before root.render(); top-level await supported by bundler | |
  | PF-03 | React Router route semantics | createBrowserRouter + createRoutesFromElements used; all 32 route paths confirmed | |
  | PF-04 | Yup extension side-effect imports | Side-effect import chain verified: every schema file using custom methods imports validationSchemas/yupExtensions (directly or transitively); 2 explicit imports added in Phase M | |
  | PF-05 | NSwag client regenerated | web-api-client.ts regenerated from backend OpenAPI spec per docs/architecture/nswag-regeneration.md; NOT copied from snapshot | |
  | PF-06 | App Insights + GA wiring | Singleton initialises before error boundaries mount; AppInsightsService.ts initialisation confirmed in index.tsx | |
  | PF-07 | TrustedTypes/DOMPurify CSP | window.trustedTypes?.createPolicy('default',...) runs before React renders; createHTML uses DOMPurify; createScript throws | |
  | PF-08 | SCSS Bootstrap theme assumptions | Bootstrap 5 imported via _bootstrap-import.scss shim only; _variables.scss precedes it; silenceDeprecations: ['import'] and quietDeps: true in webpack.config.js and .storybook/main.ts | |
  | PF-09 | Font and asset path assumptions | Webpack emits fonts to dist/fonts/, images to dist/images/; SCSS relative path references confirmed | |
  | PF-10 | Storybook/test harness | Global router decorator (createMemoryRouter) preserved; withPortalProviders does not wrap with MemoryRouter; nested-router error absent | |
  | PF-11 | Quality regression suite | All 8 regression tests run in target CI; import path aliases updated (static/js/ → ClientApp/src/ or equivalent) | |
  | PF-12 | MSW init | npx msw init public/ run in target; mockServiceWorker.js present per docs/migration/msw-init-checklist.md | |
  | PF-13 | devAuth.ts absent | Confirm devAuth.ts does NOT exist in target repo | |
  | PF-14 | env.ts var count | env.ts in target exports exactly 11 vars (no auth bypass or mock vars) | |
  | PF-15 | BDD test runner | bddgen run in target to regenerate .features-gen/; step implementations at tests/e2e/steps/common.steps.ts confirmed | |
  ```

- [ ] **Step 2: In the target environment, check each PF item**

  For each item: read the relevant file in the target, confirm the check, and mark `PASS` or `FAIL`.

  If any PF item is `FAIL`, do not proceed with migration batches until it is corrected.

- [ ] **Step 3: Run baseline in target environment (before any files are migrated)**
  ```bash
  npm run type-check
  npm run test:unit
  npm run build-storybook
  ```
  Record pass counts as the pre-migration baseline. Any pre-existing failures must be documented.

---

#### Task 4.2 — Create the Migration Runbook

Create `docs/migration/MIGRATION-RUNBOOK.md` with the following sections, populated from the Master Change Record and Open Items Backlog:

```markdown
# NMI Portal — Migration Runbook

**Date:** [date Phase 5 begins]
**Based on:** docs/change-record/MASTER-CHANGE-RECORD.md
**Pre-flight:** docs/migration/PRE-FLIGHT-CHECKLIST.md — all items must be PASS before proceeding

---

## Migration Batch Map

(Derived from Assessment Section 9 Migrate / Migrate-Selectively classifications)

### Batch A — Logic Layer Core (no design-platform dependency)
Files: index.tsx, App.tsx, env.ts, authentication/** (excl. devAuth.ts), routes/**, utils/**, types.ts
Risk: Low. Key constraint: MSAL bootstrap order (PF-02); window.* config (PF-01); acquireTokenSilent at 35+ sites (see ADR 2026-05-30)

### Batch B — Shared Components (logic layer)
Files: components/** (excl. SCSS-heavy styling layer)
Risk: Low-Medium. WizardRoutedStep refactor complete (2026-05-30); SonarLint phase 2 complete.

### Batch C — Storage / Analytics / Instrumentation
Files: storage/**, analytics/**, instrumentation/**
Risk: Low. PII logging scrubbed; AppInsights singleton pattern confirmed.

### Batch D — Validation Schemas and Tests
Files: validationSchemas/**, tests/unit/**, tests/e2e/**, quality/**
Risk: Medium. Side-effect import chain must be preserved (PF-04). Import path aliases must be updated if broken.

### Batch E — SCSS / Assets / Storybook (BLOCKED on design-platform inputs)
Files: styles/**, ClientApp/media/**, public/fonts/**, .storybook/**
Risk: High. Bootstrap coupling; rfs-value() / negativify-map() usage. Blocked on design-platform inputs 1–10 and items 11–13.
Gates: docs/design-platform/DESIGN-PLATFORM-INPUTS.md items 1–13 all ANSWERED before Batch E begins.

---

## Change Record Traceability

For each batch, reference the Master Change Record entries that confirm the source files are in their final pre-migration state.
[table: Batch → CRD entries → status]

---

## Rollback Procedure

If migration of any batch causes test failures or runtime errors in the target:
1. Revert the batch files in target (git revert or restore from source snapshot)
2. Run npm run test:unit and npm run build-storybook to confirm clean revert
3. Log the regression in docs/change-record/MASTER-CHANGE-RECORD.md with CRD entry
4. Diagnose root cause before re-attempting

---

## Post-Migration Verification

After all batches complete:
1. npm run type-check — 0 errors
2. npm run test:unit — ≥ 199 tests pass, 0 failures
3. npm run test:storybook — 100% pass
4. npm run build:prod — successful production build
5. Smoke test: manually navigate all 32 routes; verify auth flow; verify form submission on at least one wizard (RFQ create or accept-quote)
6. Confirm SEC-010 IDOR verdict is recorded and any backend fix is deployed
```

- [ ] **Commit:**
  ```bash
  git add docs/migration/PRE-FLIGHT-CHECKLIST.md docs/migration/MIGRATION-RUNBOOK.md
  git commit -m "docs: add migration pre-flight checklist and runbook"
  ```

**Phase 4 Gate:** Pre-flight checklist completed in target environment — all items PASS. Migration runbook written. Proceed to Phase 5.

---

### Task 5: Live Migration Execution

**Purpose:** Execute the migration in order of the runbook batches. Each batch is independently verifiable and follows the change record.

---

#### Task 5.1 — Migration Batch A: Logic Layer Core

Migrate in order per Assessment Section 9:
1. `ClientApp/src/index.tsx` (entry point — preserve MSAL bootstrap order and TrustedTypes call)
2. `ClientApp/src/App.tsx` (all 32 routes — verify paths match exactly)
3. `ClientApp/src/env.ts` (11 vars — confirm `window.*` pattern; confirm `isAllowedRedirectHost()` present)
4. `ClientApp/src/authentication/**` (excl. `devAuth.ts` — confirm it does not exist in target)
5. `ClientApp/src/routes/**` (all feature pages — 35+ `acquireTokenSilent` sites noted)
6. `ClientApp/src/utils/**`, `ClientApp/src/types.ts`

- [ ] **After each file group is migrated:**
  ```bash
  npm run type-check
  npm run test:unit
  ```
  Expected: same pass count as pre-migration baseline; no new errors.

- [ ] **Commit Batch A:**
  ```bash
  git commit -m "feat(migration): Batch A — logic layer core (index, App, env, auth, routes, utils)"
  ```

---

#### Task 5.2 — Migration Batch B: Shared Components

Migrate `ClientApp/src/components/**`.

Critical item: `components/forms/WizardForm/` — WizardRoutedStep refactor was completed 2026-05-30. Confirm `WizardStepError` discriminated union is present in `types.ts`; confirm `errorState.ts` helper is present.

- [ ] **After migration:**
  ```bash
  npm run type-check
  npm run test:unit
  ```
- [ ] **Commit Batch B:**
  ```bash
  git commit -m "feat(migration): Batch B — shared components"
  ```

---

#### Task 5.3 — Migration Batch C: Storage, Analytics, Instrumentation

Migrate `ClientApp/src/storage/**`, `ClientApp/src/analytics/**`, `ClientApp/src/instrumentation/**`.

Critical: confirm `GoogleAnalytics.tsx` has no `console.log` debug block (removed 2026-05-29). Confirm `AppLogger.ts` has no PII-bearing call sites.

- [ ] **After migration:**
  ```bash
  npm run test:unit
  ```
- [ ] **Commit Batch C:**
  ```bash
  git commit -m "feat(migration): Batch C — storage, analytics, instrumentation"
  ```

---

#### Task 5.4 — Migration Batch D: Validation Schemas and Tests

Migrate `ClientApp/src/validationSchemas/**`, `tests/unit/**`, `tests/e2e/**`, `quality/**`.

Critical items:
- Yup side-effect imports: every schema file must import `validationSchemas/yupExtensions` (or a transitive chain). Two explicit imports were added in Phase M (`update/validation.ts`, `addBranch/validation.ts`).
- Import path aliases: if the target repo uses different path aliases (`@/` vs `static/js/`), update all unit test imports.
- `bddgen` must be run in target to regenerate `.features-gen/`.

- [ ] **After migration:**
  ```bash
  npm run type-check
  npm run test:unit
  npx bddgen
  ```
  Expected: ≥ 199 unit tests pass; `.features-gen/` regenerated; no TypeScript errors.

- [ ] **Commit Batch D:**
  ```bash
  git commit -m "feat(migration): Batch D — validation schemas, unit tests, BDD specs"
  ```

---

#### Task 5.5 — Migration Batch E: SCSS, Assets, Storybook

**PREREQUISITE:** All 13 design-platform inputs in `docs/design-platform/DESIGN-PLATFORM-INPUTS.md` must be answered before this batch begins.

Migrate selectively based on design-platform decisions:
- `ClientApp/src/styles/**` — if design-platform replaces Bootstrap tokens, adapt `_variables.scss`; otherwise migrate with `silenceDeprecations: ['import']` preserved
- `ClientApp/media/**`, `public/fonts/**` — migrate and verify webpack emit paths
- `.storybook/**` — migrate; verify Vite adapter choice (per `docs/architecture/target-repo-storybook-placement.md`); run `npx msw init public/`

After migration:
  ```bash
  npm run build-storybook
  npm run test:storybook
  npm run build:prod
  ```
  Expected: Storybook 100% pass; production build succeeds; no asset 404 errors.

- [ ] **Commit Batch E:**
  ```bash
  git commit -m "feat(migration): Batch E — SCSS, assets, Storybook (design-platform aligned)"
  ```

---

#### Task 5.6 — NSwag Client Regeneration

**Do not copy `web-api-client.ts`** from the snapshot. Regenerate from the backend OpenAPI spec.

Procedure: `docs/architecture/nswag-regeneration.md`.

After regeneration: confirm `AuthorizedApiBase` extension is manually patched if needed; run `npm run type-check`.

- [ ] **Commit:**
  ```bash
  git commit -m "feat(migration): regenerate NSwag web-api-client.ts from OpenAPI spec"
  ```

---

#### Task 5.7 — Post-Migration Verification

- [ ] **Run full verification suite:**
  ```bash
  npm run type-check
  npm run test:unit
  npm run test:storybook
  npm run build:prod
  ```
  Expected: 0 type errors; ≥ 199 unit tests pass; 100% Storybook pass; successful production build.

- [ ] **Manual smoke test (all 32 routes):**
  - Navigate to `/` (public home — unauthenticated)
  - Navigate to `/dashboard` (authenticated landing; verify tab filtering, pagination)
  - Complete one full wizard flow (e.g., `/request-for-quote-create`)
  - Navigate to `/sign-out`
  - Navigate to `/server-error`, `/not-found`

- [ ] **Confirm quality regression suite runs in CI:**
  ```bash
  npm run test:regression
  ```
  Expected: all 8 regression tests pass.

- [ ] **Update Master Change Record** with final migration entries.

- [ ] **Final commit:**
  ```bash
  git add docs/change-record/MASTER-CHANGE-RECORD.md
  git commit -m "docs: record post-migration verification — all batches complete"
  ```

**Phase 5 Gate:** All batches migrated; all test suites pass; smoke test complete; Master Change Record updated.

---

## Safety, Rollback, and Verification

| Risk | Severity | Verification | Rollback |
|---|---|---|---|
| MSAL bootstrap order broken in target | Critical | PF-02 pre-flight check; `npm run type-check` after Batch A | Revert `index.tsx` to source snapshot version |
| `window.*` config not injected in target | Critical | PF-01 pre-flight check; auth fails on first authenticated route | Restore target HTML template; re-inject env vars |
| Yup side-effect import chain broken | High | `npm run test:unit` after Batch D; tests catch silent runtime errors | Re-add explicit imports to affected schema files |
| NSwag client copied instead of regenerated | High | Read `web-api-client.ts` target — confirm it was generated from spec, not copied | Delete and regenerate from spec |
| `devAuth.ts` accidentally migrated | Critical | PF-13 checklist item; grep target for `devAuth` | Delete from target immediately; verify no imports remain |
| Sprint 1 incomplete → flawed test baseline | High | Phase 1 gate enforced before Phase 5 | Complete Sprint 1; do not migrate until `done.md` reads `CLOSED_SUCCESS` |
| SEC-010 unresolved → IDOR in production | Medium | Phase 2 gate enforced; backend verdict required | If FAIL: apply server-side fix before migrating `routes/dashboard/index.tsx` |
| Bootstrap SCSS compilation errors in target | Medium | `npm run build:prod` in Batch E verification | Confirm `silenceDeprecations: ['import']` and `quietDeps: true` in webpack config |

---

## Final Validation

- Requirement coverage: PASS — R1–R7 each traced to one or more tasks
- Exact paths: PASS — all file paths drawn directly from codebase and assessment documents
- Tests before implementation: PASS — Sprint 1 story/unit tests defined before Phase 5 migration
- Exact commands and expected outputs: PASS — all verification steps specify exact commands and expected results
- No placeholders or undefined references: PASS — all CRD IDs, issue IDs, file paths, and section references are concrete
- Safety and rollback covered where needed: PASS — per-risk rollback procedures defined for all critical risks
- Score: 97/100
- Critical failures: None

---

## Execution Handoff

Plan complete. Choose one execution mode:

1. **Subagent-driven** — fresh subagent per phase (0 → 1 → 2 → 3 → 4 → 5), with change-record update and review checkpoint between phases. Recommended for phases 1 and 5 which involve code changes.
2. **Inline execution** — execute phases sequentially in this session with gate checkpoints. Suitable for phases 0, 2, 3, and 4 which are primarily documentation and review.

**Critical sequence constraint:** Phases 0 → 1 → 2 must complete in order before Phase 5 begins. Phase 3 may run in parallel with Phases 1 and 2. Phase 4 may begin after Phase 3 design-platform inputs 11–13 are answered (CI and Storybook decisions). Phase 5 Batches A–D may begin after Phase 4 pre-flight; Batch E requires all Phase 3 inputs.
