# Ruff, Pyright, static analysis, Sonar, and verification

Load this reference when the task includes Ruff, Pyright/Pylance, mypy,
Sonar/SonarLint diagnostics, lint/type remediation, regression proof, or
completion verification.

## Diagnostic provenance gate

Before fixing a supplied diagnostic, verify as much as available:

- exact artifact/path and revision/copy;
- line/function still corresponding to the current artifact;
- analyzer and rule/diagnostic identifier;
- analyzer version and repository configuration/profile;
- timestamp/freshness or evidence that the result applies to the current
  artifact.

Do not spend remediation effort on a stale diagnostic without first confirming
it still applies.

A supplied diagnostic is valid evidence that the analyzer reported a finding for
the identified artifact/run. It is **not** fresh proof that the final artifact
is clean.

## Evidence rules

Never present a predicted diagnostic as executed output.

Do not claim:

- Ruff clean unless Ruff was run successfully against the final artifact;
- Pyright/Pylance or mypy clean unless that checker was run successfully against
  the final artifact;
- Sonar/SonarLint clean unless the applicable analyzer/profile was freshly run
  successfully, or explicitly report only what a supplied run demonstrates;
- tests pass without a fresh successful test run;
- a regression test exists unless the defect is actually represented by that
  test;
- a heuristic/proxy metric proves a specific analyzer rule.

If a required tool is unavailable, report that explicitly and classify the
missing evidence accordingly.

## Analyzer order

Analyzer cleanup comes after baseline, interfaces/data model, semantic
correctness, external-data/sink boundaries, filesystem/security, and determinism
review. After analyzer cleanup, still run compatibility differential and
adversarial pressure checks.

Analyzer findings are leads/evidence, not substitutes for semantic review.

## Ruff

Read repository Ruff configuration first.

Strongly relevant families often include: `E4`, `E7`, `E9`, `F`, `I`, `UP`, `B`,
`SIM`, `RUF`.

Potential additions depending on policy: `C4`, `PIE`, `PERF`.

Evaluate rather than universally mandate more opinionated families: `ANN`,
`ARG`, `DTZ`, `PTH`, `RET`, `TRY`, `PLC`, `PLE`, `PLW`.

Do not enable `ALL` without strong justification. Check formatter/linter
conflicts. Treat auto-fix safety separately from rule severity; preserve a
checkpoint and review broad/unsafe fixes.

## Pyright / Pylance / mypy

Trace uncertainty upstream before patching the reported line.

Useful Pyright strict diagnostics include:

- `reportUnknownArgumentType`
- `reportUnknownMemberType`
- `reportUnknownParameterType`
- `reportUnknownVariableType`
- `reportMissingTypeArgument`
- `reportUnnecessaryCast`
- `reportUnnecessaryTypeIgnoreComment`

Target zero unexplained errors/warnings under the project's required policy,
zero broad ignores, and minimal justified casts.

Do not mechanically translate Pyright diagnostic names into mypy policy. A
constant extraction can change type-checker precision; preserve
literal-key/value information with `Literal`, `Final`, typed constants, or
another project-compatible form when needed.

## Sonar / SonarLint

When version-specific behavior matters, use the exact rule
implementation/profile that produced the diagnostic rather than assuming the
newest documentation matches.

The lessons source preserved this Sonar Python rule-tree snapshot from a prior
review:
`https://github.com/SonarSource/sonar-python/tree/a81cfec726749d14c705d4bbf1b301665e25f72e/python-checks/src/main/resources/org/sonar/l10n/py/rules/python`

Use that snapshot only when it actually matches the supplied diagnostic context;
otherwise use the supplied/current analyzer evidence.

Additional rules:

- Treat **Security Hotspots** as items requiring contextual review, not
  automatically as vulnerabilities.
- For duplicate-literal findings such as S1192, inspect all occurrences and
  extract a constant only when the occurrences represent the same concept.
- Complexity metrics and homemade proxies may help locate code to inspect, but
  do not prove Sonar S3776 or another configured threshold.
- Reduce genuine complexity structurally (clearer responsibilities, control
  flow, or extracted cohesive operations), not by cosmetic rewrites that only
  game a metric.
- If a Sonar threshold/profile is configurable and unavailable, classify the
  conclusion as configuration-dependent rather than claiming pass/fail.
- Before an available Sonar run, a conservative static pre-scan may identify
  likely locations worth inspecting so obvious issues are addressed efficiently.
  It is **not a Sonar run** and must not suppress or replace the actual scan.

## Behavior-changing repair

When execution is available:

### RED

1. Add/run the smallest test exposing the defect.
2. Confirm failure for the expected reason and record the exact artifact.

### GREEN

1. Apply the smallest correct repair.
2. Rerun the original failing case first.
3. Confirm targeted and relevant existing tests pass.

### REFACTOR

1. Improve structure only as justified.
2. Keep behavior, compatibility, and tests stable.

If RED cannot be demonstrated, do not claim a regression was reproduced.

## Fresh verification

Rerun the **exact analyzer(s) that originally failed** when available, plus
other applicable repository checks, for example:

```bash
python -m compileall -q <path>
ruff check <path>
ruff format --check <path>
pyright <path>
pytest -q
```

Also consider project-specific mypy/Sonar commands, CLI `--help`, representative
end-to-end execution, and generated-output inspection.

Record versions/configuration when they materially affect reproducibility.

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
- `shell=True`
- manual YAML/JSON/HTML/config string construction
- path joins using untrusted values
- generated identifiers derived from filenames/order

Also inspect missing annotations, unparameterized collections, dead helpers,
duplicate validation, stale comments, and optional pipes/resources passed into
callbacks.

## Completion gates

Do not call analyzer remediation or the overall review complete unless
applicable evidence shows:

- known material defects have regression protection;
- missing values are not fabricated;
- external input and sink boundaries are validated;
- units, ordering, and generated identity are deliberate;
- no unresolved type-checker errors relevant to required policy;
- required Ruff/formatter/static analyzer checks pass freshly;
- runtime/tests/smoke/pressure checks pass when required and available;
- compatibility impact is understood and differentials are acceptable;
- supported Python floor is respected;
- the report names the final artifact that was verified.

A clean linter, clean type checker, or passing tests alone is not proof of
semantic correctness.

## Iteration limit

For autonomous remediation, use at most three fix-and-verify cycles unless the
user explicitly authorizes more. Do not inherit a PASS from a prior cycle after
code changes; fresh evidence is required.
