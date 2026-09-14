# Python remediation method

Load this reference for deep Python correctness, data-model, external-boundary, determinism, async, filesystem, CLI/server/subprocess, and compatibility review.

## Artifact provenance and baseline

Before editing:

- identify the exact source path/revision/copy under review;
- determine the minimum supported Python version and the local/CI versions when available;
- inspect supplied `pyproject.toml`, Ruff, Pyright/mypy, pytest, dependency/lock, and CI configuration;
- inventory supplied diagnostics with analyzer/rule, path/line/function, artifact/version, configuration/profile, and freshness when available;
- compile the original and run existing tests when possible;
- preserve public APIs, CLI behavior, serialized schemas, and downstream compatibility unless change is explicitly justified.

If the authoritative source is read-only, keep it unchanged. Make an explicit derived copy, state its provenance, and report checks against that copy rather than saying the original was fixed.

Classify proposed changes as non-breaking, behavior-changing, schema-breaking, CLI-breaking, API-breaking, or destructive.

## Diagnose root causes

A high diagnostic count may come from one inaccurate abstraction. Inspect:

- external-data structures versus trusted domain objects;
- heterogeneous mappings such as `dict[str, TypeA | TypeB]`;
- magic keys acting as type discriminators;
- `Any`/`Unknown` leakage;
- casts or `# type: ignore` hiding model errors;
- optionality and missingness;
- synthetic values mixed with real observations;
- repeated I/O or parsing;
- ordering/identity derived from incidental iteration.

Prefer a model the type system can represent directly. Treat serialization compatibility separately from internal modelling quality. Narrow optional resources before passing callbacks/bound methods across threads or closures.

## External data and sink tracing

Use:

`external data -> validated boundary representation -> strongly typed domain model -> business logic -> validated/escaped sink`

Validate as applicable:

- root object and field types;
- required versus optional fields;
- booleans accidentally accepted as integers;
- integer-valued versus fractional floats;
- ranges and lengths;
- `NaN`/positive or negative infinity;
- strict JSON requirements;
- `TypedDict` required keys versus `NotRequired`;
- missing keys versus explicit `None`;
- names/identifiers before filesystem or serialization use;
- collection mutability and generic element types;
- public function parameter/return annotations where part of the project contract;
- unexplained `Any`/`Unknown`, broad ignores, and unnecessary casts.

For each untrusted identifier or value, follow it through **every** relevant sink, not only the first:

- path component or filename;
- YAML/TOML/JSON/config scalar;
- shell/subprocess argument;
- log line;
- dictionary/cache key;
- HTML/DOM/API identifier;
- generated output name.

The same value can create different classes of defects at different sinks. Prefer standard serializers/encoders over manual escaping.

### Identifier/name validation

When external values become generated names or path components, decide and enforce the applicable contract for:

