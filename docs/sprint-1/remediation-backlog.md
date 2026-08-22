# Sprint 1 Remediation Backlog

## Legend

- Severity: blocker, major, minor
- Status: todo, in_progress, qa_review, done, blocked

## Blocker Defects

| ID | Severity | Finding | Source Reference | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| SB-001 | blocker | StatusPill switch uses logical OR in case labels, preventing QuoteStatus matches | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-002 | blocker | Dashboard fixture filters use incorrect status literals, hiding Draft and Instrument behavior | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-003 | blocker | InTextLink always renders target _blank regardless of prop | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-004 | blocker | Global MSW handler registration shape is incompatible with expected addon format | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-005 | blocker | Dual MSAL mock account identities between preview and harness | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |

## Critical Coverage Gaps

| ID | Severity | Finding | Source Reference | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| SB-006 | major | Missing story coverage for Alert NotificationMessage | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-007 | major | Missing story coverage for RequestList InstrumentItem | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-008 | major | Missing story coverage for RequestList NoRequests | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-009 | major | Missing story coverage for Footer modal content components | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-010 | major | Missing story coverage for modals ContentModal and TermsAndCondition | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-011 | major | Missing story coverage for Forms ErrorSummary | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-012 | major | Missing story coverage for Forms FormBanner | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-013 | major | Missing AcceptQuote story coverage for deliveryAndReturn | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-014 | major | Missing AcceptQuote story coverage for quotationSummary | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-015 | major | Missing AcceptQuote story coverage for summaryAndAccept | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |

## High and Medium Confidence Gaps

| ID | Severity | Finding | Source Reference | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| SB-016 | major | Missing interaction assertions for Dashboard notification dismiss and tab behavior | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-017 | major | Missing WizardForm interaction assertions for save and next and validation behavior | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-018 | major | Missing modal interaction assertions for existing modal stories | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-019 | major | Missing Pagination first and last edge-case stories and interactions | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-020 | major | Missing SearchFilter coverage for year, status, sort, and side effect assertions | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-021 | minor | Missing SummaryDisplay edge-case stories and assertions | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-022 | minor | Missing Welcome loading and empty-name coverage | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |
| SB-023 | minor | Missing a11y assertion layer for critical stories beyond color contrast checks | docs/Storybook vs Source Quality Assessment Report.md | Dev | done |

## QA Backlog

| QA ID | Type | Scope | Owner | Status | Resolution |
| --- | --- | --- | --- | --- | --- |
| QA-001 | Repro matrix | Validate SB-001 to SB-005 baseline reproduction | QA | done | Superseded — 165-test live pass on 2026-06-01 proves fixes in place; manual repro matrix not required |
| QA-002 | Regression suite | Validate all fixed P0 and P1 items via Storybook-tagged BDD run | QA | done | Superseded — `npm run test:storybook` 165/165 pass is the regression evidence |
| QA-003 | Manual audit | Validate top-risk user paths in Dashboard, AcceptQuote, and WizardForm | QA | deferred | Requires live browser environment; deferred to migration pre-flight phase (PF-10 scope) |
