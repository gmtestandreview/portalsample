# Open Items Backlog

**Date:** 2026-06-28 — CRD-041 reconciles the current tree: 41 registered routes, including six pattern/type approval paths; 31 top-level component families; 87 Storybook story files; 114 unit-test files; and 29 BDD feature files. Type-check, lint, unit tests (114 files / 1,169 tests), Storybook tests (87 files / 218 tests), and 8 quality regression tests pass. `COVERAGE-GATE-001` was open at that date: coverage was 74.43% statements / 75.51% branches / 72.56% functions / 74.92% lines against configured 100% thresholds. **Superseded 2026-09-04 (CRD-046):** coverage is 100% on all four metrics across 179 unit-test files / 2017 tests, and `COVERAGE-GATE-001` is CLOSED_SUCCESS.
**Source references:** Master Change Record (`docs/change-record/MASTER-CHANGE-RECORD.md`), `analysis/ARCHITECTURE.mmd`, `analysis/ASSESSMENT.html`, `analysis/ASSESSMENT.md`, `analysis/MODERNIZATION_BRIEF.md`, `docs/CONCERNS.md`, Sprint 1 Storybook Quality Remediation backlog, Security Assessment findings, Architecture Decision Records
**Purpose:** Prioritised tracking list for all work that must complete before or during the live migration of the NMI Customer Portal. This document is the authoritative gate-control companion to the Master Change Record. Items move off this list only when they reach CLOSED\_SUCCESS with appropriate sign-off.

---

## Backlog Intake and Governance Process

Use this process whenever the historical review, source merge, pre-flight checks, or migration execution identifies incomplete work:

1. Create a new backlog item immediately. Do not leave unresolved findings only in meeting notes, assessment prose, commit messages, or issue comments.
2. Assign `Priority 1` for blockers that can affect production security, auth, data isolation, runtime config, CI verification, or rollback. Assign `Priority 2` for decisions that block a specific migration batch. Assign `Priority 3` for accepted post-migration debt.
3. Link the item to the relevant `CRD-*` entry in `MASTER-CHANGE-RECORD.md`, or create a new `CRD-*` entry if no record exists.
4. Record owner, gate, evidence source, required decision or fix, and closure evidence.
5. Move an item to Resolved only after the closure evidence is recorded here and, where applicable, reflected in the readiness assessment HTML.

### Required Source Reconciliation

Before migration execution, reconcile `analysis/ARCHITECTURE.mmd`, `analysis/ASSESSMENT.html`, `analysis/ASSESSMENT.md`, `analysis/MODERNIZATION_BRIEF.md`, and `docs/CONCERNS.md` into this backlog. Every unresolved risk, open question, design input, documentation gap, security caveat, fragile area, and deferred technical-debt item must appear below or be recorded as closed in the Master Change Record.

---

## Priority 1 — Must Close Before Migration Can Proceed

All items in this section are hard blockers unless explicitly marked `CLEARED`. The historical P1 set remains closed. `COVERAGE-GATE-001`, opened by the 2026-06-28 current-tree validation, and `COVERAGE-SCOPE-001`, opened 2026-09-02, were both closed on 2026-09-04 by CRD-046 — the full CI gate and the production build now pass. No Priority 1 item is currently open.

### Sprint 1 Storybook Quality Remediation Issues

> **Cross-cutting note — Issues #1, #2, #3:** Source-code fixes are verified present at `ClientApp/src/` paths. Issue #1: 20 unit tests added; play function added to `Pill.stories.tsx`. Issue #3: `target={target}` prop fix applied; `SameTab` story + play functions added. Issue #2: source fix confirmed; `Dashboard/EmptyState` assertion robustness fix applied (CRD-018 — `findAllByText` for per-tab duplicates). Sprint 1 is now CLOSED_SUCCESS after the 2026-06-01 `npm run test:storybook` pass.
>
> **Cross-cutting note — Assertion robustness (CRD-018):** Three play function assertions corrected on 2026-06-01. `Footer/TermsModalOpen` uses `waitFor()` for Bootstrap animation timing. `InstrumentItem/DetailsTab` and `Dashboard/EmptyState` use `findAllByText()[0]` for duplicate-node resilience. These fixes affect Issues #10, #15, and #2 respectively.
>
> **Note on Issue #9:** **COMPLETE** — Taylor Nguyen canonical identity (`taylor.nguyen@example.com`) applied to both `storybookHarness.tsx` and `.storybook/preview.ts` on 2026-05-31. QA sign-off was issued as part of Sprint 1 CLOSED_SUCCESS.

| ID | Title | Severity | Sprint 1 Phase | State | Owner | Migration Gate |
| --- | --- | --- | --- | --- | --- | --- |
| #1 | StatusPill Switch-Case Bug (SB-001) | Critical | 1 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #2 | Dashboard Tab Filter Strings (SB-002) | Critical | 1 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #3 | MSW Global Handlers Malformed (SB-004) | Critical | 1 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #4 | AcceptQuote Missing Steps | Critical | 2 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #5 | NotificationMessage Component Zero Coverage (SB-006) | High | 2 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #6 | ErrorSummary Story (SB-011) | High | 2 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #7 | InTextLink target Bug (SB-003) | High | 3 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #8 | BackToDashboardButton Missing Story | High | 3 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #9 | MSAL Account Canonical Rename (SB-005) | High | 1 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #10 | Footer Modal Stories (SB-009/010) | High | 3 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #11 | WizardForm Context Pattern (SB-017) | High | 3 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #12 | Pagination Edge Cases (SB-019) | High | 3 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #13 | FormBanner Story (SB-012) | Medium | 4 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #14 | AutoSuggest + AddressLookup Stories | Medium | 4 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |
| #15 | InstrumentItem Story (SB-007) | Medium | 4 | CLOSED_SUCCESS | Frontend Lead | Phase 5 Storybook baseline — CLEARED |

### Security and Governance Blockers

