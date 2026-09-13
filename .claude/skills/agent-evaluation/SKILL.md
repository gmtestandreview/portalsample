---
name: agent-evaluation
description: "Use when evaluating, benchmarking, regression-testing, or monitoring LLM agents, especially when results are nondeterministic, benchmark scores may not predict production behavior, or reliability must be measured across repeated runs."
license: Apache-2.0
metadata:
  source: vibeship-spawner-skills
---

# Agent Evaluation

Evaluate agent behavior as a distribution, not a single deterministic result. A strong benchmark result is not sufficient evidence of production reliability.

## Workflow

1. **Define the behavioral contract.**
   - State the capability or invariant being evaluated.
   - Define observable success and failure conditions.
   - Prefer semantic or behavioral criteria over exact output-string matching.

2. **Build representative cases.**
   - Include normal tasks, edge cases, and adversarial cases.
   - Include cases that reflect production conditions when benchmark-to-production transfer matters.
   - Keep evaluation data separate from prompts, training material, and other channels that could leak expected answers.

3. **Run repeated trials.**
   - Execute nondeterministic cases multiple times.
   - Record the distribution of outcomes rather than treating one pass as conclusive.
   - Treat intermittent failures as reliability evidence, not noise to discard.

4. **Assess capability and reliability separately.**
   - Capability asks whether the agent can succeed.
   - Reliability asks how consistently it succeeds across repeated and varied cases.
   - Use multiple dimensions when one metric could be gamed or hide important failures.

5. **Investigate failures.**
   - Compare benchmark behavior with production-like behavior when results diverge.
   - For flaky cases, identify the conditions associated with pass/fail variation before changing thresholds.
   - For metric gaming, add or revise dimensions that measure the intended task rather than the proxy.

6. **Regression-test changes.**
   - Preserve representative prior failures as regression cases.
   - Re-run affected cases after prompt, model, tool, policy, or orchestration changes.
   - Do not call a regression fixed from a single successful rerun when the behavior is stochastic.

7. **Monitor production behavior.**
   - Track the same behavioral contracts or reliability dimensions that matter in evaluation.
   - Investigate material gaps between offline evaluation and production outcomes.
   - Feed production failures back into representative evaluation and regression cases.

## Required Evidence

For each material evaluation claim, report:

- the behavior or capability tested;
- the cases used;
- the number of repeated trials when nondeterminism matters;
- the success/failure criteria;
- the observed outcome distribution or reliability result;
- known limitations, confounders, or leakage risks.

Do not claim reliability from a single run.

## Patterns

### Statistical Test Evaluation
Run repeated trials and analyze outcome distributions.

### Behavioral Contract Testing
Define observable invariants and test whether agent behavior satisfies them.

### Adversarial Testing
Include realistic attempts to expose brittle assumptions, unsafe shortcuts, or boundary failures.

## Anti-Patterns

- **Single-run testing:** one pass or failure is insufficient evidence for stochastic behavior.
- **Happy-path-only testing:** normal cases alone do not characterize robustness.
- **Exact output string matching:** use only when exact text is genuinely the contract; otherwise evaluate semantics or behavior.
- **Benchmark-only confidence:** benchmark performance does not establish production reliability.
- **Metric monoculture:** one optimized score can hide regressions or encourage proxy gaming.
- **Evaluation leakage:** do not expose expected answers or held-out evaluation material through prompts, training data, or test setup.

## Failure Handling

| Failure mode | Response |
| --- | --- |
| Strong benchmark, weak production behavior | Add production-representative cases and compare the failure conditions. |
| Same case alternates between pass and fail | Increase repeated trials and report the outcome distribution. |
| Score improves while task quality degrades | Revisit the metric and add dimensions tied to the intended behavior. |
| Evaluation data may have leaked | Treat affected results as invalid until the contamination risk is resolved. |
| Exact-match grading rejects valid behavior | Replace it with behavioral or semantic criteria unless exact text is required. |

## Completion Criteria

An evaluation is complete only when the tested behavior, cases, success criteria, repeated-run treatment, observed results, and material limitations are explicit. Production-readiness claims require evidence that the evaluation covers relevant production failure modes; otherwise state the coverage gap.
