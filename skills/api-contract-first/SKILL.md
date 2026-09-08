---
name: api-contract-first
description: "Use before implementing or modifying any externally consumed service boundary: REST/OpenAPI endpoints, gRPC/protobuf methods or messages, GraphQL schema or operations, webhooks/events/AsyncAPI, or inter-service interfaces. Require a written, reviewed contract before production implementation and a compatibility decision for changes. Do not use for purely internal functions or client-only use of an already approved contract."
---

# API Contract First

## Core Rule

Do not start or change production implementation for a service boundary until its contract is written and reviewed.

For consumer-visible interface behavior, the approved contract is the source of truth. If implementation needs different behavior, update and re-review the contract first.

## When This Applies

Use this skill when adding, changing, or removing any of these:

- REST endpoints, request/response fields, status codes, or error shapes
- gRPC methods, protobuf messages, or service definitions
- GraphQL types, fields, queries, mutations, or subscriptions
- Event, webhook, queue, or topic payloads and delivery contracts
- Inter-service interfaces consumed outside the implementing module/service

Do not use it for:

- Purely internal functions or refactors with no service-boundary effect
- Client code that only consumes an already approved contract
- Documentation-only work that does not change interface behavior

A disposable feasibility spike may explore an interface, but it must not be merged, deployed, or reused as production implementation until the contract is reviewed.

## Workflow

### 1. Locate the Contract Baseline

Before designing a change:

1. Find the existing contract and project conventions.
2. Identify the current approved version or schema.
3. Determine who consumes the interface.
4. For changes, compare against the current contract before editing implementation.

Use the repository's existing contract location. Do not invent a new `docs/` path when the project already has a convention.

### 2. Write or Update the Contract

Use the format that matches the boundary:

| Boundary | Contract |
| --- | --- |
| REST | OpenAPI 3.x |
| gRPC | `.proto` service/message definitions |
| GraphQL | GraphQL SDL/schema |
| Events/webhooks | AsyncAPI, or the project's approved payload schema format |
| Other inter-service interface | Existing project IDL/schema; otherwise choose a standard that fully describes the boundary |

Define all consumer-visible behavior that applies:

- operation/message/event names
- request, response, input, output, or payload shapes
- requiredness, nullability, defaults, types, formats, constraints, and enums
- success and applicable error behavior
- authentication and authorization requirements
- pagination, idempotency, rate limits, retries, ordering, or delivery guarantees when relevant

Follow existing API vocabulary and casing. Do not introduce a new naming convention inside an established API.

see example: `skills\api-contract-first\contract-example.md`

### 3. Classify Compatibility

Before implementation, record whether the change is compatible, conditionally compatible, or breaking.

Treat these as potentially breaking unless the project's compatibility rules prove otherwise:

- removing or renaming an operation, field, message, event, or enum value
- changing a field type, meaning, status/error semantics, or delivery semantics
- making optional input required or non-null
- tightening accepted constraints or authorization requirements
- changing defaults in a way that changes observable behavior

Run the project's schema or breaking-change checker when one exists.

For a breaking or migration-sensitive change, define the required versioning, migration, rollout, and rollback approach before approval. Do not assume URL versioning such as `/v2/` is the correct strategy.

### 4. Review and Approve

Implementation remains blocked until review is explicit.

Approval evidence must identify the contract artifact and reviewed revision. Use the project's normal review mechanism. If none exists, request human approval and record it with the plan or task.

If the project uses an implementation plan, the plan must reference the approved contract. If it does not, the plan is incomplete.

### 5. Implement Against the Approved Contract

Implement only behavior covered by the approved contract.

If implementation reveals a contract change is needed:

1. Stop the affected implementation.
2. Update the contract.
3. Re-run compatibility review.
4. Re-approve the changed contract.
5. Resume implementation.

Never silently diverge from the approved contract.

### 6. Verify Conformance

Before completion:

- validate the contract with the project's schema/lint tooling when available
- run the project's applicable contract or conformance tests against every changed boundary
- cover each materially changed consumer-visible behavior, including applicable success, validation, error, authentication, and authorization behavior
- validate emitted and accepted event/webhook payloads against their approved schemas when applicable
- run compatibility checks against the previous approved contract for changes
- update generated clients/docs when the project derives them from the contract

If required validation or conformance tooling is unavailable after checking the project's documented tooling and existing scripts, do not claim full conformance; identify each unverified check explicitly.

See example of tests: `skills\api-contract-first\contract-test-example.md`

#### 6.1 Contract Review Gate

Before production implementation begins, verify all applicable items.

##### Naming and consistency

- [ ] Names follow the existing API's resource, casing, and vocabulary conventions.
- [ ] New concepts do not introduce unnecessary synonyms or inconsistent terminology.

##### Contract completeness

- [ ] Requiredness, presence, optionality, and nullability are explicit where supported by the contract format.
- [ ] Types, formats, enum values, applicable constraints, and default behavior are defined where relevant.
- [ ] Success and applicable error behavior are documented.
- [ ] Collection operations define pagination or explicitly establish that pagination is unnecessary.
- [ ] Applicable idempotency, ordering, retry, or delivery semantics are documented.

##### Compatibility

- [ ] Compatibility impact is classified using the project's compatibility rules.
- [ ] Potentially breaking changes are identified explicitly.
- [ ] Breaking or migration-sensitive changes define the project's required versioning or migration strategy.

##### Security and operational constraints

- [ ] Authentication requirements and scheme are documented when applicable.
- [ ] Authorization requirements/scopes are documented when applicable.
- [ ] Applicable rate limits or usage constraints are documented.

##### Consumer usability

- [ ] The contract is designed around consumer requirements rather than implementation convenience.
- [ ] A consumer can understand the interface well enough to implement against it without relying on undocumented behavior.

## Rationalization Traps

| Shortcut | Required response |
| --- | --- |
| "It's a tiny endpoint; I'll document it after." | Contract first. Size does not remove the boundary. |
| "It's internal." | Inter-service consumers still depend on a contract. Purely intra-module code is out of scope. |
| "The client team already knows." | Shared assumptions are not an approved artifact. |
| "The PR description is enough." | Use the project's contract format and review path. |
| "We need to ship now." | Expedite review; do not silently bypass the contract gate. |
| "I already implemented it." | Freeze the implementation, write/review the contract, then reconcile code to the approved contract. |
| "I'm the lead; I approve skipping the contract." | Approval can approve a contract; it cannot replace the contract. The reviewed contract artifact must still exist before production implementation. |

## Completion Gate

The change is ready only when all applicable items are true:

- [ ] The contract artifact exists and matches project conventions.
- [ ] The contract revision is explicitly reviewed/approved.
- [ ] Compatibility classification is recorded.
- [ ] Breaking or migration-sensitive changes have versioning, rollout, and rollback guidance.
- [ ] The implementation plan/task references the contract when such a plan exists.
- [ ] Implementation matches the approved contract with no undocumented divergence.
- [ ] Required conformance and compatibility checks pass, or unverified checks are explicitly reported.
- [ ] Generated clients/docs are updated when applicable.
