---
name: systematic-debugging
description: Use when diagnosing and fixing software bugs, failing or flaky tests, regressions, crashes, incorrect outputs, integration failures, or other unexpected program behavior when the cause is not already established.
---
<!-- A Team fork. Merged from superpowers 6.3.0 on 2026-09-09. See .claude/docs/specs/2026-09-09-a-team-wiring-review-design.md -->

# Systematic Debugging

## Iron Law

**NO FIX WITHOUT EVIDENCE FOR THE ROOT CAUSE FIRST.**

A plausible explanation is not a root cause. Trace the failure far enough to explain why it occurs and why the proposed change should correct it.

If the root cause is already established by direct evidence—for example, an unambiguous typo whose location directly explains the observed failure—fix it and verify; do not perform unnecessary ceremony.

A reproducible or deterministic failure establishes the failure, not necessarily its cause.

## When to Use

Use this workflow for:

- failing or flaky tests;
- crashes, exceptions, and error responses;
- regressions after code, dependency, configuration, infrastructure, or environment changes;
- incorrect program output or state;
- integration failures across components or services;
- performance or reliability failures that require causal investigation.

Do not use it merely for feature implementation, general code review, refactoring without a reported failure, hardware troubleshooting, or product/business analysis.

## Phase 1: Establish the Failure

1. Read the complete error, stack trace, logs, failing assertion, and other available evidence.
2. State the exact observed behavior and expected behavior.
3. Reproduce the failure with the smallest reliable case available.
4. Record the conditions required to reproduce it: inputs, environment, configuration, version, timing, and relevant state.
5. Check recent changes that could affect those conditions, including code, dependencies, configuration, infrastructure, and data contracts. When version control is available, inspect the relevant diff and recent commits.
6. Trace the failing value, state, or control flow backward toward its origin. See [references/root-cause-tracing.md](references/root-cause-tracing.md) for the complete backward-tracing technique.

If the failure is not reproducible, **do not guess a fix**. Improve observability, collect additional examples, and compare failing with successful runs.

For multi-component systems, inspect each relevant boundary:

- what enters;
- what exits;
- configuration and environment received;
- state or transformations applied;
- errors, retries, and dropped information.

**Do not expose sensitive data while debugging.** Redact credentials, secrets, tokens, private keys, and unnecessary personal data from logs, traces, captures, and debugging output. Prefer structural metadata, hashes, or sampled/redacted values when full values are not required.

**Exit condition:** You can state precisely what fails, under which conditions, and what evidence demonstrates the failure.

## Phase 2: Analyze the Pattern

1. Find a working example of similar behavior when one exists.
2. Read the relevant working/reference implementation end-to-end for the behavior being compared; do not infer assumptions from isolated snippets.
3. Compare the working and failing paths.
4. List meaningful differences rather than assuming the first suspicious line is causal.
5. Identify dependencies, invariants, contracts, and assumptions that could explain the difference.
6. Continue tracing until the suspected mechanism explains the observed failure.

**Exit condition:** Evidence identifies a component and causal mechanism that can explain the failure.

## Phase 3: Test One Hypothesis

State one falsifiable hypothesis:

> I think **X** causes the failure because **Y evidence**. If true, **Z observation or experiment** should confirm it.

Then:

1. Choose the smallest safe experiment that distinguishes this hypothesis from alternatives.
2. Change one variable at a time.
3. Prefer instrumentation, isolated tests, read-only checks, or reversible changes over speculative edits.
4. Predict the result before running the experiment.
5. Compare the result with the prediction.

If the hypothesis fails, discard or revise it using the new evidence. Do not stack speculative changes.

**Production rule:** Do not mutate production as the first hypothesis test when a representative lower-risk experiment is available. If the failure occurs only in production, begin with read-only observability. Any production mutation requires appropriate authorization and a practical rollback or recovery path.

**Exit condition:** The supported hypothesis predicts what change should remove the failure.

## Phase 4: Fix and Verify