| ID | Title | Severity | State | Owner | Migration Gate | Reference |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-010 | IDOR Backend Verification (CWE-639) | Medium | **CLOSED — PASS 2026-06-04** — identified in pentest prior to go-live; remediated before production deployment; confirmed by backend team; CRD-035 | Backend Team | Dashboard route migration — **CLEARED** | `docs/sec/SEC-010-idor-backend-verification.md` |
| QA-SIGNOFF-1 | Sprint 1 QA Sign-Off | Governance | **COMPLETE** — PASS verdict issued 2026-06-01; latest Storybook baseline 55 test files, 165 tests, 0 failures with clean output | QA Agent | Sprint 1 closure; Phase 5 migration gate | `docs/qa/sprint-1-signoff.md` |
| VALIDATION-GATE-001 | `migration-check` combined Vitest/Storybook gate remediation | High | CLOSED_SUCCESS — combined gate now passes after Vitest parity, runtime hardening, and dashboard test stabilization | Frontend Lead / QA Agent | Migration pre-flight and target CI verification — CLEARED | CRD-032 |
| COVERAGE-GATE-001 | Unit coverage thresholds not met | High | **CLOSED_SUCCESS 2026-09-04** — `npm run test:ci:unit` exits 0 at 100% on all four metrics: statements 6617/6617, branches 4383/4383, functions 1675/1675, lines 6343/6343, across 179 files / 2017 tests. Thresholds unchanged; the denominator is guarded by `tests/unit/config/coverageRemapPolicy.test.ts`, which fails the build on any exclusion outside a reviewed category | Frontend Lead / QA Agent | Full CI gate and migration pre-flight | `vitest.unit.config.ts`; `reports/coverage/unit/coverage-summary.json`; CRD-041; CRD-046 |
| COVERAGE-SCOPE-001 | Coverage measured-scope narrowed without a recorded decision | High | **CLOSED_SUCCESS 2026-09-04** — the two cited exclusions are gone from `vitest.unit.config.ts` and the files themselves no longer exist in the tree, so the unannounced narrowing is reverted rather than ratified. The current exclusions are recorded as an explicit decision in CRD-046, held to a reviewed policy by `coverageRemapPolicy.test.ts`, and mirrored into `sonar.coverage.exclusions` under a drift guard (`sonarCoverageContract.test.ts`). **Correction to the proposed remedy:** this item asked for `sonar.exclusions` to be reconciled; that key removes files from analysis entirely, losing bug/smell/vulnerability detection, so `sonar.coverage.exclusions` is the correct key. Original finding — that the two tools measured different sets — was correct. *Historical detail:* commit `c6391fb` added `ClientApp/src/**/setupTests.ts` and `ClientApp/src/**/*.stories copy.tsx` to the Vitest coverage `exclude` list. This raises the reported percentage by shrinking the measured surface rather than by adding a test, which `COVERAGE-GATE-001` explicitly forbids doing silently. The commit message ("feat: add systematic debugging and test-driven development skills") does not mention coverage, so the change is not discoverable from the log. `sonar.exclusions` was **not** updated to match, so SonarCloud and local coverage now measure different sets. | Frontend Lead / QA Agent | Full CI gate and migration pre-flight — same gate as `COVERAGE-GATE-001` | `vitest.unit.config.ts`; `sonar-project.properties`; `tests/unit/config/coverageRemapPolicy.test.ts`; `tests/unit/config/sonarCoverageContract.test.ts`; CRD-042; CRD-046 |
| DEV-TOOLCHAIN-AUDIT-001 | Dev-only transitive advisories in the build toolchain | Medium | **CLOSED_SUCCESS 2026-09-04** — `npm audit` reports 0, down from 5 (2 high, 3 moderate). Closed by bumping override targets, not by `npm audit fix`: two of the five were pinned by this repo's own overrides at versions that later had advisories published against them. `fast-uri` 3.1.5 → 3.1.7 (kept on 3.x because `ajv@8.20.0` declares `^3.0.1`); `qs` → 6.16.0 as a new override, which knowingly crosses the `~6.15.1` that `express` and `body-parser` declare because the isBuffer DoS has no 6.15.x fix; `browserslist` → 4.28.8, which satisfies its consumers' `^4.24.0` naturally. `body-parser`, `express` and `ajv` carried no advisory of their own and cleared once `qs` and `fast-uri` moved | Frontend Lead / DevOps | Not a production gate | `package.json`; `npm audit` 2026-09-04; CRD-046; CRD-047 |
| RULES-REGISTER-001 | Business rules register unreliable for sign-off | High | **PARTIALLY REMEDIATED 2026-09-02 (CRD-045)** - citation rot now guarded by `npm run lint:rules` in CI (`static-quality-node24`); the 3 past-EOF citations and RULE-051's missing section are fixed; summary-table line numbers removed to end the duplication. **STILL OPEN:** 5 missing detail sections, 22 weakly-anchored citations, RULE-022 dead-code question, and 50 unverified specifications. Originally **OPEN 2026-09-02** - verification pass over `analysis/BUSINESS_RULES.md` found 18 of 21 examined citations wrong (5 P0 rules; 3 point past end of file), 6 of 53 rules listed but never defined (including RULE-051, a P1 Legal sign-off item), one P0 specification factually wrong (RULE-035, corrected CRD-043), and one P0 rule whose validator is dead code (RULE-022 `isValidAbn`, zero callers). 50 of 53 specifications remain unverified. | Frontend Lead / NMI Business Analyst / Backend Team | **Blocks BA and Legal sign-off on P2 items 16, 17, 18, 21** | `docs/change-record/2026-09-02-business-rules-verification.md`; CRD-044 |

**SEC-010 detail (CLOSED 2026-06-04):** Backend team confirmed the finding was identified in a pentest prior to go-live and was remediated before production deployment. Checklist ticked; inline comment in `ClientApp/src/routes/dashboard/index.tsx` updated. Full pentest report reference to be added by backend team to `docs/sec/SEC-010-idor-backend-verification.md`. Recorded as CRD-035.

**QA-SIGNOFF-1 detail (COMPLETE):** `docs/qa/sprint-1-signoff.md` signed off with PASS verdict on 2026-06-01. `npm run test:storybook` passed with 55 test files, 165 tests, 0 failures. Sprint 1 is formally closed; Phase 5 Storybook baseline gate is cleared.

**VALIDATION-GATE-001 detail (CLOSED_SUCCESS):** 2026-06-02 remediation completed and verified in CRD-032. `npm run migration-check` now passes end-to-end (TypeScript, Vitest default run, Storybook build). The issue is closed as a migration gate.

**RULES-REGISTER-001 detail (OPEN 2026-09-02):** Raised by the verification pass the operator requested
after `DEC-002`. The register is not unusable - RULE-022's algorithm is specified precisely and correctly
- but it cannot currently support a signature, because a reviewer following a citation mostly does not
arrive at the rule.

Ordered remediation:

1. **Re-derive every `Source:` citation mechanically** against the current tree. They were generated once
   and never reconciled; regenerating removes the entire defect class in one pass. Add a CI check that
   every citation resolves, so it cannot silently rot again.
2. **Write the six missing detail sections** - `RULE-023`, `RULE-024`, `RULE-025`, `RULE-029`,
   `RULE-030`, `RULE-051`. Start with **RULE-051**: it is P1, it is the NMI registered address, and
   **Legal is being asked to confirm a rule the register never states** (P2 item 17).
3. **Answer RULE-022 with the Backend Team.** `isValidAbn` implements the ATO checksum correctly and is
   called by nothing. Either ABN validation is enforced server-side - in which case the rule's
   plain-English statement is wrong about *where* - or invalid ABNs are accepted. The API is in another
   repository, so this cannot be settled here.
4. **Then verify the remaining 50 specifications, P0 first.**

