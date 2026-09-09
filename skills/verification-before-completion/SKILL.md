---
name: verification-before-completion
description: Use before reporting that objectively verifiable work succeeded, including edits, fixes, tests, builds, validation, generated artifacts, measured thresholds, or user-visible behavior. Require claim-matched evidence produced after the last relevant change; do not substitute inspection, confidence, stale results, or expected behavior for verification.
---
<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->

# Verification Before Completion

## Core Rule

Do not report an objectively verifiable result as successful without fresh evidence that directly supports that exact claim.

Inspection, confidence, prior runs, and “should work” reasoning are not verification.

## Activation Boundary

Use this skill before independently reporting that objectively verifiable work succeeded, including:

- an edit, fix, feature, or requested change is complete
- tests, builds, type checks, linting, validation, or coverage pass
- generated or modified artifacts are valid
- user-visible behavior works
- a measurable requirement or threshold is satisfied

When merely summarizing or quoting user-provided verification evidence, preserve its provenance and scope instead of requiring a new run. Do not upgrade supplied evidence into an independently verified success claim.

## Verification Gate

### 1. Name the claim

Define the exact result you intend to report.

### 2. Select claim-matched evidence

Use the strongest practical verifier available for that claim.

| Claim | Preferred evidence |
| --- | --- |
| Tests pass | Relevant project test command |
| Build succeeds | Project build command |
| Types are valid | Configured type checker |
| Bug is fixed | Original reproduction or regression test |
| Feature works | Relevant user flow or automated equivalent |
| Coverage meets target | Configured coverage measurement |
| Artifact is valid | Parse, validate, render, or inspect the artifact |
| Requested edit exists | Compare the result or diff with the requirement |

Prefer project-defined commands and validators. Do not invent tools, paths, credentials, or success criteria.

### 3. Verify after the last relevant change

Evidence from before a change that could affect the claim is stale. Re-run the relevant verifier.

### 4. Inspect the result

Check the signals that establish success: failures, warnings, diagnostics, counts, expected state, reproduced behavior, or other claim-specific output.

Do not treat exit code `0` as sufficient when the verifier’s output or task semantics require additional checks.

### 5. Bound the conclusion

Report only what the evidence proves.

- If verification passes, state the verifier and observed result.
- If verification fails, report the failure; fix and re-run when the task authorizes remediation.
- If verification cannot run, state exactly what is unverified and why.
- If evidence covers only part of the claim, separate verified from unverified portions.

Never broaden partial evidence into a wider success claim.

## Rationalization Checks

| Rationalization | Required response |
| --- | --- |
| “It passed before this change.” | Re-run after the change. |
| “The change is too small to break anything.” | Verify anyway; size is not evidence. |
| “The logic obviously works.” | Use a verifier that exercises the claim. |
| “It should work.” | Replace expectation with evidence. |
| “I’ll verify after reporting.” | Verify before making the success claim. |
| “I’m confident.” | Confidence is not evidence. |
| “Just this once.” | No exceptions. |
| “The linter passed.” | A linter is not a compiler. |
| “The agent reported success.” | Verify independently. |
| “I’m tired.” | Exhaustion is not an excuse. |
| “A partial check is enough.” | Partial verification proves nothing. |
| “Different wording means the rule doesn’t apply.” | Spirit over letter. |

## Reporting Format

Use concise evidence:

```text
Verification: <method or command>
Observed: <relevant result>
Supported claim: <exact claim>
```

When incomplete:

```text
Verified: <supported result>
Not verified: <remaining claim and reason>
```

## Completion Check

Before reporting success, confirm:

- the claim is explicit
- the verifier directly tests that claim
- verification occurred after the last relevant change
- the evidence was inspected
- the conclusion does not exceed the evidence
- unverified portions are disclosed

If any item fails, do not claim the corresponding result succeeded.
