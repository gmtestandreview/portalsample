# Python / Ruff / Pyright Code Review and Remediation Checklist

## Purpose

Use this checklist when auditing, modernising, repairing, or hardening a Python script or module.

The objective is not simply to make Ruff and Pylance quiet.

The objective is to produce code that is:

- functionally correct;
- strongly typed;
- deterministic;
- explicit at external boundaries;
- resistant to malformed input;
- maintainable;
- compatible with the project's supported Python version;
- lint-clean under the project's agreed Ruff rules;
- type-clean under strict Pyright/Pylance;
- backed by behavioural regression tests;
- verified before completion.

---

## 1. Establish the Baseline Before Changing Code

## 1.1 Record the environment

- [ ] Identify the minimum supported Python version.
- [ ] Identify the Python version currently used by CI.
- [ ] Identify the Python version used locally.
- [ ] Do not recommend syntax or typing features newer than the supported minimum.
- [ ] Check whether `typing_extensions` is already available if backports are needed.

Record:

```text
Minimum Python:
CI Python:
Local Python:
Ruff version:
Pyright/Pylance version:
pytest version:
```

## 1.2 Inspect repository configuration

Check for:

```text
pyproject.toml
ruff.toml
.ruff.toml
pyrightconfig.json
setup.cfg
tox.ini
pytest.ini
requirements*.txt
uv.lock
poetry.lock
pdm.lock
```

- [ ] Read existing Ruff settings.
- [ ] Read existing Pyright settings.
- [ ] Read existing pytest configuration.
- [ ] Respect repository-level line length and formatter settings.
- [ ] Do not introduce a personal linting policy without identifying it as optional.

## 1.3 Capture the starting state

Run, where available:

```bash
python -m compileall -q path/to/code.py
ruff check path/to/code.py
ruff format --check path/to/code.py
pyright path/to/code.py
pytest -q
```

Record:

```text
Syntax:
Ruff errors:
Ruff warnings:
Pyright errors:
Pyright warnings:
Tests passed:
Tests failed:
```

- [ ] Preserve diagnostic output before remediation.
- [ ] Count diagnostics by rule rather than treating each line independently.
- [ ] Look for common root causes.

---

## 2. Classify Evidence Correctly

Every review finding should be labelled mentally or explicitly as one of these.

## Verified defect

Directly demonstrated by:

- source code;
- supplied diagnostic;
- failing test;
- executed tool;
- reproducible runtime behaviour.

## Statically confirmed defect

Clearly visible in source but not yet exercised.

Example:

```python
sorted({1, "2"})
```

when the program's declared type permits both.

## Conditional lint finding

Would be reported only if a particular Ruff family is enabled.

Example:

```text
PTH123 if PTH is enabled
ANN201 if ANN is enabled
UP017 if UP is enabled
```

## Recommendation

A design or maintainability improvement rather than an existing failure.

### Rule

- [ ] Never present a predicted Ruff rule as executed Ruff output.
- [ ] Never claim Pyright clean unless Pyright was run.
- [ ] Never claim tests pass without a fresh successful test run.
- [ ] Clearly distinguish compatibility recommendations from mandatory fixes.

---

## 3. Understand the Data Model Before Fixing Diagnostics

This was the most important lesson from the benchmark-script review.

A large diagnostic count can originate from one bad abstraction.

## Ask first

- [ ] What are the core domain objects?
- [ ] Which structures represent external data?
- [ ] Which structures represent trusted internal state?
- [ ] Are unrelated shapes mixed in one dictionary?
- [ ] Are magic dictionary keys being used as implicit type discriminators?
- [ ] Are optional values modelled explicitly?
- [ ] Are synthetic values mixed with real domain values?

## Red flag

Avoid structures like:

```python
dict[str, TypeA | TypeB]
```

when the actual semantic rule is:

```text
special key X → TypeB
every other key → TypeA
```

Prefer:

```python
class Summary(TypedDict):
    configurations: dict[str, ConfigSummary]
    delta: DeltaSummary | None
```

or another structure where the type system can represent the real domain.

### Boundary checklist

- [ ] Eliminate heterogeneous mappings where practical.
- [ ] Avoid casts that merely hide an inaccurate model.
- [ ] Prefer fixing the type architecture over adding `cast()`.
- [ ] Prefer fixing the type architecture over `# type: ignore`.
- [ ] Treat serialization compatibility separately from internal modelling quality.

