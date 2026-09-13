# N+1 Query Review Guide

Use this guide when reviewing ORM usage, database access in loops, GraphQL resolvers, API composition, or any code that loads related data.

## Definition

An N+1 query pattern performs one query to load a collection, then performs one additional query per item to load related data.

```text
1 query      load N parent rows
N queries    load related rows one parent at a time
```

This is often invisible in development data and painful in production data.

## Risk Signals

- Database calls inside loops.
- Lazy-loaded relations accessed during serialization or template rendering.
- GraphQL field resolvers fetching related data per parent object.
- ORM navigation properties used after the initial list query.
- API calls made once per row instead of batched.
- Tests with tiny fixtures that do not reveal query growth.

## Detection

- Enable SQL logging in development or tests.
- Add query-count assertions around list endpoints and serializers.
- Use APM traces to identify repeated similar queries.
- Review generated SQL for ORM code.
- Test with enough rows to show growth.

## Preferred Fixes

- Use eager loading for required relations.
- Use batched `WHERE id IN (...)` queries for many-to-many or large related sets.
- Use projection to fetch only needed fields.
- Use DataLoader-style batching for GraphQL and graph-shaped access.
- Add pagination or limits before loading related data.
- Cache only when invalidation is clear and the data is safe to reuse.

## Review Checklist

- [ ] No database or API calls occur inside unbounded loops.
- [ ] Required relations are eager-loaded or batched.
- [ ] Large lists are paginated before relations are loaded.
- [ ] Serializers and templates do not trigger lazy loads accidentally.
- [ ] Query-count tests or traces cover the changed path when risk is high.
- [ ] Projections avoid fetching entire entities when only a few fields are needed.

## Common Finding

```text
Important: this endpoint loads accounts, then fetches invoices inside the loop.
For 100 accounts it can issue 101 queries. Batch invoice loading by account id
or use the repository's eager-loading pattern before serialization.
```
