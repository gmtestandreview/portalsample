# ADR Layout Variants

Alternative layouts for an ADR body. **Every variant is subordinate to
`SKILL.md` → Required Content**: whichever layout you pick, the finished ADR
must also carry Context, Decision, Positive and Negative Consequences,
Alternatives Considered (at least two, with rejection reasons), Validation,
Rollback / Reversal, and a Review Trigger. Repo file naming and front matter
still follow `docs/adr/` precedent; the `ADR-0001`-style numbers, names, and
figures below are **illustrative only**.

## 1. Standard (MADR-style)

Gaps against Required Content: add Validation, Rollback / Reversal, and a Review
Trigger.

```markdown
# ADR-0001: Use PostgreSQL as Primary Database

## Status

<Proposed | Accepted — per SKILL.md Status Lifecycle>

Deciders: <names of people who actually decided; omit and keep Proposed if none>

## Context

We need to select a primary database for a new e-commerce platform. The system
will handle ~10,000 concurrent users, a hierarchical product catalog, order and
payment transactions, full-text product search, and geospatial store lookup. The
team knows MySQL, PostgreSQL, and MongoDB. ACID compliance is needed for
financial transactions.

## Decision Drivers

- **Must have ACID compliance** for payment processing
- **Must support complex queries** for reporting
- **Should support full-text search** to reduce infrastructure complexity
- **Should have good JSON support** for flexible product attributes
- **Team familiarity** reduces onboarding time

## Considered Options

### Option 1: PostgreSQL

- **Pros**: ACID, JSONB, built-in full-text search, PostGIS, team experience
- **Cons**: Slightly more complex replication setup than MySQL

### Option 2: MySQL

- **Pros**: Familiar, simple replication, large community
- **Cons**: Weaker JSON support, no built-in full-text search, no geospatial
  without extensions

### Option 3: MongoDB

- **Pros**: Flexible schema, native JSON, horizontal scaling
- **Cons**: Multi-document transaction limits at decision time, limited team
  experience

## Decision

We will use **PostgreSQL** as our primary database.

## Rationale

The best balance of ACID compliance, built-in capabilities that avoid extra
services, team familiarity, and a mature ecosystem.

## Consequences

### Positive

- One database handles transactions, search, and geospatial queries
- Fewer services to operate
- Strong consistency for financial data

### Negative

- PostgreSQL-specific features (JSONB, full-text syntax) must be learned
- Vertical scaling limits may require read replicas sooner

### Risks

- Full-text search may not scale as well as a dedicated search engine.
  Mitigation: design so a search engine can be added later.

## Implementation Notes

- Use JSONB for flexible product attributes
- Connection pooling, streaming replication for read replicas

## Related Decisions

- Link related ADRs both ways.

## References

- Links to documentation and internal benchmarks.
```

## 2. Lightweight

Use for a small but ADR-worthy decision. **Not sufficient alone:** add
Alternatives Considered with rejection reasons, Validation, Rollback / Reversal,
and a Review Trigger.

```markdown
# ADR-0012: Adopt TypeScript for Frontend Development

- **Status**: <Proposed | Accepted>
- **Date**: YYYY-MM-DD (the real date of writing)
- **Deciders**: <names of people who actually decided; omit and keep Proposed if
  none>

## Context

The React codebase has grown to 50+ components with increasing bugs from prop
mismatches and undefined errors. PropTypes only check at runtime.

## Decision

Adopt TypeScript for all new frontend code. Migrate existing code incrementally.

## Consequences

**Good**: Compile-time type errors, better IDE support, self-documenting code.

**Bad**: Learning curve, initial slowdown, added build complexity.

**Mitigations**: Training sessions; allow gradual adoption with `allowJs: true`.
```

## 3. Y-statement

One-sentence summary form. **Not sufficient alone:** it carries no rejection
reasons, Validation, Rollback / Reversal, or Review Trigger. Use it as the
`Decision` summary at the top of a full ADR, not as the whole record.

