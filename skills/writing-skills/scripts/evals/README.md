# Behavioral Evaluation Suite for Agent Skills

Use this suite to collect behavioral evidence that a candidate `SKILL.md` activates correctly, changes agent behavior in the intended direction, resists relevant pressure or edge cases, retrieves reference material accurately, and preserves prior behavior after revision.

Before planning or running output-quality evals, read and apply `../../references/evaluating-skill-output.md`. This suite provides the seeded case library and outcome conventions for the writing-skills package; `evaluating-skill-output.md` governs the broader workflow for designing prompts, running with-skill/without-skill comparisons, writing assertions, grading outputs, aggregating results, reviewing with a human, and iterating.

This suite is deliberately separate from deterministic parser, validator, prompt, and CLI tests. Those tests prove implementation contracts. These evals prove agent behavior.

## Directory structure

```text
evals/
  README.md
  evaluation-schema.md
  activation/
    activation-evals.md
  red-green/
    red-green-evals.md
  pressure/
    pressure-evals.md
  reference/
    reference-evals.md
  regression/
    regression-evals.md
```

## Two independent axes: lifecycle and outcome

Do not confuse the evaluation lifecycle with the evaluation result.

### Lifecycle

- **RED** — establish baseline evidence without the candidate skill, or use a retrieval/application baseline for a pure Reference skill when behavioral RED is not meaningful.
- **GREEN** — run the same representative task with the candidate skill available and compare behavior.
- **REFACTOR** — fix the smallest responsible defect, then rerun the failed case and relevant regressions.

### Outcome

Every executed case receives exactly one result:

- **PASS** — all applicable success criteria for this case are met with sufficient evidence.
- **AMBER** — the case ran and produced useful evidence, but behavior is partial, ambiguous, inconsistent, unstable, or insufficient for PASS. AMBER is not equivalent to PASS.
- **FAIL** — a material expected behavior was violated or the claimed behavior was disproved.
- **NHR** — the case cannot be verified because required execution capability, isolation, representative input, permissions, or evidence is genuinely unavailable.
- **N/A** — the case does not apply to this skill class or target environment, with a recorded rationale.

**Requiredness is independent of outcome.** `required: true|false` controls deployment impact, not whether a material violation is classified as FAIL. Optional cases can FAIL without automatically blocking deployment; their risk still must be documented.

**Deployment rule:** a required behavior-critical case that is AMBER, FAIL, or NHR blocks `deploy`. The candidate must be `revise` or `hold` until the required evidence is resolved.

## Skill-class routing

Classify the candidate before selecting cases.

| Skill class | Primary behavioral evidence |
| --- | --- |
| **Discipline** | Activation, RED/GREEN, rationalization, conflicting goals, pressure, safety, escalation, regression |
| **Technique** | Activation, RED/GREEN, correct/incorrect inputs, sequencing, partial environments, reproducibility, edge cases, regression |
| **Pattern** | Activation, RED/GREEN, recognition, lookalikes, counterexamples, branch selection, false positives/negatives, regression |
| **Reference** | Activation where relevant, retrieval/application baseline, resource discovery, retrieval accuracy, unsupported-query handling, coverage gaps, regression |
| **Hybrid** | Combine only the case families needed for the actual behaviors present |

Do not force Discipline-style pressure onto simple Technique or Reference skills when edge-case, counterexample, or retrieval testing is the appropriate evidence.

## Recommended campaign order

1. **Declare campaign context** — candidate path/version, skill class, target environment, evaluator/model, available tools, and known limitations.
2. **Run activation cases** — establish intended positive and near-miss boundaries before interpreting later behavior.
3. **Run RED/GREEN cases** — capture baseline evidence and with-skill evidence separately.
4. **Run class-appropriate pressure/edge or Reference cases** — choose only applicable scenarios.
5. **REFACTOR narrowly** — if a case fails, fix the smallest trigger, branch, instruction, boundary, or precedence defect.
6. **Run regression cases** — rerun the failed case, positive triggers, near-misses, and relevant prior fixes.
7. **Summarize unresolved evidence** — AMBER, FAIL, and NHR remain visible; do not convert uncertainty into PASS.

## Minimum evidence expectations

A campaign should capture enough evidence that another reviewer can reconstruct the decision. At minimum record:

- the exact candidate version or revision;
- the exact scenario/task presented to the agent;
- whether the candidate skill was available;
- whether a supporting resource/file was named explicitly or had to be discovered from load conditions;
- expected activation and expected behavior;
- the observed output or a faithful excerpt sufficient to judge the case;
- the governing skill instruction or reference material;
- the result and rationale;
- any rationalization, ambiguity, unsupported assumption, or evidence limitation;
- links to related RED/GREEN or regression cases.

Do not summarize away the evidence that caused a FAIL or AMBER decision.

## Same-task rule for RED/GREEN

Run the same representative task in RED and GREEN where practical.

If an equivalent task is necessary, the evaluator must explain why it is equivalent and preserve the relevant:

- inputs;
- constraints;
- success criteria;
- pressure conditions;
- activation context.

An easier GREEN scenario is not valid comparative evidence.

## AMBER guidance

AMBER is useful because not every concerning run is a clean failure. Use it when the run is executable and informative but one of these conditions prevents a defensible PASS:

- activation is inconsistent across semantically equivalent wording;
- the correct branch is chosen but required reasoning or safeguards are incomplete;
- the final answer is acceptable but supporting-resource use is unreliable;
- the agent correctly identifies uncertainty but does not resolve it as instructed;
- a Reference response is substantially correct but overstates unsupported detail;
- repeated runs produce materially inconsistent behavior;
- evidence is sufficient to diagnose a weakness but not sufficient to declare the requirement fully failed.

Do **not** use AMBER when execution itself is unavailable; that is NHR. Do **not** use AMBER to soften a clear rule violation; that is FAIL.

## NHR guidance

Use NHR only when verification is genuinely unavailable, for example:

- no clean baseline context can be created;
- the required tool or environment is unavailable;
- representative source material or inputs cannot be accessed;
- required permissions are unavailable;
- a destructive or external action cannot safely be executed and no valid simulation is available.

Record `blocked_by`, `missing_evidence`, and `required_follow_up`. NHR is not a pass.

## Campaign completion gate

For a behavior-critical skill, do not recommend `deploy` unless:

- required positive and near-miss activation cases pass;
- required RED evidence exists, or the applicable Reference baseline is valid;
- required GREEN behavior passes on comparable representative tasks;
- applicable pressure, edge, counterexample, or retrieval cases pass;
- relevant regressions pass after the last substantive change;
- no required case remains AMBER, FAIL, or NHR.

See `evaluation-schema.md` for the required case record and result rules.
