# Acceptance Criteria Quality

Load when creating, refining, or reviewing acceptance criteria or BDD scenarios. The source checklist was written for a secure government web-portal/Dynamics 365 context; apply security, accessibility, integration, and reliability branches only when relevant to the current system.

## Structure

- Use Given/When/Then when BDD is appropriate or required.
- Give each scenario a descriptive title.
- Keep one behaviour or rule per scenario and one clear trigger/action where practical.
- Use business/domain language and observable outcomes.
- Reuse common setup carefully without hiding important preconditions.
- Avoid duplicate or overlapping scenarios.

## Clarity and coverage

- Remove vague terms and quantify thresholds where they matter.
- State required preconditions rather than relying on hidden assumptions.
- Use concrete examples for rules/calculations when they remove ambiguity.
- Cover the primary success path plus material alternate, exception, negative, and boundary cases.
- Keep each scenario's purpose distinct.

## Testability

- Every criterion needs an objective pass/fail outcome.
- Prefer black-box behaviour over internal implementation detail.
- Express NFRs measurably.
- Keep a consistent level of detail.
- Involve test/QA review when testability is uncertain.

## Conditional quality branches

### Security and privacy

For input, sensitive data, authentication/authorisation, privileged actions, or audit-sensitive changes, consider input validation, access-denied paths, data protection, audit logging, and privacy/consent obligations. Use the project's approved security requirements; do not substitute generic examples for policy.

### Accessibility and UX

For UI-facing work, include applicable accessibility outcomes, keyboard/assistive-technology behaviour, page/component/process-level needs, and user feedback/state changes. Verify against the project's approved accessibility standard rather than asserting compliance from this checklist alone.

### Performance and reliability

Where material, define measurable performance/load conditions, failure handling, integration outage behaviour, monitoring/alerting outcomes, and traceability to SLAs or quality requirements.

## Traceability and maintainability

Trace criteria back to the story, regulation/policy, business rule, or quality requirement and forward to tests where the delivery process supports it. Use stable IDs/tags when useful. Keep criteria as living documentation and avoid brittle detail that does not affect the intended outcome.

For detailed rationale and examples, consult `references/source-checklists/acceptance-criteria-quality-checklist.txt`.
