# JSON Schemas

This reference is the human-readable index for skill-creator JSON contracts.

The canonical machine-readable definitions live in
`references/schemas/*.schema.json`. Do not duplicate full schema definitions in
this document. Update the JSON Schema file first, then update this index only
when semantics, locations, producers, consumers, or compatibility rules change.

All schema files use JSON Schema Draft 2020-12.

## Why the schemas are split

Keep one schema per persisted artifact so that:

- validation can run directly against the artifact being read or written;
- producers and consumers can share the same contract;
- a change to one artifact does not require editing a large monolithic document;
- schema diffs remain small and reviewable;
- tests can validate examples and malformed fixtures automatically;
- compatibility-breaking changes can be versioned deliberately.

Shared definitions live in `schemas/common.schema.json`.

## Canonical layout

```text
references/
├── schemas.md
└── schemas/
    ├── common.schema.json
    ├── evals.schema.json
    ├── eval-metadata.schema.json
    ├── history.schema.json
    ├── grading.schema.json
    ├── metrics.schema.json
    ├── timing.schema.json
    ├── benchmark.schema.json
    ├── comparison.schema.json
    ├── analysis.schema.json
    └── feedback.schema.json
```

## Global evidence semantics

These rules apply across all artifacts.

1. **Missing is not zero.** Omit an optional metric when it was not observed. A
   numeric `0` means an actual observed zero.
2. **Do not invent `null` as a generic missing-value convention.** Use `null`
   only where the relevant schema explicitly permits it.
3. **Observed metrics keep their original units.** Do not convert character
   counts into token counts or infer timing from unrelated values.
4. **Fields are independently recoverable.** Preserve a valid field even when
   another optional field is absent.
5. **Persisted evidence is immutable.** Do not rewrite old run artifacts to
   match a newer contract. Create a new run or iteration when the evaluation
   contract changes materially.
6. **Strict JSON only.** Reject non-finite numeric values such as `NaN` and
   `Infinity`.
7. **Semantic validation still matters.** JSON Schema validates shape and local
   constraints; cross-file and derived invariants listed below require
   application-level checks.

## Schema catalog

| Persisted artifact               | Canonical schema                    | Producer             | Primary consumers         |
| -------------------------------- | ----------------------------------- | -------------------- | ------------------------- |
| `evals/evals.json`               | `schemas/evals.schema.json`         | author/eval setup    | executor, metadata setup  |
| `<eval-dir>/eval_metadata.json`  | `schemas/eval-metadata.schema.json` | workspace setup      | grader, viewer, benchmark |
| `<workspace>/history.json`       | `schemas/history.schema.json`       | iteration controller | improve mode, reporting   |
| `<run-dir>/grading.json`         | `schemas/grading.schema.json`       | grader               | benchmark, viewer         |
| `<run-dir>/outputs/metrics.json` | `schemas/metrics.schema.json`       | executor             | grader, benchmark         |
| `<run-dir>/timing.json`          | `schemas/timing.schema.json`        | runtime/executor     | grader, benchmark         |
| `benchmark.json`                 | `schemas/benchmark.schema.json`     | benchmark aggregator | viewer, analyzer          |
| `comparison-N.json`              | `schemas/comparison.schema.json`    | blind comparator     | post-hoc analyzer         |
| `analysis.json`                  | `schemas/analysis.schema.json`      | post-hoc analyzer    | human review/iteration    |
| `feedback.json`                  | `schemas/feedback.schema.json`      | review viewer        | feedback interpretation   |

## `evals.json`

**Location:** `evals/evals.json`  
**Schema:** `schemas/evals.schema.json`

Defines the frozen representative eval set for an iteration.

Important semantic rules:

- `skill_name` must match the skill frontmatter.
- `evals[].id` must be unique across the file.
- `files` are relative to the skill root unless another contract explicitly says
  otherwise.
- `expectations` contain only objectively verifiable statements.
- a materially revised prompt or expected outcome creates a revised eval
  contract; do not silently reinterpret previously produced evidence.

The JSON Schema validates individual IDs but cannot enforce uniqueness of the
`id` property across separate objects; validate that semantically.

## `eval_metadata.json`

