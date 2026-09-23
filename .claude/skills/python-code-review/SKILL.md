---
name: python-code-review
description:
  Use when reviewing, auditing, hardening, or remediating existing Python code
  for correctness, typing or static-analysis diagnostics (including Ruff,
  Pyright/Pylance, mypy, or supplied Sonar findings), unsafe external-data
  handling, async/error/security risks, performance, determinism, regression
  protection, or compatibility-sensitive changes. Do not use for ordinary Python
  explanations, greenfield implementation, isolated feature coding, standalone
  test authoring, or debugging a single local defect unless the user also asks
  for broader code-quality review, hardening, or remediation.
---

# Python Code Review

Review **existing Python code** for correct behavior first. Static-analysis
cleanup is a middle step, not the finish line.

## Scope boundary

Use this skill for code review, audit, hardening, root-cause analysis of quality
defects, and compatibility-sensitive remediation.

Do not use it merely because a request mentions Python. Ordinary explanations,
greenfield feature implementation, narrow syntax help, routine refactors,
standalone test authoring, and isolated debugging of a single local defect are
outside scope unless the user also asks for broader code-quality review,
cross-function/module root-cause analysis, hardening, or remediation. For
specialist domains such as security, databases, networking, or framework
architecture, cover the Python-specific concerns and compose with a narrower
specialist skill when available.

## Evidence boundary

Classify material findings as:

- **Verified defect** — demonstrated by source plus executed behavior/test/tool
  evidence, or by a supplied diagnostic whose artifact and provenance are
  confirmed.
- **Statically confirmed defect** — clearly incorrect from inspection but not
  yet exercised.
- **Conditional analyzer finding** — depends on the relevant rule, checker,
  configuration, version, or supplied diagnostic.
- **Recommendation** — quality or maintainability improvement rather than an
  existing failure.

Never claim Ruff, Pyright/Pylance, mypy, Sonar/SonarLint, tests, builds, runtime
checks, or regressions pass unless they were freshly executed successfully
against the artifact being reported. A supplied diagnostic is evidence about
that diagnostic run, not proof that the current artifact is clean.

## Required review order

Follow this order unless a narrower review makes a step genuinely inapplicable:

1. **Freeze artifact and diagnostic provenance.** Identify the exact
   file/revision/copy being reviewed and the supported Python floor. For every
   supplied diagnostic, confirm path, artifact/version, analyzer and rule,
   configuration/profile when available, and freshness. If the source is
   read-only, preserve it and state which derived copy is modified and verified.
2. **Establish the baseline.** Read repository/CI/test/analyzer configuration.
   Capture supplied diagnostics. Compile and run existing tests when available
   before behavior-changing remediation.
3. **Understand interfaces and the data model.** Identify public APIs, CLI
   contracts, serialized schemas, consumers, domain invariants, fallback
   precedence, and compatibility constraints before changing representations.
4. **Review semantic correctness first.** Check missing-versus-zero/`None`,
   numeric coercion and non-finite values, units, ordering, aggregation
   completeness, independently recoverable fields, parsing, error semantics,
   async cancellation/timeouts, and resource cleanup.
5. **Treat external values as untrusted until validated.** Validate type, shape,
   range, names, lengths, and missingness before domain use. Trace each
   untrusted identifier/value through every relevant sink: filesystem paths,
   serializers/config, shell/subprocess arguments, logs, mapping keys, generated
   IDs, HTML/DOM/API identifiers, and filenames.
6. **Review filesystem and security boundaries.** Resolve and constrain
   user-influenced paths; consider symlinks, absolute-like paths, alternate
   separators, traversal, control characters, serialization injection, and
   platform-sensitive names. Do not assume validation at one sink makes the
   value safe at another.
7. **Review determinism and generated identity.** Pressure-test `1/2/10`
   ordering, unordered discovery, concurrency completion order,
   stable/collision-resistant identifiers, collision handling, and names such as
   `a-b` versus `a/b`. Do not derive externally visible identity from unstable
   iteration order.
8. **Fix model/root causes before diagnostics.** Group related analyzer
   findings. Trace `Any`/`Unknown`, heterogeneous mappings, inaccurate
   optionality, magic discriminators, unsafe narrowing, repeated I/O, and
   data-volume problems upstream. Avoid casts/ignores that hide a wrong model.
9. **Apply analyzers with exact provenance.** Use the repository configuration
   and, when version-specific behavior matters, the exact analyzer/rule/profile
   that produced the finding. Analyzer proxies and static pre-scans are
   heuristics only. Sonar hotspots are review prompts, not automatically
   vulnerabilities.
