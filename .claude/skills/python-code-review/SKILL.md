---
name: python-code-review
description: >-
  Use for Python coding tasks: writing, debugging, reviewing, auditing,
  refactoring, optimizing, testing, hardening, and remediating correctness,
  typing, Ruff/Pyright/mypy/Sonar diagnostics, external-data/security, async,
  performance, determinism, or compatibility risks. Activate for substantive
  Python work, not incidental mentions of Python, the animal, prose-only edits,
  or unrelated-language work. Use a focused path for ordinary coding; apply the
  full evidence-led workflow only for review, audit, hardening, or broad
  remediation.
---

# Python Code Review

Use one focused path for Python implementation, debugging, review, and
remediation. Respect the project's supported Python version, conventions,
dependencies, public contracts, requested scope, and execution permissions.

## Choose the task path

- **Write / isolated feature:** establish contracts, supported version, errors,
  and edge cases; implement the smallest clear solution and appropriate tests.
- **Debug a local failure:** reproduce from available evidence, isolate the
  condition, correct the cause, and add a focused regression case when practical.
- **Review / audit / harden / broad remediation:** follow the review order and
  evidence boundary below; include root cause, safety, compatibility, and fresh
  verification.
- **Refactor / optimize:** preserve behavior, APIs, and observable output unless
  change is authorized. Measure/profile first when performance motivates change.
- **Testing-only / explanation:** answer the Python question or write focused
  tests; do not imply a complete quality audit.

Across paths prioritize correctness/security, resource safety, testability,
maintainable types/interfaces, measured performance, then style. Ask only for
details essential to correctness; otherwise state assumptions. For specialist
domains, cover Python-specific issues and compose with narrower guidance when
available.

## Evidence boundary

Classify material findings as:

- **Verified defect** — demonstrated by source plus executed behavior/test/tool
  evidence, or a supplied diagnostic with confirmed artifact and provenance.
- **Statically confirmed defect** — clearly incorrect from inspection but not
  exercised.
- **Conditional analyzer finding** — depends on checker/rule/config/version or a
  supplied diagnostic.
- **Recommendation** — improvement rather than an existing failure.

Never claim analyzer, test, build, runtime, or regression success unless it was
freshly executed against the reported artifact. Supplied diagnostics prove only
their identified run, not final cleanliness.

## Type-check gate for structural edits

When a refactor adds or changes typed helpers, annotations, return types, or
container narrowing, load
[analyzer verification](references/ruff-pyright-verification.md) and run the
applicable type checker before editing and after the final change. This gate
also applies to narrow Sonar/Ruff fixes and behavior-preserving extractions,
even when the original diagnostic is not a type error.

Resolve newly introduced type diagnostics before reporting the repair complete.
Ruff, compilation, behavioral tests, and code review do not replace this check.
Record the checker/version, mode/rules, target paths, actual file count, and
result. If execution is unavailable, report the type check as unverified and the
remediation as AMBER; do not silently omit the gate or weaken project rules.

## Required review order

For review, hardening, or broad remediation, skip a step only when genuinely
inapplicable:

1. **Freeze provenance.** Identify exact artifact/copy and Python floor. For
   supplied diagnostics, use the
   [analyzer evidence record](references/ruff-pyright-verification.md). Preserve
   read-only originals and identify any derived copy.
2. **Establish baseline.** Read repository/CI/test/analyzer configuration,
   capture supplied diagnostics, and run available existing checks before
   behavior-changing remediation.
3. **Map interfaces/data model.** Identify APIs, CLI contracts, schemas,
   consumers, invariants, fallback precedence, and compatibility constraints.
4. **Review semantics first.** Check missing vs zero/`None`, numeric coercion and
   non-finite values, units, ordering, aggregation completeness, independent
   fallback fields, parsing/errors, async cancellation/timeouts, and cleanup.
5. **Trace untrusted values through every sink.** Validate type/shape/range/name/
   length/missingness, then trace filesystem, serialization/config, subprocess,
   logs, mapping keys, IDs, HTML/API identifiers, and filenames separately.
6. **Review filesystem/security boundaries.** Resolve and constrain influenced
   paths; consider symlinks, traversal, separators, control characters,
   serialization injection, and platform-sensitive names.
7. **Review determinism/identity.** Pressure-test `1/2/10` ordering, unordered
   discovery, completion order, stable IDs, collisions, and `a-b` versus `a/b`
   when externally visible.