---

## 4. Check for Backward-Compatibility Constraints

Before restructuring JSON, YAML, database records, or CLI output:

- [ ] Identify external consumers.
- [ ] Determine whether the schema is public or internal.
- [ ] Search for consumers of changed keys.
- [ ] Determine whether generated fixtures depend on current shape.
- [ ] Identify whether documentation describes the current schema.
- [ ] Determine whether a migration/version bump is required.

Classify proposed changes:

```text
Non-breaking
Behaviour-changing
Schema-breaking
CLI-breaking
API-breaking
```

If a better design would break existing output:

- [ ] Prefer a compatibility-preserving repair for the current change.
- [ ] Record the cleaner model as a future schema revision.
- [ ] Do not silently introduce structural breaking changes during lint remediation.

---

## 5. Audit the JSON / External Data Boundary

External JSON is untrusted data even when generated by another internal script.

## Avoid

```python
JsonObject = dict[str, Any]
```

throughout application logic.

## Prefer

```python
type JsonScalar = str | int | float | bool | None
type JsonValue = JsonScalar | list[JsonValue] | dict[str, JsonValue]
type JsonObject = dict[str, JsonValue]
```

followed by conversion into domain types.

## Boundary workflow

```text
External data
    ↓
JSON-compatible representation
    ↓
validation
    ↓
typed domain object
    ↓
business logic
```

### Numeric conversion checklist

- [ ] Keep `Any` at unavoidable external boundaries only.
- [ ] Prefer `object` when the actual type is unknown.
- [ ] Validate dictionary root types.
- [ ] Validate required fields.
- [ ] Validate field types.
- [ ] Validate values, not merely types.
- [ ] Do not blindly coerce malformed values with `str(...)`.
- [ ] Reject invalid values or deliberately apply documented defaults.

---

## 6. Eliminate Unknown and Any Leakage

Search for:

```text
Any
Unknown
cast(
# type: ignore
dict
list
tuple
```

without useful parameters.

For each occurrence ask:

- [ ] Why is the type unknown?
- [ ] Can it be validated at ingestion?
- [ ] Can a `TypedDict`, dataclass, protocol, enum, literal, or type alias model it?
- [ ] Is the cast proving something true, or merely silencing the checker?
- [ ] Could the caller supply a value the cast does not actually guarantee?

Target:

```text
0 unexplained Any
0 unexplained Unknown
0 broad type ignores
minimal casts
```

---

## 7. Audit Every Public Function Signature

Check every function for:

- [ ] parameter annotations;
- [ ] return annotation;
- [ ] useful collection element types;
- [ ] correct optionality;
- [ ] constrained string arguments;
- [ ] overly broad `Any`;
- [ ] overly broad `object`;
- [ ] unnecessarily mutable inputs.

Prefer:

```python
def calculate_stats(values: Sequence[float]) -> Stats:
```

over:

```python
def calculate_stats(values: list[float]):
```

when mutation is not required.

Prefer:

```python
type MetricName = Literal["pass_rate", "time_seconds"]
```

over:

```python
metric: str
```

when only specific values are legal.

---

## 8. Local Variable Annotation Policy

Do not confuse:

```text
explicit typing
```

with:

```text
annotate every obvious local expression
```

Recommended policy:

Explicitly annotate:

- [ ] module-level variables;
- [ ] ambiguous unions;
- [ ] important collections;
- [ ] deserialization results;
- [ ] function boundaries;
- [ ] values where inference is losing information;
- [ ] variables required by repository policy.

Usually allow inference for:

```python
label = name.replace("_", " ").title()
count = len(values)
```

unless the repository explicitly requires every local to be annotated.

The actual quality goal is:

```text
zero Unknown leakage
zero implicit Any leakage
clear public contracts
```

---

## 9. Audit Numeric Conversion Carefully

Never assume:

```python
int(float_value)
```

means "validate integer."

It truncates.

Check count-like fields including:

```text
passed
failed
total
errors
retries
tool_calls
run_number
token_count
```

Prefer:

```python
if isinstance(value, int) and not isinstance(value, bool):
    return value

if isinstance(value, float) and value.is_integer():
    return int(value)
```