**Location:** `<eval-dir>/eval_metadata.json`  
**Schema:** `schemas/eval-metadata.schema.json`

Binds workspace evidence to the exact eval contract.

Rules:

- copy `eval_id`, `prompt`, and `expectations` from the authoritative eval
  definition;
- keep `eval_name` descriptive only; it must not become a second source of
  requirements;
- never store grading decisions, timing, outputs, or inferred success here;
- once run evidence exists, treat this metadata as immutable.

## `history.json`

**Location:** workspace root  
**Schema:** `schemas/history.schema.json`

Tracks iteration lineage.

Rules:

- `version` identifiers must be unique;
- every non-null `parent` must identify a preserved predecessor;
- `expectation_pass_rate` is optional because unavailable grading evidence is
  not zero;
- `grading_result: "unavailable"` may be used when comparison evidence is
  unavailable;
- exactly one iteration should be marked `is_current_best: true` when
  `current_best` is non-null;
- `current_best` must name that same version.

Those lineage constraints require semantic validation.

## `grading.json`

**Location:** `<run-dir>/grading.json`  
**Schema:** `schemas/grading.schema.json`

Contains run-level expectation verdicts.

The stable expectation fields are exactly:

```json
{
  "text": "The output includes X",
  "passed": true,
  "evidence": "Observed in ..."
}
```

Rules:

- preserve the original expectation text;
- PASS requires affirmative evidence;
- `summary.passed + summary.failed == summary.total`;
- `summary.total == expectations.length`;
- `pass_rate` must equal `passed / total` when `total > 0`;
- optional `execution_metrics` and `timing` appear only when those observations
  exist;
- claim `verified: null` means the claim could not be verified from available
  evidence;
- eval-design criticism belongs in `eval_feedback`, not by rewriting frozen
  verdicts.

The arithmetic relations require semantic validation.

## `metrics.json`

**Location:** `<run-dir>/outputs/metrics.json`  
**Schema:** `schemas/metrics.schema.json`

Contains only executor-observed counts and sizes.

All fields are optional because runtimes expose different evidence. If the
artifact is written, it must contain at least one observed metric.

Rules:

- omitted means unavailable;
- `0` means observed zero;
- `output_chars` and `transcript_chars` are character counts only;
- never use either character count as a token proxy;
- `total_tool_calls`, when present, should equal the sum of `tool_calls`;
- `files_created` lists artifacts actually created by this run.

## `timing.json`

**Location:** `<run-dir>/timing.json`  
**Schema:** `schemas/timing.schema.json`

Contains only runtime-observed token and timing data.

Each field is independently optional. Write this artifact only when at least one
timing/token observation exists.

Rules:

- preserve milliseconds and seconds exactly as their names specify;
- `total_tokens` is an observed token count, never a character estimate;
- do not generate `0` when a runtime omitted a metric;
- when start/end timestamps and a duration are all present, validate their
  consistency within the runtime's measurement precision.

## `benchmark.json`

**Location:** iteration/benchmark output directory  
**Schema:** `schemas/benchmark.schema.json`

Aggregates valid run-level grading and execution evidence.

The current flattened `run_summary` shape remains supported for compatibility.

Important changes from the previous prose-only contract:

- per-run `time_seconds`, `tokens`, `tool_calls`, and `errors` are optional;
- absent measurements stay absent;
- a valid benchmark contains at least one run;
- configuration names are restricted to the supported comparison identities;
- `metadata.comparison_pair` is supported and recommended for explicit
  candidate/baseline identity;
- configuration summary metrics may be omitted when no observations exist;
- `tokens: null` remains accepted in summaries for compatibility with the
  existing aggregator, but new producers should prefer omission when a metric is
  unavailable.

Semantic checks required in code:

- candidate/baseline must be one supported pair: `with_skill`/`without_skill` or
  `new_skill`/`old_skill`;
- reject ambiguous mixed pairs;
- every run's `passed + failed == total`;
- run `pass_rate` must match its counts;
- `runs_per_configuration` is an integer only when every expected configuration
  × eval combination has the same positive run count; otherwise it is `null`;