8. **Fix models before diagnostics.** Trace `Any`/`Unknown`, heterogeneous
   mappings, inaccurate optionality, magic discriminators, unsafe narrowing,
   repeated I/O, and data-volume problems upstream. Avoid masking casts/ignores.
9. **Apply analyzers with provenance.** Verify settings, environment, and actual
   file coverage using the analyzer evidence record. Proxies/pre-scans are only
   heuristics; Sonar hotspots are review prompts, not automatic vulnerabilities.
10. **Respect compatibility/change risk.** Classify proposed changes as
    non-breaking, behavior-changing, schema-, CLI-, API-breaking, or destructive.
    Prefer the smallest compatibility-preserving repair.
11. **Stage high-impact remediation.** Breaking/destructive changes require
    explicit authorization. For broad fixes/refactors/migrations preserve a
    checkpoint, review/stage the diff, validate, and keep rollback practical.
12. **Protect demonstrated defects.** Add/identify the smallest regression case;
    rerun the failing case first, then relevant positive and near-miss cases.
13. **Differential-test behavior-preserving refactors.** Compare old/new on the
    same fixtures across applicable structures, text/JSON/HTML, CLI output,
    exit codes, ordering, side effects, and independent metadata.
14. **Pressure-test relevant boundaries.** Include malformed/hostile data,
    path/serialization injection, ordering/ID collisions, CLI/server/network,
    subprocess shutdown, concurrency, timeout, and disconnect cases as applicable.
15. **Verify freshly, then assess.** Rerun formerly failing/applicable analyzers
    plus relevant compile/format/type/tests/CLI/end-to-end/output checks against
    the final artifact. Score only from applicable fresh evidence.

## Pressure status

For reviewed code:

- **RED** — unresolved material behavioral/security/compatibility defect.
- **AMBER** — no known material RED, but required runtime/analyzer/pressure
  evidence is unavailable or materially incomplete.
- **GREEN** — required behavioral, analyzer, runtime, compatibility, and pressure
  gates are evidenced for the stated scope.

Counts never dilute a material RED; analyzer cleanliness cannot override it.

## Conditional references

Load the smallest sufficient set:

- [Python guidelines](references/python-guidelines.md) — conditional Python rules
  and examples for any task path; honor the target Python version.
- [Remediation method](references/python-remediation-method.md) — deep
  correctness, external-data/sink tracing, compatibility, determinism,
  filesystem, CLI/server/subprocess, async, and remediation.
- [General review](references/python-general-review.md) — broad pitfalls,
  performance/data volume, testing quality, security, concurrency, modernization.
- [Analyzer verification](references/ruff-pyright-verification.md) — Ruff,
  Pyright/Pylance, mypy, Sonar, provenance, coverage, and fresh verification.
- [Review reporting](references/review-reporting.md) — required completion
  contract plus formal reporting, pressure matrices, and optional scoring.

Examples: async/filesystem/CLI/server/subprocess review → remediation method;
broad application/performance review → general review; analyzer diagnostics →
analyzer verification. Every completion summary loads only the compact completion
contract from review reporting. Artifact-producing tests load
[fixture ownership/disposition](references/python-general-review.md).
Do not load all references for a narrow request.

## Validation

Use [current cases](evals/cases.json) for unified-skill activation, task-path,
load-boundary, provenance, compatibility, hostile-input, determinism, analyzer,
pressure, and regression designs. Use [QAQ/RMI](evals/qaq-rmi.md) for static
bidirectional mappings. [Original review-only cases](evals/original-code-review-cases.json)
and the [historical pressure report](evals/python-code-review-pressure-test-report.md)
are retained as historical evidence, not the current activation contract.
[Python-expert cases](evals/python-expert-cases.json) preserve secondary designs.

For repeatable isolated evaluation use the [current-revision run plan](evals/current-revision-pressure/README.md) and its evidence validator; a planned run is not a completed run.\n\nDefinitions and mappings are not run evidence. Use
[evidence applicability](evals/evidence-applicability.md) to determine which
recorded runs apply to which revision; unavailable current behavior remains NHR.

## Completion rule

Report the artifact/patch, assumptions/tradeoffs, checks actually executed,
required checks not executed, compatibility implications, and remaining risk.
Illustrative snippets are not tests. Review/remediation completions additionally
follow the reporting completion contract and state residual RED/AMBER/GREEN.
Never claim production readiness without required behavioral/analyzer evidence.