1. Create or identify the smallest failing test or reproduction before changing the code when practical.
2. If an automated failing test is not feasible, record why and preserve an observable pre-fix failure condition.
3. Implement the smallest change that addresses the supported root cause.
4. Re-run the original reproduction under the same relevant conditions.
5. Run the targeted test or check.
6. Run relevant regression tests or checks for affected behavior.
7. Confirm the fix did not merely hide the symptom through retries, suppression, fallback behavior, exception swallowing, or weakened assertions.

Once the root cause is fixed, add validation at every layer the bad data passes through — see [references/defense-in-depth.md](references/defense-in-depth.md). When the failure involves flaky or timing-dependent tests built on arbitrary delays, replace the delays with condition polling — see [references/condition-based-waiting.md](references/condition-based-waiting.md).

If verification fails, return to the appropriate investigation phase instead of layering on another fix.

## Safety for High-Impact Experiments

Before an experiment that can mutate production data, change infrastructure, delete state, alter permissions, or otherwise create material impact:

- use a non-production or isolated reproduction when it can answer the same question;
- require appropriate authorization;
- create a practical backup, snapshot, or rollback path when applicable;
- prefer reversible changes;
- make the smallest discriminating change;
- verify recovery before expanding the experiment.

Do not use a destructive change merely to test a hypothesis when a safer discriminating experiment exists.

## When Attempts Keep Failing

After **three materially different failed hypotheses or fix attempts**, stop the normal fix loop.

Do **not** conclude automatically that the architecture is defective. Reassess:

- whether the reproduction is accurate;
- whether observability is sufficient;
- whether the hypotheses actually tested different causes;
- whether multiple faults are interacting;
- whether an external dependency or environment differs;
- whether the assumed system model is wrong.

If progress now requires a broad redesign, high-impact refactor, or a decision between competing architectural explanations, present the evidence and involve the human before proceeding.

## Red Flags — Return to Investigation

- "Quick fix now, investigate later."
- "Just change X and see what happens" without a hypothesis.
- "I do not understand the cause, but this might work."
- Multiple unrelated changes in one experiment.
- A fix proposed before tracing where the incorrect value or state originates.
- A passing result obtained by weakening, deleting, or bypassing the failing assertion.
- Repeatedly modifying the same area despite evidence pointing elsewhere.
- Treating retries, suppression, or restart-only recovery as proof that the root cause is fixed.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Signals The Approach Is Wrong

**Watch for these redirections:**
- "Is that not happening?" - You assumed without verifying
- "Will it show us...?" - You should have added evidence gathering
- "Stop guessing" - You're proposing fixes without understanding
- "Ultra-think this" - Question fundamentals, not just symptoms
- "We're stuck?" (frustrated) - Your approach isn't working

**When you see these:** STOP. Return to Phase 1.

## Completion Criteria

Do not claim the bug is fixed unless:

- the original failure is no longer reproducible under the same relevant conditions;
- the causal explanation is consistent with the evidence;
- the fix addresses that cause rather than only the visible symptom;
- targeted verification passes;
- relevant regression checks pass, or unavailable checks are explicitly identified;
- any high-impact change has an acceptable rollback or recovery path.

## Supporting Techniques

Load these when the situation calls for them:

- [references/root-cause-tracing.md](references/root-cause-tracing.md) — when the bug surfaces deep in the call stack and you need to trace backward to the original trigger.
- [references/defense-in-depth.md](references/defense-in-depth.md) — after the root cause is known, to add validation at every layer the bad data passes through.
- [references/condition-based-waiting.md](references/condition-based-waiting.md) — when a flaky or timing-dependent test relies on arbitrary delays instead of polling for the real condition.
- [references/condition-based-waiting-example.ts](references/condition-based-waiting-example.ts) — a complete `waitFor`-style implementation with domain-specific helpers to adapt.
- [scripts/find-polluter.sh](scripts/find-polluter.sh) — when state leaks between tests and you need to bisect the suite to find the polluting test.