### Checklist

- [ ] Explicitly reject booleans when numeric values are expected.
- [ ] Reject fractional counts.
- [ ] Decide whether negative values are valid.
- [ ] Apply range/domain validation.

---

## 10. Check NaN and Infinity

A float annotation does not guarantee an ordinary finite number.

Test:

```python
math.nan
math.inf
-math.inf
```

For metrics:

- [ ] use `math.isfinite()`;
- [ ] reject non-finite values where inappropriate;
- [ ] prevent non-standard JSON output.

For strict JSON:

```python
json.dump(
    data,
    stream,
    allow_nan=False,
)
```

---

## 11. Validate Domain Invariants

Typing answers:

> What kind of value is this?

It does not answer:

> Is this value meaningful?

Potential invariants include:

```text
0 <= pass_rate <= 1
total >= 0
passed >= 0
failed >= 0
passed + failed == total
errors >= 0
duration >= 0
tokens >= 0
```

For every numeric domain field:

- [ ] establish its allowed range;
- [ ] establish relationships to other fields;
- [ ] decide whether invalid data raises, warns, skips, or defaults.

Never silently invent a domain rule—confirm it from specifications where necessary.

---

## 12. Detect Fabricated Data

One of the most important lessons:

**Missing data is not zero data.**

Avoid patterns such as:

```python
baseline = empty_summary()
delta = primary - baseline
```

when no baseline actually exists.

Instead:

```python
delta: DeltaSummary | None = None
```

### Fabricated-data audit questions

- [ ] Are missing values converted into zero?
- [ ] Does an empty collection accidentally represent real observations?
- [ ] Does missing comparison data create a fake improvement?
- [ ] Does `None` better represent absence?
- [ ] Should the report omit the metric instead?

---

## 13. Verify Units

For every metric ask:

```text
Stored unit?
Displayed unit?
Delta unit?
```

Example:

```text
stored pass rate = 0.80
displayed pass rate = 80%
delta should be = +20 percentage points
not +0.20%
```

### Units checklist

- [ ] Ratios versus percentages.
- [ ] Seconds versus milliseconds.
- [ ] Bytes versus KB/MB.
- [ ] Token totals versus averages.
- [ ] Absolute versus relative change.
- [ ] Percentage versus percentage-point change.

Keep analytical values numeric internally.

Apply formatting only at presentation boundaries.

---

## 14. Audit Ordering and Determinism

Do not assume lexical ordering equals semantic ordering.

Bad:

```text
run-1
run-10
run-2
```

Correct numeric ordering:

```text
run-1
run-2
run-10
```

### Ordering checks

- [ ] run directories;
- [ ] evaluation directories;
- [ ] version strings;
- [ ] filenames containing numbers;
- [ ] dictionary iteration where order affects semantics;
- [ ] sets before serialization.

Use explicit sort keys.

Also test mixed-type sortable values if the declared type permits them.

---

## 15. Never Encode Business Logic in Dictionary Order

Red flag:

```python
configs = list(results)
primary = configs[0]
baseline = configs[1]
```

Ask:

- [ ] Is the first item truly meaningful?
- [ ] What if three configurations exist?
- [ ] What if insertion order changes?
- [ ] What if two candidate configurations exist?
- [ ] What if an unknown config name is introduced?

Prefer explicit relationships:

```python
COMPARISON_PAIRS = (
    ("with_skill", "without_skill"),
    ("new_skill", "old_skill"),
)
```

Ambiguous inputs should:

- fail clearly;
- require explicit selection; or
- follow a documented deterministic policy.

---

## 16. Look for Namespace / Reserved-Key Collisions

If synthetic data is inserted into the same namespace as discovered user/domain keys:

```python
summary["delta"] = ...
```

ask:

- [ ] Can a real item also be called `delta`?
- [ ] Can a configuration shadow metadata?
- [ ] Are keys such as `summary`, `metadata`, `default`, `all`, or `none` reserved?
- [ ] Should these concepts live in separate fields?

Either:

```text
separate namespaces
```

or:

```text
validate and reject reserved names
```

---

## 17. Validate Cartesian Coverage

When calculating "runs per configuration", "coverage", "completeness", or similar metrics, do not count only combinations that happen to exist.

If dimensions are:

