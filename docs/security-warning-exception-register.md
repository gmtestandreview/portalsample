# ESLint Filesystem-Path Warning Exception Register

Date: 2026-11-13

## Scope

This register reconciles the 57 `security/detect-non-literal-fs-filename`
findings identified during the owner-authorized recovery work. The approval
authorized investigation and remediation; it did not accept unresolved security
risk.

## Remediation result

The diagnostics were regenerated after remediation. The current report covers
959 files and contains 0 errors and 0 warnings. No lint threshold was changed.

The remediation:

- centralizes canonical containment and symlink-ancestor checks in
  `scripts/safe-file-io.mjs`;
- requires configured Git executables to be absolute regular files;
- routes lint, Storybook, Vite, and citation verifier filesystem operations
  through the reviewed wrappers;
- validates intentionally external report destinations against symlinked path
  components before creating or overwriting them;
- routes fixed repository-fixture reads through the test filesystem helper; and
- scopes the only static-analysis exception to the reviewed filesystem boundary
  implementations and deliberate symlink-fixture tests.

The scoped exception is a false-positive classification backed by tests. It is
not a blanket suppression and is not owner acceptance of residual risk.

## Evidence

- `npm run lint:diagnostics`: 0 warnings, 0 errors across 959 files.
- `npm run lint:eslint`: passed with 0 warnings and 0 errors.
- `npm run test:lint:diagnostics`: 14/14 passed.
- `npm run test:lint:baseline`: 3/3 passed.
- `node --test scripts/safe-file-io.test.mjs`: 14/14 passed.
- `node --test scripts/lint-diagnostics.test.mjs scripts/safe-file-io.test.mjs`:
  28/28 passed.
- Focused filesystem-related Vitest suites: 104/104 passed.
- `npm run type-check`: passed.
- Secret scans for all modified security-boundary files: passed.

## Residual limitation

Node's path-based filesystem APIs cannot make validation and the final
filesystem operation atomic on every supported platform. A concurrent path
replacement after validation can still create a TOCTOU window. This limitation
is documented in the wrapper and is not marked owner-approved or accepted by
this register. Removing it would require a platform-specific descriptor-based or
equivalent atomic filesystem design.

## Decision state

The 57 static findings are remediated and no longer emitted by the current
security lint report. No unresolved warning is represented as owner-approved;
the owner authorization is recorded as permission to perform the remediation
only.
