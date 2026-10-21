# SQL Review Guide

Use this guide for SQL and query-layer reviews across relational databases.

## Mutations

- [ ] Every `UPDATE` and `DELETE` has a `WHERE` clause, or a deliberate and reviewed full-table intent.
- [ ] Writes that must be atomic are wrapped in a transaction.
- [ ] Destructive migrations are backward compatible with rolling deploys, or explicitly gated.

## Performance

- [ ] No N+1 patterns — a query inside a loop that could be a single `JOIN` or a batched query.
- [ ] Foreign-key columns used in `JOIN` or `WHERE` are indexed.
- [ ] Large result sets are paginated or streamed, not loaded wholesale.
- [ ] `SELECT *` is avoided on wide tables in hot paths.

See `../cross-cutting/n-plus-one-queries.md` for N+1 review guidance.

## Safety

- [ ] All values are passed as query parameters — never string-interpolated. See `../cross-cutting/sql-injection-prevention.md`.
- [ ] Query timeouts and row limits bound worst-case cost.