10. **Respect compatibility and change risk.** Classify each proposed change as
    non-breaking, behavior-changing, schema-breaking, CLI-breaking,
    API-breaking, or destructive. Prefer the smallest compatibility-preserving
    repair; security hardening should reject invalid inputs without gratuitously
    breaking valid legacy inputs.
11. **Stage high-impact remediation.** Breaking/destructive changes require
    explicit authorization. For broad auto-fixes/refactors/migrations, preserve
    a checkpoint, stage changes, review the diff, validate before irreversible
    execution, and keep rollback practical.
12. **Protect every demonstrated defect.** For each material RED/verified
    behavioral defect, add or identify the smallest regression test, reproduce
    it when execution is available, apply the smallest correct fix, rerun the
    original failing case first, then related positive and near-miss cases.
13. **Differential-test behavior-preserving refactors.** Run old and new
    artifacts on the same representative fixtures and compare applicable return
    structures, JSON/HTML/text, CLI output, exit codes, ordering, side effects,
    and independently recoverable metadata fields.
14. **Run an adversarial pressure campaign.** After ordinary review/analyzer
    cleanup, pressure-test relevant boundaries: malformed/hostile external data,
    path and serialization injection, ordering/ID collisions, CLI edges,
    server/network semantics, subprocess pipe/process shutdown, concurrency, and
    timeout/disconnect behavior.
15. **Verify freshly, then assess.** Re-run the exact formerly failing analyzers
    plus applicable compile, formatter, type checker, tests, CLI smoke,
    representative end-to-end execution, and output inspection against the final
    artifact. Score only after this evidence exists if scoring was requested.

## Pressure status and stopping rules

For the code under review:

- **RED** — any unresolved material behavioral/security/compatibility defect
  remains.
- **AMBER** — no known material RED remains, but required
  runtime/analyzer/pressure evidence is unavailable or materially incomplete.
- **GREEN** — required behavioral, analyzer, runtime, compatibility, and
  pressure gates are evidenced for the stated scope.

Counts do not dilute a material RED. A clean analyzer run cannot turn unresolved
behavioral RED into GREEN.

For iterative auto-remediation, stop after at most three cycles unless the user
explicitly authorizes more. Stop earlier for repeated failure, no improvement,
missing required context/tooling, unsafe/conflicting requirements, or a change
that requires human judgment.

## Review priorities

Use:

- **P0** for incorrect results, crashes, corruption, fabricated results,
  exploitable boundary failures, broken semantics, or unsafe input handling.
- **P1** for robustness, validation, determinism, type-safety, performance,
  security hardening, compatibility, or maintainability risks.
- **P2** for modernization, readability, optional lint/style policy, or
  nonessential refactors.

Do not let style/analyzer points compensate for a P0/P1 behavioral defect.

## Conditional references

Load only the smallest sufficient set:

- `references/python-remediation-method.md` — deep correctness,
  external-data/sink tracing, compatibility, determinism, filesystem,
  CLI/server/subprocess, async, and remediation method.
- `references/python-general-review.md` — broad Python pitfalls,
  performance/data volume, testing quality, security, concurrency, and
  modernization.
- `references/ruff-pyright-verification.md` — analyzer provenance,
  Ruff/Pyright/mypy/Sonar handling, RED/GREEN repair, and fresh verification.
- `references/review-reporting.md` — regression/pressure matrices, optional
  scoring rubric, provenance-rich reporting, and final assessment.

Examples:

- Async/filesystem/CLI/server/subprocess review →
  `python-remediation-method.md`.
- Broad application/library or performance review → add
  `python-general-review.md`.
- Ruff, Pyright/Pylance, mypy, Sonar/SonarLint, or supplied diagnostics → add
  `ruff-pyright-verification.md`.
- Formal report, pressure campaign, or requested score → add
  `review-reporting.md`.

Do not load all references for a narrow request.

## Validation

Use `evals/cases.json` for activation, near-miss, load-boundary, provenance,
compatibility, hostile-input, determinism, analyzer-evidence, pressure, and
regression scenarios. Use `evals/qaq-rmi.md` for static bidirectional mappings
of critical triggers, branches, and load conditions.

Eval definitions and QAQ/RMI mappings are not execution evidence. Record
representative runs separately; unavailable behavior remains `NHR`.

## Completion rule

Never call the reviewed code production-ready from static inspection or analyzer
cleanliness alone. State the exact artifact verified, executed checks and
versions/configuration when material, unavailable checks, pressure status,
compatibility impact, and residual risks.