**Gate impact:** P2 items 16, 17, 18 and 21 all await BA or Legal sign-off against entries in this
register. Seeking those signatures before steps 1 and 2 risks a repeat of the RULE-035 outcome, where the
question put to the BA rested on a false premise.


**RULES-REGISTER-001 progress (2026-09-02, CRD-045):**

| Done | Detail |
| --- | --- |
| CI gate | `scripts/verify-rule-citations.mjs`, wired as `npm run lint:rules` into the `static-quality-node24` job. Fails on citations that are provably wrong or unreachable; reports weakly-anchored ones without blocking. Negative-tested: a bad line and a bad filename both fail the build, and `--fix` repairs what it can. |
| Duplication removed | Summary-table Source column no longer carries line numbers - the file name is stable, the line number is not, and holding it in two places guaranteed drift. The detail section owns the line. |
| Past-EOF citations | RULE-010, RULE-012, RULE-015 corrected to verified locations. |
| RULE-051 written | Detail section authored; Legal is no longer being asked to confirm an unstated rule. |

| Still open | Detail |
| --- | --- |
| 5 missing sections | RULE-023, RULE-024, RULE-025, RULE-029, RULE-030 - all P2 calculation/display rules, none blocking a sign-off. |
| 22 weak citations | Reported as UNRESOLVED by the gate each run. These need a human to add a distinctive anchor or confirm the line; auto-derivation refuses to guess between tied candidates. |
| RULE-022 | `isValidAbn` has zero callers. Needs a Backend Team answer on server-side enforcement. |
| 50 specifications | Unverified against code. |

**COVERAGE-SCOPE-001 resolution (CLOSED_SUCCESS 2026-09-04, CRD-046):** All three decisions below were
taken, and one of them was taken differently from the way this item proposed:

1. **Reverted, not recorded.** `setupTests.ts` is no longer excluded and no longer exists in the tree,
   so there was nothing left to ratify. The exclusions that *do* exist now are recorded in CRD-046 as
   two deliberately separate lists — 25 files verified at 100% in Storybook before listing, and 6
   knowingly-unmeasured evaluation-spike files — and `coverageRemapPolicy.test.ts` fails the build on
   any exclusion outside a reviewed category.
2. **Deleted, as this item asked.** The `*.stories copy.tsx` editor artefact is gone from the tree and
   from the exclude list.
3. **Reconciled, but under a different key.** This item asked for `sonar.exclusions`. That key removes
   files from analysis altogether — losing bug, code-smell and vulnerability detection on them — which
   is a much larger change than aligning coverage scope. `sonar.coverage.exclusions` is the correct key
   and is what was written; `sonarCoverageContract.test.ts` fails the build if it drifts from the Vitest
   list. The underlying finding, that the two tools measured different sets, was correct.

The re-measure this item required is done: 100% on all four metrics across 179 files / 2017 tests,
superseding the stale 74.43% / 75.51% / 72.56% / 74.92% figures below.

**Original detail (OPEN 2026-09-02):** Raised by `/orchestrate morning` under the backlog
intake rule — an unresolved finding must become a backlog item immediately rather than living only in a
commit. Three things need a decision, and none of them is "re-run coverage":

1. **Record or revert the scope change.** Excluding `setupTests.ts` is defensible — test scaffolding is
   not product code — but it must be an explicit, reviewed scope decision, not an unannounced edit
   inside an unrelated commit.
2. **`*.stories copy.tsx` should be deleted, not excluded.** The filename is an editor artefact. Adding
   it to an exclusion list normalises an accident into policy and leaves the file in the tree.
3. **Reconcile `sonar.exclusions` with the Vitest `exclude` list.** `INIT.md` records that the scanner
   exclusions, the Vitest coverage excludes and the Sonar scope are meant to describe the same set. They
   now differ, so the SonarCloud gate and local coverage disagree about what is measured.

**Sequencing:** do not action items 1–3 while a second session holds the coverage surface. As of
2026-09-02 `.agent-sync/ROUTING.md` records `in-progress` File Claims on `vitest.unit.config.ts`,
`ClientApp/src/utils/index.ts`, `tests/unit/utils/index.test.ts` and
`tests/unit/coverage/coverageConfig.test.ts`.

**Also required before `COVERAGE-GATE-001` is planned:** re-measure. The recorded percentages
(74.43% / 75.51% / 72.56% / 74.92%) date from 2026-06-28 against **114** test files. The suite is now
**163 files / 1,734 tests**, so the figures in this backlog are two months and 49 test files stale.

**COVERAGE-GATE-001 resolution (CLOSED_SUCCESS 2026-09-04, CRD-046):** Closed by adding tests, not by
weakening thresholds — which remain 100/100/100/100. The areas this item named are all at 100%: the
Type Approval dashboard and routes, the attachment and progress components, the Type Approval
filter/request-item components, and the rich-text editor (`SlateEditor`, reached by driving Slate's
document model rather than the DOM, which jsdom cannot do). Roughly half the residual branches turned
out to be unreachable code and were deleted with justification rather than tested around. The coverage
work also surfaced five defects in files that were already at 100% — see CRD-046 item 6.

**Original detail (OPEN):** The failure is a coverage-threshold failure, not a unit-test failure. The largest low-coverage areas include the Type Approval dashboard/routes and supporting attachment, progress, Type Approval filter/request-item, and rich-text editor components. Close this item by adding behavior-focused tests or by obtaining an explicit, reviewed change to the measured scope/threshold policy. Do not silently weaken thresholds.

**WCAG component/E2E validation detail (CRD-036, refreshed by CRD-041):** Automated evidence covers RequestList, combobox, modal/footer/date-picker, Actions, authenticated account/RFQ/quote flows, and route Storybook stories. The 2026-06-28 baseline passes 114 unit files / 1,169 tests and 87 Storybook files / 218 tests, including Type Approval isolated stories. Manual keyboard, screen-reader, 400% zoom, target-size, and focus-not-obscured evidence still gates any final WCAG 98+ claim.

**Storybook output hygiene detail (CRD-022 — COMPLETE):** Storybook Vitest setup now shims the jsdom-only browser API gaps that previously printed `HTMLCanvasElement.getContext`, `window.scrollTo`, and pseudo-element `getComputedStyle` warnings. The deliberate ErrorBoundary demonstration errors are filtered only for their known messages; unexpected console errors still surface. Latest `npm run test:storybook` result: 55 files, 165 tests, 0 failures, clean command output.

**Issue #9 detail (OI-002 — COMPLETE):** The canonical `Taylor Nguyen` / `taylor.nguyen@example.com` identity has been applied to all five fields (`name`, `username`, `givenName`, `familyName`, `email`) in both `ClientApp/src/storybook/storybookHarness.tsx` and `.storybook/preview.ts` on 2026-05-31 (CRD-016). OI-002 is resolved and included in the 2026-06-01 QA PASS verdict.

---

### Additional Security and Runtime Findings from HTML Assessments

These items were referenced by the modernisation or rebuild-readiness HTML assessments and are now closed in source for the scoped frontend blockers.

