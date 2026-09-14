# Python remediation method

Load this reference for deep Python correctness, data-model, boundary, async, filesystem, and compatibility review.

## Baseline and compatibility

- Determine the minimum supported Python version before recommending newer syntax/APIs.
- Inspect supplied `pyproject.toml`, Ruff, Pyright, pytest, dependency, lock, and CI configuration when present.
- Preserve public APIs, CLI behavior, serialized schemas, and downstream compatibility unless a breaking change is explicitly justified.
- Classify proposed changes as non-breaking, behavior-changing, schema-breaking, CLI-breaking, or API-breaking.

## Diagnose root causes

A high diagnostic count may come from one inaccurate abstraction.

Inspect:

- external-data structures versus trusted domain objects;
- heterogeneous mappings such as `dict[str, TypeA | TypeB]`;
- magic keys acting as type discriminators;
- `Any`/`Unknown` leakage;
- casts or `# type: ignore` hiding model errors;
- optionality and missingness;
- synthetic values mixed with real observations.

Prefer a model the type system can represent directly. Treat serialization compatibility separately from internal modelling quality.

## External data and typing

Use the flow:

`external data -> validated boundary representation -> strongly typed domain model -> business logic`

Check:

- root object type;
- required and optional fields;
- field types and ranges;
- booleans accepted accidentally as integers;
- fractional values truncated into counts;
- `NaN`/positive or negative infinity;
- strict JSON output when required;
- `TypedDict` required keys versus `NotRequired`;
- `None` versus missing keys;
- collection mutability and generic element types;
- public function parameter/return annotations;
- unexplained `Any`, `Unknown`, broad ignores, and unnecessary casts.

Do not replace `Any` with a recursive JSON alias throughout domain logic when validated domain types are available.

## Numeric and semantic correctness

Typing does not prove domain validity.

Check relevant invariants and relationships, but do not invent domain rules. Confirm them from supplied specifications or code contracts.

High-risk patterns:

- `int(float_value)` used as validation;
- missing data represented as zero;
- ratios formatted as percentages with incorrect delta units;
- lexical ordering for numbered entities (`1`, `10`, `2`);
- business relationships inferred from dict or filesystem iteration order;
- incomplete Cartesian combinations hidden by aggregate counts;
- all-or-nothing fallback logic that discards independently recoverable fields.

Use explicit sort keys and explicit absence (`None`/omission) where the contract calls for it.

## Async review

Check as applicable:

- blocking I/O inside async functions;
- un-awaited or unmanaged tasks;
- cancellation handling and re-raising;
- explicit timeouts for network/external calls;
- context-managed resource cleanup.

## Filesystem and parsing

Use the strongest appropriate path predicate (`exists`, `is_file`, `is_dir`).

Check:

- missing/unreadable input;
- invalid JSON;
- malformed directory/file names;
- fallback layouts;
- output-parent creation;
- permissions;
- explicit text encodings;
- exact parsing rather than permissive string splitting when grammar matters.

## Error handling and CLI behavior

Catch expected exceptions narrowly. Preserve useful context. Distinguish recoverable item-level failure from fatal program failure.

For CLI programs:

- normal output -> stdout;
- warnings/errors -> stderr or logging;
- fatal failures -> non-zero exit;
- prefer a testable `main() -> int` with `raise SystemExit(main())` when compatible with project conventions.

Do not blindly remove `print()` from a CLI merely to satisfy an optional lint rule.

## Security review

Check as applicable:

- parameterized SQL / ORM-safe construction;
- user paths normalized and constrained;
- safe deserialization for untrusted data;
- no secrets in logs or committed files;
- no `shell=True` with untrusted input.
