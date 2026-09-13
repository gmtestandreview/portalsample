# Universal Code Quality Guide

Use this guide for language-neutral review concerns: readability, correctness, maintainability, tests, error handling, and change discipline.

## Core Review Heuristics

- Code should make the intended behavior obvious.
- Names should reveal domain meaning, not just implementation mechanics.
- Control flow should be simple enough to audit.
- Edge cases should be explicit where they affect users, data, money, security, or reliability.
- Tests should protect behavior that could realistically regress.

## Correctness

Check off-by-one errors, empty inputs, null or undefined values, time zones, locale, currency, precision, race conditions, retries, duplicate events, idempotency, authorization, tenant scoping, and consistency between validation and persistence constraints.

## Readability

Prefer small functions, direct conditionals, domain names, useful comments, early returns when they reduce nesting, and locality for related code.

Flag ambiguous boolean parameters, deep nesting, large mixed-responsibility functions, magic values, and stale comments.

## Maintainability

- [ ] New abstractions remove real duplication or isolate a meaningful boundary.
- [ ] Existing patterns are followed unless there is a clear reason to diverge.
- [ ] Configuration is explicit and documented where operators must set it.
- [ ] Dependencies are justified and do not duplicate existing capability.
- [ ] Public behavior is tested before internal refactors.
- [ ] Dead or orphaned code introduced by the change is removed.

## Error Handling

- Errors preserve enough context for diagnosis.
- User-facing messages are safe and understandable.
- Retriable failures are distinguishable from permanent failures.
- Cleanup happens on failures, cancellation, and early returns.
- Exceptions are not swallowed unless the fallback behavior is intentional and tested.

See `../cross-cutting/error-handling-principles.md` when error handling is a primary risk.

## Tests

Good tests describe behavior, fail for meaningful regressions, assert observable results, cover boundaries, avoid excessive mocking, and remain deterministic.

Missing tests matter most for shared logic, security, data writes, money, concurrency, migrations, and cross-module contracts.

## Performance

Look for repeated work inside loops, unbounded memory growth, N+1 queries, per-item API calls, blocking I/O on hot paths, missing pagination, and cache invalidation gaps.

Use `performance-review-guide.md` when performance is central to the review.

## Security and Privacy

Check input validation, output encoding, authorization, tenant boundaries, secrets in logs or client payloads, unsafe dynamic SQL, shell commands, file paths, redirects, deserialization, and sensitive data minimization.

Use `security-review-guide.md` when the change touches security-sensitive behavior.

## Review Discipline

- Focus findings on behavior, risk, and maintainability.
- Do not block on personal preference or mechanical formatting.
- Prefer actionable suggestions with concrete alternatives.
- State uncertainty when evidence is incomplete.
- Do not claim tests, builds, scanners, or CI passed unless directly observed.