| ID | Title | Severity | State | Owner | Migration Gate | Reference |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-MOD-003 | `window.open()` without explicit `noopener` / URL encoding review | High | CLOSED — verified 2026-06-01; secure helper added, direct first-party call sites removed, and PDF page fragments encoded | Frontend Lead | Migration of quote, report, and PDF-opening routes — CLEARED | `ClientApp/src/routes/common/openWindow.ts`; `ClientApp/src/routes/quotation/quoteDetails.tsx`; `ClientApp/src/routes/measurementReport/reportDetails.tsx`; `ClientApp/src/routes/common/helperFunctions.ts`; `tests/unit/routes/common/openWindow.test.ts`; `npm run type-check`; `npm run test:unit`; `rg -n "window\.open\(" ClientApp/src -g "*.ts" -g "*.tsx"` |
| SEC-MOD-009 | External Qualtrics links missing explicit `noopener noreferrer` | Low | CLOSED — verified 2026-06-01; survey links and external pathway cards use explicit `noopener noreferrer`, with no named feedback target remaining | Frontend Lead | Migration of feedback/survey links — CLEARED | `ClientApp/src/components/Header/NavbarMessage.tsx`; `ClientApp/src/routes/requestForQuote/created/index.tsx`; `ClientApp/src/components/tiles/StandardPathway/index.tsx`; `ClientApp/src/routes/dashboard/index.tsx`; `tests/unit/components/standardPathway.test.tsx`; `npm run type-check`; `npm run test:unit`; `rg -n "target='NMI-Feedback'|rel='external'" ClientApp/src -g "*.tsx"` |
| RUNTIME-ENV-001 | `process.env.NODE_ENV` usage in first-party runtime code | Medium | CLOSED — verified 2026-06-01; first-party telemetry guard now uses runtime `env.REACT_APP_ENVIRONMENT` | Frontend Lead | Runtime configuration migration; telemetry initialisation — CLEARED | `ClientApp/src/instrumentation/AppInsightsService.ts`; `tests/unit/instrumentation/appInsightsService.test.ts`; `npm run type-check`; `npm run test:unit`; `rg -n "process\.env\.NODE_ENV" ClientApp/src -g "*.ts" -g "*.tsx"` |
| BRIEF-SEC-001 | Fresh `TargetOrganisationAbn` read per API request | Medium | CLOSED — verified 2026-06-01 and revalidated 2026-06-02; `TargetOrganisationAbn` is read inside `transformOptions` per request, malformed cached state is ignored, and retry/handshake persistence behavior is locked by focused regression tests | Frontend Lead / Backend Team | API client migration and Phase 1 security verification — CLEARED | `ClientApp/src/api/web-api-client.ts`; `tests/unit/api/authorizedApiBase.test.ts`; `tests/unit/authentication/AccountProvider.errored.test.tsx`; `tests/unit/routes/dashboard.test.tsx`; `npm run type-check`; focused run: `28` tests / `0` failures; CRD-031 |
| BRIEF-SEC-009 | MSAL silent-renewal iframe timeout bound | Low | CLOSED — verified 2026-06-01; MSAL iframe and load-frame timeouts are bounded at 6000ms | Frontend Lead | Auth configuration migration and Phase 1 security verification — CLEARED | `ClientApp/src/authentication/authConfig.ts`; `tests/unit/authentication/authConfig.test.ts`; `npm run type-check`; `npm run test:unit`; `rg -n "loadFrameTimeout: 0|targetOrganisation = sessionStorage|getStepStatuses\(id!?|Number\(id\)" ClientApp/src -g "*.ts" -g "*.tsx"` |
| BRIEF-SEC-011 | URL ID parameter validation before API calls | Medium | CLOSED — verified 2026-06-01; scoped RFQ/account route IDs are validated before API calls or numeric conversion and invalid IDs redirect to `/not-found` | Frontend Lead | RFQ/account route migration and Phase 1 security verification — CLEARED | `ClientApp/src/routes/common/routeParams.ts`; `ClientApp/src/routes/requestForQuote/index.tsx`; `ClientApp/src/routes/account/update/index.tsx`; `tests/unit/routes/common/routeParams.test.ts`; `npm run type-check`; `npm run test:unit`; `rg -n "loadFrameTimeout: 0|targetOrganisation = sessionStorage|getStepStatuses\(id!?|Number\(id\)" ClientApp/src -g "*.ts" -g "*.tsx"` |

**Validation caveat for the six closed frontend blockers:** Closure is based on source/test/search evidence (`npm run type-check`, `npm run test:unit`, and blocker-specific `rg` searches). CRD-041 reconfirms direct TypeScript and lint are clean; `npm run lint` reports zero diagnostics.

---

## Priority 2 — Must Resolve Before Affected Migration Batches

Design-platform, infrastructure, runtime-platform, and modernization-brief inputs — **decisions received 2026-06-04** from Expert Design Lead (items 1–10, 13), Backend Architect (items 11–12, 14–15), and architectural recommendation (items 16–22). Items 1–15 are RESOLVED. Items 16–22 have architectural recommendations with domain sign-offs (BA, Legal, Product, DevOps) still required. Three hard Batch E prerequisites (BATCH-E-PREREQ-001, -002, -003) were identified by the design decisions and are tracked below. See CRD-034 in MASTER-CHANGE-RECORD.md.

