# System Design Checklist

Use proportionately. Do not force every item into every response. Each unchecked
item is either a gap to close or a conscious "not applicable" you can defend.

## Goals and Scope

- [ ] Business goal is clear
- [ ] User stories or use cases are understood
- [ ] In-scope and out-of-scope items are defined
- [ ] Success criteria are known

## Current State

- [ ] Existing architecture inspected (code, config, schemas, deploy files, prior ADRs)
- [ ] Key modules / services identified
- [ ] Dependencies understood
- [ ] Existing conventions considered
- [ ] Technical debt and constraints identified

## Requirements

- [ ] Functional requirements captured
- [ ] Non-functional requirements captured
- [ ] Performance targets known or labeled unknown
- [ ] Availability / reliability expectations known
- [ ] Security / privacy requirements considered
- [ ] Scale expectations known or labeled unknown

## Architecture

- [ ] Component responsibilities are clear
- [ ] Boundaries minimize unnecessary coupling
- [ ] API / interface contracts are defined where needed
- [ ] Data ownership is explicit
- [ ] Integration patterns are justified
- [ ] Failure modes are considered

## Data

- [ ] Source of truth is clear
- [ ] Read / write paths are understood
- [ ] Consistency requirements are explicit
- [ ] Migration requirements are considered
- [ ] Retention / privacy requirements are addressed

## Security

- [ ] Trust boundaries identified
- [ ] Least privilege applied
- [ ] Secrets are not embedded or exposed
- [ ] Sensitive data is handled appropriately
- [ ] Abuse / misuse risks considered

## Reliability

- [ ] Error handling strategy exists
- [ ] Retries are bounded
- [ ] Idempotency considered where relevant
- [ ] Graceful degradation considered
- [ ] Recovery and rollback paths exist

## Performance and Scale

- [ ] Performance bottlenecks considered
- [ ] Profiling precedes optimization
- [ ] Caching is justified, not reflexive
- [ ] 10x / 100x / 1000x implications considered when relevant
- [ ] Scale claims are evidence-based or marked as assumptions

## Operations

- [ ] Logs are sufficient
- [ ] Metrics are defined
- [ ] Alerts are actionable
- [ ] Tracing is considered where useful
- [ ] Deployment and rollback are documented

## Validation

- [ ] Functional validation defined
- [ ] Integration validation defined
- [ ] Security review defined when needed
- [ ] Performance / load testing defined when needed
- [ ] Success metrics exist for significant decisions

## Decision Quality

- [ ] Alternatives considered
- [ ] Trade-offs documented
- [ ] Irreversible decisions minimized
- [ ] ADR created only when justified
- [ ] Review trigger defined for significant decisions