- natural run order is numeric (`1`, `2`, `10`), not lexical (`1`, `10`, `2`);
- summaries are calculated only from present observations;
- do not synthesize an empty configuration summary;
- do not emit a numeric delta when either side lacks the corresponding observed
  metric;
- pass-rate display deltas must use a clearly documented unit and remain
  consistent across JSON and Markdown.

## `comparison.json`

**Location:** `<grading-dir>/comparison-N.json`  
**Schema:** `schemas/comparison.schema.json`

Stores blind comparator output.

Rules:

- candidate identity must remain hidden while the comparison is performed;
- `A` and `B` must map to fixed outputs for the entire comparison;
- expectation results support the quality judgment but do not replace
  qualitative comparison;
- scores describe the comparator's rubric result; they are not execution
  measurements.

If tie support is introduced later, update the comparator and schema together as
a deliberate schema change rather than silently emitting a new winner value.

## `analysis.json`

**Location:** `<grading-dir>/analysis.json`  
**Schema:** `schemas/analysis.schema.json`

Stores post-hoc analysis after the comparison has been unblinded.

Rules:

- analysis must be grounded in the comparison result, skills, and transcripts;
- distinguish observed execution differences from inferred causes;
- suggestions are recommendations, not proof that a proposed change will improve
  future runs;
- any retained revision must still pass the iteration workflow and regression
  checks.

## `feedback.json`

**Location:** iteration workspace  
**Schema:** `schemas/feedback.schema.json`

Stores explicit human review feedback.

Current viewer-compatible shape:

```json
{
  "reviews": [
    {
      "run_id": "eval-1-with_skill-run-1",
      "feedback": "",
      "timestamp": "2026-09-16T07:00:00Z"
    }
  ],
  "status": "complete"
}
```

Rules:

- empty or whitespace-only `feedback` means **no comment**, not approval;
- `status: "complete"` means the review was submitted, not that blank entries
  passed;
- `run_id` must resolve to exactly one run;
- current and previous-iteration feedback must remain distinguishable;
- consumers should trim feedback before deciding whether it is substantive.

## Validation

Validate artifacts at every external JSON boundary, before converting them into
internal domain models.

Example with Python's `jsonschema` package:

```python
import json
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

schema_dir = Path("references/schemas")
schema = json.loads((schema_dir / "evals.schema.json").read_text(encoding="utf-8"))
instance = json.loads(Path("evals/evals.json").read_text(encoding="utf-8"))

registry = Registry()
for path in schema_dir.glob("*.schema.json"):
    resource_data = json.loads(path.read_text(encoding="utf-8"))
    registry = registry.with_resource(
        resource_data["$id"],
        Resource.from_contents(resource_data),
    )

Draft202012Validator(schema, registry=registry).validate(instance)
```

Validation failures are controlled input errors. Do not silently coerce
malformed fields to defaults such as `0`, `false`, `{}`, or `[]` unless the
artifact contract explicitly defines that fallback.

## Versioning and compatibility

Treat persisted JSON as an interface.

- **Patch change:** wording/description change only; accepted payloads are
  unchanged.
- **Minor change:** additive optional field or relaxed validation that preserves
  existing valid payloads.
- **Major change:** required field, renamed/removed field, changed meaning/unit,
  changed enum, or incompatible structure.

For a major change:

1. add a new versioned schema or migration path;
2. identify all producers and consumers;
3. preserve existing evidence rather than rewriting it in place;
4. differential-test old and new readers/writers on representative fixtures;
5. update `schemas.md`, schema tests, scripts, viewer, grader/analyzer agents,
   and examples together.

## Required semantic validator coverage

JSON Schema is intentionally not the only validation layer. Add regression tests
for:

- duplicate eval IDs;
- stale or mismatched eval metadata;
- grading arithmetic mismatches;
- observed zero versus missing metric;
- invalid/non-finite numeric input;
- timing field independence;
- unsupported or ambiguous comparison pairs;
- no/one/both comparison configurations;
- incomplete configuration × eval matrices;
- variable run counts;
- `run-1`, `run-2`, `run-10` natural ordering;
- pass-rate and time/token delta units;
- blank feedback versus explicit feedback;
- duplicate/colliding `run_id` values;
- current versus previous-iteration feedback;
- schema-valid payloads that are semantically inconsistent across files.