| # | Input | Decision Blocked | Owner | Gate | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | Design platform colour tokens | Whether `_variables.scss` can be adapted or must be replaced in the target platform | Design Lead | Batch E (SCSS migration) | **RESOLVED 2026-06-04** — Replace with `var(--nmi-*)` CSS custom properties; values identical |
| 2 | Typography tokens and font stack | Whether "Public Sans" is reused in the target platform or replaced with a different typeface | Design Lead | Batch E (SCSS migration) | **RESOLVED 2026-06-04** — Retain Public Sans; already in design system |
| 3 | Spacing, grid, and breakpoint rules | Whether Bootstrap 5 grid is retained or replaced by a target-platform grid system | Design Lead | Batch E (SCSS migration) | **RESOLVED 2026-06-04** — Drop Bootstrap grid; CSS Grid/Flexbox + matching design token breakpoints |
| 4 | Form control components | Whether all `Inputs/` components and form-specific SCSS must be replaced with target-platform equivalents | Design Lead | Batch E (SCSS migration) | **RESOLVED 2026-06-04** — Direct substitution; all primitives present in `packages/react-components` |
| 5 | Validation state and error patterns | `ErrorSummary` and field-level error display approach in the target platform | Design Lead | Batch E (SCSS migration) | **RESOLVED 2026-06-04** — Target `ErrorSummary` + `FormField` error prop; ARIA pattern matches source |
| 6 | Wizard/stepper pattern | Whether the WizardForm engine is adapted for the visual layer or rebuilt from scratch | Design Lead | Batch E — pre-req: BATCH-E-PREREQ-003 | **RESOLVED 2026-06-04** — Adapt into `ApplicationWizard` in `packages/portal-patterns`; resolve WAF-TYPE-001 before porting WAF logic |
| 7 | Modal/dialog components | Whether react-bootstrap Modal usages are replaced by target-platform dialog primitives | Design Lead | Batch E (SCSS migration) | **RESOLVED 2026-06-04** — Replace with target `Modal` (native `<dialog>`, WCAG SC 4.1.2) |
| 8 | Icon system | Whether NMI icon font and `_replace-svgicons-csp.scss` can be retired in favour of target icons | Design Lead | Batch E — pre-req: BATCH-E-PREREQ-002 | **RESOLVED 2026-06-04** — Retire icon font; replace with SVG React components from `packages/icons` |
| 9 | Accessibility requirements | Whether `skipLinks`, `useRouteAccessibility` hook (replaces deleted `routeAccessibleNavigation.tsx`), and related accessibility components are preserved | Design Lead | Batch E — pre-req: BATCH-E-PREREQ-001 | **RESOLVED 2026-06-04; PREREQ-001 COMPLETE 2026-06-05 (CRD-037)** — AppShell covers skipLinks; `useRouteAccessibility` hook shipped; WCAG 2.4.2/2.4.3 gap closed |
| 10 | Print requirements | Migration approach for `media-print.scss` in the target platform | Design Lead | Batch E (SCSS migration) | **RESOLVED 2026-06-04** — Port verbatim as `print.css` global import; replace Bootstrap print selectors |
| 11 | Backend OpenAPI spec availability | Required to regenerate `web-api-client.ts` for the target environment | Backend Team | Test and API client migration | **RESOLVED 2026-06-04** — Generate + commit `docs/api/openapi.json` via `dotnet run --openapi-output`. Action: backend team to confirm which endpoints change shape. |
| 12 | Target CI configuration | Whether Playwright + Vitest + bddgen pipeline can be reproduced in the target CI system | DevOps | Test infrastructure migration | **RESOLVED 2026-06-04** — GitHub Actions: pnpm typecheck → lint → test → test:storybook → test:e2e → dotnet test. bddgen as pre-Playwright step. |
| 13 | Storybook in target: Vite or webpack? | Whether the Storybook harness and BDD story tests migrate as-is or require rebuild | Architect | Storybook migration | **RESOLVED 2026-06-04** — Vite; migrate `.storybook/` directory as-is |
| 14 | Top-level `await` support in target bundler/browser baseline | Whether `ClientApp/src/index.tsx` can retain top-level `await` or needs bootstrap restructuring for the target platform | Architect / DevOps | App bootstrap and target bundler migration | **RESOLVED 2026-06-04** — Retain; confirm `vite.config.ts` has `build.target: 'es2022'` or higher |
| 15 | Backend API versioning strategy | Whether regenerated target `web-api-client.ts` DTOs will preserve current route contracts or require migration shims for renamed/new required fields | Backend Team / Architect | API client and route migration | **RESOLVED 2026-06-04** — URL-path versioning on changed endpoints only (`/api/v2/`); stable contracts unchanged. Backend to confirm changed endpoints before NSwag regeneration. |
| 16 | RULE-035 ASIC business-name charset | Whether business names may contain `&` and whether the current ASIC-aligned validator is correct | NMI Business Analyst / Product Owner | Phase 2 validation externalisation | **ANNOTATED 2026-09-02 (CRD-042)** — marker applied at `validationSchemas/yupExtensions/stringExtensions.ts:731` directly above the ASIC charset regex. Verified: the charset **does** permit `&`, which is the specific question this item asks. Regex unchanged. **BA sign-off still required.** |
| 17 | RULE-050 NMI ABN and registered address | Whether `74 599 608 295` and `36 Bradfield Road, West Lindfield NSW 2070` are current for legal contract display | NMI Business Analyst / Legal | Phase 2 config externalisation | **ANNOTATED 2026-09-02 (CRD-042)** — marker applied at `routes/acceptQuote/summaryAndAccept.tsx:364` above the ABN/address block. Values unchanged. The same values also appear in `storybook/storybookFixtures.ts`; update both together once Legal confirms. **Legal confirmation still required.** |
| 18 | RULE-035/042 P0 rule SME review | Business analyst sign-off that the documented P0 rules match intended behaviour | NMI Business Analyst | Phase 2 and business-rule test suite | **UNBLOCKED AND ANNOTATED 2026-09-02 (CRD-043).** Operator supplied the register: `analysis/BUSINESS_RULES.md`. RULE-042 = *Number of items range (1-100)*, at `routes/requestForQuote/validation.ts:91-96`; marker applied, bounds unchanged. RULE-035 marker was already applied under item 16. **A register defect was found and corrected in the same pass:** the RULE-035 entry claimed `&` is excluded from the ASIC charset and that "Smith & Sons Pty Ltd" is INVALID - both wrong, proven by executing the live regex. The BA question built on that premise is void. **BA sign-off still required** on the two genuinely open questions: is 100 a hard operational limit, and is ASIC BRS v1.7 still the right charset reference. |
| 19 | Terms of Use version and re-acceptance plan | Whether terms version `1` is current and whether migration triggers re-acceptance / communications | Product Owner / Legal / Comms | Phase 6 go-live planning | STRUCTURAL — recommendation 2026-06-04: keep version 1; only a legal content change triggers re-acceptance. Legal/Comms to confirm. |
| 20 | RULE-008 PDF page-number and template policy | Whether hardcoded PDF page numbers 2, 3, and 5 still match current quote/report templates | Product Owner / Backend Team | Phase 2 config externalisation | STRUCTURAL — recommendation 2026-06-04: externalise to `/api/config/pdf-templates` endpoint. Product/Backend to confirm current page numbers. |
| 21 | RULE-015 recalibration policy for `ReportInProgress` | Whether allowing recalibration while a current calibration is still in progress is intentional | NMI Business Analyst | Phase 5 business-rule tests / route behaviour review | **ANNOTATED 2026-09-02 (CRD-042)** — marker applied at `components/RequestList/instrumentItem.tsx:291`, the confirmed gate: `ReportInProgress` falls through with `ReportWithdrawn` to offer "Request recalibration". Behaviour preserved. Scope checked — the recalibration actions in `requestItem.tsx` are gated on other statuses and are **not** RULE-015 sites. **BA confirmation still required.** |
| 22 | Target repository provisioning | Whether the target repository exists and team access has been provisioned before CI/CD migration | DevOps / Repository Owner | Phase 6 target repository migration — also gates Batch E | STRUCTURAL — recommendation 2026-06-04: target is React19DesignSystem `dependencymangement` branch. Confirm branch protection + team write access + CI secrets before Batch E. |
| BATCH-E-PREREQ-001 | Add `useRouteAccessibility` hook to AppShell | WCAG 2.4.2 (Page Titled) and 2.4.3 (Focus Order) compliance on route change | Frontend Lead / Target System Owner | **Batch E hard prerequisite** (gates Item 9) | **COMPLETE 2026-06-05** — `useRouteAccessibility` hook created; Layout and PreConditions wired; `routeAccessibleNavigation.tsx` deleted; 7 tests added; CRD-037 |
| BATCH-E-PREREQ-002 | Icon audit: confirm all NMI `nmi-icon-*` usages have SVG equivalents in `packages/icons` | Whether any missing icons require addition before icon font retirement | Design Lead / Frontend Lead | **Batch E hard prerequisite** (gates Item 8) | **COMPLETE 2026-06-05** — audit done; 10 active icons SCSS-only; `packages/icons` absent (not required as prereq); 3 dead-code vars identified; no new React SVG components needed; CRD-038. Awaiting Design Lead sign-off on SVG sources before Batch E SCSS migration. Audit at `docs/change-record/ICON-AUDIT-PREREQ-002.md` |
| BATCH-E-PREREQ-003 | Resolve `WAF-TYPE-001` — typed guard for WAF 412 error shape in WizardRoutedStep | Whether WAF detection logic can be ported safely without `[key: string]: any` escape hatch | Frontend Lead | **Batch E prerequisite** (gates Item 6 wizard port) | **COMPLETE 2026-06-05** — `isWafError` predicate in `ClientApp/src/types/wafError.ts`; `errorState.ts` inline cast removed; 8 unit tests + 2 integration tests updated to reference `AZURE_WAF_SERVER_PREFIX`; CRD-039 |
| TYPE-APPROVAL-E2E-001 | Deterministic authenticated fixtures for pattern/type approval | Whether the six Type Approval paths can be verified as real browser workflows rather than isolated Storybook states | Frontend Lead / QA / Backend Team | **Type Approval route migration and cutover** | **ACCEPTED 2026-09-02 (CRD-042)** — resolved by the second of the two options this item offered: **explicit acceptance of the residual gap**, rather than building the fixtures. Decision taken by the operator (`gregm`) via `/orchestrate morning` Veto Buffer `AMB-001`. The six Type Approval paths remain reviewed exclusions in `tests/e2e/route-coverage.ts` and stay verified as isolated Storybook states through cutover; no deterministic authenticated app-BDD fixtures will be built beforehand. **Residual risk accepted, not eliminated** — see detail below. |