```markdown
In the context of **building a microservices architecture**, facing **the need
for centralized API management, authentication, and rate limiting**, we decided
for **Kong Gateway** and against **AWS API Gateway and a custom Nginx
solution**, to achieve **vendor independence and plugin extensibility**,
accepting that **we must manage Kong infrastructure ourselves**.
```

## 4. Superseding

Use when a new ADR retires an earlier one. Set the earlier ADR to
`Superseded by <ref>` (or `Deprecated` when nothing replaces it) per
`SKILL.md` → Status Lifecycle, and link both ways. **Add** Alternatives
Considered, Validation, and a Review Trigger.

```markdown
# ADR-0020: Replace MongoDB with PostgreSQL for User Profiles

## Status

<Proposed | Accepted> (Supersedes ADR-0003)

Deciders: <names of people who actually decided; omit and keep Proposed if none>

## Context

ADR-0003 chose MongoDB for user profile storage for schema flexibility. Since
then: multi-document transactions remain problematic for the use case; the
schema has stabilized; PostgreSQL expertise now exists from other services;
running two databases increases operational burden.

## Decision

Replace MongoDB with PostgreSQL and migrate user profiles.

## Migration Plan

1. **Phase 1**: Create PostgreSQL schema, enable dual-write
2. **Phase 2**: Backfill historical data, validate consistency
3. **Phase 3**: Switch reads to PostgreSQL, monitor
4. **Phase 4**: Remove MongoDB writes, decommission

## Consequences

### Positive

- One database technology; ACID transactions for user data

### Negative

- Migration effort; risk of data issues during migration; some schema
  flexibility lost

## Lessons Learned

Carry forward from the superseded ADR:

- Schema flexibility benefits were overestimated
- Operational cost of multiple databases was underestimated
- Consider long-term maintenance in technology decisions
```

## 5. RFC-style

Use for a proposal that needs open discussion before the team commits, such as a
large design change with unresolved questions. It is a pre-decision document:
once the team decides, record the outcome as an ADR (or convert this one) so the
finished record carries a `Decision`. **Not sufficient alone:** add a status
per `SKILL.md` → Status Lifecycle (`Proposed` while open), Positive and Negative
Consequences, Validation, Rollback / Reversal, and a Review Trigger. The
`Alternatives` section must give a rejection reason for each option.

````markdown
# RFC-0025: Adopt Event Sourcing for Order Management

## Summary

Propose event sourcing for the order management domain to improve auditability,
enable temporal queries, and support business analytics.

## Motivation

1. Audit requirements need the complete order history
2. "What was the order state at time X?" queries are impossible today
3. The analytics team needs an event stream for real-time dashboards
4. Order state reconstruction for customer support is manual

## Detailed Design

### Event store

```text
OrderCreated      { orderId, customerId, items[], timestamp }
OrderItemAdded    { orderId, item, timestamp }
OrderItemRemoved  { orderId, itemId, timestamp }
PaymentReceived   { orderId, amount, paymentId, timestamp }
OrderShipped      { orderId, trackingNumber, timestamp }
```

### Projections

- **CurrentOrderState**: materialized view for queries
- **OrderHistory**: complete timeline for audit
- **DailyOrderMetrics**: analytics aggregation

### Technology

- Event store: EventStoreDB (purpose-built, handles projections)
- Alternative considered: Kafka plus a custom projection service

## Drawbacks

- Learning curve for the team
- More complexity than CRUD
- Events must be designed carefully (immutable once stored)
- Storage growth (events are never deleted)

## Alternatives

1. **Audit tables**: simpler, but no temporal queries
2. **CDC from the existing DB**: complex, does not change the data model
3. **Hybrid**: event source only the order state changes

## Unresolved Questions

- [ ] Event schema versioning strategy
- [ ] Retention policy for events
- [ ] Snapshot frequency for performance

## Implementation Plan

1. Prototype with a single order type
2. Team training on event sourcing
3. Full implementation and migration
4. Monitoring and optimization
````
