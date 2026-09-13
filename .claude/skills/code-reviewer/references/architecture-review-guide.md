# Architecture Review Guide

Use this guide when a change affects module boundaries, data ownership, service contracts, dependency direction, reliability, or long-term maintainability.

## Review Goals

- Confirm the change fits the existing architecture and repository conventions.
- Identify coupling, hidden state, unclear ownership, and hard-to-reverse decisions.
- Check that boundaries are explicit and that dependencies point in the intended direction.
- Prefer small, reversible improvements over speculative redesign.

## Scope Questions

- What behavior or capability is being changed?
- Which modules, services, routes, jobs, or data stores are affected?
- Is this a local implementation detail or a public contract?
- Does the change introduce a new dependency, persistence boundary, queue, cache, or external integration?
- Is rollback possible without data loss or customer-visible breakage?

## Boundary Checklist

- [ ] Responsibilities are separated by domain or workflow, not by accidental file location.
- [ ] Public APIs expose stable concepts and hide implementation details.
- [ ] Shared utilities are genuinely reusable and not a dumping ground for unrelated behavior.
- [ ] Feature-specific code stays near the feature unless there is clear reuse.
- [ ] Data ownership is clear for reads, writes, validation, and lifecycle events.
- [ ] Cross-module calls do not bypass authorization, validation, or invariants.

## Coupling Signals

Flag these when they materially affect the change:

- New bidirectional imports or circular dependencies.
- A low-level module importing UI, transport, framework, or feature-specific code.
- Business logic embedded in controllers, React components, database migrations, or scripts.
- Global mutable state shared across tests, requests, users, tenants, or workers.
- A helper that requires knowledge of many unrelated domains.
- Tests that must mock half the application to exercise one behavior.

## Dependency Direction

Prefer dependencies that flow inward toward stable policy:

- UI and transport layers depend on application or domain behavior.
- Application services coordinate domain behavior and infrastructure.
- Domain code avoids direct dependency on frameworks, persistence clients, or UI.
- Infrastructure implements interfaces or adapters defined by higher-level policy when that pattern exists locally.

Do not demand an abstract interface just because one could exist. Require it when it reduces coupling, enables testing, or preserves a boundary already used by the repo.

## Data and State

Review transaction boundaries, consistency expectations, idempotency, cache invalidation, tenant scoping, migration order, rollback, and ownership of derived data.

## Error and Reliability Design

- [ ] Errors are represented consistently with repository conventions.
- [ ] Retriable and non-retriable failures are distinguishable.
- [ ] Timeouts, cancellation, and resource cleanup are handled.
- [ ] Partial failure does not leave data in an inconsistent state.
- [ ] Logs and metrics contain enough context for diagnosis without leaking secrets.
- [ ] User-facing errors are safe and actionable.

## Compatibility

Check compatibility with existing persisted data, API clients, feature flags, older frontend bundles, queued jobs, scheduled jobs, and events produced before deployment.

## Review Output

For each architecture finding, include the location, architectural risk, why the current shape is fragile, a smaller or safer alternative, and any migration or rollout consideration.