**TYPE-APPROVAL-E2E-001 acceptance detail (ACCEPTED 2026-09-02):**

**What was accepted.** The six pattern/type approval paths — `/dashboard-ta`,
`/ta/type-approval-create-pre`, `/ta/:id/*`, `/ta/type-approval-create`,
`/ta/type-approval-success/:id/*`, `/ta/:id/manage` — go through migration and cutover verified as
isolated Storybook interaction states, **not** as authenticated end-to-end browser workflows.

**Why the alternative was declined.** Building the fixtures needs a deterministic authenticated session
against Azure AD B2C with myID and RAM, where RAM provisions the user's default organisation before the
first user fetch. That is a Backend Team dependency, not a front-end test-harness task, and it was judged
disproportionate to the remaining migration window.

**Residual risk carried into cutover — accepted, not eliminated:**

- Wizard submission and document upload/progress/cancellation are the highest-value untested paths; a
  regression there is a user-visible failure in a live Australian Government service and would not be
  caught by Storybook states or the unit suite.
- Storybook evidence exercises component state, not routing, auth guards, session handling or real API
  contracts. A `PreConditions` or `AuthenticatedElement` regression on these routes is out of scope of
  the evidence being relied on.

**Signature.** Recorded against the operator (`gregm`), who is the sole developer on this repository
(§Team & Workflow: 1 developer, automated-only review). **If the migration-lead role is formally held by
someone else, this acceptance requires their counter-signature before cutover** — this entry records the
decision, not a delegation of that role.

**Recommended compensating control** (not a gate, not actioned): before cutover, run one manual
authenticated pass over wizard submission and document upload and attach the result here. It costs far
less than fixture automation and covers the two paths carrying most of the accepted risk.


---

## Priority 3 — Deferred to Post-Migration or Migration Sprint

These items are acknowledged technical debt or planned improvements. They are not blockers for migration but must be tracked to ensure they are addressed in the migration sprint or immediately post-migration.

