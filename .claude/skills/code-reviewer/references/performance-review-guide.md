# Performance Review Guide

Use this guide when a change affects runtime speed, memory, database load, API latency, bundle size, rendering, or scalability.

## Review Mindset

- Measure before optimizing when measurement is practical.
- Focus on hot paths, high-cardinality data, user-visible latency, and resource limits.
- Prefer bounded work: pagination, batching, limits, timeouts, and cancellation.
- Treat performance findings as risk-based, not style-based.

## Frontend Performance

| Metric | Target | Review focus |
| --- | --- | --- |
| LCP | 2.5s or less | Hero content, server rendering, image priority, critical CSS |
| INP | 200ms or less | Long tasks, event handlers, main-thread work |
| CLS | 0.1 or less | Image dimensions, reserved space, font loading, inserted content |
| FCP | 1.8s or less | render-blocking CSS, fonts, scripts |
| TBT | 200ms or less | JavaScript execution and long tasks |

## Frontend Checklist

- [ ] Critical images are not lazy-loaded.
- [ ] Images use appropriate dimensions and modern formats.
- [ ] Fonts use a deliberate loading strategy.
- [ ] Large lists are virtualized or paginated.
- [ ] Heavy computation is deferred, chunked, memoized, or moved off the main thread.
- [ ] Event handlers do not trigger excessive re-rendering.
- [ ] Bundle size is monitored when dependencies are added.
- [ ] Dynamic imports are used for rarely visited routes or heavy features.

## Memory

- [ ] Event listeners are removed when components unmount.
- [ ] Timers, subscriptions, WebSocket connections, and observers are cleaned up.
- [ ] Large objects are not kept alive by closures or global caches.
- [ ] Caches have size or TTL limits.
- [ ] Streams are used for large payloads where appropriate.

## Database Performance

- [ ] No N+1 query pattern.
- [ ] Filters use indexed columns for high-cardinality tables.
- [ ] Queries avoid `SELECT *` for large result sets.
- [ ] Large table reads use limits, pagination, or streaming.
- [ ] Sorting and filtering match index order where relevant.
- [ ] Migrations add indexes safely for large tables.

See `../cross-cutting/n-plus-one-queries.md` for N+1 guidance.

## API Performance

- [ ] List endpoints paginate and cap page size.
- [ ] Expensive endpoints have timeouts.
- [ ] Requests avoid per-item downstream calls.
- [ ] Batching or bulk operations are used where appropriate.
- [ ] Responses return only necessary fields.
- [ ] Compression and caching headers are appropriate.
- [ ] Rate limits protect expensive endpoints.

## Algorithmic Complexity

| Complexity | Signal |
| --- | --- |
| O(1) | constant-time lookup |
| O(log n) | binary search or balanced tree lookup |
| O(n) | one pass over input |
| O(n log n) | typical efficient sort |
| O(n^2) | nested loops over growing input |
| O(2^n) | combinatorial explosion |

Flag quadratic or worse behavior when input can grow beyond small bounded sets.

## Review Findings

Include the expensive operation, the input size or path where it matters, the user or system impact, a practical remediation, and what evidence exists.
