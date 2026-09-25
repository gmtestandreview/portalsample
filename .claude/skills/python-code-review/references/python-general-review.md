# General Python review

Load this reference for a broad Python application/library review, performance or data-volume concerns, testing-quality review, security review, concurrency/determinism review, or modernization beyond lint/type-checker diagnostics.

## Common Python correctness traps

Check where relevant:

- mutable default arguments;
- mutable class attributes shared across instances;
- late-bound loop variables captured by closures;
- `is` used for value equality rather than identity;
- bare `except` or swallowed exceptions;
- `assert` used for production input/runtime validation;
- import-time side effects that make startup or tests order-dependent;
- accidental shared mutable state;
- confusing truthiness where `None`, empty, and zero have different semantics;
- fallback code that couples fields that can be recovered independently.

Do not mechanically flag a pattern when the surrounding contract makes it intentional.

## Data volume and performance

Look for algorithmic and I/O structure before micro-optimizing.

Check:

- repeated membership tests that should use `set`/`dict` indexing;
- unnecessary materialization where generators/iterators are sufficient;
- unbounded datasets loaded fully into memory;
- caches without explicit size/invalidation bounds;
- per-row database/API calls that should be batched;
- repeated parsing, serialization, or filesystem scans in hot loops;
- blocking I/O incorrectly sent to process pools or CPU-bound work incorrectly expected to scale with threads.

Use process-based parallelism for CPU-bound Python work and threads for blocking I/O only when that model fits the project/runtime. Do not recommend concurrency without considering overhead, ordering, cancellation, shared state, shutdown, and the supported environment.

Distinguish a demonstrated performance defect from a recommendation. Prefer profiling or representative measurements when execution is available.

## Concurrency and determinism

Concurrency can preserve correctness while changing externally visible order or identity.

Check as applicable:

- output depends on completion order rather than canonical input order;
- shared mutable state is synchronized or avoided;
- results are reassembled deterministically when ordering is contractual;
- task/thread failures are surfaced rather than silently dropped;
- cancellation/timeouts shut down work and external resources;
- generated IDs do not depend on nondeterministic scheduling unless explicitly allowed.

Repeat representative runs when nondeterminism is plausible.

## Testing quality

Check that tests:

- describe behavior rather than implementation details;
- cover boundaries, error paths, and material regressions;
- represent every demonstrated material defect with regression protection when practical;
- await async behavior correctly;
- clean up fixtures/resources;
- use mocks to isolate expensive/external dependencies without replacing the behavior under test;
- use parametrization for meaningful input variation;
- avoid order dependence and global-state leakage;
- include old-versus-new differential fixtures for behavior-preserving refactors when compatibility matters;
- include adversarial boundary cases after ordinary happy-path tests.

Do not equate test count or coverage percentage with behavioral adequacy.

## Security

Check as applicable:

- SQL is parameterized or constructed through ORM-safe APIs;
- user-controlled paths are validated, resolved, and constrained;
- untrusted deserialization uses safe loaders and explicit validation;
- untrusted values are traced through every relevant sink rather than treated as safe after one validation step;
- secrets are not logged or committed;
- subprocess construction avoids `shell=True` with untrusted input;
- temporary files, permissions, and environment variables do not create obvious leakage/privilege problems;
- serializers/templating APIs are used instead of hand-built escaping when possible.

For a specialist security assessment, compose with the relevant security skill rather than treating this reference as exhaustive.

## Modern Python practices

Modernization is P2 unless it fixes correctness, compatibility, security, or maintainability risk.

Consider only when compatible with the supported Python floor and project conventions:

- dataclasses for clear value/data objects;
- `slots=True` when object-volume/memory characteristics justify it and compatibility is understood;
- `pathlib.Path` where it improves path clarity without fighting project APIs;
- timezone-aware datetimes and unambiguous interchange timestamps;
- `statistics` functions when their sample/population semantics match the domain;
- comprehensions/generator expressions when they improve clarity rather than hide complex control flow;
- timezone-aware datetimes and unambiguous interchange timestamps;
- `statistics` functions when their sample/population semantics match the domain;
- comprehensions/generator expressions when they improve clarity rather than hide complex control flow;
- enums, `Literal`, protocols, immutable value types, or `Final`/literal key constants when they make constraints explicit without weakening type-checker precision.

Do not modernize merely to use newer syntax.

## Review boundary

This reference supports Python-specific review. It does not replace framework architecture, database, security, networking, distributed-systems, or domain-specific review guidance.