| Item | Reason for Deferral | Reference | Target Phase |
| --- | --- | --- | --- |
| Centralise `acquireTokenSilent` (81 matches across 52 production files) | Deferred to migration sprint by design; ADR written and approved. CRD-041 refreshes the larger inventory after Type Approval restoration. | `docs/adr/2026-05-30-acquire-token-silent-interceptor.md`; `docs/migration/2026-05-30-auth-token-acquisition-migration-checklist.md` | Migration sprint |
| Bootstrap 6 / `@use` full SCSS migration | Blocked on Bootstrap 6 release (current: Bootstrap 5.3.8); `negativify-map()` is a Bootstrap 5 internal function available only via `@import` cascade | `CLAUDE.md` — SCSS module system section | Post-Bootstrap 6 release |
| `targetOrganisation` stale read at NSwag construction time | Documented behaviour; rebuild guidance provided; no user-facing defect in current deployment | `docs/architecture/org-switching-lifecycle.md` | Post-migration |
| `VAL-REGEX-001` — `nameAllowedFormat(extended)` suffix-only regex | Historical `ASSESSMENT.md` SEC-010; unit tests document current behaviour. Changing this may reject previously accepted data, so product/security sign-off is required before altering semantics. | `analysis/portal.measurement.gov.au/ASSESSMENT.md`; `tests/unit/validationSchemas/stringExtensions.test.ts` | Migration sprint decision |
| `API-WORKAROUND-001` — `checkAcceptedQuoteStatus` client-side status mutation | Known API eventual-consistency workaround. Keep through migration unless backend confirms the API bug is fixed; remove only with regression coverage. | `docs/CONCERNS.md`; Azure board #489452 reference | Post-migration/API fix |
| `FORM-GUARD-001` — browser refresh protection in `UnsavedFormPrompt` | `window.onbeforeunload` remains commented out. Navigation guard exists, but tab close/refresh protection requires reinvestigation. | `docs/CONCERNS.md` | Post-migration UX hardening |
| `SESSION-KEYS-001` — dashboard/session-storage magic strings | Accepted debt; extract dashboard workaround keys into a central `SessionKeys` enum before further dashboard state changes. | `docs/CONCERNS.md` | Migration sprint or post-migration |
| `AUTH-OPS-001` — MSAL non-error event logging | Error-level MSAL logs are active; lower-severity auth event visibility requires operational decision to avoid noisy telemetry. | `docs/CONCERNS.md`; `authentication/authConfig.ts` | Pre-production observability review |
| `AUTH-OPS-002` — production MSAL version confirmation | Confirm deployed `@azure/msal-browser` version before live cutover because token caching and redirect semantics differ across major versions. | `docs/CONCERNS.md` open question #5 | Pre-flight evidence item |
| `AUTH-OPS-003` — App Insights instrumentation key retirement decision | `REACT_APP_APPINSIGHTS_INSTRUMENTATIONKEY` appears alongside the newer connection string. Confirm whether the legacy instrumentation key is still required before target runtime configuration is finalised. | `docs/CONCERNS.md` open question #2 | Pre-flight evidence item |
| `VALIDATION-001` — phone validator spacing normalization | Current regex accepts some spaced and unspaced AU phone formats but does not normalize before validation. Requires product decision before changing user-visible validation. | `docs/CONCERNS.md` | Post-migration validation review |
| `VALIDATION-002` — postcode numeric range question | Current validator accepts 200–299 and 800–9999 after `parseInt`; business decision required for 300–799 and leading-zero behaviour. | `docs/CONCERNS.md` open question #3 | Post-migration validation review |
| `PERF-001` — dashboard client/cache/scroll polish | Memoize dashboard client construction, review pagination cache strategy, and replace timeout/querySelector alert scroll with ref/effect when dashboard is next refactored. | `docs/CONCERNS.md` | Post-migration performance polish |
| `DASHBOARD-DEBT-001` — inline deferred-engineering comments | `docs/CONCERNS.md` flags dashboard `// TS` deferred-engineering comments. Review each comment and either close it with evidence or move it into the issue tracker before further dashboard refactors. | `docs/CONCERNS.md`; `ClientApp/src/routes/dashboard/index.tsx` | Migration sprint or post-migration dashboard refactor |
| `AUTH-CONTEXT-001` — AccountContext interface tests | Account state/dispatch split is complete, but `docs/CONCERNS.md` recommends interface tests that enumerate exported account mutation methods before future auth-state expansion. | `docs/CONCERNS.md`; CRD-002 | Post-migration auth hardening |
| `ORG-SCHEMA-001` — organisation validation schema duplication | Modernisation assessment found structurally duplicated organisation validation schemas. Consolidate only with regression coverage because label differences are user-visible. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` technical debt item 2 | Post-migration validation refactor |
| `CONTACT-PROPS-001` — create/update contact prop duplication | Modernisation assessment found near-identical contact create/update prop modules. Refactor only after contact flow coverage is in place. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` technical debt item 3 | Post-migration form refactor |
| `COMPONENT-TEST-001` — broad component unit-test gap | The current suite has grown to 114 files / 1,169 tests, but coverage is 72.56%–75.51% against configured 100% thresholds. The concrete gate is now `COVERAGE-GATE-001`; retain this P3 item only for behavior outside the agreed measured surface and Type Approval browser integration. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` technical debt item 5; CRD-041 | Post-migration test and scope review |
| `PRECONDITIONS-001` — `PreConditions.tsx` decomposition | Tests and SonarLint fixes exist, but the assessment's decomposition concern remains accepted debt. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` technical debt item 6; CRD-013 | Post-migration route-shell refactor |
| `ERROR-DISPLAY-001` — duplicate HTTP error display components | `ErrorDisplay.tsx` still has repeated subcomponents and stale visually-hidden status text for some non-404 pages. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` technical debt item 7 | Post-migration accessibility/UI cleanup |
| `WIZARD-TYPES-001` — WizardForm escape-hatch typing | `WizardStepProps` and `WizardFormProps` still retain `[key: string]: any` and several `any` callback/schema props for compatibility. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` technical debt item 9; CRD-010 | Post-migration type hardening |
| `HTTP-412-001` — literal `412` route error checks | Some account/contact route prop files still compare against literal `412` instead of `HttpStatusCode.PreconditionFailed`. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` technical debt item 10 | Post-migration route cleanup |
| `TARGET-ORG-INTEGRITY-001` — `targetOrganisation` storage integrity check | `clearTargetOrganisation()` exists and stale NSwag construction-time reads are documented, but the separate session-storage integrity-check concern remains accepted debt. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` additional architectural debt | Post-migration state hardening |
| `FOOTER-HTTP-001` — hardcoded `http://` footer accessibility links | Footer accessibility content still contains hardcoded `http://` external links. Confirm canonical HTTPS targets before changing public links. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` additional architectural debt; `ClientApp/src/components/Footer/accessibility.tsx` | Post-migration content cleanup |
| `ROUTE-SPLIT-001` — route-level code splitting | `App.tsx` still eagerly imports routes. This is accepted performance debt, not a migration blocker. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` additional architectural debt | Post-migration performance polish |
| `ANALYTICS-DEAD-EXPORT-001` — dormant `trackGAPii()` export | Modernisation assessment found `trackGAPii()` exported while the only call site is commented out. Decide whether to remove it or wire it into an approved analytics path. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` dangling references section | Post-migration analytics cleanup |
| `DOC-TERMS-001` — terms-of-use version update procedure | Modernisation assessment found no clear documentation for updating the terms version or coordinating backend sync. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` documentation gaps | Post-migration documentation |
| `DOC-WIZARD-001` — WizardRoutedStep state-machine usage notes | Types now include JSDoc, but a full usage note for callback ordering remains useful for future form work. | `docs/nmi-portal-modernisation-assessment-colour-revised.html` documentation gaps; CRD-010 | Post-migration documentation |
| `STORYBOOK-EXCLUSIONS-001` — residual Storybook exclusions and API-heavy caveats | Storybook migration readiness is CLOSED_SUCCESS for the narrowed rendering goal. The dominant residual gap is now explicit: the six Type Approval paths have isolated stories but no deterministic app-BDD fixture contract. Track workflow closure under `TYPE-APPROVAL-E2E-001`. | `docs/STORYBOOK-MIGRATION-READINESS.md`; `docs/STORYBOOK-COVERAGE-MATRIX.md`; `tests/e2e/route-coverage.ts`; CRD-041 | Migration pre-flight documentation |
| `STORYBOOK-AUTODOCS-001` — optional autodocs expansion | Autodocs is implemented for the initial documented component set; optional enhancements remain for broader JSDoc rollout, design-token MDX pages, accessibility docs, migration guides, and richer story interactions. | `docs/STORYBOOK-AUTODOCS-IMPLEMENTATION.md`; CRD-026 | Post-migration documentation polish |
| `ASSESSMENT-SEC-CAVEATS-001` — stakeholder assessment residual security caveats | `analysis/ASSESSMENT.html` lists current medium/low caveats using labels that overlap older `SEC-*` IDs. The modernization brief's concrete code fixes are now tracked as `BRIEF-SEC-001`, `BRIEF-SEC-009`, and `BRIEF-SEC-011`; this residual item covers client-side pre-condition gates and session-storage hardening that still require security review. | `analysis/ASSESSMENT.html`; `analysis/ARCHITECTURE.mmd`; CRD-027; CRD-028 | Pre-production security review or post-migration hardening |
| `HELPER-PROMISE-001` — common helper unresolved promise branches | The stakeholder 90-day plan calls out unresolved promise branches in common helper functions as an incident-risk reducer. Review affected helper paths and add regression coverage before refactoring. | `analysis/ASSESSMENT.html`; `ClientApp/src/routes/common/helperFunctions.ts`; CRD-027 | Migration sprint hardening |
| `CRITICAL-UNIT-COVERAGE-001` — focused auth, wizard, and API-wrapper unit tests | The suite now passes 1,169 tests across 114 files, but the coverage gate is red. Promote threshold closure to `COVERAGE-GATE-001`; retain this item for any critical contracts still outside the agreed measured surface. | `analysis/ASSESSMENT.html`; CRD-027; CRD-041 | Migration sprint scope review |

