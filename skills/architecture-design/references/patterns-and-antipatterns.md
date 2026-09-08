# Patterns and Anti-Patterns Reference

This is a catalogue, not a default prescription. Use a pattern only when a
requirement justifies it. Naming a pattern is not a design; explain why it fits
the requirement in front of you.

## Frontend Patterns

- Component composition
- Container / presenter separation
- Custom hooks
- State colocation
- Code splitting
- Progressive loading

## Backend Patterns

- Service layer
- Repository pattern
- Middleware
- Background workers
- Event-driven architecture
- CQRS
- Idempotent command handling

## Data Patterns

- Normalized schemas
- Caching layers
- Read models
- Outbox pattern
- Event sourcing
- Eventual consistency
- Audit logs

## Reliability Patterns

- Circuit breaker
- Bounded retries with backoff
- Idempotency keys
- Bulkheads
- Graceful degradation
- Health checks
- Canary deployment

## Security Patterns

- Least privilege
- Defense in depth
- Explicit trust boundaries
- Secret rotation
- Short-lived credentials
- Input validation
- Audit trails

## Anti-Patterns / Red Flags

### Big Ball of Mud

No clear structure, boundaries, or ownership.

### Golden Hammer

The same solution is applied regardless of problem fit.

### God Object / God Service

One component owns too many responsibilities.

### Tight Coupling

Components cannot change independently.

### Distributed Monolith

Microservices exist but remain tightly coupled operationally or by deployment.

### Hidden Data Ownership

No explicit source of truth or write authority.

### Premature Optimization

Performance work occurs before measurement or profiling.

### Analysis Paralysis

Architecture work expands without a decision or delivery path.

### Implicit Security Boundary

Trust assumptions are undocumented.

### Unobservable System

Failures cannot be detected or diagnosed quickly.

### Unbounded Tool Use

Commands or automation run without clear permissions or side-effect controls.

### Irreversible Migration

Data or infrastructure changes lack rollback or compatibility planning.
