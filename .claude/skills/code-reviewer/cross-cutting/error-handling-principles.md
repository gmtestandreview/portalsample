# Error Handling Principles

Use this guide when reviewing exceptions, error return values, retries, fallbacks, logging, user-facing errors, or API error contracts.

## Core Principles

- Every error must be handled, propagated, or intentionally converted.
- Error messages should include the operation and safe diagnostic context.
- Callers should be able to distinguish expected domain failures from infrastructure failures.
- Errors should be handled once at the right boundary; avoid logging and rethrowing at every layer.
- Preconditions should fail fast before expensive or irreversible work starts.
- Cleanup should happen on failure, cancellation, timeout, and early return.

## Common Anti-Patterns

- Empty `catch` or `except` blocks.
- Catching a broad exception and returning a vague fallback.
- Losing the original cause when wrapping an error.
- Using exceptions for ordinary control flow in hot paths.
- Ignoring boolean, `Result`, `Either`, or error return values.
- Logging secrets, tokens, passwords, or personal data in error context.
- Retrying non-idempotent operations without a key or deduplication guard.

## Boundary Design

Use different error layers:

- **Infrastructure errors:** database, network, file system, queue, cache, third-party APIs.
- **Domain errors:** validation failure, insufficient balance, invalid state transition, permission failure.
- **Application errors:** API or UI-facing response shape, status code, support code, or user message.

Convert infrastructure errors to domain or application errors at module boundaries. Do not leak database driver messages, stack traces, or internal object names to users.

## Logging

- Use structured fields for operation, resource id, actor id, correlation id, and safe failure category.
- Avoid logging full request bodies unless the data is known safe.
- Choose log level by actionability: `ERROR` for failures needing attention, `WARN` for degraded but recovered behavior, `INFO` for expected business events, and `DEBUG` for local diagnostics.
- Sanitize user-controlled text to prevent log injection.

## Retry and Fallback

- Retry only transient failures.
- Bound retries with a limit, timeout, and backoff.
- Add jitter for distributed systems.
- Avoid retrying unsafe writes unless the operation is idempotent.
- Make fallback behavior visible through logs or metrics.

## Review Checklist

- [ ] No errors are silently swallowed.
- [ ] Error messages include safe, useful context.
- [ ] Original causes are preserved when errors are wrapped.
- [ ] User-facing errors do not leak internals.
- [ ] Cleanup runs on all exit paths.
- [ ] Retries are bounded and safe for the operation.
- [ ] Logs avoid secrets and personal data.
- [ ] Tests cover important error and fallback paths.

## Finding Template

```text
Severity: Blocking | Important
Location: <file:line>
Risk: <what failure becomes hidden, unsafe, or hard to recover from>
Evidence: <specific error path>
Fix: <minimal error handling or contract change>
Test: <case that proves the behavior>
```