```text
configuration × eval
```

the complete expected set is the Cartesian product.

Test missing combinations explicitly.

Example:

```text
A/eval-1 = 3
A/eval-2 = 3
B/eval-1 = 3
B/eval-2 = missing
```

must not be reported as:

```text
3 runs per configuration
```

### Cartesian coverage checklist

- [ ] Determine complete dimensions.
- [ ] Include zero/missing combinations.
- [ ] Distinguish "zero observations" from "not represented".
- [ ] Test incomplete matrices.

---

## 18. Audit Fallback Logic Field by Field

Avoid all-or-nothing fallback when data can come from multiple sources.

Bad:

```python
if duration_exists:
    return duration, None

return fallback_duration, fallback_tokens
```

Potentially better:

```text
duration = primary duration or fallback duration
tokens   = primary tokens   or fallback tokens
```

### Fallback checklist

- [ ] Identify each independently recoverable field.
- [ ] Establish source precedence.
- [ ] Do not discard valid fallback information just because another primary field exists.
- [ ] Confirm producer contracts before altering semantics.

---

## 19. Audit String Parsing

Avoid:

```python
name.split("-")[1]
```

when the expected grammar is stricter.

It may accept:

```text
run-2-extra
```

Prefer exact parsing using:

- `partition()`;
- regex;
- dedicated parser;
- validation of all segments.

Test:

```text
run-1
run-01
run-0
run--1
run-foo
run-1-extra
run
```

according to the intended contract.

---

## 20. Filesystem Robustness

Distinguish:

```python
path.exists()
path.is_file()
path.is_dir()
```

Use the strongest appropriate condition.

Check:

- [ ] expected input directory exists;
- [ ] it is actually a directory;
- [ ] fallback directories contain expected content;
- [ ] output parent exists or is created deliberately;
- [ ] permissions errors are controlled;
- [ ] file encodings are explicit.

Prefer:

```python
path.open(...)
```

when the project enables Ruff's `PTH` family.

Always specify:

```python
encoding="utf-8"
```

for text unless another encoding is intentional.

---

## 21. Error Handling

For every external operation ask:

```text
What failures are expected?
Should they stop the program?
Should they skip one item?
Should they warn?
```

Common expected exceptions:

```python
OSError
json.JSONDecodeError
ValueError
```

### Error-handling checklist

- [ ] Catch narrowly.
- [ ] Preserve useful error context.
- [ ] Do not catch `Exception` without a strong reason.
- [ ] Distinguish recoverable file-level failure from fatal program failure.
- [ ] Use non-zero CLI exit codes for fatal failures.

---

## 22. CLI Design

Prefer:

```python
def main() -> int:
    ...
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

Advantages:

- testable;
- predictable;
- clear exit semantics.

### CLI checklist

- [ ] `main()` return type.
- [ ] typed parsed arguments where beneficial.
- [ ] stderr for errors.
- [ ] stdout for intended normal output.
- [ ] non-zero exit code on failure.
- [ ] help output tested.
- [ ] invalid path tested.

---

## 23. Logging Versus `print()`

Do not blindly ban `print()` in CLI programs.

Use:

```text
stdout / print:
intended human CLI result

stderr / logging:
warnings and errors
```

### Logging checklist

- [ ] Warnings use logging or stderr.
- [ ] Errors use logging or stderr.
- [ ] Normal report output stays concise.
- [ ] Avoid auto-fixing `T201` if it would remove useful CLI output.

---

## 24. Datetime Practices

- [ ] Always use timezone-aware datetimes.
- [ ] Prefer `datetime.UTC` where the Python baseline supports it.
- [ ] Never use naive local timestamps for interchange formats unless explicitly required.
- [ ] Keep serialized timestamps unambiguous.

Example:

```python
from datetime import UTC, datetime

