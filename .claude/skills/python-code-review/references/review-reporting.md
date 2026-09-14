# Python review reporting

Load this reference when the user wants a formal review report or when material defects need regression planning.

## Minimum regression matrix

Adapt only relevant cases.

### Inputs and boundaries

- empty input;
- expected and legacy layouts;
- malformed names;
- missing/unreadable files;
- invalid JSON;
- wrong root type;
- missing/wrong fields;
- unexpected extra fields where contract matters.

### Numbers

- zero;
- invalid negatives;
- integer-valued float;
- fractional float where integer required;
- `NaN`/infinity;
- boundary values.

### Ordering and aggregation

- `1`, `2`, `10`;
- unordered discovery;
- no/one/multiple configurations;
- ambiguous comparison pairs;
- incomplete combinations;
- equal and unequal run counts.

### Rendering and CLI

- no/positive/negative delta;
- missing optional data;
- variable run count;
- `--help`;
- missing/wrong path type;
- unwritable output;
- successful end-to-end generation and expected exit code.

## Findings format

For each material finding report:

- **ID**
- **Priority:** P0 / P1 / P2
- **Classification:** Verified defect / Statically confirmed defect / Conditional lint finding / Recommendation
- **Location**
- **Problem**
- **Impact**
- **Root cause**
- **Recommended change**
- **Compatibility impact**
- **Regression test**
- **Verification method**

Group diagnostics that share one root cause instead of counting every downstream message as an independent defect.

## Verification summary

Report only executed checks, for example:

```text
Python baseline: 3.x
compileall: PASS
Ruff: NOT AVAILABLE
Pyright: NOT AVAILABLE
pytest: PASS — 18/18
CLI smoke test: PASS
Breaking changes: none identified
```

## Final assessment

Use evidence-backed language:

- **Red** — unsafe/not ready based on demonstrated blockers.
- **Amber** — usable but material remediation or evidence remains.
- **Green** — production-ready only when required checks and representative behavior are actually evidenced.

Do not award Green from source inspection alone.
