---
name: python-code-review
description: Use when reviewing, auditing, hardening, or remediating existing Python code for correctness, typing or static-analysis diagnostics (including Ruff, Pyright/Pylance, mypy, or supplied Sonar findings), unsafe external-data handling, async/error/security risks, performance, determinism, regression protection, or compatibility-sensitive changes. Do not use for ordinary Python explanations, greenfield implementation, isolated feature coding, standalone test authoring, or debugging a single local defect unless the user also asks for broader code-quality review, hardening, or remediation.
---

# Python Code Review

Review **existing Python code** for correct behavior first, then sound data modelling, validated boundaries, strict typing, deterministic execution, appropriate performance, lint/static-analysis quality, and readability.

## Scope boundary

Use this skill for code review, audit, hardening, root-cause analysis of quality defects, and compatibility-sensitive remediation.

Do not use it merely because a request mentions Python. Ordinary explanations, greenfield feature implementation, narrow syntax help, routine refactors, standalone test authoring, and isolated debugging of a single local defect are outside scope unless the user also asks for broader code-quality review, cross-function/module root-cause analysis, hardening, or remediation. For specialist domains such as security, databases, or framework architecture, apply this skill only to the Python-specific review concerns and compose with a narrower specialist skill when available.

## Evidence boundary

Classify material findings as:

- **Verified defect** — demonstrated by source, supplied diagnostics, failing tests, executed tools, or reproducible runtime behavior.
- **Statically confirmed defect** — clearly incorrect from inspection but not yet exercised.
- **Conditional lint/static-analysis finding** — applies only if the relevant rule, checker, configuration, or supplied diagnostic applies.
- **Recommendation** — quality or maintainability improvement rather than an existing failure.

Never report Ruff, Pyright/Pylance, mypy, Sonar, tests, builds, or runtime checks as passing unless they were actually run successfully. Mark unavailable execution evidence explicitly.

## Workflow

1. **Establish the baseline.** Identify the supported Python floor, CI/local versions when available, repository configuration, supplied diagnostics, public/API/CLI/schema compatibility constraints, and the scope of requested changes.
2. **Find root causes before patching symptoms.** Group related diagnostics. Trace `Any`/`Unknown`, heterogeneous mappings, magic-key discriminators, unsafe narrowing, invalid optionality, boundary ambiguity, repeated I/O, and data-volume problems upstream.
3. **Review correctness beyond static tools.** Check missing-versus-zero semantics, numeric coercion, domain invariants, `NaN`/infinity, units, ordering, aggregation assumptions, fallback precedence, parsing, filesystem behavior, async cancellation/timeouts, error handling, and performance risks as applicable.
4. **Review type and data boundaries.** Keep dynamic types at unavoidable ingestion boundaries; validate external data before converting it into domain types. Model missingness separately from `None`; avoid casts or ignores that hide a wrong model.
5. **Respect compatibility and change risk.** Before changing serialized output, public APIs, CLI behavior, schemas, data, or other high-impact behavior, identify consumers and classify the change as non-breaking, behavior-changing, schema-breaking, CLI-breaking, API-breaking, or destructive. Prefer the smallest compatibility-preserving repair.
6. **Stage high-impact remediation.** Require explicit authorization before breaking/destructive changes. For bulk auto-fixes, large refactors, migrations, or broad rewrites, preserve a checkpoint, stage changes when practical, review the diff, validate before irreversible execution, and keep a clear rollback path.
7. **Remediate narrowly.** For actual behavior-changing defects, add or identify the smallest regression test, reproduce the failure when execution is available, apply the smallest justified fix, then refactor only while preserving behavior.
8. **Verify freshly.** Re-run only checks actually available and relevant: syntax/compile, configured linters/static analyzers, formatter, type checker, tests, CLI smoke tests, representative end-to-end execution, and generated-output inspection.
9. **Report evidence, not assumptions.** Separate verified results from static findings, conditional diagnostics, recommendations, and unexecuted verification work.

## Review priorities

Use:
- **P0** for incorrect results, crashes, corruption, fabricated results, unsafe type architecture, broken semantics, or unsafe input handling.
- **P1** for robustness, validation, deterministic behavior, type-safety, performance, security, or maintainability risks.
- **P2** for modernization, readability, optional lint/style policy, or nonessential refactors.

Do not inflate style preferences into correctness defects.

## Conditional references

Load only the smallest reference set needed:

- `references/python-remediation-method.md` — root-cause, typing, external-data, compatibility, semantic-correctness, async, filesystem, CLI, and error-handling checks.
- `references/python-general-review.md` — broad Python pitfalls, performance/data-volume review, testing quality, security, and modernization/idiom checks.
- `references/ruff-pyright-verification.md` — Ruff and static/type-checker remediation, supplied Sonar findings, regression workflow, verification commands, completion gates, and evidence rules.
- `references/review-reporting.md` — regression matrix, report structure, priorities, and final assessment format.

Examples:
- Async/error review → `python-remediation-method.md`.
- Broad application/library audit or performance review → add `python-general-review.md`.
- Ruff, Pyright/Pylance, mypy, or supplied Sonar diagnostics → `ruff-pyright-verification.md` plus remediation guidance as needed.
- Formal review report → add `review-reporting.md`.

Do not load all references for a narrow request.

## Validation

Use `evals/cases.json` for activation, near-miss, pressure, compatibility, performance, specialist-composition, and reference-load cases. Use `evals/qaq-rmi.md` to map critical triggers and load conditions. Eval definitions and static mappings are not execution evidence; unavailable behavioral runs remain `NHR`.

## Completion rule

Do not call the code production-ready from static inspection alone. Report which required checks were executed, which were unavailable, and any remaining compatibility or regression risk.
