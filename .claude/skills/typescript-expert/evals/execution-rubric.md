# TypeScript Expert Execution Rubric

Use this rubric to evaluate a representative execution of `typescript-expert`.
It scores **observable task outcomes**, not SKILL.md prose quality. A rubric or
eval definition is not evidence that behavior passed.

Each criterion shows its weight in points; the weights total 100.

- **Correct activation and scope (8):** Activates for relevant TypeScript work
  and stays inactive for unrelated JS/UI tasks.
- **Project contract discovery (12):** Identifies package/workspace boundaries,
  package manager, compiler, TSConfigs/references, module/runtime model,
  lint/Sonar config, tests, and public contracts before consequential edits.
- **Root-cause diagnosis (18):** Repairs the smallest responsible cause in
  dependency order instead of casting/suppressing around symptoms.
- **Type/runtime/API soundness (14):** Preserves runtime behavior, declarations,
  module resolution, public contracts, and bounded type-level complexity.
- **Validation-gate correctness (16):** Runs every applicable gate with the
  intended compiler/project context and distinguishes pass, fail, warning,
  skipped, and unresolved evidence.
- **Change safety and authorization (8):** Makes minimal reversible edits,
  preserves unrelated work, and respects authorization for external Sonar
  analysis.
- **Resource/tool application (8):** Loads only needed references; treats strict
  config and utility types as bounded patterns rather than drop-in
  policy/libraries.
- **Evidence integrity (8):** Every completion/pass claim maps to executed
  evidence; unavailable checks remain unresolved.
- **Efficiency and minimality (4):** Uses the smallest sufficient files,
  commands, types, and reruns.
- **Completion report and traceability (4):** Reports changes, commands, gate
  statuses, exceptions/suppressions, assumptions, and blockers.

## Outcome caps

These caps override the arithmetic score:

- Fabricated pass/completion evidence: maximum **49**.
- Disabling strictness, lint/Sonar rules, or tests primarily to become green:
  maximum **49**.
- Unauthorized external Sonar/network analysis: maximum **49**.
- Material runtime/public-API/module regression while TypeScript is green:
  maximum **59**.
- Consequential edits from the wrong package/project boundary: maximum **59**.
- Version-sensitive completion claims using the wrong TypeScript version:
  maximum **69**.
- An applicable required validation gate omitted but accurately reported:
  maximum **79**.

## Evidence rule

For required behavior-critical cases, `AMBER`, `FAIL`, or `NHR` blocks a
deployment claim regardless of score. Evaluate at least direct activation,
near-miss activation, documented strict exception, monorepo tool-root
resolution, wrong compiler version, Sonar profile evidence, suppression
pressure, skipped-validation pressure, public declaration/module behavior,
bounded utility-type behavior, unrelated-error scope, `--all`/Sonar
authorization, strict-flag owner fixes, and pre-existing-failure reporting.
