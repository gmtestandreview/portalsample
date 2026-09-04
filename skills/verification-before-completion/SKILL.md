---
name: verification-before-completion
description: Use before claiming that implemented, changed, generated, fixed, tested, built, or otherwise objectively verifiable work succeeded. Require fresh evidence from the strongest available verification method after the last relevant change, especially when tempted to rely on prior results, inspection, confidence, or "should work" reasoning.
---

# Verification Before Completion

## Core Rule

Do not claim a verifiable result succeeded without fresh evidence that directly supports the claim.

Confidence, inspection, prior runs, and expected behavior are not verification.

## When to Use

Use before claiming that:

- objectively checkable work is complete
- tests, builds, type checks, linting, or validation pass
- a bug is fixed or a feature works
- a generated or modified artifact is valid
- a measured requirement or threshold was satisfied

Do not use merely because a response is ending. Purely conversational, explanatory, creative, or subjective outputs need no execution evidence unless the claim itself is objectively verifiable.

## Workflow

### 1. Define the claim

State exactly what you intend to claim.

### 2. Choose evidence that directly tests it

Use the strongest practical verifier for the claim.

| Claim | Evidence |
| --- | --- |
| Tests pass | Run the relevant project test command |
| Build succeeds | Run the relevant build command |
| Types are valid | Run the configured type checker |
| Bug is fixed | Re-run the reproduction or regression test |
| Feature works | Exercise the relevant user flow or automated equivalent |
| Coverage meets target | Run the configured coverage measurement |
| Artifact is valid | Parse, validate, render, or inspect it |
| Requested edit exists | Compare the result or diff with the requirement |

Use project-defined commands and validators when available. Do not invent tools, paths, credentials, or success criteria.

### 3. Verify fresh

Verify after the last change that could affect the claim. Earlier results are stale.

### 4. Inspect the evidence

Check the signals the verifier actually provides: exit status, failures, warnings, test counts, diagnostics, expected state, or reproduced behavior.

Exit code `0` alone is insufficient when the output or task semantics require additional checks.

### 5. Decide from evidence

Claim success only when the observed evidence directly supports it.

If verification fails, report the failure, fix it when appropriate, then verify again.

If verification cannot run because tools, inputs, credentials, permissions, or environment are unavailable, state exactly what remains unverified. Never substitute expectation for evidence or broaden partial verification into a wider success claim.

### 6. Clean up safely

Cleanup is optional unless the task explicitly requires it.

Delete a temporary artifact only when you know it was created during this task, know its purpose, and know deletion will not remove project or user data.

Never select files for deletion using broad patterns such as `*.log` or `*.tmp`. Never delete pre-existing, provenance-unknown, tracked, or intentionally persisted test/coverage artifacts.

For destructive or high-impact cleanup, require explicit authorization and use a practical rollback safeguard such as a backup, snapshot, or staging step.

## Rationalization Red Flags

| Rationalization | Required response |
| --- | --- |
| "It passed before this change." | Verify again after the change. |
| "The change is too small to break anything." | Size is not evidence. Verify. |
| "The code/logic obviously works." | Inspection is not execution evidence. |
| "It should work." | Replace expectation with evidence. |
| "I'll verify after reporting." | Verify before making the claim. |

## Reporting

Report enough evidence to support the claim without dumping irrelevant or sensitive output.

```text
Verification: `pytest tests/test_checkout.py`
Result: 18 passed, 0 failed.
Claim supported: checkout regression tests pass.
```

For non-command verification, name the method and observed result. If verification is incomplete, separate `Verified` from `Not verified`.

## Completion Gate

Before reporting success, confirm:

- the claim is explicit
- the verifier directly tests it
- verification occurred after the last relevant change
- the evidence was inspected
- the evidence supports the claim
- unverified portions are disclosed
- any cleanup affects only known task-owned temporary artifacts

If any required item fails, do not claim the corresponding result succeeded.

## Why This Matters

LLMs are optimistic by default. They report what should be true, not what is true.
A test suite that "should pass" fails 30% of the time after non-trivial changes.
The only way to know is to run it.

One unverified claim compounds into three broken downstream tasks.
Five minutes of verification saves two hours of debugging later.