---

## Resolved Items

The following items are confirmed resolved and are NOT tracked in this backlog.

**Security findings SEC-001 through SEC-009 and SEC-011** were all remediated and source-verified on 2026-05-29. No further action is required.

**SEC-012** is a false finding. The remediation it requested — adding `clearTargetOrganisation()` — was already present in the codebase prior to the assessment. No code change was made or needed.

**All Phase A through N changes** (the complete pre-migration remediation set as recorded in the Master Change Record) are COMPLETE and source-verified. This includes the auth bypass removal (devAuth.ts deleted, REACT\_APP\_AUTH\_BYPASS and five associated mock variables removed from env.ts), the TermsAndConditionModal bug fix, explicit Yup side-effect imports across all affected schema files, the four architecture/migration documentation files, the HTML template update, and the 227+ test suite.

**SB-001 through SB-005 source-code fixes** are verified present at their correct `ClientApp/src/` paths. Earlier governance documentation cited `static/js/` paths in error — this was a documentation error, not a code gap. The source is correct and the Sprint 1 Storybook baseline is closed.

**STORYBOOK-BDD-PROCESS-001** was closed on 2026-06-13. Story IDs are
verified against the generated `storybook-static/index.json` (115 referenced
IDs, 0 missing), route traceability is enforced by
`tests/unit/e2e/routeCoverage.test.ts`, permissive assertion patterns are
blocked by `tests/unit/e2e/playwrightStepQuality.test.ts`, and the split
projects pass with 28 application scenarios and 129 Storybook scenarios.

**WAF-TYPE-001** was closed on 2026-06-05. The typed `isWafError` predicate and tests are present under `ClientApp/src/types/`.

**STORYBOOK-DRIFT-001** was closed by the current coverage enforcement. `tests/unit/storybook/coverageDrift.test.ts` fails when a route/component family is added without inventory coverage, and `tests/unit/e2e/routeCoverage.test.ts` compares all 41 `App.tsx` paths with the route manifest.

---

## Migration Gate Summary

| Priority | Items | Migration Phase / Batch Gated | Cannot Proceed Until |
| --- | --- | --- | --- |
| P1 — Sprint 1 Issues (#1–#15) | 15 issues | Phase 5 — Storybook baseline established | **CLEARED** — all 15 CLOSED_SUCCESS; 165 tests pass with clean Storybook output |
| P1 — SEC-010 IDOR | 1 finding | Migration of dashboard route | **CLEARED 2026-06-04** — pentest-confirmed remediation prior to go-live; CRD-035 |
| P1 — Combined validation gate | 1 finding | Migration pre-flight and target CI verification | **CLEARED** — `VALIDATION-GATE-001` is CLOSED_SUCCESS in CRD-032; `npm run migration-check` passes |
| P1 — Unit coverage gate | 1 finding | Full CI gate and migration pre-flight | **OPEN** — 74.43% statements / 75.51% branches / 72.56% functions / 74.92% lines do not meet configured 100% thresholds |
| P1 — Additional security/runtime findings | 6 findings | Quote/report/PDF links, survey links, telemetry runtime config, API target-organisation header, auth timeout, URL ID validation | **CLEARED** — all six closed with source/test/search evidence; CRD-041 reconfirms type-check, lint, and 1,169 unit tests pass |
| WCAG component/E2E validation baseline | Component accessibility and authenticated E2E/story routes | WCAG 2.2 AA remediation and migration pre-flight validation | **UPDATED 2026-06-28** — 114 unit files / 1,169 tests pass; Type Approval isolated stories added; manual AT/zoom/target-size evidence remains required before 98+ claim |
| P1 — Sprint 1 QA Sign-Off | 1 governance doc | Sprint 1 closure; Phase 5 gate | **CLEARED** — PASS verdict issued 2026-06-01 |
| P2 — Design platform inputs (#1–#10) | 10 decisions | Batch E — SCSS/UI migration | **RESOLVED 2026-06-04** — All ten decisions received; three hard prerequisites are now complete: BATCH-E-PREREQ-001 (CRD-037), BATCH-E-PREREQ-002 (CRD-038), BATCH-E-PREREQ-003 (CRD-039) |
| P2 — Infrastructure inputs (#11–#13) | 3 decisions | Test, API client, and Storybook migration | **RESOLVED 2026-06-04** — Actions outstanding: Item 11 (backend commits openapi.json), Item 12 (DevOps provisions CI) |
| P2 — Runtime/API platform inputs (#14–#15) | 2 decisions | App bootstrap, target bundler, and API client migration | **RESOLVED 2026-06-04** — Actions: verify vite.config.ts build.target ≥ es2022; backend confirms changed endpoints |
| P2 — Modernization brief approval gates (#16–#22) | 7 decisions | Phase approval, SME sign-off, target repository readiness | STRUCTURAL — architectural recommendations provided 2026-06-04; domain sign-offs (BA, Legal, Product, DevOps) required before affected batches |
| P2 — Batch E prerequisites (PREREQ-001–003) | 3 items | Batch E hard prerequisites | **ALL COMPLETE** — PREREQ-001 (CRD-037) · PREREQ-002 (CRD-038) · PREREQ-003 (CRD-039). Batch E may begin pending Item 22 repository provisioning. |
| P2 — Type Approval workflow evidence | 1 item | Type Approval route migration and cutover | **CLEARED 2026-09-02** — residual gap explicitly accepted by the operator (CRD-042, `AMB-001`). Six paths remain Storybook-only evidence through cutover. |
| P1 — Coverage measured-scope integrity | 1 finding | Full CI gate and migration pre-flight | **CLOSED_SUCCESS 2026-09-04** — `COVERAGE-SCOPE-001`: the unrecorded exclusions are reverted and their files deleted; the current scope is recorded in CRD-046 and guarded by `coverageRemapPolicy.test.ts` and `sonarCoverageContract.test.ts`, mirrored into `sonar.coverage.exclusions` (not `sonar.exclusions`, which would drop the files from analysis) |
| P3 — Deferred items | 33 items | Migration sprint / post-migration | No hard gate; must be scheduled before or during migration sprint |
