# Architecture Recommendation: <Title>

Use this full template only for the **Full** response mode — a consequential
design or review where a Brief or Standard write-up would lose material
information. For smaller work, use the shorter modes described in `SKILL.md`.

## Summary

Briefly state:

- the problem
- the recommendation
- why it is preferred over the alternatives

## Current State

Describe the current architecture and cite evidence (file paths, config,
schemas, deploy manifests, prior ADRs). Note where evidence is missing.

## Requirements and Assumptions

### Known Requirements

- ...

### Assumptions

- ... (label each; do not present an assumption as a fact)

### Open Questions

- ... (what must be answered before the design is safe to build)

## Constraints

- Business:
- Technical:
- Security / privacy:
- Operational:
- Time / cost:

## Proposed Architecture

Describe the proposed design.

```text
<ASCII architecture diagram when it aids understanding>
```

## Component Responsibilities

| Component | Responsibility | Inputs / Outputs | Notes |
| --- | --- | --- | --- |
| | | | |

## Data Ownership and Flow

Describe:

- source of truth for each entity
- write paths
- read paths
- consistency model
- retention
- sensitive-data boundaries

## Interfaces and Integration

Describe:

- APIs, events, queues
- contracts and schema ownership
- failure handling
- idempotency and ordering expectations

## Key Decisions

| Decision | Recommendation | Rationale | Risk | Validation |
| --- | --- | --- | --- | --- |
| | | | | |

## Trade-Offs

For each material decision:

- Pros
- Cons
- Alternatives
- Risks
- Mitigations

## Scalability Plan

- **Current scale:** ...
- **10x:** ...
- **100x:** ...
- **1000x:** ...

Do not claim scale readiness without evidence or a labeled assumption. For a
dedicated scale assessment, use the **scalability-review** skill.

## Security, Privacy, Reliability, and Operations

Cover:

- trust boundaries
- least privilege
- secret handling
- failure modes and blast radius
- graceful degradation
- retries / backoff / idempotency
- observability (logs, metrics, traces)
- SLOs / SLIs where relevant

## Testing and Validation

Include:

- functional testing
- integration testing
- non-functional testing
- security review
- performance / load tests when relevant
- observability verification
- success metrics

## Rollout

Describe:

- sequencing
- feature flags
- canary / phased rollout
- migration strategy
- monitoring during rollout

## Rollback

Describe:

- rollback trigger
- rollback steps
- data compatibility considerations

## Escalation Risks

List risks that require sign-off before proceeding:

- user approval
- security review
- privacy review
- operations / SRE review
- legal / compliance review
- specialist expertise

## ADRs

List the decisions that warrant an ADR (use the **adr** skill). Do not inline
full ADRs here.

## Recommendation

State the practical next action and why.
