# Sprint 1 Plan: Storybook Remediation

## Sprint Goal

Remediate all critical and high-risk findings from the Storybook vs Source quality assessment and establish measurable closure criteria for the remaining medium-risk findings.

## Scope Guardrail

Any work item not traceable to docs/Storybook vs Source Quality Assessment Report.md is out of scope for this sprint.

## Prioritized Work

## P0 Blockers (must close for sprint pass)

1. Fix status mapping bug in StatusPill switch logic.
2. Fix dashboard fixture filter mismatches so Draft and Instrument tabs render correct data.
3. Fix InTextLink target behavior to respect provided prop.
4. Fix global MSW handler registration shape in Storybook preview.
5. Resolve dual MSAL account inconsistency between preview and storybook harness.

## P1 Critical Coverage Gaps

1. Add story coverage for Alert/NotificationMessage.
2. Add story coverage for RequestList/InstrumentItem and RequestList/NoRequests.
3. Add story coverage for Footer modal content components and ContentModal.
4. Add story coverage for Forms/ErrorSummary and Forms/FormBanner.
5. Add story coverage for AcceptQuote steps:
   - deliveryAndReturn
   - quotationSummary
   - summaryAndAccept
6. Add story coverage for Dashboard tab behavior with corrected fixture data.

## P2 Interaction and Confidence Gaps

1. Add play-function assertions for at least the top 20 high-value stories.
2. Add assertions for modal open and close behavior where stories already exist.
3. Add assertions for route navigation semantics where link components are used.
4. Add explicit a11y assertions for core stories with critical user flows.

## Acceptance Criteria

1. Every P0 blocker is fixed and linked to a validating story or test assertion.
2. Every P1 coverage target has at least one story that renders expected behavior.
3. Storybook-tagged Playwright BDD run passes with no blocker defects.
4. QA sign-off in docs/qa/sprint-1-signoff.md is PASS with zero open blocker issues.

## Execution Sequence

1. INTAKE: Reproduce each P0 issue before touching implementation.
2. TRIAGE: Confirm severity and scope boundaries.
3. PLAN: Group fixes into atomic batches with rollback notes.
4. IMPLEMENTING: Apply P0 then P1 then P2.
5. VERIFYING: Run targeted validation after each batch.
6. REMEDIATING: Address regressions found during verification.
7. FINAL_REVIEW: QA pass and producer closure.

## Agent Prompts

## Dev Team Prompt (Nova/Sage/Milo)

Execute docs/sprint-1/remediation-backlog.md in priority order. For each item:

1. Reproduce first.
2. Implement minimal fix.
3. Add or update story or play assertion.
4. Update docs/sprint-1/progress.md with evidence.
5. Stop and flag if scope drifts beyond assessment findings.

## QA Prompt (Ivy)

Validate only against sprint acceptance criteria and backlog item IDs. For each item:

1. Confirm reproduction before fix and expected behavior after fix.
2. Record pass or fail with evidence in docs/qa/sprint-1-signoff.md.
3. Draft bug entries for any regression or unresolved behavior.
4. Mark sprint BLOCKED if any P0 item fails.

## Producer Checklist

1. Ensure backlog IDs map 1:1 to assessment findings.
2. Ensure no non-assessment feature work enters sprint.
3. Ensure QA sign-off exists before closure.
4. Update PROJECT_BRIEF.md sections 7 and 8 at closure.
