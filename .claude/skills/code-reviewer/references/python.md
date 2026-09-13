# Python Review Guide

Use this guide for Python application, library, async, data-processing, and test-code reviews.

## Type Hints and Data Shapes

- [ ] Public functions and changed internal boundaries have useful type hints.
- [ ] Optional values are represented explicitly.
- [ ] `Any` is avoided unless the boundary is genuinely dynamic.
- [ ] `TypedDict`, dataclasses, Pydantic models, or protocols are used where they clarify structure.
- [ ] Runtime validation and static typing agree.

```python
from typing import TypedDict

class UserPayload(TypedDict):
    id: str
    email: str
```

## Async Code

- [ ] Blocking I/O is not called directly from async functions.
- [ ] Tasks are awaited or managed by a task group.
- [ ] Cancellation is handled and re-raised when appropriate.
- [ ] Timeouts are explicit for network and external calls.
- [ ] Resources are cleaned up with context managers.

## Error Handling

- [ ] Catch specific exceptions, not broad `Exception`, unless there is a clear boundary.
- [ ] Do not swallow exceptions with empty `except` blocks.
- [ ] Preserve causes with `raise ... from exc` when wrapping errors.
- [ ] Error messages include useful context without leaking secrets.
- [ ] Custom exceptions form a small, meaningful hierarchy.

See `../cross-cutting/error-handling-principles.md` for cross-language guidance.

## Common Python Pitfalls

- Mutable default arguments.
- Mutable class attributes shared across instances.
- Late binding of loop variables in closures.
- Using `is` for value equality.
- String concatenation in large loops.
- Bare `except`.
- Using `assert` for runtime validation in production paths.
- Import-time side effects that make tests order-dependent.

```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

## Data and Performance

- [ ] Use `set` or `dict` lookups for repeated membership checks.
- [ ] Use generators or iterators for large streams.
- [ ] Avoid loading unbounded datasets into memory.
- [ ] Cache only when invalidation and size are bounded.
- [ ] Use process pools for CPU-bound parallelism and thread pools for blocking I/O.
- [ ] Avoid per-row database or API calls in loops.

## Testing

- [ ] Tests describe behavior clearly.
- [ ] Boundary cases and error paths are covered.
- [ ] Async code has async tests and awaited assertions.
- [ ] Fixtures clean up resources.
- [ ] Mocks isolate expensive or external dependencies without hiding the behavior under review.
- [ ] Parametrized tests cover meaningful input variation.

## Security

- [ ] SQL uses parameters or ORM-safe query construction.
- [ ] File paths from users are normalized and constrained.
- [ ] Deserialization avoids unsafe loaders for untrusted data.
- [ ] Secrets are not logged or committed.
- [ ] Subprocess calls avoid `shell=True` with untrusted input.