- `/` and `\` separators;
- `.` and `..`;
- absolute-like paths, drive letters, or UNC-like forms;
- newlines/control characters;
- leading/trailing whitespace where ambiguous;
- maximum length;
- platform-invalid characters when portability matters;
- Unicode normalization/acceptance.

Validate before filesystem use, then still serialize/escape appropriately for other sinks.

## Numeric, semantic, and metadata correctness

Typing does not prove domain validity. Confirm invariants from supplied specs or code contracts; do not invent them.

High-risk patterns include:

- `int(float_value)` used as validation;
- missing observations represented as zero;
- ratios/percent deltas with wrong units;
- lexical ordering for numbered entities (`1`, `10`, `2`);
- incomplete Cartesian combinations hidden by aggregate counts;
- business relationships inferred from dict/filesystem iteration order;
- all-or-nothing fallback logic that discards independently recoverable fields.

Preserve independent metadata fields independently. For fallback chains, test each recoverable field separately rather than replacing an entire object because one field is missing.

Use explicit sort keys and explicit absence (`None`/omission) where the contract calls for it.

## Determinism, ordering, and generated IDs

Pressure-test:

- `1`, `2`, `10` versus lexical order;
- filesystem/discovery order;
- set/dict sources where order is not part of the contract;
- concurrency completion order;
- stable output ordering across repeated runs;
- generated IDs under duplicate/similar inputs;
- any feedback/cache/deduplication keys derived from those IDs;
- collision handling and deterministic tie-breaking;
- ambiguous normalized names such as `a-b` and `a/b`.

Do not derive externally visible identity from incidental iteration or task-completion order. If IDs must be stable, define the canonical input and collision strategy. If they must be unique across runs, use an appropriately collision-resistant scheme rather than a small counter or lossy normalization.

## Filesystem containment

Use the strongest appropriate path predicate (`exists`, `is_file`, `is_dir`) and distinguish missing, wrong-type, unreadable, and permission failures.

For user-controlled paths/names:

1. join only after lexical/name validation where useful;
2. resolve/canonicalize using project-appropriate semantics;
3. verify the resolved target remains inside the allowed root;
4. consider symlinks and existing/non-existing target behavior;
5. test traversal (`../`), absolute-like paths, alternate separators, drive/UNC forms where portable behavior matters.

Check output-parent creation, explicit text encodings, permissions, fallback layouts, and exact parsing rather than permissive string splitting when grammar matters.

## Async, threads, and subprocesses

Check as applicable:

- blocking I/O inside async functions;
- un-awaited/unmanaged tasks;
- cancellation handling and re-raising;
- explicit network/external timeouts;
- context-managed resource cleanup;
- thread/process shutdown on normal, error, timeout, and early-return paths.

For `subprocess.Popen(..., stdout=PIPE, stderr=PIPE)` or similar:

- capture/narrow `stdout`/`stderr` once before passing readers across threads/closures;
- define EOF/sentinel/shutdown behavior;
- prevent reader threads from waiting forever;
- terminate/kill the process tree as required on all exit paths;
- use bounded joins/timeouts;
- pressure-test malformed output, EOF, early process exit, timeout, and early success/failure triggers.

## CLI behavior

Catch expected exceptions narrowly and preserve useful context. For CLI programs:

- normal output -> stdout;
- warnings/errors -> stderr or logging;
- fatal failures -> non-zero exit;
- prefer a testable `main() -> int` plus `raise SystemExit(main())` when compatible.

Pressure-test relevant CLI boundaries:

- `--help`;
- missing/wrong/empty inputs;
- file-versus-directory mismatch;
- unreadable input/unwritable output;
- invalid numeric arguments;
- port-like arguments including negative, `0`, and values above `65535`;
- useful error text and exit status.

Do not blindly remove `print()` from a CLI merely to satisfy optional lint policy.

## HTTP/local server boundaries

When the reviewed Python code starts an HTTP server, also check applicable runtime semantics:

- bind address (loopback versus external exposure);
- actual bound port when `0` requests an ephemeral port;
- supported/unsupported methods;
- `Content-Type`;
- response JSON structure and member types;
- request-body size limits;
- malformed JSON and controlled 4xx behavior;
- disconnected/slow clients;
- threading/concurrency shutdown behavior;
- CSRF/origin/token assumptions appropriate to the threat model.

A server that starts successfully has not proved these behaviors.

## Security review

Check as applicable:

- parameterized SQL / ORM-safe construction;
- safe deserialization for untrusted data;
- no secrets in logs or committed files;
- no `shell=True` with untrusted input;
- path containment and sink-specific escaping;
- temporary files/permissions/environment variables;
- framework-specific security controls via a specialist skill when needed.

Security hardening should reject newly invalid inputs while preserving valid legacy inputs unless a breaking contract change is explicitly authorized.

## Differential remediation

For behavior-preserving remediation, run original and candidate on the same representative fixtures where possible. Compare applicable:

- return values/structures;
- JSON/YAML/TOML/HTML/text outputs;
- field presence and independently recoverable metadata;
- CLI stdout/stderr and exit codes;
- ordering;
- files/network/other side effects.

For each demonstrated material defect, add or identify a regression test. Rerun the original failing scenario first after repair, then related positive/near-miss and compatibility cases.

If original execution is unavailable, state the differential gap; do not claim behavior preservation was proven.
