# Regression Checks

Use this reference after editing and before the final report.

## Required Checks

- Compare original and annotated versions.
- Confirm all additions are comments or approved sidecar prose.
- Confirm executable statements and data values are unchanged.
- Confirm no secrets are repeated or exposed.
- Confirm line endings match the original.
- Confirm apparent encoding matches the original.
- Confirm indentation style was not normalized.
- Confirm shebangs, encoding declarations, imports, namespaces, package declarations, pragmas, and license headers remain valid.
- Confirm the diff contains no unrelated formatting churn.
- Confirm parser/compiler/typecheck results are recorded when available.

## Behavior Regression

Use the smallest relevant safe command. Prefer single-file syntax checks over broad project tests. Run focused tests only if safe, local, non-mutating, and useful.

## Report Requirements

Record original path, annotated path or in-place status, backup path, commands run, pass/fail/not-run results, and any human-review items.