datetime.now(UTC)
```

---

## 25. TypedDict Discipline

For every `TypedDict`:

- [ ] required keys use `[]`;
- [ ] optional keys use `NotRequired`;
- [ ] do not use `.get()` merely to hide missing required fields;
- [ ] model nullability separately from missingness;
- [ ] avoid unioning structurally incompatible dictionaries unnecessarily.

If:

```python
field: int | None
```

the field exists but may contain `None`.

If:

```python
field: NotRequired[int]
```

the field may not exist.

These are different contracts.

---

## 26. Ruff Review Checklist

## First: use the repository configuration

Run:

```bash
ruff check path/to/file.py
ruff format --check path/to/file.py
```

Only after that consider additional families.

## Strong core

Typically consider:

```text
E4
E7
E9
F
I
UP
B
SIM
RUF
```

## Useful additions

Depending on repository policy:

```text
C4
PIE
PERF
```

## More opinionated / evaluate first

```text
ANN
ARG
DTZ
PTH
RET
TRY
PLC
PLE
PLW
```

### Ruff checklist

- [ ] Do not blindly enable `ALL`.
- [ ] Do not confuse style policy with correctness.
- [ ] Check Ruff Formatter compatibility.
- [ ] Review unsafe fixes before application.
- [ ] Run `ruff check --diff` or equivalent review before large auto-fixes.
- [ ] Re-run lint after formatting.

---

## 27. Ruff Formatter Compatibility

When Ruff Format is used, avoid conflicting rule sets.

Review conflicts involving families such as:

```text
W191
E111
E114
E117
D203
D206
D300
Q
COM812
COM819
ISC
```

depending on project configuration.

Principle:

> Formatter and linter should cooperate rather than continuously undoing each other.

---

## 28. Pyright / Pylance Checklist

Prefer strict checking for code expected to be highly typed.

Useful diagnostics include:

```text
reportUnknownArgumentType
reportUnknownMemberType
reportUnknownParameterType
reportUnknownVariableType
reportMissingTypeArgument
reportUnnecessaryCast
reportUnnecessaryTypeIgnoreComment
```

### Diagnostic checklist

Do not immediately patch the reported line.

Ask:

1. Where did uncertainty originate?
2. Is this one downstream symptom of a bad type model?
3. Can the source be validated earlier?
4. Can the union be eliminated?
5. Can a literal or domain type constrain the API?

Target:

```text
0 errors
0 unexplained warnings
0 broad ignores
```

---

## 29. TDD for Behaviour-Changing Repairs

For actual bugs:

## RED

- [ ] Write the smallest test exposing the defect.
- [ ] Run it.
- [ ] Confirm it fails for the expected reason.

## GREEN

- [ ] Implement the smallest correct repair.
- [ ] Run the test.
- [ ] Confirm it passes.
- [ ] Run existing tests.

## REFACTOR

- [ ] Improve names/structure.
- [ ] Keep tests green.

Do not claim a regression test exists unless the failure was observed before the fix.

---

## 30. Minimum Regression Test Matrix

For a filesystem/JSON aggregation script, adapt this reusable set.

## Inputs

- [ ] empty input directory;
- [ ] expected directory layout;
- [ ] legacy directory layout;
- [ ] malformed directory names;
- [ ] missing required file;
- [ ] unreadable file;
- [ ] invalid JSON;
- [ ] wrong JSON root type;
- [ ] missing required field;
- [ ] wrong field type;
- [ ] unexpected extra field.

## Numbers

- [ ] zero;
- [ ] negative values if invalid;
- [ ] integer-valued float;
- [ ] fractional float where integer required;
- [ ] `NaN`;
- [ ] `Infinity`;
- [ ] boundary values.

## Ordering

- [ ] `1`, `2`, `10`;
- [ ] mixed identifier types if supported;
- [ ] unordered filesystem discovery.

## Aggregation

- [ ] no configurations;
- [ ] one configuration;
- [ ] correct comparison pair;
- [ ] multiple possible pairs;
- [ ] unknown configuration;
- [ ] incomplete Cartesian coverage;
- [ ] equal run counts;
- [ ] unequal run counts.

## Rendering

- [ ] no delta;
- [ ] positive delta;
- [ ] negative delta;
- [ ] missing token data;
- [ ] optional notes absent;
- [ ] optional notes present;
- [ ] variable run count.

## CLI

- [ ] `--help`;
- [ ] missing directory;
- [ ] file supplied instead of directory;
- [ ] unwritable output;
- [ ] successful end-to-end generation;
- [ ] expected exit code.

---

## 31. Inspect Generated Output, Not Just Tests

After tests pass:

- [ ] run a real sample;
- [ ] inspect generated JSON;
- [ ] inspect generated Markdown/text;
- [ ] verify units;
- [ ] verify field names;
- [ ] verify ordering;
- [ ] verify null/absence handling;
- [ ] verify timestamp format;
- [ ] verify no `NaN` or `Infinity`;
- [ ] compare to previous output for unintended schema differences.

Tests can miss ugly or confusing human-facing output.

---

## 32. Verification Before Completion

Before claiming the work is finished, run fresh checks.

## Syntax

```bash
python -m compileall -q path/to/code.py
```

## Ruff

```bash
ruff check path/to/code.py
```

## Formatting

```bash
ruff format --check path/to/code.py
```

## Pyright

```bash
pyright path/to/code.py
```

## Tests

```bash
pytest -q
```

## CLI smoke test

```bash
python path/to/code.py --help
```

and at least one successful end-to-end execution.

### Evidence rules

Do not say:

```text
Ruff clean
Pyright clean
tests pass
```

because another tool passed.

Each claim requires its own evidence.

---

## 33. Final Static Sanity Search

Before handoff, search for leftovers:

```text
Any
cast(
type: ignore
TODO
FIXME
open(
timezone.utc
sys.exit(
except Exception
dict[
list[
```

Not every occurrence is wrong.

The purpose is to inspect each deliberately.

Also inspect:

- [ ] missing return annotations;
- [ ] unparameterized collections;
- [ ] unused imports;
- [ ] dead helpers;
- [ ] duplicate validation logic;
- [ ] comments that no longer match code.

---

## 34. Final Quality Gates

Do not declare production-ready unless applicable gates are satisfied.

## Correctness

- [ ] Known defects have regression tests.
- [ ] Edge cases are covered.
- [ ] Missing values are not fabricated.
- [ ] Units are internally consistent.
- [ ] ordering is deterministic.
- [ ] ambiguity is rejected or explicitly resolved.

## Typing

- [ ] No unresolved Pylance/Pyright errors.
- [ ] No unexplained `Any`.
- [ ] No unexplained `Unknown`.
- [ ] No unnecessary casts.
- [ ] No broad type ignores.
- [ ] external inputs are validated.

## Ruff gate

- [ ] `ruff check` passes against repository policy.
- [ ] `ruff format --check` passes.
- [ ] no unsafe automated fixes were accepted blindly.

## Runtime

- [ ] `compileall` passes.
- [ ] tests pass.
- [ ] CLI smoke test passes.
- [ ] representative end-to-end fixture passes.
- [ ] generated outputs inspected.

## Compatibility

- [ ] Public/schema changes identified.
- [ ] unintended schema changes absent.
- [ ] downstream consumers considered.
- [ ] minimum Python version respected.

---

## 35. Review Reporting Template

Use this format for the final review.

## Executive Summary

```text
Overall status:
Python baseline:
Syntax:
Ruff:
Pyright:
Tests:
Breaking changes:
```

## Findings

For each issue:

```text
ID:
Priority: P0 / P1 / P2
Classification:
  Verified defect /
  Statically confirmed /
  Conditional Ruff finding /
  Recommendation

Location:
Problem:
Impact:
Root cause:
Recommended change:
Compatibility impact:
Test required:
Verification:
```

## Example

```text
ID: PY-001
Priority: P0
Classification: Verified defect

Problem:
Mixed summary types cause 49 downstream Pylance diagnostics.

Root cause:
ConfigSummary and DeltaSummary are stored behind arbitrary string keys.

Impact:
Static type checker cannot safely determine nested member types.

Fix:
Separate the structures or introduce a validated compatibility layer.

Compatibility:
Schema-breaking if the serialized structure changes.

Test:
Verify both config and delta rendering.

Verification:
pyright aggregate_benchmark.py → 0 errors
```

---

## 36. Priority Definitions

## P0 — Must fix

Use for:

- incorrect results;
- crashes;
- data corruption;
- type architecture producing widespread uncertainty;
- fabricated statistics;
- ambiguous comparison semantics;
- broken serialization;
- unsafe input handling.

## P1 — Should fix

Use for:

- incomplete validation;
- weak typing;
- inconsistent error handling;
- poor deterministic behaviour;
- maintainability risks;
- unclear domain modelling.

## P2 — Improve

Use for:

- modern syntax;
- optional lint families;
- readability improvements;
- logging improvements;
- nonessential refactors.

Do not inflate style preferences into P0 defects.

---

## 37. Lessons Learned From the Benchmark Remediation

## Lesson 1 — Diagnostic volume is not defect count

Forty-nine Pylance errors came largely from one modelling problem.

Always trace uncertainty upstream before patching individual warnings.

## Lesson 2 — Static typing can expose design defects

The type checker was correctly signalling that:

```text
one arbitrary dictionary key might contain Stats
or strings
```

The solution was better modelling, not suppression.

## Lesson 3 — Missing data is not zero

Using an empty zero-valued baseline created a mathematically valid but semantically false comparison.

Represent absence explicitly.

## Lesson 4 — Correct types can still produce incorrect business logic

The first-two-configurations approach could be perfectly typed and still compare the wrong entities.

Type safety and semantic correctness are different review dimensions.

## Lesson 5 — Edge cases hide in aggregation

The missing configuration/evaluation combination was not visible from simple run counts.

Always test incomplete matrices.

## Lesson 6 — String sorting is often wrong for numbered entities

Filesystem names require semantic sort keys when embedded numbers matter.

## Lesson 7 — Presentation units must be audited independently

A stored ratio and displayed percentage can make delta representation misleading even when all calculations are mathematically correct.

## Lesson 8 — Input validation belongs at boundaries

The rest of the program becomes simpler when malformed JSON is dealt with once rather than repeatedly guarded downstream.

## Lesson 9 — Avoid replacing `Any` with a different vague type everywhere

Recursive JSON aliases are useful at the ingestion layer.

Domain logic should use domain-specific models.

## Lesson 10 — Do not overstate tooling evidence

If Ruff was not run, say so.

If Pyright was not run, say so.

A rigorous report loses credibility when predictions are presented as executed findings.

## Lesson 11 — Version awareness comes before modernisation

Features such as `TypeIs`, modern `type` aliases, or newer standard-library APIs are only good recommendations if the supported Python floor permits them.

## Lesson 12 — Compatibility matters during "cleanup"

The technically cleanest model may break serialized consumers.

Separate:

```text
ideal architecture
```

from:

```text
safe current remediation
```

## Lesson 13 — Linters are policy tools as well as correctness tools

Do not treat every Ruff family as universally mandatory.

Separate:

```text
core correctness
recommended quality
repository preference
```

## Lesson 14 — Regression tests should come from review findings

Every meaningful defect discovered during a review should ask:

> What test would have prevented this?

That converts one-time analysis into durable protection.

## Lesson 15 — Completion requires evidence

The final state is not:

```text
I changed the code.
```

It is:

```text
I changed the code
+ reproduced the original defects
+ proved the fixes
+ reran static checks
+ reran tests
+ inspected real output.
```

---

## 38. Compact "Next Time" Workflow

For day-to-day use, follow this sequence:

```text
1. Establish Python/tooling baseline
2. Capture existing diagnostics
3. Compile before touching code
4. Group diagnostics by root cause
5. Model external data boundaries
6. Audit domain types and unions
7. Find semantic/runtime defects
8. Check compatibility constraints
9. Write regression tests for real defects
10. Confirm tests fail
11. Apply smallest justified fixes
12. Re-run tests
13. Refactor while green
14. Run Ruff
15. Run Ruff format check
16. Run Pyright/Pylance
17. Run full tests
18. Run CLI/end-to-end smoke test
19. Inspect generated artifacts
20. Recheck schema compatibility
21. Search for Any/casts/ignores/TODOs
22. Report verified results only
```

---

## 39. Definition of Gold

A Python remediation should receive a **Gold / >96 quality score** only when:

- correctness defects have been investigated beyond lint output;
- material defects have regression tests;
- the type model accurately represents the domain;
- external input is validated;
- zero/absence semantics are deliberate;
- aggregation is deterministic;
- numerical units are coherent;
- the supported Python version is respected;
- compatibility impacts are understood;
- Ruff is actually executed;
- Pyright is actually executed;
- tests are actually executed;
- generated outputs are inspected;
- remaining exceptions or suppressions are documented.

A clean linter result alone is **not** Gold.

A clean type checker alone is **not** Gold.

Passing tests alone are **not** Gold.

Gold requires all three plus semantic review.
