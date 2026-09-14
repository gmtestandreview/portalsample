# Ruff, Pyright, static analysis, and verification

Load this reference when the task includes Ruff, Pyright/Pylance, mypy, supplied Sonar/SonarLint diagnostics, lint/type remediation, regression proof, or completion verification.

## Evidence rules

Never present a predicted diagnostic as executed output.

Do not claim:

- Ruff clean unless Ruff was run successfully;
- Pyright/Pylance or mypy clean unless that checker was run successfully;
- Sonar/SonarLint clean unless the applicable analyzer was run successfully or direct supplied results support the claim;
- tests pass without a fresh successful test run;
- a regression test exists unless the defect was actually represented by that test.

If a tool is unavailable, report that explicitly.

## Ruff

Read repository Ruff configuration first.

Strongly relevant families often include:
`E4`, `E7`, `E9`, `F`, `I`, `UP`, `B`, `SIM`, `RUF`.

Potential additions depending on policy:
`C4`, `PIE`, `PERF`.

Evaluate rather than universally mandate more opinionated families:
`ANN`, `ARG`, `DTZ`, `PTH`, `RET`, `TRY`, `PLC`, `PLE`, `PLW`.

Do not enable `ALL` without strong justification. Check formatter/linter conflicts and review unsafe fixes before applying them.

## Pyright / Pylance

Trace uncertainty upstream before patching the reported line.

Useful strict diagnostics include:

- `reportUnknownArgumentType`
- `reportUnknownMemberType`
- `reportUnknownParameterType`
- `reportUnknownVariableType`
- `reportMissingTypeArgument`
- `reportUnnecessaryCast`
- `reportUnnecessaryTypeIgnoreComment`

Target zero unexplained errors/warnings, zero broad ignores, and minimal justified casts.

## Behavior-changing repair

When execution is available:

### RED

1. Add or run the smallest test exposing the defect.
2. Confirm failure for the expected reason.

### GREEN

1. Apply the smallest correct repair.
2. Confirm the targeted test passes.
3. Run relevant existing tests.

### REFACTOR

1. Improve structure only as justified.
2. Keep tests green.

If RED cannot be demonstrated, do not claim a regression was reproduced.

## Fresh verification

Run only applicable checks available in the repository/environment, for example:

```bash
python -m compileall -q <path>
ruff check <path>
ruff format --check <path>
pyright <path>
pytest -q
```

For CLI/report generators also consider:

- `--help`;
- one successful end-to-end run;
- generated JSON/Markdown/text inspection;
- field names, ordering, units, absence/null handling, timestamps, and strict JSON values.

## Static sanity search

Inspect rather than automatically remove:

- `Any`
- `cast(`
- `type: ignore`
- `TODO`
- `FIXME`
- `except Exception`
- `open(`
- `timezone.utc`
- `sys.exit(`

Also inspect missing return annotations, unparameterized collections, unused imports, dead helpers, duplicate validation logic, and stale comments.

## Completion gates

Do not call remediation complete unless applicable gates are evidenced:

- known material defects have regression protection;
- missing values are not fabricated;
- units and ordering are deliberate;
- external input is validated;
- no unresolved type-checker errors relevant to target policy;
- Ruff and formatter checks pass when required by project policy;
- runtime/tests/smoke checks pass when required and available;
- compatibility impact is understood;
- supported Python floor is respected.

A clean linter, clean type checker, or passing tests alone is not sufficient proof of semantic correctness.

## Other supplied static-analysis diagnostics

For mypy, Sonar/SonarLint, or another checker:

- read the supplied configuration and exact diagnostic before recommending policy changes;
- explain the root cause rather than translating a Pyright- or Ruff-specific rule mechanically;
- distinguish checker policy/style findings from correctness defects;
- apply the smallest behavior-preserving repair when appropriate;
- do not claim the checker is clean unless that checker was actually executed successfully.

Pyright-specific diagnostic names in this reference are examples for Pyright/Pylance only; they are not universal static-analysis settings.
